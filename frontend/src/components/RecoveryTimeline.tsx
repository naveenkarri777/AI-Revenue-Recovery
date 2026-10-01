import { Radar, Brain, GitBranch, ShieldCheck, Zap, CheckCircle2, XCircle, UserCog } from "lucide-react";
import { cn } from "../lib/format";
import { fmtDateTime } from "../data/mockData";
import type { TimelineEvent } from "../data/types";

const kindStyles: Record<TimelineEvent["kind"], { icon: typeof Radar; ring: string; bg: string }> = {
  detect: { icon: Radar, ring: "ring-[var(--color-info)]", bg: "bg-[var(--color-info)]" },
  diagnose: { icon: Brain, ring: "ring-[var(--color-brand)]", bg: "bg-[var(--color-brand)]" },
  decide: { icon: GitBranch, ring: "ring-[var(--color-brand)]", bg: "bg-[var(--color-brand)]" },
  validate: { icon: ShieldCheck, ring: "ring-[var(--color-brand)]", bg: "bg-[var(--color-brand)]" },
  act: { icon: Zap, ring: "ring-[var(--color-warning)]", bg: "bg-[var(--color-warning)]" },
  recover: { icon: CheckCircle2, ring: "ring-[var(--color-success)]", bg: "bg-[var(--color-success)]" },
  stop: { icon: XCircle, ring: "ring-[var(--color-danger)]", bg: "bg-[var(--color-danger)]" },
  escalate: { icon: UserCog, ring: "ring-[var(--color-warning)]", bg: "bg-[var(--color-warning)]" },
};

export function RecoveryTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative">
      {events.map((event, i) => {
        const style = kindStyles[event.kind];
        const Icon = style.icon;
        const isLast = i === events.length - 1;
        return (
          <li key={i} className="relative pl-9 pb-6 last:pb-0">
            {!isLast && (
              <span className="absolute left-[13px] top-6 bottom-0 w-px bg-[var(--color-border)]" />
            )}
            <span
              className={cn(
                "absolute left-0 top-0 h-[26px] w-[26px] rounded-full flex items-center justify-center text-white",
                style.bg
              )}
            >
              <Icon size={13} />
            </span>
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="text-sm font-semibold text-[var(--color-ink)]">{event.label}</p>
                <span className="font-mono-num text-[11px] text-[var(--color-ink-faint)]">
                  {fmtDateTime(event.timestamp)}
                </span>
              </div>
              <p className="text-sm text-[var(--color-ink-soft)] mt-0.5">{event.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
