import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Cpu,
  HardDrive,
  IndianRupee,
  Laptop2,
  MemoryStick,
  Monitor,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { Brand, Category, ProductCondition } from "types";
import {
  type CatalogFilterCounts,
  type CatalogFilterState,
  conditionOptions,
  formatStorageOption,
  parseCatalogPrice
} from "../../utils/catalogFilters";
import { FilterCheckbox } from "./FilterCheckbox";
import { FilterSection } from "./FilterSection";
import { PriceSlider } from "./PriceSlider";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

interface FilterSidebarProps {
  brands: Brand[];
  categories: Category[];
  processors: string[];
  ramOptions: number[];
  storageOptions: number[];
  displayOptions: string[];
  osOptions: string[];
  graphicsOptions: string[];
  priceBounds: { min: number; max: number };
  counts: CatalogFilterCounts;
  state: CatalogFilterState;
  setState: Dispatch<SetStateAction<CatalogFilterState>>;
  sticky?: boolean;
  className?: string;
  onClose?: () => void;
  onClear: () => void;
  onApply?: () => void;
  showCatalogSearch?: boolean;
}

type FilterSectionKey =
  | "category"
  | "brand"
  | "price"
  | "ram"
  | "storage"
  | "processor"
  | "displayAndOs"
  | "graphics";

const BUDGET_PRESETS = [
  { label: "< ₹20K",    min: "",      max: "20000" },
  { label: "₹20K–40K", min: "20000", max: "40000" },
  { label: "₹40K–70K", min: "40000", max: "70000" },
  { label: "> ₹70K",   min: "70000", max: "" },
] as const;

