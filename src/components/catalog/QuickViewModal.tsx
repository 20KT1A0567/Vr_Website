import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ExternalLink,
  GitCompare,
  Heart,
  MapPin,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { customerApi } from "api/client";
import { useAuthStore } from "store/authStore";
import { useCartStore } from "store/cartStore";
import { useCompareStore } from "store/compareStore";
import { useQuickViewStore } from "store/quickViewStore";
import { useWishlist } from "../../hooks/useWishlist";
import { getApiErrorMessage } from "../../utils/api";
import { showCartToast } from "../../utils/cartNotifications";
import {
  formatCurrency,
  getProductSavings,
  getProductStockLabel,
  getProductWarrantyLabel,
  getPseudoReviewCount,
  isLowStock,
} from "../../utils/catalog";
import { EASE } from "../../animations/variants";

const CONDITION_LABELS: Record<string, string> = {
  EXCELLENT: "Excellent",
  GOOD: "Good",
  FAIR: "Fair",
};

function buildAllSpecs(product: import("types").Product) {
  const specs: { label: string; value: string }[] = [];
  if (product.processor) specs.push({ label: "Processor", value: product.processor });
  if (product.ramGb) specs.push({ label: "RAM", value: `${product.ramGb} GB` });
  if (product.storageGb) {
    const size = product.storageGb >= 1024 ? `${product.storageGb / 1024} TB` : `${product.storageGb} GB`;
    specs.push({ label: "Storage", value: `${size}${product.storageType ? ` ${product.storageType}` : ""}` });
  }
  if (product.displaySize) specs.push({ label: "Display", value: product.displaySize });
  if (product.os) specs.push({ label: "OS", value: product.os });
  if (product.graphicsCard) specs.push({ label: "GPU", value: product.graphicsCard });
  return specs;
}

