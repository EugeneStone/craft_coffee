'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiJson, formatDate, formatPhone } from '@/lib/admin';

type Interest = 'subscription' | 'order' | 'question';
type LeadStatus = 'new' | 'done';

type Lead = {
  id: string;
  name: string;
  phone: string;
  interest: Interest;
  comment: string | null;
  status: LeadStatus;
  source: 'instagram' | 'yandex' | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  page_url: string | null;
  created_at: string;
};

const INTEREST_META: Record<Interest, { label: string; badge: string }> = {
  subscription: { label: 'Подписка', badge: 'bg-caramel-100 text-espresso-900' },
  order: { label: 'Заказ', badge: 'bg-cream-200 text-espresso-800' },
  question: { label: 'Вопрос', badge: 'bg-espresso-100 text-cream-50' },
};

const SOURCE_META: Record<'instagram' | 'yandex', { label: string; badge: string }> = {
  instagram: { label: 'Instagram', badge: 'border border-caramel-400 bg-caramel-100/60 text-espresso-900' },
  yandex: { label: 'Яндекс', badge: 'border border-terra-300 bg-terra-50 text-terra-700' },
};

const INTEREST_FILTERS: { value: Interest | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'subscription', label: 'Подписка' },
  { value: 'order', label: 'Заказ' },
  { value: 'question', label: 'Вопрос' },
];

export default function AdminLeadsPage() {
  const [status, setStatus] = useState<LeadStatus>('new');
  const [interest, setInterest] = useState<Interest | 'all'>('all');
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const params = new URLSearchParams({ status });
      if (interest !== 'all') params.set('interest', interest);
      const data = await apiJson<{ leads: Lead[] }>(`/api/admin/leads?${params}`);
      setLeads(data.leads);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить заявки.');
      setLeads([]);
    }
  }, [status, interest]);

  useEffect(() => {
    setLeads(null);
    void load();
  }, [load]);

  async function patchStatus(lead: Lead, next: LeadStatus) {
    setBusyId(lead.id);
    try {
      await apiJson(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не получилось сохранить.');
    } finally {
      setBusyId(null);
    }
  }

  async function makeSubscription(lead: Lead) {
    setBusyId(lead.id);
    try {
      await apiJson('/api/admin/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ lead_id: lead.id }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Подписка не оформилась.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-espresso-950">
          Заявки
        </h1>
        <div
          role="group"
          aria-label="Статус заявки"
          className="flex rounded-full border border-cream-300 bg-white p-1"
        >
          {(
            [
              { value: 'new', label: 'Новые' },
              { value: 'done', label: 'Выполненные' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              aria-pressed={status === tab.value}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                status === tab.value
                  ? 'bg-espresso-900 text-cream-50'
                  : 'text-espresso-700 hover:bg-cream-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {INTEREST_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setInterest(f.value)}
            aria-pressed={interest === f.value}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              interest === f.value
                ? 'border-espresso-900 bg-espresso-900 text-cream-50'
                : 'border-cream-300 bg-white text-espresso-700 hover:border-espresso-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-terra-200 bg-terra-50 p-4 text-sm text-terra-700">
          {error}
        </p>
      )}

      {leads === null ? (
        <p className="mt-8 animate-pulse text-espresso-500">Загружаем…</p>
      ) : leads.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-cream-300 bg-white/60 p-8 text-center text-espresso-500">
          {status === 'new'
            ? 'Новых заявок нет. Как появятся — увидите здесь.'
            : 'Выполненных заявок пока нет.'}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {leads.map((lead) => (
            <li key={lead.id}>
              <article className="rounded-2xl border border-cream-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${INTEREST_META[lead.interest].badge}`}
                      >
                        {INTEREST_META[lead.interest].label}
                      </span>
                      {lead.source && (
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${SOURCE_META[lead.source].badge}`}
                        >
                          {SOURCE_META[lead.source].label}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-1.5 text-lg font-semibold text-espresso-950">
                      {lead.name}
                    </h2>
                    <a
                      href={`tel:${lead.phone}`}
                      className="mt-0.5 inline-block font-medium text-espresso-700 underline-offset-4 hover:underline"
                    >
                      {formatPhone(lead.phone)}
                    </a>
                  </div>
                  <time
                    dateTime={lead.created_at}
                    className="text-sm text-espresso-500"
                  >
                    {formatDate(lead.created_at)}
                  </time>
                </div>

                {lead.comment && (
                  <p className="mt-3 rounded-xl bg-cream-50 px-4 py-3 text-sm leading-relaxed text-espresso-800">
                    {lead.comment}
                  </p>
                )}

                <UtmLine lead={lead} />

                <div className="mt-4 flex flex-wrap gap-2">
                  {lead.status === 'new' ? (
                    <button
                      type="button"
                      disabled={busyId === lead.id}
                      onClick={() => void patchStatus(lead, 'done')}
                      className="rounded-full bg-espresso-900 px-4 py-2 text-sm font-semibold text-cream-50 transition-colors hover:bg-espresso-800 disabled:opacity-60"
                    >
                      Выполнено
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === lead.id}
                      onClick={() => void patchStatus(lead, 'new')}
                      className="rounded-full border border-espresso-800 px-4 py-2 text-sm font-semibold text-espresso-900 transition-colors hover:bg-cream-100 disabled:opacity-60"
                    >
                      Вернуть в новые
                    </button>
                  )}
                  {lead.interest === 'subscription' && (
                    <button
                      type="button"
                      disabled={busyId === lead.id}
                      onClick={() => void makeSubscription(lead)}
                      className="rounded-full border border-caramel-500 px-4 py-2 text-sm font-semibold text-espresso-900 transition-colors hover:bg-caramel-100 disabled:opacity-60"
                    >
                      Оформить подписку
                    </button>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UtmLine({ lead }: { lead: Lead }) {
  // источник уже показан плашкой — в метках он только дублировал бы её
  const utm = [
    lead.utm_medium && `medium: ${lead.utm_medium}`,
    lead.utm_campaign && `campaign: ${lead.utm_campaign}`,
    lead.utm_content && `content: ${lead.utm_content}`,
    lead.utm_term && `term: ${lead.utm_term}`,
    lead.referrer && `referrer: ${lead.referrer}`,
  ]
    .filter(Boolean)
    .join(' · ');
  if (!utm) return null;
  return (
    <p className="mt-3 text-xs leading-relaxed text-espresso-400">{utm}</p>
  );
}
