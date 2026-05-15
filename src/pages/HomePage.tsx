import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePageMeta } from "../hooks/usePageMeta";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Laptop2, MapPin, ShieldCheck, Sparkles, Star, Store, Truck, Undo2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductCard } from "components/catalog/ProductCard";
import { getButtonClassName } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { SectionHeader } from "components/ui/SectionHeader";
import { SkeletonLoader } from "components/ui/SkeletonLoader";
import { Badge } from "components/ui/Badge";
import { BannerVideo } from "components/ui/BannerVideo";
import { useSelectedStore } from "store/storeStore";
import { catalogApi } from "api/client";
import type { Category, HomeSection, Product } from "types";
import { getApiErrorMessage } from "../utils/api";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import {
  formatCurrency,
  getCategoryLink,
  getProductMerchandisingScore,
  getProductPrimaryImage,
  isProductTodayDealActive,
  isMeaningfulCatalogValue,
  normalizeCatalogValue
} from "../utils/catalog";
import { getVideoEmbedUrl, isDirectVideoUrl } from "../utils/media";

const vrTechnologiesLogo = "/logo.jpg";
const preferredCategoryOrder = ["Laptops", "Desktops", "Accessories", "Monitors", "Gaming Laptops", "MacBooks", "Workstations"];
const homeSectionEyebrows = {
  TODAYS_DEALS: "Today Deals",
  FEATURED_PRODUCTS: "Featured Products",
  BEST_SELLERS: "Best Sellers",
  NEW_ARRIVALS: "New Arrivals",
  TRENDING_PRODUCTS: "Trending Products",
  RECOMMENDED_PRODUCTS: "Recommended Products",
  TOP_RATED: "Top Rated",
  LOW_PRICE_DEALS: "Low Price Deals"
} as const;

const trustBar = [
  { title: "Warranty Included", subtitle: "Coverage with every eligible product", icon: ShieldCheck },
  { title: "Quality Checked", subtitle: "Professionally tested before dispatch", icon: CheckCircle2 },
  { title: "Easy Returns", subtitle: "Simple return support from our team", icon: Undo2 },
  { title: "Fast Delivery", subtitle: "Pickup and delivery across branches", icon: Truck }
] as const;

const buyerAssurance = [
  {
    title: "Certified Refurbishment",
    description: "Every listed machine is positioned around condition, warranty, and practical buyer-ready specs.",
    stat: "100+ checks",
    icon: CheckCircle2
  },
  {
    title: "Store-Backed Support",
    description: "Customers can see branch availability and contact support before they commit to checkout.",
    stat: "Live stores",
    icon: Store
  },
  {
    title: "Clear Price Confidence",
    description: "Discounts, original price, savings, and stock context stay visible across product cards.",
    stat: "Transparent deals",
    icon: Sparkles
  }
] as const;

const useCasePresets = [
  { title: "Student Essentials", description: "Portable, affordable systems for classes and study.", link: "/products?maxPrice=30000", icon: Laptop2 },
  { title: "Office Productivity", description: "Reliable multitasking laptops for daily work.", link: "/products?ram=8", icon: Sparkles },
  { title: "Design and Editing", description: "More RAM and sharper displays for creative workflows.", link: "/products?ram=16", icon: ShieldCheck },
  { title: "Gaming and Performance", description: "High-spec machines with standout graphics value.", link: "/products?category=gaming%20laptops", icon: Store }
] as const;

function resolveBannerLink(linkUrl?: string, fallback = "/products") {
  const normalized = linkUrl?.trim().toLowerCase();
  if (!normalized || ["none", "null", "n/a", "na", "#", "javascript:void(0)"].includes(normalized)) {
    return fallback;
  }
  return linkUrl?.trim() || fallback;
}

function sortCategories(categories: Category[]) {
  return [...categories].sort((left, right) => {
    const leftIndex = preferredCategoryOrder.findIndex((value) => value.toLowerCase() === left.name.toLowerCase());
    const rightIndex = preferredCategoryOrder.findIndex((value) => value.toLowerCase() === right.name.toLowerCase());
    const leftWeight = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const rightWeight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
    if (leftWeight !== rightWeight) {
      return leftWeight - rightWeight;
    }
    return left.name.localeCompare(right.name);
  });
}

