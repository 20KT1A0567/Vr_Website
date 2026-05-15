import { CheckCircle2, Heart, ShoppingCart, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { getCartItemCount } from "./cartCounts";

type CartToastVariant = "added" | "saved" | "removed";
type WishlistToastVariant = "saved" | "removed";

type CartToastItem = {
  quantity?: number | null;
};

interface CartToastOptions {
  items: readonly CartToastItem[];
  productTitle?: string;
  variant?: CartToastVariant;
}

interface WishlistToastOptions {
  productTitle?: string;
  variant?: WishlistToastVariant;
}

const cartCopy: Record<
  CartToastVariant,
  {
    title: string;
    subtitle: string;
    accentClass: string;
    badgeClass: string;
    icon: typeof ShoppingCart;
  }
> = {
  added: {
    title: "Item added to cart",
    subtitle: "Your cart is updated and ready for checkout.",
    accentClass: "bg-emerald-50 text-emerald-700",
    badgeClass: "bg-emerald-50 text-emerald-700",
    icon: CheckCircle2
  },
  saved: {
    title: "Item saved to cart",
    subtitle: "We kept it ready in your cart.",
    accentClass: "bg-[rgba(30,58,138,0.1)] text-[var(--vr-primary)]",
    badgeClass: "bg-[rgba(30,58,138,0.08)] text-[var(--vr-primary)]",
    icon: ShoppingCart
  },
  removed: {
    title: "Item removed from cart",
    subtitle: "Your cart summary has been updated.",
    accentClass: "bg-rose-50 text-[var(--vr-danger)]",
    badgeClass: "bg-rose-50 text-[var(--vr-danger)]",
    icon: Trash2
  }
};

const wishlistCopy: Record<
  WishlistToastVariant,
  {
    title: string;
    subtitle: string;
    accentClass: string;
    badgeClass: string;
  }
> = {
  saved: {
    title: "Saved to wishlist",
    subtitle: "You can come back to it anytime.",
    accentClass: "bg-[rgba(30,58,138,0.1)] text-[var(--vr-primary)]",
    badgeClass: "bg-[rgba(30,58,138,0.08)] text-[var(--vr-primary)]"
  },
  removed: {
    title: "Removed from wishlist",
    subtitle: "This product is no longer in your saved items.",
    accentClass: "bg-slate-100 text-slate-700",
    badgeClass: "bg-slate-100 text-slate-700"
  }
};

function renderActionToast({
  toastId,
  accentClass,
  icon,
  title,
  subtitle,
  productTitle,
  primaryAction,
  compact = false
}: {
  toastId: string;
  accentClass: string;
  icon: typeof ShoppingCart;
  title: string;
  subtitle: string;
  productTitle?: string;
  primaryAction?: { label: string; href: string };
  compact?: boolean;
}) {
  const Icon = icon;

  toast.custom(
    (currentToast) => (
      <div
        className={`pointer-events-auto max-w-[calc(100vw-1rem)] overflow-hidden border border-[rgba(30,58,138,0.12)] bg-white shadow-[0_22px_56px_rgba(15,23,42,0.18)] transition-all duration-200 ${
          compact ? "w-[20rem] rounded-[1rem]" : "w-[23rem] rounded-[1.2rem]"
        } ${
          currentToast.visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <div className={`flex items-start gap-3 ${compact ? "p-3.5" : "p-4"}`}>
          <div className={`mt-0.5 flex shrink-0 items-center justify-center rounded-full ${accentClass} ${compact ? "h-9 w-9" : "h-10 w-10"}`}>
            <Icon className={compact ? "h-4.5 w-4.5" : "h-5 w-5"} />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`pr-6 font-extrabold text-[var(--vr-text)] ${compact ? "text-[14px] leading-5" : "text-[15px] leading-5"}`}>{title}</div>
            <div className={`mt-1 leading-5 text-[var(--vr-muted)] ${compact ? "text-[12px]" : "text-xs"}`}>{subtitle}</div>
            {productTitle ? (
              <div className={`line-clamp-1 font-semibold text-[var(--vr-text)] ${compact ? "mt-2 text-[12px]" : "mt-2 text-xs"}`}>{productTitle}</div>
            ) : null}
            {primaryAction ? (
              <a
                href={primaryAction.href}
                onClick={() => toast.dismiss(currentToast.id)}
                className={`inline-flex rounded-full bg-[var(--vr-primary)] font-bold text-white transition hover:bg-[var(--vr-primary-strong)] ${compact ? "mt-3 px-3 py-1.5 text-[12px]" : "mt-3 px-3.5 py-1.5 text-xs"}`}
              >
                {primaryAction.label}
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
        <div className="h-1.5 w-full bg-slate-100">
          <div className="h-full w-full origin-left animate-[toast-shrink_4.2s_linear_forwards] bg-[var(--vr-primary)]" />
        </div>
      </div>
    ),
    { id: toastId, duration: 4200, position: "bottom-right" }
  );
}

export function showCartToast({ items, productTitle, variant = "added" }: CartToastOptions) {
  const productCount = getCartItemCount(items);
  const copy = cartCopy[variant];

  renderActionToast({
    toastId: "cart-toast",
    accentClass: copy.accentClass,
    icon: copy.icon,
    title: copy.title,
    subtitle: copy.subtitle,
    productTitle,
    primaryAction: productCount ? { label: "View cart", href: "/cart" } : undefined,
    compact: true
  });
}

export function showWishlistToast({ productTitle, variant = "saved" }: WishlistToastOptions) {
  const copy = wishlistCopy[variant];

  renderActionToast({
    toastId: "wishlist-toast",
    accentClass: copy.accentClass,
    icon: Heart,
    title: copy.title,
    subtitle: copy.subtitle,
    productTitle,
    primaryAction: { label: "View wishlist", href: "/wishlist" },
    compact: true
  });
}
