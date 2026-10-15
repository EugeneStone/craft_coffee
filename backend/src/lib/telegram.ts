import { config } from '../config.js';
import { pool } from '../db.js';

export type TelegramResult = { ok: boolean; error?: string };

// Bot API отвечает по-английски — на частые отказы даём понятную подсказку
function humanizeTelegramError(description: string): string {
  if (/chat not found/i.test(description)) {
    return 'Telegram не знает такой чат. Проверьте @никнейм (для открытых каналов и групп он начинается с @).';
  }
  if (/not enough rights|not a member|administrator/i.test(description)) {
    return 'Бот не в этом чате — добавьте его участником, а для канала ещё и администратором.';
  }
  if (/blocked/i.test(description)) {
    return 'Получатель заблокировал бота — снимите блокировку и попробуйте снова.';
  }
  return description;
}

// Куда присылать заявки: адрес сохраняется в админке (@никнейм канала или id
// чата), TELEGRAM_CHAT_ID из env — запасной вариант для старых установок.
async function telegramTarget(): Promise<string> {
  try {
    const row = await pool.query<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'telegram_chat'",
    );
    const saved = row.rows[0]?.value.trim();
    if (saved) return saved;
  } catch (e) {
    console.error(
      '[telegram] не смогли прочитать настройку:',
      e instanceof Error ? e.message : e,
    );
  }
  return config.telegram.chatId;
}

// Отдельно от relay: возвращает причину ошибки, чтобы показать её в админке
// на кнопке «Отправить тест».
export async function sendTelegramMessage(text: string): Promise<TelegramResult> {
  const { botToken } = config.telegram;
  if (!botToken) {
    return {
      ok: false,
      error:
        'Токен бота не задан: добавьте TELEGRAM_BOT_TOKEN в backend/.env и перезапустите API.',
    };
  }
  const chatId = await telegramTarget();
  if (!chatId) {
    return { ok: false, error: 'Не указано, куда присылать заявки — заполните поле в настройках.' };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const data = (await res.json().catch(() => null)) as
      | { ok?: boolean; description?: string }
      | null;
    if (!res.ok || !data?.ok) {
      return {
        ok: false,
        error: data?.description
          ? humanizeTelegramError(data.description)
          : `Telegram ответил кодом ${res.status}.`,
      };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Сеть недоступна.' };
  }
}

// Дублируем заявку в Telegram. Отправка не должна ломать приём заявки,
// поэтому ненастроенный релей молчит, а ошибки отправки просто пишем в лог.
export function relayToTelegram(text: string): void {
  if (!config.telegram.botToken) return;
  void sendTelegramMessage(text).then((result) => {
    if (!result.ok) console.error('[telegram] не отправилось:', result.error);
  });
}
