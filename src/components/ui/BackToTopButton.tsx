import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

const SHOW_AFTER = 320;
const RADIUS = 17;
const CIRC = 2 * Math.PI * RADIUS;

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(scrollY > SHOW_AFTER);
      setProgress(maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: "spring", stiffness: 480, damping: 26 }}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-5 left-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(15,23,42,0.14)] border border-[var(--vr-border)]"
        >
          <svg
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 44 44"
            fill="none"
          >
            <circle cx="22" cy="22" r={RADIUS} stroke="var(--vr-border)" strokeWidth="2" />
            <circle
              cx="22"
              cy="22"
              r={RADIUS}
              stroke="var(--vr-primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - progress)}
              style={{ transition: "stroke-dashoffset 0.12s linear" }}
            />
          </svg>
          <ArrowUp className="relative z-10 h-4 w-4 text-[var(--vr-primary)]" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
