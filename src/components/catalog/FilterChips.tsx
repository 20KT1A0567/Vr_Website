import { X } from "lucide-react";

interface FilterChipItem {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  items: FilterChipItem[];
  onClearAll: () => void;
}

export function FilterChips({ items, onClearAll }: FilterChipsProps) {
  if (!items.length) {
    return <span className="text-sm text-[var(--vr-muted)]">No filters selected yet.</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onRemove}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--vr-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--vr-primary)] transition hover:border-[var(--vr-primary)]"
        >
          {item.label}
          <X className="h-3.5 w-3.5" />
        </button>
      ))}
      <button type="button" onClick={onClearAll} className="text-sm font-semibold text-[var(--vr-muted)] transition hover:text-[var(--vr-primary)]">
        Clear All
      </button>
    </div>
  );
}
