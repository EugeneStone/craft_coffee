// Определяем рекламный источник заявки по UTM-меткам и referrer.
// Пока это только Instagram и Яндекс — остальное считаем «без источника».

type Attribution = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  referrer?: string | null;
};

export type LeadSource = 'instagram' | 'yandex';

export function detectSource(a: Attribution): LeadSource | null {
  const source = (a.utm_source || '').toLowerCase();
  const campaign = (a.utm_campaign || '').toLowerCase();
  const referrer = (a.referrer || '').toLowerCase();

  if (
    source.includes('instagram') ||
    source === 'ig' ||
    source === 'inst' ||
    campaign.includes('instagram') ||
    referrer.includes('instagram.com')
  ) {
    return 'instagram';
  }

  if (
    source.includes('yandex') ||
    source === 'ya' ||
    source.includes('direct') ||
    campaign.includes('yandex') ||
    campaign.includes('direct') ||
    referrer.includes('yandex.') ||
    referrer.includes('ya.ru')
  ) {
    return 'yandex';
  }

  return null;
}

export const SOURCE_LABELS: Record<LeadSource, string> = {
  instagram: 'Instagram',
  yandex: 'Яндекс',
};
