import { Check, X, Circle } from "lucide-react";
import { cn } from "../lib/format";
import type { CaseStatus } from "../data/types";

const STAGES = ["Detect", "Diagnose", "Decide", "Validate", "Act", "Recover", "Measure"] as const;

type StageState = "done" | "current" | "pending" | "skipped";

function stagesForStatus(status: CaseStatus): StageState[] {
  switch (status) {
    case "Recovered":
      return ["done", "done", "done", "done", "done", "done", "done"];
    case "Active":
    case "Retry Scheduled":
      return ["done", "done", "done", "done", "current", "pending", "pending"];
    case "Escalated":
    case "Stopped":
    case "Failed":
      return ["done", "done", "done", "done", "done", "skipped", "done"];
    default:
      return ["done", "done", "done", "done", "pending", "pending", "pending"];
  }
}

export function ProcessRail({ status }: { status: CaseStatus }) {
  const states = stagesForStatus(status);
  return (
    <div className="flex items-center w-full overflow-x-auto no-scrollbar">
      {STAGES.map((stage, i) => {
        const state = states[i];
        return (
          <div key={stage} className="flex items-center flex-1 min-w-[74px]">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center shrink-0 border",
                  state === "done" && "bg-[var(--color-brand)] border-[var(--color-brand)] text-white",
                  state === "current" && "border-[var(--color-brand)] text-[var(--color-brand)] bg-[var(--color-brand-soft)] animate-pulse",
                  state === "pending" && "border-[var(--color-border-strong)] text-[var(--color-ink-faint)]",
                  state === "skipped" && "bg-[var(--color-warning-soft)] border-[var(--color-warning)] text-[var(--color-warning)]"
                )}
              >
                {state === "done" && <Check size={13} strokeWidth={3} />}
                {state === "skipped" && <X size={13} strokeWidth={3} />}
                {(state === "current" || state === "pending") && <Circle size={8} fill="currentColor" />}
              </div>
              <span
                className={cn(
                  "text-[10.5px] font-semibold uppercase tracking-wide whitespace-nowrap",
                  state === "done" && "text-[var(--color-brand-strong)]",
                  state === "current" && "text-[var(--color-brand)]",
                  state === "pending" && "text-[var(--color-ink-faint)]",
                  state === "skipped" && "text-[var(--color-warning)]"
                )}
              >
                {stage}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 mx-1 mb-4",
                  states[i + 1] === "pending" ? "bg-[var(--color-border-strong)]" : "bg-[var(--color-brand)]",
                  state === "skipped" && "bg-[var(--color-warning)]"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
