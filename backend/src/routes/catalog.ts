import { Router } from 'express';
import { pool } from '../db.js';

export const catalogRouter = Router();

// Публичные данные для лендинга: каталог зёрен и условия подписки.
// Настройки отдаём по белому списку ключей, а не всё подряд.

catalogRouter.get('/products', async (_req, res) => {
  const rows = await pool.query(
    `SELECT name, roast, notes, hint, weight, price
     FROM products
     WHERE is_active
     ORDER BY created_at`,
  );
  res.json({ ok: true, products: rows.rows });
});

const PUBLIC_KEYS = ['sub_title', 'sub_description', 'sub_price'];

catalogRouter.get('/settings', async (_req, res) => {
  const rows = await pool.query<{ key: string; value: string }>(
    'SELECT key, value FROM settings WHERE key = ANY($1)',
    [PUBLIC_KEYS],
  );
  const settings: Record<string, string> = {};
  for (const row of rows.rows) settings[row.key] = row.value;
  res.json({ ok: true, settings });
});
