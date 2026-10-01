import { useEffect, useState, useCallback } from "react";
import { Search, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";
import { CasesTable } from "../components/CasesTable";
import { Panel } from "../components/Panel";
import { cn } from "../lib/format";
import { api } from "../lib/api";
import type { CaseStatus, RiskLevel, RecoveryCase, StatusStats } from "../data/types";

const STATUS_OPTIONS: (CaseStatus | "All Statuses")[] = [
  "All Statuses",
  "Active",
  "Retry Scheduled",
  "Recovered",
  "Escalated",
  "Stopped",
  "Failed",
];
const RISK_OPTIONS: (RiskLevel | "All Risk")[] = ["All Risk", "High", "Medium", "Low"];

const PAGE_SIZE = 10;

export function RecoveryCases() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("All Statuses");
  const [risk, setRisk] = useState<(typeof RISK_OPTIONS)[number]>("All Risk");
  const [page, setPage] = useState(1);

  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<StatusStats>({
    all: 0,
    active: 0,
    recovered: 0,
    escalated: 0,
    stopped: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getRecoveryCases({
        query: query.trim() || undefined,
        status: status !== "All Statuses" ? status : undefined,
        risk: risk !== "All Risk" ? risk : undefined,
        page,
        pageSize: PAGE_SIZE,
      });

      setCases(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error("Failed to load recovery cases:", err);
      setError((err as Error).message || "Failed to load recovery cases");
    } finally {
      setLoading(false);
    }
  }, [query, status, risk, page]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-ink)] tracking-tight">Recovery Cases</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">Monitor every revenue recovery workflow.</p>
        </div>
        <button
          onClick={loadCases}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)] disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatTile label="All Cases" value={stats.all} />
        <StatTile label="Active" value={stats.active} accent="info" />
        <StatTile label="Recovered" value={stats.recovered} accent="success" />
        <StatTile label="Escalated" value={stats.escalated} accent="warning" />
        <StatTile label="Stopped" value={stats.stopped} accent="danger" />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={loadCases} className="font-medium underline hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      <Panel>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2">
            <Search size={15} className="text-[var(--color-ink-faint)]" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search cases..."
              className="bg-transparent text-sm outline-none placeholder:text-[var(--color-ink-faint)] w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={status}
              onChange={(v) => {
                setStatus(v as typeof status);
                setPage(1);
              }}
              options={STATUS_OPTIONS}
            />
            <Select
              value={risk}
              onChange={(v) => {
                setRisk(v as typeof risk);
                setPage(1);
              }}
              options={RISK_OPTIONS}
            />
            <Select value="Date Range" onChange={() => {}} options={["Date Range", "Last 7 days", "Last 30 days", "All time"]} />
          </div>
        </div>

        <CasesTable cases={cases} />

        {total > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-ink-faint)]">
              Showing <span className="font-mono-num font-medium text-[var(--color-ink)]">{cases.length}</span> of{" "}
              <span className="font-mono-num font-medium text-[var(--color-ink)]">{total}</span> cases
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="h-7 w-7 rounded-md border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-ink-soft)] disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-mono-num text-[var(--color-ink-soft)] px-1">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="h-7 w-7 rounded-md border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-ink-soft)] disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "info" | "success" | "warning" | "danger";
}) {
  const color = accent
    ? {
        info: "text-[var(--color-info)]",
        success: "text-[var(--color-success)]",
        warning: "text-[var(--color-warning)]",
        danger: "text-[var(--color-danger)]",
      }[accent]
    : "text-[var(--color-ink)]";
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <p className="text-xs text-[var(--color-ink-faint)]">{label}</p>
      <p className={cn("font-mono-num text-xl font-semibold mt-0.5", color)}>{value}</p>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-3 pr-8 py-2 text-sm font-medium text-[var(--color-ink-soft)] cursor-pointer hover:bg-[var(--color-canvas)] outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)] pointer-events-none" />
    </div>
  );
}
