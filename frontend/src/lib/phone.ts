// Тот же алгоритм, что на бэкенде (backend/src/lib/phone.ts).
// Держим копию, чтобы фронт не пропускал то, что бэкенд отклонит.
const MOBILE_CODES = new Set(['25', '29', '33', '44']);

export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('375')) digits = digits.slice(3);
  else if (digits.startsWith('80')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);

  if (digits.length !== 9 || !MOBILE_CODES.has(digits.slice(0, 2))) return null;
  return `+375${digits}`;
}
