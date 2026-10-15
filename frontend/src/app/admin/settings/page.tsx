'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiJson } from '@/lib/admin';

type Settings = {
  sub_title: string;
  sub_description: string;
  sub_price: string;
};

const CHAT_ID_RE = /^-?\d{5,}$/;

function chatError(value: string): string {
  if (value && !CHAT_ID_RE.test(value)) {
    return 'id — это число, например 123456789.';
  }
  return '';
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // условия подписки
  const [form, setForm] = useState<Settings>({
    sub_title: '',
    sub_description: '',
    sub_price: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  // telegram
  const [chat, setChat] = useState('');
  const [tokenConfigured, setTokenConfigured] = useState(true);
  const [botUsername, setBotUsername] = useState('');
  const [tgError, setTgError] = useState('');
  const [tgFieldError, setTgFieldError] = useState('');
  const [tgNotice, setTgNotice] = useState('');
  const [tgBusy, setTgBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      apiJson<{ settings: Partial<Settings> }>('/api/admin/settings'),
      apiJson<{ chat: string; tokenConfigured: boolean; botUsername: string | null }>(
        '/api/admin/telegram',
      ),
    ])
      .then(([sub, tg]) => {
        setForm({
          sub_title: sub.settings.sub_title ?? '',
          sub_description: sub.settings.sub_description ?? '',
          sub_price: sub.settings.sub_price ?? '',
        });
        setChat(tg.chat);
        setTokenConfigured(tg.tokenConfigured);
        setBotUsername(tg.botUsername ?? '');
      })
      .catch((e) =>
        setLoadError(e instanceof Error ? e.message : 'Не удалось загрузить.'),
      )
      .finally(() => setLoading(false));
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setNotice('');
    const errors: Record<string, string> = {};
    if (form.sub_title.trim().length < 2) errors.sub_title = 'Заголовок блока.';
    if (form.sub_description.trim().length < 2)
      errors.sub_description = 'Описание блока.';
    if (!/^\d{1,6}$/.test(form.sub_price.trim()))
      errors.sub_price = 'Цена — целое число.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    try {
      await apiJson('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          sub_title: form.sub_title.trim(),
          sub_description: form.sub_description.trim(),
          sub_price: form.sub_price.trim(),
        }),
      });
      setNotice('Сохранили. На сайте обновится при следующей загрузке страницы.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не получилось сохранить.');
    } finally {
      setBusy(false);
    }
  }

  async function saveTelegram(target: string): Promise<boolean> {
    try {
      await apiJson('/api/admin/telegram', {
        method: 'PUT',
        body: JSON.stringify({ chat: target }),
      });
      return true;
    } catch (err) {
      setTgError(err instanceof Error ? err.message : 'Не получилось сохранить.');
      return false;
    }
  }

  async function submitTelegram(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTgError('');
    setTgNotice('');
    const invalid = chatError(chat.trim());
    setTgFieldError(invalid);
    if (invalid) return;

    setTgBusy(true);
    const saved = await saveTelegram(chat.trim());
    if (saved) {
      setTgNotice(
        chat.trim()
          ? 'Сохранили. Новые заявки будут приходить вам в Telegram.'
          : 'Сохранили. Уведомления выключены — заявки остаются только в админке.',
      );
    }
    setTgBusy(false);
  }

  async function runTest() {
    setTgError('');
    setTgNotice('');
    const target = chat.trim();
    const invalid = chatError(target);
    setTgFieldError(invalid);
    if (invalid) return;

    setTestBusy(true);
    // тест должен уйти туда, что сейчас в поле — сначала сохраняем его
    const saved = await saveTelegram(target);
    if (!saved) {
      setTestBusy(false);
      return;
    }
    try {
      await apiJson('/api/admin/telegram/test', { method: 'POST' });
      setTgNotice('Тестовое сообщение ушло — проверьте чат в Telegram.');
    } catch (err) {
      setTgError(err instanceof Error ? err.message : 'Не получилось отправить.');
    } finally {
      setTestBusy(false);
    }
  }

  const inputCls =
    'mt-1.5 w-full rounded-xl border border-cream-300 bg-cream-50/50 px-4 py-2.5 focus:border-caramel-500';

  if (loading) {
    return <p className="animate-pulse text-espresso-500">Загружаем…</p>;
  }

  if (loadError) {
    return (
      <p role="alert" className="text-sm text-terra-600">
        {loadError}
      </p>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-espresso-950">
        Настройки
      </h1>
      <p className="mt-1.5 text-sm text-espresso-500">
        Условия подписки и дублирование заявок в Telegram.
      </p>

      <form onSubmit={submit} className="mt-6 rounded-2xl border border-cream-200 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-espresso-950">
          Условия подписки
        </h2>
        <p className="mt-1 text-sm text-espresso-500">
          Тёмная карточка подписки в каталоге на главной.
        </p>

        <div className="mt-5">
          <label htmlFor="s-title" className="text-sm font-semibold">
            Заголовок
          </label>
          <input
            id="s-title"
            type="text"
            value={form.sub_title}
            onChange={(e) => setForm((f) => ({ ...f, sub_title: e.target.value }))}
            className={inputCls}
          />
          {fieldErrors.sub_title && (
            <p className="mt-1 text-sm text-terra-600">{fieldErrors.sub_title}</p>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor="s-desc" className="text-sm font-semibold">
            Описание
          </label>
          <textarea
            id="s-desc"
            rows={4}
            value={form.sub_description}
            onChange={(e) =>
              setForm((f) => ({ ...f, sub_description: e.target.value }))
            }
            className={`${inputCls} resize-y`}
          />
          {fieldErrors.sub_description && (
            <p className="mt-1 text-sm text-terra-600">
              {fieldErrors.sub_description}
            </p>
          )}
        </div>

        <div className="mt-4 max-w-48">
          <label htmlFor="s-price" className="text-sm font-semibold">
            Цена, BYN/мес
          </label>
          <input
            id="s-price"
            type="number"
            inputMode="numeric"
            min={0}
            value={form.sub_price}
            onChange={(e) => setForm((f) => ({ ...f, sub_price: e.target.value }))}
            className={inputCls}
          />
          {fieldErrors.sub_price && (
            <p className="mt-1 text-sm text-terra-600">{fieldErrors.sub_price}</p>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-terra-600">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-4 text-sm text-espresso-700">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 rounded-full bg-espresso-900 px-5 py-2.5 text-sm font-semibold text-cream-50 transition-colors hover:bg-espresso-800 disabled:opacity-60"
        >
          {busy ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </form>

      <form
        onSubmit={submitTelegram}
        className="mt-6 rounded-2xl border border-cream-200 bg-white p-6"
      >
        <h2 className="font-display text-lg font-semibold text-espresso-950">
          Telegram-уведомления
        </h2>
        <p className="mt-1 text-sm text-espresso-500">
          Каждая новая заявка с сайта дублируется в Telegram, чтобы её точно не
          пропустили. Укажите свой id — бот напишет вам в личку.
        </p>

        {!tokenConfigured && (
          <p className="mt-4 rounded-xl bg-caramel-100 px-4 py-3 text-sm text-espresso-800">
            Токен бота ещё не задан: добавьте <code>TELEGRAM_BOT_TOKEN</code> в{' '}
            <code>backend/.env</code> и перезапустите API — без него сообщения
            не уходят.
          </p>
        )}

        <div className="mt-4 rounded-xl bg-cream-100 px-4 py-3 text-sm text-espresso-800">
          <p className="font-semibold">Как настроить и проверить</p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-5">
            <li>
              Откройте бота{' '}
              {botUsername ? (
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline underline-offset-2"
                >
                  @{botUsername}
                </a>
              ) : (
                'в Telegram'
              )}{' '}
              и отправьте ему <code>/start</code> — первым бот писать не умеет.
            </li>
            <li>
              Свой id узнайте у{' '}
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-2"
              >
                @userinfobot
              </a>{' '}
              — он ответит числом.
            </li>
            <li>
              Впишите число, нажмите «Сохранить», затем «Отправить тест» — в
              Telegram придёт проверочное сообщение.
            </li>
          </ol>
        </div>

        <div className="mt-5">
          <label htmlFor="tg-chat" className="text-sm font-semibold">
            Ваш id в Telegram
          </label>
          <input
            id="tg-chat"
            type="text"
            inputMode="numeric"
            value={chat}
            placeholder="123456789"
            onChange={(e) => setChat(e.target.value)}
            className={inputCls}
          />
          <p className="mt-1.5 text-xs text-espresso-500">
            Пусто — заявки остаются только в админке.
          </p>
          {tgFieldError && (
            <p className="mt-1 text-sm text-terra-600">{tgFieldError}</p>
          )}
        </div>

        {tgError && (
          <p role="alert" className="mt-4 text-sm text-terra-600">
            {tgError}
          </p>
        )}
        {tgNotice && (
          <p role="status" className="mt-4 text-sm text-espresso-700">
            {tgNotice}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={tgBusy || testBusy}
            className="rounded-full bg-espresso-900 px-5 py-2.5 text-sm font-semibold text-cream-50 transition-colors hover:bg-espresso-800 disabled:opacity-60"
          >
            {tgBusy ? 'Сохраняем…' : 'Сохранить'}
          </button>
          <button
            type="button"
            onClick={() => void runTest()}
            disabled={testBusy || tgBusy || !tokenConfigured || chat.trim() === ''}
            className="rounded-full border border-espresso-900 px-5 py-2.5 text-sm font-semibold text-espresso-900 transition-colors hover:bg-espresso-900 hover:text-cream-50 disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-espresso-900"
          >
            {testBusy ? 'Отправляем…' : 'Отправить тест'}
          </button>
        </div>
      </form>
    </div>
  );
}
