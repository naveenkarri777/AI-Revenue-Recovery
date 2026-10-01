import { useEffect, useState, useCallback } from "react";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { Panel } from "../components/Panel";
import { cn } from "../lib/format";
import { api } from "../lib/api";
import type { RecoveryPolicies } from "../data/types";

const DEFAULT_POLICIES: RecoveryPolicies = {
  maxPaymentRetries: 3,
  maxCustomerContacts: 2,
  maxRecoveryWindowDays: 7,
  autoEscalation: true,
  highValueThreshold: 25000,
  aiConfidenceThreshold: 80,
};

export function SettingsPage() {
  const [policies, setPolicies] = useState<RecoveryPolicies>(DEFAULT_POLICIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPolicies();
      setPolicies(data);
    } catch (err) {
      console.error("Failed to load policy settings:", err);
      setError((err as Error).message || "Failed to load policy settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  function update<K extends keyof RecoveryPolicies>(key: K, value: RecoveryPolicies[K]) {
    setPolicies((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      const updated = await api.updatePolicies(policies);
      setPolicies(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error("Failed to update policies:", err);
      setError((err as Error).message || "Failed to save policy changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-ink)] tracking-tight">Recovery Policies</h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">
          Control how the AI recovery agent is allowed to act.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={loadPolicies} className="font-medium underline hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      <Panel title="Guardrails" subtitle="Limits the automation cannot exceed without escalation">
        <div className="space-y-5">
          <NumberSetting
            label="Maximum Payment Retries"
            description="How many times the agent may retry a failed payment before escalating."
            value={policies.maxPaymentRetries}
            onChange={(v) => update("maxPaymentRetries", v)}
            min={1}
            max={5}
            disabled={loading}
          />
          <NumberSetting
            label="Maximum Customer Contacts"
            description="Number of outbound messages the agent may send per case."
            value={policies.maxCustomerContacts}
            onChange={(v) => update("maxCustomerContacts", v)}
            min={0}
            max={5}
            disabled={loading}
          />
          <NumberSetting
            label="Maximum Recovery Window (days)"
            description="Case is automatically escalated if unresolved past this window."
            value={policies.maxRecoveryWindowDays}
            onChange={(v) => update("maxRecoveryWindowDays", v)}
            min={1}
            max={30}
            disabled={loading}
          />
        </div>
      </Panel>

      <Panel title="Escalation" subtitle="When to hand a case to a human">
        <div className="space-y-5">
          <ToggleSetting
            label="Auto Escalation"
            description="Automatically escalate cases that breach guardrail limits."
            value={policies.autoEscalation}
            onChange={(v) => update("autoEscalation", v)}
            disabled={loading}
          />
          <NumberSetting
            label="Require Approval For High-Value Recovery (₹)"
            description="Recovery actions above this amount require a human sign-off."
            value={policies.highValueThreshold}
            onChange={(v) => update("highValueThreshold", v)}
            min={1000}
            max={100000}
            step={1000}
            prefix="₹"
            disabled={loading}
          />
          <NumberSetting
            label="AI Confidence Threshold (%)"
            description="Minimum confidence required before the agent acts automatically."
            value={policies.aiConfidenceThreshold}
            onChange={(v) => update("aiConfidenceThreshold", v)}
            min={50}
            max={99}
            disabled={loading}
          />
        </div>
      </Panel>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={loading || saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-strong)] disabled:opacity-50"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {saving ? "Saving..." : "Save changes"}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm text-[var(--color-success)] font-medium">
            <Check size={15} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

function NumberSetting({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  disabled,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--color-ink)]">{label}</p>
        <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 rounded-lg border border-[var(--color-border-strong)] px-2 py-1.5">
        {prefix && <span className="text-sm text-[var(--color-ink-faint)]">{prefix}</span>}
        <input
          type="number"
          value={value ?? 0}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 bg-transparent text-right font-mono-num text-sm font-semibold text-[var(--color-ink)] outline-none disabled:opacity-50"
        />
      </div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--color-ink)]">{label}</p>
        <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={cn(
          "shrink-0 h-6 w-11 rounded-full transition-colors relative disabled:opacity-50",
          value ? "bg-[var(--color-brand)]" : "bg-[var(--color-border-strong)]"
        )}
        aria-pressed={value}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow",
            value ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}
