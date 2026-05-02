import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface SortOption<T extends string> {
  value: T;
  label: string;
}

interface SortDropdownProps<T extends string> {
  value: T;
  options: Array<SortOption<T>>;
  onChange: (value: T) => void;
}

export function SortDropdown<T extends string>({ value, options, onChange }: SortDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const activeLabel = options.find((option) => option.value === value)?.label ?? options[0]?.label ?? "Sort";

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div ref={ref} className="relative min-w-[240px]">
      <button type="button" onClick={() => setOpen((current) => !current)} className="vr-input flex w-full items-center justify-between bg-white">
        <span>{activeLabel}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-20 overflow-hidden rounded-2xl border border-[var(--vr-border)] bg-white shadow-[0_24px_50px_rgba(15,23,42,0.1)]">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`block w-full px-4 py-3 text-left text-sm font-medium transition ${
                value === option.value ? "bg-[var(--vr-primary)] text-white" : "text-[var(--vr-text)] hover:bg-[var(--vr-surface-soft)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
