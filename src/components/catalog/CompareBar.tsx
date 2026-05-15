import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart2, ChevronDown, GitCompare, Plus, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useCompareStore } from "../../store/compareStore";
import { formatCurrency, getProductPrimaryImage } from "../../utils/catalog";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompareStore();
  const [expanded, setExpanded] = useState(false);

  if (!compareList.length) return null;

  const anchorCategory = compareList[0]?.categoryName ?? "";
  const slots = [0, 1, 2];

  return (
    <div className="vr-mobile-compare fixed bottom-[6.5rem] right-3 z-40 sm:right-4 lg:bottom-24 lg:right-5">
      <AnimatePresence mode="wait" initial={false}>
        {expanded ? (
          /* ── Expanded Tray ── */
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="w-[340px] overflow-hidden rounded-[1.4rem] border border-[var(--vr-border)] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 bg-[linear-gradient(135deg,#1e3a8a,#2346b0)] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                  <GitCompare className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white/70 uppercase tracking-[0.16em]">Compare</div>
                  <div className="text-sm font-bold text-white leading-tight">
                    {compareList.length} of 3 products
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {anchorCategory ? (
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white/90">
                    {anchorCategory}
                  </span>
                ) : null}
                <button
                  type="button"
                  aria-label="Collapse"
                  onClick={() => setExpanded(false)}
                  className="rounded-full p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Product slots */}
            <div className="divide-y divide-[var(--vr-border)] px-0">
              <AnimatePresence initial={false}>
                {slots.map((slotIndex) => {
                  const product = compareList[slotIndex];
                  if (product) {
                    const img = getProductPrimaryImage(product);
                    return (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ duration: 0.24, ease: EASE }}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        {/* Slot number */}
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(30,58,138,0.08)] text-[10px] font-bold text-[var(--vr-primary)]">
                          {slotIndex + 1}
                        </div>
                        {/* Thumbnail */}
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[0.6rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)]">
                          {img ? (
                            <img src={img} alt="" className="h-full w-full object-contain p-1" />
                          ) : (
                            <div className="h-full w-full bg-slate-100" />
                          )}
                        </div>
                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12px] font-semibold text-[var(--vr-text)]">
                            {product.title}
                          </div>
                          <div className="mt-0.5 text-[11px] font-bold text-[var(--vr-primary)]">
                            {formatCurrency(product.price)}
                          </div>
                        </div>
                        {/* Remove */}
                        <button
                          type="button"
                          aria-label="Remove"
                          onClick={() => removeFromCompare(product.id)}
                          className="shrink-0 rounded-full p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    );
                  }
                  /* Empty slot */
                  return (
                    <motion.div
                      key={`empty-${slotIndex}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 text-[10px] font-bold text-slate-400">
                        {slotIndex + 1}
                      </div>
                      <div className="h-11 w-11 shrink-0 rounded-[0.6rem] border border-dashed border-[var(--vr-border)] bg-[var(--vr-surface-soft)]" />
                      <Link
                        to="/products"
                        onClick={() => setExpanded(false)}
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--vr-muted)] transition hover:text-[var(--vr-primary)]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add product
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 border-t border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-3">
              <button
                type="button"
                onClick={clearCompare}
                className="flex items-center gap-1.5 rounded-[0.8rem] px-3 py-2 text-[12px] font-semibold text-[var(--vr-muted)] transition hover:bg-white hover:text-[var(--vr-danger)]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear all
              </button>
              <Link
                to="/compare"
                onClick={() => setExpanded(false)}
                className="ml-auto flex items-center gap-1.5 rounded-[0.8rem] bg-[var(--vr-primary)] px-4 py-2 text-[12px] font-bold text-white shadow-[0_8px_18px_rgba(30,58,138,0.22)] transition hover:bg-[var(--vr-primary-strong)]"
              >
                <BarChart2 className="h-3.5 w-3.5" />
                Compare now
              </Link>
            </div>
          </motion.div>
        ) : (
          /* ── Collapsed FAB ── */
          <motion.div
            key="collapsed"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 22 }}
            className="relative"
          >
            <motion.button
              type="button"
              aria-label={`Compare ${compareList.length} products`}
              onClick={() => setExpanded(true)}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.06 }}
              className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--vr-primary)] text-white shadow-[0_12px_28px_rgba(30,58,138,0.32)] transition hover:bg-[var(--vr-primary-strong)] lg:h-13 lg:w-13"
            >
              <GitCompare className="h-5 w-5" />
              <motion.span
                key={compareList.length}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.5, 1.3, 1], opacity: 1 }}
                transition={{ duration: 0.36, ease: EASE }}
                className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border-2 border-white bg-[var(--vr-accent)] px-1 text-[10px] font-black text-[var(--vr-dark)]"
              >
                {compareList.length}
              </motion.span>
            </motion.button>
            {/* Quick-clear X */}
            <button
              type="button"
              aria-label="Clear compare"
              onClick={clearCompare}
              className="absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-white text-slate-400 shadow transition hover:bg-rose-50 hover:text-rose-500"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
