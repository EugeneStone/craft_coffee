'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiJson } from '@/lib/admin';

type SourceKey = 'instagram' | 'yandex' | 'none';

type Metrics = {
  totals: Record<SourceKey, number>;
  total: number;
  byDay: { day: string; instagram: number; yandex: number; none: number }[];
};

type Period = '7' | '30' | 'all';

type Bucket = {
  key: string;
  label: string;
  tooltip: string;
  instagram: number;
  yandex: number;
  none: number;
};

const SOURCES: { key: SourceKey; label: string; card: string; bar: string; dot: string }[] = [
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
    card: 'border-red-200 bg-red-50',
    bar: 'bg-red-500',
    dot: 'bg-red-500',
  },
  {
    key: 'none',
    label: 'Не по рекламе',
    card: 'border-cream-300 bg-white',
    bar: 'bg-espresso-700',
    dot: 'bg-espresso-700',
  },
];

const PERIODS: { value: Period; label: string; sub: string }[] = [
  { value: '7', label: '7 дней', sub: 'за последние 7 дней' },
  { value: '30', label: '30 дней', sub: 'за последние 30 дней' },
  { value: 'all', label: 'Всё время', sub: 'за всё время' },
];

const dayFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });
const monthShortFmt = new Intl.DateTimeFormat('ru-RU', { month: 'short' });
const monthLongFmt = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });

const bucketTotal = (b: { instagram: number; yandex: number; none: number }) =>
  b.instagram + b.yandex + b.none;

function fmtDay(iso: string) {
  return dayFmt.format(new Date(`${iso}T00:00:00`));
}

// короткая числовая подпись дня «12.12» — не обрезается в узких ячейках
function fmtDayShort(iso: string) {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
}

function buildBuckets(byDay: Metrics['byDay'], period: Period): { buckets: Bucket[]; scroll: boolean } {
  if (period !== 'all') {
    return {
      scroll: false,
      buckets: byDay.map((d) => ({
        key: d.day,
        label: fmtDayShort(d.day),
        tooltip: `${fmtDay(d.day)}: ${bucketTotal(d)}`,
        instagram: d.instagram,
        yandex: d.yandex,
        none: d.none,
      })),
    };
  }

  const byMonth = new Map<string, { instagram: number; yandex: number; none: number }>();
  for (const d of byDay) {
    const key = d.day.slice(0, 7);
    const acc = byMonth.get(key) ?? { instagram: 0, yandex: 0, none: 0 };
    acc.instagram += d.instagram;
    acc.yandex += d.yandex;
    acc.none += d.none;
    byMonth.set(key, acc);
  }
  const currentYear = new Date().getFullYear();
  const buckets = [...byMonth.entries()].map(([key, v]) => {
    const date = new Date(`${key}-01T00:00:00`);
    const year = date.getFullYear();
    return {
      key,
      label: year === currentYear ? monthShortFmt.format(date) : `${monthShortFmt.format(date)} ${year}`,
      tooltip: `${monthLongFmt.format(date)}: ${bucketTotal(v)}`,
      ...v,
    };
  });
  return { scroll: true, buckets };
}

function ChartColumn({
  bucket,
  maxDay,
  className,
  barClassName,
}: {
  bucket: Bucket;
  maxDay: number;
  className: string;
  barClassName: string;
}) {
  const n = bucketTotal(bucket);
  return (
    <div className={className} title={n > 0 ? bucket.tooltip : undefined}>
      {/* обёртка столбика обязана иметь определённую высоту — иначе
          проценты высоты внутри неё схлопнутся в ноль */}
      <div className={`flex h-full items-end ${barClassName}`}>
        {n > 0 && (
          <div
            className="flex w-full flex-col-reverse overflow-hidden rounded-t-[3px]"
            style={{ height: `${(n / maxDay) * 100}%` }}
          >
            {SOURCES.map((s) =>
              bucket[s.key] > 0 ? (
                <div
                  key={s.key}
                  className={`w-full ${s.bar}`}
                  style={{ height: `${(bucket[s.key] / n) * 100}%` }}
                />
              ) : null,
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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

  const view = metrics ? buildBuckets(metrics.byDay, period) : null;
  const maxDay = view ? Math.max(...view.buckets.map(bucketTotal), 1) : 1;

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

      {metrics === null || view === null ? (
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
                {PERIODS.find((p) => p.value === period)?.sub}
              </p>
            </div>
          </div>

          <section className="mt-8 rounded-2xl border border-cream-200 bg-white p-5 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-espresso-500">
              {period === 'all' ? 'По месяцам' : 'По дням'}
            </h2>
            {metrics.total === 0 ? (
              <p className="mt-6 text-espresso-500">
                За этот период заявок нет — диаграмма появится, как только
                придёт первая.
              </p>
            ) : view.scroll ? (
              <div className="scroll-thin mt-5 overflow-x-auto pb-2">
                <div className="min-w-max px-1">
                  <div className="flex h-44 items-end gap-2">
                    {view.buckets.map((b) => (
                      <ChartColumn
                        key={b.key}
                        bucket={b}
                        maxDay={maxDay}
                        className="flex h-full w-14 shrink-0 items-end justify-center"
                        barClassName="w-3"
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2" aria-hidden="true">
                    {view.buckets.map((b) => (
                      <span
                        key={b.key}
                        className="w-14 shrink-0 text-center text-[11px] leading-4 whitespace-nowrap text-espresso-400"
                      >
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-5 flex h-44 items-end gap-0.5 sm:gap-1">
                  {view.buckets.map((b) => (
                    <ChartColumn
                      key={b.key}
                      bucket={b}
                      maxDay={maxDay}
                      className="flex h-full min-w-0 flex-1 items-end justify-center"
                      barClassName="w-2.5"
                    />
                  ))}
                </div>
                <div className="mt-2">
                  {view.buckets.length > 10
                    ? [0, 1].map((row) => (
                        // шахматные подписи: каждая дата на своём месте,
                        // соседние даты в строке через 2 ячейки — не налазят
                        <div key={row} className="flex h-4 gap-0.5 sm:gap-1">
                          {view.buckets.map((b, i) => (
                            <span
                              key={b.key}
                              aria-hidden="true"
                              className="relative h-4 min-w-0 flex-1 text-[11px] text-espresso-400"
                            >
                              {i % 2 === row && (
                                <span className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap">
                                  {b.label}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      ))
                    : (
                        <div className="flex h-4 gap-0.5 sm:gap-1">
                          {view.buckets.map((b) => (
                            <span
                              key={b.key}
                              aria-hidden="true"
                              className="relative h-4 min-w-0 flex-1 text-[11px] text-espresso-400"
                            >
                              <span className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap">
                                {b.label}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                </div>
              </>
            )}
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
          </section>
        </>
      )}
    </div>
  );
}