export function QuickViewModal() {
  const { product, close } = useQuickViewStore();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const addGuestCartItem = useCartStore((s) => s.addGuestCartItem);
  const { isWishlisted, isWishlistUpdating, toggleWishlist } = useWishlist();
  const { compareList, addToCompare, removeFromCompare, isInCompare } = useCompareStore();

  const [activeImg, setActiveImg] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [wishPop, setWishPop] = useState(false);
  const [comparePop, setComparePop] = useState(false);

  useEffect(() => {
    setActiveImg(0);
    setJustAdded(false);
    setIsAdding(false);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [product, close]);

  if (!product) return null;

  const images = product.images.map((i) => i.imageUrl).filter(Boolean) as string[];
  const savings = getProductSavings(product);
  const lowStock = isLowStock(product);
  const reviewCount = getPseudoReviewCount(product);
  const warrantyLabel = getProductWarrantyLabel(product);
  const stockLabel = getProductStockLabel(product);
  const conditionLabel = CONDITION_LABELS[product.productCondition ?? ""] ?? null;
  const activeStoreCount = product.stores?.filter((s) => s.active).length ?? 0;
  const specs = buildAllSpecs(product);
  const wishlisted = isWishlisted(product.id);
  const inCompare = isInCompare(product.id);
  const rating = product.featured ? "4.8" : "4.6";
  const isUnavailable = !product.available;

  async function handleAddToCart() {
    if (isAdding || isUnavailable) return;
    if (!user) {
      addGuestCartItem(product!, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
      showCartToast({ variant: "saved", productTitle: product!.title, items: useCartStore.getState().guestCart });
      return;
    }
    setIsAdding(true);
    try {
      const nextCart = await customerApi.addToCart(product!.id, 1);
      queryClient.setQueryData(["cart"], nextCart);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
      showCartToast({ variant: "added", productTitle: product!.title, items: nextCart });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to add to cart"));
    } finally {
      setIsAdding(false);
    }
  }

  function handleWishlist() {
    setWishPop(true);
    setTimeout(() => setWishPop(false), 600);
    toggleWishlist(product!);
  }

  function handleCompare() {
    if (inCompare) { removeFromCompare(product!.id); return; }
    setComparePop(true);
    setTimeout(() => setComparePop(false), 600);
    const result = addToCompare(product!);
    if (result === "full") toast.error("Compare list full — remove a product first.");
    else if (result === "category-mismatch") {
      const anchor = compareList[0]?.categoryName ?? "another category";
      toast.error(`Compare is locked to ${anchor}. Clear to switch.`);
    }
  }

  return (
    <AnimatePresence>
      {product && (
        <>
          {/* Backdrop */}
          <motion.div
            key="qv-backdrop"
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={close}
          />

          {/* Modal */}
          <motion.div
            key="qv-modal"
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <motion.div
              className="relative flex max-h-[90vh] w-full max-w-[880px] flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_40px_80px_rgba(15,23,42,0.22)] lg:flex-row"
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
            >
              {/* Close */}
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition hover:bg-slate-100"
              >
                <X className="h-4.5 w-4.5 text-slate-500" />
              </button>

              {/* ── Left: Image panel ── */}
              <div className="relative flex w-full shrink-0 flex-col bg-[linear-gradient(160deg,#eef4fc,#f8fbff)] lg:w-[42%]">
                {/* Discount badge */}
                {product.discountPercent ? (
                  <div className="absolute left-4 top-4 z-10">
                    <span className="rounded-xl bg-[linear-gradient(135deg,#f97316,#ef4444)] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-md">
                      {product.discountPercent}% OFF
                    </span>
                  </div>
                ) : null}

                {/* Stock */}
                <div className="absolute right-4 top-4 z-10">
                  <span className={`rounded-xl px-2.5 py-1 text-[10px] font-bold ${lowStock ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                    {stockLabel}
                  </span>
                </div>

                {/* Main image */}
                <div className="flex h-[280px] items-center justify-center overflow-hidden p-6 lg:h-[340px]">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImg}
                      src={images[activeImg] ?? ""}
                      alt={product.title}
                      className="h-full w-full object-contain drop-shadow-lg"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.04 }}
                      transition={{ duration: 0.28, ease: EASE }}
                    />
                  </AnimatePresence>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex justify-center gap-2 pb-5">
                    {images.slice(0, 5).map((src, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImg(idx)}
                        className={`h-12 w-12 overflow-hidden rounded-xl border-2 bg-white transition-all ${
                          activeImg === idx ? "border-[var(--vr-primary)] shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={src} alt="" className="h-full w-full object-contain p-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Right: Details panel ── */}
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
                {/* Brand + badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--vr-muted)]">
                    {product.brandName ?? "VR Certified"}
                  </span>
                  {product.featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-600">
                      <Sparkles className="h-2.5 w-2.5" />
                      Premium
                    </span>
                  )}
                  {conditionLabel && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-[var(--vr-primary)]">
                      {conditionLabel}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="mt-2 text-[1.25rem] font-black leading-snug text-slate-900">
                  {product.title}
                </h2>

                {/* Rating */}
                <div className="mt-2 flex items-center gap-2 text-[12px] text-[var(--vr-muted)]">
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="text-[var(--vr-text)]">{rating}</span>
                  </span>
                  <span>{reviewCount} reviews</span>
                </div>

                {/* Price */}
                <div className="mt-4 flex items-end gap-3">
                  <span className="text-[2rem] font-black leading-none text-slate-900">
                    {formatCurrency(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="mb-1 text-[13px] text-slate-400 line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                  {savings > 0 && (
                    <span className="mb-1 text-[12px] font-bold text-emerald-600">
                      Save {formatCurrency(savings)}
                    </span>
                  )}
                </div>

                {/* Badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                    <ShieldCheck className="h-3 w-3" />
                    {warrantyLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--vr-surface-soft)] px-2.5 py-1 text-[10px] font-semibold text-[var(--vr-muted)]">
                    <MapPin className="h-3 w-3 text-[var(--vr-primary)]" />
                    {activeStoreCount ? `${activeStoreCount} store${activeStoreCount === 1 ? "" : "s"}` : "Check stores"}
                  </span>
                </div>

                {/* Specs */}
                {specs.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-3">
                    {specs.map(({ label, value }) => (
                      <div key={label} className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--vr-muted)]">{label}</span>
                        <span className="mt-0.5 text-[12px] font-semibold text-[var(--vr-text)]">{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto pt-5">
                  <div className="flex items-center gap-2">
                    {/* Add to Cart */}
                    <motion.button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={isAdding || isUnavailable}
                      whileTap={{ scale: isUnavailable ? 1 : 0.97 }}
                      className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-[14px] text-[13px] font-semibold transition focus:outline-none focus:ring-4 ${
                        isUnavailable
                          ? "cursor-not-allowed bg-slate-200 text-slate-500 focus:ring-slate-200"
                          : "bg-[var(--vr-primary)] text-white hover:bg-[var(--vr-primary-strong)] focus:ring-blue-100"
                      }`}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {justAdded ? (
                          <motion.span key="added" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.18 }} className="flex items-center gap-2">
                            <Check className="h-4 w-4" /> Added!
                          </motion.span>
                        ) : (
                          <motion.span key="default" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.18 }} className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            {isUnavailable ? "Unavailable" : isAdding ? "Adding…" : "Add to Cart"}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    {/* Wishlist */}
                    <motion.button
                      type="button"
                      onClick={handleWishlist}
                      disabled={isWishlistUpdating === product.id}
                      whileTap={{ scale: 0.85 }}
                      animate={wishPop ? { scale: [1, 1.35, 0.9, 1.12, 1] } : {}}
                      transition={wishPop ? { duration: 0.5, ease: EASE } : { type: "spring", stiffness: 400, damping: 20 }}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border transition ${
                        wishlisted ? "border-rose-200 bg-rose-50 text-rose-500" : "border-[var(--vr-border)] bg-[var(--vr-surface-soft)] text-slate-400 hover:text-rose-500"
                      }`}
                    >
                      <Heart className="h-4 w-4" fill={wishlisted ? "currentColor" : "none"} />
                    </motion.button>

                    {/* Compare */}
                    <motion.button
                      type="button"
                      onClick={handleCompare}
                      whileTap={{ scale: 0.9 }}
                      animate={comparePop ? { scale: [1, 1.15, 0.95, 1.05, 1] } : {}}
                      transition={comparePop ? { duration: 0.4, ease: EASE } : { type: "spring", stiffness: 400, damping: 20 }}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border transition ${
                        inCompare ? "border-[var(--vr-primary)] bg-[rgba(30,58,138,0.07)] text-[var(--vr-primary)]" : "border-[var(--vr-border)] bg-[var(--vr-surface-soft)] text-slate-400 hover:text-[var(--vr-primary)]"
                      }`}
                    >
                      <GitCompare className="h-4 w-4" />
                    </motion.button>
                  </div>

                  {/* Full detail link */}
                  <Link
                    to={`/products/${product.id}`}
                    onClick={close}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] border border-[var(--vr-border)] py-2.5 text-[13px] font-semibold text-[var(--vr-text)] transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Full Details
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
