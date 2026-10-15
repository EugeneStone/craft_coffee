type CoffeeCupProps = {
  tone?: 'dark' | 'light';
  animated?: boolean;
  className?: string;
};

export default function CoffeeCup({
  tone = 'dark',
  animated = true,
  className,
}: CoffeeCupProps) {
  const cup = tone === 'dark' ? 'var(--color-cream-50)' : '#ffffff';
  const accent =
    tone === 'dark' ? 'var(--color-caramel-200)' : 'var(--color-caramel-400)';
  const saucer =
    tone === 'dark' ? 'var(--color-caramel-700)' : 'var(--color-caramel-200)';
  const steam =
    tone === 'dark' ? 'var(--color-cream-200)' : 'var(--color-espresso-400)';

  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {tone === 'light' && (
        <circle cx="60" cy="62" r="54" fill="var(--color-caramel-100)" />
      )}
      <ellipse cx="60" cy="86" rx="34" ry="7" fill={saucer} />
      <path
        d="M 90 52 Q 104 52 102 64 Q 100 74 86 72"
        stroke={cup}
        strokeWidth="5.5"
        fill="none"
      />
      <path d="M 30 44 L 90 44 L 84 80 Q 60 90 36 80 Z" fill={cup} />
      <path d="M 30 44 L 90 44 L 89 51 L 31 51 Z" fill={accent} />
      <ellipse cx="60" cy="66" rx="6" ry="8" fill={accent} />
      <path
        d="M 60 58 C 56 62 64 66 60 70"
        stroke={cup}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <g
        className={animated ? 'kv-steam' : undefined}
        fill="none"
        stroke={steam}
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.75"
      >
        <path d="M 47 36 Q 41 28 46 20 Q 51 12 45 4" />
        <path d="M 60 34 Q 54 26 59 18 Q 64 10 58 2" />
        <path d="M 73 36 Q 79 28 74 20 Q 69 12 75 4" />
      </g>
    </svg>
  );
}
