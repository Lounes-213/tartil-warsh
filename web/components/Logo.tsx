export default function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="6.5" y="6.5" width="35" height="35" rx="4" transform="rotate(45 24 24)" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
      <rect x="11" y="11" width="26" height="26" rx="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M24 15.5c1.6 4.2 4.3 6.9 8.5 8.5-4.2 1.6-6.9 4.3-8.5 8.5-1.6-4.2-4.3-6.9-8.5-8.5 4.2-1.6 6.9-4.3 8.5-8.5Z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}
