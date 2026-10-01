import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="h-11 w-11 rounded-full bg-[var(--color-canvas)] border border-[var(--color-border)] flex items-center justify-center mb-3">
        <Icon size={18} className="text-[var(--color-ink-faint)]" />
      </div>
      <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>
      <p className="text-sm text-[var(--color-ink-faint)] mt-1 max-w-xs">{description}</p>
    </div>
  );
}
