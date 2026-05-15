import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { AnimatedBottomSheet } from "./AnimatedBottomSheet";
import { motion } from "framer-motion";

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
      <AnimatedBottomSheet isOpen={open} onClose={onClose} className={maxHeightClassName}>
        <div className="border-b border-[var(--vr-border)] px-4 pb-3 pt-3">
          <motion.div
            className="mb-2 flex items-center justify-between gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.06 }}
          >
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
          </motion.div>
        </div>
        <motion.div
          className="flex-1 overflow-y-auto px-4 py-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.1 }}
        >
          {children}
        </motion.div>
        {footer ? (
          <motion.div
            className="border-t border-[var(--vr-border)] bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, delay: 0.14 }}
          >
            {footer}
          </motion.div>
        ) : null}
      </AnimatedBottomSheet>
    </div>
  );
}
