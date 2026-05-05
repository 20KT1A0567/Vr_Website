import { CheckCircle2, ShoppingCart, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { formatCartItemCount, formatCartUnitCount, getCartItemCount, getCartQuantityCount } from "./cartCounts";

type CartToastVariant = "added" | "saved" | "removed";

type CartToastItem = {
  quantity?: number | null;
};

interface CartToastOptions {
  items: readonly CartToastItem[];
  productTitle?: string;
  variant?: CartToastVariant;
}

const toastCopy: Record<CartToastVariant, { title: string; tone: string; icon: typeof ShoppingCart }> = {
  added: {
    title: "Added to cart",
    tone: "bg-emerald-50 text-emerald-700",
    icon: CheckCircle2
  },
  saved: {
    title: "Saved to cart",
    tone: "bg-blue-50 text-[var(--vr-primary)]",
    icon: ShoppingCart
  },
  removed: {
    title: "Removed from cart",
    tone: "bg-rose-50 text-[var(--vr-danger)]",
    icon: Trash2
  }
};

export function showCartToast({ items, productTitle, variant = "added" }: CartToastOptions) {
  const productCount = getCartItemCount(items);
  const quantityCount = getCartQuantityCount(items);
  const copy = toastCopy[variant];
  const Icon = copy.icon;
  const itemLabel = productCount ? `${formatCartItemCount(productCount)} in cart` : "Cart is empty";
  const quantityLabel = quantityCount > productCount ? `${formatCartUnitCount(quantityCount)} total quantity` : null;

  toast.custom(
    (currentToast) => (
      <div
        className={`pointer-events-auto w-[22rem] max-w-[calc(100vw-1.5rem)] rounded-[1.35rem] border border-[var(--vr-border)] bg-white p-4 text-[var(--vr-text)] shadow-[0_22px_55px_rgba(15,23,42,0.18)] transition-all duration-200 ${
          currentToast.visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${copy.tone}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold">{copy.title}</div>
            {productTitle ? (
              <div className="mt-0.5 line-clamp-2 text-xs font-semibold leading-5 text-[var(--vr-muted)]">
                {productTitle}
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-[rgba(30,58,138,0.08)] px-2.5 py-1 text-[11px] font-bold text-[var(--vr-primary)]">
                {itemLabel}
              </span>
              {quantityLabel ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                  {quantityLabel}
                </span>
              ) : null}
            </div>
            {productCount ? (
              <a
                href="/cart"
                onClick={() => toast.dismiss(currentToast.id)}
                className="mt-3 inline-flex rounded-full bg-[var(--vr-primary)] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[var(--vr-primary-strong)]"
              >
                View cart
              </a>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close notification"
            onClick={() => toast.dismiss(currentToast.id)}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[var(--vr-danger)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    ),
    { duration: 4200, position: "top-right" }
  );
}
