'use client';

// Кнопка на карточке товара: запоминает, что выбрали, и уносит к форме
// с уже заполненным интересом и комментарием.
export default function OrderButton({
  interest,
  comment,
  dark = false,
  children,
}: {
  interest: 'subscription' | 'order' | 'question';
  comment?: string;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        sessionStorage.setItem(
          'kvarta.prefill',
          JSON.stringify({ interest, comment }),
        );
        window.dispatchEvent(new CustomEvent('kvarta:prefill'));
        document.getElementById('order')?.scrollIntoView({ behavior: 'smooth' });
      }}
      className={
        dark
          ? 'rounded-full border border-cream-50 bg-cream-50 px-6 py-2.5 text-sm font-semibold text-espresso-900 transition-colors hover:bg-transparent hover:text-cream-50'
          : 'rounded-full border border-espresso-900 px-6 py-2.5 text-sm font-semibold text-espresso-900 transition-colors hover:bg-espresso-900 hover:text-cream-50'
      }
    >
      {children}
    </button>
  );
}
