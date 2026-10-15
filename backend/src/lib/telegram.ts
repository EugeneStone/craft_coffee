import { config } from '../config.js';

// Дублируем заявку в Telegram, если настроены TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.
// Отправка не должна ломать приём заявки, поэтому ошибки просто пишем в лог.
export function relayToTelegram(text: string): void {
  const { botToken, chatId } = config.telegram;
  if (!botToken || !chatId) return;

  fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch((e: unknown) => {
    console.error('[telegram] не отправилось:', e instanceof Error ? e.message : e);
  });
}
