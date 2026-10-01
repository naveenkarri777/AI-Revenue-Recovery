import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  ListChecks,
  Activity,
  ShieldCheck,
  Settings,
  HelpCircle,
  X,
  Radar,
} from "lucide-react";
import { cn } from "../lib/format";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { section: "Overview", items: [{ to: "/", label: "Dashboard", icon: LayoutGrid, end: true }] },
  {
    section: "Revenue",
    items: [
      { to: "/recovery-cases", label: "Recovery Cases", icon: ListChecks, end: false },
      { to: "/activity", label: "Revenue Events", icon: Radar, end: false, alias: "/activity" },
    ],
  },
  {
    section: "Operations",
    items: [
      { to: "/activity", label: "Activity", icon: Activity, end: false, hideIfAliased: true },
      { to: "/settings", label: "Recovery Policies", icon: ShieldCheck, end: false },
    ],
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed z-50 inset-y-0 left-0 w-64 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-[var(--color-brand)] flex items-center justify-center">
              <span className="font-mono-num text-[11px] font-semibold text-white">RR</span>
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-[var(--color-ink)]">
              AI Revenue Recovery
            </span>
          </div>
          <button className="lg:hidden text-[var(--color-ink-soft)]" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navItems.map((group) => (
            <div key={group.section}>
              <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items
                  .filter((item) => !("hideIfAliased" in item && item.hideIfAliased))
                  .map((item) => (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]"
                            : "text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]"
                        )
                      }
                    >
                      <item.icon size={16} strokeWidth={2} />
                      {item.label}
                    </NavLink>
                  ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--color-border)] px-3 py-3 space-y-0.5">
          <button className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]">
            <Settings size={16} />
            Settings
          </button>
          <button className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]">
            <HelpCircle size={16} />
            Help
          </button>
        </div>

        <div className="px-4 py-3 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-success)]" />
            </span>
            <span className="text-[var(--color-ink-soft)] font-medium">AI Recovery Engine</span>
          </div>
          <p className="pl-4 text-[11px] text-[var(--color-success)] font-medium mt-0.5">Operational</p>
        </div>
      </aside>
    </>
  );
}
