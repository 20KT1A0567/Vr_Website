import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { X } from "lucide-react";

interface AnimatedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: "left" | "right";
  className?: string;
  title?: string;
  width?: string;
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function AnimatedDrawer({
  isOpen,
  onClose,
  children,
  side = "left",
  className = "",
  title,
  width = "w-[min(360px,90vw)]",
}: AnimatedDrawerProps) {
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

  const xInitial = side === "left" ? "-100%" : "100%";

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

          {/* Drawer panel */}
          <motion.div
            className={`fixed inset-y-0 ${side === "left" ? "left-0" : "right-0"} z-50 flex flex-col bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] ${width} ${className}`}
            initial={reduce ? { opacity: 0 } : { x: xInitial, opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { x: xInitial, opacity: 0.6 }}
            transition={reduce ? { duration: 0.16 } : { duration: 0.32, ease: EASE }}
          >
            {/* Header */}
            <motion.div
              className="flex flex-shrink-0 items-center justify-between border-b border-[var(--vr-border)] px-5 py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.25, ease: EASE }}
            >
              {title && (
                <h2 className="text-lg font-bold text-[var(--vr-text)]">{title}</h2>
              )}
              <button
                type="button"
                onClick={onClose}
                className="ml-auto rounded-full border border-[var(--vr-border)] bg-white p-2 text-[var(--vr-muted)] transition hover:text-[var(--vr-text)]"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-5">
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 0.18, duration: reduce ? 0.16 : 0.32, ease: EASE }}
              >
                {children}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
