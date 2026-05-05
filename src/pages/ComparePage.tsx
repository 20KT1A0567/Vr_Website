import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { catalogApi } from "api/client";
import { Card } from "components/ui/Card";
import { Button } from "components/ui/Button";
import { SectionHeader } from "components/ui/SectionHeader";
import { useCompareStore } from "store/compareStore";
import { formatCurrency, getProductPrimaryImage } from "../utils/catalog";

type ProductFieldKey = keyof import("types").Product;

const SPEC_ROWS: Array<{ label: string; key: ProductFieldKey }> = [
  { label: "Brand", key: "brandName" },
  { label: "Category", key: "categoryName" },
  { label: "Selling Price", key: "price" },
  { label: "Original Price", key: "originalPrice" },
  { label: "Discount", key: "discountPercent" },
  { label: "Stock Quantity", key: "stockQuantity" },
  { label: "Availability", key: "available" },
  { label: "Featured", key: "featured" },
  { label: "Best Seller", key: "bestSeller" },
  { label: "Today Deal", key: "todayDeal" },
  { label: "Processor", key: "processor" },
  { label: "Processor Generation", key: "processorGeneration" },
  { label: "RAM", key: "ramGb" },
  { label: "Storage", key: "storageGb" },
  { label: "Storage Type", key: "storageType" },
  { label: "Display", key: "displaySize" },
  { label: "Display Type", key: "displayType" },
  { label: "OS", key: "os" },
  { label: "Graphics", key: "graphicsCard" },
  { label: "Battery", key: "battery" },
  { label: "Weight", key: "weight" },
  { label: "Condition", key: "productCondition" },
  { label: "Warranty (months)", key: "warrantyMonths" },
  { label: "Warranty Summary", key: "warrantySummary" },
  { label: "Return Days", key: "returnDays" },
  { label: "SKU", key: "sku" },
  { label: "Model Number", key: "modelNumber" }
];

function parseCompareFields(value?: string): ProductFieldKey[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean) as ProductFieldKey[];
}

function isMissingValue(value: unknown) {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value === "number" && value === 0) return true;
  return false;
}

function formatValue(value: unknown, key?: ProductFieldKey): string {
  if ((key === "price" || key === "originalPrice") && typeof value === "number" && value > 0) return formatCurrency(value);
  if (key === "discountPercent" && typeof value === "number" && value > 0) return `${value}% off`;
  if (key === "stockQuantity" && typeof value === "number") return `${value} unit${value === 1 ? "" : "s"}`;
  if (key === "returnDays" && typeof value === "number" && value > 0) return `${value} day${value === 1 ? "" : "s"}`;
  if (key === "warrantyMonths" && typeof value === "number" && value > 0) return `${value} month${value === 1 ? "" : "s"}`;
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number" && value === 0) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function pluralizeCategoryName(name: string, count: number) {
  if (count === 1) return name.toLowerCase();
  const normalized = name.toLowerCase();
  if (normalized.endsWith("s")) return normalized;
  return `${normalized}s`;
}

