import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart2,
  Building2,
  ChevronDown,
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
  Tags,
  Truck,
  Undo2,
  User,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi, catalogApi, customerApi } from "api/client";
import { Button, getButtonClassName } from "components/ui/Button";
import { Badge } from "components/ui/Badge";
import { CompareBar } from "components/catalog/CompareBar";
import type { Brand, Category, Product, ProductCondition, Store } from "types";
import { useAuthStore } from "store/authStore";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { formatCurrency, getBrandLink, getBrandQueryValue, getCategoryLink, getCategoryQueryValue, normalizeCatalogValue } from "../../utils/catalog";
import { matchesCatalogFilters, type CatalogFilterState } from "../../utils/catalogFilters";

const vrTechnologiesLogo = "/logo.jpg";

const trustPoints = [
  { label: "12-Month Warranty on Every Laptop", icon: ShieldCheck },
  { label: "COD Available on Eligible Products", icon: CreditCard },
  { label: "Quality Checked", icon: ShieldCheck },
  { label: "7-Day Easy Returns", icon: Undo2 },
  { label: "Fast Delivery Across India", icon: Truck }
] as const;

const desktopLinks = [
  { label: "Stores", to: "/stores", icon: Building2 },
  { label: "Contact", to: "/contact", icon: MessageSquare }
] as const;

const mobileBottomLinks = [
  { label: "Home", to: "/", icon: Home },
  { label: "Categories", to: "/products", icon: ShoppingBag },
  { label: "Cart", to: "/cart", icon: ShoppingCart },
  { label: "Orders", to: "/orders", icon: Package },
  { label: "Profile", to: "/login", icon: User }
] as const;

const footerSupportLinks = [
  { label: "Track Order", to: "/orders" },
  { label: "Returns and Refunds", to: "/contact" },
  { label: "Warranty Support", to: "/contact" },
  { label: "Store Locations", to: "/stores" }
] as const;

const footerPolicyLinks = [
  { label: "Privacy Policy", to: "/contact" },
  { label: "Terms and Conditions", to: "/contact" },
  { label: "Shipping Policy", to: "/contact" },
  { label: "Contact Us", to: "/contact" }
] as const;

