'use client';

import { useEffect, useState } from 'react';
import { normalizePhone } from '@/lib/phone';
import { captureAttribution, readAttribution } from '@/lib/utm';

export type Interest = 'subscription' | 'order' | 'question';
type Status = 'idle' | 'sending' | 'success' | 'error';

const INTERESTS: { value: Interest; label: string }[] = [
  { value: 'subscription', label: 'Подписка' },
  { value: 'order', label: 'Разовый заказ' },
  { value: 'question', label: 'Вопрос' },
];

const FALLBACK_PHONE = '+375 29 000-00-00';

export default function OrderForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState<Interest>('order');
  const [comment, setComment] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [resultMessage, setResultMessage] = useState('');
  const [serverError, setServerError] = useState('');

  // Кнопки «Заказать» на карточках кладут выбор в sessionStorage
  // и дёргают событие — здесь его подхватываем.
  useEffect(() => {
    captureAttribution();
    const applyPrefill = () => {
      try {
        const raw = sessionStorage.getItem('kvarta.prefill');
        if (!raw) return;
        const prefill = JSON.parse(raw) as {
          interest?: Interest;
          comment?: string;
        };
        if (prefill.interest) setInterest(prefill.interest);
        if (prefill.comment) setComment(prefill.comment);
        sessionStorage.removeItem('kvarta.prefill');
      } catch {
        // битый JSON — просто игнорируем
      }
    };
    applyPrefill();
    window.addEventListener('kvarta:prefill', applyPrefill);
    return () => window.removeEventListener('kvarta:prefill', applyPrefill);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (name.trim().length < 2) {
      errors.name = 'Напишите, как к вам обращаться.';
    }
    const normalized = normalizePhone(phone);
    if (!normalized) {
      errors.phone = 'Номер указан неверно.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus('sending');
    setServerError('');

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: normalized,
          interest,
          comment: comment.trim() || undefined,
          ...readAttribution(),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; message?: string; fields?: Record<string, string> }
        | null;

      if (res.ok && data?.ok) {
        setResultMessage(
          data.message ||
            'Заявка у нас. Перезвоним в течение дня, поможем с выбором и помолом.',
        );
        setStatus('success');
      } else if (data?.fields) {
        setFieldErrors(data.fields);
        setStatus('idle');
      } else {
        setServerError(
          data?.message ||
            `Заявка не ушла. Позвоните нам: ${FALLBACK_PHONE} — или попробуйте ещё раз через минуту.`,
        );
        setStatus('error');
      }
    } catch {
      setServerError(
        `Похоже, пропал интернет. Позвоните нам: ${FALLBACK_PHONE} — примем заявку голосом.`,
      );
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div
        className="rounded-2xl border border-cream-200 bg-white p-8"
        role="status"
        aria-live="polite"
      >
        <p className="font-display text-3xl font-semibold">
          Заявка у нас <span aria-hidden="true">☕</span>
        </p>
        <p className="mt-3 leading-relaxed text-espresso-700">{resultMessage}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-2xl border border-cream-200 bg-white p-6 sm:p-8"
    >
      <fieldset disabled={status === 'sending'} className="disabled:opacity-70">
        <legend className="sr-only">Форма заявки</legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="lead-name" className="text-sm font-semibold">
              Имя
            </label>
            <input
              id="lead-name"
              type="text"
              autoComplete="name"
              placeholder="Как к вам обращаться"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? 'lead-name-error' : undefined}
              className="mt-1.5 w-full rounded-xl border border-cream-300 bg-cream-50/50 px-4 py-2.5 text-base placeholder:text-espresso-400 focus:border-caramel-500"
            />
            {fieldErrors.name && (
              <p id="lead-name-error" className="mt-1.5 text-sm text-terra-600">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="lead-phone" className="text-sm font-semibold">
              Телефон
            </label>
            <input
              id="lead-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+375 29 123-45-67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? 'lead-phone-error' : undefined}
              className="mt-1.5 w-full rounded-xl border border-cream-300 bg-cream-50/50 px-4 py-2.5 text-base placeholder:text-espresso-400 focus:border-caramel-500"
            />
            {fieldErrors.phone && (
              <p id="lead-phone-error" className="mt-1.5 text-sm text-terra-600">
                {fieldErrors.phone}
              </p>
            )}
          </div>
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold">Что вас интересует</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTERESTS.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  interest === option.value
                    ? 'border-espresso-900 bg-espresso-900 text-cream-50'
                    : 'border-cream-300 bg-white text-espresso-700 hover:border-espresso-500'
                }`}
              >
                <input
                  type="radio"
                  name="interest"
                  value={option.value}
                  checked={interest === option.value}
                  onChange={() => setInterest(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6">
          <label htmlFor="lead-comment" className="text-sm font-semibold">
            Комментарий <span className="font-normal text-espresso-500">— не обязательно</span>
          </label>
          <textarea
            id="lead-comment"
            rows={3}
            placeholder="Например: Эфиопия 250 г, помол для воронки"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            aria-invalid={Boolean(fieldErrors.comment)}
            aria-describedby={fieldErrors.comment ? 'lead-comment-error' : undefined}
            className="mt-1.5 w-full resize-y rounded-xl border border-cream-300 bg-cream-50/50 px-4 py-2.5 text-base placeholder:text-espresso-400 focus:border-caramel-500"
          />
          {fieldErrors.comment && (
            <p id="lead-comment-error" className="mt-1.5 text-sm text-terra-600">
              {fieldErrors.comment}
            </p>
          )}
        </div>

        {status === 'error' && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-terra-200 bg-terra-50 p-4 text-sm leading-relaxed text-terra-700"
          >
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'sending'}
          className="mt-6 w-full rounded-full bg-espresso-900 px-7 py-3.5 text-base font-semibold text-cream-50 transition-colors hover:bg-espresso-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {status === 'sending' ? 'Отправляем…' : 'Отправить заявку'}
        </button>
        <p className="mt-3 text-xs leading-relaxed text-espresso-500">
          Нажимая кнопку, вы соглашаетесь, что мы перезвоним по этому номеру.
          Больше ничего с ним не делаем.
        </p>
      </fieldset>
    </form>
  );
}
