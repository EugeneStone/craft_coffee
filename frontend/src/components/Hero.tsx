import Image from 'next/image';

export default function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-20 lg:pt-16">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel-600">
            Обжарка кофе · Минск
          </p>
          <h1
            id="hero-title"
            className="mt-4 font-display text-4xl font-semibold leading-[1.1] text-espresso-950 sm:text-5xl lg:text-[3.35rem]"
          >
            Кофе, обжаренный в&nbsp;четверг. У&nbsp;вас&nbsp;— в&nbsp;пятницу.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-espresso-800 sm:text-lg">
            «Кварта» — маленькая мастерская на ул. Короля. Жарим зерно партиями
            по 5 кг и сами развозим заказы по Минску. До вашей чашки кофе доезжает
            за 1–3 дня после обжарки — свежим, каким и должен быть.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#catalog"
              className="rounded-full bg-espresso-900 px-7 py-3 text-base font-semibold text-cream-50 transition-colors hover:bg-espresso-800"
            >
              Выбрать кофе
            </a>
            <a
              href="#subscription"
              className="rounded-full border border-espresso-800 px-7 py-3 text-base font-semibold text-espresso-900 transition-colors hover:bg-cream-100"
            >
              О подписке
            </a>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-cream-200 pt-6">
            <li>
              <strong className="font-display text-xl font-semibold">5 кг</strong>
              <span className="mt-0.5 block text-sm text-espresso-500">партия обжарки</span>
            </li>
            <li>
              <strong className="font-display text-xl font-semibold">1–3 дня</strong>
              <span className="mt-0.5 block text-sm text-espresso-500">от ростера до вас</span>
            </li>
            <li>
              <strong className="font-display text-xl font-semibold">с 2019</strong>
              <span className="mt-0.5 block text-sm text-espresso-500">жарим сами</span>
            </li>
          </ul>
        </div>

        <figure className="relative">
          <Image
            src="/images/hero.webp"
            alt="Свежеобжаренные зёрна высыпаются из ростера в охлаждающий лоток"
            width={1792}
            height={1024}
            priority
            sizes="(min-width: 1024px) 44vw, 100vw"
            className="aspect-[16/10] w-full rounded-2xl object-cover shadow-lg"
          />
          <figcaption className="absolute -bottom-4 left-4 rounded-xl bg-espresso-900 px-4 py-2 text-sm font-medium text-cream-50 shadow-md">
            Ещё тёплый
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
