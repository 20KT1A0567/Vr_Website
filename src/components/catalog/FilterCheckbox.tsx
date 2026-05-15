interface FilterCheckboxProps {
  label: string;
  checked: boolean;
  count?: number;
  disabled?: boolean;
  onChange: () => void;
  logoUrl?: string;
  iconUrl?: string;
}

export function FilterCheckbox({ label, checked, count, disabled = false, onChange, logoUrl, iconUrl }: FilterCheckboxProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className={`group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
        checked
          ? "bg-[rgba(30,58,138,0.07)] text-[var(--vr-primary)]"
          : disabled
          ? "cursor-not-allowed opacity-35"
          : "text-[var(--vr-text)] hover:bg-[var(--vr-surface-soft)]"
      }`}
    >
      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-[1.5px] transition ${
        checked
          ? "border-[var(--vr-primary)] bg-[var(--vr-primary)]"
          : "border-slate-300 bg-white group-hover:border-[var(--vr-primary)]"
      }`}>
        {checked && (
          <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {(logoUrl || iconUrl) ? (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--vr-border)] bg-white">
          <img src={logoUrl ?? iconUrl} alt="" className="h-4 w-4 object-contain" />
        </div>
      ) : null}

      <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{label}</span>

      {typeof count === "number" ? (
        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
          checked ? "bg-[rgba(30,58,138,0.15)] text-[var(--vr-primary)]" : "bg-slate-100 text-[var(--vr-muted)]"
        }`}>
          {count}
        </span>
      ) : null}
    </button>
  );
}
