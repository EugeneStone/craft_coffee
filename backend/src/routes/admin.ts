import bcrypt from 'bcryptjs';
import { Router } from 'express';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../config.js';
import { pool } from '../db.js';
import {
  clearAdminCookie,
  requireAdmin,
  setAdminCookie,
  signAdminToken,
} from '../lib/auth.js';
import { normalizePhone } from '../lib/phone.js';
import { sendTelegramMessage } from '../lib/telegram.js';

export const adminRouter = Router();

// async-хендлеры в Express 4 сами не доходят до error-middleware — оборачиваем
const wrap =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

/* ---------------- вход и выход ---------------- */

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: 'too_many_requests',
    message: 'Слишком много попыток входа. Подождите 15 минут.',
  },
});

const loginSchema = z.object({
  login: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(200),
});

adminRouter.post(
  '/login',
  loginLimiter,
  wrap(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: 'validation',
        message: 'Введите логин и пароль.',
      });
    }

    const { login, password } = parsed.data;
    const found = await pool.query<{ password_hash: string }>(
      'SELECT password_hash FROM admin_users WHERE login = $1',
      [login],
    );
    const user = found.rows[0];
    // одинаковый ответ и задержка, чтобы не раскрывать, есть ли такой логин
    const valid =
      user && bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      await new Promise((r) => setTimeout(r, 300));
      return res.status(401).json({
        ok: false,
        error: 'unauthorized',
        message: 'Логин или пароль неверные.',
      });
    }

    setAdminCookie(res, signAdminToken(login));
    return res.json({ ok: true, login });
  }),
);

adminRouter.post('/logout', (_req, res) => {
  clearAdminCookie(res);
  res.json({ ok: true });
});

adminRouter.get('/me', requireAdmin, (_req, res) => {
  res.json({ ok: true, login: res.locals.adminLogin ?? null });
});

/* ---------------- заявки ---------------- */

adminRouter.get(
  '/leads',
  requireAdmin,
  wrap(async (req, res) => {
    const status = ['new', 'done'].includes(String(req.query.status))
      ? String(req.query.status)
      : null;
    const interest = ['subscription', 'order', 'question'].includes(
      String(req.query.interest),
    )
      ? String(req.query.interest)
      : null;
    const PAGE_SIZE = 20;
    const pageRaw = Number(req.query.page);
    const page =
      Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

    const where: string[] = [];
    const params: unknown[] = [];
    if (status) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    if (interest) {
      params.push(interest);
      where.push(`interest = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRes = await pool.query<{ total: number }>(
      `SELECT count(*)::int AS total FROM leads ${whereSql}`,
      params,
    );
    const total = totalRes.rows[0].total;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, pages);

    const rows = await pool.query(
      `SELECT id, name, phone, interest, comment, status, source,
              utm_source, utm_medium, utm_campaign, utm_content, utm_term,
              referrer, page_url, created_at
       FROM leads
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT ${PAGE_SIZE} OFFSET $${params.length + 1}`,
      [...params, (safePage - 1) * PAGE_SIZE],
    );
    res.json({ ok: true, leads: rows.rows, total, page: safePage, pages });
  }),
);

const leadPatchSchema = z.object({ status: z.enum(['new', 'done']) });

adminRouter.patch(
  '/leads/:id',
  requireAdmin,
  wrap(async (req, res) => {
    const parsed = leadPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ ok: false, error: 'validation', message: 'Неизвестный статус.' });
    }
    const updated = await pool.query(
      'UPDATE leads SET status = $1 WHERE id = $2',
      [parsed.data.status, req.params.id],
    );
    if (!updated.rowCount) {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }
    res.json({ ok: true });
  }),
);

/* ---------------- зерно ---------------- */

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  roast: z.string().trim().min(2).max(60),
  notes: z.string().trim().min(2).max(200),
  hint: z.string().trim().max(200).default(''),
  weight: z.string().trim().min(1).max(40).default('250 г'),
  price: z.number().int().min(0).max(100000),
  is_active: z.boolean().default(true),
});

adminRouter.get(
  '/products',
  requireAdmin,
  wrap(async (_req, res) => {
    const rows = await pool.query(
      `SELECT id, name, roast, notes, hint, weight, price, is_active
       FROM products ORDER BY created_at`,
    );
    res.json({ ok: true, products: rows.rows });
  }),
);

adminRouter.post(
  '/products',
  requireAdmin,
  wrap(async (req, res) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: 'validation',
        message: 'Проверьте поля сорта.',
      });
    }
    const p = parsed.data;
    try {
      const inserted = await pool.query<{ id: string }>(
        `INSERT INTO products (name, roast, notes, hint, weight, price, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [p.name, p.roast, p.notes, p.hint, p.weight, p.price, p.is_active],
      );
      res.status(201).json({ ok: true, id: inserted.rows[0].id });
    } catch (e) {
      if (isUniqueViolation(e)) {
        return res.status(409).json({
          ok: false,
          error: 'conflict',
          message: 'Сорт с таким названием уже есть.',
        });
      }
      throw e;
    }
  }),
);

const productPatchSchema = productSchema.partial();

adminRouter.patch(
  '/products/:id',
  requireAdmin,
  wrap(async (req, res) => {
    const parsed = productPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: 'validation',
        message: 'Проверьте поля сорта.',
      });
    }
    const p = parsed.data;
    const keys = Object.keys(p) as (keyof typeof p)[];
    if (keys.length === 0) {
      return res.json({ ok: true });
    }
    const setSql = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = keys.map((k) => p[k]);
    try {
      const updated = await pool.query(
        `UPDATE products SET ${setSql}, updated_at = now() WHERE id = $${keys.length + 1}`,
        [...values, req.params.id],
      );
      if (!updated.rowCount) {
        return res.status(404).json({ ok: false, error: 'not_found' });
      }
      res.json({ ok: true });
    } catch (e) {
      if (isUniqueViolation(e)) {
        return res.status(409).json({
          ok: false,
          error: 'conflict',
          message: 'Сорт с таким названием уже есть.',
        });
      }
      throw e;
    }
  }),
);

