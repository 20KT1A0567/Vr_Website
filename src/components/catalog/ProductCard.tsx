import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Check, GitCompare, Heart, MapPin, MessageCircle, ShieldCheck, ShoppingCart, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { customerApi } from "api/client";
import type { Product } from "types";
import { useAuthStore } from "store/authStore";
import { useCartStore } from "store/cartStore";
import { useWishlist } from "../../hooks/useWishlist";
import { useCompareStore } from "../../store/compareStore";
import { getApiErrorMessage } from "../../utils/api";
import { showCartToast } from "../../utils/cartNotifications";
import {
  formatCurrency,
  getProductPrimaryImage,
  getProductSavings,
  getProductStockLabel,
  getProductWarrantyLabel,
  getPseudoReviewCount,
  isLowStock
} from "../../utils/catalog";

interface ProductCardProps {
  product: Product;
}

function buildSpecChips(product: Product): string[] {
  const chips: string[] = [];
  if (product.processor) chips.push(product.processor);
  if (product.ramGb) chips.push(`${product.ramGb} GB RAM`);
  if (product.storageGb) {
    const storage = product.storageGb >= 1024
      ? `${product.storageGb / 1024} TB`
      : `${product.storageGb} GB`;
    chips.push(`${storage}${product.storageType ? ` ${product.storageType}` : ""}`);
  }
  return chips;
}

