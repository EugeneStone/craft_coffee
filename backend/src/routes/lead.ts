import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { pool } from '../db.js';
import { normalizePhone } from '../lib/phone.js';
import { relayToTelegram } from '../lib/telegram.js';
import { detectSource, SOURCE_LABELS } from '../lib/source.js';

export const leadRouter = Router();

// Заявки идут с рекламы — режем только явный спам с одного IP.
const leadLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: 'too_many_requests',
    message: 'Слишком много попыток подряд. Подождите минуту и попробуйте снова.',
  },
});

const utmField = z.string().trim().max(200).optional();

const bodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(30),
  interest: z.enum(['subscription', 'order', 'question']),
  comment: z.string().trim().max(1000).optional(),
  utm_source: utmField,
  utm_medium: utmField,
  utm_campaign: utmField,
  utm_content: utmField,
  utm_term: utmField,
  referrer: z.string().trim().max(500).optional(),
  page_url: z.string().trim().max(500).optional(),
});

const FIELD_MESSAGES: Record<string, string> = {
  name: 'Напишите, как к вам обращаться (2–80 знаков).',
  phone: 'Номер указан неверно.',
  interest: 'Выберите, что вас интересует.',
  comment: 'Комментарий слишком длинный — до 1000 знаков.',
};

const INTEREST_LABELS: Record<string, string> = {
  subscription: 'подписка',
  order: 'разовый заказ',
  question: 'вопрос',
};

// Дедупликация: один и тот же телефон не больше одной заявки за 10 минут,
// включая двойное нажатие кнопки. Advisory lock не даёт двум параллельным
// запросам проскочить проверку одновременно.
async function findRecentLeadId(phone: string, client: import('pg').PoolClient) {
  const dup = await client.query(
    `SELECT id FROM leads
     WHERE phone = $1 AND created_at > now() - interval '10 minutes'
     LIMIT 1`,
    [phone],
  );
  return dup.rows[0]?.id as string | undefined;
}

leadRouter.post('/lead', leadLimiter, async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      if (!fields[key]) {
        fields[key] =
          FIELD_MESSAGES[key] ||
          (key === 'form' ? 'Что-то не так с данными формы.' : 'Проверьте поле.');
      }
    }
    return res.status(400).json({ ok: false, error: 'validation', fields });
  }

  const data = parsed.data;
  const phone = normalizePhone(data.phone);
  if (!phone) {
    return res.status(400).json({
      ok: false,
      error: 'validation',
      fields: {
        phone: 'Номер указан неверно.',
      },
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [phone]);

    const recentId = await findRecentLeadId(phone, client);
    if (recentId) {
      await client.query('COMMIT');
      return res.status(200).json({
        ok: true,
        duplicate: true,
        id: recentId,
        message: 'Эта заявка у нас уже есть — не дублируем. Перезвоним в течение дня.',
      });
    }

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO leads
        (name, phone, interest, comment, source,
         utm_source, utm_medium, utm_campaign, utm_content, utm_term,
         referrer, page_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        data.name,
        phone,
        data.interest,
        data.comment || null,
        detectSource(data),
        data.utm_source || null,
        data.utm_medium || null,
        data.utm_campaign || null,
        data.utm_content || null,
        data.utm_term || null,
        data.referrer || null,
        data.page_url || null,
      ],
    );
    await client.query('COMMIT');

    const utm = [
      data.utm_source,
      data.utm_medium,
      data.utm_campaign,
      data.utm_content,
      data.utm_term,
    ]
      .filter(Boolean)
      .join(' / ');

    const source = detectSource(data);

    relayToTelegram(
      [
        '☕ Новая заявка — «Кварта»',
        `Имя: ${data.name}`,
        `Телефон: ${phone}`,
        `Интерес: ${INTEREST_LABELS[data.interest]}`,
        source ? `Источник: ${SOURCE_LABELS[source]}` : null,
        data.comment ? `Комментарий: ${data.comment}` : null,
        utm ? `Метка: ${utm}` : null,
        data.page_url ? `Страница: ${data.page_url}` : null,
        data.referrer ? `Откуда пришёл: ${data.referrer}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    );

    return res.status(201).json({ ok: true, id: inserted.rows[0].id });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[lead] ошибка сохранения:', e);
    return res.status(500).json({
      ok: false,
      error: 'server',
      message:
        'Заявка не сохранилась — что-то сломалось на нашей стороне. Позвоните нам или попробуйте ещё раз чуть позже.',
    });
  } finally {
    client.release();
  }
});
