import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect } from "react";

interface AnimatedBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  title?: string;
}

export function AnimatedBottomSheet({
  isOpen,
  onClose,
  children,
  className = "",
  title,
}: AnimatedBottomSheetProps) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.12 : 0.22 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-[0_-24px_60px_rgba(15,23,42,0.18)] ${className}`}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={{ y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={reduce ? { duration: 0.16 } : { type: "spring", stiffness: 340, damping: 32, mass: 0.9 }}
          >
            {/* Drag handle */}
            <motion.div
              className="mx-auto mt-3 h-1.5 w-10 flex-shrink-0 rounded-full bg-slate-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduce ? 0 : 0.15, duration: reduce ? 0.12 : 0.2 }}
            />

            {title && (
              <motion.div
                className="flex-shrink-0 border-b border-[var(--vr-border)] px-5 py-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <h2 className="text-lg font-bold text-[var(--vr-text)]">{title}</h2>
              </motion.div>
            )}

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
