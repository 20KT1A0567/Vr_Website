import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { catalogApi } from "api/client";
import { FilterSidebar, type CatalogFilterState } from "components/catalog/FilterSidebar";
import { ProductCard } from "components/catalog/ProductCard";
import { getApiErrorMessage } from "../utils/api";

const initialFilters: CatalogFilterState = {
  q: "",
  brandIds: [],
  categoryIds: [],
  processorOptions: [],
  ramOptions: [],
  storageOptions: [],
  minPrice: "",
  maxPrice: ""
};

function formatStorage(storageGb: number) {
  return storageGb >= 1024 ? `${storageGb / 1024} TB` : `${storageGb} GB`;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function parsePrice(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<CatalogFilterState>(initialFilters);
  const [sortBy, setSortBy] = useState<"best-sellers" | "price-low" | "price-high" | "name">("best-sellers");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

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
  const priceBounds = useMemo(() => {
    const prices = catalogProducts.map((product) => product.price).filter((value) => typeof value === "number");
    if (!prices.length) {
      return { min: 0, max: 100000 };
    }

    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }, [catalogProducts]);
  const categoryProductCounts = useMemo(
    () =>
      catalogProducts.reduce<Record<number, number>>((counts, product) => {
        if (product.categoryId) {
          counts[product.categoryId] = (counts[product.categoryId] ?? 0) + 1;
        }
        return counts;
      }, {}),
    [catalogProducts]
  );

  useEffect(() => {
    if (!brands.length || !categories.length) {
      return;
    }

    const brandParam = searchParams.get("brand");
    const categoryParam = searchParams.get("category");
    const processorParam = searchParams.get("processor");
    const ramParam = searchParams.get("ram");
    const storageParam = searchParams.get("storage");

    const nextBrandIds = brandParam
      ? brandParam
          .split(",")
          .map((value) => normalizeText(value))
          .flatMap((value) =>
            brands
              .filter((brand) => String(brand.id) === value || normalizeText(brand.name) === value)
              .map((brand) => brand.id)
          )
      : [];

    const nextCategoryIds = categoryParam
      ? categoryParam
          .split(",")
          .map((value) => normalizeText(value))
          .flatMap((value) =>
            categories
              .filter((category) => String(category.id) === value || normalizeText(category.slug) === value || normalizeText(category.name) === value)
              .map((category) => category.id)
          )
      : [];

    const nextProcessors = processorParam
      ? processorParam
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

    const nextRamOptions = ramParam
      ? ramParam
          .split(",")
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value))
      : [];

    const nextStorageOptions = storageParam
      ? storageParam
          .split(",")
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value))
      : [];

    setFilters({
      q: searchParams.get("q") ?? "",
      brandIds: Array.from(new Set(nextBrandIds)),
      categoryIds: Array.from(new Set(nextCategoryIds)),
      processorOptions: Array.from(new Set(nextProcessors)),
      ramOptions: Array.from(new Set(nextRamOptions)),
      storageOptions: Array.from(new Set(nextStorageOptions)),
      minPrice: searchParams.get("minPrice") ?? "",
      maxPrice: searchParams.get("maxPrice") ?? ""
    });
  }, [brands, categories, searchParams]);

  const queryParams = useMemo(
    () => ({
      q: filters.q.trim() || undefined,
      brandIds: filters.brandIds.length ? filters.brandIds.join(",") : undefined,
      categoryIds: filters.categoryIds.length ? filters.categoryIds.join(",") : undefined,
      processorOptions: filters.processorOptions.length ? filters.processorOptions.join(",") : undefined,
      ramOptions: filters.ramOptions.length ? filters.ramOptions.join(",") : undefined,
      storageOptions: filters.storageOptions.length ? filters.storageOptions.join(",") : undefined,
      minPrice: parsePrice(filters.minPrice),
      maxPrice: parsePrice(filters.maxPrice)
    }),
    [filters]
  );

  const productsQuery = useQuery({ queryKey: ["products", queryParams], queryFn: () => catalogApi.getProducts(queryParams) });
  const products = productsQuery.data ?? [];

  const displayProducts = useMemo(() => {
    const cloned = [...products];

    switch (sortBy) {
      case "price-low":
        return cloned.sort((left, right) => left.price - right.price);
      case "price-high":
        return cloned.sort((left, right) => right.price - left.price);
      case "name":
        return cloned.sort((left, right) => left.title.localeCompare(right.title));
      case "best-sellers":
      default:
        return cloned.sort((left, right) => {
          const leftScore = (left.featured ? 1000 : 0) + (left.discountPercent ?? 0);
          const rightScore = (right.featured ? 1000 : 0) + (right.discountPercent ?? 0);
          return rightScore - leftScore;
        });
    }
  }, [products, sortBy]);

  const activeFilterLabels = useMemo(() => {
    const labels: Array<{ key: string; label: string }> = [];

    for (const brandId of filters.brandIds) {
      const brand = brands.find((item) => item.id === brandId);
      if (brand) {
        labels.push({ key: `brand-${brandId}`, label: brand.name });
      }
    }

    for (const categoryId of filters.categoryIds) {
      const category = categories.find((item) => item.id === categoryId);
      if (category) {
        labels.push({ key: `category-${categoryId}`, label: category.name });
      }
    }

    for (const processor of filters.processorOptions) {
      labels.push({ key: `processor-${processor}`, label: processor });
    }

    for (const ram of filters.ramOptions) {
      labels.push({ key: `ram-${ram}`, label: `${ram} GB RAM` });
    }

    for (const storage of filters.storageOptions) {
      labels.push({ key: `storage-${storage}`, label: formatStorage(storage) });
    }

    if (filters.minPrice.trim() || filters.maxPrice.trim()) {
      labels.push({
        key: "price-range",
        label: `Rs. ${parsePrice(filters.minPrice) ?? priceBounds.min} - Rs. ${parsePrice(filters.maxPrice) ?? priceBounds.max}`
      });
    }

    return labels;
  }, [brands, categories, filters, priceBounds]);

  const activeCategory = categories.find((category) => filters.categoryIds.includes(category.id));
  const pageTitle = activeCategory?.name ?? "Laptops";
  const selectedCategoryHasProducts = activeCategory ? (categoryProductCounts[activeCategory.id] ?? 0) > 0 : true;
  const sortOptions: Array<{ value: typeof sortBy; label: string }> = [
    { value: "best-sellers", label: "Best sellers" },
    { value: "price-low", label: "Price low to high" },
    { value: "price-high", label: "Price high to low" },
    { value: "name", label: "Name A-Z" }
  ];
  const activeSortLabel = sortOptions.find((option) => option.value === sortBy)?.label ?? "Best sellers";
  const firstError = brandsQuery.error ?? categoriesQuery.error ?? catalogProductsQuery.error ?? productsQuery.error ?? null;

  if (firstError) {
    return (
      <div className="mx-auto max-w-[1600px] px-6 py-12 lg:px-10">
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-8 py-10 text-rose-700">
          <div className="text-sm font-semibold uppercase tracking-[0.24em]">Products API error</div>
          <h1 className="mt-4 text-3xl font-bold text-rose-900">The product listing API did not respond correctly.</h1>
          <p className="mt-3 text-base">{getApiErrorMessage(firstError, "Check the backend server and API base URL.")}</p>
        </div>
      </div>
    );
  }

  if (brandsQuery.isLoading || categoriesQuery.isLoading || catalogProductsQuery.isLoading || productsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-[1600px] px-6 py-12 lg:px-10">
        <div className="store-dark-panel px-8 py-10 text-white/70">Loading product catalog...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-white/40">
        <span>Home</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span>Products</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[#aadf67]">{pageTitle}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <FilterSidebar
          brands={brands}
          categories={categories}
          categoryProductCounts={categoryProductCounts}
          processors={processorOptions}
          ramOptions={ramOptions}
          storageOptions={storageOptions}
          priceBounds={priceBounds}
          state={filters}
          setState={setFilters}
        />

        <section className="space-y-5">
          <div className="store-dark-panel p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#aadf67]">Category / Product listing</div>
                <h1 className="mt-2 text-3xl font-bold text-white lg:text-4xl">{pageTitle}</h1>
                <p className="mt-2 max-w-3xl text-white/58">
                  Explore live catalog inventory with filters for brand, processor, RAM, storage, and price.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/74">
                  Showing {displayProducts.length} product(s)
                </div>
                <div className="relative min-w-[220px]">
                  <button
                    type="button"
                    onClick={() => setIsSortMenuOpen((current) => !current)}
                    className="store-field flex w-full items-center justify-between"
                  >
                    <span>{activeSortLabel}</span>
                    <ChevronDown className={`h-4 w-4 text-white/50 transition ${isSortMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isSortMenuOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-20 overflow-hidden rounded-xl border border-white/10 bg-[#111612] shadow-[0_24px_50px_rgba(0,0,0,0.35)]">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSortBy(option.value);
                            setIsSortMenuOpen(false);
                          }}
                          className={`block w-full px-4 py-3 text-left text-sm transition ${
                            sortBy === option.value ? "bg-[#89c73a] text-[#101510]" : "text-white/76 hover:bg-white/[0.05]"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                {activeFilterLabels.length ? (
                  <button
                    className="store-secondary-btn px-4 py-3"
                    onClick={() => {
                      setFilters(initialFilters);
                      setSearchParams({});
                    }}
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            </div>

            {activeFilterLabels.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {activeFilterLabels.map((filter) => (
                  <span
                    key={filter.key}
                    className="rounded-full border border-[#89c73a]/25 bg-[#89c73a]/10 px-4 py-2 text-sm font-medium text-[#c6ee82]"
                  >
                    {filter.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {displayProducts.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="store-dark-panel p-10 text-center">
              <h2 className="text-3xl font-semibold text-white">
                {activeCategory && !selectedCategoryHasProducts ? `No products are assigned to ${activeCategory.name} yet.` : "No products match this filter mix yet."}
              </h2>
              <p className="mt-3 text-white/58">
                {activeCategory && !selectedCategoryHasProducts
                  ? `The ${activeCategory.name} category exists, but there are currently no live products mapped to it in the catalog.`
                  : "Try removing one filter or widening the price range to see more results."}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  className="store-primary-btn"
                  onClick={() => {
                    setFilters(initialFilters);
                    setSearchParams({});
                  }}
                >
                  Reset filters
                </button>
                <button
                  className="store-secondary-btn"
                  onClick={() => {
                    setFilters((current) => ({ ...current, categoryIds: [], q: "", minPrice: "", maxPrice: "" }));
                    setSearchParams({});
                  }}
                >
                  Browse all products
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
