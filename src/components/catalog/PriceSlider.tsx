import { IndianRupee } from "lucide-react";
import { formatCurrency } from "../../utils/catalog";

interface PriceSliderProps {
  bounds: { min: number; max: number };
  minValue: number;
  maxValue: number;
  minInput: string;
  maxInput: string;
  onMinSliderChange: (value: number) => void;
  onMaxSliderChange: (value: number) => void;
  onMinInputChange: (value: string) => void;
  onMaxInputChange: (value: string) => void;
  onMinInputCommit: () => void;
  onMaxInputCommit: () => void;
}

export function PriceSlider({
  bounds,
  minValue,
  maxValue,
  minInput,
  maxInput,
  onMinSliderChange,
  onMaxSliderChange,
  onMinInputChange,
  onMaxInputChange,
  onMinInputCommit,
  onMaxInputCommit
}: PriceSliderProps) {
  const rangeStep = Math.max(500, Math.round((bounds.max - bounds.min) / 120));
  const safeRange = Math.max(1, bounds.max - bounds.min);
  const minProgress = ((minValue - bounds.min) / safeRange) * 100;
  const maxProgress = ((maxValue - bounds.min) / safeRange) * 100;

  const quickBudgets = [
    { label: "Under ₹25k", min: bounds.min, max: 25000 },
    { label: "₹25k–₹40k", min: 25000, max: 40000 },
    { label: "₹40k–₹60k", min: 40000, max: 60000 },
    { label: "Above ₹60k", min: 60000, max: bounds.max }
  ];

  const handleBudgetClick = (min: number, max: number) => {
    onMinInputChange(String(min));
    onMaxInputChange(String(max));
    setTimeout(() => {
      onMinInputCommit();
      onMaxInputCommit();
    }, 10);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-100 bg-white p-3 pb-4 shadow-sm">
        <div className="mb-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--vr-primary)]">Selected Range</div>
          <div className="mt-1 text-xs text-slate-500">Drag the handles or type a budget.</div>
        </div>
        <div className="mb-4 inline-flex items-center justify-center rounded-full border border-blue-100 bg-blue-50/50 px-3 py-1.5 text-[11px] font-bold tracking-wide text-blue-700">
          Rs. {minInput || bounds.min} to Rs. {maxInput || bounds.max}
        </div>

        <div className="relative mt-2 px-1.5">
          <div className="absolute left-1.5 right-1.5 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-200" />
          <div
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,var(--vr-primary),#3b82f6)]"
            style={{ left: `calc(${minProgress}% + 0.375rem)`, right: `calc(${100 - maxProgress}% + 0.375rem)` }}
          />
          <input
            type="range"
            min={bounds.min}
            max={bounds.max}
            step={rangeStep}
            value={minValue}
            onChange={(event) => onMinSliderChange(Number(event.target.value))}
            className="vr-range-input relative h-5 w-full cursor-pointer bg-transparent"
          />
          <input
            type="range"
            min={bounds.min}
            max={bounds.max}
            step={rangeStep}
            value={maxValue}
            onChange={(event) => onMaxSliderChange(Number(event.target.value))}
            className="vr-range-input relative -mt-5 h-5 w-full cursor-pointer bg-transparent"
          />
        </div>
        
        <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <span>Floor Rs. {bounds.min}</span>
          <span>Ceiling Rs. {bounds.max}</span>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <div className="relative flex-1 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="absolute -top-2 left-2 bg-white px-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">Starting from</div>
            <IndianRupee className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
            <input
              value={minInput}
              inputMode="numeric"
              onChange={(event) => onMinInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              onBlur={onMinInputCommit}
              placeholder={String(bounds.min)}
              className="w-full bg-transparent py-2 pl-6 pr-2 text-xs font-semibold text-slate-700 outline-none"
            />
          </div>
          <span className="text-[10px] font-bold uppercase text-slate-300">to</span>
          <div className="relative flex-1 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="absolute -top-2 left-2 bg-white px-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">Up to</div>
            <IndianRupee className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
            <input
              value={maxInput}
              inputMode="numeric"
              onChange={(event) => onMaxInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              onBlur={onMaxInputCommit}
              placeholder={String(bounds.max)}
              className="w-full bg-transparent py-2 pl-6 pr-2 text-xs font-semibold text-slate-700 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
        <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Budgets</div>
        <div className="flex flex-wrap gap-1.5">
          {quickBudgets.map((budget) => (
            <button
              key={budget.label}
              onClick={() => handleBudgetClick(budget.min, budget.max)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              {budget.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