adminRouter.delete(
  '/products/:id',
  requireAdmin,
  wrap(async (req, res) => {
    const deleted = await pool.query('DELETE FROM products WHERE id = $1', [
      req.params.id,
    ]);
    if (!deleted.rowCount) {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }
    res.json({ ok: true });
  }),
);

/* ---------------- подписки ---------------- */

const subSchema = z
  .object({
    lead_id: z.string().uuid().optional(),
    name: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().min(7).max(30).optional(),
    coffee: z.string().trim().max(300).optional(),
  })
  .refine((d) => Boolean(d.lead_id) || Boolean(d.name && d.phone), {
    message: 'Нужна заявка или имя с телефоном.',
  });

adminRouter.get(
  '/subscriptions',
  requireAdmin,
  wrap(async (_req, res) => {
    const rows = await pool.query(
      `SELECT id, lead_id, name, phone, coffee, status, started_at, created_at
       FROM subscriptions
       ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'paused' THEN 1 ELSE 2 END,
                created_at DESC`,
    );
    res.json({ ok: true, subscriptions: rows.rows });
  }),
);

adminRouter.post(
  '/subscriptions',
  requireAdmin,
  wrap(async (req, res) => {
    const parsed = subSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: 'validation',
        message: parsed.error.issues[0]?.message || 'Проверьте данные подписки.',
      });
    }
    const d = parsed.data;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let name = d.name;
      let phone = d.phone ? normalizePhone(d.phone) : null;
      let coffee = d.coffee || '';

      if (d.lead_id) {
        const lead = await client.query<{
          name: string;
          phone: string;
          comment: string | null;
        }>('SELECT name, phone, comment FROM leads WHERE id = $1 FOR UPDATE', [
          d.lead_id,
        ]);
        if (!lead.rows[0]) {
          await client.query('ROLLBACK');
          return res.status(404).json({ ok: false, error: 'not_found' });
        }
        name = lead.rows[0].name;
        phone = lead.rows[0].phone;
        coffee = [d.coffee, lead.rows[0].comment].filter(Boolean).join('. ');
        await client.query(`UPDATE leads SET status = 'done' WHERE id = $1`, [
          d.lead_id,
        ]);
      }

      if (!name || !phone) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          ok: false,
          error: 'validation',
          message: 'Номер указан неверно.',
        });
      }

      const inserted = await client.query<{ id: string }>(
        `INSERT INTO subscriptions (lead_id, name, phone, coffee)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [d.lead_id || null, name, phone, coffee || null],
      );
      await client.query('COMMIT');
      res.status(201).json({ ok: true, id: inserted.rows[0].id });
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  }),
);

const subPatchSchema = z.object({
  status: z.enum(['active', 'paused', 'cancelled']),
});

adminRouter.patch(
  '/subscriptions/:id',
  requireAdmin,
  wrap(async (req, res) => {
    const parsed = subPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ ok: false, error: 'validation', message: 'Неизвестный статус.' });
    }
    const updated = await pool.query(
      'UPDATE subscriptions SET status = $1 WHERE id = $2',
      [parsed.data.status, req.params.id],
    );
    if (!updated.rowCount) {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }
    res.json({ ok: true });
  }),
);

/* ---------------- метрики заявок ---------------- */

type SourceBucket = 'instagram' | 'yandex' | 'none';
const BUCKETS: SourceBucket[] = ['instagram', 'yandex', 'none'];

function emptyBucket(): Record<SourceBucket, number> {
  return { instagram: 0, yandex: 0, none: 0 };
}

adminRouter.get(
  '/metrics',
  requireAdmin,
  wrap(async (req, res) => {
    const daysParam = String(req.query.days ?? '30');
    const all = daysParam === 'all';
    const days = all ? null : [7, 30].includes(Number(daysParam)) ? Number(daysParam) : 30;
    const where = days ? 'WHERE created_at > now() - make_interval(days => $1)' : '';
    const params = days ? [days] : [];

    const totalsRows = await pool.query<{ src: SourceBucket; n: number }>(
      `SELECT COALESCE(source, 'none') src, count(*)::int n
       FROM leads ${where} GROUP BY 1`,
      params,
    );
    const totals = emptyBucket();
    for (const row of totalsRows.rows) totals[row.src] = row.n;
    const total = BUCKETS.reduce((sum, b) => sum + totals[b], 0);

    const byDayRows = await pool.query<{
      day: string;
      src: SourceBucket;
      n: number;
    }>(
      `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
              COALESCE(source, 'none') AS src, count(*)::int AS n
       FROM leads ${where}
       GROUP BY 1, 2 ORDER BY 1`,
      params,
    );
    const byDayMap = new Map<string, Record<SourceBucket, number>>();
    for (const row of byDayRows.rows) {
      const bucket = byDayMap.get(row.day) ?? emptyBucket();
      bucket[row.src] = row.n;
      byDayMap.set(row.day, bucket);
    }

    // дни без заявок заполняем нулями, чтобы диаграмма была непрерывной;
    // за «всё время» показываем последние 90 дней, итоги считаем по всему периоду
    const today = new Date();
    const firstDay =
      byDayRows.rows[0]?.day ??
      today.toISOString().slice(0, 10);
    const start = days
      ? new Date(today)
      : new Date(`${firstDay}T00:00:00Z`);
    if (days) start.setUTCDate(start.getUTCDate() - (days - 1));
    const byDay: { day: string; instagram: number; yandex: number; none: number }[] = [];
    for (const d = start; d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      byDay.push({ day: key, ...(byDayMap.get(key) ?? emptyBucket()) });
    }

    res.json({
      ok: true,
      totals,
      total,
      byDay: byDay.slice(-90),
    });
  }),
);

/* ---------------- условия подписки ---------------- */

const SETTINGS_KEYS = ['sub_title', 'sub_description', 'sub_price'] as const;

const settingsSchema = z.object({
  sub_title: z.string().trim().min(2).max(120),
  sub_description: z.string().trim().min(2).max(1000),
  sub_price: z.string().trim().regex(/^\d{1,6}$/, 'Цена — целое число.'),
});

adminRouter.get(
  '/settings',
  requireAdmin,
  wrap(async (_req, res) => {
    const rows = await pool.query<{ key: string; value: string }>(
      'SELECT key, value FROM settings WHERE key = ANY($1)',
      [SETTINGS_KEYS],
    );
    const settings: Record<string, string> = {};
    for (const row of rows.rows) settings[row.key] = row.value;
    res.json({ ok: true, settings });
  }),
);

adminRouter.put(
  '/settings',
  requireAdmin,
  wrap(async (req, res) => {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!fields[key]) fields[key] = issue.message;
      }
      return res
        .status(400)
        .json({ ok: false, error: 'validation', fields });
    }
    for (const [key, value] of Object.entries(parsed.data)) {
      await pool.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        [key, value],
      );
    }
    res.json({ ok: true });
  }),
);

/* ---------------- уведомления в Telegram ---------------- */

const TELEGRAM_CHAT_KEY = 'telegram_chat';

// @никнейм открытого канала/группы, где бот добавлен администратором,
// либо числовой id чата (для личного чата никнейм не подходит — Bot API
// не умеет по нему писать). Пусто — уведомления выключены.
const telegramChatSchema = z.object({
  chat: z
    .string()
    .trim()
    .max(64)
    .refine(
      (v) => v === '' || /^@[A-Za-z0-9_]{5,32}$/.test(v) || /^-?\d{5,}$/.test(v),
      { message: 'Формат: @никнейм (5–32 символа: латиница, цифры, подчёркивание) или числовой id чата.' },
    ),
});

adminRouter.get(
  '/telegram',
  requireAdmin,
  wrap(async (_req, res) => {
    const row = await pool.query<{ value: string }>(
      'SELECT value FROM settings WHERE key = $1',
      [TELEGRAM_CHAT_KEY],
    );
    res.json({
      ok: true,
      chat: row.rows[0]?.value ?? '',
      tokenConfigured: Boolean(config.telegram.botToken),
    });
  }),
);

adminRouter.put(
  '/telegram',
  requireAdmin,
  wrap(async (req, res) => {
    const parsed = telegramChatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: 'validation',
        fields: { chat: parsed.error.issues[0]?.message ?? 'Проверьте адрес.' },
      });
    }
    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      [TELEGRAM_CHAT_KEY, parsed.data.chat],
    );
    res.json({ ok: true });
  }),
);

adminRouter.post(
  '/telegram/test',
  requireAdmin,
  wrap(async (_req, res) => {
    const result = await sendTelegramMessage(
      '☕ «Кварта» — проверка связи.\nСюда будут приходить уведомления о новых заявках.',
    );
    if (!result.ok) {
      return res
        .status(502)
        .json({ ok: false, error: 'telegram', message: result.error });
    }
    res.json({ ok: true });
  }),
);

/* ---------------- утилиты ---------------- */

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === 'object' && e !== null && (e as { code?: string }).code === '23505'
  );
}
