import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePageMeta } from "../hooks/usePageMeta";
import {
  BarChart2,
  Bell,
  BellOff,
  CheckCircle2,
  ChevronRight,
  Heart,
  MapPin,
  MessageCircle,
  PhoneCall,
  PlayCircle,
  Send,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  Undo2
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { catalogApi, customerApi } from "api/client";
import { ProductImageZoom } from "components/catalog/ProductImageZoom";
import { Button } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { SectionHeader } from "components/ui/SectionHeader";
import { StatusChip } from "components/ui/StatusChip";
import { StickyMobileBar } from "components/ui/StickyMobileBar";
import { useAuthStore } from "store/authStore";
import { useCompareStore } from "store/compareStore";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import { useReviews } from "../hooks/useReviews";
import { useProductAlerts } from "../hooks/useProductAlerts";
import type { Product } from "types";
import { useWishlist } from "../hooks/useWishlist";
import { getApiErrorMessage } from "../utils/api";
import {
  formatCurrency,
  getProductPrimaryImage,
  getProductStockLabel,
  getProductWarrantyLabel,
  getPseudoReviewCount,
  getPseudoViewerCount,
  isLowStock,
  isProductTodayDealActive
} from "../utils/catalog";
import { getVideoEmbedUrl, isDirectVideoUrl } from "../utils/media";
import { getFieldValue, getVisibleSpecSections, resolveProductCategoryDetailTemplate } from "../utils/productCategorySchema";

function splitDetailText(value: string) {
  return value
    .split(/\r?\n|,|\|/)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function getCustomString(product: Product, key: string) {
  const value = product.customAttributes?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function formatDateLabel(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Date(parsed).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

type DetailTab = "description" | "specifications" | "reviews" | "shipping";

function StarRating({ value, onChange, size = "md" }: { value: number; onChange?: (v: number) => void; size?: "sm" | "md" }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={`${onChange ? "cursor-pointer" : "cursor-default"} transition`}
          aria-label={`${star} star`}
        >
          <Star
            className={`${size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5"} ${star <= value ? "fill-[var(--vr-accent)] text-[var(--vr-accent)]" : "text-slate-300"}`}
          />
        </button>
      ))}
    </div>
  );
}

