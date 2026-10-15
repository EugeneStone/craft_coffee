import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 4001),
  databaseUrl:
    process.env.DATABASE_URL || 'postgres://kvarta:kvarta@localhost:5433/kvarta',
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    // запасной адрес, если в админке поле «куда присылать» пустое
    chatId: process.env.TELEGRAM_CHAT_ID || '',
  },
  admin: {
    // для тестового запуска подойдёт дефолт; в проде задаём ADMIN_JWT_SECRET
    jwtSecret: process.env.ADMIN_JWT_SECRET || 'kvarta-local-admin-secret',
    cookieName: 'kvarta_admin',
    tokenTtlSeconds: 7 * 24 * 60 * 60,
  },
  isProd: process.env.NODE_ENV === 'production',
};
