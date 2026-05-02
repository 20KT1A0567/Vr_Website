import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePageMeta } from "../hooks/usePageMeta";
import { Boxes, ChevronRight, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { FilterChips } from "components/catalog/FilterChips";
import { FilterSidebar } from "components/catalog/FilterSidebar";
import { ProductCard } from "components/catalog/ProductCard";
import { SortDropdown } from "components/catalog/SortDropdown";
import { Button, getButtonClassName } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { FilterDrawer } from "components/ui/FilterDrawer";
import { SectionHeader } from "components/ui/SectionHeader";
import { SkeletonLoader } from "components/ui/SkeletonLoader";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { getApiErrorMessage } from "../utils/api";
import { formatConditionLabel, formatCurrency, getProductDerivedRating, getProductMerchandisingScore } from "../utils/catalog";
import {
  buildCatalogFilterCounts,
  type CatalogFilterState,
  conditionOptions,
  formatStorageOption,
  initialCatalogFilters,
  matchesCatalogFilters,
  parseCatalogPrice
} from "../utils/catalogFilters";
import { catalogApi } from "api/client";
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
    <div className="vr-page-shell space-y-6">
      <Card>
        <SkeletonLoader className="h-8 w-40" />
        <SkeletonLoader lines={2} className="mt-4" />
        <div className="mt-5 flex gap-3">
          <SkeletonLoader className="h-11 w-36" />
          <SkeletonLoader className="h-11 w-44" />
        </div>
      </Card>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonLoader key={index} className="h-[420px]" />
        ))}
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
  const [hasHydratedFilters, setHasHydratedFilters] = useState(false);
  const debouncedSearchQuery = useDebouncedValue(filters.q, 300);
  const gridTopRef = useRef<HTMLDivElement | null>(null);
  const previousAppliedKeyRef = useRef<string | null>(null);
  const isApplyingUrlStateRef = useRef(false);
  const pendingUrlStateKeyRef = useRef<string | null>(null);

  const brandsQuery = useQuery({ queryKey: ["brands"], queryFn: catalogApi.getBrands });
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: catalogApi.getCategories });
  const catalogProductsQuery = useQuery({ queryKey: ["catalog-products"], queryFn: () => catalogApi.getProducts() });

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
  const appliedFilters = useMemo(
    () => ({
      ...filters,
      q: debouncedSearchQuery
    }),
    [debouncedSearchQuery, filters]
  );

  useEffect(() => {
    if (!brands.length || !categories.length) {
      return;
    }

    const brandParamValues = collectSearchParamValues(searchParams, ["brand", "brandId", "brandIds"]);
    const categoryParamValues = collectSearchParamValues(searchParams, ["category", "categoryId", "categoryIds"]);
    const processorParam = searchParams.get("processor");
    const ramParam = searchParams.get("ram");
    const storageParam = searchParams.get("storage");
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
    if (appliedFilters.q.trim()) {
      nextParams.set("q", appliedFilters.q.trim());
    }
    if (appliedFilters.brandIds.length) {
      const brandParamKey = appliedFilters.brandIds.length === 1 ? "brandId" : "brandIds";
      nextParams.set(brandParamKey, appliedFilters.brandIds.join(","));
    }
    if (appliedFilters.categoryIds.length) {
      const categoryParamKey = appliedFilters.categoryIds.length === 1 ? "categoryId" : "categoryIds";
      nextParams.set(categoryParamKey, appliedFilters.categoryIds.join(","));
    }
    if (appliedFilters.processorOptions.length) {
      nextParams.set("processor", appliedFilters.processorOptions.join(","));
    }
    if (appliedFilters.ramOptions.length) {
      nextParams.set("ram", appliedFilters.ramOptions.map((value) => `${value}gb`).join(","));
    }
    if (appliedFilters.storageOptions.length) {
      nextParams.set("storage", appliedFilters.storageOptions.map((value) => formatStorageOption(value).toLowerCase()).join(","));
    }
    if (appliedFilters.conditions.length) {
      nextParams.set("condition", appliedFilters.conditions.map((condition) => formatConditionLabel(condition).toLowerCase().replace(/\s+/g, "-")).join(","));
    }
    if (appliedFilters.inStockOnly) {
      nextParams.set("availability", "in-stock");
    }

    const minPrice = parseCatalogPrice(appliedFilters.minPrice);
    const maxPrice = parseCatalogPrice(appliedFilters.maxPrice);
    if (typeof minPrice === "number" || typeof maxPrice === "number") {
      nextParams.set("price", `${minPrice ?? priceBounds.min}-${maxPrice ?? priceBounds.max}`);
    }

    if (sortBy !== "best-sellers") {
      nextParams.set("sort", sortBy);
    }

    const nextSearch = nextParams.toString();
    if (nextSearch !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [appliedFilters, hasHydratedFilters, priceBounds.max, priceBounds.min, searchParams, setSearchParams, sortBy]);

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
      processorOptions: appliedFilters.processorOptions.length ? appliedFilters.processorOptions.join(",") : undefined,
      ramOptions: appliedFilters.ramOptions.length ? appliedFilters.ramOptions.join(",") : undefined,
      storageOptions: appliedFilters.storageOptions.length ? appliedFilters.storageOptions.join(",") : undefined,
      conditions: appliedFilters.conditions.length ? appliedFilters.conditions.join(",") : undefined,
      inStock: appliedFilters.inStockOnly ? true : undefined,
      minPrice: parseCatalogPrice(appliedFilters.minPrice),
      maxPrice: parseCatalogPrice(appliedFilters.maxPrice)
    }),
    [appliedFilters]
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
  }, [brands, categories, filters, priceBounds.max, priceBounds.min]);

  const sortOptions: Array<{ value: SortOption; label: string }> = [
    { value: "best-sellers", label: "Best Sellers" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "newest", label: "Newest First" },
    { value: "highest-rated", label: "Highest Rated" }
  ];

  const activeCategory = categories.find((category) => filters.categoryIds.includes(category.id));
  const activeBrand = brands.find((brand) => filters.brandIds.includes(brand.id));
  const quickBrowseCategories = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          count: filterCounts.categoryCounts[category.id] ?? 0,
          active: filters.categoryIds.includes(category.id)
        }))
        .filter((item) => item.active || item.count > 0)
        .slice(0, 6),
    [categories, filterCounts.categoryCounts, filters.categoryIds]
  );
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
        : "All Products";
  const pageDescription = displayProducts.length
    ? activeBrand && activeCategory
      ? `Showing ${activeCategory.name.toLowerCase()} products from ${activeBrand.name}.`
      : activeCategory?.name
        ? `Showing only ${activeCategory.name.toLowerCase()} from the live catalog.`
        : activeBrand?.name
          ? `Showing only products from ${activeBrand.name}.`
          : "Explore live inventory with sticky filters, product counts, URL-synced chips, and a cleaner mobile filtering flow."
    : emptyResultsDescription;
  const firstError = brandsQuery.error ?? categoriesQuery.error ?? catalogProductsQuery.error ?? productsQuery.error ?? null;

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

  function applyQuickCategory(categoryId?: number) {
    startTransition(() => {
      setFilters((current) => ({
        ...current,
        categoryIds: categoryId ? [categoryId] : [],
        minPrice: "",
        maxPrice: ""
      }));
      setMobileDraftFilters((current) => ({
        ...current,
        categoryIds: categoryId ? [categoryId] : [],
        minPrice: "",
        maxPrice: ""
      }));
    });
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
    <div className="vr-page-shell space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="transition hover:text-slate-700">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span>Products</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--vr-primary)]">{pageTitle}</span>
      </div>

      <div ref={gridTopRef}>
        <Card variant="hero">
          <SectionHeader
            eyebrow="Catalog"
            title={pageTitle}
            description={pageDescription}
            action={
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[var(--vr-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--vr-text)]">
                  {displayProducts.length} products
                </span>
                <Button variant="secondary" className="lg:hidden" icon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => setIsFilterDrawerOpen(true)}>
                  Filter
                </Button>
              </div>
            }
          />

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => applyQuickCategory()}
              className={filters.categoryIds.length ? "vr-filter-shortcut" : "vr-filter-shortcut vr-filter-shortcut-active"}
            >
              <Sparkles className="h-3.5 w-3.5" />
              All Categories
            </button>
            {quickBrowseCategories.map(({ category, count, active }) => (
              <button
                key={category.id}
                type="button"
                onClick={() => applyQuickCategory(category.id)}
                className={active ? "vr-filter-shortcut vr-filter-shortcut-active" : "vr-filter-shortcut"}
              >
                <span>{category.name}</span>
                <span className="rounded-full bg-[var(--vr-surface-soft)] px-2 py-1 text-[10px] font-bold text-[var(--vr-primary)]">
                  {count}
                </span>
              </button>
            ))}
            <div className="ml-auto rounded-full border border-[var(--vr-border)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--vr-muted)]">
              Live price span {formatCurrency(priceBounds.min)} to {formatCurrency(priceBounds.max)}
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_260px]">
            <div className="rounded-[1.4rem] border border-[var(--vr-border)] bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--vr-text)]">
                <Search className="h-4 w-4 text-[var(--vr-primary)]" />
                Search and selected filters
              </div>
              <div className="mt-3">
                <FilterChips items={activeFilterLabels} onClearAll={resetAllFilters} />
              </div>
            </div>

            <SortDropdown value={sortBy} options={sortOptions} onChange={setSortBy} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <FilterSidebar
          brands={brands}
          categories={categories}
          processors={processorOptions}
          ramOptions={ramOptions}
          storageOptions={storageOptions}
          priceBounds={priceBounds}
          counts={filterCounts}
          state={filters}
          setState={setFilters}
          onClear={resetAllFilters}
          className="hidden lg:block"
        />

        <section className="space-y-5">
          {productsQuery.isFetching ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonLoader key={index} className="h-[420px]" />
              ))}
            </div>
          ) : displayProducts.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              eyebrow="No Products Found"
              title="No products found"
              description={emptyResultsDescription}
              action={
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--vr-muted)]">
                    <Boxes className="h-4 w-4 text-[var(--vr-primary)]" />
                    Try adjusting your filters
                  </div>
                  <button className={getButtonClassName({ variant: "primary" })} onClick={resetAllFilters}>
                    Reset Filters
                  </button>
                </div>
              }
            />
          )}
        </section>
      </div>

      <FilterDrawer
        open={isFilterDrawerOpen}
        title="Filters"
        onClose={() => setIsFilterDrawerOpen(false)}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setMobileDraftFilters(initialCatalogFilters)}>
              Clear All
            </Button>
            <Button fullWidth onClick={applyMobileFilters}>
              Apply
            </Button>
          </div>
        }
      >
        <FilterSidebar
          brands={brands}
          categories={categories}
          processors={processorOptions}
          ramOptions={ramOptions}
          storageOptions={storageOptions}
          priceBounds={priceBounds}
          counts={mobileFilterCounts}
          state={mobileDraftFilters}
          setState={setMobileDraftFilters}
          sticky={false}
          onClose={() => setIsFilterDrawerOpen(false)}
          onClear={() => setMobileDraftFilters(initialCatalogFilters)}
        />
      </FilterDrawer>
    </div>
  );
}
