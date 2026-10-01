import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Brain, Gauge, History, Zap, Clock, ShieldCheck, X, RefreshCw, AlertCircle, PlayCircle, Loader2 } from "lucide-react";
import { Panel } from "../components/Panel";
import { StatusBadge } from "../components/StatusBadge";
import { ProcessRail } from "../components/ProcessRail";
import { GuardrailsCard } from "../components/GuardrailsCard";
import { RecoveryTimeline } from "../components/RecoveryTimeline";
import { AuditLog } from "../components/AuditLog";
import { formatINR, fmtDateTime } from "../lib/format";
import { api } from "../lib/api";
import type { RecoveryCase } from "../data/types";

export function RecoveryCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [actionOpen, setActionOpen] = useState(false);
  const [recoveryCase, setRecoveryCase] = useState<RecoveryCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadCase = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCaseById(id);
      setRecoveryCase(data);
    } catch (err) {
      console.error("Failed to load recovery case:", err);
      setError((err as Error).message || "Recovery case not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  const handleProcessAction = async () => {
    if (!id) return;
    try {
      setProcessing(true);
      setActionMessage(null);
      const updated = await api.processCase(id);
      setRecoveryCase(updated);
      setActionMessage(`Case #${id} processed: ${updated.status}`);
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err) {
      console.error("Failed to process case:", err);
      setError((err as Error).message || "Failed to process recovery action");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="animate-spin text-[var(--color-brand)]" size={32} />
        <p className="text-sm text-[var(--color-ink-soft)]">Loading recovery case details...</p>
      </div>
    );
  }

  if (error || !recoveryCase) {
    return (
      <div className="space-y-6">
        <Link
          to="/recovery-cases"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          <ChevronLeft size={15} />
          Recovery Cases
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle size={28} className="text-red-600 mx-auto mb-2" />
          <h2 className="text-base font-semibold text-red-900">Case Not Found</h2>
          <p className="text-sm text-red-700 mt-1">{error || `Recovery case #${id} does not exist.`}</p>
          <button
            onClick={() => navigate("/recovery-cases")}
            className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Back to Recovery Cases
          </button>
        </div>
      </div>
    );
  }

  const c = recoveryCase;
  const isRecovered = c.status === "Recovered";
  const canProcess = c.status !== "Recovered" && c.status !== "Stopped";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/recovery-cases"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          <ChevronLeft size={15} />
          Recovery Cases
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={loadCase}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)] disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          {canProcess && (
            <button
              onClick={handleProcessAction}
              disabled={processing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-brand-strong)] disabled:opacity-50"
            >
              {processing ? <Loader2 size={13} className="animate-spin" /> : <PlayCircle size={13} />}
              {processing ? "Processing AI Action..." : "Run AI Recovery Action"}
            </button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex items-center gap-2">
          <Zap size={15} />
          <span>{actionMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-semibold text-[var(--color-ink)] tracking-tight font-mono-num">
              Recovery Case #{c.id}
            </h1>
            <StatusBadge status={c.status} size="md" />
          </div>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">Payment recovery</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs text-[var(--color-ink-faint)] uppercase tracking-wide">
            {isRecovered ? "Recovered" : "Revenue at Risk"}
          </p>
          <p
            className={`font-mono-num text-2xl font-semibold ${
              isRecovered ? "text-[var(--color-success)]" : "text-[var(--color-ink)]"
            }`}
          >
            {formatINR(isRecovered ? c.amountRecovered : c.amountAtRisk)}
          </p>
        </div>
      </div>

      <Panel>
        <ProcessRail status={c.status} />
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Panel title="Case Details">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">
              <Field label="Customer" value={c.customerName} />
              <Field label="Customer ID" value={c.customerId} mono />
              <Field label="Payment" value={c.paymentId} mono />
              <Field label="Amount" value={formatINR(c.amountAtRisk)} mono />
              <Field label="Payment Method" value={c.paymentMethod} />
              <Field label="Created" value={fmtDateTime(c.createdAt)} mono />
            </div>
          </Panel>

          <Panel title="AI Analysis">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <MiniStat icon={Brain} label="Root Cause" value={c.rootCause} />
              <MiniStat
                icon={Gauge}
                label="Risk Level"
                value={c.risk.toUpperCase()}
                valueClass={
                  c.risk === "High"
                    ? "text-[var(--color-danger)]"
                    : c.risk === "Medium"
                    ? "text-[var(--color-warning)]"
                    : "text-[var(--color-ink-faint)]"
                }
              />
              <MiniStat
                icon={ShieldCheck}
                label="AI Confidence"
                value={`${c.aiConfidence}%`}
                valueClass="text-[var(--color-brand)]"
              />
            </div>

            <div className="rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] p-4 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <History size={14} className="text-[var(--color-ink-faint)]" />
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
                  Customer Payment History
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="font-mono-num text-lg font-semibold text-[var(--color-success)]">
                    {c.history.successfulPayments}
                  </p>
                  <p className="text-xs text-[var(--color-ink-faint)]">successful payments</p>
                </div>
                <div>
                  <p className="font-mono-num text-lg font-semibold text-[var(--color-danger)]">
                    {c.history.previousFailures}
                  </p>
                  <p className="text-xs text-[var(--color-ink-faint)]">
                    previous failure{c.history.previousFailures === 1 ? "" : "s"}
                  </p>
                </div>
                <div>
                  <p className="font-mono-num text-lg font-semibold text-[var(--color-ink)]">
                    {formatINR(c.history.totalPaid)}
                  </p>
                  <p className="text-xs text-[var(--color-ink-faint)]">total successfully paid</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)] mb-1.5">Why this decision?</p>
              <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">{c.reasoning}</p>
              <p className="text-sm text-[var(--color-ink-soft)] mt-2">
                <span className="font-medium text-[var(--color-ink)]">Recommended recovery: </span>
                {c.strategyDetail}
              </p>
            </div>
          </Panel>

          <Panel title="Recovery Timeline">
            <RecoveryTimeline events={c.timeline} />
          </Panel>

          <Panel title="Audit Trail">
            <AuditLog entries={c.auditLog} />
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Recovery Strategy">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[var(--color-ink-faint)] uppercase tracking-wide mb-1">Selected Action</p>
                <p className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)] px-2.5 py-1 text-sm font-semibold uppercase tracking-wide">
                  <Zap size={13} />
                  {c.strategy}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[var(--color-ink-faint)] uppercase tracking-wide mb-1">Maximum Attempts</p>
                  <p className="font-mono-num text-lg font-semibold text-[var(--color-ink)]">{c.guardrails.retryMax}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-ink-faint)] uppercase tracking-wide mb-1">Current Attempt</p>
                  <p className="font-mono-num text-lg font-semibold text-[var(--color-ink)]">
                    {Math.min(c.guardrails.retryUsed + 1, c.guardrails.retryMax)} / {c.guardrails.retryMax}
                  </p>
                </div>
              </div>

              {c.nextActionLabel && (
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-3.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock size={13} className="text-[var(--color-ink-faint)]" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Next Action</p>
                  </div>
                  <p className="text-sm text-[var(--color-ink)]">{c.nextActionLabel}</p>
                  {c.nextActionAt && (
                    <p className="font-mono-num text-sm font-semibold text-[var(--color-ink)] mt-1">
                      {fmtDateTime(c.nextActionAt)}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={() => setActionOpen(true)}
                className="w-full rounded-lg border border-[var(--color-border-strong)] py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)]"
              >
                View Action
              </button>
            </div>
          </Panel>

          <Panel title="Recovery Guardrails">
            <GuardrailsCard guardrails={c.guardrails} status={c.status} />
          </Panel>
        </div>
      </div>

      {actionOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setActionOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl p-6">
            <button
              onClick={() => setActionOpen(false)}
              className="absolute top-4 right-4 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
            >
              <X size={18} />
            </button>
            <p className="text-xs text-[var(--color-ink-faint)] uppercase tracking-wide mb-1">Action Detail</p>
            <h3 className="text-base font-semibold text-[var(--color-ink)] mb-3">{c.strategy}</h3>
            <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">{c.strategyDetail}</p>
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-sm">
              <span className="text-[var(--color-ink-faint)]">Case</span>
              <span className="font-mono-num font-medium text-[var(--color-ink)]">{c.id}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-ink-faint)] mb-0.5">{label}</p>
      <p className={`text-sm font-medium text-[var(--color-ink)] ${mono ? "font-mono-num" : ""}`}>{value}</p>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: typeof Brain;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={13} className="text-[var(--color-ink-faint)]" />
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">{label}</p>
      </div>
      <p className={`text-[15px] font-semibold ${valueClass ?? "text-[var(--color-ink)]"}`}>{value}</p>
    </div>
  );
}
