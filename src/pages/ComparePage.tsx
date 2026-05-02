import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "components/ui/Card";
import { Button } from "components/ui/Button";
import { SectionHeader } from "components/ui/SectionHeader";
import { useCompareStore } from "store/compareStore";
import { formatCurrency, getProductPrimaryImage } from "../utils/catalog";

const SPEC_ROWS: Array<{ label: string; key: keyof import("types").Product }> = [
  { label: "Brand", key: "brandName" },
  { label: "Category", key: "categoryName" },
  { label: "Processor", key: "processor" },
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
  { label: "Warranty (months)", key: "warrantyMonths" }
];

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number" && value === 0) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useCompareStore();

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
          eyebrow="Compare"
          title="Side-by-side spec comparison"
          description={`Comparing ${compareList.length} product${compareList.length > 1 ? "s" : ""}. Add up to 3 products from any product page.`}
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
        <table className="w-full min-w-[640px] border-separate border-spacing-3">
          <thead>
            <tr>
              <th className="w-[180px] rounded-[1.2rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">
                Specification
              </th>
              {compareList.map((product) => (
                <th key={product.id} className="rounded-[1.2rem] border border-[var(--vr-border)] bg-white px-4 py-3 text-left align-top">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {getProductPrimaryImage(product) ? (
                        <img src={getProductPrimaryImage(product)} alt={product.title} className="mb-3 h-24 w-full object-contain" />
                      ) : null}
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--vr-primary)]">{product.brandName}</div>
                      <div className="mt-1 text-sm font-bold leading-tight text-[var(--vr-text)]">{product.title}</div>
                      <div className="mt-2 text-lg font-extrabold text-[var(--vr-text)]">{formatCurrency(product.price)}</div>
                      <Link
                        to={`/products/${product.id}`}
                        className="mt-3 inline-flex rounded-xl bg-[var(--vr-primary)] px-3 py-2 text-xs font-semibold text-white"
                      >
                        View Product
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCompare(product.id)}
                      className="shrink-0 rounded-full border border-[var(--vr-border)] p-1.5 text-[var(--vr-muted)] hover:bg-rose-50 hover:text-[var(--vr-danger)]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
              ))}
              {compareList.length < 3 ? (
                <th className="rounded-[1.2rem] border border-dashed border-[var(--vr-border)] px-4 py-3 text-center align-middle">
                  <Link to="/products" className="text-sm font-semibold text-[var(--vr-primary)] hover:underline">
                    + Add product
                  </Link>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {SPEC_ROWS.map((row, rowIndex) => {
              const values = compareList.map((p) => {
                const raw = p[row.key];
                return row.key === "ramGb" && typeof raw === "number" ? `${raw} GB` :
                  row.key === "storageGb" && typeof raw === "number" ? (raw >= 1024 ? `${raw / 1024} TB` : `${raw} GB`) :
                  formatValue(raw);
              });
              const allSame = values.every((v) => v === values[0]);
              return (
                <tr key={row.key} className={rowIndex % 2 === 0 ? "" : ""}>
                  <td className="rounded-[1.2rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--vr-text)]">
                    {row.label}
                  </td>
                  {compareList.map((product, colIndex) => (
                    <td
                      key={product.id}
                      className={`rounded-[1.2rem] border px-4 py-3 text-sm text-[var(--vr-text)] ${
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
