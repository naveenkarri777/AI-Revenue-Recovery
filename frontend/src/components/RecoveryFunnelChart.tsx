import { formatINR } from "../lib/format";

export function RecoveryFunnelChart({ steps }: { steps: { label: string; value: number }[] }) {
  const max = steps[0].value;
  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const pct = Math.round((step.value / max) * 100);
        const ofPrev = i === 0 ? 100 : Math.round((step.value / steps[i - 1].value) * 100);
        return (
          <div key={step.label}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm text-[var(--color-ink-soft)] font-medium">{step.label}</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono-num text-sm font-semibold text-[var(--color-ink)]">
                  {formatINR(step.value)}
                </span>
                {i > 0 && (
                  <span className="font-mono-num text-xs text-[var(--color-ink-faint)]">{ofPrev}%</span>
                )}
              </div>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[var(--color-canvas)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-brand)] transition-all"
                style={{ width: `${pct}%`, opacity: 0.4 + (i / (steps.length - 1)) * 0.6 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
