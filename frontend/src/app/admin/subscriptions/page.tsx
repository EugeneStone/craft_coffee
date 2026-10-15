'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { apiJson, formatDay, formatPhone } from '@/lib/admin';

type SubStatus = 'active' | 'paused' | 'cancelled';

type Subscription = {
  id: string;
  lead_id: string | null;
  name: string;
  phone: string;
  coffee: string | null;
  status: SubStatus;
  started_at: string;
  created_at: string;
};

const STATUS_META: Record<SubStatus, { label: string; badge: string }> = {
  active: { label: 'Действует', badge: 'bg-caramel-100 text-espresso-900' },
  paused: { label: 'Пауза', badge: 'bg-cream-200 text-espresso-700' },
  cancelled: { label: 'Отменена', badge: 'bg-terra-100 text-terra-700' },
};

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiJson<{ subscriptions: Subscription[] }>(
        '/api/admin/subscriptions',
      );
      setSubs(data.subscriptions);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить подписки.');
      setSubs([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(sub: Subscription, status: SubStatus) {
    setBusyId(sub.id);
    setError('');
    try {
      await apiJson(`/api/admin/subscriptions/${sub.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не получилось сохранить.');
    } finally {
      setBusyId(null);
    }
  }

  const groups: { title: string; items: Subscription[] }[] = [
    { title: 'Действующие', items: [] },
    { title: 'На паузе', items: [] },
    { title: 'Отменённые', items: [] },
  ];
  for (const sub of subs ?? []) {
    if (sub.status === 'active') groups[0].items.push(sub);
    else if (sub.status === 'paused') groups[1].items.push(sub);
    else groups[2].items.push(sub);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-espresso-950">
          Подписки
        </h1>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          aria-expanded={formOpen}
          className="rounded-full border border-espresso-800 px-4 py-2 text-sm font-semibold text-espresso-900 transition-colors hover:bg-cream-100"
        >
          {formOpen ? 'Скрыть форму' : 'Добавить вручную'}
        </button>
      </div>

      {formOpen && (
        <ManualForm
          onCreated={() => {
            setFormOpen(false);
            void load();
          }}
        />
      )}

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-terra-200 bg-terra-50 p-4 text-sm text-terra-700">
          {error}
        </p>
      )}

      {subs === null ? (
        <p className="mt-8 animate-pulse text-espresso-500">Загружаем…</p>
      ) : subs.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-cream-300 bg-white/60 p-8 text-center text-espresso-500">
          Подписок пока нет. Оформите из заявки или добавьте вручную.
        </p>
      ) : (
        groups.map(
          (group) =>
            group.items.length > 0 && (
              <section key={group.title} className="mt-8">
                <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-espresso-500">
                  {group.title} · {group.items.length}
                </h2>
                <ul className="mt-3 space-y-3">
                  {group.items.map((sub) => (
                    <li key={sub.id}>
                      <article className="rounded-2xl border border-cream-200 bg-white p-5">
                        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                          <div>
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_META[sub.status].badge}`}
                            >
                              {STATUS_META[sub.status].label}
                            </span>
                            <h3 className="mt-1.5 text-lg font-semibold text-espresso-950">
                              {sub.name}
                            </h3>
                            <a
                              href={`tel:${sub.phone}`}
                              className="mt-0.5 inline-block font-medium text-espresso-700 underline-offset-4 hover:underline"
                            >
                              {formatPhone(sub.phone)}
                            </a>
                          </div>
                          <p className="text-sm text-espresso-500">
                            с {formatDay(sub.started_at)}
                          </p>
                        </div>

                        {sub.coffee && (
                          <p className="mt-3 rounded-xl bg-cream-50 px-4 py-3 text-sm leading-relaxed text-espresso-800">
                            {sub.coffee}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          {sub.status !== 'active' && (
                            <button
                              type="button"
                              disabled={busyId === sub.id}
                              onClick={() => void changeStatus(sub, 'active')}
                              className="rounded-full bg-espresso-900 px-4 py-2 text-sm font-semibold text-cream-50 transition-colors hover:bg-espresso-800 disabled:opacity-60"
                            >
                              Возобновить
                            </button>
                          )}
                          {sub.status === 'active' && (
                            <button
                              type="button"
                              disabled={busyId === sub.id}
                              onClick={() => void changeStatus(sub, 'paused')}
                              className="rounded-full border border-espresso-800 px-4 py-2 text-sm font-semibold text-espresso-900 transition-colors hover:bg-cream-100 disabled:opacity-60"
                            >
                              Пауза
                            </button>
                          )}
                          {sub.status !== 'cancelled' && (
                            <button
                              type="button"
                              disabled={busyId === sub.id}
                              onClick={() => void changeStatus(sub, 'cancelled')}
                              className="rounded-full border border-terra-300 px-4 py-2 text-sm font-semibold text-terra-600 transition-colors hover:bg-terra-50 disabled:opacity-60"
                            >
                              Отменить
                            </button>
                          )}
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              </section>
            ),
        )
      )}
    </div>
  );
}

function ManualForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [coffee, setCoffee] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await apiJson('/api/admin/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          coffee: coffee.trim() || undefined,
        }),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не получилось добавить.');
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mt-5 rounded-2xl border border-cream-200 bg-white p-5"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="sub-name" className="text-sm font-semibold">
            Имя
          </label>
          <input
            id="sub-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-cream-300 bg-cream-50/50 px-4 py-2.5 focus:border-caramel-500"
          />
        </div>
        <div>
          <label htmlFor="sub-phone" className="text-sm font-semibold">
            Телефон
          </label>
          <input
            id="sub-phone"
            type="tel"
            required
            placeholder="+375 29 123-45-67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-cream-300 bg-cream-50/50 px-4 py-2.5 focus:border-caramel-500"
          />
        </div>
        <div>
          <label htmlFor="sub-coffee" className="text-sm font-semibold">
            Предпочтения
          </label>
          <input
            id="sub-coffee"
            type="text"
            placeholder="например, фильтр, без кислинки"
            value={coffee}
            onChange={(e) => setCoffee(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-cream-300 bg-cream-50/50 px-4 py-2.5 focus:border-caramel-500"
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-terra-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="mt-4 rounded-full bg-espresso-900 px-5 py-2.5 text-sm font-semibold text-cream-50 transition-colors hover:bg-espresso-800 disabled:opacity-60"
      >
        {busy ? 'Добавляем…' : 'Добавить подписку'}
      </button>
    </form>
  );
}
