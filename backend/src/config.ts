import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 4001),
  databaseUrl:
    process.env.DATABASE_URL || 'postgres://kvarta:kvarta@localhost:5433/kvarta',
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
  },
};
