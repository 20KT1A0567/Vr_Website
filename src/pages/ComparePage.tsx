import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart2, GitCompare, Plus, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { catalogApi } from "api/client";
import { Card } from "components/ui/Card";
import { useCompareStore } from "store/compareStore";
import { formatCurrency, getProductPrimaryImage } from "../utils/catalog";

type ProductFieldKey = keyof import("types").Product;

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const SPEC_ROWS: Array<{ label: string; key: ProductFieldKey; group?: string }> = [
  { label: "Brand", key: "brandName", group: "Overview" },
  { label: "Category", key: "categoryName", group: "Overview" },
  { label: "Condition", key: "productCondition", group: "Overview" },
  { label: "Selling Price", key: "price", group: "Pricing" },
  { label: "Original Price", key: "originalPrice", group: "Pricing" },
  { label: "Discount", key: "discountPercent", group: "Pricing" },
  { label: "Processor", key: "processor", group: "Performance" },
  { label: "Generation", key: "processorGeneration", group: "Performance" },
  { label: "RAM", key: "ramGb", group: "Performance" },
  { label: "Storage", key: "storageGb", group: "Performance" },
  { label: "Storage Type", key: "storageType", group: "Performance" },
  { label: "Graphics", key: "graphicsCard", group: "Performance" },
  { label: "Display", key: "displaySize", group: "Display" },
  { label: "Display Type", key: "displayType", group: "Display" },
  { label: "OS", key: "os", group: "Software" },
  { label: "Battery", key: "battery", group: "Build" },
  { label: "Weight", key: "weight", group: "Build" },
  { label: "Warranty", key: "warrantyMonths", group: "Support" },
  { label: "Warranty Summary", key: "warrantySummary", group: "Support" },
  { label: "Return Days", key: "returnDays", group: "Support" },
  { label: "Stock", key: "stockQuantity", group: "Availability" },
  { label: "In Stock", key: "available", group: "Availability" },
  { label: "Featured", key: "featured", group: "Availability" },
  { label: "Best Seller", key: "bestSeller", group: "Availability" },
  { label: "SKU", key: "sku", group: "Details" },
  { label: "Model Number", key: "modelNumber", group: "Details" },
];

function parseCompareFields(value?: string): ProductFieldKey[] {
  if (!value) return [];
  return value.split(",").map((e) => e.trim()).filter(Boolean) as ProductFieldKey[];
}

function isMissingValue(value: unknown) {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value === "number" && value === 0) return true;
  return false;
}

