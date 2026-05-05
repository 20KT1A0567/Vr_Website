import { useState } from "react";
import { GitCompare, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useCompareStore } from "../../store/compareStore";
import { getProductPrimaryImage } from "../../utils/catalog";

export function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompareStore();
  const [expanded, setExpanded] = useState(false);

  if (!compareList.length) return null;

  const anchorCategory = compareList[0]?.categoryName ?? "";

  return (
    <div className="fixed bottom-[11rem] right-3 z-50 sm:right-5 lg:bottom-[6.25rem]">
      {expanded ? (
        <div className="w-[300px] overflow-hidden rounded-[1.2rem] border border-[var(--vr-border)] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-3 py-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--vr-text)]">
              <GitCompare className="h-4 w-4 text-[var(--vr-primary)]" />
              Compare ({compareList.length}/3)
            </div>
            <button
              type="button"
              aria-label="Collapse compare"
              onClick={() => setExpanded(false)}
              className="rounded-full p-1 text-slate-400 transition hover:text-[var(--vr-danger)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {anchorCategory ? (
            <div className="border-b border-[var(--vr-border)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--vr-primary)]">
              {anchorCategory} only
            </div>
          ) : null}
          <div className="max-h-[260px] overflow-y-auto p-2">
            {compareList.map((product) => {
              const img = getProductPrimaryImage(product);
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-2 rounded-[0.7rem] px-2 py-1.5 transition hover:bg-[var(--vr-surface-soft)]"
                >
                  {img ? (
                    <img src={img} alt="" className="h-7 w-7 shrink-0 object-contain" />
                  ) : (
                    <div className="h-7 w-7 shrink-0 rounded-md bg-slate-100" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[var(--vr-text)]">
                    {product.title}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => removeFromCompare(product.id)}
                    className="shrink-0 rounded-full p-0.5 text-slate-400 transition hover:text-[var(--vr-danger)]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 border-t border-[var(--vr-border)] px-2 py-2">
            <button
              type="button"
              onClick={clearCompare}
              className="rounded-[0.7rem] px-2 py-1.5 text-[11px] font-semibold text-[var(--vr-muted)] transition hover:bg-[var(--vr-surface-soft)] hover:text-[var(--vr-danger)]"
            >
              Clear
            </button>
            <Link
              to="/compare"
              onClick={() => setExpanded(false)}
              className="ml-auto rounded-[0.7rem] bg-[var(--vr-primary)] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[var(--vr-primary-strong)]"
            >
              Compare now
            </Link>
          </div>
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            aria-label={`Compare ${compareList.length} products`}
            onClick={() => setExpanded(true)}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--vr-primary)] text-white shadow-[0_14px_28px_rgba(30,58,138,0.35)] transition hover:bg-[var(--vr-primary-strong)] lg:h-12 lg:w-12"
          >
            <GitCompare className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border-2 border-white bg-[var(--vr-accent)] px-1 text-[10px] font-bold text-[var(--vr-dark)]">
              {compareList.length}
            </span>
          </button>
          <button
            type="button"
            aria-label="Clear compare list"
            onClick={clearCompare}
            className="absolute -bottom-1 -left-1 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-white text-[var(--vr-danger)] shadow transition hover:bg-rose-50"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
