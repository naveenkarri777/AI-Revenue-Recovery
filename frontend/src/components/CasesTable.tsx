import { useNavigate } from "react-router-dom";
import { StatusBadge, RiskTag } from "./StatusBadge";
import { formatINR, relativeTime } from "../lib/format";
import type { RecoveryCase } from "../data/types";
import { EmptyState } from "./EmptyState";
import { Inbox } from "lucide-react";

interface CasesTableProps {
  cases: RecoveryCase[];
  variant?: "compact" | "full";
}

export function CasesTable({ cases, variant = "full" }: CasesTableProps) {
  const navigate = useNavigate();

  if (cases.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No recovery cases"
        description="All recoverable revenue is currently being handled. New cases will appear here as risk is detected."
      />
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm min-w-[860px]">
        <thead>
          <tr className="text-left border-b border-[var(--color-border)]">
            <th className="px-3 py-2.5 font-medium text-[var(--color-ink-faint)] text-xs uppercase tracking-wide">Case</th>
            <th className="px-3 py-2.5 font-medium text-[var(--color-ink-faint)] text-xs uppercase tracking-wide">Customer</th>
            <th className="px-3 py-2.5 font-medium text-[var(--color-ink-faint)] text-xs uppercase tracking-wide">Amount</th>
            <th className="px-3 py-2.5 font-medium text-[var(--color-ink-faint)] text-xs uppercase tracking-wide">Risk</th>
            {variant === "full" && (
              <th className="px-3 py-2.5 font-medium text-[var(--color-ink-faint)] text-xs uppercase tracking-wide">Root Cause</th>
            )}
            <th className="px-3 py-2.5 font-medium text-[var(--color-ink-faint)] text-xs uppercase tracking-wide">AI Strategy</th>
            <th className="px-3 py-2.5 font-medium text-[var(--color-ink-faint)] text-xs uppercase tracking-wide">Status</th>
            <th className="px-3 py-2.5 font-medium text-[var(--color-ink-faint)] text-xs uppercase tracking-wide">Updated</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr
              key={c.id}
              onClick={() => navigate(`/recovery-cases/${c.id}`)}
              className="border-b border-[var(--color-border)] last:border-0 cursor-pointer hover:bg-[var(--color-canvas)] transition-colors"
            >
              <td className="px-3 py-3 font-mono-num font-medium text-[var(--color-ink)]">{c.id}</td>
              <td className="px-3 py-3 text-[var(--color-ink)]">{c.customerName}</td>
              <td className="px-3 py-3 font-mono-num font-medium text-[var(--color-ink)]">{formatINR(c.amountAtRisk)}</td>
              <td className="px-3 py-3">
                <RiskTag risk={c.risk} />
              </td>
              {variant === "full" && <td className="px-3 py-3 text-[var(--color-ink-soft)]">{c.rootCause}</td>}
              <td className="px-3 py-3 text-[var(--color-ink-soft)]">{c.strategy}</td>
              <td className="px-3 py-3">
                <StatusBadge status={c.status} />
              </td>
              <td className="px-3 py-3 text-[var(--color-ink-faint)] font-mono-num text-xs">
                {relativeTime(c.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
