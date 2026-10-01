import { cn } from "../lib/format";
import type { CaseStatus, RiskLevel } from "../data/types";

const statusStyles: Record<CaseStatus, string> = {
  Recovered: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  Active: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
  "Retry Scheduled": "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  Escalated: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  Stopped: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  Failed: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

const statusDot: Record<CaseStatus, string> = {
  Recovered: "bg-[var(--color-success)]",
  Active: "bg-[var(--color-info)]",
  "Retry Scheduled": "bg-[var(--color-warning)]",
  Escalated: "bg-[var(--color-warning)]",
  Stopped: "bg-[var(--color-danger)]",
  Failed: "bg-[var(--color-danger)]",
};

export function StatusBadge({ status, size = "sm" }: { status: CaseStatus; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        statusStyles[status],
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", statusDot[status])} />
      {status}
    </span>
  );
}

const riskStyles: Record<RiskLevel, string> = {
  High: "text-[var(--color-danger)]",
  Medium: "text-[var(--color-warning)]",
  Low: "text-[var(--color-ink-faint)]",
};

export function RiskTag({ risk }: { risk: RiskLevel }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide", riskStyles[risk])}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          risk === "High" ? "bg-[var(--color-danger)]" : risk === "Medium" ? "bg-[var(--color-warning)]" : "bg-[var(--color-ink-faint)]"
        )}
      />
      {risk}
    </span>
  );
}
