import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GitCompare, Heart, ShieldCheck, ShoppingCart, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { customerApi } from "api/client";
import type { Product } from "types";
import { useAuthStore } from "store/authStore";
import { useWishlist } from "../../hooks/useWishlist";
import { useCompareStore } from "../../store/compareStore";
import { getApiErrorMessage } from "../../utils/api";
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
  const { isWishlisted, isWishlistUpdating, toggleWishlist } = useWishlist();
  const { addToCompare, removeFromCompare, isInCompare, compareList } = useCompareStore();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const inCompare = isInCompare(product.id);
  const compareFull = compareList.length >= 3 && !inCompare;

  const primaryImage = getProductPrimaryImage(product);
  const secondaryImage = product.images.find((img) => !img.primaryImage)?.imageUrl ?? product.images[1]?.imageUrl;
  const wishlisted = isWishlisted(product.id);
  const savings = getProductSavings(product);
  const lowStock = isLowStock(product);
  const reviewCount = getPseudoReviewCount(product);
  const specChips = buildSpecChips(product);
  const rating = product.featured ? "4.8" : "4.6";

  async function handleAddToCart() {
    if (!user) { toast.error("Login to add this product to cart"); return; }
    if (isAddingToCart) return;
    setIsAddingToCart(true);
    try {
      const nextCart = await customerApi.addToCart(product.id, 1);
      queryClient.setQueryData(["cart"], nextCart);
      toast.success("Added to cart");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to add product to cart"));
    } finally {
      setIsAddingToCart(false);
    }
  }

  return (
    <article className="vr-card-lift group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-[var(--vr-border)] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.07)]">

      {/* ── Image area ── */}
      <div className="relative overflow-hidden bg-[#f4f7fd] p-3">

        {/* Discount badge – top left */}
        {product.discountPercent ? (
          <div className="absolute left-3 top-3 z-20">
            <span className="rounded-full bg-[var(--vr-accent)] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              {product.discountPercent}% OFF
            </span>
          </div>
        ) : null}

        {/* Action icons – top right */}
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
            onClick={() => toggleWishlist(product)}
          >
            <Heart className="h-3.5 w-3.5" fill={wishlisted ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            title={compareFull ? "Compare list full (max 3)" : inCompare ? "Remove from compare" : "Add to compare"}
            className={`rounded-full border p-2 shadow-sm transition ${
              inCompare
                ? "border-[rgba(30,58,138,0.2)] bg-white text-[var(--vr-primary)]"
                : compareFull
                  ? "cursor-not-allowed border-white/80 bg-white/90 text-slate-200"
                  : "border-white/80 bg-white/90 text-slate-400 hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
            }`}
            disabled={compareFull}
            onClick={() => {
              if (inCompare) { removeFromCompare(product.id); toast("Removed from compare"); }
              else { addToCompare(product); toast.success("Added to compare"); }
            }}
          >
            <GitCompare className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Product image */}
        <Link to={`/products/${product.id}`} className="block">
          <div className="relative aspect-square overflow-hidden rounded-[1.1rem] bg-white">
            {primaryImage ? (
              <>
                <img
                  src={primaryImage}
                  alt={product.title}
                  className={`h-full w-full object-contain p-4 transition duration-500 ${
                    secondaryImage ? "group-hover:opacity-0 group-hover:scale-105" : "group-hover:scale-105"
                  }`}
                />
                {secondaryImage ? (
                  <img
                    src={secondaryImage}
                    alt={product.title}
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

      {/* ── Content area ── */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">

        {/* Brand + featured badge */}
        <div className="flex items-center gap-2">
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

        {/* Title */}
        <Link
          to={`/products/${product.id}`}
          className="mt-1.5 line-clamp-2 text-[0.93rem] font-bold leading-[1.35] text-[var(--vr-text)] transition hover:text-[var(--vr-primary)]"
        >
          {product.title}
        </Link>

        {/* Spec chips */}
        {specChips.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
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
          <div className="mt-2.5">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
              {product.categoryName}
            </span>
          </div>
        ) : null}

        {/* Rating + warranty */}
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

        <div className="my-3 border-t border-[var(--vr-border)]" />

        {/* Price + stock */}
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

        {/* CTA buttons */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="flex flex-1 items-center justify-center gap-2 rounded-[1rem] bg-[var(--vr-primary)] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--vr-primary-strong)] disabled:opacity-60"
          >
            <ShoppingCart className="h-4 w-4 shrink-0" />
            {isAddingToCart ? "Adding…" : "Add to Cart"}
          </button>
          <Link
            to={`/products/${product.id}`}
            className="inline-flex items-center justify-center rounded-[1rem] border border-[var(--vr-border)] px-4 py-2.5 text-sm font-semibold text-[var(--vr-primary)] transition hover:border-[var(--vr-primary)] hover:bg-[var(--vr-surface-soft)]"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