function formatValue(value: unknown, key?: ProductFieldKey): string {
  if ((key === "price" || key === "originalPrice") && typeof value === "number" && value > 0)
    return formatCurrency(value);
  if (key === "discountPercent" && typeof value === "number" && value > 0) return `${value}% off`;
  if (key === "stockQuantity" && typeof value === "number") return `${value} unit${value === 1 ? "" : "s"}`;
  if (key === "returnDays" && typeof value === "number" && value > 0) return `${value} day${value === 1 ? "" : "s"}`;
  if (key === "warrantyMonths" && typeof value === "number" && value > 0) return `${value} month${value === 1 ? "" : "s"}`;
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number" && value === 0) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useCompareStore();
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: catalogApi.getCategories });

  const anchor = compareList[0];
  const anchorCategory = useMemo(() => {
    if (!anchor || !categoriesQuery.data) return undefined;
    return categoriesQuery.data.find((cat) =>
      anchor.categoryId != null ? cat.id === anchor.categoryId : cat.name.toLowerCase() === anchor.categoryName?.toLowerCase()
    );
  }, [anchor, categoriesQuery.data]);

  const visibleRows = useMemo(() => {
    if (!compareList.length) return [];
    const allowed = parseCompareFields(anchorCategory?.compareFields);
    if (allowed.length) {
      const allowedSet = new Set<ProductFieldKey>(allowed);
      return SPEC_ROWS.filter((row) => allowedSet.has(row.key));
    }
    return SPEC_ROWS.filter((row) => compareList.some((p) => !isMissingValue(p[row.key])));
  }, [anchorCategory?.compareFields, compareList]);

  /* Group rows by section */
  const groupedRows = useMemo(() => {
    const map = new Map<string, typeof visibleRows>();
    for (const row of visibleRows) {
      const g = row.group ?? "Other";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(row);
    }
    return Array.from(map.entries());
  }, [visibleRows]);

  /* ── Empty state ── */
  if (!compareList.length) {
    return (
      <div className="vr-page-shell-tight">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <Card className="p-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(30,58,138,0.08)]">
              <GitCompare className="h-8 w-8 text-[var(--vr-primary)]" />
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--vr-primary)]">Compare Products</div>
            <h1 className="mt-3 text-2xl font-bold text-[var(--vr-text)]">No products selected yet.</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--vr-muted)]">
              Browse the catalog and click <strong>Compare</strong> on any product card to add up to 3 here.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--vr-primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(30,58,138,0.22)] transition hover:bg-[var(--vr-primary-strong)]"
            >
              <Plus className="h-4 w-4" />
              Browse Products
            </Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  const MAX_SLOTS = 3;
  const emptySlots = MAX_SLOTS - compareList.length;

  return (
    <div className="vr-page-shell space-y-6">
      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: EASE }}
      >
        <Card variant="hero" className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(30,58,138,0.1)]">
                  <BarChart2 className="h-4 w-4 text-[var(--vr-primary)]" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--vr-primary)]">
                  {anchorCategory?.name ?? "Product"} Compare
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold text-[var(--vr-text)]">Side-by-side comparison</h1>
              <p className="mt-1 text-sm text-[var(--vr-muted)]">
                {compareList.length} product{compareList.length > 1 ? "s" : ""} · {visibleRows.length} spec{visibleRows.length !== 1 ? "s" : ""}
                {anchorCategory ? ` for ${anchorCategory.name}` : ""}
              </p>
            </div>
            {compareList.length > 1 && (
              <button
                type="button"
                onClick={clearCompare}
                className="flex items-center gap-1.5 rounded-2xl border border-[rgba(220,38,38,0.16)] px-4 py-2 text-sm font-semibold text-[var(--vr-danger)] transition hover:bg-[rgba(220,38,38,0.06)]"
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </button>
            )}
          </div>
        </Card>
      </motion.div>

      {/* ── Product header cards ── */}
      <div className={`grid gap-4 ${compareList.length === 1 ? "grid-cols-[200px]" : compareList.length === 2 ? "grid-cols-2 md:grid-cols-[1fr_1fr]" : "grid-cols-3 md:grid-cols-[1fr_1fr_1fr]"} ${emptySlots > 0 ? (compareList.length === 1 ? "sm:grid-cols-[200px_160px]" : compareList.length === 2 ? "sm:grid-cols-[1fr_1fr_160px]" : "") : ""}`}>
        {compareList.map((product, i) => {
          const img = getProductPrimaryImage(product);
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.08, duration: 0.36, ease: EASE }}
            >
              <Card className="relative flex flex-col items-center gap-3 p-4 text-center">
                <button
                  type="button"
                  aria-label="Remove"
                  onClick={() => removeFromCompare(product.id)}
                  className="absolute right-2.5 top-2.5 rounded-full p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-[1rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)]">
                  {img ? (
                    <img src={img} alt={product.title} loading="lazy" className="h-full w-full object-contain p-2" />
                  ) : (
                    <div className="text-xs text-slate-300">No image</div>
                  )}
                </div>
                <div className="w-full min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--vr-primary)]">
                    {product.brandName}
                  </div>
                  <div className="mt-1 line-clamp-2 text-[13px] font-bold leading-snug text-[var(--vr-text)]">
                    {product.title}
                  </div>
                  <div className="mt-2 text-lg font-extrabold text-[var(--vr-text)]">
                    {formatCurrency(product.price)}
                  </div>
                </div>
                <Link
                  to={`/products/${product.id}`}
                  className="w-full rounded-[0.9rem] bg-[var(--vr-primary)] py-2 text-[12px] font-bold text-white transition hover:bg-[var(--vr-primary-strong)]"
                >
                  View product
                </Link>
              </Card>
            </motion.div>
          );
        })}

        {/* Empty slots */}
        {emptySlots > 0 &&
          Array.from({ length: emptySlots }).map((_, i) => (
            <motion.div
              key={`empty-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: (compareList.length + i) * 0.08 }}
            >
              <Card className="flex flex-col items-center justify-center gap-3 border-dashed py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-[var(--vr-border)]">
                  <Plus className="h-5 w-5 text-[var(--vr-muted)]" />
                </div>
                <div className="text-[12px] font-semibold text-[var(--vr-muted)]">Add product</div>
                <Link
                  to="/products"
                  className="rounded-[0.9rem] border border-[var(--vr-border)] px-4 py-1.5 text-[11px] font-semibold text-[var(--vr-primary)] transition hover:border-[var(--vr-primary)] hover:bg-[var(--vr-surface-soft)]"
                >
                  Browse
                </Link>
              </Card>
            </motion.div>
          ))}
      </div>

      {/* ── Spec table by group ── */}
      {compareList.length >= 2 && groupedRows.length > 0 && (
        <div className="space-y-4">
          {groupedRows.map(([groupName, rows], groupIndex) => (
            <motion.div
              key={groupName}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + groupIndex * 0.06, duration: 0.32, ease: EASE }}
            >
              <Card className="overflow-hidden p-0">
                {/* Group header */}
                <div className="border-b border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-5 py-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--vr-primary)]">
                    {groupName}
                  </span>
                </div>

                <div className="divide-y divide-[var(--vr-border)]">
                  {rows.map((row, rowIndex) => {
                    const values = compareList.map((p) => {
                      const raw = p[row.key];
                      if (row.key === "ramGb" && typeof raw === "number") return `${raw} GB`;
                      if (row.key === "storageGb" && typeof raw === "number")
                        return raw >= 1024 ? `${raw / 1024} TB` : `${raw} GB`;
                      return formatValue(raw, row.key);
                    });
                    const allSame = values.every((v) => v === values[0]);
                    const allMissing = values.every((v) => v === "—");

                    if (allMissing) return null;

                    return (
                      <motion.div
                        key={row.key}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: groupIndex * 0.04 + rowIndex * 0.025 }}
                        className="grid items-center"
                        style={{ gridTemplateColumns: `180px repeat(${compareList.length}, 1fr)` }}
                      >
                        {/* Label */}
                        <div className="px-5 py-3 text-[12px] font-semibold text-[var(--vr-muted)]">
                          {row.label}
                        </div>
                        {/* Values */}
                        {compareList.map((product, colIndex) => {
                          const val = values[colIndex];
                          const isDifferent = !allSame && val !== "—";
                          const isBest =
                            isDifferent &&
                            (row.key === "price"
                              ? val === values.reduce((min, v) => (v !== "—" && parseFloat(v.replace(/[^\d.]/g, "")) < parseFloat(min.replace(/[^\d.]/g, "")) ? v : min), values.find((v) => v !== "—") ?? "—")
                              : row.key === "warrantyMonths" || row.key === "returnDays" || row.key === "ramGb" || row.key === "storageGb"
                              ? val === values.reduce((max, v) => (v !== "—" && parseFloat(v) > parseFloat(max) ? v : max), values.find((v) => v !== "—") ?? "—")
                              : false);

                          return (
                            <div
                              key={product.id}
                              className={`px-4 py-3 text-[13px] transition ${
                                isBest
                                  ? "bg-[rgba(22,163,74,0.06)] font-bold text-[var(--vr-success)]"
                                  : isDifferent
                                  ? "bg-[rgba(30,58,138,0.04)] font-semibold text-[var(--vr-text)]"
                                  : "text-[var(--vr-text)]"
                              } ${colIndex < compareList.length - 1 ? "border-r border-[var(--vr-border)]" : ""}`}
                            >
                              {val}
                            </div>
                          );
                        })}
                      </motion.div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Single-product hint */}
      {compareList.length === 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 text-center">
            <p className="text-sm text-[var(--vr-muted)]">
              Add at least one more product to see the side-by-side comparison.
            </p>
            <Link
              to="/products"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[var(--vr-primary)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Browse more products
            </Link>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
