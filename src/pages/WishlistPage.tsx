import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePageMeta } from "../hooks/usePageMeta";
import { Heart, Link2, ShieldCheck, ShoppingCart, Star, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { customerApi } from "api/client";
import { useWishlist } from "../hooks/useWishlist";
import { useAuthStore } from "store/authStore";
import { useCartStore } from "store/cartStore";
import { useWishlistStore } from "store/wishlistStore";
import type { Product } from "types";
import { getApiErrorMessage } from "../utils/api";
import { showCartToast } from "../utils/cartNotifications";
import {
  formatCurrency,
  getProductPrimaryImage,
  getProductSavings,
  getProductStockLabel,
  getProductWarrantyLabel,
  getPseudoReviewCount,
  isLowStock
} from "../utils/catalog";

export function WishlistPage() {
  usePageMeta({ title: "My Wishlist", description: "Your saved products at VR Technologies. Add items to cart or share your wishlist with others." });
  const { wishlist, toggleWishlist, isWishlistUpdating } = useWishlist();
  const user = useAuthStore((state) => state.user);
  const addGuestCartItem = useCartStore((state) => state.addGuestCartItem);
  const removeGuestWishlistItem = useWishlistStore((state) => state.removeGuestWishlistItem);
  const queryClient = useQueryClient();
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  function copyShareLink() {
    if (!wishlist.length) return;
    const ids = wishlist.map((p) => p.id).join(",");
    const url = `${window.location.origin}/products?productIds=${ids}`;
    if (navigator.share) {
      navigator.share({ title: "My VR Technologies Wishlist", url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Wishlist link copied");
    }
  }

  async function handleAddToCart(product: Product) {
    const productId = product.id;
    if (addingToCart === productId) return;

    if (!user) {
      addGuestCartItem(product, 1);
      removeGuestWishlistItem(productId);
      showCartToast({
        variant: "saved",
        productTitle: product.title,
        items: useCartStore.getState().guestCart
      });
      return;
    }

    setAddingToCart(productId);
    try {
      const nextCart = await customerApi.addToCart(productId, 1);
      const nextWishlist = await customerApi.removeFromWishlist(productId);
      queryClient.setQueryData(["cart"], nextCart);
      queryClient.setQueryData(["wishlist"], nextWishlist);
      showCartToast({ variant: "added", productTitle: product.title, items: nextCart });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to add to cart"));
    } finally {
      setAddingToCart(null);
    }
  }

  return (
    <div className="vr-page-shell space-y-6">

      {/* ── Header ── */}
      <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_100%)] px-6 py-9 text-white sm:px-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-block h-[3px] w-7 rounded-full bg-amber-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-400">Saved Items</span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Your Wishlist</h1>
            <p className="mt-1.5 text-sm text-white/55">
              {wishlist.length ? `${wishlist.length} item${wishlist.length !== 1 ? "s" : ""} saved` : "No saved items yet"}
            </p>
          </div>
          {wishlist.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copyShareLink}
                className="inline-flex items-center gap-2 rounded-[1.1rem] border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <Link2 className="h-4 w-4" />
                Share List
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {wishlist.length ? (
        <div className="space-y-3">
          {wishlist.map((product) => {
            const image = getProductPrimaryImage(product);
            const savings = getProductSavings(product);
            const lowStock = isLowStock(product);
            const reviewCount = getPseudoReviewCount(product);
            const rating = product.featured ? "4.8" : "4.6";
            const isRemoving = isWishlistUpdating === product.id;
            const isAddingThis = addingToCart === product.id;

            return (
              <article
                key={product.id}
                className="flex gap-4 overflow-hidden rounded-[1.6rem] border border-[var(--vr-border)] bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.06)] sm:gap-5 sm:p-5"
              >
                {/* Image */}
                <Link to={`/products/${product.id}`} className="shrink-0">
                  <div className="h-24 w-24 overflow-hidden rounded-[1.1rem] bg-[#f4f7fd] sm:h-28 sm:w-28">
                    {image ? (
                      <img src={image} alt={product.title} className="h-full w-full object-contain p-2" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-300">No image</div>
                    )}
                  </div>
                </Link>

                {/* Details */}
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vr-muted)]">
                      {product.brandName ?? "VR Certified"}
                    </div>
                    <Link
                      to={`/products/${product.id}`}
                      className="mt-1 block text-sm font-bold leading-snug text-[var(--vr-text)] transition hover:text-[var(--vr-primary)] sm:text-base line-clamp-2"
                    >
                      {product.title}
                    </Link>

                    {/* Rating + warranty */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--vr-muted)]">
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
                  </div>

                  {/* Price + actions */}
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <div className="text-xl font-extrabold text-[var(--vr-text)]">
                        {formatCurrency(product.price)}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        {product.originalPrice && product.originalPrice > product.price ? (
                          <span className="text-slate-400 line-through">{formatCurrency(product.originalPrice)}</span>
                        ) : null}
                        {savings > 0 ? (
                          <span className="font-bold text-[var(--vr-success)]">Save {formatCurrency(savings)}</span>
                        ) : null}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${lowStock ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                          {getProductStockLabel(product)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={isAddingThis}
                        className="inline-flex items-center gap-2 rounded-[1rem] bg-[var(--vr-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--vr-primary-strong)] disabled:opacity-60"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        {isAddingThis ? "Adding…" : "Add to Cart"}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleWishlist(product)}
                        disabled={isRemoving}
                        title="Remove from wishlist"
                        className="inline-flex items-center gap-2 rounded-[1rem] border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-[var(--vr-border)] bg-white py-20 text-center">
          <div className="rounded-full bg-rose-50 p-5">
            <Heart className="h-10 w-10 text-rose-400" />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold text-[var(--vr-text)]">Your wishlist is empty</h2>
          <p className="mt-2 text-sm text-[var(--vr-muted)]">Tap the heart icon on any product to save it here.</p>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-[1.1rem] bg-[var(--vr-primary)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[var(--vr-primary-strong)]"
          >
            Explore Products
          </Link>
        </div>
      )}
    </div>
  );
}
