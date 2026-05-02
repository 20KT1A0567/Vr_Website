import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useCompareStore } from "../../store/compareStore";
import { getProductPrimaryImage } from "../../utils/catalog";

export function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompareStore();

  if (!compareList.length) return null;

  return (
    <div className="fixed inset-x-0 bottom-[4.25rem] z-50 px-3 lg:bottom-0 lg:px-0">
      <div className="lg:mx-auto lg:max-w-[1600px] lg:px-6">
        <div className="flex items-center gap-3 rounded-t-[1.4rem] border border-b-0 border-[var(--vr-border)] bg-white px-4 py-3 shadow-[0_-10px_36px_rgba(15,23,42,0.13)]">
          <div className="shrink-0 text-sm font-bold text-[var(--vr-text)]">
            Compare ({compareList.length})
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            {compareList.map((product) => {
              const img = getProductPrimaryImage(product);
              return (
                <div
                  key={product.id}
                  className="relative flex shrink-0 items-center gap-2 rounded-[1rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] py-1.5 pl-2 pr-7"
                >
                  {img ? (
                    <img src={img} alt="" className="h-8 w-8 object-contain" />
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-slate-100" />
                  )}
                  <span className="max-w-[110px] truncate text-xs font-semibold text-[var(--vr-text)]">
                    {product.title}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove from compare"
                    onClick={() => removeFromCompare(product.id)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 transition hover:text-[var(--vr-danger)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}

            {Array.from({ length: 3 - compareList.length }).map((_, i) => (
              <div
                key={i}
                className="flex h-11 shrink-0 w-28 items-center justify-center rounded-[1rem] border border-dashed border-slate-200 bg-slate-50 text-[11px] text-slate-400"
              >
                + Add product
              </div>
            ))}
          </div>

          <span className="hidden shrink-0 text-xs text-[var(--vr-muted)] lg:block">
            Up to 3 products
          </span>

          <button
            type="button"
            onClick={clearCompare}
            className="shrink-0 text-sm font-semibold text-[var(--vr-muted)] transition hover:text-[var(--vr-danger)]"
          >
            Clear
          </button>

          <Link
            to="/compare"
            className="shrink-0 rounded-[1rem] bg-[var(--vr-primary)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--vr-primary-strong)]"
          >
            Compare now
          </Link>
        </div>
      </div>
    </div>
  );
}
