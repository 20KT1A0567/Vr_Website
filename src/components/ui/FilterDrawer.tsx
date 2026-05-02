import type { ReactNode } from "react";
import { X } from "lucide-react";

interface FilterDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function FilterDrawer({ open, title, onClose, children, footer }: FilterDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" aria-label="Close filters" className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]" onClick={onClose} />
      <aside className="absolute bottom-0 left-0 right-0 flex h-[100dvh] flex-col rounded-t-[1.8rem] bg-white shadow-[0_-24px_60px_rgba(15,23,42,0.18)]">
        <div className="border-b border-[var(--vr-border)] px-4 pb-4 pt-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--vr-primary)]">Catalog tools</div>
              <h3 className="mt-1 text-xl font-bold text-[var(--vr-text)]">{title}</h3>
            </div>
            <button type="button" className="rounded-full border border-[var(--vr-border)] p-2 text-slate-500" onClick={onClose}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {children}
        </div>
        {footer ? <div className="border-t border-[var(--vr-border)] bg-white px-4 pb-4 pt-3">{footer}</div> : null}
      </aside>
    </div>
  );
}
