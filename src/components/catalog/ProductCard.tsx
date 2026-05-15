import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Check, GitCompare, Heart, MapPin, ShieldCheck, ShoppingCart, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { customerApi } from "api/client";
import type { Product } from "types";
import { useAuthStore } from "store/authStore";
import { useCartStore } from "store/cartStore";
import { useCompareStore } from "store/compareStore";
import { useWishlist } from "../../hooks/useWishlist";
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
import { EASE } from "../../animations/variants";

interface ProductCardProps {
  product: Product;
}

function buildSpecChips(product: Product): string[] {
  const chips: string[] = [];
  if (product.processor) chips.push(product.processor);
  if (product.ramGb) chips.push(`${product.ramGb} GB RAM`);
  if (product.storageGb) {
    const storage = product.storageGb >= 1024 ? `${product.storageGb / 1024} TB` : `${product.storageGb} GB`;
    chips.push(`${storage}${product.storageType ? ` ${product.storageType}` : ""}`);
  }
  return chips.slice(0, 3);
}

function formatCondition(condition?: Product["productCondition"]) {
  if (!condition) return null;
  if (condition === "EXCELLENT") return "Excellent";
  if (condition === "GOOD") return "Good";
  if (condition === "FAIR") return "Fair";
  return condition;
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

  const inCompare = isInCompare(product.id);

  const primaryImage = getProductPrimaryImage(product);
  const secondaryImage = product.images.find((img) => !img.primaryImage)?.imageUrl ?? product.images[1]?.imageUrl;
  const wishlisted = isWishlisted(product.id);
  const savings = getProductSavings(product);
  const lowStock = isLowStock(product);
  const reviewCount = getPseudoReviewCount(product);
  const specChips = buildSpecChips(product);
  const rating = product.featured ? "4.8" : "4.6";
  const activeStoreCount = product.stores?.filter((store) => store.active).length ?? 0;
  const conditionLabel = formatCondition(product.productCondition);
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
              : "border-white/80 bg-white/90 text-slate-500 opacity-0 group-hover:opacity-100 hover:border-[rgba(30,58,138,0.3)] hover:bg-white hover:text-[var(--vr-primary)]"
          }`}
        >
          {inCompare
            ? <><Check className="h-3 w-3 shrink-0" /><span>Comparing</span></>
            : <><GitCompare className="h-3 w-3 shrink-0" /><span>Compare</span></>
          }
        </motion.button>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
        {/* ── Brand + premium ── */}
        <motion.div
          className="flex min-h-[1rem] flex-wrap items-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.05, ease: EASE }}
        >
          <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--vr-muted)]">
            {product.brandName ?? "VR Certified"}
          </span>
          {product.featured ? (
            <motion.span
              className="inline-flex h-6 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.2 }}
            >
              <Sparkles className="h-2.5 w-2.5" />
              Premium
            </motion.span>
          ) : null}
        </motion.div>

        <Link
          to={`/products/${product.id}`}
          className="mt-2 min-h-[3rem] line-clamp-2 text-[15px] font-bold leading-snug text-slate-900 transition hover:text-[var(--vr-primary)]"
        >
          {product.title}
        </Link>

        {/* ── Spec chips: stagger reveal ── */}
        <motion.div
          className="mt-2.5 flex min-h-[2rem] flex-wrap gap-1.5"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
          }}
        >
          {specChips.length > 0 ? (
            specChips.map((chip) => (
              <motion.span
                key={chip}
                className="inline-flex h-7 items-center rounded-full bg-slate-100 px-2.5 text-[10px] font-semibold text-slate-600"
                variants={{
                  hidden: { opacity: 0, scale: 0.75 },
                  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE } },
                }}
              >
                {chip}
              </motion.span>
            ))
          ) : product.categoryName ? (
            <motion.span
              className="inline-flex h-7 items-center rounded-full bg-slate-100 px-2.5 text-[10px] font-semibold text-slate-600"
              variants={{
                hidden: { opacity: 0, scale: 0.75 },
                show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE } },
              }}
            >
              {product.categoryName}
            </motion.span>
          ) : null}
        </motion.div>

        {/* ── Rating ── */}
        <div className="mt-2.5 flex min-h-[1.5rem] flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[var(--vr-muted)]">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="text-[var(--vr-text)]">{rating}</span>
          </span>
          <span>{reviewCount} reviews</span>
        </div>

        {/* ── Warranty + store + condition badges ── */}
        <div className="mt-2.5 flex min-h-[2rem] flex-wrap items-center gap-1.5">
          <motion.span
            className="inline-flex h-7 items-center gap-1 rounded-full bg-emerald-50 px-2.5 text-[10px] font-semibold text-emerald-700"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE, delay: 0.18 }}
          >
            <ShieldCheck className="h-3 w-3" />
            {getProductWarrantyLabel(product)}
          </motion.span>
          <motion.span
            className="inline-flex h-7 items-center gap-1 rounded-full bg-[var(--vr-surface-soft)] px-2.5 text-[10px] font-semibold text-[var(--vr-muted)]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE, delay: 0.24 }}
          >
            <MapPin className="h-3 w-3 text-[var(--vr-primary)]" />
            {activeStoreCount ? `${activeStoreCount} store${activeStoreCount === 1 ? "" : "s"}` : "Store check"}
          </motion.span>
          {conditionLabel ? (
            <motion.span
              className="inline-flex h-7 items-center rounded-full bg-blue-50 px-2.5 text-[10px] font-semibold text-[var(--vr-primary)]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE, delay: 0.3 }}
            >
              {conditionLabel}
            </motion.span>
          ) : null}
        </div>

        <div className="mt-auto pt-3.5">
          <div className="border-t border-[var(--vr-border)] pt-3.5">
            <div className="flex items-start justify-between gap-3">
              {/* ── Price: fade up ── */}
              <motion.div
                className="min-w-0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: 0.22 }}
              >
                <div className="text-[1.8rem] font-black leading-none text-slate-900">
                  {formatCurrency(product.price)}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                  {product.originalPrice && product.originalPrice > product.price ? (
                    <span className="text-slate-400 line-through">{formatCurrency(product.originalPrice)}</span>
                  ) : null}
                  {savings > 0 ? (
                    <span className="font-bold text-[var(--vr-success)]">Save {formatCurrency(savings)}</span>
                  ) : null}
                </div>
              </motion.div>

              {/* ── Stock badge: slide from right ── */}
              <motion.span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  lowStock ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
                }`}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.36, ease: EASE, delay: 0.28 }}
              >
                {getProductStockLabel(product)}
              </motion.span>
            </div>

            {/* ── Add to Cart button ── */}
            <motion.button
              type="button"
              onClick={handleAddToCart}
              disabled={isAddingToCart || isUnavailable}
              whileTap={{ scale: isUnavailable ? 1 : 0.97 }}
              whileHover={isUnavailable ? {} : { scale: 1.01 }}
              className={`mt-3.5 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] px-4 text-[14px] font-semibold transition duration-200 focus:outline-none focus:ring-4 ${
                isUnavailable
                  ? "cursor-not-allowed bg-slate-200 text-slate-500 focus:ring-slate-200"
                  : "bg-[var(--vr-primary)] text-white hover:bg-[var(--vr-primary-strong)] focus:ring-blue-100"
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
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4 shrink-0" />
                    Added!
                  </motion.span>
                ) : (
                  <motion.span
                    key="default"
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="flex items-center gap-2"
                  >
                    <motion.span
                      className="flex items-center"
                      whileHover={isUnavailable ? {} : { x: 3 }}
                      transition={{ duration: 0.2, ease: EASE }}
                    >
                      <ShoppingCart className="h-4 w-4 shrink-0" />
                    </motion.span>
                    {isAddingToCart ? "Adding..." : "Add to Cart"}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>
    </article>
  );
}
