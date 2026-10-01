import { useEffect, useState, useRef } from "react";
import { X, Check, Loader2, PlayCircle, AlertCircle } from "lucide-react";
import { formatINR, cn } from "../lib/format";
import { api } from "../lib/api";
import type { BatchResult } from "../data/types";

type Phase = "confirm" | "processing" | "result";

const PROCESSING_STEPS = [
  "Detecting revenue risk",
  "Analyzing customer history",
  "Selecting recovery strategies",
  "Validating policies",
  "Executing recovery actions",
  "Calculating recovery results",
];

const DEFAULT_RESULT: BatchResult = {
  atRisk: 50000,
  recovered: 32000,
  rate: 64,
  successful: 12,
  escalated: 3,
  stoppedFailed: 5,
};

export function DemoBatchModal({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: (result: BatchResult) => void;
}) {
  const [phase, setPhase] = useState<Phase>("confirm");
  const [stepIndex, setStepIndex] = useState(0);
  const [caseCount, setCaseCount] = useState(0);
  const [batchResult, setBatchResult] = useState<BatchResult>(DEFAULT_RESULT);
  const [error, setError] = useState<string | null>(null);
  const apiCompleteRef = useRef<boolean>(false);

  useEffect(() => {
    if (!open) {
      setPhase("confirm");
      setStepIndex(0);
      setCaseCount(0);
      setError(null);
      apiCompleteRef.current = false;
    }
  }, [open]);

  const startSimulation = async () => {
    setPhase("processing");
    setError(null);
    setStepIndex(0);
    setCaseCount(0);
    apiCompleteRef.current = false;

    try {
      // Trigger real backend batch simulation
      const resultPromise = api.runDemoBatch(20);

      // Step animation timers
      const stepTimer = setInterval(() => {
        setStepIndex((s) => Math.min(PROCESSING_STEPS.length, s + 1));
      }, 450);

      const countTimer = setInterval(() => {
        setCaseCount((c) => Math.min(20, c + Math.ceil(Math.random() * 3)));
      }, 220);

      const realResult = await resultPromise;
      apiCompleteRef.current = true;
      setBatchResult(realResult);

      clearInterval(stepTimer);
      clearInterval(countTimer);
      setStepIndex(PROCESSING_STEPS.length);
      setCaseCount(20);

      setTimeout(() => setPhase("result"), 400);
    } catch (err) {
      console.error("Batch simulation failed:", err);
      setError((err as Error).message || "Failed to execute batch simulation");
      setPhase("confirm");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={phase === "processing" ? undefined : onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl overflow-hidden">
        {phase !== "processing" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}

        {phase === "confirm" && (
          <div className="p-6">
            <div className="h-10 w-10 rounded-lg bg-[var(--color-brand-soft)] flex items-center justify-center mb-4">
              <PlayCircle size={20} className="text-[var(--color-brand)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">Run Recovery Simulation</h2>
            <p className="text-sm text-[var(--color-ink-soft)] mt-2">
              This will process 20 simulated revenue-risk events through the AI recovery workflow on the backend.
            </p>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-[var(--color-danger-soft)] text-[var(--color-danger)] text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-3">
                <p className="text-xs text-[var(--color-ink-faint)] uppercase tracking-wide">Cases</p>
                <p className="font-mono-num text-xl font-semibold text-[var(--color-ink)] mt-0.5">20</p>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-3">
                <p className="text-xs text-[var(--color-ink-faint)] uppercase tracking-wide">Revenue at Risk</p>
                <p className="font-mono-num text-xl font-semibold text-[var(--color-ink)] mt-0.5">{formatINR(50000)}</p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-[var(--color-border-strong)] py-2.5 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)]"
              >
                Cancel
              </button>
              <button
                onClick={startSimulation}
                className="flex-1 rounded-lg bg-[var(--color-brand)] py-2.5 text-sm font-medium text-white hover:bg-[var(--color-brand-strong)]"
              >
                Run Simulation
              </button>
            </div>
          </div>
        )}

        {phase === "processing" && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Loader2 size={16} className="animate-spin text-[var(--color-brand)]" />
              <h2 className="text-base font-semibold text-[var(--color-ink)]">AI Recovery Engine</h2>
            </div>
            <p className="text-sm text-[var(--color-ink-soft)] mb-5">Processing 20 cases in real-time...</p>
            <div className="space-y-2.5 mb-5">
              {PROCESSING_STEPS.map((step, i) => {
                const done = i < stepIndex;
                const active = i === stepIndex;
                return (
                  <div key={step} className="flex items-center gap-2.5 text-sm">
                    <span
                      className={cn(
                        "h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                        done ? "bg-[var(--color-success)] text-white" : active ? "border-2 border-[var(--color-brand)]" : "border border-[var(--color-border-strong)]"
                      )}
                    >
                      {done && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className={done || active ? "text-[var(--color-ink)]" : "text-[var(--color-ink-faint)]"}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[var(--color-ink-faint)]">Progress</span>
              <span className="font-mono-num font-semibold text-[var(--color-ink)]">{caseCount} / 20</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--color-canvas)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-brand)] transition-all duration-200"
                style={{ width: `${(caseCount / 20) * 100}%` }}
              />
            </div>
          </div>
        )}

        {phase === "result" && (
          <div className="p-6">
            <div className="h-10 w-10 rounded-lg bg-[var(--color-success-soft)] flex items-center justify-center mb-4">
              <Check size={20} className="text-[var(--color-success)]" strokeWidth={3} />
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">Batch Complete</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ResultStat label="Revenue At Risk" value={formatINR(batchResult.atRisk)} />
              <ResultStat label="Revenue Recovered" value={formatINR(batchResult.recovered)} accent="success" />
              <ResultStat label="Recovery Rate" value={`${batchResult.rate}%`} accent="success" />
              <ResultStat label="Successful Recoveries" value={String(batchResult.successful)} accent="success" />
              <ResultStat label="Escalated" value={String(batchResult.escalated)} accent="warning" />
              <ResultStat label="Stopped / Failed" value={String(batchResult.stoppedFailed)} accent="danger" />
            </div>
            <button
              onClick={() => {
                onComplete(batchResult);
                onClose();
              }}
              className="mt-6 w-full rounded-lg bg-[var(--color-brand)] py-2.5 text-sm font-medium text-white hover:bg-[var(--color-brand-strong)]"
            >
              View Recovery Cases
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "success" | "warning" | "danger";
}) {
  const color = accent
    ? {
        success: "text-[var(--color-success)]",
        warning: "text-[var(--color-warning)]",
        danger: "text-[var(--color-danger)]",
      }[accent]
    : "text-[var(--color-ink)]";
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-3">
      <p className="text-xs text-[var(--color-ink-faint)]">{label}</p>
      <p className={cn("font-mono-num text-lg font-semibold mt-0.5", color)}>{value}</p>
    </div>
  );
}
