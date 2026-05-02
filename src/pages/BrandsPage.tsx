import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronRight, Shapes, ShieldCheck, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { catalogApi } from "api/client";
import { getButtonClassName } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { SectionHeader } from "components/ui/SectionHeader";
import { SkeletonLoader } from "components/ui/SkeletonLoader";
import { getApiErrorMessage } from "../utils/api";
import { getBrandLink } from "../utils/catalog";

const vrTechnologiesLogo = "/logo.jpg";

function LoadingBrandsPage() {
  return (
    <div className="vr-page-shell space-y-6">
      <Card variant="hero">
        <SkeletonLoader className="h-10 w-40" />
        <SkeletonLoader className="mt-4 h-16 w-full" />
        <SkeletonLoader lines={2} className="mt-4 max-w-3xl" />
      </Card>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonLoader key={index} className="h-[240px]" />
        ))}
      </div>
    </div>
  );
}

export function BrandsPage() {
  const brandsQuery = useQuery({ queryKey: ["brands-directory"], queryFn: catalogApi.getBrands });
  const productsQuery = useQuery({ queryKey: ["brands-directory-products"], queryFn: () => catalogApi.getProducts() });

  const brands = brandsQuery.data ?? [];
  const products = productsQuery.data ?? [];

  const rankedBrands = useMemo(
    () =>
      [...brands]
        .map((brand) => {
          const brandProducts = products.filter((product) => product.brandId === brand.id);
          const categories = Array.from(new Set(brandProducts.map((product) => product.categoryName).filter(Boolean))).slice(0, 2) as string[];

          return {
            ...brand,
            productCount: brandProducts.length,
            categories
          };
        })
        .filter((brand) => brand.productCount > 0)
        .sort((left, right) => {
          const countGap = right.productCount - left.productCount;
          if (countGap !== 0) {
            return countGap;
          }
          return left.name.localeCompare(right.name);
        }),
    [brands, products]
  );

  const visibleBrandCount = rankedBrands.length;

  const firstError = brandsQuery.error ?? productsQuery.error ?? null;
  if (firstError) {
    return (
      <div className="vr-page-shell">
        <EmptyState
          eyebrow="Brands API Error"
          title="Brand directory could not be loaded."
          description={getApiErrorMessage(firstError, "Check the brands and products APIs.")}
        />
      </div>
    );
  }

  if (brandsQuery.isLoading || productsQuery.isLoading) {
    return <LoadingBrandsPage />;
  }

  if (!rankedBrands.length) {
    return (
      <div className="vr-page-shell">
        <EmptyState
          eyebrow="Brands"
          title="Brands will appear here soon."
          description="Once brands are available in the catalog, this page will help customers jump into brand-specific products quickly."
          action={
            <Link to="/products" className={getButtonClassName({ variant: "primary", size: "lg" })}>
              View All Products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="vr-page-shell space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="transition hover:text-slate-700">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--vr-primary)]">Brands</span>
      </div>

      <Card variant="hero">
        <SectionHeader
          eyebrow="Brands"
          title="Choose a brand first, then see only that brand's products."
          description="This page keeps brand selection simple. Click any brand below to open a filtered products page showing only items from that brand."
          action={
            <Link to="/products" className={getButtonClassName({ variant: "secondary", size: "md" })}>
              View All Products
            </Link>
          }
        />

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Card variant="subtle">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Total brands</div>
            <div className="mt-3 text-3xl font-extrabold text-[var(--vr-text)]">{rankedBrands.length}</div>
          </Card>
          <Card variant="subtle">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Brands with products</div>
            <div className="mt-3 text-3xl font-extrabold text-[var(--vr-text)]">{visibleBrandCount}</div>
          </Card>
          <Card variant="subtle">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Selection flow</div>
            <div className="mt-3 text-base font-semibold text-[var(--vr-text)]">Brands page to filtered products page</div>
          </Card>
        </div>
      </Card>

      <section className="space-y-5">
        <SectionHeader
          eyebrow="All Brands"
          title="Select a brand"
          description="Each card opens the products page with that brand already selected."
        />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rankedBrands.map((brand) => (
            <Link key={brand.id} to={getBrandLink(brand)} className="group">
              <Card className="h-full">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.1rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)]">
                      {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt={brand.name} className="h-11 w-11 object-contain" />
                      ) : (
                        <img src={vrTechnologiesLogo} alt="VR Technologies logo" className="h-11 w-11 rounded-[0.7rem] object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg font-bold text-[var(--vr-text)]">{brand.name}</div>
                      <div className="mt-1 text-sm text-[var(--vr-muted)]">
                        {brand.productCount ? `${brand.productCount} product${brand.productCount > 1 ? "s" : ""}` : "No active products yet"}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-[var(--vr-primary)] transition group-hover:translate-x-1" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.2rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-3 text-sm text-[var(--vr-muted)]">
                    <div className="inline-flex items-center gap-2 font-semibold text-[var(--vr-text)]">
                      <Tag className="h-4 w-4 text-[var(--vr-primary)]" />
                      Brand filter
                    </div>
                    <div className="mt-2">Open only {brand.name} products.</div>
                  </div>
                  <div className="rounded-[1.2rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-3 text-sm text-[var(--vr-muted)]">
                    <div className="inline-flex items-center gap-2 font-semibold text-[var(--vr-text)]">
                      <Shapes className="h-4 w-4 text-[var(--vr-primary)]" />
                      Categories
                    </div>
                    <div className="mt-2">{brand.categories.length ? brand.categories.join(", ") : "Categories appear after products are added"}</div>
                  </div>
                </div>

                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--vr-primary)]">
                  <ShieldCheck className="h-4 w-4" />
                  Show selected brand products
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
