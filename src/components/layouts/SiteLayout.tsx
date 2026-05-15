import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart2,
  Building2,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  Heart,
  Home,
  Laptop2,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Package,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Store as StoreIcon,
  Tags,
  Truck,
  Undo2,
  User,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { authApi, catalogApi, customerApi } from "api/client";
import { Button, getButtonClassName } from "components/ui/Button";
import { Badge } from "components/ui/Badge";
import { CompareBar } from "components/catalog/CompareBar";
import type { Brand, Category, Product, ProductCondition, Store } from "types";
import { useAuthStore } from "store/authStore";
import { useCartStore } from "store/cartStore";
import { useSelectedStore } from "store/storeStore";
import { StoreSelectorModal } from "components/ui/StoreSelectorModal";
import { formatCartItemCount, getCartItemCount } from "utils/cartCounts";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { formatCurrency, getBrandLink, getBrandQueryValue, getCategoryLink, getCategoryQueryValue, normalizeCatalogValue } from "../../utils/catalog";
import { matchesCatalogFilters, type CatalogFilterState } from "../../utils/catalogFilters";
import { SiteFooter } from "./SiteFooter";

import { desktopLinks, footerPolicyLinks, footerSupportLinks, mobileBottomLinks, trustPoints, vrTechnologiesLogo } from "../../constants/siteConfig";

const preferredCategoryOrder = ["Laptops", "Desktops", "Accessories", "Monitors", "Gaming Laptops", "MacBooks", "Workstations"];
const LOCATION_STORAGE_KEY = "vrtech-current-location";
const LOCATION_PROMPT_DISMISSED_KEY = "vrtech-location-prompt-dismissed";

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

function pickPrimaryStore(stores: Store[]) {
  if (!stores.length) {
    return null;
  }

  return [...stores].sort((left, right) => {
    const reviewGap = (right.googleReviewCount ?? 0) - (left.googleReviewCount ?? 0);
    if (reviewGap !== 0) {
      return reviewGap;
    }
    return (right.googleRating ?? 0) - (left.googleRating ?? 0);
  })[0];
}

