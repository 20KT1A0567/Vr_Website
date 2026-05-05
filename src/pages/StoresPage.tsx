import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePageMeta } from "../hooks/usePageMeta";
import { ChevronRight, Clock3, MapPin, MessageCircle, Navigation, PhoneCall, ShoppingBag, Star, Store as StoreIcon, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { catalogApi } from "api/client";
import { getButtonClassName } from "components/ui/Button";
import { EmptyState } from "components/ui/EmptyState";
import { SkeletonLoader } from "components/ui/SkeletonLoader";
import { getApiErrorMessage } from "../utils/api";

const vrTechnologiesLogo = "/logo.jpg";

export function StoresPage() {
  usePageMeta({ title: "Store Locations", description: "Visit VR Technologies stores in Hyderabad for pickup, warranty support, and hands-on product guidance across all our branches." });
  const storesQuery = useQuery({ queryKey: ["stores"], queryFn: catalogApi.getStores });
  const stores = storesQuery.data ?? [];

  const rankedStores = useMemo(
    () =>
      [...stores].sort((a, b) => {
        const reviewGap = (b.googleReviewCount ?? 0) - (a.googleReviewCount ?? 0);
        return reviewGap !== 0 ? reviewGap : (b.googleRating ?? 0) - (a.googleRating ?? 0);
      }),
    [stores]
  );

  const ratedStores = rankedStores.filter((s) => s.googleRating != null);
  const averageRating = ratedStores.length
    ? ratedStores.reduce((sum, s) => sum + (s.googleRating ?? 0), 0) / ratedStores.length
    : 0;
  const totalReviews = rankedStores.reduce((sum, s) => sum + (s.googleReviewCount ?? 0), 0);
  const activeStores = rankedStores.filter((s) => s.active);
  const topStore = rankedStores[0];

  if (storesQuery.error) {
    return (
      <div className="vr-page-shell">
        <EmptyState
          eyebrow="Stores"
          title="Store locations could not be loaded."
          description={getApiErrorMessage(storesQuery.error, "Check the backend stores API.")}
        />
      </div>
    );
  }

  if (storesQuery.isLoading) {
    return (
      <div className="vr-page-shell space-y-6">
        <SkeletonLoader className="h-64 rounded-[2rem]" />
        <div className="grid gap-6 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} className="h-[320px] rounded-[2rem]" />
          ))}
        </div>
      </div>
    );
  }

  if (!rankedStores.length) {
    return (
      <div className="vr-page-shell">
        <EmptyState
          eyebrow="Stores"
          title="Store locations will appear here soon."
          description="Add active store branches in the admin panel and this page will show pickup, support, and direction details for each location."
          action={<Link to="/products" className={getButtonClassName({ variant: "primary", size: "lg" })}>Explore Products</Link>}
        />
      </div>
    );
  }

  return (
    <div className="vr-page-shell space-y-8">

      {/* ── Hero ── */}
      <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_100%)] px-6 py-10 text-white sm:px-10 sm:py-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-block h-[3px] w-7 rounded-full bg-amber-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-400">Store Network</span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
              Visit us at our<br className="hidden sm:block" /> branches
            </h1>
            <p className="mt-3 max-w-lg text-base text-white/60">
              Pickup, warranty support, and hands-on product guidance across all locations.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/products" className="inline-flex items-center gap-2 rounded-[1.1rem] bg-white px-5 py-3 text-sm font-bold text-[#1e3a8a] transition hover:bg-white/90">
                Shop Products
              </Link>
              {topStore?.mapLink ? (
                <a href={topStore.mapLink} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-[1.1rem] border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">
                  <Navigation className="h-4 w-4" />
                  Top Branch Directions
                </a>
              ) : null}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 lg:w-[420px] lg:shrink-0">
            {[
              { label: "Live Branches",   value: String(activeStores.length),              sub: "Ready for support" },
              { label: "Average Rating",  value: averageRating ? averageRating.toFixed(1) : "--", sub: "Google verified", star: true },
              { label: "Total Reviews",   value: String(totalReviews),                     sub: "Across all branches" },
              { label: "Top Branch",      value: topStore?.name?.split(" - ")[1] ?? topStore?.name ?? "—", sub: topStore ? `${topStore.city}` : "" }
            ].map((stat) => (
              <div key={stat.label} className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4 backdrop-blur">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">{stat.label}</div>
                <div className="mt-2 flex items-center gap-2 text-2xl font-extrabold text-white">
                  {stat.value}
                  {stat.star ? <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> : null}
                </div>
                <div className="mt-1 text-[11px] text-white/45">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Store cards ── */}
      <div className="grid gap-6 xl:grid-cols-2">
        {rankedStores.map((store) => (
          <article key={store.id} className="group overflow-hidden rounded-[1.8rem] border border-[var(--vr-border)] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.07)]">

            {/* Image */}
            <div className="relative h-52 overflow-hidden bg-[linear-gradient(145deg,#dbeafe,#eff6ff)] sm:h-60">
              {store.videoUrl ? (
                <video src={store.videoUrl} poster={store.imageUrl} autoPlay muted loop playsInline
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              ) : store.imageUrl ? (
                <img src={store.imageUrl} alt={store.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <img src={vrTechnologiesLogo} alt="VR Technologies"
                    className="h-20 w-20 rounded-[1.2rem] border border-white/80 bg-white p-2 shadow-lg" />
                </div>
              )}

              {/* Overlay — top */}
              <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
                <span className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] shadow-sm ${
                  store.active ? "bg-emerald-500 text-white" : "bg-slate-600 text-white/80"
                }`}>
                  {store.active ? "Active" : "Inactive"}
                </span>
                <div className="flex items-center gap-2">
                  {store.videoUrl ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur">
                      <Video className="h-3 w-3" /> Video
                    </span>
                  ) : null}
                  {store.googleRating != null ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-sm font-bold text-white shadow backdrop-blur">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {store.googleRating.toFixed(1)}
                      {store.googleReviewCount ? (
                        <span className="text-xs text-white/65">({store.googleReviewCount})</span>
                      ) : null}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Overlay — bottom */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-4 pb-4 pt-8">
                <div className="flex items-end justify-between gap-3">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                    <MapPin className="h-3.5 w-3.5" />
                    {store.city}, {store.state}
                  </div>
                  {store.timings ? (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                      <Clock3 className="h-3.5 w-3.5" />
                      {store.timings}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vr-primary)]">
                    <StoreIcon className="h-3.5 w-3.5" />
                    VR Technologies Branch
                  </div>
                  <h2 className="mt-1.5 text-xl font-extrabold text-[var(--vr-text)]">{store.name}</h2>
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-[var(--vr-muted)]">
                {store.address}{store.landmark ? `, ${store.landmark}` : ""}{store.postalCode ? ` — ${store.postalCode}` : ""}
              </p>

              {/* Contact row */}
              <div className="mt-4 flex flex-wrap gap-3">
                {store.phone ? (
                  <div className="flex items-center gap-2 rounded-[0.9rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--vr-text)]">
                    <PhoneCall className="h-3.5 w-3.5 text-[var(--vr-primary)]" />
                    {store.phone}
                  </div>
                ) : null}
                {store.whatsapp ? (
                  <div className="flex items-center gap-2 rounded-[0.9rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--vr-text)]">
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                    {store.whatsapp}
                  </div>
                ) : null}
              </div>

              {/* Action buttons */}
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link
                  to={`/products?storeId=${store.id}`}
                  className="inline-flex items-center gap-2 rounded-[1rem] bg-[var(--vr-primary)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--vr-primary-strong)]"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Shop this branch
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                {store.whatsapp ? (
                  <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-[1rem] bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                ) : null}
                {store.mapLink ? (
                  <a href={store.mapLink} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-[1rem] border border-[var(--vr-border)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--vr-text)] transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]">
                    <Navigation className="h-4 w-4" />
                    Directions
                  </a>
                ) : null}
                {store.phone ? (
                  <a href={`tel:${store.phone}`}
                    className="inline-flex items-center gap-2 rounded-[1rem] border border-[var(--vr-border)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--vr-text)] transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]">
                    <PhoneCall className="h-4 w-4" />
                    Call
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
