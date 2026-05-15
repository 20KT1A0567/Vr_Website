import type { Product, ProductCondition } from "types";

export interface CatalogFilterState {
  q: string;
  brandIds: number[];
  categoryIds: number[];
  processorOptions: string[];
  ramOptions: number[];
  storageOptions: number[];
  displayOptions: string[];
  osOptions: string[];
  graphicsOptions: string[];
  featuredOnly: boolean;
  conditions: ProductCondition[];
  inStockOnly: boolean;
  minPrice: string;
  maxPrice: string;
}

export const initialCatalogFilters: CatalogFilterState = {
  q: "",
  brandIds: [],
  categoryIds: [],
  processorOptions: [],
  ramOptions: [],
  storageOptions: [],
  displayOptions: [],
  osOptions: [],
  graphicsOptions: [],
  featuredOnly: false,
  conditions: [],
  inStockOnly: false,
  minPrice: "",
  maxPrice: ""
};

export const conditionOptions: Array<{ value: ProductCondition; label: string }> = [
  { value: "EXCELLENT", label: "Grade A" },
  { value: "GOOD", label: "Grade B" },
  { value: "FAIR", label: "Grade C" }
];

export interface CatalogFilterCounts {
  brandCounts: Record<number, number>;
  categoryCounts: Record<number, number>;
  processorCounts: Record<string, number>;
  ramCounts: Record<number, number>;
  storageCounts: Record<number, number>;
  displayCounts: Record<string, number>;
  osCounts: Record<string, number>;
  graphicsCounts: Record<string, number>;
  conditionCounts: Partial<Record<ProductCondition, number>>;
  inStockCount: number;
  featuredCount: number;
}

