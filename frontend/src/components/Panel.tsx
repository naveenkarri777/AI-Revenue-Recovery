import type { ReactNode } from "react";
import { cn } from "../lib/format";

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_2px_rgba(28,26,23,0.04)]", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between px-5 pt-5 pb-1">
          <div>
            {title && <h3 className="text-[15px] font-semibold text-[var(--color-ink)]">{title}</h3>}
            {subtitle && <p className="text-sm text-[var(--color-ink-faint)] mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