async function resolveLocationLabel(latitude: number, longitude: number) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
    if (!response.ok) {
      throw new Error("Reverse geocoding failed");
    }

    const payload = (await response.json()) as {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        county?: string;
      };
    };

    const locality = payload.address?.city ?? payload.address?.town ?? payload.address?.village ?? payload.address?.county;
    const region = payload.address?.state;
    return [locality, region].filter(Boolean).join(", ") || "Current location";
  } catch {
    return `Current location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;
  }
}

function getDiscoveryPillClass(isActive: boolean, isSelected = false) {
  if (isSelected) {
    return "bg-[var(--vr-primary)] text-white shadow-[0_14px_34px_rgba(30,58,138,0.22)]";
  }

  return isActive ? "bg-[rgba(30,58,138,0.08)] text-[var(--vr-primary)]" : "text-[var(--vr-muted)] hover:bg-[var(--vr-surface-soft)] hover:text-[var(--vr-text)]";
}

function splitCatalogQueryValues(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => normalizeCatalogValue(item).toLowerCase())
    .filter(Boolean);
}

function collectCatalogQueryValues(searchParams: URLSearchParams, keys: string[]) {
  return keys.flatMap((key) => splitCatalogQueryValues(searchParams.get(key)));
}

function normalizeDiscoveryText(value: string) {
  return value.trim().toLowerCase();
}

function parseDiscoveryNumberToken(value: string) {
  const digits = value.replace(/[^\d.]/g, "");
  if (!digits) {
    return undefined;
  }

  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseDiscoveryStorageToken(value: string) {
  const normalized = normalizeDiscoveryText(value);
  const parsed = parseDiscoveryNumberToken(normalized);
  if (typeof parsed !== "number") {
    return undefined;
  }

  return normalized.includes("tb") ? parsed * 1024 : parsed;
}

function parseDiscoveryConditionToken(value: string): ProductCondition | undefined {
  const normalized = normalizeDiscoveryText(value);
  if (normalized === "excellent" || normalized === "grade-a" || normalized === "gradea" || normalized === "a") {
    return "EXCELLENT";
  }
  if (normalized === "good" || normalized === "grade-b" || normalized === "gradeb" || normalized === "b") {
    return "GOOD";
  }
  if (normalized === "fair" || normalized === "grade-c" || normalized === "gradec" || normalized === "c") {
    return "FAIR";
  }

  return undefined;
}

function buildEntityCountMap(products: Product[], key: "brandId" | "categoryId") {
  return products.reduce<Record<number, number>>((counts, product) => {
    const id = product[key];
    if (typeof id === "number") {
      counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  }, {});
}

export function SiteLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.logout);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const discoveryMenuRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoSearchRef = useRef(false);
  const internalNavRef = useRef(false);

  const { data: cart = [] } = useQuery({ queryKey: ["cart"], queryFn: customerApi.getCart, enabled: Boolean(user) });
  const guestCart = useCartStore((state) => state.guestCart);
  const { data: categories = [] } = useQuery({ queryKey: ["header-categories"], queryFn: catalogApi.getCategories });
  const { data: brands = [] } = useQuery({ queryKey: ["header-brands"], queryFn: catalogApi.getBrands });
  const { data: stores = [] } = useQuery({ queryKey: ["header-stores"], queryFn: catalogApi.getStores });

  const [headerSearch, setHeaderSearch] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [activeDiscoveryMenu, setActiveDiscoveryMenu] = useState<"products" | "brands" | "budget" | null>(null);
  const [currentLocationLabel, setCurrentLocationLabel] = useState("");
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isStoreSelectorOpen, setIsStoreSelectorOpen] = useState(false);
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const storeMenuRef = useRef<HTMLDivElement | null>(null);
  const selectedStoreId = useSelectedStore((state) => state.selectedStoreId);
  const selectedStoreName = useSelectedStore((state) => state.selectedStoreName);
  const selectedStorePlace = useSelectedStore((state) => state.selectedStorePlace);
  const pickStore = useSelectedStore((state) => state.pickStore);
  const clearSelectedStore = useSelectedStore((state) => state.clearStore);
  const headerPillCaption = selectedStoreName ? "Shopping at" : "Pick a store";
  const headerPillName = selectedStoreName ?? "All branches";
  const headerPillPlace = selectedStoreName ? (selectedStorePlace ?? null) : null;
  const debouncedHeaderSearch = useDebouncedValue(headerSearch, 350);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (internalNavRef.current) {
      internalNavRef.current = false;
      return;
    }
    if (location.pathname === "/products") {
      const urlQuery = new URLSearchParams(location.search).get("q") ?? "";
      setHeaderSearch((current) => (current === urlQuery ? current : urlQuery));
    } else {
      setHeaderSearch((current) => (current === "" ? current : ""));
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAccountMenuOpen(false);
    setActiveDiscoveryMenu(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const savedLocation = window.localStorage.getItem(LOCATION_STORAGE_KEY);
    if (savedLocation) {
      setCurrentLocationLabel(savedLocation);
    }
  }, []);


  useEffect(() => {
    function handlePointerDownSearch(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    window.addEventListener("mousedown", handlePointerDownSearch);
    return () => window.removeEventListener("mousedown", handlePointerDownSearch);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (discoveryMenuRef.current && !discoveryMenuRef.current.contains(target)) {
        setActiveDiscoveryMenu(null);
      }

      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setIsAccountMenuOpen(false);
      }

      if (storeMenuRef.current && !storeMenuRef.current.contains(target)) {
        setIsStoreMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen && !isStoreSelectorOpen) {
      return;
    }

    document.body.style.overflow = "hidden";
    document.body.dataset.mobileOverlay = "true";

    return () => {
      document.body.style.overflow = "";
      delete document.body.dataset.mobileOverlay;
    };
  }, [isMobileMenuOpen, isStoreSelectorOpen]);

  const cartCount = getCartItemCount(user ? cart : guestCart);
  const cartCountLabel = cartCount ? formatCartItemCount(cartCount) : "View Cart";
  const orderedCategories = useMemo(() => sortCategories(categories), [categories]);
  const quickCategories = useMemo(() => orderedCategories.slice(0, 8), [orderedCategories]);
  const orderedBrands = useMemo(() => [...brands].sort((left, right) => left.name.localeCompare(right.name)), [brands]);
  const primaryStore = useMemo(() => pickPrimaryStore(stores), [stores]);
  const locationBadgeLabel = currentLocationLabel.trim();
  const topMarqueeItems = useMemo<Array<{ label: string; icon: LucideIcon }>>(
    () => trustPoints.map((item) => ({ label: item.label, icon: item.icon })),
    []
  );
  const isProductsPage = location.pathname === "/products";
  const isBrandsPage = location.pathname === "/brands";
  const currentCatalogSearch = isProductsPage ? location.search : "";
  const currentCatalogParams = useMemo(() => new URLSearchParams(currentCatalogSearch), [currentCatalogSearch]);
  const activeStoreId = useMemo(() => {
    const value = currentCatalogParams.get("storeId");
    const parsed = value ? Number(value) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : null;
  }, [currentCatalogParams]);
  const activeStore = useMemo(
    () => (activeStoreId ? stores.find((store) => store.id === activeStoreId) ?? null : null),
    [activeStoreId, stores]
  );
  const activeHeaderStores = useMemo(() => stores.filter((store) => store.active), [stores]);
  const { data: discoveryProducts = [] } = useQuery({
    queryKey: ["header-discovery-products", activeStoreId ?? null],
    queryFn: () => catalogApi.getProducts(activeStoreId ? { storeId: activeStoreId } : undefined)
  });

  const activeBrandIds = useMemo(() => {
    const selectedValues = collectCatalogQueryValues(currentCatalogParams, ["brand", "brandId", "brandIds"]);
    if (!selectedValues.length) {
      return [];
    }

    return orderedBrands
      .filter((brand) => selectedValues.includes(String(brand.id)) || selectedValues.includes(getBrandQueryValue(brand.name)))
      .map((brand) => brand.id);
  }, [currentCatalogParams, orderedBrands]);

  const activeCategoryIds = useMemo(() => {
    const selectedValues = collectCatalogQueryValues(currentCatalogParams, ["category", "categoryId", "categoryIds"]);
    if (!selectedValues.length) {
      return [];
    }

    return orderedCategories
      .filter((category) => {
        const queryValue = getCategoryQueryValue(category);
        return selectedValues.includes(String(category.id))
          || selectedValues.includes(queryValue)
          || selectedValues.includes(normalizeCatalogValue(category.name).toLowerCase());
      })
      .map((category) => category.id);
  }, [currentCatalogParams, orderedCategories]);

  const currentDiscoveryFilters = useMemo<CatalogFilterState>(() => {
    const processorOptions = currentCatalogParams.get("processor")
      ? currentCatalogParams
          .get("processor")!
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];
    const ramOptions = currentCatalogParams.get("ram")
      ? currentCatalogParams
          .get("ram")!
          .split(",")
          .map((value) => parseDiscoveryNumberToken(value))
          .filter((value): value is number => typeof value === "number")
      : [];
    const storageOptions = currentCatalogParams.get("storage")
      ? currentCatalogParams
          .get("storage")!
          .split(",")
          .map((value) => parseDiscoveryStorageToken(value))
          .filter((value): value is number => typeof value === "number")
      : [];
    const conditions = currentCatalogParams.get("condition")
      ? currentCatalogParams
          .get("condition")!
          .split(",")
          .map((value) => parseDiscoveryConditionToken(value))
          .filter((value): value is ProductCondition => Boolean(value))
      : [];
    const [priceMinParam, priceMaxParam] = currentCatalogParams.get("price")?.split("-") ?? [];

    const displayParam = currentCatalogParams.get("display");
    const osParam = currentCatalogParams.get("os");
    const graphicsParam = currentCatalogParams.get("graphics");
    const featuredParam = currentCatalogParams.get("featured");

    const displayOptions = displayParam ? displayParam.split(",").map((v) => v.trim()).filter(Boolean) : [];
    const osOptions = osParam ? osParam.split(",").map((v) => v.trim()).filter(Boolean) : [];
    const graphicsOptions = graphicsParam ? graphicsParam.split(",").map((v) => v.trim()).filter(Boolean) : [];

    return {
      q: currentCatalogParams.get("q") ?? "",
      brandIds: activeBrandIds,
      categoryIds: activeCategoryIds,
      processorOptions: Array.from(new Set(processorOptions)),
      ramOptions: Array.from(new Set(ramOptions)),
      storageOptions: Array.from(new Set(storageOptions)),
      displayOptions: Array.from(new Set(displayOptions)),
      osOptions: Array.from(new Set(osOptions)),
      graphicsOptions: Array.from(new Set(graphicsOptions)),
      featuredOnly: featuredParam === "true" || featuredParam === "1",
      conditions: Array.from(new Set(conditions)),
      inStockOnly: currentCatalogParams.get("availability") === "in-stock" || currentCatalogParams.get("availability") === "stock",
      minPrice: priceMinParam ?? currentCatalogParams.get("minPrice") ?? "",
      maxPrice: priceMaxParam ?? currentCatalogParams.get("maxPrice") ?? ""
    };
  }, [activeBrandIds, activeCategoryIds, currentCatalogParams]);

  const categoryDiscoveryBase = useMemo(
    () => discoveryProducts.filter((product) => matchesCatalogFilters(product, { ...currentDiscoveryFilters, categoryIds: [] })),
    [currentDiscoveryFilters, discoveryProducts]
  );
  const brandDiscoveryBase = useMemo(
    () => discoveryProducts.filter((product) => matchesCatalogFilters(product, { ...currentDiscoveryFilters, brandIds: [] })),
    [currentDiscoveryFilters, discoveryProducts]
  );
  const categoryMatchCounts = useMemo(() => buildEntityCountMap(categoryDiscoveryBase, "categoryId"), [categoryDiscoveryBase]);
  const brandMatchCounts = useMemo(() => buildEntityCountMap(brandDiscoveryBase, "brandId"), [brandDiscoveryBase]);

  const searchSuggestions = useMemo(() => {
    const q = debouncedHeaderSearch.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return discoveryProducts
      .filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.brandName?.toLowerCase().includes(q) ||
        p.processor?.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [debouncedHeaderSearch, discoveryProducts]);

  const activeCategory = activeCategoryIds.length ? orderedCategories.find((category) => activeCategoryIds.includes(category.id)) ?? null : null;
  const activeBrand = activeBrandIds.length ? orderedBrands.find((brand) => activeBrandIds.includes(brand.id)) ?? null : null;
  const productDiscoveryDescription = activeBrand
    ? `Selecting a category opens only live ${activeBrand.name} products in that category.`
    : "Selecting a category opens only that category's products.";
  const brandDiscoveryDescription = activeCategory
    ? `Selecting a brand opens only ${activeCategory.name.toLowerCase()} from that brand.`
    : "Selecting a brand opens only that brand's products.";
  const hasSelectedCategory = isProductsPage && Boolean(activeCategory);
  const hasSelectedBrand = isProductsPage && Boolean(activeBrand);

  function navigateToSearch(query: string) {
    const trimmed = query.trim();
    setHeaderSearch(trimmed);

    const nextParams = isProductsPage ? new URLSearchParams(location.search) : new URLSearchParams();
    if (trimmed) {
      nextParams.set("q", trimmed);
    } else {
      nextParams.delete("q");
    }

    const nextSearch = nextParams.toString();
    internalNavRef.current = true;
    navigate(nextSearch ? `/products?${nextSearch}` : "/products");
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    shouldAutoSearchRef.current = false;
    navigateToSearch(headerSearch);
  }

  function handleHeaderSearchChange(value: string) {
    shouldAutoSearchRef.current = true;
    setHeaderSearch(value);
  }



  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Current location is not supported on this device.");
      setShowLocationPrompt(false);
      return;
    }

    try {
      setIsLocating(true);
      setShowLocationPrompt(false);
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const label = await resolveLocationLabel(position.coords.latitude, position.coords.longitude);
      setCurrentLocationLabel(label);
      window.localStorage.setItem(LOCATION_STORAGE_KEY, label);
      window.localStorage.setItem(LOCATION_PROMPT_DISMISSED_KEY, "true");
      toast.success(`Using ${label} for delivery context.`);
    } catch {
      window.localStorage.setItem(LOCATION_PROMPT_DISMISSED_KEY, "true");
      toast.error("Location access was not completed.");
    } finally {
      setIsLocating(false);
    }
  }

  function dismissLocationPrompt() {
    setShowLocationPrompt(false);
    window.localStorage.setItem(LOCATION_PROMPT_DISMISSED_KEY, "true");
  }

  async function handleLogout() {
    try {
      if (user?.refreshToken) {
        await authApi.logout(user.refreshToken);
      }
    } catch {
      toast.error("Logged out locally, but the server session could not be closed cleanly.");
    } finally {
      clearUser();
      setIsAccountMenuOpen(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-[var(--vr-text)] transition-colors duration-300" style={{ "--sticky-offset": selectedStoreName ? "11.6rem" : "9.5rem" } as React.CSSProperties}>
      <StoreSelectorModal open={isStoreSelectorOpen} onClose={() => setIsStoreSelectorOpen(false)} />
      {selectedStoreName ? (
        <div className="sticky top-0 z-50 bg-[linear-gradient(90deg,#1e3a8a_0%,#2563eb_55%,#1e3a8a_100%)] text-white lg:fixed lg:left-0 lg:right-0">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-2 text-xs sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2">
              <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-white/80" />
              <span className="truncate">
                <span className="text-white/70">Shopping at</span>
                <span className="ml-1.5 font-bold">{selectedStoreName}</span>
                {selectedStorePlace ? (
                  <span className="ml-2 inline-flex items-center gap-1 text-white/80">
                    <MapPin className="h-3 w-3" />
                    {selectedStorePlace}
                  </span>
                ) : null}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setIsStoreSelectorOpen(true)}
                className="rounded-full bg-white/15 px-3 py-1 font-bold transition hover:bg-white/25"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => {
                  clearSelectedStore();
                  if (location.search.includes("storeId=")) {
                    const params = new URLSearchParams(location.search);
                    params.delete("storeId");
                    const next = params.toString();
                    navigate(`${location.pathname}${next ? `?${next}` : ""}`, { replace: true });
                  }
                }}
                className="rounded-full bg-white/0 px-2 py-1 font-bold text-white/85 transition hover:text-white"
                title="Browse all stores"
              >
                Browse all
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <header
        className={`sticky ${selectedStoreName ? "top-[34px]" : "top-0"} z-40 border-b border-[var(--vr-border)] bg-white/95 backdrop-blur-md transition-all duration-300 lg:fixed lg:left-0 lg:right-0 ${
          scrolled ? "shadow-sm" : ""
        }`}
      >
        <div className="bg-[var(--vr-primary)] text-white shadow-sm overflow-hidden">
          <div className="vr-marquee">
            <div className="vr-marquee-track">
              <div className="vr-marquee-content px-4">
                {topMarqueeItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="vr-marquee-item px-5">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--vr-accent)]" />
                      <span className="truncate text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="vr-marquee-content px-4" aria-hidden="true">
                {topMarqueeItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={`${item.label}-clone`} className="vr-marquee-item px-5">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--vr-accent)]" />
                      <span className="truncate text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className={`mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 transition-all duration-300 ${scrolled ? "py-1" : "py-2"}`}>
          <div className="flex items-center gap-4">

            <Link to="/" className="flex shrink-0 items-center gap-2">
              <div className="overflow-hidden rounded-lg border border-[var(--vr-border)] bg-white shadow-sm">
                <img src={vrTechnologiesLogo} alt="VR Technologies logo" className="h-7 w-7 object-cover sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0">
                <div className="display-font truncate text-xs font-black uppercase tracking-tight text-[var(--vr-primary)] sm:text-sm">VR Technologies</div>
              </div>
            </Link>

            <div className="hidden flex-1 lg:block">
              <div ref={searchContainerRef} className="flex items-center gap-3">
                <form id="header-search-form" onSubmit={handleSearchSubmit} className="relative flex-1">
                  <div className="vr-glass flex items-center overflow-hidden rounded-[1.6rem] border border-[var(--vr-border)] shadow-[0_16px_34px_rgba(15,23,42,0.06)]">
                    <Search className="ml-4 h-4 w-4 text-slate-400" />
                    {activeStore ? (
                      <span className="ml-3 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[rgba(30,58,138,0.08)] px-2.5 py-1 text-[11px] font-semibold text-[var(--vr-primary)]">
                        <Building2 className="h-3 w-3" />
                        <span className="max-w-[140px] truncate">{activeStore.name}</span>
                        <button
                          type="button"
                          aria-label={`Clear ${activeStore.name} filter`}
                          onClick={() => {
                            const nextParams = new URLSearchParams(location.search);
                            nextParams.delete("storeId");
                            internalNavRef.current = true;
                            navigate(nextParams.toString() ? `/products?${nextParams.toString()}` : "/products", { replace: true });
                          }}
                          className="ml-0.5 rounded-full p-0.5 text-[var(--vr-primary)] hover:bg-white/60"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ) : null}
                    <input
                      value={headerSearch}
                      onChange={(event) => handleHeaderSearchChange(event.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      placeholder={activeStore ? `Search at ${activeStore.name}` : "Search laptops, models..."}
                      className="h-8 flex-1 border-0 bg-transparent px-3 text-xs text-[var(--vr-text)] outline-none placeholder:text-slate-400"
                    />
                    <button className="flex h-8 items-center justify-center bg-[var(--vr-primary)] px-3.5 text-xs font-bold text-white transition hover:bg-[var(--vr-primary-strong)]">
                      Search
                    </button>
                  </div>
                  {isSearchFocused && debouncedHeaderSearch.trim().length >= 2 ? (
                    <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full overflow-hidden rounded-[1.4rem] border border-[var(--vr-border)] bg-white shadow-[0_24px_55px_rgba(15,23,42,0.14)]">
                      {searchSuggestions.length > 0 ? (
                        <>
                          {searchSuggestions.map((product) => (
                            <Link
                              key={product.id}
                              to={`/products/${product.id}`}
                              onClick={() => { setIsSearchFocused(false); setHeaderSearch(""); }}
                              className="flex items-center gap-3 px-4 py-3 transition hover:bg-[var(--vr-surface-soft)]"
                            >
                              {product.images[0]?.imageUrl ? (
                                <img src={product.images[0].imageUrl} alt="" className="h-10 w-10 rounded-lg object-contain border border-[var(--vr-border)]" />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-[var(--vr-surface-soft)] border border-[var(--vr-border)]" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-[var(--vr-text)]">{product.title}</div>
                                <div className="text-xs text-[var(--vr-muted)]">{product.brandName} | {product.categoryName}</div>
                              </div>
                              <div className="shrink-0 text-sm font-bold text-[var(--vr-primary)]">
                                {formatCurrency(product.price)}
                              </div>
                            </Link>
                          ))}
                          <div className="border-t border-[var(--vr-border)] px-4 py-2">
                            <button
                              type="button"
                              className="text-xs font-semibold text-[var(--vr-primary)]"
                              onClick={() => {
                                setIsSearchFocused(false);
                                navigateToSearch(headerSearch);
                              }}
                            >
                              See all results for "{headerSearch}"
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="px-4 py-4 text-sm text-[var(--vr-muted)]">
                          No matches for <span className="font-semibold text-[var(--vr-text)]">"{headerSearch}"</span>
                          {activeStore ? (
                            <>
                              {" "}at {activeStore.name}.{" "}
                              <button
                                type="button"
                                onClick={() => {
                                  const nextParams = new URLSearchParams();
                                  nextParams.set("q", headerSearch);
                                  internalNavRef.current = true;
                                  navigate(`/products?${nextParams.toString()}`);
                                  setIsSearchFocused(false);
                                }}
                                className="font-semibold text-[var(--vr-primary)] hover:underline"
                              >
                                Search all branches
                              </button>
                            </>
                          ) : (
                            <>. Press Enter to browse the full catalog.</>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}
                </form>
                <div ref={storeMenuRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsStoreMenuOpen((open) => !open)}
                    aria-haspopup="listbox"
                    aria-expanded={isStoreMenuOpen}
                    className={`inline-flex min-w-[152px] max-w-[190px] items-center gap-2 rounded-xl border px-2.5 py-1 text-sm font-semibold transition ${
                      isStoreMenuOpen
                        ? "border-[var(--vr-primary)] bg-white shadow-[0_0_0_3px_rgba(30,58,138,0.1)]"
                        : "border-[var(--vr-border)] bg-[var(--vr-surface-soft)] hover:border-[var(--vr-primary)] hover:bg-white"
                    }`}
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${selectedStoreName ? "bg-[var(--vr-primary)]" : "bg-[rgba(30,58,138,0.1)]"}`}>
                      <ShoppingBag className={`h-3 w-3 ${selectedStoreName ? "text-white" : "text-[var(--vr-primary)]"}`} />
                    </div>
                    <div className="min-w-0 flex-1 text-left leading-tight">
                      <span className="block text-[9px] uppercase tracking-[0.16em] text-[var(--vr-muted)]">
                        {headerPillCaption}
                      </span>
                      <span className="block truncate text-xs font-bold text-[var(--vr-text)]">{headerPillName}</span>
                      {headerPillPlace ? (
                        <span className="block truncate text-[9px] text-[var(--vr-muted)]">{headerPillPlace}</span>
                      ) : null}
                    </div>
                    <ChevronDown className={`ml-0.5 h-3.5 w-3.5 shrink-0 text-[var(--vr-muted)] transition ${isStoreMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isStoreMenuOpen ? (
                    <div
                      role="listbox"
                      className="absolute right-0 top-full z-50 mt-2 w-[320px] overflow-hidden rounded-[1.25rem] border border-[var(--vr-border)] bg-white shadow-[0_20px_54px_rgba(15,23,42,0.18)]"
                    >
                      <div className="bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_100%)] px-3.5 py-3 text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
                            <StoreIcon className="h-3.5 w-3.5 text-white/80" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">Branch selector</div>
                            <div className="text-[1.1rem] font-bold text-white">Pick a store</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsStoreSelectorOpen(true)}
                            className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-white/15"
                          >
                            Full view
                          </button>
                        </div>
                      </div>

                      <div className="mx-5 my-3 flex items-center gap-2">
                        <div className="h-px flex-1 bg-[var(--vr-border)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--vr-muted)]">
                          {activeHeaderStores.length} branches
                        </span>
                        <div className="h-px flex-1 bg-[var(--vr-border)]" />
                      </div>

                      <ul className="vr-scrollbar max-h-[224px] overflow-y-auto px-3 pb-3">
                        {activeHeaderStores.map((store) => {
                          const isCurrent = selectedStoreId === store.id;
                          const place = store.landmark?.trim() || store.city?.trim() || null;
                          return (
                            <li key={store.id} className="mb-2 last:mb-0">
                              <button
                                type="button"
                                onClick={() => {
                                  pickStore(store.id, store.name, place);
                                  if (location.search.includes("storeId=")) {
                                    const params = new URLSearchParams(location.search);
                                    params.set("storeId", String(store.id));
                                    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
                                  }
                                  setIsStoreMenuOpen(false);
                                  navigate("/products");
                                }}
                                className={`flex w-full items-center gap-2 rounded-[0.9rem] px-2.5 py-1.5 text-left transition ${
                                  isCurrent
                                    ? "bg-[rgba(30,58,138,0.07)] ring-1 ring-[rgba(30,58,138,0.18)]"
                                    : "border border-[var(--vr-border)] hover:border-[var(--vr-primary)] hover:bg-[var(--vr-surface-soft)]"
                                }`}
                              >
                                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[0.75rem] border border-[var(--vr-border)] bg-[linear-gradient(135deg,#eff5ff,#dce8ff)]">
                                  {(store as any).imageUrl ? (
                                    <img src={(store as any).imageUrl} alt={store.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                      <StoreIcon className="h-4 w-4 text-[var(--vr-primary)]" />
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`truncate text-[11px] font-bold ${isCurrent ? "text-[var(--vr-primary)]" : "text-[var(--vr-text)]"}`}>
                                      {store.name}
                                    </span>
                                    {typeof (store as any).googleRating === "number" && (store as any).googleRating > 0 ? (
                                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                                        <Star className="h-2.5 w-2.5 fill-current" />
                                        {(store as any).googleRating.toFixed(1)}
                                      </span>
                                    ) : null}
                                  </div>
                                  {place ? (
                                    <div className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-[var(--vr-muted)]">
                                      <MapPin className="h-2.5 w-2.5 shrink-0 text-[var(--vr-primary)]" />
                                      <span className="truncate">{place}</span>
                                    </div>
                                  ) : null}
                                  <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[9px] font-medium text-[var(--vr-muted)]">
                                    {store.timings ? (
                                      <span className="inline-flex items-center gap-1">
                                        <Clock3 className="h-2.5 w-2.5 shrink-0 text-[var(--vr-primary)]" />
                                        {store.timings}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>

                                {isCurrent ? (
                                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--vr-primary)]">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                ) : (
                                  <div className="rounded-full border border-[var(--vr-border)] px-2 py-0.5 text-[9px] font-bold text-[var(--vr-muted)]">
                                    Select
                                  </div>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>

                      <div className="grid grid-cols-2 gap-2 border-t border-[var(--vr-border)] px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsStoreMenuOpen(false);
                            setIsStoreSelectorOpen(true);
                          }}
                          className="rounded-full border border-[var(--vr-border)] bg-white px-3 py-2 text-[11px] font-bold text-[var(--vr-text)] transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
                        >
                          Open full selector
                        </button>
                        <Link
                          to="/stores"
                          onClick={() => setIsStoreMenuOpen(false)}
                          className="flex items-center justify-center rounded-full bg-[var(--vr-surface-soft)] px-3 py-2 text-[11px] font-bold text-[var(--vr-primary)] transition hover:bg-[rgba(30,58,138,0.08)]"
                        >
                          View all stores
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              {/* Mobile: Wishlist icon (heart) */}
              <NavLink
                to="/wishlist"
                className="relative inline-flex items-center justify-center rounded-full border border-[var(--vr-border)] bg-white p-2.5 text-[var(--vr-text)] transition hover:border-[var(--vr-primary)] lg:hidden"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5 text-[var(--vr-text)]" />
              </NavLink>

              {/* Mobile: Cart icon with badge */}
              <NavLink
                to="/cart"
                className="relative inline-flex items-center justify-center rounded-full border border-[var(--vr-border)] bg-white p-2.5 text-[var(--vr-text)] transition hover:border-[var(--vr-primary)] lg:hidden"
                aria-label="Cart"
              >
                <ShoppingCart className="h-5 w-5 text-[var(--vr-text)]" />
                {cartCount ? (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: [0.5, 1.25, 1], opacity: 1 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#f59e0b] px-1 text-[10px] font-bold text-white"
                  >
                    {cartCount}
                  </motion.span>
                ) : null}
              </NavLink>

              {/* Mobile: 3-dot / More menu button */}
              <button
                type="button"
                className="relative inline-flex items-center justify-center rounded-full border border-[var(--vr-border)] bg-white p-2.5 text-[var(--vr-text)] transition hover:border-[var(--vr-primary)] lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5 text-[var(--vr-text)]" />
              </button>

              {/* Desktop: Account menu */}
              {user ? (
                <div ref={accountMenuRef} className="relative hidden lg:block">
                  <button
                    type="button"
                    onClick={() => setIsAccountMenuOpen((current) => !current)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-3 py-1 transition hover:border-[var(--vr-primary)] hover:bg-white"
                  >
                    <User className="h-4 w-4 text-[var(--vr-primary)]" />
                    <div className="text-left">
                      <div className="text-[9px] uppercase tracking-[0.16em] text-[var(--vr-muted)]">My Account</div>
                      <div className="text-xs font-semibold text-[var(--vr-text)]">{user.name}</div>
                    </div>
                    <ChevronDown className={`h-3.5 w-3.5 text-[var(--vr-muted)] transition ${isAccountMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isAccountMenuOpen ? (
                    <div className="absolute right-0 top-[calc(100%+0.9rem)] z-50 w-[320px] overflow-hidden rounded-[1.8rem] border border-[var(--vr-border)] bg-white shadow-[0_28px_65px_rgba(15,23,42,0.16)]">
                      <div className="border-b border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-5 py-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Profile</div>
                        <div className="mt-1 text-base font-bold text-[var(--vr-text)]">{user.name}</div>
                        <div className="mt-1 text-sm text-[var(--vr-muted)]">{user.email}</div>
                      </div>

                      <div className="space-y-2 p-3">
                        <Link
                          to="/orders"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="flex items-center justify-between rounded-[1.3rem] border border-[var(--vr-border)] bg-white px-4 py-3 transition hover:border-[var(--vr-primary)] hover:bg-[var(--vr-surface-soft)]"
                        >
                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-[var(--vr-primary)]" />
                            <div>
                              <div className="text-sm font-semibold text-[var(--vr-text)]">Orders</div>
                              <div className="text-xs text-[var(--vr-muted)]">Track placed orders and delivery progress</div>
                            </div>
                          </div>
                          <ChevronDown className="-rotate-90 h-4 w-4 text-slate-300" />
                        </Link>

                        <Link
                          to="/wishlist"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="flex items-center justify-between rounded-[1.3rem] border border-[var(--vr-border)] bg-white px-4 py-3 transition hover:border-[var(--vr-primary)] hover:bg-[var(--vr-surface-soft)]"
                        >
                          <div className="flex items-center gap-3">
                            <Heart className="h-4 w-4 text-[var(--vr-primary)]" />
                            <div>
                              <div className="text-sm font-semibold text-[var(--vr-text)]">Wishlist</div>
                              <div className="text-xs text-[var(--vr-muted)]">See saved products and come back later</div>
                            </div>
                          </div>
                          <ChevronDown className="-rotate-90 h-4 w-4 text-slate-300" />
                        </Link>

                        {user.role !== "USER" ? (
                          <a
                            href="/admin-panel"
                            className="flex items-center justify-between rounded-[1.3rem] border border-[var(--vr-border)] bg-white px-4 py-3 transition hover:border-[var(--vr-primary)] hover:bg-[var(--vr-surface-soft)]"
                          >
                            <div className="flex items-center gap-3">
                              <LayoutDashboard className="h-4 w-4 text-[var(--vr-primary)]" />
                              <div>
                                <div className="text-sm font-semibold text-[var(--vr-text)]">Admin Panel</div>
                                <div className="text-xs text-[var(--vr-muted)]">Open the management dashboard</div>
                              </div>
                            </div>
                            <ChevronDown className="-rotate-90 h-4 w-4 text-slate-300" />
                          </a>
                        ) : null}
                      </div>

                      <div className="border-t border-[var(--vr-border)] px-4 py-4">
                        <Button variant="danger" fullWidth icon={<LogOut className="h-4 w-4" />} onClick={handleLogout}>
                          Logout
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <NavLink
                  to="/login"
                  className="hidden items-center gap-2 rounded-xl border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-3 py-1 transition hover:border-[var(--vr-primary)] hover:bg-white lg:inline-flex"
                >
                  <User className="h-4 w-4 text-[var(--vr-primary)]" />
                  <div className="text-left">
                    <div className="text-[9px] uppercase tracking-[0.16em] text-[var(--vr-muted)]">Welcome</div>
                    <div className="text-xs font-semibold text-[var(--vr-text)]">Sign In</div>
                  </div>
                </NavLink>
              )}

              {/* Desktop: Cart button */}
              <NavLink
                to="/cart"
                className="relative hidden items-center gap-2 rounded-xl border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-3 py-1 transition hover:border-[var(--vr-primary)] hover:bg-white lg:inline-flex"
              >
                <ShoppingCart className="h-4 w-4 text-[var(--vr-primary)]" />
                <div className="hidden text-left sm:block">
                  <div className="text-[9px] uppercase tracking-[0.16em] text-[var(--vr-muted)]">Cart</div>
                  <div className="text-xs font-semibold text-[var(--vr-text)]">{cartCountLabel}</div>
                </div>
                {cartCount ? (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: [0.5, 1.25, 1], opacity: 1 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#f59e0b] px-1 text-[10px] font-bold text-white"
                  >
                    {cartCount}
                  </motion.span>
                ) : null}
              </NavLink>

              {user && user.role !== "USER" ? (
                <a href="/admin-panel" className="hidden rounded-2xl border border-[var(--vr-border)] p-3 text-[var(--vr-primary)] transition hover:border-[var(--vr-primary)] hover:bg-[var(--vr-surface-soft)] lg:inline-flex">
                  <LayoutDashboard className="h-5 w-5" />
                </a>
              ) : null}
            </div>
          </div>

          <div className="mt-3 lg:hidden">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative flex items-center overflow-hidden rounded-[1.3rem] border border-[var(--vr-border)] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <Search className="ml-4 h-4 w-4 text-slate-400" />
                <input
                  value={headerSearch}
                  onChange={(event) => handleHeaderSearchChange(event.target.value)}
                  placeholder="Search products..."
                  className="h-12 flex-1 border-0 bg-transparent px-3 text-sm text-[var(--vr-text)] outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="flex h-12 w-12 items-center justify-center bg-[var(--vr-primary)] text-white transition hover:bg-[var(--vr-primary-strong)]"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          <div className="mt-2 hidden items-center justify-between gap-6 lg:flex">
            <nav ref={discoveryMenuRef} className="vr-nav-shell flex flex-wrap items-center gap-1.5 px-2.5 py-1.5">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-[rgba(30,58,138,0.08)] text-[var(--vr-primary)]"
                      : "text-[var(--vr-muted)] hover:bg-[var(--vr-surface-soft)] hover:text-[var(--vr-text)]"
                  }`
                }
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </NavLink>

              <div
                className="relative"
                onMouseEnter={() => setActiveDiscoveryMenu("products")}
                onMouseLeave={() => setActiveDiscoveryMenu((current) => (current === "products" ? null : current))}
              >
                <div className={`inline-flex items-center rounded-full text-xs font-semibold transition ${getDiscoveryPillClass(activeDiscoveryMenu === "products" || isProductsPage, hasSelectedCategory)}`}>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-1.5 rounded-l-full px-2.5 py-1.5"
                  >
                    <Laptop2 className="h-3.5 w-3.5" />
                    <span>Products</span>
                    {activeCategory ? (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${hasSelectedCategory ? "bg-white/18 text-white" : "border border-[var(--vr-border)] bg-white text-[var(--vr-primary)]"}`}>
                        {activeCategory.name}
                      </span>
                    ) : null}
                  </Link>
                  <button
                    type="button"
                    aria-label="Show product categories"
                    aria-expanded={activeDiscoveryMenu === "products"}
                    onClick={() => setActiveDiscoveryMenu((current) => (current === "products" ? null : "products"))}
                    className="rounded-r-full py-1.5 pl-1 pr-2.5"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition ${activeDiscoveryMenu === "products" ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {activeDiscoveryMenu === "products" ? (
                  <div className="absolute left-0 top-full z-50 w-[320px] pt-3">
                    <div className="overflow-hidden rounded-[1.4rem] border border-[var(--vr-border)] bg-white p-2 shadow-[0_28px_70px_rgba(15,23,42,0.16)]">
                      <div className="vr-scrollbar flex max-h-[420px] flex-col overflow-y-auto">
                        {orderedCategories.map((category) => {
                          const matchCount = categoryMatchCounts[category.id] ?? 0;
                          const isActive = activeCategoryIds.includes(category.id);
                          const isUnavailable = matchCount === 0 && !isActive;
                          const categorySubtitle = isUnavailable
                            ? "No live products"
                            : `${matchCount} ${matchCount === 1 ? "model" : "models"}`;

                          const rowClassName = `flex items-center gap-3 rounded-[1rem] px-3 py-1.5 text-left transition ${
                            isActive
                              ? "bg-[var(--vr-surface-soft)]"
                              : "hover:bg-[var(--vr-surface-soft)]"
                          } ${isUnavailable ? "cursor-not-allowed opacity-50" : ""}`;

                          const rowContent = (
                            <>
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[0.7rem] border border-[var(--vr-border)] bg-white">
                                {category.iconUrl ? (
                                  <img src={category.iconUrl} alt={category.name} className="h-full w-full object-contain p-1.5" />
                                ) : (
                                  <Laptop2 className="h-4 w-4 text-[var(--vr-muted)]" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-[var(--vr-text)]">{category.name}</div>
                                <div className="truncate text-[11px] text-[var(--vr-muted)]">{categorySubtitle}</div>
                              </div>
                              {isActive ? (
                                <span className="shrink-0 rounded-full bg-[var(--vr-primary)] px-2 py-0.5 text-[10px] font-semibold text-white">on</span>
                              ) : null}
                            </>
                          );

                          if (isUnavailable) {
                            return (
                              <div key={category.id} className={rowClassName} aria-disabled="true">
                                {rowContent}
                              </div>
                            );
                          }

                          return (
                            <Link
                              key={category.id}
                              to={getCategoryLink(category)}
                              onClick={() => setActiveDiscoveryMenu(null)}
                              className={rowClassName}
                            >
                              {rowContent}
                            </Link>
                          );
                        })}
                      </div>
                      <div className="mt-1 grid gap-1 border-t border-[var(--vr-border)] pt-2">
                        <Link
                          to="/products"
                          onClick={() => setActiveDiscoveryMenu(null)}
                          className="flex items-center justify-between rounded-[0.9rem] px-3 py-2 text-xs font-semibold text-[var(--vr-primary)] transition hover:bg-[var(--vr-surface-soft)]"
                        >
                          <span>Browse all products</span>
                          <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                        </Link>
                        {desktopLinks.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.label}
                              to={item.to}
                              onClick={() => setActiveDiscoveryMenu(null)}
                              className="inline-flex items-center gap-2 rounded-[0.9rem] px-3 py-2 text-xs font-semibold text-[var(--vr-text)] transition hover:bg-[var(--vr-surface-soft)]"
                            >
                              <Icon className="h-3.5 w-3.5 text-[var(--vr-primary)]" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div
                className="relative"
                onMouseEnter={() => setActiveDiscoveryMenu("brands")}
                onMouseLeave={() => setActiveDiscoveryMenu((current) => (current === "brands" ? null : current))}
              >
                <div className={`inline-flex items-center rounded-full text-xs font-semibold transition ${getDiscoveryPillClass(activeDiscoveryMenu === "brands" || isBrandsPage || hasSelectedBrand, hasSelectedBrand)}`}>
                  <button
                    type="button"
                    aria-expanded={activeDiscoveryMenu === "brands"}
                    aria-label="Show brands"
                    onClick={() => setActiveDiscoveryMenu((current) => (current === "brands" ? null : "brands"))}
                    className="inline-flex items-center gap-1.5 rounded-l-full px-2.5 py-1.5"
                  >
                    <Tags className="h-3.5 w-3.5" />
                    <span>Brands</span>
                    {activeBrand ? (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${hasSelectedBrand ? "bg-white/18 text-white" : "border border-[var(--vr-border)] bg-white text-[var(--vr-primary)]"}`}>
                        {activeBrand.name}
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    aria-label="Show brands"
                    aria-expanded={activeDiscoveryMenu === "brands"}
                    onClick={() => setActiveDiscoveryMenu((current) => (current === "brands" ? null : "brands"))}
                    className="rounded-r-full py-1.5 pl-1 pr-2.5"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition ${activeDiscoveryMenu === "brands" ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {activeDiscoveryMenu === "brands" ? (
                  <div className="absolute left-0 top-full z-50 w-[280px] pt-3">
                    <div className="overflow-hidden rounded-[1.4rem] border border-[var(--vr-border)] bg-white p-2 shadow-[0_28px_70px_rgba(15,23,42,0.16)]">
                      <div className="vr-scrollbar flex max-h-[420px] flex-col overflow-y-auto">
                        {orderedBrands.map((brand) => {
                          const matchCount = brandMatchCounts[brand.id] ?? 0;
                          const isActive = activeBrandIds.includes(brand.id);
                          const isUnavailable = matchCount === 0 && !isActive;

                          const rowClassName = `flex items-center gap-3 rounded-[1rem] px-3 py-2.5 text-left transition ${
                            isActive ? "bg-[var(--vr-surface-soft)]" : "hover:bg-[var(--vr-surface-soft)]"
                          } ${isUnavailable ? "cursor-not-allowed opacity-50" : ""}`;

                          const rowContent = (
                            <>
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--vr-border)] bg-white">
                                {brand.logoUrl ? (
                                  <img src={brand.logoUrl} alt={brand.name} className="h-6 w-6 object-contain" />
                                ) : (
                                  <Tags className="h-4 w-4 text-[var(--vr-muted)]" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1 text-sm font-semibold text-[var(--vr-text)]">{brand.name}</div>
                              {isActive ? (
                                <span className="shrink-0 rounded-full bg-[var(--vr-primary)] px-2 py-0.5 text-[10px] font-semibold text-white">on</span>
                              ) : null}
                            </>
                          );

                          if (isUnavailable) {
                            return (
                              <div key={brand.id} className={rowClassName} aria-disabled="true">
                                {rowContent}
                              </div>
                            );
                          }

                          return (
                            <Link
                              key={brand.id}
                              to={getBrandLink(brand)}
                              onClick={() => setActiveDiscoveryMenu(null)}
                              className={rowClassName}
                            >
                              {rowContent}
                            </Link>
                          );
                        })}
                      </div>
                      <div className="mt-1 grid gap-1 border-t border-[var(--vr-border)] pt-2">
                        <Link
                          to="/brands"
                          onClick={() => setActiveDiscoveryMenu(null)}
                          className="flex items-center justify-between rounded-[0.9rem] px-3 py-2 text-xs font-semibold text-[var(--vr-primary)] transition hover:bg-[var(--vr-surface-soft)]"
                        >
                          <span>Browse all brands</span>
                          <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div
                className="relative"
                onMouseEnter={() => setActiveDiscoveryMenu("budget")}
                onMouseLeave={() => setActiveDiscoveryMenu((current) => (current === "budget" ? null : current))}
              >
                <div className={`inline-flex items-center rounded-full text-xs font-semibold transition ${getDiscoveryPillClass(activeDiscoveryMenu === "budget", false)}`}>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-1.5 rounded-l-full px-2.5 py-1.5"
                  >
                    <BarChart2 className="h-3.5 w-3.5" />
                    <span>By Budget</span>
                  </Link>
                  <button
                    type="button"
                    aria-expanded={activeDiscoveryMenu === "budget"}
                    aria-label="Show budget options"
                    onClick={() => setActiveDiscoveryMenu((current) => (current === "budget" ? null : "budget"))}
                    className="rounded-r-full py-1.5 pl-1 pr-2.5"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition ${activeDiscoveryMenu === "budget" ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {activeDiscoveryMenu === "budget" ? (
                  <div className="absolute left-0 top-full z-50 w-[280px] pt-3">
                    <div className="overflow-hidden rounded-[1.4rem] border border-[var(--vr-border)] bg-white p-2 shadow-[0_28px_70px_rgba(15,23,42,0.16)]">
                      <div className="vr-scrollbar flex flex-col overflow-y-auto">
                        {[
                          { label: "Under Rs. 20K", desc: "Basic office and student laptops", param: "maxPrice=20000" },
                          { label: "Rs. 20K - Rs. 40K", desc: "Best value refurbished picks", param: "minPrice=20000&maxPrice=40000" },
                          { label: "Rs. 40K - Rs. 70K", desc: "Performance and MacBook options", param: "minPrice=40000&maxPrice=70000" },
                          { label: "Above Rs. 70K", desc: "Premium workstations and MacBooks", param: "minPrice=70000" }
                        ].map((budget) => {
                          const isActive = currentCatalogParams.toString().includes(budget.param);
                          
                          return (
                            <Link
                              key={budget.label}
                              to={`/products?${budget.param}`}
                              onClick={() => setActiveDiscoveryMenu(null)}
                              className={`flex items-center gap-3 rounded-[1rem] px-3 py-2.5 text-left transition ${
                                isActive ? "bg-[var(--vr-surface-soft)]" : "hover:bg-[var(--vr-surface-soft)]"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-[var(--vr-text)]">{budget.label}</div>
                                <div className="text-[11px] text-[var(--vr-muted)]">{budget.desc}</div>
                              </div>
                              {isActive ? (
                                <span className="shrink-0 rounded-full bg-[var(--vr-primary)] px-2 py-0.5 text-[10px] font-semibold text-white">on</span>
                              ) : null}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {desktopLinks.map((item) => {
                const Icon = item.icon;
                return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${
                      isActive ? "bg-[rgba(30,58,138,0.08)] text-[var(--vr-primary)]" : "text-[var(--vr-muted)] hover:bg-[var(--vr-surface-soft)] hover:text-[var(--vr-text)]"
                    }`
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </NavLink>
              );
              })}
            </nav>

          </div>
        </div>
      </header>

      {showLocationPrompt ? (
        <div className="fixed inset-x-3 top-[8.25rem] z-50 mx-auto max-w-[560px] rounded-[1.4rem] border border-[rgba(30,58,138,0.14)] bg-white p-4 shadow-[0_22px_60px_rgba(15,23,42,0.18)] sm:top-[8.75rem] lg:top-[9.25rem]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(30,58,138,0.08)] text-[var(--vr-primary)]">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-[var(--vr-text)]">Allow location for nearby store support?</div>
              <p className="mt-1 text-xs leading-5 text-[var(--vr-muted)]">
                We will show your detected area in the header and use it for delivery and branch context.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--vr-primary)] px-4 py-2 text-xs font-bold text-white transition hover:bg-[var(--vr-primary-strong)] disabled:opacity-60"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {isLocating ? "Detecting..." : "Allow location"}
                </button>
                <button
                  type="button"
                  onClick={dismissLocationPrompt}
                  className="rounded-full border border-[var(--vr-border)] bg-white px-4 py-2 text-xs font-bold text-[var(--vr-muted)] transition hover:text-[var(--vr-text)]"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close location prompt"
              onClick={dismissLocationPrompt}
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[var(--vr-danger)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-slate-950/50" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="absolute right-0 top-0 flex h-full w-[88%] max-w-[380px] flex-col overflow-hidden bg-white shadow-[-20px_0_60px_rgba(15,23,42,0.2)]">

            {/* ── Sticky header ── */}
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--vr-border)] bg-white px-4 py-3">
              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-[0.32em] text-[var(--vr-primary)]">VR Technologies</div>
                <div className="text-[15px] font-extrabold leading-tight text-[var(--vr-text)]">Browse Menu</div>
              </div>
              <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--vr-border)] text-[var(--vr-muted)] transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-text)]" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="vr-scrollbar flex-1 overflow-y-auto px-4 pb-8 pt-4">

              {/* Profile card */}
              <div className="overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_100%)] p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-extrabold">
                    {user ? user.name.charAt(0).toUpperCase() : <User className="h-5 w-5 text-white/80" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold leading-tight">{user ? user.name : "Guest"}</div>
                    <div className="truncate text-[11px] text-white/55">
                      {user ? (user.email ?? "Signed in") : "Sign in for orders & wishlist"}
                    </div>
                  </div>
                  <Link
                    to={user ? "/orders" : "/login"}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-white/25"
                  >
                    {user ? "Account" : "Sign In"}
                  </Link>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Link to={user ? "/orders" : "/login"} onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center gap-1 rounded-xl bg-white/10 py-2.5 text-center transition hover:bg-white/20">
                    <Package className="h-4 w-4 text-white/80" />
                    <span className="text-[10px] font-semibold text-white/80">Orders</span>
                  </Link>
                  <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center gap-1 rounded-xl bg-white/10 py-2.5 text-center transition hover:bg-white/20">
                    <Heart className="h-4 w-4 text-white/80" />
                    <span className="text-[10px] font-semibold text-white/80">Wishlist</span>
                  </Link>
                  <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center gap-1 rounded-xl bg-white/10 py-2.5 text-center transition hover:bg-white/20">
                    <ShoppingCart className="h-4 w-4 text-white/80" />
                    <span className="text-[10px] font-semibold text-white/80">Cart</span>
                  </Link>
                </div>
              </div>

              {/* Main nav links */}
              <div className="mt-4 space-y-1.5">
                {[
                  { label: "Home", to: "/", icon: Home, active: location.pathname === "/" },
                  { label: "All Products", to: "/products", icon: Laptop2, active: location.pathname === "/products" },
                  { label: "All Orders", to: user ? "/orders" : "/login", icon: Package, active: location.pathname === "/orders" },
                  { label: "Stores", to: "/stores", icon: StoreIcon, active: location.pathname === "/stores" },
                  { label: "Contact", to: "/contact", icon: MessageSquare, active: location.pathname === "/contact" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-[14px] font-semibold transition ${
                        item.active
                          ? "border-[rgba(30,58,138,0.2)] bg-[linear-gradient(135deg,#1e3a8a,#2563eb)] text-white shadow-[0_8px_20px_rgba(30,58,138,0.2)]"
                          : "border-[var(--vr-border)] bg-[var(--vr-surface-soft)] text-[var(--vr-text)] hover:border-[var(--vr-primary)] hover:bg-white"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${item.active ? "text-white" : "text-[var(--vr-primary)]"}`} />
                        {item.label}
                      </span>
                      <ChevronDown className={`h-4 w-4 -rotate-90 ${item.active ? "text-white/70" : "text-slate-300"}`} />
                    </Link>
                  );
                })}
              </div>

              {/* Help Me Choose CTA */}
              <Link
                to="/help-me-choose"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3.5 transition hover:border-amber-300"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/20">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-amber-900">Help me choose</div>
                  <div className="text-[11px] text-amber-700/70">Find your perfect laptop in 4 questions</div>
                </div>
                <ChevronDown className="-rotate-90 h-4 w-4 text-amber-400" />
              </Link>

              {/* Top Categories */}
              <div className="mt-5">
                <div className="mb-2.5 text-[10px] font-extrabold uppercase tracking-[0.28em] text-[var(--vr-muted)]">Categories</div>
                <div className="grid grid-cols-2 gap-2">
                  {quickCategories.slice(0, 6).map((category) => (
                    <Link
                      key={category.id}
                      to={getCategoryLink(category)}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="group flex items-center gap-2.5 overflow-hidden rounded-2xl border border-[var(--vr-border)] bg-white p-2.5 transition hover:border-[var(--vr-primary)] hover:shadow-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] transition group-hover:border-[var(--vr-primary)]/30">
                        {category.iconUrl ? (
                          <img src={category.iconUrl} alt={category.name} className="h-7 w-7 object-contain" />
                        ) : (
                          <Laptop2 className="h-4 w-4 text-[var(--vr-primary)]" />
                        )}
                      </div>
                      <span className="min-w-0 flex-1 text-[12px] font-semibold leading-tight text-[var(--vr-text)]">{category.name}</span>
                    </Link>
                  ))}
                </div>
                <Link
                  to="/products"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-2 flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] py-2.5 text-[12px] font-semibold text-[var(--vr-primary)] transition hover:border-[var(--vr-primary)] hover:bg-white"
                >
                  Browse all categories <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                </Link>
              </div>

              {/* Popular Brands */}
              <div className="mt-5">
                <div className="mb-2.5 text-[10px] font-extrabold uppercase tracking-[0.28em] text-[var(--vr-muted)]">Popular Brands</div>
                <div className="grid grid-cols-4 gap-2">
                  {orderedBrands.slice(0, 8).map((brand) => (
                    <Link
                      key={brand.id}
                      to={getBrandLink(brand)}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="group flex flex-col items-center gap-1.5 rounded-xl border border-[var(--vr-border)] bg-white py-3 transition hover:border-[var(--vr-primary)] hover:shadow-sm"
                    >
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[var(--vr-border)] bg-[var(--vr-surface-soft)]">
                        {brand.logoUrl ? (
                          <img src={brand.logoUrl} alt={brand.name} className="h-6 w-6 object-contain" />
                        ) : (
                          <Tags className="h-3.5 w-3.5 text-[var(--vr-primary)]" />
                        )}
                      </div>
                      <span className="w-full truncate px-1 text-center text-[10px] font-semibold text-[var(--vr-text)]">{brand.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Shop by Budget */}
              <div className="mt-5">
                <div className="mb-2.5 text-[10px] font-extrabold uppercase tracking-[0.28em] text-[var(--vr-muted)]">Shop by Budget</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Under ₹20K", sub: "Entry level", to: "/products?maxPrice=20000" },
                    { label: "₹20K – ₹40K", sub: "Best value", to: "/products?minPrice=20000&maxPrice=40000" },
                    { label: "₹40K – ₹70K", sub: "Performance", to: "/products?minPrice=40000&maxPrice=70000" },
                    { label: "Above ₹70K", sub: "Premium", to: "/products?minPrice=70000" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex flex-col rounded-2xl border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-3.5 py-3 transition hover:border-[var(--vr-primary)] hover:bg-white"
                    >
                      <span className="text-[13px] font-bold text-[var(--vr-text)]">{item.label}</span>
                      <span className="text-[10px] text-[var(--vr-muted)]">{item.sub}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* WhatsApp footer */}
              {primaryStore?.whatsapp ? (
                <a
                  href={`https://wa.me/${primaryStore.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 transition hover:border-emerald-200"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366]">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-emerald-800">Chat on WhatsApp</div>
                    <div className="text-[11px] text-emerald-600/70">Speak to our team directly</div>
                  </div>
                </a>
              ) : null}

            </div>
          </aside>
        </div>
      ) : null}

      <main className={`vr-mobile-safe flex-1 lg:pb-0 ${selectedStoreName ? "lg:pt-[11.6rem]" : "lg:pt-[9.4rem]"} ${isProductsPage ? "" : "pb-10"}`}>
        <Outlet />
      </main>

      {!isProductsPage && (
        <SiteFooter
          vrTechnologiesLogo={vrTechnologiesLogo}
          quickCategories={quickCategories}
          footerSupportLinks={footerSupportLinks}
          footerPolicyLinks={footerPolicyLinks}
          primaryStore={primaryStore}
        />
      )}

      {primaryStore?.whatsapp ? (
        <a
          href={`https://wa.me/${primaryStore.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
          className="vr-mobile-floating-whatsapp fixed bottom-3 right-3 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] shadow-[0_10px_24px_rgba(37,211,102,0.32)] transition hover:scale-105 sm:right-4 lg:bottom-5 lg:right-5 lg:h-12 lg:w-12"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      ) : null}

      <CompareBar />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--vr-border)] bg-white/96 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-12px_28px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="flex items-center gap-1.5">
          {mobileBottomLinks.map((item) => {
            const target = item.label === "Profile" ? (user ? "/orders" : "/login") : item.to;
            const isCart = item.label === "Cart";
            return (
              <NavLink
                key={item.label}
                to={target}
                className={({ isActive }) => `vr-bottom-nav-link ${isActive ? "vr-bottom-nav-link-active" : "vr-bottom-nav-link-idle"}`}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {isCart && cartCount ? (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: [0.5, 1.25, 1] }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute -right-2 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--vr-accent)] px-1 text-[9px] font-bold text-[var(--vr-dark)]">
                      {cartCount}
                    </motion.span>
                  ) : null}
                </div>
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}
