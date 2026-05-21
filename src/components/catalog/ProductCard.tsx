import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Eye, GitCompare, Heart, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { customerApi } from "api/client";
import type { Product } from "types";
import { useAuthStore } from "store/authStore";
import { useCartStore } from "store/cartStore";
import { useCompareStore } from "store/compareStore";
import { useQuickViewStore } from "store/quickViewStore";
import { useWishlist } from "../../hooks/useWishlist";
import { getApiErrorMessage } from "../../utils/api";
import { showCartToast } from "../../utils/cartNotifications";
import {
  formatCurrency,
  getProductPrimaryImage,
  getProductStockLabel,
  isLowStock
} from "../../utils/catalog";
import { EASE } from "../../animations/variants";

interface ProductCardProps {
  product: Product;
}

function buildSpecChips(product: Product): string[] {
  const chips: string[] = [];
  if (product.ramGb) chips.push(`${product.ramGb} GB RAM`);
  if (product.storageGb) {
    const storage = product.storageGb >= 1024 ? `${product.storageGb / 1024} TB` : `${product.storageGb} GB`;
    chips.push(`${storage}${product.storageType ? ` ${product.storageType}` : ""}`);
  }
  return chips.slice(0, 2);
}

export function ProductCard({ product }: ProductCardProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const addGuestCartItem = useCartStore((state) => state.addGuestCartItem);
  const { isWishlisted, isWishlistUpdating, toggleWishlist } = useWishlist();
  const { compareList, addToCompare, removeFromCompare, isInCompare } = useCompareStore();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [wishlistPopped, setWishlistPopped] = useState(false);
  const [comparePop, setComparePop] = useState(false);

  const openQuickView = useQuickViewStore((s) => s.open);
  const inCompare = isInCompare(product.id);

  const primaryImage = getProductPrimaryImage(product);
  const secondaryImage = product.images.find((img) => !img.primaryImage)?.imageUrl ?? product.images[1]?.imageUrl;
  const wishlisted = isWishlisted(product.id);
  const lowStock = isLowStock(product);
  const specChips = buildSpecChips(product);
  const hasImagePair = Boolean(primaryImage && secondaryImage);
  const imageCycleDuration = 3400 + (product.id % 4) * 400;
  const isUnavailable = !product.available;

  useEffect(() => {
    if (!hasImagePair) {
      setActiveImageIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveImageIndex((current) => (current === 0 ? 1 : 0));
    }, imageCycleDuration);

    return () => window.clearInterval(intervalId);
  }, [hasImagePair, imageCycleDuration]);

  function flashAdded() {
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1100);
  }

  async function handleAddToCart() {
    if (isAddingToCart) return;
    if (isUnavailable) {
      toast.error("This product is currently unavailable");
      return;
    }
    if (!user) {
      addGuestCartItem(product, 1);
      flashAdded();
      showCartToast({ variant: "saved", productTitle: product.title, items: useCartStore.getState().guestCart });
      return;
    }
    setIsAddingToCart(true);
    try {
      const nextCart = await customerApi.addToCart(product.id, 1);
      queryClient.setQueryData(["cart"], nextCart);
      flashAdded();
      showCartToast({ variant: "added", productTitle: product.title, items: nextCart });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to add product to cart"));
    } finally {
      setIsAddingToCart(false);
    }
  }

  function handleWishlistClick(event: React.MouseEvent) {
    event.preventDefault();
    setWishlistPopped(true);
    window.setTimeout(() => setWishlistPopped(false), 600);
    toggleWishlist(product);
  }

  function handleCompareClick(event: React.MouseEvent) {
    event.preventDefault();
    if (inCompare) {
      removeFromCompare(product.id);
      return;
    }
    setComparePop(true);
    window.setTimeout(() => setComparePop(false), 600);
    const result = addToCompare(product);
    if (result === "full") {
      toast.error("Compare list full — remove a product first.");
    } else if (result === "category-mismatch") {
      const anchorName = compareList[0]?.categoryName ?? "another category";
      toast.error(`Compare is locked to ${anchorName}. Clear to switch.`);
    }
  }

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-[24px] border bg-white transition-all duration-300 ${
        isUnavailable
          ? "border-[var(--vr-border)] bg-slate-50 grayscale-[40%] opacity-70"
          : "border-[rgba(30,58,138,0.10)] shadow-[0_10px_28px_rgba(15,23,42,0.06)] hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(15,23,42,0.12)]"
      }`}
    >
      <div className="relative bg-[linear-gradient(180deg,#eef4fc_0%,#f8fbff_100%)] p-3 sm:p-3.5">
        {/* ── Discount badge: elastic pop ── */}
        <AnimatePresence>
          {product.discountPercent ? (
            <motion.div
              className="absolute left-3 top-3 z-20"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 560, damping: 18, delay: 0.15 }}
            >
              <span className="rounded-[12px] bg-[linear-gradient(135deg,#f97316,#ef4444)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.04em] text-white shadow-[0_8px_18px_rgba(249,115,22,0.22)]">
                {product.discountPercent}% OFF
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* ── Wishlist button: spring pop on click ── */}
        <div className="absolute right-3 top-3 z-20">
          <motion.button
            type="button"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`rounded-full border border-white/70 bg-white/80 p-2.5 shadow-[0_8px_18px_rgba(15,23,42,0.08)] backdrop-blur-sm transition ${
              wishlisted
                ? "text-rose-500"
                : "text-slate-400 hover:text-rose-500"
            }`}
            disabled={isWishlistUpdating === product.id}
            onClick={handleWishlistClick}
            whileTap={{ scale: 0.85 }}
            animate={wishlistPopped ? { scale: [1, 1.35, 0.9, 1.12, 1] } : {}}
            transition={wishlistPopped ? { duration: 0.5, ease: EASE } : { type: "spring", stiffness: 400, damping: 20 }}
          >
            <Heart className="h-4 w-4" fill={wishlisted ? "currentColor" : "none"} />
          </motion.button>
        </div>

        <Link to={`/products/${product.id}`} className="block">
          <div className="relative flex h-[160px] items-center justify-center overflow-hidden rounded-[20px] border border-white/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] md:h-[190px] xl:h-[220px]">
            {primaryImage ? (
              <>
                <img
                  src={primaryImage}
                  alt={product.title}
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 h-full w-full object-contain p-3 transition-[opacity,transform] duration-700 ease-out ${
                    hasImagePair
                      ? activeImageIndex === 0
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-[1.03]"
                      : "opacity-100 group-hover:scale-[1.04]"
                  }`}
                />
                {secondaryImage ? (
                  <img
                    src={secondaryImage}
                    alt={product.title}
                    loading="lazy"
                    decoding="async"
                    className={`absolute inset-0 h-full w-full object-contain p-3 transition-[opacity,transform] duration-700 ease-out ${
                      activeImageIndex === 1 ? "opacity-100 scale-100" : "opacity-0 scale-[1.03]"
                    }`}
                  />
                ) : null}
              </>
            ) : (
              <div className="text-xs text-slate-300">No image</div>
            )}
          </div>
        </Link>

        {/* ── Quick View button: hover-reveal ── */}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); openQuickView(product); }}
          className="absolute bottom-[3.6rem] left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/80 bg-white/90 px-3.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-[0_6px_16px_rgba(15,23,42,0.14)] backdrop-blur-sm opacity-0 transition-all duration-200 group-hover:opacity-100 group-focus-within:opacity-100 hover:border-[rgba(30,58,138,0.3)] hover:bg-white hover:text-[var(--vr-primary)]"
        >
          <Eye className="h-3 w-3 shrink-0" />
          Quick View
        </button>

        {/* ── Compare pill: hover-reveal, always visible when active ── */}
        <motion.button
          type="button"
          aria-label={inCompare ? "Remove from comparison" : "Add to comparison"}
          onClick={handleCompareClick}
          whileTap={{ scale: 0.9 }}
          animate={comparePop ? { scale: [1, 1.15, 0.95, 1.05, 1] } : {}}
          transition={comparePop ? { duration: 0.4, ease: EASE } : { type: "spring", stiffness: 400, damping: 20 }}
          className={`absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] font-bold shadow-[0_6px_16px_rgba(15,23,42,0.14)] backdrop-blur-sm transition-all duration-200 ${
            inCompare
              ? "border-[var(--vr-primary)] bg-[var(--vr-primary)] text-white"
              : "border-white/80 bg-white/90 text-slate-500 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:border-[rgba(30,58,138,0.3)] hover:bg-white hover:text-[var(--vr-primary)]"
          }`}
        >
          {inCompare
            ? <><Check className="h-3 w-3 shrink-0" /><span>Comparing</span></>
            : <><GitCompare className="h-3 w-3 shrink-0" /><span>Compare</span></>
          }
        </motion.button>
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
        {/* Brand */}
        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--vr-muted)]">
          {product.brandName ?? "VR Certified"}
        </span>

        {/* Title */}
        <Link
          to={`/products/${product.id}`}
          className="mt-1.5 line-clamp-2 text-[14px] font-bold leading-snug text-slate-900 transition hover:text-[var(--vr-primary)]"
        >
          {product.title}
        </Link>

        {/* Spec chips — RAM + Storage only, or category fallback */}
        {(specChips.length > 0 || product.categoryName) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {specChips.length > 0 ? (
              specChips.map((chip) => (
                <span key={chip} className="inline-flex h-6 items-center rounded-full bg-slate-100 px-2.5 text-[10px] font-semibold text-slate-600">
                  {chip}
                </span>
              ))
            ) : (
              <span className="inline-flex h-6 items-center rounded-full bg-slate-100 px-2.5 text-[10px] font-semibold text-slate-600">
                {product.categoryName}
              </span>
            )}
          </div>
        )}

        {/* Price + stock + button */}
        <div className="mt-auto pt-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="text-[1.55rem] font-black leading-none text-slate-900">
                {formatCurrency(product.price)}
              </div>
              {product.originalPrice && product.originalPrice > product.price ? (
                <span className="mt-1 block text-[11px] text-slate-400 line-through">{formatCurrency(product.originalPrice)}</span>
              ) : null}
            </div>
            <span className={`mb-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isUnavailable ? "bg-slate-100 text-slate-500" : lowStock ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
            }`}>
              {getProductStockLabel(product)}
            </span>
          </div>

          <motion.button
            type="button"
            onClick={handleAddToCart}
            disabled={isAddingToCart || isUnavailable}
            whileTap={{ scale: isUnavailable ? 1 : 0.97 }}
            className={`mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-[12px] text-[13px] font-semibold transition duration-200 ${
              isUnavailable
                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                : "bg-[var(--vr-primary)] text-white hover:bg-[var(--vr-primary-strong)]"
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isUnavailable ? (
                <span key="unavail" className="flex items-center gap-2">
                  <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
                  Out of Stock
                </span>
              ) : justAdded ? (
                <motion.span key="added" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.18 }} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  Added!
                </motion.span>
              ) : (
                <motion.span key="default" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.18 }} className="flex items-center gap-2">
                  <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
                  {isAddingToCart ? "Adding..." : "Add to Cart"}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </article>
  );
}
