import OrderButton from './OrderButton';
import CoffeeCup from './CoffeeCup';

const PRODUCTS = [
  {
    name: 'Эфиопия Иргачеффе',
    roast: 'Светлая',
    notes: 'цветочный, бергамот',
    hint: 'Для воронки и чёрного кофе без молока',
    weight: '250 г',
    price: 32,
  },
  {
    name: 'Колумбия Уила',
    roast: 'Средняя',
    notes: 'карамель, красное яблоко',
    hint: 'Универсальная: и в фильтр, и с молоком',
    weight: '250 г',
    price: 29,
  },
  {
    name: 'Бразилия Серрадо',
    roast: 'Под эспрессо',
    notes: 'орех, шоколад',
    hint: 'Плотная, для эспрессо и молочных напитков',
    weight: '250 г',
    price: 26,
  },
  {
    name: 'Дрип-пакеты, ассорти',
    roast: 'Ассорти',
    notes: 'по пакетику каждого сорта',
    hint: 'Кофе в дорогу: кружка, кипяток — и готово',
    weight: '10 штук',
    price: 18,
  },
];

export default function Products() {
  return (
    <section id="catalog" aria-labelledby="catalog-title" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
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

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p) => (
            <li key={p.name} className="h-full">
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
                <p className="mt-1 text-sm text-espresso-500">{p.hint}</p>
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
            </li>
          ))}

          <li id="subscription" className="scroll-mt-20 sm:col-span-2">
            <article className="flex h-full flex-col rounded-2xl bg-espresso-900 p-6 text-cream-50 sm:p-8 lg:flex-row lg:gap-6">
              <div className="flex flex-1 flex-col">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel-400">
                      Подписка
                    </p>
                    <h3 className="mt-3 font-display text-3xl font-semibold">
                      Две пачки каждый месяц
                    </h3>
                  </div>
                  <p className="font-display text-3xl font-semibold">
                    54{' '}
                    <span className="text-lg font-normal text-cream-200">
                      BYN/мес
                    </span>
                  </p>
                </div>
                <p className="mt-4 max-w-xl leading-relaxed text-cream-200">
                  2 пачки по 250 г раз в месяц, доставка бесплатная. Сорт можно
                  менять — перед обжаркой спросим, что вам интереснее. Оплата
                  раз в месяц.
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
          </li>
        </ul>
      </div>
    </section>
  );
}