export function normalizeCatalogSearchText(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

export function parseCatalogPrice(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function formatStorageOption(storageGb: number) {
  return storageGb >= 1024 ? `${storageGb / 1024} TB` : `${storageGb} GB`;
}

export function isProductInStock(product: Pick<Product, "available" | "stockQuantity">) {
  if (!product.available) {
    return false;
  }
  if (typeof product.stockQuantity !== "number") {
    return true;
  }
  return product.stockQuantity > 0;
}

function matchesQuery(product: Product, normalizedQuery: string) {
  if (!normalizedQuery) {
    return true;
  }

  const searchableFields = [
    product.title,
    product.modelNumber,
    product.processor,
    product.description,
    product.brandName,
    product.categoryName
  ];

  return searchableFields.some((value) => normalizeCatalogSearchText(value).includes(normalizedQuery));
}

export function matchesCatalogFilters(product: Product, filters: CatalogFilterState) {
  const normalizedQuery = normalizeCatalogSearchText(filters.q);
  if (!matchesQuery(product, normalizedQuery)) {
    return false;
  }

  if (filters.brandIds.length && (!product.brandId || !filters.brandIds.includes(product.brandId))) {
    return false;
  }

  if (filters.categoryIds.length && (!product.categoryId || !filters.categoryIds.includes(product.categoryId))) {
    return false;
  }

  if (filters.processorOptions.length) {
    const processorText = normalizeCatalogSearchText(product.processor);
    if (!filters.processorOptions.some((option) => processorText.includes(normalizeCatalogSearchText(option)))) {
      return false;
    }
  }

  if (filters.ramOptions.length && (typeof product.ramGb !== "number" || !filters.ramOptions.includes(product.ramGb))) {
    return false;
  }

  if (filters.storageOptions.length && (typeof product.storageGb !== "number" || !filters.storageOptions.includes(product.storageGb))) {
    return false;
  }

  if (filters.conditions.length && (!product.productCondition || !filters.conditions.includes(product.productCondition))) {
    return false;
  }

  if (filters.inStockOnly && !isProductInStock(product)) {
    return false;
  }

  const minPrice = parseCatalogPrice(filters.minPrice);
  if (typeof minPrice === "number" && product.price < minPrice) {
    return false;
  }

  const maxPrice = parseCatalogPrice(filters.maxPrice);
  if (typeof maxPrice === "number" && product.price > maxPrice) {
    return false;
  }

  if (filters.displayOptions.length) {
    const displaySize = normalizeCatalogSearchText(product.displaySize);
    if (!filters.displayOptions.some((option) => displaySize.includes(normalizeCatalogSearchText(option)))) {
      return false;
    }
  }

  if (filters.osOptions.length) {
    const osText = normalizeCatalogSearchText(product.os);
    if (!filters.osOptions.some((option) => osText.includes(normalizeCatalogSearchText(option)))) {
      return false;
    }
  }

  if (filters.graphicsOptions.length) {
    const graphicsText = normalizeCatalogSearchText(product.graphicsCard);
    if (!filters.graphicsOptions.some((option) => graphicsText.includes(normalizeCatalogSearchText(option)))) {
      return false;
    }
  }

  if (filters.featuredOnly && !product.featured) {
    return false;
  }

  return true;
}

function filtersWithoutSection(filters: CatalogFilterState, section: keyof CatalogFilterCounts | "price") {
  switch (section) {
    case "brandCounts":
      return { ...filters, brandIds: [] };
    case "categoryCounts":
      return { ...filters, categoryIds: [] };
    case "processorCounts":
      return { ...filters, processorOptions: [] };
    case "ramCounts":
      return { ...filters, ramOptions: [] };
    case "storageCounts":
      return { ...filters, storageOptions: [] };
    case "displayCounts":
      return { ...filters, displayOptions: [] };
    case "osCounts":
      return { ...filters, osOptions: [] };
    case "graphicsCounts":
      return { ...filters, graphicsOptions: [] };
    case "conditionCounts":
      return { ...filters, conditions: [] };
    case "inStockCount":
      return { ...filters, inStockOnly: false };
    case "featuredCount":
      return { ...filters, featuredOnly: false };
    case "price":
      return { ...filters, minPrice: "", maxPrice: "" };
    default:
      return filters;
  }
}

export function buildCatalogFilterCounts(products: Product[], filters: CatalogFilterState): CatalogFilterCounts {
  const brandBase = products.filter((product) => matchesCatalogFilters(product, filtersWithoutSection(filters, "brandCounts")));
  const categoryBase = products.filter((product) => matchesCatalogFilters(product, filtersWithoutSection(filters, "categoryCounts")));
  const processorBase = products.filter((product) => matchesCatalogFilters(product, filtersWithoutSection(filters, "processorCounts")));
  const ramBase = products.filter((product) => matchesCatalogFilters(product, filtersWithoutSection(filters, "ramCounts")));
  const storageBase = products.filter((product) => matchesCatalogFilters(product, filtersWithoutSection(filters, "storageCounts")));
  const displayBase = products.filter((product) => matchesCatalogFilters(product, filtersWithoutSection(filters, "displayCounts")));
  const osBase = products.filter((product) => matchesCatalogFilters(product, filtersWithoutSection(filters, "osCounts")));
  const graphicsBase = products.filter((product) => matchesCatalogFilters(product, filtersWithoutSection(filters, "graphicsCounts")));
  const conditionBase = products.filter((product) => matchesCatalogFilters(product, filtersWithoutSection(filters, "conditionCounts")));
  const stockBase = products.filter((product) => matchesCatalogFilters(product, filtersWithoutSection(filters, "inStockCount")));
  const featuredBase = products.filter((product) => matchesCatalogFilters(product, filtersWithoutSection(filters, "featuredCount")));

  const brandCounts = brandBase.reduce<Record<number, number>>((counts, product) => {
    if (product.brandId) {
      counts[product.brandId] = (counts[product.brandId] ?? 0) + 1;
    }
    return counts;
  }, {});

  const categoryCounts = categoryBase.reduce<Record<number, number>>((counts, product) => {
    if (product.categoryId) {
      counts[product.categoryId] = (counts[product.categoryId] ?? 0) + 1;
    }
    return counts;
  }, {});

  const processorCounts = processorBase.reduce<Record<string, number>>((counts, product) => {
    if (product.processor?.trim()) {
      counts[product.processor] = (counts[product.processor] ?? 0) + 1;
    }
    return counts;
  }, {});

  const ramCounts = ramBase.reduce<Record<number, number>>((counts, product) => {
    if (typeof product.ramGb === "number") {
      counts[product.ramGb] = (counts[product.ramGb] ?? 0) + 1;
    }
    return counts;
  }, {});

  const storageCounts = storageBase.reduce<Record<number, number>>((counts, product) => {
    if (typeof product.storageGb === "number") {
      counts[product.storageGb] = (counts[product.storageGb] ?? 0) + 1;
    }
    return counts;
  }, {});

  const displayCounts = displayBase.reduce<Record<string, number>>((counts, product) => {
    if (product.displaySize?.trim()) {
      counts[product.displaySize] = (counts[product.displaySize] ?? 0) + 1;
    }
    return counts;
  }, {});

  const osCounts = osBase.reduce<Record<string, number>>((counts, product) => {
    if (product.os?.trim()) {
      counts[product.os] = (counts[product.os] ?? 0) + 1;
    }
    return counts;
  }, {});

  const graphicsCounts = graphicsBase.reduce<Record<string, number>>((counts, product) => {
    if (product.graphicsCard?.trim()) {
      counts[product.graphicsCard] = (counts[product.graphicsCard] ?? 0) + 1;
    }
    return counts;
  }, {});

  const conditionCounts = conditionBase.reduce<Partial<Record<ProductCondition, number>>>((counts, product) => {
    if (product.productCondition) {
      counts[product.productCondition] = (counts[product.productCondition] ?? 0) + 1;
    }
    return counts;
  }, {});

  const inStockCount = stockBase.filter((product) => isProductInStock(product)).length;
  const featuredCount = featuredBase.filter((product) => product.featured).length;

  return {
    brandCounts,
    categoryCounts,
    processorCounts,
    ramCounts,
    storageCounts,
    displayCounts,
    osCounts,
    graphicsCounts,
    conditionCounts,
    inStockCount,
    featuredCount
  };
}
