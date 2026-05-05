import { useEffect, useMemo, useState } from "react";
import { Boxes, Cpu, HardDrive, IndianRupee, MemoryStick, PackageCheck, Search, Shapes, Tag } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "components/ui/Button";
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

interface FilterSidebarProps {
  brands: Brand[];
  categories: Category[];
  processors: string[];
  ramOptions: number[];
  storageOptions: number[];
  priceBounds: { min: number; max: number };
  counts: CatalogFilterCounts;
  state: CatalogFilterState;
  setState: Dispatch<SetStateAction<CatalogFilterState>>;
  sticky?: boolean;
  className?: string;
  onClose?: () => void;
  onClear: () => void;
  onApply?: () => void;
}

type FilterSectionKey = "category" | "brand" | "price" | "ram" | "storage" | "processor" | "condition" | "availability";

function toggleSelection<T>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function clampPrice(value: number, bounds: { min: number; max: number }) {
  return Math.min(bounds.max, Math.max(bounds.min, value));
}

function getConditionSelectionCount(conditions: ProductCondition[]) {
  return conditions.length;
}

function clampManualPrice(value: string, bounds: { min: number; max: number }) {
  const parsed = parseCatalogPrice(value);
  if (typeof parsed !== "number") {
    return "";
  }
  return String(clampPrice(parsed, bounds));
}