const preferredCategoryOrder = ["Laptops", "Desktops", "Accessories", "Monitors", "Gaming Laptops", "MacBooks", "Workstations"];
const LOCATION_STORAGE_KEY = "vrtech-current-location";

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
    return "Current location";
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

  const { data: cart = [] } = useQuery({ queryKey: ["cart"], queryFn: customerApi.getCart, enabled: Boolean(user) });
  const { data: categories = [] } = useQuery({ queryKey: ["header-categories"], queryFn: catalogApi.getCategories });
  const { data: brands = [] } = useQuery({ queryKey: ["header-brands"], queryFn: catalogApi.getBrands });
  const { data: stores = [] } = useQuery({ queryKey: ["header-stores"], queryFn: catalogApi.getStores });

  const [headerSearch, setHeaderSearch] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [activeDiscoveryMenu, setActiveDiscoveryMenu] = useState<"products" | "brands" | null>(null);
  const [currentLocationLabel, setCurrentLocationLabel] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const debouncedHeaderSearch = useDebouncedValue(headerSearch, 350);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (location.pathname === "/products") {
      setHeaderSearch(new URLSearchParams(location.search).get("q") ?? "");
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
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
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
  const { data: discoveryProducts = [] } = useQuery({
    queryKey: ["header-discovery-products"],
    queryFn: () => catalogApi.getProducts()
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

    return {
      q: currentCatalogParams.get("q") ?? "",
      brandIds: activeBrandIds,
      categoryIds: activeCategoryIds,
      processorOptions: Array.from(new Set(processorOptions)),
      ramOptions: Array.from(new Set(ramOptions)),
      storageOptions: Array.from(new Set(storageOptions)),
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

  useEffect(() => {
    if (!shouldAutoSearchRef.current) {
      return;
    }

    const trimmed = debouncedHeaderSearch.trim();
    const nextParams = isProductsPage ? new URLSearchParams(location.search) : new URLSearchParams();

    if (trimmed) {
      nextParams.set("q", trimmed);
    } else if (isProductsPage) {
      nextParams.delete("q");
    } else {
      shouldAutoSearchRef.current = false;
      return;
    }

    const nextSearch = nextParams.toString();
    const nextTarget = nextSearch ? `/products?${nextSearch}` : "/products";
    const currentTarget = `${location.pathname}${location.search}`;

    shouldAutoSearchRef.current = false;
    if (nextTarget !== currentTarget) {
      navigate(nextTarget, { replace: true });
    }
  }, [debouncedHeaderSearch, isProductsPage, location.pathname, location.search, navigate]);

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Current location is not supported on this device.");
      return;
    }

    try {
      setIsLocating(true);
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
      toast.success(`Using ${label} for delivery context.`);
    } catch {
      toast.error("Location access was not completed.");
    } finally {
      setIsLocating(false);
    }
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
    <div className="min-h-screen bg-[var(--vr-bg)] text-[var(--vr-text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--vr-border)] bg-white/92 backdrop-blur">
        <div className="border-b border-[rgba(255,255,255,0.08)] bg-[linear-gradient(90deg,#08101f_0%,#10254d_52%,#08101f_100%)]">
          <div className="vr-marquee" aria-label="Store trust and location updates">
            <div className="vr-marquee-track">
              {[0, 1].map((copyIndex) => (
                <div
                  key={copyIndex}
                  className="vr-marquee-content px-4 py-2 sm:px-6 lg:px-8"
                  aria-hidden={copyIndex === 1}
                >
                  {topMarqueeItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={`${copyIndex}-${item.label}`} className="flex items-center">
                        <span className="vr-marquee-item">
                          <span className="vr-marquee-icon">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="vr-marquee-label">{item.label}</span>
                        </span>
                        <span className="vr-marquee-separator" aria-hidden="true" />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" className="rounded-2xl border border-[var(--vr-border)] p-3 text-[var(--vr-text)] lg:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/" className="flex min-w-0 items-center gap-3">
              <div className="overflow-hidden rounded-[1.2rem] border border-[var(--vr-border)] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                <img src={vrTechnologiesLogo} alt="VR Technologies logo" className="h-12 w-12 object-cover sm:h-14 sm:w-14" />
              </div>
              <div className="min-w-0">
                <div className="display-font truncate text-lg font-extrabold uppercase tracking-tight text-[var(--vr-primary)] sm:text-[1.45rem]">VR Technologies</div>
                <div className="hidden text-[10px] uppercase tracking-[0.22em] text-[var(--vr-muted)] sm:block">Refurbished laptops with warranty</div>
              </div>
            </Link>

            <div className="hidden flex-1 lg:block">
              <div ref={searchContainerRef} className="flex items-center gap-3">
                <form id="header-search-form" onSubmit={handleSearchSubmit} className="relative flex-1">
                  <div className="vr-glass flex items-center overflow-hidden rounded-[1.6rem] border border-[var(--vr-border)] shadow-[0_16px_34px_rgba(15,23,42,0.06)]">
                    <Search className="ml-4 h-4 w-4 text-slate-400" />
                    <input
                      value={headerSearch}
                      onChange={(event) => handleHeaderSearchChange(event.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      placeholder="Search laptops, models, processors, or store-ready deals"
                      className="h-12 flex-1 border-0 bg-transparent px-3 text-sm text-[var(--vr-text)] outline-none placeholder:text-slate-400"
                    />
                    <button className="flex h-12 items-center justify-center bg-[var(--vr-primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--vr-primary-strong)]">
                      Search
                    </button>
                  </div>
                  {isSearchFocused && searchSuggestions.length > 0 ? (
                    <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full overflow-hidden rounded-[1.4rem] border border-[var(--vr-border)] bg-white shadow-[0_24px_55px_rgba(15,23,42,0.14)]">
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
                    </div>
                  ) : null}
                </form>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="inline-flex h-12 shrink-0 items-center gap-2 rounded-[1.4rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 text-sm font-semibold text-[var(--vr-text)] transition hover:border-[var(--vr-primary)] hover:bg-white"
                >
                  <MapPin className="h-4 w-4 text-[var(--vr-primary)]" />
                  <span className="max-w-[150px] truncate">{isLocating ? "Detecting..." : currentLocationLabel || "Set location"}</span>
                </button>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <Link
                to="/compare"
                className="hidden rounded-2xl border border-[var(--vr-border)] p-3 text-[var(--vr-muted)] transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)] lg:inline-flex"
                aria-label="Compare products"
              >
                <BarChart2 className="h-5 w-5" />
              </Link>
              {user ? (
                <div ref={accountMenuRef} className="relative hidden lg:block">
                  <button
                    type="button"
                    onClick={() => setIsAccountMenuOpen((current) => !current)}
                    className="inline-flex items-center gap-3 rounded-2xl border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-3 transition hover:border-[var(--vr-primary)] hover:bg-white"
                  >
                    <User className="h-5 w-5 text-[var(--vr-primary)]" />
                    <div className="text-left">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--vr-muted)]">My Account</div>
                      <div className="text-sm font-semibold text-[var(--vr-text)]">{user.name}</div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-[var(--vr-muted)] transition ${isAccountMenuOpen ? "rotate-180" : ""}`} />
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
                  className="hidden items-center gap-3 rounded-2xl border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-3 transition hover:border-[var(--vr-primary)] hover:bg-white lg:inline-flex"
                >
                  <User className="h-5 w-5 text-[var(--vr-primary)]" />
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--vr-muted)]">Welcome</div>
                    <div className="text-sm font-semibold text-[var(--vr-text)]">Sign In</div>
                  </div>
                </NavLink>
              )}

              <NavLink
                to="/cart"
                className="relative inline-flex items-center gap-3 rounded-2xl border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-3.5 py-3 transition hover:border-[var(--vr-primary)] hover:bg-white sm:px-4"
              >
                <ShoppingCart className="h-5 w-5 text-[var(--vr-primary)]" />
                <div className="hidden text-left sm:block">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--vr-muted)]">Cart</div>
                  <div className="text-sm font-semibold text-[var(--vr-text)]">{cartCount ? `${cartCount} item${cartCount > 1 ? "s" : ""}` : "View Cart"}</div>
                </div>
                {user && cartCount ? (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--vr-accent)] px-1 text-[10px] font-bold text-[var(--vr-dark)]">
                    {cartCount}
                  </span>
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
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="relative flex items-center overflow-hidden rounded-[1.3rem] border border-[var(--vr-border)] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <Search className="ml-4 h-4 w-4 text-slate-400" />
                <input
                  value={headerSearch}
                  onChange={(event) => handleHeaderSearchChange(event.target.value)}
                  placeholder="Search products..."
                  className="h-12 flex-1 border-0 bg-transparent px-3 text-sm text-[var(--vr-text)] outline-none placeholder:text-slate-400"
                />
                <button className="flex h-12 items-center justify-center bg-[var(--vr-primary)] px-4 text-sm font-semibold text-white">Search</button>
              </div>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[1.1rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--vr-text)]"
              >
                <MapPin className="h-4 w-4 text-[var(--vr-primary)]" />
                {isLocating ? "Detecting current location..." : currentLocationLabel || "Set location"}
              </button>
            </form>
          </div>

          <div className="mt-4 hidden items-center justify-between gap-6 lg:flex">
            <nav ref={discoveryMenuRef} className="vr-nav-shell flex flex-wrap items-center gap-2 px-3 py-2">
              <div
                className="relative"
                onMouseEnter={() => setActiveDiscoveryMenu("products")}
                onMouseLeave={() => setActiveDiscoveryMenu((current) => (current === "products" ? null : current))}
              >
                <div className={`inline-flex items-center rounded-full text-sm font-semibold transition ${getDiscoveryPillClass(activeDiscoveryMenu === "products" || isProductsPage, hasSelectedCategory)}`}>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 rounded-l-full px-4 py-2.5"
                  >
                    <Laptop2 className="h-4 w-4" />
                    <span>Products</span>
                    {activeCategory ? (
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${hasSelectedCategory ? "bg-white/18 text-white" : "border border-[var(--vr-border)] bg-white text-[var(--vr-primary)]"}`}>
                        {activeCategory.name}
                      </span>
                    ) : null}
                  </Link>
                  <button
                    type="button"
                    aria-label="Show product categories"
                    aria-expanded={activeDiscoveryMenu === "products"}
                    onClick={() => setActiveDiscoveryMenu((current) => (current === "products" ? null : "products"))}
                    className="rounded-r-full py-2 pl-1 pr-4"
                  >
                    <ChevronDown className={`h-4 w-4 transition ${activeDiscoveryMenu === "products" ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {activeDiscoveryMenu === "products" ? (
                  <div className="absolute left-0 top-full z-50 w-[480px] pt-3">
                    <div className="overflow-hidden rounded-[1.8rem] border border-[var(--vr-border)] bg-white p-4 shadow-[0_28px_70px_rgba(15,23,42,0.16)]">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--vr-primary)]">All Products</div>
                          <div className="mt-1 text-sm text-[var(--vr-muted)]">{productDiscoveryDescription}</div>
                        </div>
                        <Link to="/products" className="text-sm font-semibold text-[var(--vr-primary)]" onClick={() => setActiveDiscoveryMenu(null)}>
                          View all
                        </Link>
                      </div>
                      <div className="vr-scrollbar grid max-h-[420px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                        {orderedCategories.map((category) => {
                          const matchCount = categoryMatchCounts[category.id] ?? 0;
                          const isActive = activeCategoryIds.includes(category.id);
                          const isUnavailable = matchCount === 0 && !isActive;
                          const categorySupportText = isUnavailable
                            ? "No live products in this category"
                            : isActive && isProductsPage
                              ? "Selected in current filters"
                              : `${matchCount} ${matchCount === 1 ? "product" : "products"}`;

                          const categoryCardClassName = `group flex w-full flex-col rounded-[1.35rem] border p-3 text-left transition ${
                            isActive
                              ? "border-[var(--vr-primary)] bg-white shadow-[0_16px_32px_rgba(15,23,42,0.08)]"
                              : "border-[var(--vr-border)] bg-[var(--vr-surface-soft)] hover:border-[var(--vr-primary)] hover:bg-white"
                          } ${isUnavailable ? "cursor-not-allowed opacity-45" : ""}`;

                          const categoryCardContent = (
                            <>
                              <div className="flex w-full items-start justify-between gap-3">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-[var(--vr-border)] bg-white">
                                  {category.iconUrl ? (
                                    <img src={category.iconUrl} alt={category.name} className="h-full w-full object-contain p-2.5" />
                                  ) : (
                                    <img src={vrTechnologiesLogo} alt="VR Technologies logo" className="h-10 w-10 rounded-[0.7rem] object-cover" />
                                  )}
                                </div>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                    isActive
                                      ? "bg-[var(--vr-primary)] text-white"
                                      : "border border-[var(--vr-border)] bg-white text-[var(--vr-muted)]"
                                  }`}
                                >
                                  {matchCount}
                                </span>
                              </div>
                              <div className="mt-3 w-full">
                                <div className="truncate text-base font-bold text-[var(--vr-text)]">{category.name}</div>
                                <div className="mt-1 text-xs text-[var(--vr-muted)]">{categorySupportText}</div>
                              </div>
                            </>
                          );

                          if (isUnavailable) {
                            return (
                              <div key={category.id} className={categoryCardClassName} aria-disabled="true">
                                {categoryCardContent}
                              </div>
                            );
                          }

                          return (
                            <Link
                              key={category.id}
                              to={getCategoryLink(category)}
                              onClick={() => setActiveDiscoveryMenu(null)}
                              className={categoryCardClassName}
                            >
                              {categoryCardContent}
                            </Link>
                          );
                        })}
                      </div>
                      <div className="mt-4 grid gap-2 border-t border-[var(--vr-border)] pt-4 sm:grid-cols-3">
                        <Link
                          to="/products"
                          onClick={() => setActiveDiscoveryMenu(null)}
                          className="rounded-[1.2rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--vr-text)] transition hover:border-[var(--vr-primary)] hover:bg-white"
                        >
                          Browse all products
                        </Link>
                        {desktopLinks.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.label}
                              to={item.to}
                              onClick={() => setActiveDiscoveryMenu(null)}
                              className="inline-flex items-center gap-2 rounded-[1.2rem] border border-[var(--vr-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--vr-text)] transition hover:border-[var(--vr-primary)] hover:bg-[var(--vr-surface-soft)]"
                            >
                              <Icon className="h-4 w-4 text-[var(--vr-primary)]" />
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
                <div className={`inline-flex items-center rounded-full text-sm font-semibold transition ${getDiscoveryPillClass(activeDiscoveryMenu === "brands" || isBrandsPage || hasSelectedBrand, hasSelectedBrand)}`}>
                  <button
                    type="button"
                    aria-expanded={activeDiscoveryMenu === "brands"}
                    aria-label="Show brands"
                    onClick={() => setActiveDiscoveryMenu((current) => (current === "brands" ? null : "brands"))}
                    className="inline-flex items-center gap-2 rounded-l-full px-4 py-2.5"
                  >
                    <Tags className="h-4 w-4" />
                    <span>Brands</span>
                    {activeBrand ? (
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${hasSelectedBrand ? "bg-white/18 text-white" : "border border-[var(--vr-border)] bg-white text-[var(--vr-primary)]"}`}>
                        {activeBrand.name}
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    aria-label="Show brands"
                    aria-expanded={activeDiscoveryMenu === "brands"}
                    onClick={() => setActiveDiscoveryMenu((current) => (current === "brands" ? null : "brands"))}
                    className="rounded-r-full py-2 pl-1 pr-4"
                  >
                    <ChevronDown className={`h-4 w-4 transition ${activeDiscoveryMenu === "brands" ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {activeDiscoveryMenu === "brands" ? (
                  <div className="absolute left-0 top-full z-50 w-[480px] pt-3">
                    <div className="overflow-hidden rounded-[1.8rem] border border-[var(--vr-border)] bg-white p-4 shadow-[0_28px_70px_rgba(15,23,42,0.16)]">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--vr-primary)]">All Brands</div>
                          <div className="mt-1 text-sm text-[var(--vr-muted)]">{brandDiscoveryDescription}</div>
                        </div>
                        <Link to="/brands" className="text-sm font-semibold text-[var(--vr-primary)]" onClick={() => setActiveDiscoveryMenu(null)}>
                          View all
                        </Link>
                      </div>
                      <div className="vr-scrollbar grid max-h-[420px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                        {orderedBrands.map((brand) => {
                          const matchCount = brandMatchCounts[brand.id] ?? 0;
                          const isActive = activeBrandIds.includes(brand.id);
                          const isUnavailable = matchCount === 0 && !isActive;
                          const brandSupportText = isUnavailable
                            ? "No live products for this brand"
                            : isActive && isProductsPage
                              ? "Selected in current filters"
                              : `${matchCount} ${matchCount === 1 ? "product" : "products"}`;

                          const brandCardClassName = `group flex w-full flex-col items-center rounded-[1.3rem] border p-4 text-center transition ${
                            isActive
                              ? "border-[var(--vr-primary)] bg-[var(--vr-surface-soft)] shadow-[0_16px_32px_rgba(15,23,42,0.08)]"
                              : "border-[var(--vr-border)] bg-white hover:border-[var(--vr-primary)] hover:bg-[var(--vr-surface-soft)]"
                          } ${isUnavailable ? "cursor-not-allowed opacity-45" : ""}`;

                          const brandCardContent = (
                            <>
                              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-[var(--vr-border)] bg-white shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
                                {brand.logoUrl ? (
                                  <img src={brand.logoUrl} alt={brand.name} className="h-11 w-11 object-contain" />
                                ) : (
                                  <img src={vrTechnologiesLogo} alt="VR Technologies logo" className="h-11 w-11 rounded-[0.7rem] object-cover" />
                                )}
                              </div>
                              <div className="w-full">
                                <div className="mt-3 text-base font-bold text-[var(--vr-text)]">{brand.name}</div>
                                <div className="mt-1 text-xs text-[var(--vr-muted)]">{brandSupportText}</div>
                                <div className="mt-3">
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                      isActive
                                        ? "bg-[var(--vr-primary)] text-white"
                                        : "border border-[var(--vr-border)] bg-white text-[var(--vr-muted)]"
                                    }`}
                                  >
                                    {matchCount} {matchCount === 1 ? "item" : "items"}
                                  </span>
                                </div>
                              </div>
                            </>
                          );

                          if (isUnavailable) {
                            return (
                              <div key={brand.id} className={brandCardClassName} aria-disabled="true">
                                {brandCardContent}
                              </div>
                            );
                          }

                          return (
                            <Link
                              key={brand.id}
                              to={getBrandLink(brand)}
                              onClick={() => setActiveDiscoveryMenu(null)}
                              className={brandCardClassName}
                            >
                              {brandCardContent}
                            </Link>
                          );
                        })}
                      </div>
                      <div className="mt-4 grid gap-2 border-t border-[var(--vr-border)] pt-4 sm:grid-cols-3">
                        <Link
                          to="/brands"
                          onClick={() => setActiveDiscoveryMenu(null)}
                          className="rounded-[1.2rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--vr-text)] transition hover:border-[var(--vr-primary)] hover:bg-white"
                        >
                          Browse all brands
                        </Link>
                        {desktopLinks.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.label}
                              to={item.to}
                              onClick={() => setActiveDiscoveryMenu(null)}
                              className="inline-flex items-center gap-2 rounded-[1.2rem] border border-[var(--vr-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--vr-text)] transition hover:border-[var(--vr-primary)] hover:bg-[var(--vr-surface-soft)]"
                            >
                              <Icon className="h-4 w-4 text-[var(--vr-primary)]" />
                              {item.label}
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
                    `inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                      isActive ? "bg-[rgba(30,58,138,0.08)] text-[var(--vr-primary)]" : "text-[var(--vr-muted)] hover:bg-[var(--vr-surface-soft)] hover:text-[var(--vr-text)]"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {locationBadgeLabel ? (
                <Badge tone="primary" outlined>
                  <MapPin className="h-3.5 w-3.5" />
                  {locationBadgeLabel}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-slate-950/45" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[88%] max-w-[340px] overflow-y-auto bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--vr-primary)]">VR Technologies</div>
                <div className="mt-1 text-xl font-bold text-[var(--vr-text)]">Browse Menu</div>
              </div>
              <button type="button" className="rounded-full border border-[var(--vr-border)] p-2" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <Link to="/products" className="block rounded-2xl border border-[var(--vr-border)] bg-[var(--vr-primary)] px-4 py-3 text-sm font-semibold text-white">
                All Products
              </Link>
              <Link to="/brands" className="block rounded-2xl border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--vr-text)]">
                All Brands
              </Link>
              {desktopLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.label} to={item.to} className="inline-flex w-full items-center gap-2 rounded-2xl border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--vr-text)]">
                    <Icon className="h-4 w-4 text-[var(--vr-primary)]" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--vr-primary)]">Top Categories</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {quickCategories.map((category) => (
                  <Link
                    key={category.id}
                    to={getCategoryLink(category)}
                    className="rounded-full border border-[var(--vr-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--vr-text)]"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--vr-primary)]">Brands</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {orderedBrands.map((brand) => (
                  <Link
                    key={brand.id}
                    to={getBrandLink(brand)}
                    className="rounded-full border border-[var(--vr-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--vr-text)]"
                  >
                    {brand.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-[var(--vr-border)] bg-[var(--vr-dark)] p-4 text-white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">Support</div>
              <div className="mt-3 space-y-2 text-sm text-white/82">
                <div>{currentLocationLabel || "Set your location for better delivery context"}</div>
                <div>{primaryStore?.phone ?? "Store phone available after product selection"}</div>
                <div>{user ? `Signed in as ${user.name}` : "Sign in to track orders and save wishlist items"}</div>
              </div>
              <div className="mt-4 flex gap-3">
                <Link to={user ? "/orders" : "/login"} className={getButtonClassName({ variant: "accent", size: "sm" })}>
                  {user ? "Track Orders" : "Sign In"}
                </Link>
                {user ? (
                  <Button variant="secondary" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                ) : null}
              </div>
            </div>

            {user ? (
              <div className="mt-6 rounded-[1.6rem] border border-[var(--vr-border)] bg-white p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--vr-primary)]">My Account</div>
                <div className="mt-3 space-y-2">
                  <Link to="/orders" className="flex items-center gap-3 rounded-[1.1rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--vr-text)]">
                    <Package className="h-4 w-4 text-[var(--vr-primary)]" />
                    Orders
                  </Link>
                  <Link to="/wishlist" className="flex items-center gap-3 rounded-[1.1rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--vr-text)]">
                    <Heart className="h-4 w-4 text-[var(--vr-primary)]" />
                    Wishlist
                  </Link>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}

      <main className="vr-mobile-safe pb-10 lg:pb-12">
        <Outlet />
      </main>

      <footer className="bg-[var(--vr-dark)] text-white">

        {/* ── Trust strip ── */}
        <div className="border-b border-white/8">
          <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
            {[
              { icon: ShieldCheck, label: "Warranty Included", sub: "On every eligible product" },
              { icon: ShieldCheck, label: "Quality Checked", sub: "Tested before dispatch" },
              { icon: Undo2,       label: "7-Day Easy Returns", sub: "Hassle-free process" },
              { icon: Truck,       label: "Fast Delivery",     sub: "Pickup or doorstep" }
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 px-4 py-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/8">
                  <item.icon className="h-4 w-4 text-[#bfdbfe]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{item.label}</div>
                  <div className="mt-0.5 text-[11px] text-white/50">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main columns ── */}
        <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.1fr]">

            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="overflow-hidden rounded-[1rem] border border-white/10 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
                  <img src={vrTechnologiesLogo} alt="VR Technologies" className="h-12 w-12 object-cover" />
                </div>
                <div>
                  <div className="display-font text-lg font-extrabold uppercase tracking-tight text-white">VR Technologies</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">Refurbished · Warranted · Trusted</div>
                </div>
              </div>
              <p className="mt-4 max-w-xs text-[13px] leading-6 text-white/55">
                Certified refurbished laptops and desktops with warranty, quality checks, and store-backed support across Hyderabad.
              </p>
            </div>

            {/* Shop */}
            <div>
              <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">Shop</div>
              <ul className="space-y-2.5">
                {quickCategories.slice(0, 6).map((category) => (
                  <li key={category.id}>
                    <Link to={getCategoryLink(category)} className="text-sm text-white/65 transition hover:text-white">
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">Support</div>
              <ul className="space-y-2.5">
                {footerSupportLinks.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className="text-sm text-white/65 transition hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Policy */}
            <div>
              <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">Company</div>
              <ul className="space-y-2.5">
                {footerPolicyLinks.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className="text-sm text-white/65 transition hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">Contact</div>
              <ul className="space-y-3 text-[13px] text-white/65">
                {primaryStore && (
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
                    <span>{primaryStore.address}, {primaryStore.city}</span>
                  </li>
                )}
                {primaryStore?.phone && (
                  <li className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 shrink-0 text-center text-[10px] text-white/30">✆</span>
                    <a href={`tel:${primaryStore.phone}`} className="transition hover:text-white">{primaryStore.phone}</a>
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 shrink-0 text-center text-[10px] text-white/30">@</span>
                  <a href="mailto:support@vrtechnologies.in" className="transition hover:text-white">support@vrtechnologies.in</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-white/8">
          <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:justify-between lg:px-8">
            <p className="text-xs text-white/40">© 2026 VR Technologies. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {["Visa", "Mastercard", "UPI", "Net Banking", "COD"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/60">
                  <CreditCard className="h-3 w-3 text-[#fde68a]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {primaryStore?.whatsapp ? (
        <a
          href={`https://wa.me/${primaryStore.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-[0_8px_28px_rgba(37,211,102,0.5)] transition hover:scale-110 lg:bottom-6"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      ) : null}

      <CompareBar />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--vr-border)] bg-white/96 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_28px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
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
                  {isCart && user && cartCount ? (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--vr-accent)] px-1 text-[9px] font-bold text-[var(--vr-dark)]">
                      {cartCount}
                    </span>
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
