import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, MapPin, PhoneCall, ShieldCheck, Truck, Undo2 } from "lucide-react";
import { Link } from "react-router-dom";
import { catalogApi } from "api/client";
import { ProductCard } from "components/catalog/ProductCard";
import { getApiErrorMessage } from "../utils/api";

const storeHighlights = [
  { title: "6 Month Warranty", subtitle: "On all eligible products", icon: ShieldCheck },
  { title: "Quality Checked", subtitle: "Multi-point inspection process", icon: CheckCircle2 },
  { title: "7 Days Easy Returns", subtitle: "No hidden return stress", icon: Undo2 },
  { title: "Fast and Safe Delivery", subtitle: "Across Hyderabad and beyond", icon: Truck }
] as const;

const bannerPlaceholderTerms = new Set(["hi", "hii", "hello", "test", "testing", "asd", "qwe", "demo", "sample", "banner"]);

function resolveBannerLink(linkUrl?: string) {
  if (!linkUrl?.trim()) {
    return "/products";
  }

  return linkUrl.trim();
}

function getCategoryLink(slug?: string) {
  return slug ? `/products?category=${encodeURIComponent(slug)}` : "/products";
}

function normalizeBannerCopy(value?: string) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function isMeaningfulBannerCopy(value?: string) {
  const normalized = normalizeBannerCopy(value);
  if (!normalized) {
    return false;
  }

  const lowered = normalized.toLowerCase();
  if (bannerPlaceholderTerms.has(lowered)) {
    return false;
  }

  const alphaCharacters = lowered.replace(/[^a-z]/g, "").length;
  if (alphaCharacters < 4) {
    return false;
  }

  const words = lowered.split(/\s+/).filter(Boolean);
  if (words.length === 1 && lowered.length < 8) {
    return false;
  }

  return lowered.length >= 6;
}

