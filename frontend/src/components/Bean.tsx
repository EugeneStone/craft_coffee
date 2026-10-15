export default function Bean({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="16" cy="16" rx="11" ry="14" fill="currentColor" />
      <path d="M16 3c-5 5-5 21 0 26" stroke="#FBF8F1" strokeWidth="2.5" fill="none" />
    </svg>
  );
}
