import Bean from './Bean';
import CoffeeCup from './CoffeeCup';

export default function Footer() {
  return (
    <footer id="contacts" className="scroll-mt-20 bg-espresso-950 text-cream-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="flex items-center gap-2 font-display text-xl font-semibold">
            <Bean className="h-5 w-5 text-caramel-400" />
            Кварта
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream-200/70">
            Маленькая обжарка в Минске. Жарим по четвергам, возим по пятницам.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-caramel-400">
            Связаться
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="tel:+375290000000" className="transition-colors hover:text-white">
                +375 29 000-00-00
              </a>
            </li>
            <li>
              <a
                href="mailto:privet@kvarta.coffee"
                className="transition-colors hover:text-white"
              >
                privet@kvarta.coffee
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-caramel-400">
            Мастерская
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-cream-200/90">
            <li>Минск, ул. Короля, 9 — самовывоз</li>
            <li>Принимаем заказы: пн–пт 8:00–20:00, сб–вс 10:00–18:00</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-cream-200/50 sm:px-6">
          <p className="flex items-center gap-2">
            © {new Date().getFullYear()} Кварта
            <CoffeeCup tone="dark" animated={false} className="h-6 w-6" />
          </p>
        </div>
      </div>
    </footer>
  );
}
