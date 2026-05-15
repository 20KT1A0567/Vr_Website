import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface FilterChipItem {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  items: FilterChipItem[];
  onClearAll: () => void;
  className?: string;
  compact?: boolean;
}

export function FilterChips({ items, onClearAll, className = "", compact = false }: FilterChipsProps) {
  if (!items.length) {
    return <span className="text-sm text-[var(--vr-muted)]">No filters selected yet.</span>;
  }

  return (
    <div className={`flex items-center gap-1.5 ${compact ? "flex-nowrap" : "flex-wrap"} ${className}`}>
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((item) => (
          <motion.button
            key={item.key}
            layout
            initial={{ opacity: 0, scale: 0.78, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.72, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            type="button"
            onClick={item.onRemove}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
          >
            {item.label}
            <X className="h-3 w-3" />
          </motion.button>
        ))}
      </AnimatePresence>
      <motion.button
        layout
        type="button"
        onClick={onClearAll}
        whileTap={{ scale: 0.9 }}
        className="ml-1 shrink-0 text-[11px] font-bold text-slate-400 transition hover:text-[var(--vr-danger)]"
      >
        Clear All
      </motion.button>
    </div>
  );
}
