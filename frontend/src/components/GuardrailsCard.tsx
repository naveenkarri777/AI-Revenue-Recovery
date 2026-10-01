import { CheckCircle2, XCircle, OctagonAlert } from "lucide-react";
import { cn } from "../lib/format";
import type { Guardrails, CaseStatus } from "../data/types";

function MeterRow({ label, used, max }: { label: string; used: number; max: string | number }) {
  const maxNum = typeof max === "number" ? max : 7;
  const pct = Math.min(100, (used / maxNum) * 100);
  const nearLimit = pct >= 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-[var(--color-ink-soft)]">{label}</span>
        <span className="font-mono-num text-sm font-semibold text-[var(--color-ink)]">
          {used} / {max}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--color-canvas)] overflow-hidden">
        <div
          className={cn("h-full rounded-full", nearLimit ? "bg-[var(--color-danger)]" : "bg-[var(--color-brand)]")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function GuardrailsCard({ guardrails, status }: { guardrails: Guardrails; status: CaseStatus }) {
  const checks = [
    { label: "Retry limit not exceeded", pass: guardrails.retryUsed < guardrails.retryMax || status === "Recovered" },
    { label: "Customer is eligible", pass: guardrails.eligible },
    { label: "Recovery window active", pass: guardrails.withinWindow },
    { label: "Action permitted", pass: guardrails.actionPermitted },
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <MeterRow label="Maximum Payment Retries" used={guardrails.retryUsed} max={guardrails.retryMax} />
        <MeterRow label="Maximum Customer Contacts" used={guardrails.contactUsed} max={guardrails.contactMax} />
        <MeterRow label="Recovery Window" used={guardrails.windowUsedDays} max={`${guardrails.windowMaxDays} days`} />
      </div>

      {status === "Stopped" ? (
        <div className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3.5">
          <div className="flex items-center gap-2">
            <OctagonAlert size={16} className="text-[var(--color-danger)]" />
            <p className="text-sm font-semibold text-[var(--color-danger)]">Automation stopped</p>
          </div>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1.5">Maximum retry attempts reached.</p>
          <p className="text-xs text-[var(--color-ink-faint)] mt-2 uppercase tracking-wide font-medium">Next step</p>
          <p className="text-sm text-[var(--color-ink)] font-medium">Escalate to human review.</p>
        </div>
      ) : (
        <div className="space-y-1.5 border-t border-[var(--color-border)] pt-4">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center gap-2 text-sm">
              {c.pass ? (
                <CheckCircle2 size={15} className="text-[var(--color-success)] shrink-0" />
              ) : (
                <XCircle size={15} className="text-[var(--color-danger)] shrink-0" />
              )}
              <span className={c.pass ? "text-[var(--color-ink)]" : "text-[var(--color-danger)]"}>{c.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
