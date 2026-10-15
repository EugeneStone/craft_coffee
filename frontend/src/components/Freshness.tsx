import Image from 'next/image';

export default function Freshness() {
  return (
    <section
      aria-labelledby="about-title"
      className="border-y border-cream-200 bg-cream-100"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:py-24">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel-600">
            Кто мы
          </p>
          <h2
            id="about-title"
            className="mt-3 font-display text-3xl font-semibold leading-tight text-espresso-950 sm:text-4xl"
          >
            Почему мы жарим маленькими партиями
          </h2>
          <div className="mt-5 space-y-4 leading-relaxed text-espresso-800">
            <p>
              Нас двое: Аня и Дмитрий. До «Кварты» мы работали бариста и видели,
              как кофе месяцами лежит на складах и полках — и как меняется вкус,
              когда зерно приезжает прямо от обжарщика.
            </p>
            <p>
              Поэтому у нас так: закупаем зерно небольшими лотами, жарим
              по четвергам и в пятницу сами развозим по Минску.
            </p>
            <p>
              Свежеобжаренный кофе вкуснее — тут без вариантов: ярче аромат,
              живее сладость, длиннее послевкусие.
            </p>
          </div>
        </div>

        <figure>
          <Image
            src="/images/beans.webp"
            alt="Основатель мастерской держит в руках горсть свежеобжаренных зёрен"
            width={1024}
            height={768}
            sizes="(min-width: 1024px) 46vw, 100vw"
            className="aspect-[4/3] w-full rounded-2xl object-cover shadow-md"
          />
        </figure>
      </div>
    </section>
  );
}
