'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiJson } from '@/lib/admin';

type Settings = {
  sub_title: string;
  sub_description: string;
  sub_price: string;
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Settings>({
    sub_title: '',
    sub_description: '',
    sub_price: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiJson<{ settings: Partial<Settings> }>('/api/admin/settings')
      .then((data) =>
        setForm({
          sub_title: data.settings.sub_title ?? '',
          sub_description: data.settings.sub_description ?? '',
          sub_price: data.settings.sub_price ?? '',
        }),
      )
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'Не удалось загрузить.'),
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

  const inputCls =
    'mt-1.5 w-full rounded-xl border border-cream-300 bg-cream-50/50 px-4 py-2.5 focus:border-caramel-500';

  if (loading) {
    return <p className="animate-pulse text-espresso-500">Загружаем…</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-espresso-950">
        Условия подписки
      </h1>
      <p className="mt-1.5 text-sm text-espresso-500">
        Тёмная карточка подписки в каталоге на главной.
      </p>

      <form onSubmit={submit} className="mt-6 rounded-2xl border border-cream-200 bg-white p-6">
        <div>
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
    </div>
  );
}
