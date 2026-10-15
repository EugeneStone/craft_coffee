'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { apiJson } from '@/lib/admin';

const NAV = [
  { href: '/admin', label: 'Заявки' },
  { href: '/admin/metrics', label: 'Метрики' },
  { href: '/admin/subscriptions', label: 'Подписки' },
  { href: '/admin/products', label: 'Зерно' },
  { href: '/admin/settings', label: 'Условия подписки' },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<'checking' | 'anon' | 'authed'>('checking');
  const pathname = usePathname();

  useEffect(() => {
    apiJson('/api/admin/me')
      .then(() => setPhase('authed'))
      .catch(() => setPhase('anon'));
  }, []);

  async function logout() {
    await apiJson('/api/admin/logout', { method: 'POST' }).catch(() => {});
    setPhase('anon');
  }

  if (phase === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse text-espresso-500">Открываем админку…</p>
      </div>
    );
  }

  if (phase === 'anon') {
    return <LoginForm onLogin={() => setPhase('authed')} />;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-cream-200 bg-cream-100/70">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link
            href="/admin"
            className="font-display text-lg font-semibold text-espresso-950"
          >
            Кварта <span className="font-sans text-sm font-normal text-espresso-500">· админка</span>
          </Link>
          <nav aria-label="Разделы админки" className="flex flex-wrap gap-1">
            {NAV.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-espresso-900 text-cream-50'
                      : 'text-espresso-700 hover:bg-cream-200/70'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <a
              href="/"
              className="text-espresso-500 underline-offset-4 hover:underline"
            >
              На сайт
            </a>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-full border border-espresso-800 px-3.5 py-1.5 font-medium text-espresso-900 transition-colors hover:bg-espresso-900 hover:text-cream-50"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await apiJson('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ login, password }),
      });
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не получилось войти.');
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-cream-200 bg-white p-8 shadow-sm"
      >
        <h1 className="font-display text-2xl font-semibold text-espresso-950">
          Вход для своих
        </h1>
        <p className="mt-1.5 text-sm text-espresso-500">
          Панель заявок мастерской «Кварта».
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-login" className="text-sm font-semibold">
              Логин
            </label>
            <input
              id="admin-login"
              type="text"
              autoComplete="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-cream-300 bg-cream-50/50 px-4 py-2.5 focus:border-caramel-500"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="text-sm font-semibold">
              Пароль
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-cream-300 bg-cream-50/50 px-4 py-2.5 focus:border-caramel-500"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-terra-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-full bg-espresso-900 px-6 py-3 font-semibold text-cream-50 transition-colors hover:bg-espresso-800 disabled:opacity-70"
        >
          {busy ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
