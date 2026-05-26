"use client";

interface VerifiedBadgeProps {
  size?: "sm" | "md";
}

const sizeMap = { sm: 12, md: 16 };

export function VerifiedBadge({ size = "md" }: VerifiedBadgeProps) {
  const px = sizeMap[size];
  return (
    <span title="Verified account" className="inline-flex shrink-0 items-center">
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        aria-label="Verified"
      >
        <circle cx="12" cy="12" r="12" fill="#0095F6" />
        <path
          d="M7 12.5l3.5 3.5 6.5-7"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
