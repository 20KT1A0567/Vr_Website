interface FilterCheckboxProps {
  label: string;
  checked: boolean;
  count?: number;
  disabled?: boolean;
  onChange: () => void;
}

export function FilterCheckbox({ label, checked, count, disabled = false, onChange }: FilterCheckboxProps) {
  return (
    <label
      className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-sm transition ${
        checked
          ? "border-[rgba(30,58,138,0.18)] bg-white text-[var(--vr-text)]"
          : disabled
            ? "border-[var(--vr-border)] bg-white/70 text-slate-300"
            : "border-[var(--vr-border)] bg-white text-[var(--vr-text)] hover:border-[rgba(30,58,138,0.18)]"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="h-4 w-4 rounded border-slate-300 text-[var(--vr-primary)] focus:ring-[var(--vr-primary)]"
        />
        <span className="truncate">{label}</span>
      </div>
      {typeof count === "number" ? (
        <span className="rounded-full bg-[var(--vr-surface-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--vr-muted)]">{count}</span>
      ) : null}
    </label>
  );
}
