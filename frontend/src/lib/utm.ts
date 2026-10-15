// Менеджеру важно знать, откуда пришла заявка: снимаем UTM-метки, реферер
// и адрес страницы. Первый источник в сессии — главный, при переходах
// по сайту его не перетираем. Живёт в sessionStorage.
export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  page_url?: string;
};

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

const STORAGE_KEY = 'kvarta.attr';

export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    const prev = readAttribution();
    const params = new URLSearchParams(window.location.search);

    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value && !prev[key]) {
        prev[key] = value.slice(0, 200);
      }
    }
    if (!prev.referrer && document.referrer) {
      prev.referrer = document.referrer.slice(0, 500);
    }
    if (!prev.page_url) {
      prev.page_url = window.location.href.slice(0, 500);
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prev));
  } catch {
    // приватный режим или недоступный sessionStorage — заявка всё равно уйдёт
  }
}

export function readAttribution(): Attribution {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}