function categoryPlaceholder(category: Category) {
  return category.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getDealCountdownTarget(products: Product[]) {
  const futureEnds = products
    .map((product) => (product.dealEndDate ? Date.parse(product.dealEndDate) : Number.NaN))
    .filter((value) => Number.isFinite(value) && value > Date.now());

  if (futureEnds.length) {
    return Math.min(...futureEnds);
  }

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.getTime();
}

function formatCountdown(targetTime: number, now: number) {
  const remaining = Math.max(0, targetTime - now);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  const daysPart = days > 0 ? `${days}d ` : "";
  return `${daysPart}${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function sortByMerchandisingPriority(products: Product[]) {
  return [...products].sort((left, right) => {
    const scoreDifference = getProductMerchandisingScore(right) - getProductMerchandisingScore(left);
    if (scoreDifference !== 0) {
      return scoreDifference;
    }
    return (right.updatedAt ?? "").localeCompare(left.updatedAt ?? "");
  });
}

function LoadingHomePage() {
  return (
    <div className="vr-page-shell space-y-6">
      <Card variant="hero">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <SkeletonLoader className="h-[320px]" />
          <div className="space-y-4">
            <SkeletonLoader className="h-10 w-40" />
            <SkeletonLoader lines={4} />
            <SkeletonLoader className="h-12 w-48" />
          </div>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <SkeletonLoader className="h-24" />
            <SkeletonLoader className="mt-4 h-6 w-2/3" />
            <SkeletonLoader className="mt-2 h-4 w-full" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonLoader key={index} className="h-[420px]" />
        ))}
      </div>
    </div>
  );
}

function CountUpStat({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const nodeRef = useRef<HTMLSpanElement | null>(null);
  const [displayValue, setDisplayValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || hasStarted) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.45 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) {
      return;
    }

    const duration = 1200;
    const startedAt = performance.now();
    let frameId = 0;

    function tick(nowTime: number) {
      const progress = Math.min((nowTime - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * eased);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(value);
      }
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [decimals, hasStarted, value]);

  const formattedValue = displayValue.toLocaleString("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  });

  return (
    <span ref={nodeRef}>
      {formattedValue}
      {suffix}
    </span>
  );
}

export function HomePage() {
  usePageMeta();
  const [now, setNow] = useState(() => Date.now());
  const { recentlyViewed, clearHistory } = useRecentlyViewed();
  const bannersQuery = useQuery({ queryKey: ["banners"], queryFn: () => catalogApi.getBanners() });
  const useCaseBannersQuery = useQuery({ queryKey: ["banners", "USE_CASE"], queryFn: () => catalogApi.getBanners("USE_CASE") });
  const homeSectionsQuery = useQuery({ queryKey: ["home-sections"], queryFn: catalogApi.getHomeSections });
  const selectedStoreId = useSelectedStore((state) => state.selectedStoreId);
  const allProductsQuery = useQuery({
    queryKey: ["home-products", selectedStoreId],
    queryFn: () => catalogApi.getProducts(selectedStoreId ? { storeId: selectedStoreId } : undefined)
  });
  const categoriesQuery = useQuery({ queryKey: ["home-categories"], queryFn: catalogApi.getCategories });
  const storesQuery = useQuery({ queryKey: ["home-stores"], queryFn: catalogApi.getStores });

  const banners = bannersQuery.data ?? [];
  const homeSections = homeSectionsQuery.data ?? [];
  const allProducts = allProductsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const stores = storesQuery.data ?? [];

  const firstError =
    bannersQuery.error ?? homeSectionsQuery.error ?? allProductsQuery.error ?? categoriesQuery.error ?? storesQuery.error ?? null;
  const hasCatalogError = Boolean(firstError);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const orderedCategories = useMemo(() => sortCategories(categories), [categories]);
  const productsByCategory = useMemo(() => {
    const groups = new Map<number, Product[]>();
    for (const product of allProducts) {
      if (!product.categoryId) {
        continue;
      }
      const existing = groups.get(product.categoryId) ?? [];
      existing.push(product);
      groups.set(product.categoryId, existing);
    }
    return groups;
  }, [allProducts]);

  const heroCategory = orderedCategories.find((category) => category.name.toLowerCase().includes("laptop")) ?? orderedCategories[0];
  const heroBanners = useMemo(
    () => banners.filter((banner) => !banner.placement || banner.placement === "HOME_HERO"),
    [banners]
  );
  const middleBanners = useMemo(
    () => banners.filter((banner) => banner.placement === "HOME_MIDDLE"),
    [banners]
  );
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  useEffect(() => {
    if (activeHeroIndex >= heroBanners.length) {
      setActiveHeroIndex(0);
    }
  }, [activeHeroIndex, heroBanners.length]);
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveHeroIndex((index) => (index + 1) % heroBanners.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [heroBanners.length]);
  const heroBanner = heroBanners[activeHeroIndex] ?? heroBanners[0];
  const heroTitle = isMeaningfulCatalogValue(heroBanner?.title)
    ? normalizeCatalogValue(heroBanner?.title)
    : "Certified Refurbished Laptops That Feel Premium and Cost Less";
  const heroSubtitle = isMeaningfulCatalogValue(heroBanner?.subtitle)
    ? normalizeCatalogValue(heroBanner?.subtitle)
    : "";
  const heroLink = resolveBannerLink(heroBanner?.linkUrl, heroCategory ? getCategoryLink(heroCategory) : "/products");
  const heroDesktopImage = heroBanner?.desktopImageUrl ?? heroBanner?.imageUrl;
  const heroMobileImage = heroBanner?.mobileImageUrl ?? heroDesktopImage;
  const heroVideoEmbedUrl = getVideoEmbedUrl(heroBanner?.videoUrl);
  const heroUsesDirectVideo = heroBanner?.mediaType === "VIDEO" && isDirectVideoUrl(heroBanner?.videoUrl);
  const heroCtaLabel = isMeaningfulCatalogValue(heroBanner?.ctaText) ? normalizeCatalogValue(heroBanner?.ctaText) : `Shop ${heroCategory?.name ?? "the collection"}`;
  const heroLinkIsExternal = heroLink.startsWith("http");

  const spotlightProducts = useMemo(() => sortByMerchandisingPriority(allProducts), [allProducts]);
  const homeProductSections = useMemo<HomeSection[]>(() => {
    const configuredSections = [...homeSections]
      .filter((section) => section.products.length > 0)
      .sort((left, right) => {
        const leftOrder = left.displayOrder ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = right.displayOrder ?? Number.MAX_SAFE_INTEGER;
        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }
        return (left.id ?? Number.MAX_SAFE_INTEGER) - (right.id ?? Number.MAX_SAFE_INTEGER);
      });

    if (configuredSections.length > 0) {
      return configuredSections;
    }

      return spotlightProducts.length
      ? [
          {
            id: -1,
            title: "Featured Products",
            subtitle: "Admin sections are empty right now, so we are showing the strongest live inventory instead.",
            sectionType: "FEATURED_PRODUCTS" as const,
            displayOrder: 0,
            maxProducts: 8,
            products: spotlightProducts.slice(0, 8)
          }
        ]
      : [];
  }, [homeSections, spotlightProducts]);

  const categoryCards = orderedCategories.slice(0, 4).map((category) => {
    const leadProduct = (productsByCategory.get(category.id) ?? [])[0];
    const previewImage = category.iconUrl ?? getProductPrimaryImage(leadProduct ?? { images: [] });
    return { category, previewImage };
  });

  const nearbyStores = useMemo(
    () =>
      [...stores]
        .sort((left, right) => {
          const reviewGap = (right.googleReviewCount ?? 0) - (left.googleReviewCount ?? 0);
          if (reviewGap !== 0) {
            return reviewGap;
          }
          return (right.googleRating ?? 0) - (left.googleRating ?? 0);
        })
        .slice(0, 3),
    [stores]
  );

  const todayDealsCountdown = useMemo(
    () => {
      const products = homeProductSections
        .filter((section) => section.sectionType === "TODAYS_DEALS")
        .flatMap((section) => section.products)
        .filter((product) => isProductTodayDealActive(product));
      return products.length ? formatCountdown(getDealCountdownTarget(products), now) : null;
    },
    [homeProductSections, now]
  );
  const trustedCustomerCount = Math.max(500, stores.reduce((sum, store) => sum + (store.googleReviewCount ?? 0), 0));
  const averageStoreRating =
    stores.length > 0
      ? (stores.reduce((sum, store) => sum + (store.googleRating ?? 0), 0) / stores.length).toFixed(1)
      : "4.8";
  const homeTrustStats = [
    { value: trustedCustomerCount, suffix: "+", label: "trusted customers", description: "Across walk-in, WhatsApp, and website enquiries." },
    { value: stores.length || 4, suffix: "", label: "active stores", description: "Branch-backed pickup, support, and fulfillment." },
    { value: allProducts.length || 75, suffix: "+", label: "ready products", description: "Refurbished laptops, desktops, accessories, and monitors." },
    { value: Number(averageStoreRating), suffix: "/5", decimals: 1, label: "store rating", description: "Real branch trust signals shown near products." }
  ];

  if (bannersQuery.isLoading || homeSectionsQuery.isLoading || allProductsQuery.isLoading || categoriesQuery.isLoading || storesQuery.isLoading) {
    return <LoadingHomePage />;
  }

  const heroHasMedia = Boolean(heroDesktopImage || heroVideoEmbedUrl || heroUsesDirectVideo);
  const heroHasOverlayContent = !heroHasMedia && Boolean(
    isMeaningfulCatalogValue(heroBanner?.title) || isMeaningfulCatalogValue(heroBanner?.subtitle) || !heroDesktopImage
  );

  return (
    <div className="vr-page-shell space-y-6">
      {hasCatalogError ? (
        <div className="flex items-start gap-3 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-[0_10px_26px_rgba(146,64,14,0.08)]">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="min-w-0">
            <div className="text-sm font-bold">Catalog data is temporarily unavailable.</div>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              {getApiErrorMessage(firstError, "Please check the backend server and API configuration.")}
            </p>
          </div>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[2rem] border border-[var(--vr-border)] bg-white p-1.5 shadow-[0_22px_55px_rgba(15,23,42,0.08)] lg:sticky lg:top-[8.9rem] lg:z-20">
        <Link to={heroLink} className="block">
          <div
            className={`group relative overflow-hidden rounded-[1.7rem] ${
              heroHasOverlayContent
                ? "bg-[linear-gradient(135deg,#edf4ff,#dbeafe_48%,#fff7ed)]"
                : "bg-white"
            }`}
          >
            {!heroHasOverlayContent ? <div className="aspect-[16/7] min-h-[260px] w-full sm:min-h-[340px] lg:min-h-[430px]" /> : null}
            {heroBanner?.mediaType === "VIDEO" && heroBanner.videoUrl ? (
              heroUsesDirectVideo ? (
                <BannerVideo
                  src={heroBanner.videoUrl}
                  poster={heroDesktopImage}
                  className={`absolute inset-0 h-full w-full object-cover ${heroHasOverlayContent ? "opacity-[0.96]" : ""}`}
                />
              ) : heroVideoEmbedUrl ? (
                <iframe
                  src={`${heroVideoEmbedUrl}?autoplay=1&mute=1&controls=1&loop=1&playsinline=1&rel=0&modestbranding=1`}
                  title={heroTitle}
                  className={`absolute inset-0 h-full w-full object-cover ${heroHasOverlayContent ? "scale-[1.06] opacity-[0.96]" : ""}`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                />
              ) : null
            ) : heroDesktopImage ? (
              <picture>
                {heroMobileImage ? <source media="(max-width: 768px)" srcSet={heroMobileImage} /> : null}
                <img
                  src={heroDesktopImage}
                  alt={heroTitle}
                  loading="eager"
                  decoding="async"
                  className={`absolute inset-0 h-full w-full object-cover ${heroHasOverlayContent ? "opacity-[0.95]" : ""}`}
                />
              </picture>
            ) : null}

            {heroHasOverlayContent ? (
              <>
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.88)_34%,rgba(248,250,252,0.35)_68%,rgba(255,255,255,0.08)_100%)]" />
                <div className="relative z-10 grid min-h-[430px] items-end gap-8 px-5 py-6 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-9">
                  <div className="max-w-[620px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="accent" className="bg-[rgba(245,158,11,0.18)] text-[#b45309]">
                        {heroBanner?.mediaType === "VIDEO" ? "Video Campaign Live" : "Premium Refurbished Picks"}
                      </Badge>
                      {heroCategory ? <Badge tone="primary">{heroCategory.name}</Badge> : null}
                    </div>
                    <h1 className="display-font mt-5 text-[2.3rem] font-extrabold leading-[1.02] text-[var(--vr-dark)] sm:text-[2.8rem] lg:text-[3.55rem]">
                      {heroTitle}
                    </h1>
                    {heroSubtitle ? (
                      <p className="mt-4 max-w-[520px] text-base leading-8 text-[var(--vr-muted)] lg:text-lg">{heroSubtitle}</p>
                    ) : null}
                    <div className="mt-6 flex flex-wrap gap-3">
                      <span className={getButtonClassName({ variant: "primary", size: "lg" })}>
                        {heroCtaLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {heroBanners.length > 1 ? (
              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
                {heroBanners.map((banner, index) => (
                  <button
                    key={banner.id ?? index}
                    type="button"
                    aria-label={`Show banner ${index + 1}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setActiveHeroIndex(index);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      index === activeHeroIndex
                        ? "w-6 bg-[var(--vr-primary)]"
                        : "w-2 bg-white/70 hover:bg-white"
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </Link>
      </section>

      {middleBanners.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          {middleBanners.map((banner) => {
            const target = resolveBannerLink(banner.linkUrl, "/products");
            const targetIsExternal = target.startsWith("http");
            const desktopImage = banner.desktopImageUrl ?? banner.imageUrl;
            const mobileImage = banner.mobileImageUrl ?? desktopImage;
            const usesDirectVideo = banner.mediaType === "VIDEO" && isDirectVideoUrl(banner.videoUrl);
            const videoEmbedUrl = getVideoEmbedUrl(banner.videoUrl);
            const inner = (
              <div className="group relative overflow-hidden rounded-[1.6rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
                <div className="relative aspect-[16/7] w-full overflow-hidden">
                  {banner.mediaType === "VIDEO" && banner.videoUrl ? (
                    usesDirectVideo ? (
                      <BannerVideo
                        src={banner.videoUrl}
                        poster={desktopImage}
                        className="h-full w-full object-cover"
                      />
                    ) : videoEmbedUrl ? (
                      <iframe
                        src={`${videoEmbedUrl}?autoplay=1&mute=1&controls=1&loop=1&playsinline=1&rel=0&modestbranding=1`}
                        title={banner.title ?? "Banner"}
                        className="h-full w-full object-cover"
                        allow="autoplay; encrypted-media; picture-in-picture"
                      />
                    ) : null
                  ) : desktopImage ? (
                    <picture>
                      {mobileImage ? <source media="(max-width: 768px)" srcSet={mobileImage} /> : null}
                      <img src={desktopImage} alt={banner.title ?? "Banner"} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                    </picture>
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0)_45%,rgba(15,23,42,0.65)_100%)]" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  {banner.title ? <h3 className="text-lg font-bold drop-shadow">{banner.title}</h3> : null}
                  {banner.subtitle ? <p className="mt-1 max-w-[80%] text-xs leading-5 text-white/85">{banner.subtitle}</p> : null}
                  {banner.ctaText ? (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--vr-primary)]">
                      {banner.ctaText} <ArrowRight className="h-3 w-3" />
                    </div>
                  ) : null}
                </div>
              </div>
            );
            return targetIsExternal ? (
              <a key={banner.id} href={target} target="_blank" rel="noreferrer">{inner}</a>
            ) : (
              <Link key={banner.id} to={target}>{inner}</Link>
            );
          })}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {categoryCards.map(({ category, previewImage }) => (
          <Link key={category.id} to={getCategoryLink(category)}>
            <Card className="vr-card-lift flex h-full items-center gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.3rem] bg-[linear-gradient(135deg,#eff6ff,#fff7ed)]">
                {previewImage ? (
                  <img src={previewImage} alt={category.name} className="h-full w-full object-contain p-3" />
                ) : (
                  <span className="display-font text-lg font-bold uppercase text-[var(--vr-primary)]">{categoryPlaceholder(category)}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--vr-primary)]">Shop Category</div>
                <h3 className="mt-2 text-xl font-extrabold text-[var(--vr-text)]">{category.name}</h3>
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--vr-primary)]">
                  Browse Now
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </section>

      {homeProductSections.length > 0 ? (
        <div className="space-y-8">
          {homeProductSections.map((section) => {
            const isDealsSection = section.sectionType === "TODAYS_DEALS";
            const visibleProducts = section.products.slice(0, section.maxProducts ?? 8);
            const eyebrow = homeSectionEyebrows[section.sectionType] ?? "Product Section";

            return (
              <section
                key={`${section.sectionType}-${section.id ?? section.title}`}
                className="rounded-[1.9rem] border border-[var(--vr-border)] bg-white px-5 py-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)] lg:px-6 lg:py-6"
              >
                <SectionHeader
                  eyebrow={eyebrow}
                  title={section.title}
                  description={section.subtitle}
                  action={
                    <div className="flex flex-wrap items-center gap-3">
                      {isDealsSection && todayDealsCountdown ? <Badge tone="danger">Ends In {todayDealsCountdown}</Badge> : null}
                      <Link
                        to="/products"
                        className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-[var(--vr-text)] transition hover:text-[var(--vr-primary)]"
                      >
                        View All <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  }
                />

                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visibleProducts.map((product) => (
                    <ProductCard key={`${section.sectionType}-${product.id}`} product={product} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState
          eyebrow="Home Sections"
          title="Homepage sections will appear here."
          description="Publish sections from the admin panel to control homepage product rows and their order."
        />
      )}

      {recentlyViewed.length > 0 ? (
        <section>
          <SectionHeader
            eyebrow="Recently Viewed"
            title="Pick up where you left off"
            action={
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={clearHistory}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--vr-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--vr-muted)] transition hover:text-[var(--vr-danger)]"
                >
                  Clear history
                </button>
              </div>
            }
          />
          <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
            {recentlyViewed.slice(0, 8).map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group flex w-[180px] shrink-0 flex-col overflow-hidden rounded-[1.4rem] border border-[var(--vr-border)] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(15,23,42,0.09)]"
              >
                <div className="flex h-32 items-center justify-center border-b border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-3">
                  {product.images[0]?.imageUrl ? (
                    <img src={product.images[0].imageUrl} alt={product.title} className="h-full w-full object-contain" />
                  ) : (
                    <Clock className="h-8 w-8 text-[var(--vr-border)]" />
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-3">
                  <div className="text-xs font-semibold leading-tight text-[var(--vr-text)] line-clamp-2">{product.title}</div>
                  <div className="mt-2 text-sm font-extrabold text-[var(--vr-primary)]">
                    {formatCurrency(product.price)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <SectionHeader
          eyebrow="Shop by Use Case"
          title="Find the right machine for you"
        />
        {useCaseBannersQuery.data && useCaseBannersQuery.data.length > 0 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {useCaseBannersQuery.data.map((banner) => {
              const target = resolveBannerLink(banner.linkUrl, "/products");
              const targetIsExternal = target.startsWith("http");
              const cardBody = (
                <Card className="vr-card-lift h-full overflow-hidden">
                  {banner.desktopImageUrl || banner.imageUrl ? (
                    <div className="-mx-5 -mt-5 mb-4 h-32 overflow-hidden rounded-t-[1.4rem] bg-[var(--vr-surface-soft)]">
                      <img
                        src={banner.desktopImageUrl ?? banner.imageUrl}
                        alt={banner.title ?? "Use case"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[rgba(30,58,138,0.08)] p-3 text-[var(--vr-primary)] w-fit">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  )}
                  <h3 className="mt-2 text-xl font-bold text-[var(--vr-text)]">{banner.title ?? "Curated picks"}</h3>
                  {banner.subtitle ? (
                    <p className="mt-3 text-sm leading-7 text-[var(--vr-muted)]">{banner.subtitle}</p>
                  ) : null}
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--vr-primary)]">
                    {banner.ctaText && banner.ctaText.trim() ? banner.ctaText : "Explore"}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Card>
              );
              return targetIsExternal ? (
                <a key={banner.id ?? `${banner.title}-${banner.linkUrl}`} href={target} target="_blank" rel="noreferrer">
                  {cardBody}
                </a>
              ) : (
                <Link key={banner.id ?? `${banner.title}-${banner.linkUrl}`} to={target}>
                  {cardBody}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {useCasePresets.map((item) => (
              <Link key={item.title} to={item.link}>
                <Card className="vr-card-lift h-full">
                  <div className="rounded-2xl bg-[rgba(30,58,138,0.08)] p-3 text-[var(--vr-primary)] w-fit">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-[var(--vr-text)]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--vr-muted)]">{item.description}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--vr-primary)]">
                    Explore
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          eyebrow="Store Network"
          title="Visit us at our branches"
          action={<Link to="/stores" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-[var(--vr-text)] transition hover:text-[var(--vr-primary)]">View All Stores <ArrowRight className="h-4 w-4" /></Link>}
        />
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {nearbyStores.map((store) => (
            <Card key={store.id} className="overflow-hidden p-0">
              <div className="overflow-hidden border-b border-[var(--vr-border)] bg-[linear-gradient(135deg,#eef4ff,#fff7ed)]">
                {store.imageUrl ? (
                  <img src={store.imageUrl} alt={store.name} className="h-48 w-full object-cover" />
                ) : (
                  <div className="flex h-48 items-center justify-center">
                    <img src={vrTechnologiesLogo} alt="VR Technologies logo" className="h-20 w-20 rounded-[1.2rem] border border-[var(--vr-border)] bg-white p-2" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--vr-primary)]">{store.city}</div>
                    <h3 className="mt-2 text-xl font-bold text-[var(--vr-text)]">{store.name}</h3>
                  </div>
                  {store.googleRating != null ? (
                    <Badge tone="accent">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {store.googleRating.toFixed(1)}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--vr-muted)]">{store.address}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--vr-muted)]">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[var(--vr-primary)]" />
                    {store.state}
                  </span>
                  {store.googleReviewCount ? <span>{store.googleReviewCount} Google reviews</span> : null}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {store.mapLink ? (
                    <a href={store.mapLink} target="_blank" rel="noreferrer" className={getButtonClassName({ variant: "primary", size: "sm" })}>
                      Directions
                    </a>
                  ) : null}
                  {store.whatsapp ? (
                    <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className={getButtonClassName({ variant: "secondary", size: "sm" })}>
                      WhatsApp
                    </a>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {homeTrustStats.map((item) => (
            <div key={item.label} className="rounded-[1.4rem] border border-[var(--vr-border)] bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
              <div className="display-font text-3xl font-extrabold text-[var(--vr-primary)]">
                <CountUpStat value={item.value} suffix={item.suffix} decimals={item.decimals ?? 0} />
              </div>
              <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--vr-text)]">{item.label}</div>
              <p className="mt-2 text-xs leading-6 text-[var(--vr-muted)]">{item.description}</p>
            </div>
          ))}
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {trustBar.map((item) => (
            <div key={item.title} className="rounded-[1.4rem] border border-[var(--vr-border)] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[rgba(30,58,138,0.08)] p-2.5 text-[var(--vr-primary)]">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--vr-text)]">{item.title}</div>
                  <div className="mt-1 text-xs text-[var(--vr-muted)]">{item.subtitle}</div>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-[1.9rem] border border-[rgba(30,58,138,0.14)] bg-[linear-gradient(135deg,#0f172a,#1e3a8a)] p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.16)] lg:p-7">
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#fde68a]">
                Publish-ready shopping
              </div>
              <h2 className="display-font mt-4 text-3xl font-extrabold leading-tight lg:text-[2.7rem]">
                More confidence before every add to cart.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/72 lg:text-base">
                Buyers get a clearer reason to trust refurbished products: service, stores, pricing, and product condition stay connected from homepage to detail page.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {buyerAssurance.map((item) => (
                <div key={item.title} className="rounded-[1.35rem] border border-white/12 bg-white/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 text-[#fde68a]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#fde68a]">{item.stat}</div>
                  <h3 className="mt-2 text-base font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-white/66">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}
