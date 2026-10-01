import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, PiggyBank, ListTodo, CheckCircle2, PlayCircle, ChevronDown, RefreshCw, AlertCircle } from "lucide-react";
import { KpiCard } from "../components/KpiCard";
import { Panel } from "../components/Panel";
import { RevenueChart } from "../components/RevenueChart";
import { RecoveryFunnelChart } from "../components/RecoveryFunnelChart";
import { CasesTable } from "../components/CasesTable";
import { DemoBatchModal } from "../components/DemoBatchModal";
import { formatINR } from "../lib/format";
import { api } from "../lib/api";
import type { DashboardData } from "../data/types";

export function Dashboard() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await api.getDashboard();
      setData(dashboardData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError((err as Error).message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const kpis = data?.kpis || {
    revenueAtRisk: 48500,
    revenueAtRiskChange: 12.4,
    revenueRecovered: 31200,
    recoveryRate: 64.3,
    activeCases: 18,
    actionsScheduled: 7,
    successfulRecoveries: 12,
    successfulRecoveriesChange: 18.2,
  };

  const trend = data?.trend || [
    { day: "Mon", atRisk: 6200, recovered: 3800 },
    { day: "Tue", atRisk: 7100, recovered: 4600 },
    { day: "Wed", atRisk: 5800, recovered: 4100 },
    { day: "Thu", atRisk: 8300, recovered: 5200 },
    { day: "Fri", atRisk: 9100, recovered: 5900 },
    { day: "Sat", atRisk: 6600, recovered: 4300 },
    { day: "Sun", atRisk: 5400, recovered: 3300 },
  ];

  const funnel = data?.funnel || [
    { label: "Revenue at Risk", value: 48500 },
    { label: "AI Analyzed", value: 48500 },
    { label: "Recovery Actions", value: 42000 },
    { label: "Successfully Recovered", value: 31200 },
  ];

  const recentCases = data?.recentCases || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-ink)] tracking-tight">Revenue Recovery</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">Turn at-risk revenue into recovered revenue.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)] disabled:opacity-50"
            title="Refresh dashboard"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)]">
            Last 7 days
            <ChevronDown size={14} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3.5 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-strong)] shadow-sm"
          >
            <PlayCircle size={15} />
            Run Demo Batch
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={loadDashboard}
            className="font-medium underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Revenue At Risk"
          value={formatINR(kpis.revenueAtRisk)}
          icon={AlertTriangle}
          change={kpis.revenueAtRiskChange}
          sub="vs previous period"
          accent="danger"
        />
        <KpiCard
          label="Revenue Recovered"
          value={formatINR(kpis.revenueRecovered)}
          icon={PiggyBank}
          sub={`${kpis.recoveryRate}% recovery rate`}
          accent="success"
        />
        <KpiCard
          label="Active Recovery Cases"
          value={String(kpis.activeCases)}
          icon={ListTodo}
          sub={`${kpis.actionsScheduled} actions scheduled`}
          accent="brand"
        />
        <KpiCard
          label="Successful Recoveries"
          value={String(kpis.successfulRecoveries)}
          icon={CheckCircle2}
          change={kpis.successfulRecoveriesChange}
          sub="vs previous period"
          accent="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel title="Revenue Recovery" subtitle="Revenue at risk vs. recovered, last 7 days" className="lg:col-span-2">
          <div className="flex items-center gap-4 mb-1 text-xs">
            <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-soft)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-danger)]" /> Revenue at Risk
            </span>
            <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-soft)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" /> Revenue Recovered
            </span>
          </div>
          <RevenueChart data={trend} />
        </Panel>

        <Panel title="Recovery Funnel" subtitle="Where at-risk revenue goes">
          <RecoveryFunnelChart steps={funnel} />
        </Panel>
      </div>

      <Panel
        title="Recent Recovery Cases"
        subtitle="Latest revenue-risk events processed by the AI agent"
        action={
          <button
            onClick={() => navigate("/recovery-cases")}
            className="text-sm font-medium text-[var(--color-brand)] hover:text-[var(--color-brand-strong)] shrink-0"
          >
            View all
          </button>
        }
      >
        <CasesTable cases={recentCases} />
      </Panel>

      <DemoBatchModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onComplete={() => {
          loadDashboard();
        }}
      />
    </div>
  );
}