export function ProductCard({ product }: ProductCardProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const addGuestCartItem = useCartStore((state) => state.addGuestCartItem);
  const { isWishlisted, isWishlistUpdating, toggleWishlist } = useWishlist();
  const { addToCompare, removeFromCompare, isInCompare, compareList, canCompareWith } = useCompareStore();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [heartPopKey, setHeartPopKey] = useState(0);
  const inCompare = isInCompare(product.id);
  const compareFull = compareList.length >= 3 && !inCompare;
  const compareCategoryMismatch = !inCompare && !canCompareWith(product);
  const compareDisabled = compareFull || compareCategoryMismatch;
  const compareAnchorCategory = compareList[0]?.categoryName ?? "the selected category";

  const primaryImage = getProductPrimaryImage(product);
  const secondaryImage = product.images.find((img) => !img.primaryImage)?.imageUrl ?? product.images[1]?.imageUrl;
  const wishlisted = isWishlisted(product.id);
  const savings = getProductSavings(product);
  const lowStock = isLowStock(product);
  const reviewCount = getPseudoReviewCount(product);
  const specChips = buildSpecChips(product);
  const rating = product.featured ? "4.8" : "4.6";
  const activeStoreCount = product.stores?.filter((store) => store.active).length ?? 0;
  const primaryWhatsapp = product.stores?.find((store) => store.whatsapp)?.whatsapp;

  const isUnavailable = !product.available;

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

  return (
    <article
      className={`vr-card-lift group relative flex h-full flex-col overflow-hidden rounded-[1.6rem] border bg-white shadow-[0_4px_18px_rgba(15,23,42,0.07)] ${
        isUnavailable
          ? "border-[var(--vr-border)] bg-slate-50 grayscale-[40%] opacity-70"
          : "border-[var(--vr-border)]"
      }`}
    >
      {isUnavailable ? (
        <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full bg-slate-900/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow">
          Currently Unavailable
        </div>
      ) : null}

      <div className="relative overflow-hidden bg-[#f4f7fd] p-3">

        {product.discountPercent ? (
          <div className="absolute left-3 top-3 z-20">
            <span className="rounded-full bg-[var(--vr-accent)] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              {product.discountPercent}% OFF
            </span>
          </div>
        ) : null}

        <div className="absolute right-3 top-3 z-20 flex flex-col gap-1.5">
          <button
            type="button"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`rounded-full border p-2 shadow-sm transition ${
              wishlisted
                ? "border-[rgba(220,38,38,0.15)] bg-white text-[var(--vr-danger)]"
                : "border-white/80 bg-white/90 text-slate-400 hover:border-[var(--vr-danger)] hover:text-[var(--vr-danger)]"
            }`}
            disabled={isWishlistUpdating === product.id}
            onClick={() => {
              setHeartPopKey((value) => value + 1);
              toggleWishlist(product);
            }}
          >
            <motion.span
              key={heartPopKey}
              initial={{ scale: 1 }}
              animate={{ scale: heartPopKey === 0 ? 1 : [1, 1.4, 0.92, 1] }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="block"
            >
              <Heart className="h-3.5 w-3.5" fill={wishlisted ? "currentColor" : "none"} />
            </motion.span>
          </button>
          <button
            type="button"
            title={
              inCompare
                ? "Remove from compare"
                : compareFull
                  ? "Compare list full (max 3)"
                  : compareCategoryMismatch
                    ? `You can only compare ${compareAnchorCategory}. Clear compare to switch categories.`
                    : "Add to compare"
            }
            className={`rounded-full border p-2 shadow-sm transition ${
              inCompare
                ? "border-[rgba(30,58,138,0.2)] bg-white text-[var(--vr-primary)]"
                : compareDisabled
                  ? "cursor-not-allowed border-white/80 bg-white/90 text-slate-200"
                  : "border-white/80 bg-white/90 text-slate-400 hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
            }`}
            disabled={compareDisabled}
            onClick={() => {
              if (inCompare) {
                removeFromCompare(product.id);
                toast("Removed from compare");
                return;
              }
              const result = addToCompare(product);
              if (result === "added") {
                toast.success("Added to compare");
              } else if (result === "full") {
                toast.error("You can compare up to 3 products");
              } else if (result === "category-mismatch") {
                toast.error(`Compare works within one category. Clear compare to switch from ${compareAnchorCategory}.`);
              }
            }}
          >
            <GitCompare className="h-3.5 w-3.5" />
          </button>
        </div>

        <Link to={`/products/${product.id}`} className="block">
          <div className="vr-product-media relative overflow-hidden rounded-[1.1rem] border border-slate-100 bg-white">
            {primaryImage ? (
              <>
                <img
                  src={primaryImage}
                  alt={product.title}
                  loading="lazy"
                  decoding="async"
                  className={`h-full w-full object-contain p-4 transition duration-500 ${
                    secondaryImage ? "group-hover:opacity-0 group-hover:scale-105" : "group-hover:scale-105"
                  }`}
                />
                {secondaryImage ? (
                  <img
                    src={secondaryImage}
                    alt={product.title}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-contain p-4 opacity-0 transition duration-500 group-hover:opacity-100 group-hover:scale-105"
                  />
                ) : null}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-300">No image</div>
            )}
          </div>
        </Link>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">

        <div className="flex min-h-[1.35rem] items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vr-muted)]">
            {product.brandName ?? "VR Certified"}
          </span>
          {product.featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600">
              <Sparkles className="h-2.5 w-2.5" />
              Premium
            </span>
          ) : null}
        </div>

        <Link
          to={`/products/${product.id}`}
          className="mt-1.5 min-h-[2.55rem] line-clamp-2 text-[0.93rem] font-bold leading-[1.35] text-[var(--vr-text)] transition hover:text-[var(--vr-primary)]"
        >
          {product.title}
        </Link>

        {specChips.length > 0 ? (
          <div className="mt-2.5 flex min-h-[1.75rem] flex-wrap gap-1.5">
            {specChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : product.categoryName ? (
          <div className="mt-2.5 min-h-[1.75rem]">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
              {product.categoryName}
            </span>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--vr-muted)]">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
            <Star className="h-3 w-3 fill-current" />
            <span className="text-[var(--vr-text)]">{rating}</span>
          </span>
          <span>{reviewCount} reviews</span>
          <span className="inline-flex items-center gap-1 text-[var(--vr-success)]">
            <ShieldCheck className="h-3 w-3" />
            {getProductWarrantyLabel(product)}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[var(--vr-muted)]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--vr-surface-soft)] px-2.5 py-1">
            <MapPin className="h-3 w-3 text-[var(--vr-primary)]" />
            {activeStoreCount ? `${activeStoreCount} store${activeStoreCount === 1 ? "" : "s"}` : "Store check"}
          </span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
            {product.available ? "Ready support" : "Ask availability"}
          </span>
          {product.productCondition ? (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[var(--vr-primary)]">
              {product.productCondition}
            </span>
          ) : null}
        </div>

        <div className="my-3 border-t border-[var(--vr-border)]" />

        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="text-[1.55rem] font-extrabold leading-none text-[var(--vr-text)]">
              {formatCurrency(product.price)}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
              {product.originalPrice && product.originalPrice > product.price ? (
                <span className="text-slate-400 line-through">{formatCurrency(product.originalPrice)}</span>
              ) : null}
              {savings > 0 ? (
                <span className="font-bold text-[var(--vr-success)]">Save {formatCurrency(savings)}</span>
              ) : null}
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
              lowStock
                ? "bg-red-50 text-red-600"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {getProductStockLabel(product)}
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <motion.button
            type="button"
            onClick={handleAddToCart}
            disabled={isAddingToCart || isUnavailable}
            whileTap={{ scale: isUnavailable ? 1 : 0.96 }}
            title={isUnavailable ? "This product is currently unavailable" : undefined}
            className={`relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-[1rem] px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 ${
              isUnavailable
                ? "cursor-not-allowed bg-slate-200 text-slate-500 focus:ring-slate-200"
                : "bg-[var(--vr-primary)] text-white hover:bg-[var(--vr-primary-strong)] focus:ring-blue-100 disabled:opacity-60"
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isUnavailable ? (
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 shrink-0" />
                  Unavailable
                </span>
              ) : justAdded ? (
                <motion.span
                  key="added"
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -16, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4 shrink-0" />
                  Added!
                </motion.span>
              ) : (
                <motion.span
                  key="default"
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -16, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4 shrink-0" />
                  {isAddingToCart ? "Adding..." : "Add to Cart"}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <Link
            to={`/products/${product.id}`}
            className="inline-flex items-center justify-center rounded-[1rem] border border-[var(--vr-border)] px-4 py-2.5 text-sm font-semibold text-[var(--vr-primary)] transition hover:border-[var(--vr-primary)] hover:bg-[var(--vr-surface-soft)] focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            View
          </Link>
          {primaryWhatsapp ? (
            <a
              href={`https://wa.me/${primaryWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi VR Technologies, I want to know about ${product.title}`)}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`Ask on WhatsApp about ${product.title}`}
              className="inline-flex items-center justify-center rounded-[1rem] border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
