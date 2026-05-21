import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useRecentlyViewed } from "../../hooks/useRecentlyViewed";
import { formatCurrency, getProductPrimaryImage } from "../../utils/catalog";
import { EASE } from "../../animations/variants";

export function RecentlyViewedStrip() {
  const { recentlyViewed, clearHistory } = useRecentlyViewed();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (recentlyViewed.length === 0) return null;

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="mt-8 border-t border-[var(--vr-border)] pt-6"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3 lg:pr-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(30,58,138,0.08)]">
            <Clock className="h-4 w-4 text-[var(--vr-primary)]" />
          </div>
          <div>
            <div className="text-[13px] font-bold text-[var(--vr-text)]">Recently Viewed</div>
            <div className="text-[11px] text-[var(--vr-muted)]">{recentlyViewed.length} product{recentlyViewed.length > 1 ? "s" : ""}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--vr-border)] bg-white text-slate-400 shadow-sm transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--vr-border)] bg-white text-slate-400 shadow-sm transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={clearHistory}
            className="flex h-8 items-center gap-1 rounded-full border border-[var(--vr-border)] bg-white px-2.5 text-[11px] font-semibold text-[var(--vr-muted)] shadow-sm transition hover:border-rose-300 hover:text-rose-500"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="vr-scrollbar -mx-1 flex gap-3 overflow-x-auto pb-3 lg:pr-2"
        style={{ scrollbarWidth: "none" }}
      >
        <AnimatePresence initial={false}>
          {recentlyViewed.map((product, i) => {
            const img = getProductPrimaryImage(product);
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                transition={{ delay: i * 0.04, duration: 0.24, ease: EASE }}
                className="shrink-0"
              >
                <Link
                  to={`/products/${product.id}`}
                  className="group flex w-[148px] flex-col overflow-hidden rounded-[1.2rem] border border-[var(--vr-border)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[rgba(30,58,138,0.25)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.09)]"
                >
                  {/* Image */}
                  <div className="flex h-[100px] items-center justify-center bg-[linear-gradient(180deg,#eef4fc,#f8fbff)] p-2">
                    {img ? (
                      <img
                        src={img}
                        alt={product.title}
                        loading="lazy"
                        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full rounded-lg bg-slate-100" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex flex-1 flex-col p-2.5">
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--vr-muted)]">
                      {product.brandName ?? "VR"}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-tight text-[var(--vr-text)] group-hover:text-[var(--vr-primary)]">
                      {product.title}
                    </span>
                    <span className="mt-1.5 text-[12px] font-black text-slate-900">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
