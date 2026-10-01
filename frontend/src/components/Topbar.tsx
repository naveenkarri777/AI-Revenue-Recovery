import { Menu, Search, Bell, Sparkles } from "lucide-react";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="h-16 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3 flex-1">
        <button
          className="lg:hidden text-[var(--color-ink-soft)]"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="hidden sm:flex items-center gap-2 max-w-sm w-full rounded-md border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-1.5">
          <Search size={15} className="text-[var(--color-ink-faint)]" />
          <input
            type="text"
            placeholder="Search cases, customers..."
            className="bg-transparent text-sm outline-none placeholder:text-[var(--color-ink-faint)] w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-canvas)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink-soft)]">
          <Sparkles size={12} className="text-[var(--color-brand)]" />
          Demo Mode
        </span>
        <button className="relative text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--color-danger)]" />
        </button>
        <div className="h-8 w-8 rounded-full bg-[var(--color-brand)] text-white flex items-center justify-center text-xs font-semibold">
          RO
        </div>
      </div>
    </header>
  );
}
