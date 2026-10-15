import OrderForm from './OrderForm';
import CoffeeCup from './CoffeeCup';

export default function OrderSection() {
  return (
    <section id="order" aria-labelledby="order-title" className="scroll-mt-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:py-24">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel-600">
            Заявка
          </p>
          <h2
            id="order-title"
            className="mt-3 font-display text-3xl font-semibold leading-tight text-espresso-950 sm:text-4xl"
          >
            Оставьте заявку — перезвоним
          </h2>
          <p className="mt-4 leading-relaxed text-espresso-800">
            Расскажите, что хотите: подписку, разовый заказ или просто спросить
            про кофе. Перезвоним в течение дня, поможем с выбором и помолом,
            уточним адрес.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-espresso-700">
            <li>Оплата при получении или переводом</li>
            <li>Помол под ваш способ заваривания — бесплатно</li>
            <li>Если что-то не понравится — скажите, заменим партию</li>
          </ul>
          <div aria-hidden="true" className="mt-8 w-20 sm:w-24">
            <CoffeeCup tone="light" />
          </div>
        </div>

        <OrderForm />
      </div>
    </section>
  );
}
