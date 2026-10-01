import { CheckCircle2, XCircle, Clock, Info } from "lucide-react";
import { cn } from "../lib/format";
import { fmtTime } from "../data/mockData";
import type { AuditEntry } from "../data/types";

const statusIcon: Record<AuditEntry["status"], typeof CheckCircle2> = {
  success: CheckCircle2,
  failure: XCircle,
  pending: Clock,
  info: Info,
};

const statusColor: Record<AuditEntry["status"], string> = {
  success: "text-[var(--color-success)]",
  failure: "text-[var(--color-danger)]",
  pending: "text-[var(--color-warning)]",
  info: "text-[var(--color-info)]",
};

export function AuditLog({ entries }: { entries: AuditEntry[] }) {
  return (
    <div className="divide-y divide-[var(--color-border)]">
      {entries.map((entry, i) => {
        const Icon = statusIcon[entry.status];
        return (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <Icon size={15} className={cn("shrink-0", statusColor[entry.status])} />
            <div className="flex-1 min-w-0">
              <p className="font-mono-num text-[12.5px] font-semibold text-[var(--color-ink)] tracking-tight">
                {entry.action}
              </p>
              <p className="text-xs text-[var(--color-ink-faint)]">
                {entry.actor} — {entry.result}
              </p>
            </div>
            <span className="font-mono-num text-xs text-[var(--color-ink-faint)] shrink-0">
              {fmtTime(entry.timestamp)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
