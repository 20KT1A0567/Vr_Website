import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "components/ui/Badge";

interface FilterSectionProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  open: boolean;
  selectedCount?: number;
  onToggle: () => void;
  children: ReactNode;
}

export function FilterSection({ title, subtitle, icon, open, selectedCount, onToggle, children }: FilterSectionProps) {
  return (
    <section className="rounded-[1.4rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-3 rounded-[1rem] text-left">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-[var(--vr-border)] bg-white p-2.5 text-[var(--vr-primary)] shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            {icon}
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--vr-text)]">{title}</div>
            <div className="text-xs text-[var(--vr-muted)]">{subtitle ?? "Choose options"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount ? <Badge className="px-2.5 py-1 text-[10px]">{selectedCount}</Badge> : null}
          <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
