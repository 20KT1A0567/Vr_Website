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

  return (
    <div className="space-y-5">
      <div className="rounded-[1.35rem] border border-[var(--vr-border)] bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-4 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Selected range</div>
            <div className="mt-1 text-sm text-[var(--vr-muted)]">Drag the handles or type a min and max budget.</div>
          </div>
          <div className="rounded-full border border-[rgba(30,58,138,0.12)] bg-[rgba(30,58,138,0.06)] px-3 py-1.5 text-xs font-semibold text-[var(--vr-primary)]">
            {formatCurrency(minValue)} to {formatCurrency(maxValue)}
          </div>
        </div>

        <div className="relative mt-5 px-2">
          <div className="absolute left-2 right-2 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-200" />
          <div
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,var(--vr-primary),#3b82f6)]"
            style={{ left: `calc(${minProgress}% + 0.5rem)`, right: `calc(${100 - maxProgress}% + 0.5rem)` }}
          />
          <input
            type="range"
            min={bounds.min}
            max={bounds.max}
            step={rangeStep}
            value={minValue}
            onChange={(event) => onMinSliderChange(Number(event.target.value))}
            className="vr-range-input relative h-6 w-full cursor-pointer bg-transparent"
          />
          <input
            type="range"
            min={bounds.min}
            max={bounds.max}
            step={rangeStep}
            value={maxValue}
            onChange={(event) => onMaxSliderChange(Number(event.target.value))}
            className="vr-range-input relative -mt-6 h-6 w-full cursor-pointer bg-transparent"
          />
        </div>
        <div className="mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          <span>Floor {formatCurrency(bounds.min)}</span>
          <span>Ceiling {formatCurrency(bounds.max)}</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="rounded-[1.2rem] border border-[var(--vr-border)] bg-white p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Starting from</div>
          <div className="relative mt-2">
            <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={minInput}
              inputMode="numeric"
              onChange={(event) => onMinInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              onBlur={onMinInputCommit}
              placeholder={String(bounds.min)}
              className="vr-input pl-8 text-sm"
            />
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-400">to</span>
        <div className="rounded-[1.2rem] border border-[var(--vr-border)] bg-white p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Up to</div>
          <div className="relative mt-2">
            <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={maxInput}
              inputMode="numeric"
              onChange={(event) => onMaxInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              onBlur={onMaxInputCommit}
              placeholder={String(bounds.max)}
              className="vr-input pl-8 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
