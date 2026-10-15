// Мелкие общие помощники для админки: JSON-запросы, даты и телефоны.

export async function apiJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers:
      init?.body !== undefined
        ? { 'content-type': 'application/json', ...init?.headers }
        : init?.headers,
  });
  const data = (await res.json().catch(() => null)) as
    | (T & { message?: string })
    | null;
  if (!res.ok) {
    const err = new Error(
      data?.message || `Запрос не прошёл (${res.status}).`,
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

const dayFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
});

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatDay(iso: string): string {
  return dayFmt.format(new Date(iso));
}

export function formatPhone(phone: string): string {
  const m = /^375(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  return m ? `+375 ${m[1]} ${m[2]}-${m[3]}-${m[4]}` : phone;
}