export function ProductDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { isWishlisted, isWishlistUpdating, toggleWishlist } = useWishlist();
  const { addToCompare, removeFromCompare, isInCompare } = useCompareStore();
  const { trackProduct } = useRecentlyViewed();
  const productQuery = useQuery({ queryKey: ["product", id], queryFn: () => catalogApi.getProduct(id), enabled: Boolean(id) });
  const product = productQuery.data;

  usePageMeta({
    title: product?.title,
    description: product ? `Buy ${product.title} — certified refurbished with ${product.warrantyMonths ?? 6}-month warranty. ${product.processor ?? ""} ${product.ramGb ? product.ramGb + "GB RAM" : ""}`.trim() : undefined,
    image: product?.images[0]?.imageUrl
  });
  const { reviews, addReview, averageRating } = useReviews(product?.id ?? 0);
  const { isAlerted, subscribe, unsubscribe } = useProductAlerts(product?.id ?? 0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<DetailTab>("description");
  const [pendingCartAction, setPendingCartAction] = useState<"cart" | "buyNow" | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", body: "", authorName: user?.name ?? "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [alertEmail, setAlertEmail] = useState(user?.email ?? "");
  const [showAlertForm, setShowAlertForm] = useState<"back-in-stock" | "price-drop" | null>(null);

  useEffect(() => {
    setActiveIndex(0);
    setActiveTab("description");
    if (product) trackProduct(product);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const images = useMemo(
    () => (product?.images.length ? product.images : [{ id: 0, imageUrl: "", primaryImage: true, sortOrder: 0 }]),
    [product]
  );

  if (productQuery.error) {
    return (
      <div className="vr-page-shell">
        <Card className="border-rose-200 bg-rose-50 text-rose-700">
          <div className="text-sm font-semibold uppercase tracking-[0.24em]">Product API Error</div>
          <h1 className="mt-4 text-3xl font-bold text-rose-900">This product could not be loaded.</h1>
          <p className="mt-3 text-base">{getApiErrorMessage(productQuery.error, "Check the backend product API.")}</p>
        </Card>
      </div>
    );
  }

  if (productQuery.isLoading || !product) {
    return (
      <div className="vr-page-shell">
        <Card className="p-8 text-slate-500">Loading product...</Card>
      </div>
    );
  }

  const detailTemplate = resolveProductCategoryDetailTemplate(product.categoryName);
  const visibleSpecSections = getVisibleSpecSections(product, detailTemplate);
  const todayDealActive = isProductTodayDealActive(product);
  const wishlisted = isWishlisted(product.id);
  const activeImage = images[activeIndex] ?? images[0];
  const overviewHighlights = [
    getCustomString(product, "idealFor") ? `Ideal for: ${getCustomString(product, "idealFor")}` : null,
    getCustomString(product, "connectivity") ? `Connectivity: ${getCustomString(product, "connectivity")}` : null,
    getCustomString(product, "ports") ? `Ports: ${getCustomString(product, "ports")}` : null,
    getCustomString(product, "boxContents") ? `In the box: ${getCustomString(product, "boxContents")}` : null
  ]
    .filter((item): item is string => Boolean(item))
    .flatMap((item) => splitDetailText(item))
    .slice(0, 4);

  const detailChips = visibleSpecSections
    .flatMap((section) => section.fields.map((field) => field.value))
    .filter((value): value is string => typeof value === "string" && value.length <= 42)
    .slice(0, 6);

  const trustHighlights = [
    {
      title: product.warrantyMonths ? `${product.warrantyMonths} Month Warranty` : "Warranty Included",
      subtitle: "Store-backed support for eligible products.",
      icon: ShieldCheck
    },
    { title: "Quality Checked", subtitle: "Multi-point checks before dispatch.", icon: CheckCircle2 },
    { title: product.returnDays ? `${product.returnDays} Day Returns` : "Easy Returns", subtitle: "Support that stays visible before checkout.", icon: Undo2 },
    { title: "Fast Delivery", subtitle: "Pickup or delivery based on available stores.", icon: Truck }
  ] as const;

  const reviewCount = getPseudoReviewCount(product);
  const viewerCount = getPseudoViewerCount(product);
  const lowStock = isLowStock(product);
  const videoEmbedUrl = getVideoEmbedUrl(product.videoUrl);
  const directVideoUrl = isDirectVideoUrl(product.videoUrl);
  const whatsappNumber = product.stores.find((store) => store.whatsapp)?.whatsapp ?? "919999999999";

  async function handleAddToCart() {
    if (!product || !user || pendingCartAction) {
      if (!user) {
        toast.error("Login to add this product to cart");
      }
      return;
    }

    setPendingCartAction("cart");
    try {
      const updatedCart = await customerApi.addToCart(product.id, 1);
      queryClient.setQueryData(["cart"], updatedCart);
      toast.success("Added to cart");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to add product to cart"));
    } finally {
      setPendingCartAction(null);
    }
  }

  async function handleBuyNow() {
    if (!product || !user || pendingCartAction) {
      if (!user) {
        toast.error("Login to continue to checkout");
        navigate("/login");
      }
      return;
    }

    setPendingCartAction("buyNow");
    try {
      const updatedCart = await customerApi.addToCart(product.id, 1);
      queryClient.setQueryData(["cart"], updatedCart);
      navigate("/checkout");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to continue to checkout"));
    } finally {
      setPendingCartAction(null);
    }
  }

  return (
    <div className="vr-page-shell space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="transition hover:text-slate-700">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/products" className="transition hover:text-slate-700">
          Products
        </Link>
        {product.categoryName ? (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>{product.categoryName}</span>
          </>
        ) : null}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--vr-primary)]">{product.title}</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="space-y-6">
          <Card className="p-4 sm:p-5">
            <ProductImageZoom imageUrl={activeImage.imageUrl} alt={product.title} />

            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => setActiveIndex(index)}
                  className={`aspect-square overflow-hidden rounded-[1rem] border p-1 transition ${
                    index === activeIndex ? "border-[var(--vr-primary)] bg-white shadow-[0_0_0_3px_rgba(30,58,138,0.1)]" : "border-[var(--vr-border)] bg-[var(--vr-surface-soft)]"
                  }`}
                >
                  {image.imageUrl ? (
                    <img src={image.imageUrl} alt="" className="h-full w-full rounded-[0.8rem] object-contain bg-white p-2" />
                  ) : (
                    <div className="h-full w-full rounded-[0.8rem] bg-white" />
                  )}
                </button>
              ))}
            </div>
          </Card>

          {product.videoUrl ? (
            <Card className="overflow-hidden p-0">
              <div className="border-b border-[var(--vr-border)] px-5 py-4">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--vr-primary)]">
                  <PlayCircle className="h-4 w-4" />
                  Product Video
                </div>
              </div>
              <div className="aspect-video bg-[var(--vr-surface-soft)]">
                {directVideoUrl ? (
                  <video src={product.videoUrl} controls className="h-full w-full object-cover" />
                ) : videoEmbedUrl ? (
                  <iframe
                    src={videoEmbedUrl}
                    title={`${product.title} video`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--vr-muted)]">Video preview unavailable.</div>
                )}
              </div>
            </Card>
          ) : null}
        </section>

        <aside className="xl:sticky xl:top-28 xl:h-fit">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip label={product.brandName ?? "VR Certified"} tone="muted" />
              <StatusChip label={product.categoryName ?? detailTemplate.label} tone="primary" />
              <StatusChip label={product.productCondition ?? "Certified"} tone="success" />
              {product.bestSeller ? <StatusChip label="Best Seller" tone="accent" /> : null}
              {todayDealActive ? <StatusChip label="Today Deal" tone="danger" /> : null}
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-[var(--vr-text)] lg:text-[2.6rem]">{product.title}</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--vr-muted)]">{detailTemplate.intro}</p>
            <p className="mt-2 text-sm text-slate-500">
              {getFieldValue(product, { source: "computed", key: "processorSummary", label: "Processor" }) ?? "Configured system"}
              {product.modelNumber ? ` | ${product.modelNumber}` : ""}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--vr-muted)]">
              <div className="inline-flex items-center gap-1 text-[var(--vr-accent)]">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-semibold text-[var(--vr-text)]">4.7</span>
              </div>
              <span>{reviewCount} reviews</span>
              <span>{viewerCount} people viewing now</span>
            </div>

            <div className="mt-5 flex flex-wrap items-end gap-3">
              <div className="text-4xl font-extrabold text-[var(--vr-text)]">{formatCurrency(product.price)}</div>
              {product.originalPrice ? <div className="pb-1 text-lg text-slate-400 line-through">{formatCurrency(product.originalPrice)}</div> : null}
              {product.discountPercent ? <StatusChip label={`${product.discountPercent}% Off`} tone="accent" /> : null}
            </div>

            <div className="mt-5 rounded-[1.3rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4">
              <div className={`text-sm font-semibold ${lowStock ? "text-[var(--vr-danger)]" : "text-[var(--vr-success)]"}`}>{getProductStockLabel(product)}</div>
              <div className="mt-1 text-sm text-[var(--vr-muted)]">
                {getProductWarrantyLabel(product)}
                {todayDealActive && product.dealEndDate ? ` | Deal ends ${formatDateLabel(product.dealEndDate)}` : ""}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {detailChips.map((item) => (
                <span key={item} className="rounded-full border border-[var(--vr-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--vr-text)]">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-[var(--vr-border)] bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Why Buy This?</div>
              <div className="mt-3 grid gap-2 text-sm text-[var(--vr-muted)]">
                {(overviewHighlights.length ? overviewHighlights : detailTemplate.merchandisingPoints).slice(0, 4).map((item) => (
                  <div key={item} className="inline-flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vr-primary)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button icon={<ShoppingCart className="h-4 w-4" />} fullWidth size="lg" onClick={handleAddToCart} disabled={pendingCartAction !== null}>
                {pendingCartAction === "cart" ? "Adding..." : "Add to Cart"}
              </Button>
              <Button variant="accent" fullWidth size="lg" onClick={handleBuyNow} disabled={pendingCartAction !== null}>
                {pendingCartAction === "buyNow" ? "Continuing..." : "Buy Now"}
              </Button>
              <Button
                variant={wishlisted ? "danger" : "secondary"}
                fullWidth
                className="sm:col-span-2"
                icon={<Heart className="h-4 w-4" fill={wishlisted ? "currentColor" : "none"} />}
                disabled={isWishlistUpdating === product.id}
                onClick={() => toggleWishlist(product)}
              >
                {wishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
              </Button>
              <Button
                variant={isInCompare(product.id) ? "primary" : "secondary"}
                fullWidth
                className="sm:col-span-2"
                icon={<BarChart2 className="h-4 w-4" />}
                onClick={() => {
                  if (isInCompare(product.id)) {
                    removeFromCompare(product.id);
                    toast("Removed from comparison");
                  } else {
                    const added = addToCompare(product);
                    if (added) {
                      toast.success("Added to comparison — visit /compare to view");
                    } else {
                      toast.error("You can compare up to 3 products at a time");
                    }
                  }
                }}
              >
                {isInCompare(product.id) ? "In Comparison" : "Compare"}
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-[var(--vr-muted)]">Share:</span>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Check out ${product.title} — ${window.location.href}`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--vr-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--vr-text)] transition hover:bg-[#25D366] hover:text-white hover:border-[#25D366]"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: product.title, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard");
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--vr-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--vr-text)] transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
              <a
                href={`https://www.instagram.com/?url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--vr-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--vr-text)] transition hover:bg-[#E1306C] hover:text-white hover:border-[#E1306C]"
              >
                <Send className="h-3.5 w-3.5" />
                Instagram
              </a>
            </div>

            {!product.available || (product.stockQuantity ?? 0) === 0 ? (
              <div className="mt-4 rounded-[1.3rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4">
                <div className="text-sm font-semibold text-[var(--vr-text)]">Get notified when available</div>
                {isAlerted("back-in-stock") ? (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-[var(--vr-success)]">You're on the back-in-stock list.</span>
                    <button
                      type="button"
                      onClick={() => { unsubscribe("back-in-stock"); toast("Alert removed"); }}
                      className="inline-flex items-center gap-1.5 text-xs text-[var(--vr-danger)]"
                    >
                      <BellOff className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                ) : showAlertForm === "back-in-stock" ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      className="vr-input flex-1 py-2 text-xs"
                      placeholder="Your email"
                      value={alertEmail}
                      onChange={(e) => setAlertEmail(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!alertEmail.includes("@")) { toast.error("Enter a valid email"); return; }
                        subscribe("back-in-stock", alertEmail);
                        setShowAlertForm(null);
                        toast.success("You'll be notified when this item is back in stock");
                      }}
                      className="rounded-xl bg-[var(--vr-primary)] px-3 py-2 text-xs font-semibold text-white"
                    >
                      Notify Me
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAlertForm("back-in-stock")}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--vr-primary)]"
                  >
                    <Bell className="h-3.5 w-3.5" /> Notify when in stock
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-[1.3rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4">
                <div className="text-sm font-semibold text-[var(--vr-text)]">Price drop alert</div>
                {isAlerted("price-drop") ? (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-[var(--vr-success)]">You're watching this price.</span>
                    <button
                      type="button"
                      onClick={() => { unsubscribe("price-drop"); toast("Alert removed"); }}
                      className="inline-flex items-center gap-1.5 text-xs text-[var(--vr-danger)]"
                    >
                      <BellOff className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                ) : showAlertForm === "price-drop" ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      className="vr-input flex-1 py-2 text-xs"
                      placeholder="Your email"
                      value={alertEmail}
                      onChange={(e) => setAlertEmail(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!alertEmail.includes("@")) { toast.error("Enter a valid email"); return; }
                        subscribe("price-drop", alertEmail, product.price);
                        setShowAlertForm(null);
                        toast.success("You'll be notified if the price drops");
                      }}
                      className="rounded-xl bg-[var(--vr-primary)] px-3 py-2 text-xs font-semibold text-white"
                    >
                      Watch Price
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAlertForm("price-drop")}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--vr-primary)]"
                  >
                    <Bell className="h-3.5 w-3.5" /> Alert me on price drop
                  </button>
                )}
              </div>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {trustHighlights.map((item) => (
                <div key={item.title} className="rounded-[1.2rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4">
                  <div className="flex items-center gap-2 text-[var(--vr-primary)]">
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm font-semibold text-[var(--vr-text)]">{item.title}</span>
                  </div>
                  <div className="mt-2 text-xs leading-6 text-[var(--vr-muted)]">{item.subtitle}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4 text-sm text-[var(--vr-muted)]">
              <div className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--vr-primary)]" />
                {product.stores.length} store(s) can fulfill this order
              </div>
              <div className="mt-3 inline-flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-[var(--vr-primary)]" />
                Store-backed phone support available
              </div>
              <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 font-semibold text-[var(--vr-primary)]">
                <MessageCircle className="h-4 w-4" />
                WhatsApp quick enquiry
              </a>
            </div>
          </Card>
        </aside>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-[var(--vr-border)] pb-4">
          {[
            ["description", "Description"],
            ["specifications", "Specifications"],
            ["reviews", "Reviews"],
            ["shipping", "Shipping and Returns"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value as DetailTab)}
              className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === value ? "bg-[var(--vr-primary)] text-white" : "bg-[var(--vr-surface-soft)] text-[var(--vr-muted)] hover:text-[var(--vr-primary)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "description" ? (
          <div className="grid gap-6 pt-6 xl:grid-cols-[1fr_320px]">
            <div>
              <SectionHeader title={detailTemplate.label} description={product.description ?? detailTemplate.intro} />
              <div className="mt-5 grid gap-3">
                {detailTemplate.merchandisingPoints.map((item) => (
                  <div key={item} className="rounded-[1.2rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-3 text-sm leading-7 text-[var(--vr-text)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Card variant="subtle">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Quick View</div>
                <div className="mt-4 grid gap-3">
                  {(visibleSpecSections[0]?.fields ?? []).slice(0, 4).map((field) => (
                    <div key={field.label} className="rounded-[1rem] border border-[var(--vr-border)] bg-white px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{field.label}</div>
                      <div className="mt-2 text-sm font-semibold text-[var(--vr-text)]">{field.value}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {getProductPrimaryImage(product) ? (
                <Card variant="subtle">
                  <img src={getProductPrimaryImage(product)} alt={product.title} className="mx-auto h-48 w-full object-contain" />
                </Card>
              ) : null}
            </div>
          </div>
        ) : null}

        {activeTab === "specifications" ? (
          <div className="space-y-4 pt-6">
            {visibleSpecSections.map((section) => (
              <Card key={section.title} variant="subtle">
                <h3 className="text-lg font-bold text-[var(--vr-text)]">{section.title}</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {section.fields.map((field) => (
                    <div key={`${section.title}-${field.label}`} className="rounded-[1.2rem] border border-[var(--vr-border)] bg-white p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{field.label}</div>
                      <div className="mt-2 text-base font-semibold text-[var(--vr-text)]">{field.value}</div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        {activeTab === "reviews" ? (
          <div className="space-y-5 pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card variant="subtle">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Average Rating</div>
                <div className="mt-3 text-4xl font-extrabold text-[var(--vr-text)]">
                  {averageRating !== null ? averageRating.toFixed(1) : "—"}
                </div>
                {averageRating !== null ? (
                  <div className="mt-2">
                    <StarRating value={Math.round(averageRating)} size="sm" />
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[var(--vr-muted)]">No reviews yet.</p>
                )}
              </Card>
              <Card variant="subtle">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Total Reviews</div>
                <div className="mt-3 text-4xl font-extrabold text-[var(--vr-text)]">{reviews.length}</div>
                <p className="mt-2 text-sm leading-7 text-[var(--vr-muted)]">Verified customer reviews submitted on this device.</p>
              </Card>
              <Card variant="subtle">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Write a Review</div>
                <p className="mt-2 text-sm leading-7 text-[var(--vr-muted)]">Share your experience to help other buyers make confident decisions.</p>
              </Card>
            </div>

            <Card>
              <div className="text-base font-bold text-[var(--vr-text)]">Write a Review</div>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-2 text-xs font-semibold text-[var(--vr-muted)]">Your Rating</div>
                  <StarRating value={reviewForm.rating} onChange={(v) => setReviewForm((c) => ({ ...c, rating: v }))} />
                </div>
                <input
                  className="vr-input"
                  placeholder="Your name"
                  value={reviewForm.authorName}
                  onChange={(e) => setReviewForm((c) => ({ ...c, authorName: e.target.value }))}
                />
                <input
                  className="vr-input"
                  placeholder="Review title (e.g. Great value for money)"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm((c) => ({ ...c, title: e.target.value }))}
                />
                <textarea
                  className="vr-input min-h-[100px] rounded-[1.3rem] py-3"
                  placeholder="Describe your experience with this product..."
                  value={reviewForm.body}
                  onChange={(e) => setReviewForm((c) => ({ ...c, body: e.target.value }))}
                />
                <Button
                  disabled={isSubmittingReview || !reviewForm.title.trim() || !reviewForm.body.trim() || !reviewForm.authorName.trim()}
                  onClick={() => {
                    setIsSubmittingReview(true);
                    addReview({ ...reviewForm, verifiedPurchase: Boolean(user) });
                    setReviewForm({ rating: 5, title: "", body: "", authorName: user?.name ?? "" });
                    toast.success("Review submitted!");
                    setIsSubmittingReview(false);
                  }}
                >
                  Submit Review
                </Button>
              </div>
            </Card>

            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <Card key={review.id} variant="subtle">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <StarRating value={review.rating} size="sm" />
                          {review.verifiedPurchase ? (
                            <span className="rounded-full bg-[rgba(22,163,74,0.1)] px-2 py-0.5 text-[10px] font-semibold text-[var(--vr-success)]">Verified</span>
                          ) : null}
                        </div>
                        <div className="mt-2 font-semibold text-[var(--vr-text)]">{review.title}</div>
                        <p className="mt-1 text-sm leading-7 text-[var(--vr-muted)]">{review.body}</p>
                        <div className="mt-2 text-xs text-slate-400">
                          {review.authorName} · {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card variant="subtle" className="text-center">
                <p className="text-sm text-[var(--vr-muted)]">Be the first to review this product.</p>
              </Card>
            )}
          </div>
        ) : null}

        {activeTab === "shipping" ? (
          <div className="grid gap-4 pt-6 xl:grid-cols-[1fr_0.95fr]">
            <div className="grid gap-4 md:grid-cols-2">
              <Card variant="subtle">
                <div className="text-sm font-semibold text-[var(--vr-text)]">Warranty</div>
                <p className="mt-2 text-sm leading-7 text-[var(--vr-muted)]">{product.warrantySummary ?? "Store-backed warranty support across mapped branches."}</p>
              </Card>
              <Card variant="subtle">
                <div className="text-sm font-semibold text-[var(--vr-text)]">Returns</div>
                <p className="mt-2 text-sm leading-7 text-[var(--vr-muted)]">{product.returnDays ? `${product.returnDays} day easy return window.` : "Return support available from your fulfillment store."}</p>
              </Card>
              <Card variant="subtle">
                <div className="text-sm font-semibold text-[var(--vr-text)]">Delivery</div>
                <p className="mt-2 text-sm leading-7 text-[var(--vr-muted)]">Fast delivery or store pickup depending on branch availability.</p>
              </Card>
              <Card variant="subtle">
                <div className="text-sm font-semibold text-[var(--vr-text)]">Support</div>
                <p className="mt-2 text-sm leading-7 text-[var(--vr-muted)]">Phone and WhatsApp support for product questions and order status.</p>
              </Card>
            </div>

            <Card variant="subtle">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Condition and Readiness</div>
              <div className="mt-4 grid gap-3">
                {detailTemplate.merchandisingPoints.slice(0, 4).map((point) => (
                  <div key={point} className="inline-flex items-start gap-2 text-sm leading-7 text-[var(--vr-muted)]">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--vr-primary)]" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : null}
      </Card>

      <Card>
        <SectionHeader
          eyebrow="Store Availability"
          title="Nearby branches that can fulfill this order"
          description="Pickup, support, and follow-up stay tied to real stores so buyers feel more secure ordering refurbished tech."
          action={<span className="rounded-full border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--vr-text)]">{product.stores.length} mapped store(s)</span>}
        />

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {product.stores.map((store) => (
            <Card key={store.id} variant="subtle">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[var(--vr-text)]">{store.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--vr-muted)]">
                    {store.address}, {store.city}, {store.state}
                  </p>
                </div>
                <StatusChip label={store.active ? "Available" : "Inactive"} tone={store.active ? "success" : "danger"} />
              </div>

              <div className="mt-4 space-y-2 text-sm text-[var(--vr-muted)]">
                <div className="inline-flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-[var(--vr-primary)]" />
                  {store.phone}
                </div>
                {store.timings ? (
                  <div className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[var(--vr-primary)]" />
                    {store.timings}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {store.mapLink ? (
                  <a href={store.mapLink} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-2xl bg-[var(--vr-primary)] px-4 py-3 text-sm font-semibold text-white">
                    Directions
                  </a>
                ) : null}
                {store.whatsapp ? (
                  <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-2xl border border-[var(--vr-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--vr-text)]">
                    WhatsApp
                  </a>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <StickyMobileBar>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[var(--vr-muted)]">{todayDealActive ? "Deal price" : "Starting at"}</div>
            <div className="text-lg font-extrabold text-[var(--vr-text)]">{formatCurrency(product.price)}</div>
          </div>
          <div className="flex flex-1 gap-3">
            <Button variant="secondary" fullWidth onClick={handleAddToCart} disabled={pendingCartAction !== null}>
              Cart
            </Button>
            <Button variant="accent" fullWidth onClick={handleBuyNow} disabled={pendingCartAction !== null}>
              Buy Now
            </Button>
          </div>
        </div>
      </StickyMobileBar>
    </div>
  );
}