export function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useCompareStore();
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: catalogApi.getCategories });

  const anchor = compareList[0];
  const anchorCategory = useMemo(() => {
    if (!anchor || !categoriesQuery.data) return undefined;
    return categoriesQuery.data.find((category) => {
      if (anchor.categoryId != null) return category.id === anchor.categoryId;
      if (anchor.categoryName) return category.name.toLowerCase() === anchor.categoryName.toLowerCase();
      return false;
    });
  }, [anchor, categoriesQuery.data]);

  const visibleRows = useMemo(() => {
    if (!compareList.length) return [];
    const allowedKeys = parseCompareFields(anchorCategory?.compareFields);
    if (allowedKeys.length) {
      const allowed = new Set<ProductFieldKey>(allowedKeys);
      return SPEC_ROWS.filter((row) => allowed.has(row.key));
    }
    return SPEC_ROWS.filter((row) => compareList.some((product) => !isMissingValue(product[row.key])));
  }, [anchorCategory?.compareFields, compareList]);

  if (!compareList.length) {
    return (
      <div className="vr-page-shell-tight">
        <Card className="p-10 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--vr-primary)]">Compare Products</div>
          <h1 className="mt-4 text-3xl font-bold text-[var(--vr-text)]">No products selected for comparison.</h1>
          <p className="mt-3 text-sm text-[var(--vr-muted)]">Browse products and click the compare button to add up to 3 products here.</p>
          <Link to="/products" className="mt-6 inline-flex rounded-2xl bg-[var(--vr-primary)] px-5 py-3 text-sm font-semibold text-white">
            Browse Products
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="vr-page-shell space-y-6">
      <Card variant="hero">
        <SectionHeader
          eyebrow={anchorCategory ? `${anchorCategory.name} compare` : "Compare"}
          title="Side-by-side spec comparison"
          description={`Comparing ${compareList.length} ${anchorCategory ? pluralizeCategoryName(anchorCategory.name, compareList.length) : pluralizeCategoryName("product", compareList.length)}. Showing ${visibleRows.length} relevant spec${visibleRows.length === 1 ? "" : "s"} for this category.`}
          action={
            compareList.length > 1 ? (
              <Button variant="danger" size="sm" onClick={clearCompare}>
                Clear All
              </Button>
            ) : undefined
          }
        />
      </Card>

      <div className="overflow-x-auto">
        <table className="w-full max-w-[820px] mx-auto border-separate border-spacing-2 text-sm">
          <colgroup>
            <col className="w-[120px]" />
            {compareList.map((product) => (
              <col key={product.id} className="w-[170px]" />
            ))}
            {compareList.length < 3 ? <col className="w-[140px]" /> : null}
          </colgroup>
          <thead>
            <tr>
              <th className="rounded-[1rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--vr-primary)]">
                Specification
              </th>
              {compareList.map((product) => (
                <th key={product.id} className="rounded-[1rem] border border-[var(--vr-border)] bg-white px-3 py-2.5 text-left align-top">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {getProductPrimaryImage(product) ? (
                        <img src={getProductPrimaryImage(product)} alt={product.title} loading="lazy" decoding="async" className="mb-2 h-20 w-full object-contain" />
                      ) : null}
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--vr-primary)]">{product.brandName}</div>
                      <div className="mt-1 line-clamp-2 text-[12px] font-bold leading-tight text-[var(--vr-text)]">{product.title}</div>
                      <div className="mt-1.5 text-[15px] font-extrabold text-[var(--vr-text)]">{formatCurrency(product.price)}</div>
                      <Link
                        to={`/products/${product.id}`}
                        className="mt-2 inline-flex rounded-lg bg-[var(--vr-primary)] px-2.5 py-1.5 text-[11px] font-semibold text-white"
                      >
                        View
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCompare(product.id)}
                      className="shrink-0 rounded-full border border-[var(--vr-border)] p-1 text-[var(--vr-muted)] hover:bg-rose-50 hover:text-[var(--vr-danger)]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </th>
              ))}
              {compareList.length < 3 ? (
                <th className="rounded-[1rem] border border-dashed border-[var(--vr-border)] px-3 py-2.5 text-center align-middle">
                  <Link to="/products" className="text-xs font-semibold text-[var(--vr-primary)] hover:underline">
                    + Add product
                  </Link>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => {
              const values = compareList.map((p) => {
                const raw = p[row.key];
                return row.key === "ramGb" && typeof raw === "number" ? `${raw} GB` :
                  row.key === "storageGb" && typeof raw === "number" ? (raw >= 1024 ? `${raw / 1024} TB` : `${raw} GB`) :
                  formatValue(raw, row.key);
              });
              const allSame = values.every((v) => v === values[0]);
              return (
                <tr key={row.key} className={rowIndex % 2 === 0 ? "" : ""}>
                  <td className="rounded-[1rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-3 py-2 text-[12px] font-semibold text-[var(--vr-text)]">
                    {row.label}
                  </td>
                  {compareList.map((product, colIndex) => (
                    <td
                      key={product.id}
                      className={`rounded-[1rem] border px-3 py-2 text-[12px] text-[var(--vr-text)] break-words ${
                        !allSame && values[colIndex] !== "—"
                          ? "border-[rgba(30,58,138,0.14)] bg-[rgba(30,58,138,0.04)] font-semibold"
                          : "border-[var(--vr-border)] bg-white"
                      }`}
                    >
                      {values[colIndex]}
                    </td>
                  ))}
                  {compareList.length < 3 ? <td className="border-0" /> : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
