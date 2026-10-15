const STEPS = [
  {
    day: 'Четверг',
    title: 'Обжарка',
    text: 'Жарим заказанное зерно и в тот же день пакуем — кофе едет к вам свежим, без недель на складе.',
  },
  {
    day: 'Пятница',
    title: 'Развоз по Минску',
    text: 'Сами возим заказы по городу — привезём и домой, и на работу, чтобы свежий кофе ждал вас и на кухне, и на рабочем столе. От 50 BYN доставка бесплатная, точную стоимость скажем при звонке.',
  },
  {
    day: 'Суббота и воскресенье',
    title: 'Если заказов много',
    text: 'Когда заявок больше обычного, часть развозов уходит на выходные. Воскресенье — крайний день доставки.',
  },
];

export default function Delivery() {
  return (
    <section
      id="delivery"
      aria-labelledby="delivery-title"
      className="scroll-mt-20 border-y border-cream-200 bg-cream-100"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel-600">
            Доставка и самовывоз
          </p>
          <h2
            id="delivery-title"
            className="mt-3 font-display text-3xl font-semibold leading-tight text-espresso-950 sm:text-4xl"
          >
            Как кофе доезжает до вас
          </h2>
        </div>

        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.day}>
              <article className="h-full rounded-2xl border border-cream-200 bg-white p-6">
                <p className="text-sm font-bold uppercase tracking-widest text-caramel-600">
                  {s.day}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold">
                  {s.title}
                </h3>
                <p className="mt-2 text-espresso-700">{s.text}</p>
              </article>
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-2xl border border-cream-200 bg-white p-6">
          <h3 className="font-display text-xl font-semibold">Самовывоз</h3>
          <p className="mt-2 text-espresso-700">
            Забрать заказ можно по адресу: Минск, ул. Короля, 9. Мы принимаем
            заказы и отдаём самовывоз в будни с 8:00 до 20:00, в выходные
            с 10:00 до 18:00.
          </p>
        </div>
      </div>
    </section>
  );
}
