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
  stickyTop?: string;
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

const CONDITION_META: Record<string, { label: string; dot: string; text: string }> = {
  EXCELLENT: { label: "Grade A – Excellent", dot: "bg-emerald-500", text: "text-emerald-700" },
  GOOD:      { label: "Grade B – Good",      dot: "bg-blue-500",   text: "text-blue-700"   },
  FAIR:      { label: "Grade C – Fair",      dot: "bg-amber-500",  text: "text-amber-700"  },
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
  stickyTop,
  className = "",
  onClose,
  onClear,
  onApply,
  showCatalogSearch = true
}: FilterSidebarProps) {
  const isCompactSheet = !showCatalogSearch;
  const [brandSearch, setBrandSearch] = useState("");
  const [processorSearch, setProcessorSearch] = useState("");
  const [activeSection, setActiveSection] = useState<FilterSectionKey | null>(isCompactSheet ? "brand" : null);
  const [localSearch, setLocalSearch] = useState(state.q || "");
  const debouncedLocalSearch = useDebouncedValue(localSearch, 300);

  useEffect(() => {
    setState((current) => (current.q === debouncedLocalSearch ? current : { ...current, q: debouncedLocalSearch }));
  }, [debouncedLocalSearch, setState]);

  useEffect(() => {
    if (state.q !== debouncedLocalSearch) setLocalSearch(state.q || "");
  }, [state.q, debouncedLocalSearch]);

  useEffect(() => {
    setActiveSection((current) => current ?? (isCompactSheet ? "brand" : null));
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

  /* ── Pill button helper ── */
  function Pill({ label, checked, disabled, onClick }: { label: string; checked: boolean; disabled: boolean; onClick: () => void }) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
          checked
            ? "border-[var(--vr-primary)] bg-[var(--vr-primary)] text-white shadow-sm"
            : disabled
            ? "border-[var(--vr-border)] opacity-35"
            : "border-[var(--vr-border)] bg-white text-[var(--vr-text)] hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
        }`}
      >
        {label}
      </button>
    );
  }

  /* ─── Compact mobile sheet mode ─────────────────────────── */
  if (isCompactSheet) {
    return (
      <aside className={className}>
        <div className="flex flex-col gap-2 rounded-[1.2rem]">
          <FilterSection title="Brand" subtitle="Filter by manufacturer" icon={<Tag className="h-3.5 w-3.5" />}
            open={activeSection === "brand"} selectedCount={state.brandIds.length}
            onToggle={() => setActiveSection((c) => (c === "brand" ? null : "brand"))} compact>
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)} placeholder="Search brand…" className="vr-input pl-9 text-[13px]" />
              </div>
              <div className="vr-scrollbar grid max-h-52 gap-0.5 overflow-y-auto">
                {filteredBrands.map((brand) => {
                  const count = counts.brandCounts[brand.id] ?? 0;
                  const checked = state.brandIds.includes(brand.id);
                  return (
                    <FilterCheckbox key={brand.id} label={brand.name} count={count} checked={checked} disabled={count === 0 && !checked} logoUrl={brand.logoUrl ?? undefined}
                      onChange={() => setState((c) => ({ ...c, brandIds: toggleSelection(c.brandIds, brand.id) }))} />
                  );
                })}
              </div>
            </div>
          </FilterSection>
          <FilterSection title="RAM" subtitle="Memory size options" icon={<MemoryStick className="h-3.5 w-3.5" />}
            open={activeSection === "ram"} selectedCount={state.ramOptions.length}
            onToggle={() => setActiveSection((c) => (c === "ram" ? null : "ram"))} compact>
            <div className="flex flex-wrap gap-1.5">
              {ramOptions.map((ram) => {
                const count = counts.ramCounts[ram] ?? 0;
                const checked = state.ramOptions.includes(ram);
                return <Pill key={ram} label={`${ram} GB`} checked={checked} disabled={count === 0 && !checked}
                  onClick={() => setState((c) => ({ ...c, ramOptions: toggleSelection(c.ramOptions, ram) }))} />;
              })}
            </div>
          </FilterSection>
          <FilterSection title="Storage" subtitle="Drive capacity options" icon={<HardDrive className="h-3.5 w-3.5" />}
            open={activeSection === "storage"} selectedCount={state.storageOptions.length}
            onToggle={() => setActiveSection((c) => (c === "storage" ? null : "storage"))} compact>
            <div className="grid gap-0.5">
              {storageOptions.map((storage) => {
                const count = counts.storageCounts[storage] ?? 0;
                const checked = state.storageOptions.includes(storage);
                return <FilterCheckbox key={storage} label={formatStorageOption(storage)} count={count} checked={checked} disabled={count === 0 && !checked}
                  onChange={() => setState((c) => ({ ...c, storageOptions: toggleSelection(c.storageOptions, storage) }))} />;
              })}
            </div>
          </FilterSection>
          <FilterSection title="Processor" subtitle="Search by CPU" icon={<Cpu className="h-3.5 w-3.5" />}
            open={activeSection === "processor"} selectedCount={state.processorOptions.length}
            onToggle={() => setActiveSection((c) => (c === "processor" ? null : "processor"))} compact>
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input value={processorSearch} onChange={(e) => setProcessorSearch(e.target.value)} placeholder="Search CPU…" className="vr-input pl-9 text-[13px]" />
              </div>
              <div className="vr-scrollbar grid max-h-52 gap-0.5 overflow-y-auto">
                {filteredProcessors.map((processor) => {
                  const count = counts.processorCounts[processor] ?? 0;
                  const checked = state.processorOptions.includes(processor);
                  return <FilterCheckbox key={processor} label={processor} count={count} checked={checked} disabled={count === 0 && !checked}
                    onChange={() => setState((c) => ({ ...c, processorOptions: toggleSelection(c.processorOptions, processor) }))} />;
                })}
              </div>
            </div>
          </FilterSection>
          <FilterSection title="Categories" subtitle="Filter by product type" icon={<Laptop2 className="h-3.5 w-3.5" />}
            open={activeSection === "category"} selectedCount={state.categoryIds.length}
            onToggle={() => setActiveSection((c) => (c === "category" ? null : "category"))} compact>
            <div className="grid gap-0.5">
              {categories.map((category) => {
                const count = counts.categoryCounts[category.id] ?? 0;
                const checked = state.categoryIds.includes(category.id);
                return <FilterCheckbox key={category.id} label={category.name} count={count} checked={checked} disabled={count === 0 && !checked} iconUrl={category.iconUrl ?? undefined}
                  onChange={() => setState((c) => ({ ...c, categoryIds: toggleSelection(c.categoryIds, category.id) }))} />;
              })}
            </div>
          </FilterSection>
          <FilterSection title="Budget" subtitle="Set your price range" icon={<IndianRupee className="h-3.5 w-3.5" />}
            open={activeSection === "price"} selectedCount={state.minPrice.trim() || state.maxPrice.trim() ? 1 : 0}
            onToggle={() => setActiveSection((c) => (c === "price" ? null : "price"))} compact>
            <PriceSlider bounds={priceBounds} minValue={sliderMin} maxValue={sliderMax}
              minInput={state.minPrice} maxInput={state.maxPrice}
              onMinSliderChange={setMinPrice} onMaxSliderChange={setMaxPrice}
              onMinInputChange={(v) => setState((c) => ({ ...c, minPrice: v }))}
              onMaxInputChange={(v) => setState((c) => ({ ...c, maxPrice: v }))}
              onMinInputCommit={commitMinPrice} onMaxInputCommit={commitMaxPrice} />
          </FilterSection>
          <FilterSection title="Condition" subtitle="Quality grade" icon={<Sparkles className="h-3.5 w-3.5" />}
            open={activeSection === "graphics"} selectedCount={state.conditions.length}
            onToggle={() => setActiveSection((c) => (c === "graphics" ? null : "graphics"))} compact>
            <div className="grid gap-0.5">
              {conditionOptions.map((option) => {
                const count = counts.conditionCounts[option.value] ?? 0;
                const checked = state.conditions.includes(option.value);
                return <FilterCheckbox key={option.value} label={option.label} count={count} checked={checked} disabled={count === 0 && !checked}
                  onChange={() => setState((c) => ({ ...c, conditions: toggleSelection(c.conditions, option.value as ProductCondition) }))} />;
              })}
            </div>
          </FilterSection>
        </div>
      </aside>
    );
  }

  /* ─── Desktop sidebar mode ────────────────────────────────── */
  return (
    <aside
      className={`${sticky ? "lg:sticky" : ""} flex h-full flex-col ${className}`.trim()}
      style={sticky ? {
        top: stickyTop ?? "var(--sticky-offset, 9.5rem)",
      } : undefined}
    >
      {/* ── Header card ── */}
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2 rounded-xl border border-[var(--vr-border)] bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[var(--vr-primary)]" />
          <span className="text-[14px] font-bold text-[var(--vr-text)]">Filters</span>
          {totalActive > 0 && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--vr-primary)] px-1 text-[10px] font-extrabold text-white">
              {totalActive}
            </span>
          )}
        </div>
        {totalActive > 0 && (
          <button type="button" onClick={onClear}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-[var(--vr-danger)] transition hover:bg-rose-50">
            <X className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* ── Filter sections ── */}
      <div className="flex flex-col gap-2 pb-4">

          {/* Search */}
          {showCatalogSearch && (
            <div className="overflow-hidden rounded-xl border border-[var(--vr-border)] bg-white px-3 py-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Brand, model, processor…"
                  className="vr-input pl-9 text-[12px]"
                />
                {localSearch && (
                  <button type="button" onClick={() => setLocalSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--vr-danger)]">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Category ── */}
          <FilterSection
            title="Category" subtitle="Filter by product type" icon={<Laptop2 className="h-3.5 w-3.5" />}
            open={activeSection === "category"} selectedCount={state.categoryIds.length}
            onToggle={() => setActiveSection((c) => (c === "category" ? null : "category"))}
          >
            <div className="grid gap-0.5">
              {categories.map((category) => {
                const count = counts.categoryCounts[category.id] ?? 0;
                const checked = state.categoryIds.includes(category.id);
                const disabled = count === 0 && !checked;
                return (
                  <button
                    key={category.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setState((c) => ({ ...c, categoryIds: toggleSelection(c.categoryIds, category.id) }))}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                      checked ? "bg-[rgba(30,58,138,0.07)] text-[var(--vr-primary)]"
                      : disabled ? "cursor-not-allowed opacity-35"
                      : "hover:bg-white"
                    }`}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--vr-border)] bg-white">
                      {category.iconUrl
                        ? <img src={category.iconUrl} alt="" className="h-4 w-4 object-contain" />
                        : <Laptop2 className="h-3.5 w-3.5 text-[var(--vr-muted)]" />}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{category.name}</span>
                    <span className="shrink-0 text-[10px] text-[var(--vr-muted)]">{count}</span>
                    {checked && <Check className="h-3 w-3 shrink-0 text-[var(--vr-primary)]" />}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* ── Brand ── */}
          <FilterSection
            title="Brand" subtitle="Filter by manufacturer" icon={<Tag className="h-3.5 w-3.5" />}
            open={activeSection === "brand"} selectedCount={state.brandIds.length}
            onToggle={() => setActiveSection((c) => (c === "brand" ? null : "brand"))}
          >
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)} placeholder="Search brand…" className="vr-input pl-9 text-[12px]" />
              </div>
              <div className="vr-scrollbar grid max-h-52 gap-0.5 overflow-y-auto">
                {filteredBrands.map((brand) => {
                  const count = counts.brandCounts[brand.id] ?? 0;
                  const checked = state.brandIds.includes(brand.id);
                  return (
                    <FilterCheckbox key={brand.id} label={brand.name} count={count} checked={checked}
                      disabled={count === 0 && !checked} logoUrl={brand.logoUrl ?? undefined}
                      onChange={() => setState((c) => ({ ...c, brandIds: toggleSelection(c.brandIds, brand.id) }))} />
                  );
                })}
              </div>
            </div>
          </FilterSection>

          {/* ── Budget ── */}
          <FilterSection
            title="Budget" subtitle="Set your price range" icon={<IndianRupee className="h-3.5 w-3.5" />}
            open={activeSection === "price"} selectedCount={state.minPrice.trim() || state.maxPrice.trim() ? 1 : 0}
            onToggle={() => setActiveSection((c) => (c === "price" ? null : "price"))}
          >
            <div className="space-y-4">
              <PriceSlider
                bounds={priceBounds} minValue={sliderMin} maxValue={sliderMax}
                minInput={state.minPrice} maxInput={state.maxPrice}
                onMinSliderChange={setMinPrice} onMaxSliderChange={setMaxPrice}
                onMinInputChange={(v) => setState((c) => ({ ...c, minPrice: v }))}
                onMaxInputChange={(v) => setState((c) => ({ ...c, maxPrice: v }))}
                onMinInputCommit={commitMinPrice} onMaxInputCommit={commitMaxPrice}
              />
            </div>
          </FilterSection>

          {/* ── RAM ── */}
          <FilterSection
            title="RAM" subtitle="Memory size options" icon={<MemoryStick className="h-3.5 w-3.5" />}
            open={activeSection === "ram"} selectedCount={state.ramOptions.length}
            onToggle={() => setActiveSection((c) => (c === "ram" ? null : "ram"))}
          >
            <div className="flex flex-wrap gap-1.5">
              {ramOptions.map((ram) => {
                const count = counts.ramCounts[ram] ?? 0;
                const checked = state.ramOptions.includes(ram);
                return (
                  <Pill key={ram} label={`${ram} GB`} checked={checked} disabled={count === 0 && !checked}
                    onClick={() => setState((c) => ({ ...c, ramOptions: toggleSelection(c.ramOptions, ram) }))} />
                );
              })}
            </div>
          </FilterSection>

          {/* ── Storage ── */}
          <FilterSection
            title="Storage" subtitle="Drive capacity options" icon={<HardDrive className="h-3.5 w-3.5" />}
            open={activeSection === "storage"} selectedCount={state.storageOptions.length}
            onToggle={() => setActiveSection((c) => (c === "storage" ? null : "storage"))}
          >
            <div className="flex flex-wrap gap-1.5">
              {storageOptions.map((storage) => {
                const count = counts.storageCounts[storage] ?? 0;
                const checked = state.storageOptions.includes(storage);
                return (
                  <Pill key={storage} label={formatStorageOption(storage)} checked={checked} disabled={count === 0 && !checked}
                    onClick={() => setState((c) => ({ ...c, storageOptions: toggleSelection(c.storageOptions, storage) }))} />
                );
              })}
            </div>
          </FilterSection>

          {/* ── Processor ── */}
          <FilterSection
            title="Processor" subtitle="Search by CPU" icon={<Cpu className="h-3.5 w-3.5" />}
            open={activeSection === "processor"} selectedCount={state.processorOptions.length}
            onToggle={() => setActiveSection((c) => (c === "processor" ? null : "processor"))}
          >
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input value={processorSearch} onChange={(e) => setProcessorSearch(e.target.value)} placeholder="Search processor…" className="vr-input pl-9 text-[12px]" />
              </div>
              <div className="vr-scrollbar grid max-h-48 gap-0.5 overflow-y-auto">
                {filteredProcessors.map((processor) => {
                  const count = counts.processorCounts[processor] ?? 0;
                  const checked = state.processorOptions.includes(processor);
                  return (
                    <FilterCheckbox key={processor} label={processor} count={count} checked={checked}
                      disabled={count === 0 && !checked}
                      onChange={() => setState((c) => ({ ...c, processorOptions: toggleSelection(c.processorOptions, processor) }))} />
                  );
                })}
              </div>
            </div>
          </FilterSection>

          {/* ── OS + Display ── */}
          {osOptions.length > 0 && (
            <FilterSection
              title="OS & Display" subtitle="Software & screen size" icon={<Monitor className="h-3.5 w-3.5" />}
              open={activeSection === "displayAndOs"}
              selectedCount={state.displayOptions.length + state.osOptions.length}
              onToggle={() => setActiveSection((c) => (c === "displayAndOs" ? null : "displayAndOs"))}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {osOptions.map((os) => {
                    const count = counts.osCounts[os] ?? 0;
                    const checked = state.osOptions.includes(os);
                    return (
                      <Pill key={os} label={os} checked={checked} disabled={count === 0 && !checked}
                        onClick={() => setState((c) => ({ ...c, osOptions: toggleSelection(c.osOptions, os) }))} />
                    );
                  })}
                </div>
                {displayOptions.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--vr-muted)]">Display size</div>
                    <div className="grid gap-0.5">
                      {displayOptions.map((display) => {
                        const count = counts.displayCounts[display] ?? 0;
                        const checked = state.displayOptions.includes(display);
                        return (
                          <FilterCheckbox key={display} label={display} count={count} checked={checked}
                            disabled={count === 0 && !checked}
                            onChange={() => setState((c) => ({ ...c, displayOptions: toggleSelection(c.displayOptions, display) }))} />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </FilterSection>
          )}

          {/* ── Condition & Quality ── */}
          <FilterSection
            title="Condition" subtitle="Quality grade" icon={<Sparkles className="h-3.5 w-3.5" />}
            open={activeSection === "graphics"}
            selectedCount={state.conditions.length + state.graphicsOptions.length + (state.featuredOnly ? 1 : 0) + (state.inStockOnly ? 1 : 0)}
            onToggle={() => setActiveSection((c) => (c === "graphics" ? null : "graphics"))}
          >
            <div className="space-y-3">
              {/* Grade buttons */}
              <div className="grid gap-1.5">
                {conditionOptions.map((option) => {
                  const count = counts.conditionCounts[option.value] ?? 0;
                  const checked = state.conditions.includes(option.value);
                  const disabled = count === 0 && !checked;
                  const meta = CONDITION_META[option.value] ?? { label: option.label, dot: "bg-slate-400", text: "text-slate-700" };
                  return (
                    <button key={option.value} type="button" disabled={disabled}
                      onClick={() => setState((c) => ({ ...c, conditions: toggleSelection(c.conditions, option.value as ProductCondition) }))}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition ${
                        checked
                          ? "border-[var(--vr-primary)] bg-[rgba(30,58,138,0.05)]"
                          : disabled ? "cursor-not-allowed border-[var(--vr-border)] opacity-35"
                          : "border-[var(--vr-border)] bg-white hover:border-[var(--vr-primary)]"
                      }`}>
                      <div className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                      <span className={`flex-1 text-[12px] font-semibold ${checked ? meta.text : "text-[var(--vr-text)]"}`}>{meta.label}</span>
                      <span className="text-[10px] text-[var(--vr-muted)]">{count}</span>
                      {checked && <Check className="h-3 w-3 text-[var(--vr-primary)]" />}
                    </button>
                  );
                })}
              </div>

              {/* Graphics */}
              {graphicsOptions.length > 0 && (
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--vr-muted)]">Graphics</div>
                  <div className="grid gap-0.5">
                    {graphicsOptions.map((graphics) => {
                      const count = counts.graphicsCounts[graphics] ?? 0;
                      const checked = state.graphicsOptions.includes(graphics);
                      return (
                        <FilterCheckbox key={graphics} label={graphics} count={count} checked={checked}
                          disabled={count === 0 && !checked}
                          onChange={() => setState((c) => ({ ...c, graphicsOptions: toggleSelection(c.graphicsOptions, graphics) }))} />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Toggle chips */}
              <div className="grid gap-1.5 border-t border-[var(--vr-border)] pt-3">
                {[
                  { label: "Featured only", checked: state.featuredOnly, count: counts.featuredCount, onChange: () => setState((c) => ({ ...c, featuredOnly: !c.featuredOnly })) },
                  { label: "In stock only", checked: state.inStockOnly,  count: counts.inStockCount,  onChange: () => setState((c) => ({ ...c, inStockOnly: !c.inStockOnly })) },
                ].map(({ label, checked, count, onChange }) => (
                  <button key={label} type="button" onClick={onChange}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-[12px] font-semibold transition ${
                      checked
                        ? "border-[var(--vr-primary)] bg-[rgba(30,58,138,0.05)] text-[var(--vr-primary)]"
                        : "border-[var(--vr-border)] bg-white hover:border-[var(--vr-primary)]"
                    }`}>
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

      </div>
    </aside>
  );
}
