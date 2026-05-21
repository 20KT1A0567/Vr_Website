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

function formatRangeCurrency(value: number) {
  return `\u20B9${Number(value).toLocaleString("en-IN")}`;
}

function applyBudget(
  min: number,
  max: number,
  onMinInputChange: (value: string) => void,
  onMaxInputChange: (value: string) => void,
  onMinInputCommit: () => void,
  onMaxInputCommit: () => void
) {
  onMinInputChange(String(min));
  onMaxInputChange(String(max));
  window.setTimeout(() => {
    onMinInputCommit();
    onMaxInputCommit();
  }, 10);
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
  const histogramBars = [0.56, 0.78, 0.96, 0.72, 0.83, 0.98, 0.86, 0.34, 0.22];

  return (
    <div className="space-y-4">
      <div className="relative px-1 pt-1">
        <div className="pointer-events-none mb-2 flex h-12 items-end gap-1 px-1">
          {histogramBars.map((bar, index) => (
            <div
              key={index}
              className="flex-1 rounded-t-[10px] bg-[rgba(132,204,22,0.10)]"
              style={{ height: `${Math.max(16, Math.round(bar * 42))}px` }}
            />
          ))}
        </div>

        <div className="absolute left-1 right-1 top-[2.05rem] h-1 -translate-y-1/2 rounded-full bg-[rgba(46,125,50,0.16)]" />
        <div
          className="absolute top-[2.05rem] h-1 -translate-y-1/2 rounded-full bg-[#2e7d32]"
          style={{ left: `calc(${minProgress}% + 0.25rem)`, right: `calc(${100 - maxProgress}% + 0.25rem)` }}
        />

        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={rangeStep}
          value={minValue}
          onChange={(event) => onMinSliderChange(Number(event.target.value))}
          className="vr-range-input relative h-5 w-full cursor-pointer bg-transparent accent-[#2e7d32]"
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={rangeStep}
          value={maxValue}
          onChange={(event) => onMaxSliderChange(Number(event.target.value))}
          className="vr-range-input relative -mt-5 h-5 w-full cursor-pointer bg-transparent accent-[#2e7d32]"
        />
      </div>

      <div className="flex items-center justify-between text-[18px] font-bold tracking-[-0.02em] text-slate-900">
        <span>{formatRangeCurrency(minValue)}</span>
        <span>{formatRangeCurrency(maxValue)}</span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_18px_minmax(0,1fr)] items-center gap-2 pt-2">
        <div className="flex min-w-0 items-center gap-2 rounded-[14px] border-[2px] border-slate-400 bg-white px-3 py-3">
          <span className="shrink-0 text-[14px] font-semibold text-slate-700">\u20B9</span>
          <input
            value={minInput}
            inputMode="numeric"
            onChange={(event) => onMinInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            onBlur={onMinInputCommit}
            placeholder={String(bounds.min)}
            className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold tracking-[-0.02em] text-slate-900 outline-none"
          />
        </div>

        <span className="text-center text-[22px] font-medium text-slate-300">-</span>

        <div className="flex min-w-0 items-center gap-2 rounded-[14px] border-[2px] border-slate-400 bg-white px-3 py-3">
          <span className="shrink-0 text-[14px] font-semibold text-slate-700">\u20B9</span>
          <input
            value={maxInput}
            inputMode="numeric"
            onChange={(event) => onMaxInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            onBlur={onMaxInputCommit}
            placeholder={String(bounds.max)}
            className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold tracking-[-0.02em] text-slate-900 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => applyBudget(bounds.min, 20000, onMinInputChange, onMaxInputChange, onMinInputCommit, onMaxInputCommit)}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-600 transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
        >
          Under {"\u20B9"}20K
        </button>
        <button
          type="button"
          onClick={() => applyBudget(bounds.min, 30000, onMinInputChange, onMaxInputChange, onMinInputCommit, onMaxInputCommit)}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-600 transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
        >
          Under {"\u20B9"}30K
        </button>
        <button
          type="button"
          onClick={() => applyBudget(bounds.min, 50000, onMinInputChange, onMaxInputChange, onMinInputCommit, onMaxInputCommit)}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-600 transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
        >
          Under {"\u20B9"}50K
        </button>
      </div>
    </div>
  );
}
