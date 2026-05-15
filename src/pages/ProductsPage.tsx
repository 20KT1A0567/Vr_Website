import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { usePageMeta } from "../hooks/usePageMeta";
import { Boxes, CheckCircle2, Grid3X3, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { FilterChips } from "components/catalog/FilterChips";
import { FilterSidebar } from "components/catalog/FilterSidebar";
import { ProductCard } from "components/catalog/ProductCard";
import { SortDropdown } from "components/catalog/SortDropdown";
import { Button, getButtonClassName } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { FilterDrawer } from "components/ui/FilterDrawer";
import { SkeletonLoader } from "components/ui/SkeletonLoader";
import { StaggerGrid, StaggerItem } from "components/ui/StaggerGrid";
import { getApiErrorMessage } from "../utils/api";
import { formatConditionLabel, formatCurrency, getProductDerivedRating, getProductMerchandisingScore } from "../utils/catalog";
import {
  buildCatalogFilterCounts,
  type CatalogFilterState,
  formatStorageOption,
  initialCatalogFilters,
  matchesCatalogFilters,
  parseCatalogPrice
} from "../utils/catalogFilters";
import { catalogApi } from "api/client";
import { useSelectedStore } from "store/storeStore";
import { SiteFooter } from "components/layouts/SiteFooter";
import { footerPolicyLinks, footerSupportLinks, vrTechnologiesLogo } from "../constants/siteConfig";
import type { ProductCondition } from "types";

type SortOption = "best-sellers" | "price-low" | "price-high" | "newest" | "highest-rated";

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function parseNumberToken(value: string) {
  const digits = value.replace(/[^\d.]/g, "");
  if (!digits) {
    return undefined;
  }
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseStorageToken(value: string) {
  const normalized = normalizeText(value);
  const parsed = parseNumberToken(normalized);
  if (typeof parsed !== "number") {
    return undefined;
  }
  return normalized.includes("tb") ? parsed * 1024 : parsed;
}

function parseConditionToken(value: string): ProductCondition | undefined {
  const normalized = normalizeText(value);
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

function collectSearchParamValues(searchParams: URLSearchParams, keys: string[]) {
  const values: string[] = [];
  for (const key of keys) {
    for (const rawValue of searchParams.getAll(key)) {
      values.push(
        ...rawValue
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      );
    }
  }
  return values;
}

function getCatalogPriceBounds(products: Array<{ price: number }>, fallback = { min: 0, max: 100000 }) {
  const prices = products.map((product) => product.price).filter((value) => typeof value === "number" && Number.isFinite(value));
  if (!prices.length) {
    return fallback;
  }
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}

function normalizePriceFilterState(filters: CatalogFilterState, bounds: { min: number; max: number }) {
  const parsedMin = parseCatalogPrice(filters.minPrice);
  const parsedMax = parseCatalogPrice(filters.maxPrice);
  const nextMin = typeof parsedMin === "number" ? Math.min(Math.max(parsedMin, bounds.min), bounds.max) : undefined;
  const nextMax = typeof parsedMax === "number" ? Math.min(Math.max(parsedMax, bounds.min), bounds.max) : undefined;

  let resolvedMin = nextMin;
  let resolvedMax = nextMax;

  if (typeof resolvedMin === "number" && typeof resolvedMax === "number" && resolvedMin > resolvedMax) {
    resolvedMax = resolvedMin;
  }

  return {
    ...filters,
    minPrice: typeof resolvedMin === "number" ? String(resolvedMin) : "",
    maxPrice: typeof resolvedMax === "number" ? String(resolvedMax) : ""
  };
}

function ProductListingSkeleton() {
  return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <div className="flex flex-col gap-6 lg:h-[calc(100vh-var(--sticky-offset,9.5rem)-1.5rem)] lg:flex-row lg:items-start lg:overflow-hidden">
            <SkeletonLoader className="hidden h-[760px] w-[280px] shrink-0 rounded-[2rem] lg:block" />
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonLoader key={index} className="h-[420px] rounded-[2rem]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductsPage() {
  usePageMeta({ title: "All Products", description: "Browse certified refurbished laptops, desktops, accessories and more. Filter by brand, price, RAM and storage." });
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<CatalogFilterState>(initialCatalogFilters);
  const [mobileDraftFilters, setMobileDraftFilters] = useState<CatalogFilterState>(initialCatalogFilters);
  const [sortBy, setSortBy] = useState<SortOption>("best-sellers");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [mobileDraftSortBy, setMobileDraftSortBy] = useState<SortOption>("best-sellers");
  const [isSortDrawerOpen, setIsSortDrawerOpen] = useState(false);
  const [hasHydratedFilters, setHasHydratedFilters] = useState(false);
  const gridTopRef = useRef<HTMLDivElement | null>(null);
  const previousAppliedKeyRef = useRef<string | null>(null);
  const isApplyingUrlStateRef = useRef(false);
  const pendingUrlStateKeyRef = useRef<string | null>(null);

  const brandsQuery = useQuery({ queryKey: ["brands"], queryFn: catalogApi.getBrands });
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: catalogApi.getCategories });
  const storesQuery = useQuery({ queryKey: ["stores"], queryFn: catalogApi.getStores });
  const selectedStoreIdFromStore = useSelectedStore((state) => state.selectedStoreId);
  const clearSelectedStore = useSelectedStore((state) => state.clearStore);
  const storeIdParam = searchParams.get("storeId");
  const urlStoreId = storeIdParam ? Number(storeIdParam) : undefined;
  const activeStoreId = urlStoreId ?? selectedStoreIdFromStore ?? undefined;
  const activeStore = storesQuery.data?.find((store) => store.id === activeStoreId);
  const catalogProductsQuery = useQuery({
    queryKey: ["catalog-products", activeStoreId ?? null],
    queryFn: () => catalogApi.getProducts(activeStoreId ? { storeId: activeStoreId } : undefined)
  });

  const brands = brandsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const catalogProducts = catalogProductsQuery.data ?? [];

  const processorOptions = useMemo(
    () =>
      Array.from(new Set(catalogProducts.map((product) => product.processor?.trim()).filter(Boolean) as string[])).sort((left, right) =>
        left.localeCompare(right)
      ),
    [catalogProducts]
  );

  const ramOptions = useMemo(
    () => Array.from(new Set(catalogProducts.map((product) => product.ramGb).filter((value): value is number => typeof value === "number"))).sort((a, b) => a - b),
    [catalogProducts]
  );

  const storageOptions = useMemo(
    () =>
      Array.from(new Set(catalogProducts.map((product) => product.storageGb).filter((value): value is number => typeof value === "number"))).sort(
        (a, b) => a - b
      ),
    [catalogProducts]
  );

  const displayOptions = useMemo(
    () =>
      Array.from(new Set(catalogProducts.map((product) => product.displaySize?.trim()).filter(Boolean) as string[])).sort((left, right) =>
        left.localeCompare(right)
      ),
    [catalogProducts]
  );

  const osOptions = useMemo(
    () =>
      Array.from(new Set(catalogProducts.map((product) => product.os?.trim()).filter(Boolean) as string[])).sort((left, right) =>
        left.localeCompare(right)
      ),
    [catalogProducts]
  );

  const graphicsOptions = useMemo(
    () =>
      Array.from(new Set(catalogProducts.map((product) => product.graphicsCard?.trim()).filter(Boolean) as string[])).sort((left, right) =>
        left.localeCompare(right)
      ),
    [catalogProducts]
  );

  const allCatalogPriceBounds = useMemo(() => getCatalogPriceBounds(catalogProducts), [catalogProducts]);
  const priceReferenceProducts = useMemo(() => {
    const scopedFilters = { ...filters, minPrice: "", maxPrice: "" };
    const scopedProducts = catalogProducts.filter((product) => matchesCatalogFilters(product, scopedFilters));
    return scopedProducts.length ? scopedProducts : catalogProducts;
  }, [catalogProducts, filters]);
  const priceBounds = useMemo(
    () => getCatalogPriceBounds(priceReferenceProducts, allCatalogPriceBounds),
    [allCatalogPriceBounds, priceReferenceProducts]
  );
  const appliedFilters = useMemo(() => filters, [filters]);

  useEffect(() => {
    if (!brands.length || !categories.length) {
      return;
    }

    const brandParamValues = collectSearchParamValues(searchParams, ["brand", "brandId", "brandIds"]);
    const categoryParamValues = collectSearchParamValues(searchParams, ["category", "categoryId", "categoryIds"]);
    const processorParam = searchParams.get("processor");
    const ramParam = searchParams.get("ram");
    const storageParam = searchParams.get("storage");
    const displayParam = searchParams.get("display");
    const osParam = searchParams.get("os");
    const graphicsParam = searchParams.get("graphics");
    const featuredParam = searchParams.get("featured");
    const conditionParam = searchParams.get("condition");
    const availabilityParam = searchParams.get("availability");
    const priceParam = searchParams.get("price");
    const sortParam = searchParams.get("sort");

    const nextBrandIds = brandParamValues
      .map((value) => normalizeText(value))
      .flatMap((value) => brands.filter((brand) => String(brand.id) === value || normalizeText(brand.name) === value).map((brand) => brand.id));

    const nextCategoryIds = categoryParamValues
      .map((value) => normalizeText(value))
      .flatMap((value) =>
        categories
          .filter((category) => String(category.id) === value || normalizeText(category.slug) === value || normalizeText(category.name) === value)
          .map((category) => category.id)
      );

    const nextProcessors = processorParam ? processorParam.split(",").map((value) => value.trim()).filter(Boolean) : [];
    const nextDisplays = displayParam ? displayParam.split(",").map((value) => value.trim()).filter(Boolean) : [];
    const nextOs = osParam ? osParam.split(",").map((value) => value.trim()).filter(Boolean) : [];
    const nextGraphics = graphicsParam ? graphicsParam.split(",").map((value) => value.trim()).filter(Boolean) : [];
    const nextRamOptions = ramParam
      ? ramParam
          .split(",")
          .map((value) => parseNumberToken(value))
          .filter((value): value is number => typeof value === "number")
      : [];
    const nextStorageOptions = storageParam
      ? storageParam
          .split(",")
          .map((value) => parseStorageToken(value))
          .filter((value): value is number => typeof value === "number")
      : [];
    const nextConditions = conditionParam
      ? conditionParam
          .split(",")
          .map((value) => parseConditionToken(value))
          .filter((value): value is ProductCondition => Boolean(value))
      : [];

    const [priceMinParam, priceMaxParam] = priceParam?.split("-") ?? [];

    const nextFilters: CatalogFilterState = {
      q: searchParams.get("q") ?? "",
      brandIds: Array.from(new Set(nextBrandIds)),
      categoryIds: Array.from(new Set(nextCategoryIds)),
      processorOptions: Array.from(new Set(nextProcessors)),
      ramOptions: Array.from(new Set(nextRamOptions)),
      storageOptions: Array.from(new Set(nextStorageOptions)),
      displayOptions: Array.from(new Set(nextDisplays)),
      osOptions: Array.from(new Set(nextOs)),
      graphicsOptions: Array.from(new Set(nextGraphics)),
      featuredOnly: featuredParam === "true" || featuredParam === "1",
      conditions: Array.from(new Set(nextConditions)),
      inStockOnly: availabilityParam === "in-stock" || availabilityParam === "stock",
      minPrice: priceMinParam ?? searchParams.get("minPrice") ?? "",
      maxPrice: priceMaxParam ?? searchParams.get("maxPrice") ?? ""
    };

    setFilters(nextFilters);
    setMobileDraftFilters(nextFilters);

    const nextSortBy: SortOption =
      sortParam === "best-sellers" || sortParam === "price-low" || sortParam === "price-high" || sortParam === "newest" || sortParam === "highest-rated"
        ? sortParam
        : "best-sellers";

    pendingUrlStateKeyRef.current = JSON.stringify({ filters: nextFilters, sortBy: nextSortBy });
    isApplyingUrlStateRef.current = true;
    setSortBy(nextSortBy);

    setHasHydratedFilters(true);
  }, [brands, categories, searchParams]);

  useEffect(() => {
    if (!isApplyingUrlStateRef.current || pendingUrlStateKeyRef.current === null) {
      return;
    }

    const currentStateKey = JSON.stringify({ filters, sortBy });
    if (currentStateKey === pendingUrlStateKeyRef.current) {
      isApplyingUrlStateRef.current = false;
      pendingUrlStateKeyRef.current = null;
    }
  }, [filters, sortBy]);

  useEffect(() => {
    if (!hasHydratedFilters || isApplyingUrlStateRef.current) {
      return;
    }

    const nextParams = new URLSearchParams();
    if (filters.q.trim()) {
      nextParams.set("q", filters.q.trim());
    }
    if (filters.brandIds.length) {
      nextParams.set(filters.brandIds.length === 1 ? "brandId" : "brandIds", filters.brandIds.join(","));
    }
    if (filters.categoryIds.length) {
      nextParams.set(filters.categoryIds.length === 1 ? "categoryId" : "categoryIds", filters.categoryIds.join(","));
    }
    if (filters.processorOptions.length) {
      nextParams.set("processor", filters.processorOptions.join(","));
    }
    if (filters.displayOptions.length) {
      nextParams.set("display", filters.displayOptions.join(","));
    }
    if (filters.osOptions.length) {
      nextParams.set("os", filters.osOptions.join(","));
    }
    if (filters.graphicsOptions.length) {
      nextParams.set("graphics", filters.graphicsOptions.join(","));
    }
    if (filters.featuredOnly) {
      nextParams.set("featured", "true");
    }
    if (filters.ramOptions.length) {
      nextParams.set("ram", filters.ramOptions.map((value) => `${value}gb`).join(","));
    }
    if (filters.storageOptions.length) {
      nextParams.set("storage", filters.storageOptions.map((value) => formatStorageOption(value).toLowerCase()).join(","));
    }
    if (filters.conditions.length) {
      nextParams.set("condition", filters.conditions.map((condition) => formatConditionLabel(condition).toLowerCase().replace(/\s+/g, "-")).join(","));
    }
    if (filters.inStockOnly) {
      nextParams.set("availability", "in-stock");
    }

    const minPrice = parseCatalogPrice(filters.minPrice);
    const maxPrice = parseCatalogPrice(filters.maxPrice);
    if (typeof minPrice === "number" || typeof maxPrice === "number") {
      nextParams.set("price", `${minPrice ?? priceBounds.min}-${maxPrice ?? priceBounds.max}`);
    }

    if (sortBy !== "best-sellers") {
      nextParams.set("sort", sortBy);
    }

    if (urlStoreId) {
      nextParams.set("storeId", String(urlStoreId));
    }

    const nextSearch = nextParams.toString();
    if (nextSearch !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [urlStoreId, filters, hasHydratedFilters, priceBounds.max, priceBounds.min, searchParams, setSearchParams, sortBy]);

  useEffect(() => {
    if (!hasHydratedFilters) {
      return;
    }

    setFilters((current) => {
      const next = normalizePriceFilterState(current, priceBounds);
      return current.minPrice === next.minPrice && current.maxPrice === next.maxPrice ? current : next;
    });

    setMobileDraftFilters((current) => {
      const next = normalizePriceFilterState(current, priceBounds);
      return current.minPrice === next.minPrice && current.maxPrice === next.maxPrice ? current : next;
    });
  }, [hasHydratedFilters, priceBounds.max, priceBounds.min]);

  const queryParams = useMemo(
    () => ({
      q: appliedFilters.q.trim() || undefined,
      brandId: appliedFilters.brandIds.length === 1 ? appliedFilters.brandIds[0] : undefined,
      brandIds: appliedFilters.brandIds.length > 1 ? appliedFilters.brandIds.join(",") : undefined,
      categoryId: appliedFilters.categoryIds.length === 1 ? appliedFilters.categoryIds[0] : undefined,
      categoryIds: appliedFilters.categoryIds.length > 1 ? appliedFilters.categoryIds.join(",") : undefined,
      storeId: activeStoreId,
      processorOptions: appliedFilters.processorOptions.length ? appliedFilters.processorOptions.join(",") : undefined,
      displayOptions: appliedFilters.displayOptions.length ? appliedFilters.displayOptions.join(",") : undefined,
      osOptions: appliedFilters.osOptions.length ? appliedFilters.osOptions.join(",") : undefined,
      graphicsOptions: appliedFilters.graphicsOptions.length ? appliedFilters.graphicsOptions.join(",") : undefined,
      featuredOnly: appliedFilters.featuredOnly ? true : undefined,
      ramOptions: appliedFilters.ramOptions.length ? appliedFilters.ramOptions.join(",") : undefined,
      storageOptions: appliedFilters.storageOptions.length ? appliedFilters.storageOptions.join(",") : undefined,
      conditions: appliedFilters.conditions.length ? appliedFilters.conditions.join(",") : undefined,
      inStock: appliedFilters.inStockOnly ? true : undefined,
      minPrice: parseCatalogPrice(appliedFilters.minPrice),
      maxPrice: parseCatalogPrice(appliedFilters.maxPrice)
    }),
    [activeStoreId, appliedFilters]
  );

  const productsQuery = useQuery({
    queryKey: ["products", queryParams],
    queryFn: () => catalogApi.getProducts(queryParams),
    enabled: hasHydratedFilters
  });
  const products = productsQuery.data ?? [];

  const displayProducts = useMemo(() => {
    const cloned = [...products];
    switch (sortBy) {
      case "price-low":
        return cloned.sort((left, right) => left.price - right.price);
      case "price-high":
        return cloned.sort((left, right) => right.price - left.price);
      case "newest":
        return cloned.sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
      case "highest-rated":
        return cloned.sort((left, right) => getProductDerivedRating(right) - getProductDerivedRating(left));
      case "best-sellers":
      default:
        return cloned.sort((left, right) => getProductMerchandisingScore(right) - getProductMerchandisingScore(left));
    }
  }, [products, sortBy]);

  const filterCounts = useMemo(() => buildCatalogFilterCounts(catalogProducts, filters), [catalogProducts, filters]);
  const mobileFilterCounts = useMemo(() => buildCatalogFilterCounts(catalogProducts, mobileDraftFilters), [catalogProducts, mobileDraftFilters]);

  const activeFilterLabels = useMemo(() => {
    const labels: Array<{ key: string; label: string; onRemove: () => void }> = [];

    if (activeStore) {
      labels.push({
        key: `store-${activeStore.id}`,
        label: `Store: ${activeStore.name}`,
        onRemove: () => {
          clearSelectedStore();
          if (urlStoreId) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete("storeId");
            setSearchParams(nextParams, { replace: true });
          }
        }
      });
    }

    if (filters.q.trim()) {
      labels.push({
        key: "query",
        label: `Search: ${filters.q.trim()}`,
        onRemove: () => setFilters((current) => ({ ...current, q: "" }))
      });
    }

    for (const brandId of filters.brandIds) {
      const brand = brands.find((item) => item.id === brandId);
      if (brand) {
        labels.push({
          key: `brand-${brandId}`,
          label: brand.name,
          onRemove: () => setFilters((current) => ({ ...current, brandIds: current.brandIds.filter((item) => item !== brandId) }))
        });
      }
    }

    for (const categoryId of filters.categoryIds) {
      const category = categories.find((item) => item.id === categoryId);
      if (category) {
        labels.push({
          key: `category-${categoryId}`,
          label: category.name,
          onRemove: () => setFilters((current) => ({ ...current, categoryIds: current.categoryIds.filter((item) => item !== categoryId) }))
        });
      }
    }

    for (const processor of filters.processorOptions) {
      labels.push({
        key: `processor-${processor}`,
        label: processor,
        onRemove: () => setFilters((current) => ({ ...current, processorOptions: current.processorOptions.filter((item) => item !== processor) }))
      });
    }

    for (const ram of filters.ramOptions) {
      labels.push({
        key: `ram-${ram}`,
        label: `${ram} GB RAM`,
        onRemove: () => setFilters((current) => ({ ...current, ramOptions: current.ramOptions.filter((item) => item !== ram) }))
      });
    }

    for (const storage of filters.storageOptions) {
      labels.push({
        key: `storage-${storage}`,
        label: formatStorageOption(storage),
        onRemove: () => setFilters((current) => ({ ...current, storageOptions: current.storageOptions.filter((item) => item !== storage) }))
      });
    }

    for (const display of filters.displayOptions) {
      labels.push({
        key: `display-${display}`,
        label: display,
        onRemove: () => setFilters((current) => ({ ...current, displayOptions: current.displayOptions.filter((item) => item !== display) }))
      });
    }

    for (const os of filters.osOptions) {
      labels.push({
        key: `os-${os}`,
        label: os,
        onRemove: () => setFilters((current) => ({ ...current, osOptions: current.osOptions.filter((item) => item !== os) }))
      });
    }

    for (const graphics of filters.graphicsOptions) {
      labels.push({
        key: `graphics-${graphics}`,
        label: graphics,
        onRemove: () => setFilters((current) => ({ ...current, graphicsOptions: current.graphicsOptions.filter((item) => item !== graphics) }))
      });
    }

    if (filters.featuredOnly) {
      labels.push({
        key: "featured",
        label: "Featured Products",
        onRemove: () => setFilters((current) => ({ ...current, featuredOnly: false }))
      });
    }

    for (const condition of filters.conditions) {
      labels.push({
        key: `condition-${condition}`,
        label: formatConditionLabel(condition),
        onRemove: () => setFilters((current) => ({ ...current, conditions: current.conditions.filter((item) => item !== condition) }))
      });
    }

    if (filters.inStockOnly) {
      labels.push({
        key: "availability",
        label: "In Stock",
        onRemove: () => setFilters((current) => ({ ...current, inStockOnly: false }))
      });
    }

    const minPrice = parseCatalogPrice(filters.minPrice);
    const maxPrice = parseCatalogPrice(filters.maxPrice);
    if (typeof minPrice === "number" || typeof maxPrice === "number") {
      labels.push({
        key: "price-range",
        label: `${formatCurrency(minPrice ?? priceBounds.min)} - ${formatCurrency(maxPrice ?? priceBounds.max)}`,
        onRemove: () => setFilters((current) => ({ ...current, minPrice: "", maxPrice: "" }))
      });
    }

    return labels;
  }, [activeStore, brands, categories, clearSelectedStore, filters, priceBounds.max, priceBounds.min, searchParams, setSearchParams, urlStoreId]);

  const sortOptions: Array<{ value: SortOption; label: string; description: string }> = [
    { value: "best-sellers", label: "Relevance", description: "Balanced mix of popular, featured, and buyer-friendly products." },
    { value: "newest", label: "Most Recent", description: "Show the latest products added to the catalog first." },
    { value: "price-high", label: "Highest Price", description: "Premium and higher-spec options first." },
    { value: "price-low", label: "Lowest Price", description: "Budget-first browsing with lower prices at the top." },
    { value: "highest-rated", label: "Best Rated", description: "Products with stronger ratings and review value first." }
  ];

  const activeCategory = categories.find((category) => filters.categoryIds.includes(category.id));
  const activeBrand = brands.find((brand) => filters.brandIds.includes(brand.id));
  const desktopStickyTop = "calc(var(--sticky-offset, 9.5rem) + 2.75rem)";

  const alternativeCategoriesForBrand = useMemo(
    () =>
      activeBrand
        ? Array.from(
            new Set(
              catalogProducts
                .filter((product) => product.brandId === activeBrand.id && product.categoryName && (!activeCategory || product.categoryId !== activeCategory.id))
                .map((product) => product.categoryName as string)
            )
          ).slice(0, 3)
        : [],
    [activeBrand, activeCategory, catalogProducts]
  );
  const alternativeBrandsForCategory = useMemo(
    () =>
      activeCategory
        ? Array.from(
            new Set(
              catalogProducts
                .filter((product) => product.categoryId === activeCategory.id && product.brandName && (!activeBrand || product.brandId !== activeBrand.id))
                .map((product) => product.brandName as string)
            )
          ).slice(0, 4)
        : [],
    [activeBrand, activeCategory, catalogProducts]
  );
  const emptyResultsDescription = activeBrand && activeCategory
    ? alternativeCategoriesForBrand.length
      ? `No ${activeBrand.name} ${activeCategory.name.toLowerCase()} are live right now. ${activeBrand.name} is currently available in ${alternativeCategoriesForBrand.join(", ")}.`
      : alternativeBrandsForCategory.length
        ? `No ${activeBrand.name} ${activeCategory.name.toLowerCase()} are live right now. Try ${activeCategory.name.toLowerCase()} from ${alternativeBrandsForCategory.join(", ")}.`
        : `No ${activeBrand.name} ${activeCategory.name.toLowerCase()} are live right now. Try another brand or category.`
    : activeCategory?.name
      ? alternativeBrandsForCategory.length
        ? `No ${activeCategory.name.toLowerCase()} matched the current filter mix. Try ${alternativeBrandsForCategory.join(", ")} in this category.`
        : `No ${activeCategory.name.toLowerCase()} matched the current filter mix.`
      : activeBrand?.name
        ? alternativeCategoriesForBrand.length
          ? `No ${activeBrand.name} products matched the current filter mix. ${activeBrand.name} is currently available in ${alternativeCategoriesForBrand.join(", ")}.`
          : `No ${activeBrand.name} products matched the current filter mix.`
        : "Try adjusting your filters or resetting the current filter mix to see more products.";
  const pageTitle = activeBrand && activeCategory
    ? `${activeBrand.name} ${activeCategory.name}`
    : activeCategory?.name
      ? activeCategory.name
      : activeBrand?.name
        ? `${activeBrand.name} Products`
        : activeStore?.name
          ? `Products at ${activeStore.name}`
          : "All Products";

  const firstError = brandsQuery.error ?? categoriesQuery.error ?? catalogProductsQuery.error ?? productsQuery.error ?? null;
  const mobilePreviewCount = useMemo(() => {
    const normalizedDraft = normalizePriceFilterState(mobileDraftFilters, priceBounds);
    return catalogProducts.filter((product) => matchesCatalogFilters(product, normalizedDraft)).length;
  }, [catalogProducts, mobileDraftFilters, priceBounds]);

  useEffect(() => {
    const appliedKey = JSON.stringify({ filters: appliedFilters, sortBy });
    if (!hasHydratedFilters) {
      return;
    }

    if (previousAppliedKeyRef.current === null) {
      previousAppliedKeyRef.current = appliedKey;
      return;
    }

    if (previousAppliedKeyRef.current !== appliedKey) {
      gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      previousAppliedKeyRef.current = appliedKey;
    }
  }, [appliedFilters, hasHydratedFilters, sortBy]);

  useEffect(() => {
    if (isFilterDrawerOpen) {
      setMobileDraftFilters(filters);
    }
  }, [filters, isFilterDrawerOpen]);

  useEffect(() => {
    if (isSortDrawerOpen) {
      setMobileDraftSortBy(sortBy);
    }
  }, [isSortDrawerOpen, sortBy]);

  useEffect(() => {
    if (!isFilterDrawerOpen && !isSortDrawerOpen) {
      return;
    }

    document.body.style.overflow = "hidden";
    document.body.dataset.mobileOverlay = "true";

    return () => {
      document.body.style.overflow = "";
      delete document.body.dataset.mobileOverlay;
    };
  }, [isFilterDrawerOpen, isSortDrawerOpen]);

  function resetAllFilters() {
    startTransition(() => {
      setFilters(initialCatalogFilters);
      setMobileDraftFilters(initialCatalogFilters);
      setSortBy("best-sellers");
    });
  }

  function applyMobileFilters() {
    startTransition(() => {
      setFilters(mobileDraftFilters);
    });
    setIsFilterDrawerOpen(false);
  }

  function applyMobileSort() {
    startTransition(() => {
      setSortBy(mobileDraftSortBy);
    });
    setIsSortDrawerOpen(false);
  }

  if (firstError) {
    return (
      <div className="vr-page-shell">
        <Card className="border-rose-200 bg-rose-50 text-rose-700">
          <div className="text-sm font-semibold uppercase tracking-[0.24em]">Products API Error</div>
          <h1 className="mt-4 text-3xl font-bold text-rose-900">The product listing API did not respond correctly.</h1>
          <p className="mt-3 text-base">{getApiErrorMessage(firstError, "Check the backend server and API base URL.")}</p>
        </Card>
      </div>
    );
  }

  if (brandsQuery.isLoading || categoriesQuery.isLoading || catalogProductsQuery.isLoading || !hasHydratedFilters || productsQuery.isLoading) {
    return <ProductListingSkeleton />;
  }

  return (
    <>
    <div
      className="bg-white pb-[88px] lg:pb-0"
      style={{ "--page-h": "calc(100vh - var(--sticky-offset, 9.5rem))" } as CSSProperties}
    >
      <div className="px-4 pt-4 sm:px-6 lg:flex lg:h-[var(--page-h)] lg:flex-col lg:overflow-hidden lg:px-8">
        <div className="mx-auto w-full max-w-[1600px] lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
          {activeStore ? (
            <div className="mb-4 shrink-0 rounded-[1.6rem] border border-[rgba(30,58,138,0.12)] bg-[rgba(30,58,138,0.05)] px-5 py-4 shadow-[0_12px_30px_rgba(30,58,138,0.06)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--vr-primary)]">Branch view</div>
                  <div className="mt-1 text-base font-bold text-[var(--vr-text)]">
                    Showing products at {activeStore.name}, {activeStore.city}
                  </div>
                  <div className="mt-1 text-sm text-[var(--vr-muted)]">Inventory is currently scoped to this branch. Remove the branch filter to browse all stores.</div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-2xl border border-[var(--vr-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--vr-text)]"
                  onClick={() => {
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.delete("storeId");
                    setSearchParams(nextParams, { replace: true });
                  }}
                >
                  View all branches
                </button>
              </div>
            </div>
          ) : null}

          <div
            className="flex flex-col gap-3 lg:min-h-0 lg:flex-1 lg:flex-row"
            style={{ "--products-sticky-top": desktopStickyTop } as CSSProperties}
          >
            {/* Sidebar column: this div is the flex item and stretches to the full products height,
                giving the sticky aside inside it the correct bounds throughout the entire product list */}
            <motion.div
              initial={{ opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="vr-scrollbar hidden lg:flex lg:w-[280px] lg:shrink-0 lg:flex-col lg:overflow-y-auto"
            >
              <FilterSidebar
                brands={brands}
                categories={categories}
                processors={processorOptions}
                ramOptions={ramOptions}
                storageOptions={storageOptions}
                displayOptions={displayOptions}
                osOptions={osOptions}
                graphicsOptions={graphicsOptions}
                priceBounds={priceBounds}
                counts={filterCounts}
                state={filters}
                setState={setFilters}
                onClear={resetAllFilters}
                sticky={false}
                className=""
              />
            </motion.div>

            <div className="min-w-0 flex-1 lg:flex lg:min-h-0 lg:flex-col">
              {/* ── Desktop toolbar — outside scroll container so dropdown is never clipped ── */}
              <div className="mb-3 hidden shrink-0 overflow-visible rounded-2xl border border-[var(--vr-border)] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] lg:block">
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <h2 className="truncate text-[15px] font-extrabold text-[var(--vr-text)]">{pageTitle}</h2>
                    <span className="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-[var(--vr-primary)] px-1.5 text-[10px] font-black text-white">
                      {displayProducts.length}
                    </span>
                    {activeStore && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--vr-muted)]">
                        <Grid3X3 className="h-3 w-3 text-[var(--vr-primary)]" />
                        {activeStore.name}
                      </span>
                    )}
                  </div>
                  <div className="w-[220px] shrink-0">
                    <SortDropdown value={sortBy} options={sortOptions} onChange={setSortBy} />
                  </div>
                </div>
                {activeFilterLabels.length > 0 && (
                  <div className="border-t border-[var(--vr-border)] px-4 py-2.5">
                    <FilterChips items={activeFilterLabels} onClearAll={resetAllFilters} />
                  </div>
                )}
              </div>

              {/* ── Products scroll area ── */}
              <div ref={gridTopRef} className="vr-scrollbar min-h-0 flex-1 lg:overflow-y-auto lg:overscroll-contain">
                {/* ── Mobile toolbar ── */}
                <div className="mb-4 lg:hidden">
                  <div className="rounded-[2rem] border border-[rgba(30,58,138,0.08)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[var(--vr-primary)]">Available products</div>
                    <h2 className="mt-1 text-2xl font-black text-[var(--vr-text)]">{pageTitle}</h2>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-[var(--vr-primary)] px-3 py-1 text-xs font-bold text-white">
                        {displayProducts.length} products
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsFilterDrawerOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-2 text-xs font-bold text-[var(--vr-text)] transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--vr-primary)]" />
                        Filters {activeFilterLabels.length > 0 ? `(${activeFilterLabels.length})` : ""}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSortDrawerOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-2 text-xs font-bold text-[var(--vr-text)] transition hover:border-[var(--vr-primary)]"
                      >
                        Sort: {sortOptions.find((o) => o.value === sortBy)?.label ?? "Relevance"}
                      </button>
                    </div>
                    {activeFilterLabels.length > 0 && (
                      <div className="-mx-1 mt-3 overflow-x-auto pb-1">
                        <FilterChips items={activeFilterLabels} onClearAll={resetAllFilters} compact className="px-1" />
                      </div>
                    )}
                  </div>
                </div>

                <section className="lg:pr-2">
                  {productsQuery.isFetching ? (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <SkeletonLoader key={index} className="h-[420px] rounded-[2rem]" />
                      ))}
                    </div>
                  ) : displayProducts.length ? (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={JSON.stringify(queryParams) + sortBy}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                      >
                        <StaggerGrid className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {displayProducts.map((product) => (
                            <StaggerItem key={product.id}>
                              <ProductCard product={product} />
                            </StaggerItem>
                          ))}
                        </StaggerGrid>
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                    >
                    <EmptyState
                      eyebrow="No Products Found"
                      title={activeStore && filters.q.trim() ? `No "${filters.q.trim()}" matches at ${activeStore.name}` : "No products found"}
                      description={
                        activeStore && filters.q.trim()
                          ? `Nothing matched at ${activeStore.name}. Search across all branches or pick a different branch.`
                          : emptyResultsDescription
                      }
                      action={
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          {activeStore ? (
                            <button
                              className={getButtonClassName({ variant: "primary" })}
                              onClick={() => {
                                const nextParams = new URLSearchParams(searchParams);
                                nextParams.delete("storeId");
                                setSearchParams(nextParams, { replace: true });
                              }}
                            >
                              Search all branches
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--vr-muted)]">
                              <Boxes className="h-4 w-4 text-[var(--vr-primary)]" />
                              Try adjusting your filters
                            </div>
                          )}
                          <button className={getButtonClassName({ variant: activeStore ? "secondary" : "primary" })} onClick={resetAllFilters}>
                            Reset Filters
                          </button>
                        </div>
                      }
                    />
                    </motion.div>
                  )}
                </section>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Full-width footer — outside the gray products container, spans entire viewport width */}
    <SiteFooter
      vrTechnologiesLogo={vrTechnologiesLogo}
      quickCategories={categories}
      footerSupportLinks={footerSupportLinks}
      footerPolicyLinks={footerPolicyLinks}
      primaryStore={activeStore ?? null}
    />

      <FilterDrawer
        open={isFilterDrawerOpen}
        title=""
        onClose={() => setIsFilterDrawerOpen(false)}
        eyebrow="Filters"
        maxHeightClassName="h-[82vh]"
        headerAction={
          <button type="button" onClick={() => setMobileDraftFilters(initialCatalogFilters)} className="text-sm font-semibold text-[var(--vr-muted)]">
            Clear All
          </button>
        }
        footer={
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-[1.15rem] bg-[var(--vr-surface-soft)] px-4 py-3">
              <span className="text-sm font-semibold text-[var(--vr-text)]">{activeStore ? activeStore.name : "All stores"}</span>
              <span className="text-sm font-black text-[var(--vr-primary)]">{mobilePreviewCount} items</span>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setMobileDraftFilters(initialCatalogFilters)}>
                Clear All
              </Button>
              <Button fullWidth onClick={applyMobileFilters}>
                Show Products
              </Button>
            </div>
          </div>
        }
      >
        <FilterSidebar
          brands={brands}
          categories={categories}
          processors={processorOptions}
          ramOptions={ramOptions}
          storageOptions={storageOptions}
          displayOptions={displayOptions}
          osOptions={osOptions}
          graphicsOptions={graphicsOptions}
          priceBounds={priceBounds}
          counts={mobileFilterCounts}
          state={mobileDraftFilters}
          setState={setMobileDraftFilters}
          sticky={false}
          onClose={() => setIsFilterDrawerOpen(false)}
          onClear={() => setMobileDraftFilters(initialCatalogFilters)}
          onApply={applyMobileFilters}
          showCatalogSearch={false}
        />
      </FilterDrawer>

      <FilterDrawer
        open={isSortDrawerOpen}
        title=""
        onClose={() => setIsSortDrawerOpen(false)}
        eyebrow="Sort by"
        maxHeightClassName="max-h-[60vh]"
        footer={<Button fullWidth onClick={applyMobileSort}>Apply</Button>}
      >
        <div className="space-y-1">
          {sortOptions.map((option) => {
            const selected = mobileDraftSortBy === option.value;
            return (
              <motion.button
                key={option.value}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setMobileDraftSortBy(option.value)}
                className={`flex w-full items-center gap-3 rounded-[1.1rem] px-1 py-4 text-left transition ${
                  selected
                    ? "text-[var(--vr-primary)]"
                    : "text-[var(--vr-text)]"
                }`}
              >
                <motion.div
                  animate={selected ? { scale: [0.7, 1.18, 1], backgroundColor: "var(--vr-primary)" } : { scale: 1, backgroundColor: "#fff" }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[var(--vr-primary)] text-white" : "border-slate-300 text-transparent"}`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <div className={`text-[15px] font-semibold ${selected ? "text-[var(--vr-primary)]" : "text-[var(--vr-text)]"}`}>{option.label}</div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </FilterDrawer>
    </>
  );
}