export function HomePage() {
  const bannersQuery = useQuery({ queryKey: ["banners"], queryFn: catalogApi.getBanners });
  const featuredProductsQuery = useQuery({ queryKey: ["featured-products"], queryFn: catalogApi.getFeaturedProducts });
  const allProductsQuery = useQuery({ queryKey: ["home-products"], queryFn: () => catalogApi.getProducts() });
  const categoriesQuery = useQuery({ queryKey: ["home-categories"], queryFn: catalogApi.getCategories });
  const storesQuery = useQuery({ queryKey: ["home-stores"], queryFn: catalogApi.getStores });

  const banners = bannersQuery.data ?? [];
  const featuredProducts = featuredProductsQuery.data ?? [];
  const allProducts = allProductsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const stores = storesQuery.data ?? [];

  const firstError =
    bannersQuery.error ?? featuredProductsQuery.error ?? allProductsQuery.error ?? categoriesQuery.error ?? storesQuery.error ?? null;

  const heroBanner = banners[0];
  const heroTitle = isMeaningfulBannerCopy(heroBanner?.title) ? normalizeBannerCopy(heroBanner?.title) : "";
  const heroSubtitle = isMeaningfulBannerCopy(heroBanner?.subtitle) ? normalizeBannerCopy(heroBanner?.subtitle) : "";
  const heroHasEditorialCopy = Boolean(heroTitle || heroSubtitle);
  const categoryProductCounts = useMemo(
    () =>
      allProducts.reduce<Record<number, number>>((counts, product) => {
        if (product.categoryId) {
          counts[product.categoryId] = (counts[product.categoryId] ?? 0) + 1;
        }
        return counts;
      }, {}),
    [allProducts]
  );
  const categoryCards = categories.filter((category) => (categoryProductCounts[category.id] ?? 0) > 0).slice(0, 4);
  const nearbyStores = stores.slice(0, 2);
  const bestDeals = useMemo(
    () => [...allProducts].sort((left, right) => (right.discountPercent ?? 0) - (left.discountPercent ?? 0)).slice(0, 3),
    [allProducts]
  );

  if (firstError) {
    return (
      <div className="mx-auto max-w-[1600px] px-6 py-12 lg:px-10">
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-8 py-10 text-rose-700">
          <div className="text-sm font-semibold uppercase tracking-[0.24em]">Catalog API error</div>
          <h1 className="mt-4 text-3xl font-bold text-rose-900">The website could not load products, banners, or catalog data.</h1>
          <p className="mt-3 text-base">{getApiErrorMessage(firstError, "Check the backend server and VITE_API_BASE_URL configuration.")}</p>
        </div>
      </div>
    );
  }

  if (bannersQuery.isLoading || featuredProductsQuery.isLoading || allProductsQuery.isLoading || categoriesQuery.isLoading || storesQuery.isLoading) {
    return (
      <div className="mx-auto max-w-[1600px] px-6 py-12 lg:px-10">
        <div className="store-dark-panel px-8 py-10 text-white/70">Loading homepage catalog data...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-6 py-8 lg:px-10">
      <section className="store-dark-panel p-4 lg:p-5">
        {heroBanner ? (
          <a
            href={resolveBannerLink(heroBanner.linkUrl)}
            target={heroBanner.linkUrl?.startsWith("http") ? "_blank" : undefined}
            rel={heroBanner.linkUrl?.startsWith("http") ? "noreferrer" : undefined}
            className="group relative block overflow-hidden rounded-[1.6rem]"
          >
            <img
              src={heroBanner.imageUrl}
              alt={heroTitle || "Homepage banner"}
              className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.03]"
            />
            <div
              className={`absolute inset-0 ${
                heroHasEditorialCopy
                  ? "bg-[linear-gradient(90deg,rgba(7,10,8,0.9)_0%,rgba(7,10,8,0.68)_32%,rgba(7,10,8,0.18)_100%)]"
                  : "bg-[linear-gradient(180deg,rgba(7,10,8,0.06)_0%,rgba(7,10,8,0.18)_46%,rgba(7,10,8,0.82)_100%)]"
              }`}
            />
            <div className="relative z-10 flex min-h-[360px] flex-col justify-between px-6 py-6 lg:min-h-[410px] lg:px-10 lg:py-9">
              {heroHasEditorialCopy ? (
                <div className="max-w-[470px]">
                  <div className="store-kicker">Best deals on refurbished laptops</div>
                  {heroTitle ? <h1 className="mt-5 text-4xl font-extrabold uppercase leading-[1.05] text-white lg:text-5xl">{heroTitle}</h1> : null}
                  {heroSubtitle ? <p className="mt-4 text-base leading-7 text-white/72 lg:text-lg">{heroSubtitle}</p> : null}
                  <div className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#8fd23f] px-5 py-3 text-sm font-semibold text-[#101510]">
                    Shop now
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              ) : (
                <div />
              )}

              <div className={heroHasEditorialCopy ? "grid gap-3 border-t border-white/10 pt-5 text-sm text-white/78 md:grid-cols-4" : "space-y-3"}>
                {!heroHasEditorialCopy ? (
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.2rem] border border-white/10 bg-black/25 px-4 py-4 backdrop-blur">
                    <div>
                      <div className="store-kicker border-white/15 bg-white/10 text-white">Featured campaign banner</div>
                      <p className="mt-3 text-sm leading-6 text-white/72">
                        Clean image-first banner rendering with a lighter overlay so uploaded campaign artwork stays readable.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-xl bg-[#8fd23f] px-5 py-3 text-sm font-semibold text-[#101510]">
                      Shop now
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                ) : null}

                <div className={`${heroHasEditorialCopy ? "grid gap-3 md:grid-cols-4" : "grid gap-3 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/78 md:grid-cols-4"}`}>
                  <div className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#97d83e]" />
                    6 Months Warranty
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#97d83e]" />
                    Quality Checked
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Undo2 className="h-4 w-4 text-[#97d83e]" />
                    7 Days Easy Returns
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Truck className="h-4 w-4 text-[#97d83e]" />
                    Fast Delivery
                  </div>
                </div>
              </div>
            </div>
          </a>
        ) : (
          <div className="rounded-[1.6rem] bg-[linear-gradient(135deg,#121813,#0b100d)] px-6 py-10 lg:px-10 lg:py-12">
            <div className="store-kicker">Awaiting homepage banner</div>
            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold uppercase leading-tight text-white lg:text-5xl">
              Publish your first campaign banner from the admin panel.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/68">The first active banner will be used here as the main storefront hero.</p>
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {categoryCards.map((category) => (
            <Link
              key={category.id}
              to={getCategoryLink(category.slug)}
              className="store-light-card flex items-center gap-4 p-4 transition hover:-translate-y-1"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.1rem] bg-[#f1f8e4]">
                {category.iconUrl ? (
                  <img src={category.iconUrl} alt={category.name} className="h-12 w-12 object-contain" />
                ) : (
                  <div className="h-12 w-12 rounded-[1rem] bg-[#8fd23f]/25" />
                )}
              </div>
              <div>
                <div className="text-lg font-bold text-slate-950">{category.name}</div>
                <div className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#5e8c26]">
                  Explore now
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="store-dark-panel p-5">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#a9dc63]">Featured laptops</div>
            <h2 className="mt-2 text-2xl font-bold text-white lg:text-3xl">Admin-picked products for the homepage spotlight.</h2>
          </div>
          <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#a9dc63]">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {featuredProducts.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-center text-white/58">
            Mark products as featured from the admin panel to populate this section.
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {storeHighlights.map((item) => (
          <div key={item.title} className="store-dark-panel-soft p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#89c73a]/12 p-3 text-[#a9dc63]">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-semibold text-white">{item.title}</div>
                <div className="mt-1 text-sm text-white/52">{item.subtitle}</div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="store-dark-panel p-5">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#a9dc63]">Available at your nearby stores</div>
            <h2 className="mt-2 text-2xl font-bold text-white lg:text-3xl">Choose a branch with real pickup and support coverage.</h2>
          </div>
          <Link to="/stores" className="inline-flex items-center gap-2 text-sm font-semibold text-[#a9dc63]">
            View all stores
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
          {nearbyStores.map((store) => (
            <article key={store.id} className="store-light-card grid gap-4 p-4 md:grid-cols-[120px_1fr_auto]">
              <div className="aspect-[4/3] overflow-hidden rounded-[1rem] bg-slate-100">
                {store.imageUrl ? <img src={store.imageUrl} alt={store.name} className="h-full w-full object-cover" /> : null}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">{store.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {store.address}, {store.city}
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#5f8e25]" />
                    {store.city}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <PhoneCall className="h-3.5 w-3.5 text-[#5f8e25]" />
                    {store.phone}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {store.mapLink ? (
                  <a
                    href={store.mapLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-[#89c73a] px-4 py-2 text-xs font-semibold text-[#101510]"
                  >
                    View Store
                  </a>
                ) : null}
              </div>
            </article>
          ))}

          <div className="rounded-[1.6rem] border border-[#aacd7a]/15 bg-[linear-gradient(135deg,rgba(160,214,90,0.2),rgba(255,255,255,0.02))] p-6">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#c8ee88]">Check product availability</div>
            <h3 className="mt-4 text-2xl font-bold text-white">Store-ready stock visibility</h3>
            <p className="mt-3 text-sm leading-7 text-white/64">
              Customers can review branch availability before checkout and choose the exact store that will fulfill the order.
            </p>
            <Link to="/stores" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#89c73a] px-4 py-3 text-sm font-semibold text-[#101510]">
              Choose store
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="store-dark-panel p-5">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#a9dc63]">Today's best deals</div>
            <h2 className="mt-2 text-2xl font-bold text-white lg:text-3xl">Deal-led banners generated from live catalog pricing.</h2>
          </div>
          <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#a9dc63]">
            View all deals
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {bestDeals.length ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {bestDeals.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="overflow-hidden rounded-[1.6rem] border border-[#cce6a0]/20 bg-[linear-gradient(135deg,rgba(186,235,106,0.18),rgba(255,255,255,0.04))] p-5 transition hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="max-w-[65%]">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d2f495]">
                      {product.discountPercent ? `${product.discountPercent}% off` : product.categoryName || "Top deal"}
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-white">{product.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/68">
                      {product.processor || "Configured system"} {product.ramGb ? `- ${product.ramGb} GB RAM` : ""}
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#d2f495]">
                      Shop now
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                  {product.images[0]?.imageUrl ? (
                    <img src={product.images[0].imageUrl} alt={product.title} className="h-28 w-32 object-contain" />
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-center text-white/58">
            Add products with pricing and discounts to surface live deal tiles here.
          </div>
        )}
      </section>
    </div>
  );
}
