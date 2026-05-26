import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 gap-4 animate-fade-up">
      <div
        className="rounded-full p-5 border-2"
        style={{ borderColor: "var(--color-border)" }}
      >
        <Icon size={36} strokeWidth={1.5} style={{ color: "var(--color-text-secondary)" }} />
      </div>
      <div className="text-center">
        <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
          {title}
        </p>
        {description && (
          <p className="text-sm mt-1 max-w-xs" style={{ color: "var(--color-text-secondary)" }}>
            {description}
          </p>
        )}
      </div>
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: "var(--color-interactive)" }}
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: "var(--color-interactive)" }}
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
