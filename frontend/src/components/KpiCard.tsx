import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "../lib/format";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  sub?: string;
  change?: number;
  accent?: "brand" | "success" | "warning" | "danger";
}

const accentBg: Record<string, string> = {
  brand: "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

export function KpiCard({ label, value, icon: Icon, sub, change, accent = "brand" }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_1px_2px_rgba(28,26,23,0.04)]">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-[var(--color-ink-soft)]">{label}</p>
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", accentBg[accent])}>
          <Icon size={16} />
        </div>
      </div>
      <p className="font-mono-num mt-3 text-[26px] font-semibold leading-none text-[var(--color-ink)]">
        {value}
      </p>
      <div className="mt-2.5 flex items-center gap-1.5 text-xs">
        {change != null && (
          <span
            className={cn(
              "inline-flex items-center font-mono-num font-semibold",
              change >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
            )}
          >
            {change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(change)}%
          </span>
        )}
        {sub && <span className="text-[var(--color-ink-faint)]">{sub}</span>}
      </div>
    </div>
  );
}
