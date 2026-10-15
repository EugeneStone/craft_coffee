'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiJson } from '@/lib/admin';

type Bucket = 'instagram' | 'yandex' | 'none';

type Metrics = {
  totals: Record<Bucket, number>;
  total: number;
  byDay: { day: string; instagram: number; yandex: number; none: number }[];
};

type Period = '7' | '30' | 'all';

const SOURCES: {
  key: Bucket;
  label: string;
  card: string;
  bar: string;
  dot: string;
}[] = [
  {
    key: 'instagram',
    label: 'Instagram',
    card: 'border-caramel-300 bg-caramel-100/50',
    bar: 'bg-caramel-400',
    dot: 'bg-caramel-400',
  },
  {
    key: 'yandex',
    label: 'Яндекс',
    card: 'border-terra-300 bg-terra-50',
    bar: 'bg-terra-400',
    dot: 'bg-terra-400',
  },
  {
    key: 'none',
    label: 'Не по рекламе',
    card: 'border-cream-300 bg-white',
    bar: 'bg-espresso-300',
    dot: 'bg-espresso-300',
  },
];

const PERIODS: { value: Period; label: string }[] = [
  { value: '7', label: '7 дней' },
  { value: '30', label: '30 дней' },
  { value: 'all', label: 'Всё время' },
];

const dayFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
});

export default function AdminMetricsPage() {
  const [period, setPeriod] = useState<Period>('30');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await apiJson<Metrics>(`/api/admin/metrics?days=${period}`);
      setMetrics(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить метрики.');
    }
  }, [period]);

  useEffect(() => {
    setMetrics(null);
    void load();
  }, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-espresso-950">
          Метрики заявок
        </h1>
        <div
          role="group"
          aria-label="Период"
          className="flex rounded-full border border-cream-300 bg-white p-1"
        >
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              aria-pressed={period === p.value}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-espresso-900 text-cream-50'
                  : 'text-espresso-700 hover:bg-cream-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-terra-200 bg-terra-50 p-4 text-sm text-terra-700">
          {error}
        </p>
      )}

      {metrics === null ? (
        <p className="mt-8 animate-pulse text-espresso-500">Считаем…</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SOURCES.map((s) => {
              const n = metrics.totals[s.key];
              const share =
                metrics.total > 0 ? Math.round((n / metrics.total) * 100) : 0;
              return (
                <div
                  key={s.key}
                  className={`rounded-2xl border p-5 ${s.card}`}
                >
                  <p className="flex items-center gap-2 text-sm font-semibold text-espresso-700">
                    <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </p>
                  <p className="mt-2 font-display text-3xl font-semibold text-espresso-950">
                    {n}
                  </p>
                  <p className="mt-0.5 text-sm text-espresso-500">
                    {share}% от заявок
                  </p>
                </div>
              );
            })}
            <div className="rounded-2xl border border-espresso-900 bg-espresso-900 p-5 text-cream-50">
              <p className="text-sm font-semibold text-cream-200">Всего заявок</p>
              <p className="mt-2 font-display text-3xl font-semibold">
                {metrics.total}
              </p>
              <p className="mt-0.5 text-sm text-cream-200">
                {PERIODS.find((p) => p.value === period)?.label.toLowerCase()}
              </p>
            </div>
          </div>

          <section className="mt-8 rounded-2xl border border-cream-200 bg-white p-5 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-espresso-500">
              По дням
            </h2>
            {metrics.total === 0 ? (
              <p className="mt-6 text-espresso-500">
                За этот период заявок нет — диаграмма появится, как только
                придёт первая.
              </p>
            ) : (
              <>
                <div className="mt-5 flex h-44 items-end gap-1 sm:gap-1.5">
                  {metrics.byDay.map((d) => {
                    const dayTotal = d.instagram + d.yandex + d.none;
                    const h = (n: number) =>
                      dayTotal > 0 ? `${(n / dayTotal) * 100}%` : '0%';
                    return (
                      <div
                        key={d.day}
                        className="flex h-full min-w-0 flex-1 flex-col justify-end"
                        title={`${dayFmt.format(new Date(`${d.day}T00:00:00`))}: ${dayTotal}`}
                      >
                        {dayTotal > 0 && (
                          <div className="flex h-full w-full flex-col justify-end overflow-hidden rounded-t-[3px]">
                            <div className={`w-full ${SOURCES[0].bar}`} style={{ height: h(d.instagram) }} />
                            <div className={`w-full ${SOURCES[1].bar}`} style={{ height: h(d.yandex) }} />
                            <div className={`w-full ${SOURCES[2].bar}`} style={{ height: h(d.none) }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex gap-1 sm:gap-1.5">
                  {metrics.byDay.map((d, i) => {
                    const step = Math.ceil(metrics.byDay.length / 10);
                    const show = i % step === 0 || i === metrics.byDay.length - 1;
                    return (
                      <span
                        key={d.day}
                        className="min-w-0 flex-1 truncate text-center text-[10px] text-espresso-400"
                      >
                        {show
                          ? dayFmt.format(new Date(`${d.day}T00:00:00`))
                          : '\u00A0'}
                      </span>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                  {SOURCES.map((s) => (
                    <p
                      key={s.key}
                      className="flex items-center gap-2 text-xs text-espresso-600"
                    >
                      <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </p>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
