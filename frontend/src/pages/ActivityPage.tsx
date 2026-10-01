import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, RotateCw, UserCog, OctagonAlert, Radar, Inbox, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { Panel } from "../components/Panel";
import { EmptyState } from "../components/EmptyState";
import { cn, relativeTime } from "../lib/format";
import { api } from "../lib/api";
import type { ActivityItem } from "../data/types";

const FILTERS: (ActivityItem["category"] | "All")[] = [
  "All",
  "AI Decision",
  "Recovery Action",
  "Successful",
  "Failed",
  "Escalated",
];

const iconMap: Record<ActivityItem["icon"], { icon: typeof CheckCircle2; color: string }> = {
  success: { icon: CheckCircle2, color: "text-[var(--color-success)] bg-[var(--color-success-soft)]" },
  retry: { icon: RotateCw, color: "text-[var(--color-info)] bg-[var(--color-info-soft)]" },
  escalate: { icon: UserCog, color: "text-[var(--color-warning)] bg-[var(--color-warning-soft)]" },
  stop: { icon: OctagonAlert, color: "text-[var(--color-danger)] bg-[var(--color-danger-soft)]" },
  detect: { icon: Radar, color: "text-[var(--color-brand)] bg-[var(--color-brand-soft)]" },
};

function groupByDay(items: ActivityItem[]) {
  const now = new Date();
  const groups: Record<string, ActivityItem[]> = {};
  for (const item of items) {
    const d = new Date(item.timestamp);
    const isToday = d.toDateString() === now.toDateString();
    const key = isToday ? "Today" : d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    groups[key] = groups[key] || [];
    groups[key].push(item);
  }
  return groups;
}

export function ActivityPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [feed, setFeed] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await api.getActivityFeed(50);
      setFeed(items);
    } catch (err) {
      console.error("Failed to load activity feed:", err);
      setError((err as Error).message || "Failed to load activity feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const filtered = useMemo(() => {
    const sorted = [...feed].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return filter === "All" ? sorted : sorted.filter((a) => a.category === filter);
  }, [feed, filter]);

  const grouped = groupByDay(filtered);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-ink)] tracking-tight">Activity</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">A live feed of AI decisions and recovery actions.</p>
        </div>
        <button
          onClick={loadActivity}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)] disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium border transition-colors",
              filter === f
                ? "bg-[var(--color-brand)] border-[var(--color-brand)] text-white"
                : "border-[var(--color-border-strong)] text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)]"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={loadActivity} className="font-medium underline hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      <Panel>
        {loading && feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-2">
            <Loader2 className="animate-spin text-[var(--color-brand)]" size={24} />
            <p className="text-xs text-[var(--color-ink-soft)]">Loading live activity feed...</p>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <EmptyState icon={Inbox} title="No activity" description="Nothing matches this filter yet." />
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([day, items]) => (
              <div key={day}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)] mb-2.5">
                  {day}
                </p>
                <div className="space-y-1">
                  {items.map((item) => {
                    const iconConfig = iconMap[item.icon] || iconMap.detect;
                    const { icon: Icon, color } = iconConfig;
                    return (
                      <Link
                        key={item.id}
                        to={`/recovery-cases/${item.caseId}`}
                        className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-[var(--color-canvas)] transition-colors"
                      >
                        <span className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", color)}>
                          <Icon size={15} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--color-ink)] font-medium">{item.message}</p>
                          <p className="font-mono-num text-xs text-[var(--color-ink-faint)]">Case {item.caseId}</p>
                        </div>
                        <span className="text-xs text-[var(--color-ink-faint)] shrink-0">
                          {relativeTime(item.timestamp)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
