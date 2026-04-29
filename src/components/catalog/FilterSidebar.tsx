import {
  ChevronDown,
  Cpu,
  HardDrive,
  IndianRupee,
  MemoryStick,
  Search,
  Shapes,
  SlidersHorizontal,
  Tag
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { Brand, Category } from "types";

export interface CatalogFilterState {
  q: string;
  brandIds: number[];
  categoryIds: number[];
  processorOptions: string[];
  ramOptions: number[];
  storageOptions: number[];
  minPrice: string;
  maxPrice: string;
}

interface FilterSidebarProps {
  brands: Brand[];
  categories: Category[];
  categoryProductCounts?: Record<number, number>;
  processors: string[];
  ramOptions: number[];
  storageOptions: number[];
  priceBounds: { min: number; max: number };
  state: CatalogFilterState;
  setState: Dispatch<SetStateAction<CatalogFilterState>>;
}

type FilterSectionKey = "brand" | "ram" | "storage" | "processor" | "category" | "price";

function toggleSelection<T>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function formatStorage(storageGb: number) {
  return storageGb >= 1024 ? `${storageGb / 1024} TB` : `${storageGb} GB`;
}

function formatCurrency(value: number) {
  return `Rs. ${value.toLocaleString()}`;
}

function clampPrice(value: number, bounds: { min: number; max: number }) {
  return Math.min(bounds.max, Math.max(bounds.min, value));
}

export function FilterSidebar({
  brands,
  categories,
  categoryProductCounts = {},
  processors,
  ramOptions,
  storageOptions,
  priceBounds,
  state,
  setState
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

  const sliderMin = clampPrice(state.minPrice.trim() ? Number(state.minPrice) : priceBounds.min, priceBounds);
  const sliderMax = clampPrice(state.maxPrice.trim() ? Number(state.maxPrice) : priceBounds.max, priceBounds);
  const rangeStep = Math.max(500, Math.round((priceBounds.max - priceBounds.min) / 120));
  const safeRange = Math.max(1, priceBounds.max - priceBounds.min);
  const minProgress = ((sliderMin - priceBounds.min) / safeRange) * 100;
  const maxProgress = ((sliderMax - priceBounds.min) / safeRange) * 100;

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

  function clearFilters() {
    setState({
      q: "",
      brandIds: [],
      categoryIds: [],
      processorOptions: [],
      ramOptions: [],
      storageOptions: [],
      minPrice: "",
      maxPrice: ""
    });
    setBrandSearch("");
    setProcessorSearch("");
  }

  function renderSectionHeader(key: FilterSectionKey, title: string, icon: ReactNode, count?: number) {
    const open = activeSection === key;

    return (
      <button
        type="button"
        onClick={() => setActiveSection(open ? null : key)}
        className="flex w-full items-center justify-between gap-3 rounded-[1.2rem] px-1 py-1 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-2.5 text-[#a6d85e]">{icon}</div>
          <div>
            <div className="text-sm font-semibold text-white">{title}</div>
            <div className="text-xs text-white/36">{count ? `${count} selected` : "Choose options"}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {count ? (
            <span className="rounded-full bg-[#89c73a]/15 px-2.5 py-1 text-xs font-semibold text-[#bde676]">{count}</span>
          ) : null}
          <ChevronDown className={`h-4 w-4 text-white/48 transition ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
    );
  }

  return (
    <aside className="store-dark-panel sticky top-28 h-fit p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#89c73a] p-3 text-[#101510]">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/36">Filters</div>
            <div className="mt-1 text-lg font-semibold text-white">Refine Your Search</div>
          </div>
        </div>
        <button type="button" onClick={clearFilters} className="text-sm font-semibold text-white/55 transition hover:text-white">
          Clear all
        </button>
      </div>

      <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Search className="h-4 w-4 text-[#a6d85e]" />
          Search catalog
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" />
          <input
            value={state.q}
            onChange={(event) => setState((current) => ({ ...current, q: event.target.value }))}
            placeholder="Brand, model, processor..."
            className="store-field pl-11"
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <section className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-4">
          {renderSectionHeader("category", "Category", <Shapes className="h-4 w-4" />, state.categoryIds.length)}
          {activeSection === "category" ? (
            <div className="mt-4 grid gap-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-sm ${
                    (categoryProductCounts[category.id] ?? 0) > 0 || state.categoryIds.includes(category.id)
                      ? "border-white/8 bg-black/20 text-white/74"
                      : "border-white/6 bg-white/[0.015] text-white/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={state.categoryIds.includes(category.id)}
                      disabled={(categoryProductCounts[category.id] ?? 0) === 0 && !state.categoryIds.includes(category.id)}
                      onChange={() =>
                        setState((current) => ({
                          ...current,
                          categoryIds: toggleSelection(current.categoryIds, category.id)
                        }))
                      }
                      className="h-4 w-4 rounded border-white/20 bg-transparent text-[#89c73a] focus:ring-[#89c73a]"
                    />
                    <span>{category.name}</span>
                  </div>
                  <span className="rounded-full bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/45">
                    {categoryProductCounts[category.id] ?? 0}
                  </span>
                </label>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-4">
          {renderSectionHeader("brand", "Brand", <Tag className="h-4 w-4" />, state.brandIds.length)}
          {activeSection === "brand" ? (
            <div className="mt-4 space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" />
                <input
                  value={brandSearch}
                  onChange={(event) => setBrandSearch(event.target.value)}
                  placeholder="Search brand..."
                  className="store-field pl-11"
                />
              </div>
              <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
                {filteredBrands.map((brand) => (
                  <label
                    key={brand.id}
                    className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/20 px-3 py-3 text-sm text-white/74"
                  >
                    <input
                      type="checkbox"
                      checked={state.brandIds.includes(brand.id)}
                      onChange={() => setState((current) => ({ ...current, brandIds: toggleSelection(current.brandIds, brand.id) }))}
                      className="h-4 w-4 rounded border-white/20 bg-transparent text-[#89c73a] focus:ring-[#89c73a]"
                    />
                    <span>{brand.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-4">
          {renderSectionHeader("price", "Price", <IndianRupee className="h-4 w-4" />, state.minPrice.trim() || state.maxPrice.trim() ? 1 : 0)}
          {activeSection === "price" ? (
            <div className="mt-4 space-y-5">
              <div className="rounded-[1.25rem] border border-white/8 bg-black/20 p-4">
                <div className="relative px-2">
                  <div className="absolute left-2 right-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/12" />
                  <div
                    className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#89c73a]"
                    style={{ left: `calc(${minProgress}% + 0.5rem)`, right: `calc(${100 - maxProgress}% + 0.5rem)` }}
                  />
                  <input
                    type="range"
                    min={priceBounds.min}
                    max={priceBounds.max}
                    step={rangeStep}
                    value={sliderMin}
                    onChange={(event) => setMinPrice(Number(event.target.value))}
                    className="relative h-6 w-full cursor-pointer appearance-none bg-transparent accent-[#89c73a]"
                  />
                  <input
                    type="range"
                    min={priceBounds.min}
                    max={priceBounds.max}
                    step={rangeStep}
                    value={sliderMax}
                    onChange={(event) => setMaxPrice(Number(event.target.value))}
                    className="relative -mt-6 h-6 w-full cursor-pointer appearance-none bg-transparent accent-[#89c73a]"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm font-semibold text-white/78">
                  <span>{formatCurrency(sliderMin)}</span>
                  <span>{formatCurrency(sliderMax)}</span>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <input
                  value={state.minPrice}
                  onChange={(event) => setState((current) => ({ ...current, minPrice: event.target.value }))}
                  placeholder={formatCurrency(priceBounds.min)}
                  className="store-field"
                />
                <span className="text-white/28">-</span>
                <input
                  value={state.maxPrice}
                  onChange={(event) => setState((current) => ({ ...current, maxPrice: event.target.value }))}
                  placeholder={formatCurrency(priceBounds.max)}
                  className="store-field"
                />
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-4">
          {renderSectionHeader("ram", "RAM", <MemoryStick className="h-4 w-4" />, state.ramOptions.length)}
          {activeSection === "ram" ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {ramOptions.map((ram) => {
                const selected = state.ramOptions.includes(ram);
                return (
                  <button
                    key={ram}
                    type="button"
                    onClick={() => setState((current) => ({ ...current, ramOptions: toggleSelection(current.ramOptions, ram) }))}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      selected
                        ? "border-[#89c73a] bg-[#89c73a] text-[#101510]"
                        : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {ram} GB
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>

        <section className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-4">
          {renderSectionHeader("storage", "Storage", <HardDrive className="h-4 w-4" />, state.storageOptions.length)}
          {activeSection === "storage" ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {storageOptions.map((storage) => {
                const selected = state.storageOptions.includes(storage);
                return (
                  <button
                    key={storage}
                    type="button"
                    onClick={() =>
                      setState((current) => ({ ...current, storageOptions: toggleSelection(current.storageOptions, storage) }))
                    }
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      selected
                        ? "border-[#89c73a] bg-[#89c73a] text-[#101510]"
                        : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {formatStorage(storage)}
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>

        <section className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-4">
          {renderSectionHeader("processor", "Processor", <Cpu className="h-4 w-4" />, state.processorOptions.length)}
          {activeSection === "processor" ? (
            <div className="mt-4 space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" />
                <input
                  value={processorSearch}
                  onChange={(event) => setProcessorSearch(event.target.value)}
                  placeholder="Search processor..."
                  className="store-field pl-11"
                />
              </div>
              <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
                {filteredProcessors.map((processor) => (
                  <label
                    key={processor}
                    className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/20 px-3 py-3 text-sm text-white/74"
                  >
                    <input
                      type="checkbox"
                      checked={state.processorOptions.includes(processor)}
                      onChange={() =>
                        setState((current) => ({
                          ...current,
                          processorOptions: toggleSelection(current.processorOptions, processor)
                        }))
                      }
                      className="h-4 w-4 rounded border-white/20 bg-transparent text-[#89c73a] focus:ring-[#89c73a]"
                    />
                    <span>{processor}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </aside>
  );
}
