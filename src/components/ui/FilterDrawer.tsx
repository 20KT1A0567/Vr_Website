import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface FilterDrawerProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  eyebrow?: string;
  headerAction?: ReactNode;
  maxHeightClassName?: string;
}

export function FilterDrawer({
  open,
  title,
  onClose,
  children,
  footer,
  eyebrow = "Catalog tools",
  headerAction,
  maxHeightClassName = "h-[85vh]"
}: FilterDrawerProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    document.body.style.overflow = "hidden";
    document.body.dataset.mobileOverlay = "true";

    return () => {
      document.body.style.overflow = "";
      delete document.body.dataset.mobileOverlay;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" aria-label="Close filters" className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]" onClick={onClose} />
      <aside className={`absolute bottom-0 left-0 right-0 flex flex-col rounded-t-[24px] bg-white shadow-[0_-24px_60px_rgba(15,23,42,0.18)] ${maxHeightClassName}`}>
        <div className="flex justify-center pt-2.5">
          <span className="h-1.5 w-12 rounded-full bg-slate-200" />
        </div>
        <div className="border-b border-[var(--vr-border)] px-4 pb-3 pt-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              {eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--vr-primary)]">{eyebrow}</div> : null}
              {title ? <h3 className={`${eyebrow ? "mt-1" : ""} text-xl font-bold text-[var(--vr-text)]`}>{title}</h3> : null}
            </div>
            <div className="flex items-center gap-2">
              {headerAction}
              <button type="button" className="rounded-full border border-[var(--vr-border)] p-2 text-slate-500" onClick={onClose}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {children}
        </div>
        {footer ? <div className="border-t border-[var(--vr-border)] bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">{footer}</div> : null}
      </aside>
    </div>
  );
}
