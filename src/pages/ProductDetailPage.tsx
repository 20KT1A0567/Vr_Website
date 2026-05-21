import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePageMeta } from "../hooks/usePageMeta";
import {
  BarChart2,
  Battery,
  Bell,
  BellOff,
  Box,
  Camera,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  Hash,
  Heart,
  Keyboard,
  Layers,
  MapPin,
  MemoryStick,
  MessageCircle,
  Monitor,
  Package,
  PhoneCall,
  PlayCircle,
  Plug2,
  Scale,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Star,
  Tag,
  Target,
  Truck,
  Undo2,
  Volume2,
  Wifi,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { catalogApi, customerApi } from "api/client";
import { ProductCard } from "components/catalog/ProductCard";
import { ProductImageZoom } from "components/catalog/ProductImageZoom";
import { Button } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { SectionHeader } from "components/ui/SectionHeader";
import { StatusChip } from "components/ui/StatusChip";
import { StickyMobileBar } from "components/ui/StickyMobileBar";
import { useAuthStore } from "store/authStore";
import { useCartStore } from "store/cartStore";
import { useCompareStore } from "store/compareStore";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import { useReviews } from "../hooks/useReviews";
import { useProductAlerts } from "../hooks/useProductAlerts";
import type { Product } from "types";
import { useWishlist } from "../hooks/useWishlist";
import { getApiErrorMessage } from "../utils/api";
import { showCartToast } from "../utils/cartNotifications";
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

const SPEC_ICON_MAP: Array<{ patterns: string[]; Icon: LucideIcon; bg: string; color: string }> = [
  { patterns: ["processor", "cpu", "generation", "gen"], Icon: Cpu, bg: "bg-blue-50", color: "text-blue-600" },
  { patterns: ["ram", "memory"], Icon: MemoryStick, bg: "bg-purple-50", color: "text-purple-600" },
  { patterns: ["storage", "ssd", "hdd", "drive"], Icon: HardDrive, bg: "bg-orange-50", color: "text-orange-600" },
  { patterns: ["display", "screen", "size", "resolution", "pixel"], Icon: Monitor, bg: "bg-cyan-50", color: "text-cyan-600" },
  { patterns: ["operating", "windows", "linux", "macos", "os", "system"], Icon: Layers, bg: "bg-sky-50", color: "text-sky-600" },
  { patterns: ["graphics", "gpu", "video"], Icon: Zap, bg: "bg-yellow-50", color: "text-yellow-600" },
  { patterns: ["battery", "cycle"], Icon: Battery, bg: "bg-green-50", color: "text-green-600" },
  { patterns: ["weight"], Icon: Scale, bg: "bg-slate-100", color: "text-slate-600" },
  { patterns: ["warranty"], Icon: ShieldCheck, bg: "bg-emerald-50", color: "text-emerald-600" },
  { patterns: ["return"], Icon: Undo2, bg: "bg-rose-50", color: "text-rose-600" },
  { patterns: ["port", "slot", "usb", "hdmi"], Icon: Plug2, bg: "bg-indigo-50", color: "text-indigo-600" },
  { patterns: ["connect", "wifi", "bluetooth", "lan", "ethernet"], Icon: Wifi, bg: "bg-teal-50", color: "text-teal-600" },
  { patterns: ["webcam", "camera"], Icon: Camera, bg: "bg-pink-50", color: "text-pink-600" },
  { patterns: ["keyboard", "input"], Icon: Keyboard, bg: "bg-violet-50", color: "text-violet-600" },
  { patterns: ["ideal", "use"], Icon: Target, bg: "bg-amber-50", color: "text-amber-600" },
  { patterns: ["model", "number"], Icon: Hash, bg: "bg-slate-100", color: "text-slate-500" },
  { patterns: ["box", "contents", "include", "package", "charger"], Icon: Package, bg: "bg-lime-50", color: "text-lime-600" },
  { patterns: ["refresh", "hz", "response", "brightness"], Icon: Gauge, bg: "bg-blue-50", color: "text-blue-600" },
  { patterns: ["panel", "type"], Icon: Monitor, bg: "bg-indigo-50", color: "text-indigo-600" },
  { patterns: ["form factor", "form"], Icon: Box, bg: "bg-slate-100", color: "text-slate-500" },
  { patterns: ["audio", "sound", "speaker", "optical"], Icon: Volume2, bg: "bg-purple-50", color: "text-purple-600" },
  { patterns: ["series"], Icon: Tag, bg: "bg-slate-100", color: "text-slate-500" },
  { patterns: ["condition"], Icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" },
  { patterns: ["database", "ram type"], Icon: Database, bg: "bg-purple-50", color: "text-purple-600" },
];

function getSpecMeta(label: string): { Icon: LucideIcon; bg: string; color: string } {
  const lower = label.toLowerCase();
  return SPEC_ICON_MAP.find((entry) => entry.patterns.some((p) => lower.includes(p))) ?? { Icon: Settings, bg: "bg-slate-100", color: "text-slate-400" };
}

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

type DetailTab = "description" | "specifications" | "about" | "reviews" | "shipping";

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
  const addGuestCartItem = useCartStore((state) => state.addGuestCartItem);
  const { isWishlisted, isWishlistUpdating, toggleWishlist } = useWishlist();
  const { addToCompare, removeFromCompare, isInCompare } = useCompareStore();
  const { trackProduct } = useRecentlyViewed();
  const productQuery = useQuery({ queryKey: ["product", id], queryFn: () => catalogApi.getProduct(id), enabled: Boolean(id) });
  const product = productQuery.data;
  const seoQuery = useQuery({
    queryKey: ["seo-setting", "PRODUCT", product?.id ?? null],
    queryFn: () => catalogApi.getSeoSetting({ targetType: "PRODUCT", targetId: product!.id }),
    enabled: Boolean(product?.id)
  });
  const seoSetting = seoQuery.data;
  const relatedProductsQuery = useQuery({
    queryKey: ["related-products", product?.categoryId ?? null, product?.id ?? null],
    queryFn: () => catalogApi.getProducts(product?.categoryId ? { categoryId: product.categoryId } : undefined),
    enabled: Boolean(product?.categoryId)
  });

  usePageMeta({
    title: seoSetting?.pageTitle ?? product?.seoTitle ?? product?.title,
    description: seoSetting?.metaDescription ?? product?.seoDescription ?? (product ? `Buy ${product.title} certified refurbished with ${product.warrantyMonths ?? 6}-month warranty. ${product.processor ?? ""} ${product.ramGb ? product.ramGb + "GB RAM" : ""}`.trim() : undefined),
    keywords: seoSetting?.metaKeywords ?? product?.seoKeywords,
    image: seoSetting?.ogImageUrl ?? product?.images[0]?.imageUrl,
    canonicalUrl: seoSetting?.canonicalUrl,
    noIndex: seoSetting?.noIndex
  });
  const { reviews, addReview, averageRating } = useReviews(product?.id ?? 0);
  const { isAlerted, subscribe, unsubscribe } = useProductAlerts(product?.id ?? 0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("description");
  const [pendingCartAction, setPendingCartAction] = useState<"cart" | "buyNow" | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const cartBtnsRef = useRef<HTMLDivElement>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", body: "", authorName: user?.name ?? "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [alertEmail, setAlertEmail] = useState(user?.email ?? "");
  const [alertPhone, setAlertPhone] = useState(user?.phone ?? "");
  const [showAlertForm, setShowAlertForm] = useState<"back-in-stock" | "price-drop" | null>(null);
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({ name: user?.name ?? "", phone: user?.phone ?? "", email: user?.email ?? "", message: "" });
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquiryDone, setEnquiryDone] = useState(false);

  function handleShareProduct() {
    if (!product) return;

    if (navigator.share) {
      navigator.share({ title: product.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  }

  useEffect(() => {
    const el = cartBtnsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
    setShowVideo(false);
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
  const aboutProductText = product.description?.trim() || detailTemplate.intro;
  const aboutProductHighlights = (overviewHighlights.length ? overviewHighlights : detailTemplate.merchandisingPoints)
    .slice(0, 4);
  const conditionAndWarrantyRows = [
    {
      label: "Condition",
      value:
        product.productCondition === "EXCELLENT"
          ? "Excellent"
          : product.productCondition === "GOOD"
            ? "Good"
            : product.productCondition === "FAIR"
              ? "Fair"
              : "Certified refurbished",
      Icon: CheckCircle2,
      bg: "bg-emerald-50",
      color: "text-emerald-600"
    },
    {
      label: "Warranty",
      value: getProductWarrantyLabel(product),
      Icon: ShieldCheck,
      bg: "bg-blue-50",
      color: "text-blue-600"
    },
    {
      label: "Returns",
      value: product.returnDays ? `${product.returnDays} day easy returns` : "Easy return support",
      Icon: Undo2,
      bg: "bg-rose-50",
      color: "text-rose-600"
    },
    {
      label: "Support",
      value: "Quality checked and store-backed support",
      Icon: Truck,
      bg: "bg-amber-50",
      color: "text-amber-600"
    }
  ];

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
  const relatedProducts = (relatedProductsQuery.data ?? [])
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  async function handleAddToCart() {
    if (!product || pendingCartAction) {
      return;
    }
    if (!product.available) {
      toast.error("This product is currently unavailable");
      return;
    }

    if (!user) {
      addGuestCartItem(product, 1);
      showCartToast({ variant: "saved", productTitle: product.title, items: useCartStore.getState().guestCart });
      return;
    }

    setPendingCartAction("cart");
    try {
      const updatedCart = await customerApi.addToCart(product.id, 1);
      queryClient.setQueryData(["cart"], updatedCart);
      showCartToast({ variant: "added", productTitle: product.title, items: updatedCart });
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

      <div className="xl:flex xl:gap-6 xl:items-start">
        <motion.section
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0 flex-1 space-y-6"
        >
          <Card className="p-4 sm:p-5">
            {showVideo && product.videoUrl ? (
              <div className="relative aspect-square overflow-hidden rounded-[1.4rem] bg-black sm:aspect-[4/3]">
                {directVideoUrl ? (
                  <video
                    src={product.videoUrl}
                    poster={activeImage.imageUrl}
                    controls
                    autoPlay
                    playsInline
                    className="h-full w-full object-contain"
                  />
                ) : videoEmbedUrl ? (
                  <iframe
                    src={`${videoEmbedUrl}?autoplay=1&rel=0&modestbranding=1`}
                    title={`${product.title} video`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-white/80">Video preview unavailable.</div>
                )}
              </div>
            ) : (
              <ProductImageZoom imageUrl={activeImage.imageUrl} alt={product.title} />
            )}

            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
              {images.map((image, index) => (
                <motion.button
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.18 + index * 0.06, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  type="button"
                  onMouseEnter={() => {
                    setShowVideo(false);
                    setActiveIndex(index);
                  }}
                  onClick={() => {
                    setShowVideo(false);
                    setActiveIndex(index);
                  }}
                  className={`aspect-square overflow-hidden rounded-[1rem] border p-1 transition ${
                    !showVideo && index === activeIndex ? "border-[var(--vr-primary)] bg-white shadow-[0_0_0_3px_rgba(30,58,138,0.1)]" : "border-[var(--vr-border)] bg-[var(--vr-surface-soft)]"
                  }`}
                >
                  {image.imageUrl ? (
                    <img src={image.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full rounded-[0.8rem] object-contain bg-white p-2" />
                  ) : (
                    <div className="h-full w-full rounded-[0.8rem] bg-white" />
                  )}
                </motion.button>
              ))}
              {product.videoUrl ? (
                <button
                  type="button"
                  onClick={() => setShowVideo(true)}
                  aria-label="Play product video"
                  className={`relative aspect-square overflow-hidden rounded-[1rem] border p-1 transition ${
                    showVideo ? "border-[var(--vr-primary)] bg-white shadow-[0_0_0_3px_rgba(30,58,138,0.1)]" : "border-[var(--vr-border)] bg-[var(--vr-surface-soft)]"
                  }`}
                >
                  {images[0]?.imageUrl ? (
                    <img src={images[0].imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full rounded-[0.8rem] object-contain bg-white p-2 opacity-70" />
                  ) : (
                    <div className="h-full w-full rounded-[0.8rem] bg-white" />
                  )}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-[0.8rem] bg-slate-950/35 text-white">
                    <PlayCircle className="h-7 w-7 drop-shadow" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Video</span>
                  </div>
                </button>
              ) : null}
            </div>
          </Card>

          {/* Key Specs — vertical list below product images */}
          {false ? (
            <>
          {visibleSpecSections.length > 0 ? (
            <div className="overflow-hidden rounded-[1.6rem] border border-[var(--vr-border)] bg-white shadow-sm">
              {/* Dark gradient header */}
              <div className="flex items-center justify-between bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_100%)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                    <Cpu className="h-4 w-4 text-white/80" />
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-[0.24em] text-white">Key Specifications</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("specifications");
                    document.getElementById("product-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  View all
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {/* Vertical spec list — single column */}
              <div className="divide-y divide-[var(--vr-border)]">
                {(visibleSpecSections[0]?.fields ?? []).slice(0, 6).map((field) => {
                  const meta = getSpecMeta(field.label);
                  const SpecIcon = meta.Icon;
                  return (
                    <div
                      key={field.label}
                      className="group flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--vr-surface-soft)]"
                    >
                      {/* Icon */}
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.85rem] ${meta.bg} transition group-hover:scale-105`}>
                        <SpecIcon className={`h-5 w-5 ${meta.color}`} />
                      </div>

                      {/* Label + value */}
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vr-muted)]">
                          {field.label}
                        </div>
                        <div className="mt-0.5 text-sm font-bold text-[var(--vr-text)]">
                          {field.value}
                        </div>
                      </div>

                      {/* Right arrow hint */}
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-200 transition group-hover:text-[var(--vr-primary)]" />
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="border-t border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("specifications");
                    document.getElementById("product-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="flex w-full items-center justify-between text-xs font-bold text-[var(--vr-primary)] transition hover:opacity-75"
                >
                  <span>View full specifications</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : null}

          {/* Warranty & Delivery — vertical list below images */}
          <div className="overflow-hidden rounded-[1.6rem] border border-[var(--vr-border)] bg-white shadow-sm">
            <div className="flex items-center justify-between bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_100%)] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                  <ShieldCheck className="h-4 w-4 text-white/80" />
                </div>
                <span className="text-[12px] font-bold uppercase tracking-[0.24em] text-white">About, Condition & Warranty</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("description");
                  document.getElementById("product-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                View details
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="border-b border-[var(--vr-border)] px-5 py-5 lg:border-b-0 lg:border-r">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--vr-primary)]">About this product</div>
                <p className="mt-3 text-[15px] leading-8 text-[var(--vr-text)]">{aboutProductText}</p>
                <div className="mt-5 grid gap-3">
                  {aboutProductHighlights.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-[1rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vr-primary)]" />
                      <span className="text-sm leading-6 text-[var(--vr-text)]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-[var(--vr-border)]">
                {conditionAndWarrantyRows.map((item) => {
                  const ItemIcon = item.Icon;
                  return (
                    <div key={item.label} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--vr-surface-soft)]">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.85rem] ${item.bg} transition group-hover:scale-105`}>
                        <ItemIcon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vr-muted)]">{item.label}</div>
                        <div className="mt-1 text-sm font-bold text-[var(--vr-text)]">{item.value}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-200 transition group-hover:text-[var(--vr-primary)]" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
            </>
          ) : null}

          <Card id="product-tabs">
            <div className="flex flex-wrap gap-6 border-b border-[var(--vr-border)]">
              {([
                ["description", "Description"],
                ["specifications", "Key Specifications"],
                ["about", "About, Condition & Warranty"],
                ["reviews", "Reviews"],
                ["shipping", "Shipping & Returns"]
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveTab(value as DetailTab)}
                  className={`relative -mb-px pb-3 text-sm font-semibold transition ${
                    activeTab === value
                      ? "border-b-2 border-[var(--vr-primary)] text-[var(--vr-primary)]"
                      : "border-b-2 border-transparent text-[var(--vr-muted)] hover:text-[var(--vr-text)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === "description" ? (
              <div className="pt-6">
                <SectionHeader title={detailTemplate.label} description={aboutProductText} />
                <div className="mt-5 grid gap-3">
                  {detailTemplate.merchandisingPoints.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-[1.2rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vr-primary)]" />
                      <span className="text-sm leading-7 text-[var(--vr-text)]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === "specifications" ? (
              <div className="space-y-6 pt-6">
                {visibleSpecSections.length > 0 ? (
                  <div className="overflow-hidden rounded-[1.6rem] border border-[var(--vr-border)] bg-white shadow-sm">
                    <div className="flex items-center justify-between bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_100%)] px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                          <Cpu className="h-4 w-4 text-white/80" />
                        </div>
                        <span className="text-[12px] font-bold uppercase tracking-[0.24em] text-white">Key Specifications</span>
                      </div>
                    </div>

                    <div className="divide-y divide-[var(--vr-border)]">
                      {(visibleSpecSections[0]?.fields ?? []).slice(0, 6).map((field) => {
                        const meta = getSpecMeta(field.label);
                        const SpecIcon = meta.Icon;
                        return (
                          <div key={field.label} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--vr-surface-soft)]">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.85rem] ${meta.bg} transition group-hover:scale-105`}>
                              <SpecIcon className={`h-5 w-5 ${meta.color}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vr-muted)]">{field.label}</div>
                              <div className="mt-0.5 text-sm font-bold text-[var(--vr-text)]">{field.value}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {visibleSpecSections.map((section) => (
                  <div key={section.title}>
                    <h3 className="mb-5 text-xl font-bold text-[var(--vr-text)]">{section.title}</h3>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {section.fields.map((field, fieldIndex) => {
                        const meta = getSpecMeta(field.label);
                        const SpecIcon = meta.Icon;
                        return (
                          <motion.div
                            key={`${section.title}-${field.label}`}
                            initial={{ opacity: 0, y: 18, scale: 0.96 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ delay: fieldIndex * 0.05, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                            className="rounded-2xl border border-[var(--vr-border)] bg-white p-6 shadow-sm transition hover:border-[var(--vr-primary)] hover:shadow-md"
                          >
                            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${meta.bg}`}>
                              <SpecIcon className={`h-7 w-7 ${meta.color}`} />
                            </div>
                            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                              {field.label}
                            </p>
                            <p className="mt-1 text-base font-bold text-[var(--vr-text)]">
                              {field.value}
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {activeTab === "about" ? (
              <div className="pt-6">
                <div className="overflow-hidden rounded-[1.6rem] border border-[var(--vr-border)] bg-white shadow-sm">
                  <div className="flex items-center gap-3 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_100%)] px-5 py-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                      <ShieldCheck className="h-4 w-4 text-white/80" />
                    </div>
                    <span className="text-[12px] font-bold uppercase tracking-[0.24em] text-white">About, Condition & Warranty</span>
                  </div>

                  <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="border-b border-[var(--vr-border)] px-5 py-5 lg:border-b-0 lg:border-r">
                      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--vr-primary)]">About this product</div>
                      <p className="mt-3 text-[15px] leading-8 text-[var(--vr-text)]">{aboutProductText}</p>
                      <div className="mt-5 grid gap-3">
                        {aboutProductHighlights.map((item) => (
                          <div key={item} className="flex items-start gap-3 rounded-[1rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-3">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vr-primary)]" />
                            <span className="text-sm leading-6 text-[var(--vr-text)]">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="divide-y divide-[var(--vr-border)]">
                      {conditionAndWarrantyRows.map((item) => {
                        const ItemIcon = item.Icon;
                        return (
                          <div key={item.label} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--vr-surface-soft)]">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.85rem] ${item.bg} transition group-hover:scale-105`}>
                              <ItemIcon className={`h-5 w-5 ${item.color}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vr-muted)]">{item.label}</div>
                              <div className="mt-1 text-sm font-bold text-[var(--vr-text)]">{item.value}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
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
              <div className="pt-6 space-y-6">
                {/* Summary row — pulls live warranty/return data */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { Icon: ShieldCheck, label: "Warranty", value: product.warrantyMonths ? `${product.warrantyMonths} months` : "Included", detail: product.warrantySummary ?? "Store-backed carry-in support" },
                    { Icon: Undo2, label: "Returns", value: product.returnDays ? `${product.returnDays} days` : "Available", detail: "Easy return from fulfillment store" },
                    { Icon: Truck, label: "Delivery", value: "Fast dispatch", detail: "Pickup or doorstep delivery" },
                    { Icon: CheckCircle2, label: "Quality", value: "Multi-point check", detail: "Inspected before every dispatch" }
                  ].map((item) => {
                    const ItemIcon = item.Icon;
                    return (
                      <div key={item.label} className="flex flex-col gap-3 rounded-2xl border border-[var(--vr-border)] bg-white p-5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-[0.75rem] bg-[rgba(30,58,138,0.08)]">
                          <ItemIcon className="h-5 w-5 text-[var(--vr-primary)]" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vr-muted)]">{item.label}</div>
                          <div className="mt-1 text-base font-bold text-[var(--vr-text)]">{item.value}</div>
                          <div className="mt-0.5 text-xs leading-5 text-[var(--vr-muted)]">{item.detail}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Condition and Readiness */}
                <div className="rounded-2xl border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-6">
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--vr-primary)]">Condition and Readiness</div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {detailTemplate.merchandisingPoints.slice(0, 4).map((point) => (
                      <div key={point} className="flex items-start gap-2.5 rounded-xl border border-[var(--vr-border)] bg-white px-4 py-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vr-primary)]" />
                        <span className="text-sm leading-6 text-[var(--vr-text)]">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </Card>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.44, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="xl:sticky xl:top-[13rem] xl:h-fit xl:w-[44%] xl:shrink-0"
        >
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip label={product.brandName ?? "VR Certified"} tone="muted" />
              <StatusChip label={product.categoryName ?? detailTemplate.label} tone="primary" />
              <StatusChip label={product.productCondition ?? "Certified"} tone="success" />
              {product.bestSeller ? <StatusChip label="Best Seller" tone="accent" /> : null}
              {todayDealActive ? <StatusChip label="Today Deal" tone="danger" /> : null}
            </div>

            <div className="mt-4 flex items-start justify-between gap-3">
              <h1 className="text-3xl font-extrabold leading-tight text-[var(--vr-text)] lg:text-[2.6rem]">{product.title}</h1>
              <button
                type="button"
                onClick={handleShareProduct}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--vr-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--vr-text)] transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
            </div>
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

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 flex flex-wrap items-end gap-3"
            >
              <div className="text-4xl font-extrabold text-[var(--vr-text)]">{formatCurrency(product.price)}</div>
              {product.originalPrice ? <div className="pb-1 text-lg text-slate-400 line-through">{formatCurrency(product.originalPrice)}</div> : null}
              {product.discountPercent ? <StatusChip label={`${product.discountPercent}% Off`} tone="accent" /> : null}
            </motion.div>

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

            <div ref={cartBtnsRef} className="mt-6 grid gap-3 sm:grid-cols-2">
              {!product.available ? (
                <>
                  <div className="sm:col-span-2 flex items-center justify-center gap-2 rounded-[1.3rem] border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-400">
                    <BellOff className="h-4 w-4" />
                    Currently Out of Stock
                  </div>
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in ${product.title}. Is it available?`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="sm:col-span-2 flex items-center justify-center gap-2 rounded-[1.3rem] bg-[#25D366] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#20bd5a]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Check Availability on WhatsApp
                  </a>
                </>
              ) : (
                <>
                  <Button
                    icon={<ShoppingCart className="h-4 w-4" />}
                    fullWidth
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={pendingCartAction !== null}
                  >
                    {pendingCartAction === "cart" ? "Adding..." : "Add to Cart"}
                  </Button>
                  <Button variant="accent" fullWidth size="lg" onClick={handleBuyNow} disabled={pendingCartAction !== null}>
                    {pendingCartAction === "buyNow" ? "Continuing..." : "Buy Now"}
                  </Button>
                </>
              )}
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
                    const result = addToCompare(product);
                    if (result === "added") {
                      toast.success("Added to comparison — visit /compare to view");
                    } else if (result === "full") {
                      toast.error("You can compare up to 3 products at a time");
                    } else if (result === "category-mismatch") {
                      toast.error("Compare works within one category. Clear compare to switch.");
                    }
                  }
                }}
              >
                {isInCompare(product.id) ? "In Comparison" : "Compare"}
              </Button>
            </div>



            {/*
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
                    navigator.share({ title: product?.title ?? "Product", url: window.location.href });
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
            */}

            {/* ── Back-in-stock / Price-drop alert ── */}
            {!product.available || (product.stockQuantity ?? 0) === 0 ? (
              <div className="mt-4 rounded-[1.3rem] border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-600" />
                  <div className="text-sm font-semibold text-amber-800">Currently out of stock</div>
                </div>
                {isAlerted("back-in-stock") ? (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-emerald-700 font-medium">✓ You're on the back-in-stock list.</span>
                    <button type="button" onClick={() => { unsubscribe("back-in-stock"); toast("Alert removed"); }}
                      className="inline-flex items-center gap-1 text-xs text-[var(--vr-danger)]">
                      <BellOff className="h-3 w-3" /> Remove
                    </button>
                  </div>
                ) : showAlertForm === "back-in-stock" ? (
                  <div className="mt-3 space-y-2">
                    <input className="vr-input w-full py-2 text-xs" placeholder="Email address *" value={alertEmail}
                      onChange={(e) => setAlertEmail(e.target.value)} />
                    <input className="vr-input w-full py-2 text-xs" placeholder="Phone number (optional)" value={alertPhone}
                      onChange={(e) => setAlertPhone(e.target.value)} />
                    <div className="flex gap-2">
                      <button type="button"
                        onClick={() => {
                          if (!alertEmail.includes("@")) { toast.error("Enter a valid email"); return; }
                          subscribe("back-in-stock", alertEmail, undefined, alertPhone || undefined);
                          setShowAlertForm(null);
                          toast.success("We'll notify you when this item is back in stock!");
                        }}
                        className="flex-1 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700">
                        Notify Me
                      </button>
                      <button type="button" onClick={() => setShowAlertForm(null)}
                        className="rounded-xl border border-[var(--vr-border)] px-3 py-2 text-xs text-[var(--vr-muted)]">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowAlertForm("back-in-stock")}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700">
                    <Bell className="h-3.5 w-3.5" /> Notify when back in stock
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-[1.3rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4">
                <div className="text-sm font-semibold text-[var(--vr-text)]">Price drop alert</div>
                {isAlerted("price-drop") ? (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-emerald-700 font-medium">✓ You're watching this price.</span>
                    <button type="button" onClick={() => { unsubscribe("price-drop"); toast("Alert removed"); }}
                      className="inline-flex items-center gap-1 text-xs text-[var(--vr-danger)]">
                      <BellOff className="h-3 w-3" /> Remove
                    </button>
                  </div>
                ) : showAlertForm === "price-drop" ? (
                  <div className="mt-3 space-y-2">
                    <input className="vr-input w-full py-2 text-xs" placeholder="Email address *" value={alertEmail}
                      onChange={(e) => setAlertEmail(e.target.value)} />
                    <input className="vr-input w-full py-2 text-xs" placeholder="Phone number (optional)" value={alertPhone}
                      onChange={(e) => setAlertPhone(e.target.value)} />
                    <div className="flex gap-2">
                      <button type="button"
                        onClick={() => {
                          if (!alertEmail.includes("@")) { toast.error("Enter a valid email"); return; }
                          subscribe("price-drop", alertEmail, product.price, alertPhone || undefined);
                          setShowAlertForm(null);
                          toast.success("We'll alert you if the price drops!");
                        }}
                        className="flex-1 rounded-xl bg-[var(--vr-primary)] px-3 py-2 text-xs font-semibold text-white">
                        Watch Price
                      </button>
                      <button type="button" onClick={() => setShowAlertForm(null)}
                        className="rounded-xl border border-[var(--vr-border)] px-3 py-2 text-xs text-[var(--vr-muted)]">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowAlertForm("price-drop")}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--vr-primary)]">
                    <Bell className="h-3.5 w-3.5" /> Alert me on price drop
                  </button>
                )}
              </div>
            )}

            {/* ── Ask Availability / Enquiry form ── */}
            <div className="mt-4 rounded-[1.3rem] border border-[var(--vr-border)] bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-[var(--vr-primary)]" />
                  <span className="text-sm font-semibold text-[var(--vr-text)]">Ask about availability</span>
                </div>
                {!showEnquiryForm && !enquiryDone && (
                  <button type="button" onClick={() => setShowEnquiryForm(true)}
                    className="rounded-full bg-[rgba(30,58,138,0.08)] px-3 py-1 text-[11px] font-semibold text-[var(--vr-primary)] hover:bg-[rgba(30,58,138,0.14)]">
                    Ask Now
                  </button>
                )}
              </div>

              <AnimatePresence>
                {enquiryDone ? (
                  <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Enquiry sent! Our team will contact you shortly.</span>
                  </motion.div>
                ) : showEnquiryForm ? (
                  <motion.div key="form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-3 space-y-2 overflow-hidden">
                    <input
                      className="vr-input w-full py-2 text-xs"
                      placeholder="Your name *"
                      value={enquiryForm.name}
                      onChange={(e) => setEnquiryForm((f) => ({ ...f, name: e.target.value }))}
                    />
                    <input
                      className="vr-input w-full py-2 text-xs"
                      placeholder="Phone number *"
                      value={enquiryForm.phone}
                      onChange={(e) => setEnquiryForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                    <input
                      className="vr-input w-full py-2 text-xs"
                      placeholder="Email (optional)"
                      value={enquiryForm.email}
                      onChange={(e) => setEnquiryForm((f) => ({ ...f, email: e.target.value }))}
                    />
                    <textarea
                      className="vr-input w-full resize-none py-2 text-xs"
                      rows={2}
                      placeholder="Your question or message (optional)"
                      value={enquiryForm.message}
                      onChange={(e) => setEnquiryForm((f) => ({ ...f, message: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={enquirySubmitting}
                        onClick={async () => {
                          if (!enquiryForm.name.trim()) { toast.error("Enter your name"); return; }
                          if (!enquiryForm.phone.trim()) { toast.error("Enter your phone number"); return; }
                          setEnquirySubmitting(true);
                          try {
                            await catalogApi.createEnquiry({
                              name: enquiryForm.name.trim(),
                              phone: enquiryForm.phone.trim(),
                              email: enquiryForm.email.trim() || undefined,
                              message: enquiryForm.message.trim() || undefined,
                              productId: product.id,
                              enquiryType: "PRODUCT_AVAILABILITY",
                            });
                            setEnquiryDone(true);
                            setShowEnquiryForm(false);
                          } catch {
                            toast.error("Failed to send enquiry. Please try again.");
                          } finally {
                            setEnquirySubmitting(false);
                          }
                        }}
                        className="flex-1 rounded-xl bg-[var(--vr-primary)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60 hover:bg-[var(--vr-primary-strong)]"
                      >
                        {enquirySubmitting ? "Sending…" : "Send Enquiry"}
                      </button>
                      <button type="button" onClick={() => setShowEnquiryForm(false)}
                        className="rounded-xl border border-[var(--vr-border)] px-3 py-2 text-xs text-[var(--vr-muted)]">
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <p className="mt-1.5 text-[11px] text-[var(--vr-muted)]">
                    Questions about stock, specs, or delivery? Our team responds quickly.
                  </p>
                )}
              </AnimatePresence>

              {/* WhatsApp + store info */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--vr-border)] pt-3 text-xs text-[var(--vr-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[var(--vr-primary)]" />
                  {product.stores.length} store{product.stores.length !== 1 ? "s" : ""} available
                </span>
                <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800">
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp us
                </a>
              </div>
            </div>
          </Card>
        </motion.aside>
      </div>

      <div className="rounded-[1.6rem] border border-[var(--vr-border)] bg-white p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[var(--vr-primary)]" />
            <span className="text-[13px] font-bold text-[var(--vr-text)]">Available Stores</span>
            <span className="rounded-full bg-[var(--vr-primary)] px-2 py-0.5 text-[10px] font-black text-white">{product.stores.length}</span>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {product.stores.map((store) => (
            <div key={store.id} className="flex flex-col gap-2 rounded-[1.1rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[13px] font-bold leading-tight text-[var(--vr-text)]">{store.name}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${store.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {store.active ? "Open" : "Closed"}
                </span>
              </div>
              <p className="text-[11px] leading-5 text-[var(--vr-muted)] line-clamp-2">
                {store.city}, {store.state}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--vr-muted)]">
                <span className="inline-flex items-center gap-1">
                  <PhoneCall className="h-3 w-3 text-[var(--vr-primary)]" />
                  {store.phone}
                </span>
                {store.timings ? (
                  <span className="inline-flex items-center gap-1">
                    <Package className="h-3 w-3 text-[var(--vr-primary)]" />
                    {store.timings}
                  </span>
                ) : null}
              </div>
              <div className="mt-auto flex gap-1.5 pt-1">
                {store.mapLink ? (
                  <a href={store.mapLink} target="_blank" rel="noreferrer"
                    className="flex flex-1 items-center justify-center rounded-xl bg-[var(--vr-primary)] px-2 py-1.5 text-[11px] font-semibold text-white">
                    Directions
                  </a>
                ) : null}
                {store.whatsapp ? (
                  <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                    className="flex flex-1 items-center justify-center rounded-xl border border-[var(--vr-border)] bg-white px-2 py-1.5 text-[11px] font-semibold text-[var(--vr-text)]">
                    WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {relatedProducts.length ? (
        <section>
          <SectionHeader
            eyebrow="Related Products"
            title="Similar picks from this category"
            description="Keep shoppers moving with alternatives that match the same buying intent."
            action={
              product.categoryId ? (
                <Link to={`/products?categoryId=${product.categoryId}`} className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--vr-primary)]">
                  View category
                </Link>
              ) : undefined
            }
          />
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Sticky Add-to-Cart bar (desktop) — only shown when product is in stock ── */}
      <AnimatePresence>
        {showStickyBar && product && product.available && (
          <motion.div
            key="sticky-cart-bar"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            className="fixed bottom-0 left-0 right-0 z-[90] hidden border-t border-[var(--vr-border)] bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.10)] backdrop-blur-md lg:block"
          >
            <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-8 py-3">
              {/* Thumbnail */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-1">
                {product.images[0]?.imageUrl ? (
                  <img src={product.images[0].imageUrl} alt="" className="h-full w-full object-contain" />
                ) : null}
              </div>
              {/* Title + price */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold text-[var(--vr-text)]">{product.title}</div>
                <div className="text-[15px] font-black text-slate-900">{formatCurrency(product.price)}</div>
              </div>
              {/* Buttons */}
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={pendingCartAction !== null}
                  className="flex h-10 items-center gap-2 rounded-[12px] bg-[var(--vr-primary)] px-5 text-[13px] font-semibold text-white transition hover:bg-[var(--vr-primary-strong)] disabled:opacity-60"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {pendingCartAction === "cart" ? "Adding…" : "Add to Cart"}
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={pendingCartAction !== null}
                  className="flex h-10 items-center gap-2 rounded-[12px] bg-[var(--vr-accent)] px-5 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <StickyMobileBar>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[var(--vr-muted)]">{todayDealActive ? "Deal price" : "Starting at"}</div>
            <div className="text-lg font-extrabold text-[var(--vr-text)]">{formatCurrency(product.price)}</div>
          </div>
          <div className="flex flex-1 gap-3">
            {!product.available ? (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, is ${product.title} available?`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#20bd5a]"
              >
                <MessageCircle className="h-4 w-4" />
                Check via WhatsApp
              </a>
            ) : (
              <>
                <Button variant="secondary" fullWidth onClick={handleAddToCart} disabled={pendingCartAction !== null}>
                  Cart
                </Button>
                <Button variant="accent" fullWidth onClick={handleBuyNow} disabled={pendingCartAction !== null}>
                  Buy Now
                </Button>
              </>
            )}
          </div>
        </div>
      </StickyMobileBar>
    </div>
  );
}
