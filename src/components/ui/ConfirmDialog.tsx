import { useEffect } from "react";
import { Button } from "./Button";
import { Card } from "./Card";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  value?: string;
  placeholder?: string;
  requireValue?: boolean;
  confirmTone?: "primary" | "danger" | "accent";
  onValueChange?: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  value = "",
  placeholder,
  requireValue = false,
  confirmTone = "primary",
  onValueChange,
  onCancel,
  onConfirm
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur sm:items-center">
      <button type="button" aria-label="Close dialog" className="absolute inset-0" onClick={onCancel} />
      <Card className="relative z-10 w-full max-w-xl">
        <h3 className="text-2xl font-bold text-[var(--vr-text)]">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-[var(--vr-muted)]">{description}</p>
        {onValueChange ? (
          <textarea
            className="vr-input mt-5 min-h-[132px] rounded-[1.25rem] py-3"
            value={value}
            placeholder={placeholder}
            onChange={(event) => onValueChange(event.target.value)}
          />
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel}>
            Keep Order
          </Button>
          <Button
            variant={confirmTone}
            onClick={onConfirm}
            disabled={requireValue && !value.trim()}
          >
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
