'use client';

import { useState } from 'react';
import Bean from './Bean';

const LINKS = [
  { href: '#catalog', label: 'Зерно' },
  { href: '#subscription', label: 'Подписка' },
  { href: '#delivery', label: 'Доставка' },
  { href: '#contacts', label: 'Контакты' },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-cream-200/80 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <Bean className="h-6 w-6 text-caramel-500" />
          Кварта
        </a>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Разделы страницы">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-espresso-700 transition-colors hover:text-espresso-950"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#order"
            className="rounded-full bg-espresso-900 px-4 py-2 text-sm font-semibold text-cream-50 transition-colors hover:bg-espresso-800"
          >
            Оставить заявку
          </a>
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={`h-0.5 w-5 bg-espresso-900 transition-transform ${open ? 'translate-y-1 rotate-45' : ''}`}
          />
          <span
            className={`h-0.5 w-5 bg-espresso-900 transition-transform ${open ? '-translate-y-1 -rotate-45' : ''}`}
          />
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          className="border-t border-cream-200 bg-cream-50 px-4 pb-5 pt-2 md:hidden"
          aria-label="Разделы страницы"
        >
          <ul className="flex flex-col">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base font-medium text-espresso-800"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#order"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-full bg-espresso-900 px-4 py-3 text-center text-sm font-semibold text-cream-50"
          >
            Оставить заявку
          </a>
        </nav>
      )}
    </header>
  );
}
