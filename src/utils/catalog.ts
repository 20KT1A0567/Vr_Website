import type { Brand, Category, Product, ProductCondition } from "types";

const weakCatalogTokens = new Set(["hi", "hii", "hello", "test", "testing", "asd", "qwe", "demo", "sample", "banner"]);
const placeholderPattern = /^(banner|slide|hero|image|img|photo|sample|test)[\s_-]*\d*$/i;

export function normalizeCatalogValue(value?: string) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

export function isMeaningfulCatalogValue(value?: string) {
  const normalized = normalizeCatalogValue(value);
  if (!normalized) {
    return false;
  }

  const lowered = normalized.toLowerCase();
  if (weakCatalogTokens.has(lowered) || placeholderPattern.test(lowered) || ["none", "null", "n/a", "na"].includes(lowered)) {
    return false;
  }

  const lettersOnly = lowered.replace(/[^a-z]/g, "");
  return lettersOnly.length >= 4;
}

export function getCategoryQueryValue(category?: Pick<Category, "name" | "slug">) {
  if (!category) {
    return "";
  }

  const fallback = normalizeCatalogValue(category.name).toLowerCase();
  if (isMeaningfulCatalogValue(category.slug)) {
    return normalizeCatalogValue(category.slug).toLowerCase();
  }

  return fallback;
}

export function getBrandQueryValue(brandName?: string) {
  return normalizeCatalogValue(brandName).toLowerCase();
}

function buildCatalogLink(currentSearch: string, key: string, value: string, keysToClear: string[]) {
  const params = new URLSearchParams(currentSearch);
  for (const keyToClear of keysToClear) {
    params.delete(keyToClear);
  }
  if (value) {
    params.set(key, value);
  }

  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

export function getCategoryLink(category?: Pick<Category, "id" | "name" | "slug">, currentSearch = "") {
  if (typeof category?.id === "number") {
    return buildCatalogLink(currentSearch, "categoryId", String(category.id), ["category", "categoryId", "categoryIds"]);
  }

  const queryValue = getCategoryQueryValue(category);
  return queryValue ? buildCatalogLink(currentSearch, "category", queryValue, ["category", "categoryId", "categoryIds"]) : "/products";
}

export function getBrandLink(brand?: string | Pick<Brand, "id" | "name">, currentSearch = "") {
  if (typeof brand === "object" && brand && typeof brand.id === "number") {
    return buildCatalogLink(currentSearch, "brandId", String(brand.id), ["brand", "brandId", "brandIds"]);
  }

  const queryValue = getBrandQueryValue(typeof brand === "string" ? brand : brand?.name);
  return queryValue ? buildCatalogLink(currentSearch, "brand", queryValue, ["brand", "brandId", "brandIds"]) : "/products";
}

export function formatCurrency(value: number) {
  return `Rs. ${Number(value).toLocaleString("en-IN")}`;
}

export function getProductPrimaryImage(product: Pick<Product, "images">) {
  return product.images.find((image) => image.primaryImage)?.imageUrl ?? product.images[0]?.imageUrl;
}

export function isProductTodayDealActive(product: Pick<Product, "todayDeal" | "dealStartDate" | "dealEndDate">) {
  if (!product.todayDeal) {
    return false;
  }

  const now = Date.now();
  const start = product.dealStartDate ? Date.parse(product.dealStartDate) : null;
  const end = product.dealEndDate ? Date.parse(product.dealEndDate) : null;

  if (start !== null && !Number.isNaN(start) && now < start) {
    return false;
  }

  if (end !== null && !Number.isNaN(end) && now > end) {
    return false;
  }

  return true;
}

export function getProductOriginalPrice(product: Pick<Product, "originalPrice" | "price">) {
  if (product.originalPrice && product.originalPrice > product.price) {
    return product.originalPrice;
  }
  return product.price;
}

export function getProductSavings(product: Pick<Product, "price" | "originalPrice">) {
  return Math.max(0, getProductOriginalPrice(product) - product.price);
}

export function isLowStock(product: Pick<Product, "stockQuantity" | "lowStockThreshold" | "available">) {
  if (!product.available) {
    return false;
  }
  if (typeof product.stockQuantity !== "number") {
    return false;
  }
  return product.stockQuantity <= (product.lowStockThreshold ?? 5);
}

export function getProductStockLabel(product: Pick<Product, "available" | "stockQuantity" | "lowStockThreshold">) {
  if (!product.available) {
    return "Check availability";
  }
  if (typeof product.stockQuantity === "number" && product.stockQuantity <= 0) {
    return "Out of stock";
  }
  if (typeof product.stockQuantity === "number" && isLowStock({ ...product, available: true })) {
    return `Only ${product.stockQuantity} left`;
  }
  return "Ready to ship";
}

export function getProductWarrantyLabel(product: Pick<Product, "warrantyMonths" | "warrantySummary">) {
  if (product.warrantyMonths) {
    return `${product.warrantyMonths} month warranty`;
  }
  if (product.warrantySummary) {
    return product.warrantySummary;
  }
  return "Quality checked";
}

export function getPseudoReviewCount(product: Pick<Product, "stores" | "bestSeller" | "featured" | "id">) {
  return Math.max(12, product.stores.length * 7 + (product.bestSeller ? 18 : 0) + (product.featured ? 10 : 0) + (product.id % 9));
}

export function getPseudoViewerCount(product: Pick<Product, "stores" | "id">) {
  return Math.max(4, product.stores.length * 3 + (product.id % 6));
}

export function formatConditionLabel(condition?: ProductCondition) {
  switch (condition) {
    case "EXCELLENT":
      return "Grade A";
    case "GOOD":
      return "Grade B";
    case "FAIR":
      return "Grade C";
    default:
      return "Condition";
  }
}

export function getProductDerivedRating(product: Pick<Product, "stores" | "featured" | "bestSeller" | "id">) {
  const ratings = product.stores.map((store) => store.googleRating).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (ratings.length) {
    const average = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
    return Number(average.toFixed(1));
  }

  const baseline = 4.1 + (product.bestSeller ? 0.35 : 0) + (product.featured ? 0.2 : 0) + ((product.id % 4) * 0.1);
  return Number(Math.min(4.9, baseline).toFixed(1));
}

export function getProductMerchandisingScore(
  product: Pick<Product, "bestSeller" | "featured" | "todayDeal" | "dealStartDate" | "dealEndDate" | "discountPercent">
) {
  return (product.bestSeller ? 2000 : 0)
    + (product.featured ? 1000 : 0)
    + (isProductTodayDealActive(product) ? 200 : 0)
    + (product.discountPercent ?? 0);
}