const CONDITION_META: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  EXCELLENT: { label: "Grade A – Excellent", bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  GOOD:      { label: "Grade B – Good",      bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-500"   },
  FAIR:      { label: "Grade C – Fair",      bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-500"  },
};

function toggleSelection<T>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function clampPrice(value: number, bounds: { min: number; max: number }) {
  return Math.min(bounds.max, Math.max(bounds.min, value));
}

function clampManualPrice(value: string, bounds: { min: number; max: number }) {
  const parsed = parseCatalogPrice(value);
  if (typeof parsed !== "number") return "";
  return String(clampPrice(parsed, bounds));
}

export function FilterSidebar({
  brands,
  categories,
  processors,
  ramOptions,
  storageOptions,
  displayOptions,
  osOptions,
  graphicsOptions,
  priceBounds,
  counts,
  state,
  setState,
  sticky = true,
  className = "",
  onClose,
  onClear,
  onApply,
  showCatalogSearch = true
}: FilterSidebarProps) {
  const isCompactSheet = !showCatalogSearch;
  const [brandSearch, setBrandSearch] = useState("");
  const [processorSearch, setProcessorSearch] = useState("");
  const [activeSection, setActiveSection] = useState<FilterSectionKey | null>(isCompactSheet ? "brand" : "category");
  const [localSearch, setLocalSearch] = useState(state.q || "");
  const debouncedLocalSearch = useDebouncedValue(localSearch, 300);

  useEffect(() => {
    setState((current) => (current.q === debouncedLocalSearch ? current : { ...current, q: debouncedLocalSearch }));
  }, [debouncedLocalSearch, setState]);

  useEffect(() => {
    if (state.q !== debouncedLocalSearch) setLocalSearch(state.q || "");
  }, [state.q, debouncedLocalSearch]);

  useEffect(() => {
    setActiveSection((current) => current ?? (isCompactSheet ? "brand" : "category"));
  }, [isCompactSheet]);

  const filteredBrands = useMemo(
    () => brands.filter((brand) => brand.name.toLowerCase().includes(brandSearch.trim().toLowerCase())),
    [brandSearch, brands]
  );
  const filteredProcessors = useMemo(
    () => processors.filter((processor) => processor.toLowerCase().includes(processorSearch.trim().toLowerCase())),
    [processorSearch, processors]
  );

  const parsedMinPrice = parseCatalogPrice(state.minPrice);
  const parsedMaxPrice = parseCatalogPrice(state.maxPrice);
  const sliderMin = clampPrice(typeof parsedMinPrice === "number" ? parsedMinPrice : priceBounds.min, priceBounds);
  const sliderMax = clampPrice(typeof parsedMaxPrice === "number" ? parsedMaxPrice : priceBounds.max, priceBounds);

  function setMinPrice(nextValue: number) {
    const safeMin = Math.min(clampPrice(nextValue, priceBounds), sliderMax);
    setState((current) => ({
      ...current,
      minPrice: String(safeMin),
      maxPrice: sliderMax < safeMin ? String(safeMin) : current.maxPrice
    }));
  }

  function setMaxPrice(nextValue: number) {
    const safeMax = Math.max(clampPrice(nextValue, priceBounds), sliderMin);
    setState((current) => ({
      ...current,
      minPrice: sliderMin > safeMax ? String(safeMax) : current.minPrice,
      maxPrice: String(safeMax)
    }));
  }

  function commitMinPrice() {
    setState((current) => {
      const normalizedMin = clampManualPrice(current.minPrice, priceBounds);
      const normalizedMax = clampManualPrice(current.maxPrice, priceBounds);
      const safeMin = normalizedMin ? Number(normalizedMin) : priceBounds.min;
      const safeMax = normalizedMax ? Number(normalizedMax) : priceBounds.max;
      return {
        ...current,
        minPrice: normalizedMin,
        maxPrice: normalizedMax && safeMax < safeMin ? String(safeMin) : normalizedMax
      };
    });
  }

  function commitMaxPrice() {
    setState((current) => {
      const normalizedMin = clampManualPrice(current.minPrice, priceBounds);
      const normalizedMax = clampManualPrice(current.maxPrice, priceBounds);
      const safeMin = normalizedMin ? Number(normalizedMin) : priceBounds.min;
      const safeMax = normalizedMax ? Number(normalizedMax) : priceBounds.max;
      return {
        ...current,
        minPrice: normalizedMin && safeMin > safeMax ? String(safeMax) : normalizedMin,
        maxPrice: normalizedMax
      };
    });
  }

  const totalActive =
    state.categoryIds.length +
    state.brandIds.length +
    state.ramOptions.length +
    state.storageOptions.length +
    state.processorOptions.length +
    state.displayOptions.length +
    state.osOptions.length +
    state.graphicsOptions.length +
    state.conditions.length +
    (state.featuredOnly ? 1 : 0) +
    (state.inStockOnly ? 1 : 0) +
    (state.minPrice || state.maxPrice ? 1 : 0);

  /* ─── Compact mobile sheet mode ─────────────────────────────── */
  if (isCompactSheet) {
    return (
      <aside className={className}>
        <div className="space-y-1">
          <FilterSection
            title="Brand"
            open={activeSection === "brand"}
            selectedCount={state.brandIds.length}
            onToggle={() => setActiveSection((current) => (current === "brand" ? null : "brand"))}
            compact
          >
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input value={brandSearch} onChange={(event) => setBrandSearch(event.target.value)} placeholder="Search brand..." className="vr-input pl-10 text-[14px]" />
              </div>
              <div className="vr-scrollbar grid max-h-56 gap-1 overflow-y-auto pr-1">
                {filteredBrands.map((brand) => {
                  const count = counts.brandCounts[brand.id] ?? 0;
                  const checked = state.brandIds.includes(brand.id);
                  const disabled = count === 0 && !checked;
                  return (
                    <FilterCheckbox key={brand.id} label={brand.name} count={count} checked={checked} disabled={disabled} logoUrl={brand.logoUrl ?? undefined}
                      onChange={() => setState((current) => ({ ...current, brandIds: toggleSelection(current.brandIds, brand.id) }))}
                    />
                  );
                })}
              </div>
            </div>
          </FilterSection>

          <FilterSection title="RAM" open={activeSection === "ram"} selectedCount={state.ramOptions.length}
            onToggle={() => setActiveSection((current) => (current === "ram" ? null : "ram"))} compact>
            <div className="flex flex-wrap gap-1.5">
              {ramOptions.map((ram) => {
                const count = counts.ramCounts[ram] ?? 0;
                const checked = state.ramOptions.includes(ram);
                const disabled = count === 0 && !checked;
                return (
                  <button key={ram} type="button" disabled={disabled}
                    onClick={() => setState((current) => ({ ...current, ramOptions: toggleSelection(current.ramOptions, ram) }))}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${checked ? "border-[var(--vr-primary)] bg-[var(--vr-primary)] text-white" : disabled ? "border-[var(--vr-border)] opacity-40" : "border-[var(--vr-border)] bg-white text-[var(--vr-text)] hover:border-[var(--vr-primary)]"}`}
                  >
                    {ram} GB
                  </button>
                );
              })}
            </div>
          </FilterSection>

          <FilterSection title="Storage" open={activeSection === "storage"} selectedCount={state.storageOptions.length}
            onToggle={() => setActiveSection((current) => (current === "storage" ? null : "storage"))} compact>
            <div className="grid gap-1">
              {storageOptions.map((storage) => {
                const count = counts.storageCounts[storage] ?? 0;
                const checked = state.storageOptions.includes(storage);
                const disabled = count === 0 && !checked;
                return (
                  <FilterCheckbox key={storage} label={formatStorageOption(storage)} count={count} checked={checked} disabled={disabled}
                    onChange={() => setState((current) => ({ ...current, storageOptions: toggleSelection(current.storageOptions, storage) }))}
                  />
                );
              })}
            </div>
          </FilterSection>

          <FilterSection title="Processor" open={activeSection === "processor"} selectedCount={state.processorOptions.length}
            onToggle={() => setActiveSection((current) => (current === "processor" ? null : "processor"))} compact>
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input value={processorSearch} onChange={(event) => setProcessorSearch(event.target.value)} placeholder="Search processor..." className="vr-input pl-10 text-[14px]" />
              </div>
              <div className="vr-scrollbar grid max-h-56 gap-1 overflow-y-auto pr-1">
                {filteredProcessors.map((processor) => {
                  const count = counts.processorCounts[processor] ?? 0;
                  const checked = state.processorOptions.includes(processor);
                  const disabled = count === 0 && !checked;
                  return (
                    <FilterCheckbox key={processor} label={processor} count={count} checked={checked} disabled={disabled}
                      onChange={() => setState((current) => ({ ...current, processorOptions: toggleSelection(current.processorOptions, processor) }))}
                    />
                  );
                })}
              </div>
            </div>
          </FilterSection>

          <FilterSection title="Categories" open={activeSection === "category"} selectedCount={state.categoryIds.length}
            onToggle={() => setActiveSection((current) => (current === "category" ? null : "category"))} compact>
            <div className="grid gap-1">
              {categories.map((category) => {
                const count = counts.categoryCounts[category.id] ?? 0;
                const checked = state.categoryIds.includes(category.id);
                const disabled = count === 0 && !checked;
                return (
                  <FilterCheckbox key={category.id} label={category.name} count={count} checked={checked} disabled={disabled} iconUrl={category.iconUrl ?? undefined}
                    onChange={() => setState((current) => ({ ...current, categoryIds: toggleSelection(current.categoryIds, category.id) }))}
                  />
                );
              })}
            </div>
          </FilterSection>

          <FilterSection title="Price Range" open={activeSection === "price"} selectedCount={state.minPrice.trim() || state.maxPrice.trim() ? 1 : 0}
            onToggle={() => setActiveSection((current) => (current === "price" ? null : "price"))} compact>
            <PriceSlider
              bounds={priceBounds} minValue={sliderMin} maxValue={sliderMax}
              minInput={state.minPrice} maxInput={state.maxPrice}
              onMinSliderChange={setMinPrice} onMaxSliderChange={setMaxPrice}
              onMinInputChange={(value) => setState((current) => ({ ...current, minPrice: value }))}
              onMaxInputChange={(value) => setState((current) => ({ ...current, maxPrice: value }))}
              onMinInputCommit={commitMinPrice} onMaxInputCommit={commitMaxPrice}
            />
          </FilterSection>

          <FilterSection title="Condition" open={activeSection === "graphics"} selectedCount={state.conditions.length}
            onToggle={() => setActiveSection((current) => (current === "graphics" ? null : "graphics"))} compact>
            <div className="grid gap-1">
              {conditionOptions.map((option) => {
                const count = counts.conditionCounts[option.value] ?? 0;
                const checked = state.conditions.includes(option.value);
                const disabled = count === 0 && !checked;
                return (
                  <FilterCheckbox key={option.value} label={option.label} count={count} checked={checked} disabled={disabled}
                    onChange={() => setState((current) => ({ ...current, conditions: toggleSelection(current.conditions, option.value as ProductCondition) }))}
                  />
                );
              })}
            </div>
          </FilterSection>
        </div>
      </aside>
    );
  }

  /* ─── Desktop sidebar mode ───────────────────────────────────── */
  return (
    <aside
      className={`${sticky ? "lg:sticky" : ""} ${className}`.trim()}
      style={sticky ? {
        top: "var(--sticky-offset, 9.5rem)",
        height: "calc(100vh - var(--sticky-offset, 9.5rem))"
      } : undefined}
    >
      {/* overflow-y-auto is on this inner div, NOT the aside — putting overflow on a
          sticky element causes Chrome to treat it as its own scroll container, breaking sticky */}
      <div
        className={`flex flex-col gap-3 ${sticky ? "vr-scrollbar lg:overflow-y-auto lg:overscroll-contain" : ""}`}
        style={sticky ? { height: "100%" } : undefined}
      >

        {/* Header — sticky within the inner scroll container */}
        <div className={`flex items-center justify-between overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_100%)] px-4 py-3.5 ${sticky ? "lg:sticky lg:top-0 lg:z-10" : ""}`}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
              <SlidersHorizontal className="h-4 w-4 text-white/80" />
            </div>
            <div>
              <div className="text-[9px] font-extrabold uppercase tracking-[0.26em] text-white/50">Narrow down</div>
              <div className="text-[14px] font-extrabold text-white">Filters</div>
            </div>
            {totalActive > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-extrabold text-white">
                {totalActive}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClear}
            className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/80 transition hover:bg-white/20"
          >
            Clear all
          </button>
        </div>

        {/* Search */}
        {showCatalogSearch ? (
          <div className="shrink-0 overflow-hidden rounded-2xl border border-[var(--vr-border)] bg-white px-4 py-3.5">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--vr-muted)]">Search products</div>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={localSearch}
                onChange={(event) => setLocalSearch(event.target.value)}
                placeholder="Brand, model, processor..."
                className="vr-input pl-10 text-[12px]"
              />
              {localSearch && (
                <button type="button" onClick={() => setLocalSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:text-[var(--vr-danger)]">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* Filter sections — unified card */}
        <div>
          <div className="overflow-hidden rounded-2xl border border-[var(--vr-border)] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.06)]">

          {/* ── Category ── */}
          <FilterSection
            title="Category"
            subtitle={state.categoryIds.length ? `${state.categoryIds.length} selected` : "Shop by category"}
            icon={<Laptop2 className="h-4 w-4" />}
            open={activeSection === "category"}
            selectedCount={state.categoryIds.length}
            onToggle={() => setActiveSection((current) => (current === "category" ? null : "category"))}
          >
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => {
                const count = counts.categoryCounts[category.id] ?? 0;
                const checked = state.categoryIds.includes(category.id);
                const disabled = count === 0 && !checked;
                return (
                  <button
                    key={category.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setState((current) => ({ ...current, categoryIds: toggleSelection(current.categoryIds, category.id) }))}
                    className={`relative flex flex-col items-center gap-1.5 overflow-hidden rounded-xl border p-2.5 text-center transition ${
                      checked
                        ? "border-[var(--vr-primary)] bg-[rgba(30,58,138,0.06)] shadow-[0_0_0_2px_rgba(30,58,138,0.12)]"
                        : disabled
                        ? "cursor-not-allowed border-[var(--vr-border)] opacity-35"
                        : "border-[var(--vr-border)] bg-white hover:border-[var(--vr-primary)] hover:bg-[var(--vr-surface-soft)]"
                    }`}
                  >
                    {checked && (
                      <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--vr-primary)]">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[var(--vr-surface-soft)]">
                      {category.iconUrl ? (
                        <img src={category.iconUrl} alt={category.name} className="h-7 w-7 object-contain" />
                      ) : (
                        <Laptop2 className="h-5 w-5 text-[var(--vr-primary)]" />
                      )}
                    </div>
                    <div className="text-[11px] font-semibold leading-tight text-[var(--vr-text)]">{category.name}</div>
                    <div className={`text-[10px] font-semibold ${checked ? "text-[var(--vr-primary)]" : "text-[var(--vr-muted)]"}`}>{count}</div>
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* ── Brand ── */}
          <FilterSection
            title="Brand"
            subtitle={state.brandIds.length ? `${state.brandIds.length} selected` : "Choose brand"}
            icon={<Tag className="h-4 w-4" />}
            open={activeSection === "brand"}
            selectedCount={state.brandIds.length}
            onToggle={() => setActiveSection((current) => (current === "brand" ? null : "brand"))}
          >
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input value={brandSearch} onChange={(event) => setBrandSearch(event.target.value)} placeholder="Search brand..." className="vr-input pl-10 text-[12px]" />
              </div>
              <div className="vr-scrollbar grid max-h-52 gap-0.5 overflow-y-auto">
                {filteredBrands.map((brand) => {
                  const count = counts.brandCounts[brand.id] ?? 0;
                  const checked = state.brandIds.includes(brand.id);
                  const disabled = count === 0 && !checked;
                  return (
                    <FilterCheckbox
                      key={brand.id}
                      label={brand.name}
                      count={count}
                      checked={checked}
                      disabled={disabled}
                      logoUrl={brand.logoUrl ?? undefined}
                      onChange={() => setState((current) => ({ ...current, brandIds: toggleSelection(current.brandIds, brand.id) }))}
                    />
                  );
                })}
              </div>
            </div>
          </FilterSection>

          {/* ── Budget ── */}
          <FilterSection
            title="Budget"
            subtitle={state.minPrice || state.maxPrice ? "Custom range set" : "Pick your range"}
            icon={<IndianRupee className="h-4 w-4" />}
            open={activeSection === "price"}
            selectedCount={state.minPrice.trim() || state.maxPrice.trim() ? 1 : 0}
            onToggle={() => setActiveSection((current) => (current === "price" ? null : "price"))}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-1.5">
                {BUDGET_PRESETS.map((preset) => {
                  const isActive = state.minPrice === preset.min && state.maxPrice === preset.max;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setState((c) => ({ ...c, minPrice: preset.min, maxPrice: preset.max }))}
                      className={`rounded-xl border px-2.5 py-2 text-[11px] font-bold transition ${
                        isActive
                          ? "border-[var(--vr-primary)] bg-[rgba(30,58,138,0.08)] text-[var(--vr-primary)] shadow-[0_0_0_2px_rgba(30,58,138,0.12)]"
                          : "border-[var(--vr-border)] bg-[var(--vr-surface-soft)] text-[var(--vr-text)] hover:border-[var(--vr-primary)] hover:bg-white"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <div>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--vr-muted)]">Custom range</div>
                <PriceSlider
                  bounds={priceBounds} minValue={sliderMin} maxValue={sliderMax}
                  minInput={state.minPrice} maxInput={state.maxPrice}
                  onMinSliderChange={setMinPrice} onMaxSliderChange={setMaxPrice}
                  onMinInputChange={(value) => setState((current) => ({ ...current, minPrice: value }))}
                  onMaxInputChange={(value) => setState((current) => ({ ...current, maxPrice: value }))}
                  onMinInputCommit={commitMinPrice} onMaxInputCommit={commitMaxPrice}
                />
              </div>
            </div>
          </FilterSection>

          {/* ── RAM ── */}
          <FilterSection
            title="RAM"
            subtitle="Memory size"
            icon={<MemoryStick className="h-4 w-4" />}
            open={activeSection === "ram"}
            selectedCount={state.ramOptions.length}
            onToggle={() => setActiveSection((current) => (current === "ram" ? null : "ram"))}
          >
            <div className="flex flex-wrap gap-1.5">
              {ramOptions.map((ram) => {
                const count = counts.ramCounts[ram] ?? 0;
                const checked = state.ramOptions.includes(ram);
                const disabled = count === 0 && !checked;
                return (
                  <button
                    key={ram}
                    type="button"
                    disabled={disabled}
                    onClick={() => setState((current) => ({ ...current, ramOptions: toggleSelection(current.ramOptions, ram) }))}
                    className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition ${
                      checked
                        ? "border-[var(--vr-primary)] bg-[var(--vr-primary)] text-white shadow-[0_4px_14px_rgba(30,58,138,0.25)]"
                        : disabled
                        ? "border-[var(--vr-border)] opacity-35"
                        : "border-[var(--vr-border)] bg-white text-[var(--vr-text)] hover:border-[var(--vr-primary)]"
                    }`}
                  >
                    {ram} GB
                    {!checked && count > 0 && (
                      <span className="text-[9px] opacity-60">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* ── Storage ── */}
          <FilterSection
            title="Storage"
            subtitle="SSD / HDD capacity"
            icon={<HardDrive className="h-4 w-4" />}
            open={activeSection === "storage"}
            selectedCount={state.storageOptions.length}
            onToggle={() => setActiveSection((current) => (current === "storage" ? null : "storage"))}
          >
            <div className="flex flex-wrap gap-1.5">
              {storageOptions.map((storage) => {
                const count = counts.storageCounts[storage] ?? 0;
                const checked = state.storageOptions.includes(storage);
                const disabled = count === 0 && !checked;
                return (
                  <button
                    key={storage}
                    type="button"
                    disabled={disabled}
                    onClick={() => setState((current) => ({ ...current, storageOptions: toggleSelection(current.storageOptions, storage) }))}
                    className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition ${
                      checked
                        ? "border-[var(--vr-primary)] bg-[var(--vr-primary)] text-white shadow-[0_4px_14px_rgba(30,58,138,0.25)]"
                        : disabled
                        ? "border-[var(--vr-border)] opacity-35"
                        : "border-[var(--vr-border)] bg-white text-[var(--vr-text)] hover:border-[var(--vr-primary)]"
                    }`}
                  >
                    {formatStorageOption(storage)}
                    {!checked && count > 0 && (
                      <span className="text-[9px] opacity-60">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* ── Processor ── */}
          <FilterSection
            title="Processor"
            subtitle="CPU series"
            icon={<Cpu className="h-4 w-4" />}
            open={activeSection === "processor"}
            selectedCount={state.processorOptions.length}
            onToggle={() => setActiveSection((current) => (current === "processor" ? null : "processor"))}
          >
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input value={processorSearch} onChange={(event) => setProcessorSearch(event.target.value)} placeholder="Search processor..." className="vr-input pl-10 text-[12px]" />
              </div>
              <div className="vr-scrollbar grid max-h-48 gap-0.5 overflow-y-auto">
                {filteredProcessors.map((processor) => {
                  const count = counts.processorCounts[processor] ?? 0;
                  const checked = state.processorOptions.includes(processor);
                  const disabled = count === 0 && !checked;
                  return (
                    <FilterCheckbox
                      key={processor}
                      label={processor}
                      count={count}
                      checked={checked}
                      disabled={disabled}
                      onChange={() => setState((current) => ({ ...current, processorOptions: toggleSelection(current.processorOptions, processor) }))}
                    />
                  );
                })}
              </div>
            </div>
          </FilterSection>

          {/* ── OS ── */}
          {osOptions.length > 0 ? (
            <FilterSection
              title="Operating System"
              subtitle="Windows or macOS"
              icon={<Monitor className="h-4 w-4" />}
              open={activeSection === "displayAndOs"}
              selectedCount={state.displayOptions.length + state.osOptions.length}
              onToggle={() => setActiveSection((current) => (current === "displayAndOs" ? null : "displayAndOs"))}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {osOptions.map((os) => {
                    const count = counts.osCounts[os] ?? 0;
                    const checked = state.osOptions.includes(os);
                    const disabled = count === 0 && !checked;
                    return (
                      <button
                        key={os}
                        type="button"
                        disabled={disabled}
                        onClick={() => setState((current) => ({ ...current, osOptions: toggleSelection(current.osOptions, os) }))}
                        className={`rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition ${
                          checked
                            ? "border-[var(--vr-primary)] bg-[var(--vr-primary)] text-white"
                            : disabled
                            ? "border-[var(--vr-border)] opacity-35"
                            : "border-[var(--vr-border)] bg-white text-[var(--vr-text)] hover:border-[var(--vr-primary)]"
                        }`}
                      >
                        {os}
                      </button>
                    );
                  })}
                </div>
                {displayOptions.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--vr-muted)]">Display size</div>
                    <div className="grid gap-0.5">
                      {displayOptions.map((display) => {
                        const count = counts.displayCounts[display] ?? 0;
                        const checked = state.displayOptions.includes(display);
                        const disabled = count === 0 && !checked;
                        return (
                          <FilterCheckbox key={display} label={display} count={count} checked={checked} disabled={disabled}
                            onChange={() => setState((current) => ({ ...current, displayOptions: toggleSelection(current.displayOptions, display) }))}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </FilterSection>
          ) : null}

          {/* ── Condition & Quality ── */}
          <FilterSection
            title="Condition & Quality"
            subtitle="Grade and availability"
            icon={<Sparkles className="h-4 w-4" />}
            open={activeSection === "graphics"}
            selectedCount={state.conditions.length + state.graphicsOptions.length + (state.featuredOnly ? 1 : 0) + (state.inStockOnly ? 1 : 0)}
            onToggle={() => setActiveSection((current) => (current === "graphics" ? null : "graphics"))}
          >
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--vr-muted)]">Grade</div>
                <div className="grid gap-1.5">
                  {conditionOptions.map((option) => {
                    const count = counts.conditionCounts[option.value] ?? 0;
                    const checked = state.conditions.includes(option.value);
                    const disabled = count === 0 && !checked;
                    const meta = CONDITION_META[option.value] ?? { label: option.label, bg: "bg-slate-50", text: "text-slate-700", dot: "bg-slate-400" };
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => setState((current) => ({ ...current, conditions: toggleSelection(current.conditions, option.value as ProductCondition) }))}
                        className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition ${
                          checked
                            ? `border-[var(--vr-primary)] ${meta.bg} shadow-[0_0_0_2px_rgba(30,58,138,0.1)]`
                            : disabled
                            ? "cursor-not-allowed border-[var(--vr-border)] opacity-35"
                            : `border-[var(--vr-border)] bg-white hover:${meta.bg} hover:border-[var(--vr-primary)]`
                        }`}
                      >
                        <div className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                        <span className={`flex-1 text-[12px] font-semibold ${checked ? meta.text : "text-[var(--vr-text)]"}`}>{meta.label}</span>
                        <span className="text-[10px] text-[var(--vr-muted)]">{count}</span>
                        {checked && <Check className="h-3 w-3 text-[var(--vr-primary)]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {graphicsOptions.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--vr-muted)]">Graphics</div>
                  <div className="grid gap-0.5">
                    {graphicsOptions.map((graphics) => {
                      const count = counts.graphicsCounts[graphics] ?? 0;
                      const checked = state.graphicsOptions.includes(graphics);
                      const disabled = count === 0 && !checked;
                      return (
                        <FilterCheckbox key={graphics} label={graphics} count={count} checked={checked} disabled={disabled}
                          onChange={() => setState((current) => ({ ...current, graphicsOptions: toggleSelection(current.graphicsOptions, graphics) }))}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid gap-1.5 border-t border-[var(--vr-border)] pt-3">
                {[
                  { label: "Featured Products", checked: state.featuredOnly, count: counts.featuredCount, onChange: () => setState((c) => ({ ...c, featuredOnly: !c.featuredOnly })) },
                  { label: "In Stock Only",     checked: state.inStockOnly,  count: counts.inStockCount,  onChange: () => setState((c) => ({ ...c, inStockOnly: !c.inStockOnly })) },
                ].map(({ label, checked, count, onChange }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={onChange}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-[12px] font-semibold transition ${
                      checked
                        ? "border-[var(--vr-primary)] bg-[rgba(30,58,138,0.06)] text-[var(--vr-primary)]"
                        : "border-[var(--vr-border)] bg-white text-[var(--vr-text)] hover:border-[var(--vr-primary)] hover:bg-[var(--vr-surface-soft)]"
                    }`}
                  >
                    <span>{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--vr-muted)]">{count}</span>
                      <div className={`flex h-4 w-4 items-center justify-center rounded border-[1.5px] transition ${checked ? "border-[var(--vr-primary)] bg-[var(--vr-primary)]" : "border-slate-300"}`}>
                        {checked && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </FilterSection>

          </div>{/* end unified card */}
        </div>
      </div>
    </aside>
  );
}
