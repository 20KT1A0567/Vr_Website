import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
  return (
    <div className={`rounded-xl border bg-white transition-all ${
      open
        ? "border-[rgba(30,58,138,0.18)] shadow-[0_2px_12px_rgba(30,58,138,0.08)]"
        : "border-[var(--vr-border)] shadow-none"
    }`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        {icon && (
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
            open
              ? "border-[rgba(30,58,138,0.2)] bg-[rgba(30,58,138,0.07)] text-[var(--vr-primary)]"
              : "border-[var(--vr-border)] bg-[var(--vr-surface-soft)] text-slate-400"
          }`}>
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className={`text-[13px] font-semibold leading-tight transition-colors ${
            open ? "text-[var(--vr-primary)]" : "text-[var(--vr-text)]"
          }`}>
            {title}
          </div>
          {subtitle && (
            <div className={`mt-0.5 truncate text-[11px] transition-colors ${
              open ? "text-[rgba(30,58,138,0.55)]" : "text-[var(--vr-muted)]"
            }`}>
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {selectedCount ? (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--vr-primary)] px-1 text-[9px] font-extrabold text-white">
              {selectedCount}
            </span>
          ) : null}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              open ? "rotate-180 text-[var(--vr-primary)]" : "text-slate-400"
            }`}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className={`border-t border-[var(--vr-border)] px-3 pb-3 pt-3 ${compact ? "" : "bg-[var(--vr-surface-soft)]"}`}>
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
