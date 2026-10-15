// Белорусские мобильные номера: приводим любой частый формат к +375XXXXXXXXX.
// Понимаем: +375 29 123-45-67, 375291234567, 80291234567, 0291234567, 291234567.
const MOBILE_CODES = new Set(['25', '29', '33', '44']);

export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('375')) digits = digits.slice(3);
  else if (digits.startsWith('80')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);

  // должно остаться 9 цифр: код оператора (2) + номер (7)
  if (digits.length !== 9 || !MOBILE_CODES.has(digits.slice(0, 2))) return null;
  return `+375${digits}`;
}
