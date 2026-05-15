import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface FilterSectionProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  open: boolean;
  selectedCount?: number;
  onToggle: () => void;
  children: ReactNode;
  compact?: boolean;
}

export function FilterSection({ title, subtitle, icon, open, selectedCount, onToggle, children, compact = false }: FilterSectionProps) {
  if (compact) {
    return (
      <div className="border-b border-slate-100 py-3 last:border-0">
        <button type="button" onClick={onToggle} className="flex w-full items-center justify-between text-left">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-50 text-[var(--vr-primary)]">
                {icon}
              </div>
            )}
            <span className="text-[13px] font-bold text-slate-800">{title}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {selectedCount ? (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--vr-primary)] px-1 text-[9px] font-bold text-white">
                {selectedCount}
              </span>
            ) : null}
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </button>
        {open ? <div className="mt-3 animate-fade-in">{children}</div> : null}
      </div>
    );
  }

  /* Desktop non-compact — rendered as a row inside a shared card */
  return (
    <div className={`border-b border-[var(--vr-border)] last:border-0 ${open ? "bg-[rgba(30,58,138,0.02)]" : ""}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
          open ? "bg-[rgba(30,58,138,0.04)]" : "hover:bg-[rgba(30,58,138,0.03)]"
        }`}
      >
        {/* Colored icon */}
        {icon && (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
              open
                ? "bg-[var(--vr-primary)] text-white shadow-[0_4px_14px_rgba(30,58,138,0.28)]"
                : "bg-[rgba(30,58,138,0.08)] text-[var(--vr-primary)]"
            }`}
          >
            {icon}
          </div>
        )}

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div
            className={`text-[13.5px] font-extrabold leading-tight transition-colors ${
              open ? "text-[var(--vr-primary)]" : "text-[var(--vr-text)]"
            }`}
          >
            {title}
          </div>
          {subtitle && (
            <div className="mt-0.5 truncate text-[11px] leading-tight text-[var(--vr-muted)]">{subtitle}</div>
          )}
        </div>

        {/* Count badge + chevron */}
        <div className="flex shrink-0 items-center gap-2">
          {selectedCount ? (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--vr-primary)] px-1 text-[9px] font-extrabold text-white shadow-[0_2px_8px_rgba(30,58,138,0.3)]">
              {selectedCount}
            </span>
          ) : null}
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full transition-all ${
              open ? "bg-[var(--vr-primary)] text-white" : "bg-[rgba(30,58,138,0.06)] text-slate-400"
            }`}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </div>
      </button>

      {open ? (
        <div className="animate-fade-in border-t border-[var(--vr-border)] bg-white px-4 pb-5 pt-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}
