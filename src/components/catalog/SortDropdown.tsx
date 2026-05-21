import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface SortOption<T extends string> {
  value: T;
  label: string;
}

interface SortDropdownProps<T extends string> {
  value: T;
  options: Array<SortOption<T>>;
  onChange: (value: T) => void;
}

export function SortDropdown<T extends string>({ value, options, onChange }: SortDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const activeLabel = options.find((option) => option.value === value)?.label ?? options[0]?.label ?? "Sort";

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:border-[var(--vr-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(30,58,138,0.1)]"
      >
        <span>{activeLabel}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-[80] overflow-hidden rounded-2xl border border-[var(--vr-border)] bg-white shadow-[0_24px_50px_rgba(15,23,42,0.1)]"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "top" }}
          >
            {options.map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-3 text-left text-sm font-medium transition ${
                  value === option.value ? "bg-[var(--vr-primary)] text-white" : "text-[var(--vr-text)] hover:bg-[var(--vr-surface-soft)]"
                }`}
              >
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
