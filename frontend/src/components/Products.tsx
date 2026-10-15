'use client';

import { useCallback, useEffect, useState } from 'react';
import CoffeeCup from './CoffeeCup';
import OrderButton from './OrderButton';
import Reveal from './Reveal';

type Product = {
  name: string;
  roast: string;
  notes: string;
  hint: string;
  weight: string;
  price: number;
};

type SubSettings = {
  sub_title?: string;
  sub_description?: string;
  sub_price?: string;
};

type LoadState = 'loading' | 'ready' | 'error';

function SkeletonCards() {
  return (
    <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <li
          key={i}
          className="h-64 animate-pulse rounded-2xl border border-cream-200 bg-cream-100/60"
        />
      ))}
      <li className="h-44 animate-pulse rounded-2xl bg-espresso-900/20 sm:col-span-2" />
    </ul>
  );
}

export default function Products() {
  const [state, setState] = useState<LoadState>('loading');
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SubSettings>({});

  const load = useCallback(async () => {
    setState('loading');
    try {
      const [pRes, sRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/settings'),
      ]);
      if (!pRes.ok || !sRes.ok) throw new Error('bad status');
      const pData = await pRes.json();
      const sData = await sRes.json();
      setProducts(Array.isArray(pData.products) ? pData.products : []);
      setSettings(sData.settings ?? {});
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section id="catalog" aria-labelledby="catalog-title" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel-600">
              Зерно
            </p>
            <h2
              id="catalog-title"
              className="mt-3 font-display text-3xl font-semibold leading-tight text-espresso-950 sm:text-4xl"
            >
              Что жарим на этой неделе
            </h2>
            <p className="mt-3 text-espresso-700">
              Цены — за пакет 250 г. Смелем под ваш способ заваривания, это
              бесплатно: отметьте помол в комментарии к заявке.
            </p>
          </div>
        </Reveal>

        {state === 'loading' && <SkeletonCards />}

        {state === 'error' && (
          <div
            role="alert"
            className="mt-10 rounded-2xl border border-terra-200 bg-terra-50 p-6 text-espresso-800"
          >
            Каталог не загрузился. Проверьте интернет и попробуйте ещё раз.
            <button
              type="button"
              onClick={() => void load()}
              className="ml-3 rounded-full border border-espresso-900 px-4 py-1.5 text-sm font-semibold text-espresso-900 transition-colors hover:bg-espresso-900 hover:text-cream-50"
            >
              Обновить
            </button>
          </div>
        )}

        {state === 'ready' && (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p, i) => (
              <li key={p.name} className="h-full">
                <Reveal className="h-full" delay={Math.min(i, 5) * 80}>
                  <article className="flex h-full flex-col rounded-2xl border border-cream-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-cream-100 px-3 py-1 text-sm font-medium text-espresso-700">
                        {p.roast}
                      </span>
                      <span className="text-sm text-espresso-500">{p.weight}</span>
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-semibold">
                      {p.name}
                    </h3>
                    <p className="mt-2 text-espresso-700">{p.notes}</p>
                    {p.hint && <p className="mt-1 text-sm text-espresso-500">{p.hint}</p>}
                    <div className="mt-auto flex items-end justify-between pt-6">
                      <p className="font-display text-2xl font-semibold">
                        {p.price}{' '}
                        <span className="text-base font-normal text-espresso-500">
                          BYN
                        </span>
                      </p>
                      <OrderButton
                        interest="order"
                        comment={`Разовый заказ: ${p.name} (${p.weight})`}
                      >
                        Заказать
                      </OrderButton>
                    </div>
                  </article>
                </Reveal>
              </li>
            ))}

            <li id="subscription" className="scroll-mt-20 sm:col-span-2">
              <Reveal className="h-full" delay={140}>
                <article className="flex h-full flex-col rounded-2xl bg-espresso-900 p-6 text-cream-50 sm:p-8 lg:flex-row lg:gap-6">
                  <div className="flex flex-1 flex-col">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel-400">
                          Подписка
                        </p>
                        <h3 className="mt-3 font-display text-3xl font-semibold">
                          {settings.sub_title}
                        </h3>
                      </div>
                      <p className="font-display text-3xl font-semibold">
                        {settings.sub_price}{' '}
                        <span className="text-lg font-normal text-cream-200">
                          BYN/мес
                        </span>
                      </p>
                    </div>
                    <p className="mt-4 max-w-xl leading-relaxed text-cream-200">
                      {settings.sub_description}
                    </p>
                    <div className="mt-auto pt-6">
                      <OrderButton interest="subscription" dark>
                        Оформить подписку
                      </OrderButton>
                    </div>
                  </div>
                  <div aria-hidden="true" className="-mb-6 -mr-2 w-32 shrink-0 self-end sm:-mb-8 sm:-mr-4 sm:w-36 lg:w-40">
                    <CoffeeCup tone="dark" className="kv-float" />
                  </div>
                </article>
              </Reveal>
            </li>
          </ul>
        )}
      </div>
    </section>
  );
}