export function FilterSidebar({
  brands,
  categories,
  processors,
  ramOptions,
  storageOptions,
  priceBounds,
  counts,
  state,
  setState,
  sticky = true,
  className = "",
  onClose,
  onClear,
  onApply
}: FilterSidebarProps) {
  const [brandSearch, setBrandSearch] = useState("");
  const [processorSearch, setProcessorSearch] = useState("");
  const [activeSection, setActiveSection] = useState<FilterSectionKey | null>("category");

  const filteredBrands = useMemo(
    () => brands.filter((brand) => brand.name.toLowerCase().includes(brandSearch.trim().toLowerCase())),
    [brandSearch, brands]
  );
  const filteredProcessors = useMemo(
    () => processors.filter((processor) => processor.toLowerCase().includes(processorSearch.trim().toLowerCase())),
    [processorSearch, processors]
  );

  useEffect(() => {
    if (state.categoryIds.length) {
      setActiveSection("category");
      return;
    }
    if (state.brandIds.length) {
      setActiveSection("brand");
      return;
    }
    if (state.minPrice.trim() || state.maxPrice.trim()) {
      setActiveSection("price");
    }
  }, [state.brandIds.length, state.categoryIds.length, state.maxPrice, state.minPrice]);

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

  return (
    <aside className={`${sticky ? "lg:sticky lg:top-[13rem] lg:h-fit" : ""} ${className}`}>
      <div className="rounded-[1.8rem] border border-[var(--vr-border)] bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--vr-primary)]">Filters</div>
            <div className="mt-1 text-lg font-bold text-[var(--vr-text)]">Refine Products</div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClear} className="text-sm font-semibold text-[var(--vr-muted)] transition hover:text-[var(--vr-primary)]">
              Clear All
            </button>
            {onClose ? (
              <button type="button" onClick={onClose} className="rounded-full border border-[var(--vr-border)] p-2 text-slate-500 lg:hidden">
                Close
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--vr-text)]">
            <Search className="h-4 w-4 text-[var(--vr-primary)]" />
            Search catalog
          </div>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={state.q}
              onChange={(event) => setState((current) => ({ ...current, q: event.target.value }))}
              placeholder="Brand, model, processor..."
              className="vr-input pl-11"
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <FilterSection
            title="Category"
            subtitle={`${state.categoryIds.length || 0} selected`}
            icon={<Shapes className="h-4 w-4" />}
            open={activeSection === "category"}
            selectedCount={state.categoryIds.length}
            onToggle={() => setActiveSection((current) => (current === "category" ? null : "category"))}
          >
            <div className="grid gap-2">
              {categories.map((category) => {
                const count = counts.categoryCounts[category.id] ?? 0;
                const checked = state.categoryIds.includes(category.id);
                const disabled = count === 0 && !checked;

                return (
                  <FilterCheckbox
                    key={category.id}
                    label={category.name}
                    count={count}
                    checked={checked}
                    disabled={disabled}
                    onChange={() => setState((current) => ({ ...current, categoryIds: toggleSelection(current.categoryIds, category.id) }))}
                  />
                );
              })}
            </div>
          </FilterSection>

          <FilterSection
            title="Brand"
            subtitle={`${state.brandIds.length || 0} selected`}
            icon={<Tag className="h-4 w-4" />}
            open={activeSection === "brand"}
            selectedCount={state.brandIds.length}
            onToggle={() => setActiveSection((current) => (current === "brand" ? null : "brand"))}
          >
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={brandSearch} onChange={(event) => setBrandSearch(event.target.value)} placeholder="Search brand..." className="vr-input pl-11" />
              </div>
              <div className="vr-scrollbar grid max-h-64 gap-2 overflow-y-auto pr-1">
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
                      onChange={() => setState((current) => ({ ...current, brandIds: toggleSelection(current.brandIds, brand.id) }))}
                    />
                  );
                })}
              </div>
            </div>
          </FilterSection>

          <FilterSection
            title="Price Range"
            subtitle="Set min and max"
            icon={<IndianRupee className="h-4 w-4" />}
            open={activeSection === "price"}
            selectedCount={state.minPrice.trim() || state.maxPrice.trim() ? 1 : 0}
            onToggle={() => setActiveSection((current) => (current === "price" ? null : "price"))}
          >
            <PriceSlider
              bounds={priceBounds}
              minValue={sliderMin}
              maxValue={sliderMax}
              minInput={state.minPrice}
              maxInput={state.maxPrice}
              onMinSliderChange={setMinPrice}
              onMaxSliderChange={setMaxPrice}
              onMinInputChange={(value) => setState((current) => ({ ...current, minPrice: value }))}
              onMaxInputChange={(value) => setState((current) => ({ ...current, maxPrice: value }))}
              onMinInputCommit={commitMinPrice}
              onMaxInputCommit={commitMaxPrice}
            />
          </FilterSection>

          <FilterSection
            title="RAM"
            subtitle={`${state.ramOptions.length || 0} selected`}
            icon={<MemoryStick className="h-4 w-4" />}
            open={activeSection === "ram"}
            selectedCount={state.ramOptions.length}
            onToggle={() => setActiveSection((current) => (current === "ram" ? null : "ram"))}
          >
            <div className="grid gap-2">
              {ramOptions.map((ram) => {
                const count = counts.ramCounts[ram] ?? 0;
                const checked = state.ramOptions.includes(ram);
                const disabled = count === 0 && !checked;

                return (
                  <FilterCheckbox
                    key={ram}
                    label={`${ram} GB`}
                    count={count}
                    checked={checked}
                    disabled={disabled}
                    onChange={() => setState((current) => ({ ...current, ramOptions: toggleSelection(current.ramOptions, ram) }))}
                  />
                );
              })}
            </div>
          </FilterSection>

          <FilterSection
            title="Storage"
            subtitle={`${state.storageOptions.length || 0} selected`}
            icon={<HardDrive className="h-4 w-4" />}
            open={activeSection === "storage"}
            selectedCount={state.storageOptions.length}
            onToggle={() => setActiveSection((current) => (current === "storage" ? null : "storage"))}
          >
            <div className="grid gap-2">
              {storageOptions.map((storage) => {
                const count = counts.storageCounts[storage] ?? 0;
                const checked = state.storageOptions.includes(storage);
                const disabled = count === 0 && !checked;

                return (
                  <FilterCheckbox
                    key={storage}
                    label={formatStorageOption(storage)}
                    count={count}
                    checked={checked}
                    disabled={disabled}
                    onChange={() => setState((current) => ({ ...current, storageOptions: toggleSelection(current.storageOptions, storage) }))}
                  />
                );
              })}
            </div>
          </FilterSection>

          <FilterSection
            title="Processor"
            subtitle={`${state.processorOptions.length || 0} selected`}
            icon={<Cpu className="h-4 w-4" />}
            open={activeSection === "processor"}
            selectedCount={state.processorOptions.length}
            onToggle={() => setActiveSection((current) => (current === "processor" ? null : "processor"))}
          >
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={processorSearch} onChange={(event) => setProcessorSearch(event.target.value)} placeholder="Search processor..." className="vr-input pl-11" />
              </div>
              <div className="vr-scrollbar grid max-h-64 gap-2 overflow-y-auto pr-1">
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

          <FilterSection
            title="Condition"
            subtitle={`${getConditionSelectionCount(state.conditions)} selected`}
            icon={<Boxes className="h-4 w-4" />}
            open={activeSection === "condition"}
            selectedCount={state.conditions.length}
            onToggle={() => setActiveSection((current) => (current === "condition" ? null : "condition"))}
          >
            <div className="grid gap-2">
              {conditionOptions.map((option) => {
                const count = counts.conditionCounts[option.value] ?? 0;
                const checked = state.conditions.includes(option.value);
                const disabled = count === 0 && !checked;

                return (
                  <FilterCheckbox
                    key={option.value}
                    label={option.label}
                    count={count}
                    checked={checked}
                    disabled={disabled}
                    onChange={() => setState((current) => ({ ...current, conditions: toggleSelection(current.conditions, option.value) }))}
                  />
                );
              })}
            </div>
          </FilterSection>

          <FilterSection
            title="Availability"
            subtitle={state.inStockOnly ? "1 selected" : "Choose options"}
            icon={<PackageCheck className="h-4 w-4" />}
            open={activeSection === "availability"}
            selectedCount={state.inStockOnly ? 1 : 0}
            onToggle={() => setActiveSection((current) => (current === "availability" ? null : "availability"))}
          >
            <FilterCheckbox
              label="In Stock"
              count={counts.inStockCount}
              checked={state.inStockOnly}
              disabled={counts.inStockCount === 0 && !state.inStockOnly}
              onChange={() => setState((current) => ({ ...current, inStockOnly: !current.inStockOnly }))}
            />
          </FilterSection>
        </div>

        {onApply ? (
          <div className="mt-4 lg:hidden">
            <Button fullWidth size="lg" onClick={onApply}>
              Apply Filters
            </Button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
