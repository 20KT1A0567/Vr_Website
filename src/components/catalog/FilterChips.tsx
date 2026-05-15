import { X } from "lucide-react";

interface FilterChipItem {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  items: FilterChipItem[];
  onClearAll: () => void;
  className?: string;
  compact?: boolean;
}

export function FilterChips({ items, onClearAll, className = "", compact = false }: FilterChipsProps) {
  if (!items.length) {
    return <span className="text-sm text-[var(--vr-muted)]">No filters selected yet.</span>;
  }

  return (
    <div className={`flex items-center gap-1.5 ${compact ? "flex-nowrap" : "flex-wrap"} ${className}`}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onRemove}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
        >
          {item.label}
          <X className="h-3 w-3" />
        </button>
      ))}
      <button type="button" onClick={onClearAll} className="ml-1 shrink-0 text-[11px] font-bold text-slate-400 transition hover:text-[var(--vr-danger)]">
        Clear All
      </button>
    </div>
  );
}
