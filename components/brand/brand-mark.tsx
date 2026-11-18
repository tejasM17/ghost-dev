interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className = "size-5" }: BrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M5 19V11a7 7 0 0 1 14 0v8l-3.5-2-3.5 2-3.5-2L5 19Z"
        fill="currentColor"
      />
      <circle cx="9.5" cy="11" r="1" fill="var(--accent-primary)" />
      <circle cx="14.5" cy="11" r="1" fill="var(--accent-primary)" />
    </svg>
  );
}
