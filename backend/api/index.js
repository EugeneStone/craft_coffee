// Вход для serverless-функции Vercel: тот же Express-апп, но без listen.
import { createApp } from '../dist/app.js';
import { initDb } from '../dist/db.js';

const app = createApp();
let ready = null;

export default async function handler(req, res) {
  try {
    if (!ready) ready = initDb();
    await ready;
  } catch (e) {
    console.error('[api] база не поднялась:', e);
    res.status(500).json({
      ok: false,
      error: 'server',
      message: 'База данных недоступна, попробуйте ещё раз чуть позже.',
    });
    return;
  }
  app(req, res);
}
