import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Clock3, MapPin, Phone, Search, Star, Store as StoreIcon, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { catalogApi } from "api/client";
import type { Store } from "types";
import { useSelectedStore } from "store/storeStore";

interface StoreSelectorModalProps {
  open: boolean;
  onClose: () => void;
}

export function StoreSelectorModal({ open, onClose }: StoreSelectorModalProps) {
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ["all-stores"],
    queryFn: catalogApi.getStores,
    enabled: open
  });
  const selectedStoreId = useSelectedStore((state) => state.selectedStoreId);
  const pickStore = useSelectedStore((state) => state.pickStore);
  const clearStore = useSelectedStore((state) => state.clearStore);
  const acknowledgePrompt = useSelectedStore((state) => state.acknowledgePrompt);
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const activeStores = useMemo(() => stores.filter((store) => store.active), [stores]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return activeStores;
    return activeStores.filter((store) =>
      [store.name, store.address, store.city, store.landmark].filter(Boolean).join(" ").toLowerCase().includes(query)
    );
  }, [activeStores, search]);

  function handlePick(store: Store) {
    const place = store.landmark?.trim() || store.city?.trim() || null;
    pickStore(store.id, store.name, place);
    if (location.search.includes("storeId=")) {
      const params = new URLSearchParams(location.search);
      params.set("storeId", String(store.id));
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
    onClose();
  }

  function handleBrowseAll() {
    clearStore();
    if (location.search.includes("storeId=")) {
      const params = new URLSearchParams(location.search);
      params.delete("storeId");
      const next = params.toString();
      navigate(`${location.pathname}${next ? `?${next}` : ""}`, { replace: true });
    }
    onClose();
  }

  function handleDismiss() {
    acknowledgePrompt();
    onClose();
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center px-3 py-4 sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={handleDismiss} aria-hidden />
          <motion.div
            className="relative z-10 flex max-h-[92vh] w-full max-w-[820px] flex-col overflow-hidden rounded-[1.6rem] border border-[var(--vr-border)] bg-white shadow-[0_28px_72px_rgba(15,23,42,0.28)]"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative bg-[linear-gradient(135deg,#0f172a,#1e3a8a)] px-6 py-6 text-white sm:px-8 sm:py-7">
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Close"
                className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white/70 transition hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/85">
                <StoreIcon className="h-3 w-3" />
                Choose your store
              </div>
              <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
                Where would you like to shop today?
              </h2>
              <p className="mt-2 max-w-[520px] text-sm leading-6 text-white/75">
                Pick a VR Technologies branch to see what's in stock there, get accurate pickup timings, and shop with the team that will support you.
              </p>
              <div className="relative mt-5 max-w-[440px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                <input
                  className="w-full rounded-full border border-white/15 bg-white/[0.08] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/55 focus:border-white/40 focus:outline-none"
                  placeholder="Search by name, area, or landmark"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="vr-skeleton h-[170px]" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <StoreIcon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">No stores match "{search}"</p>
                  <p className="mt-1 text-xs text-slate-500">Try a different area or clear the search.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filtered.map((store) => {
                    const isSelected = selectedStoreId === store.id;
                    return (
                      <motion.button
                        key={store.id}
                        type="button"
                        onClick={() => handlePick(store)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.985 }}
                        className={`group relative flex flex-col overflow-hidden rounded-[1.2rem] border bg-white text-left shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition ${
                          isSelected
                            ? "border-[var(--vr-primary)] shadow-[0_0_0_3px_rgba(30,58,138,0.12)]"
                            : "border-[var(--vr-border)] hover:border-[var(--vr-primary)] hover:shadow-[0_14px_32px_rgba(15,23,42,0.1)]"
                        }`}
                      >
                        <div className="relative h-28 overflow-hidden bg-[linear-gradient(135deg,#eff5ff,#dce8ff)]">
                          {store.imageUrl ? (
                            <img src={store.imageUrl} alt={store.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[var(--vr-primary)]">
                              <StoreIcon className="h-8 w-8" />
                            </div>
                          )}
                          {isSelected ? (
                            <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[var(--vr-primary)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow">
                              <Check className="h-3 w-3" />
                              Current
                            </div>
                          ) : null}
                          {typeof store.googleRating === "number" && store.googleRating > 0 ? (
                            <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-amber-600 shadow-sm">
                              <Star className="h-3 w-3 fill-current" />
                              {store.googleRating.toFixed(1)}
                              {store.googleReviewCount ? <span className="text-slate-500">({store.googleReviewCount})</span> : null}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-1 flex-col gap-2 p-4">
                          <div>
                            <div className="text-base font-bold text-[var(--vr-text)]">{store.name}</div>
                            <div className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-[var(--vr-muted)]">
                              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-[var(--vr-primary)]" />
                              <span className="line-clamp-2">
                                {store.address}
                                {store.landmark ? `, ${store.landmark}` : ""}, {store.city}
                              </span>
                            </div>
                          </div>
                          <div className="mt-auto flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[var(--vr-muted)]">
                            {store.timings ? (
                              <span className="inline-flex items-center gap-1">
                                <Clock3 className="h-3 w-3 text-[var(--vr-primary)]" />
                                {store.timings}
                              </span>
                            ) : null}
                            {store.phone ? (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3 text-[var(--vr-primary)]" />
                                {store.phone}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-2 inline-flex items-center justify-between rounded-full border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-3 py-1.5 text-xs font-bold text-[var(--vr-primary)] transition group-hover:border-[var(--vr-primary)] group-hover:bg-white">
                            {isSelected ? "Continue shopping here" : "Shop at this branch"}
                            <ChevronRight className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-5 py-4 sm:px-6">
              <div className="text-xs text-[var(--vr-muted)]">
                You can change your store anytime from the header.
              </div>
              <button
                type="button"
                onClick={handleBrowseAll}
                className="rounded-full border border-[var(--vr-border)] bg-white px-4 py-2 text-xs font-bold text-[var(--vr-text)] transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
              >
                Browse all stores
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
