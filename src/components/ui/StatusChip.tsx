import { Badge } from "./Badge";

type StatusTone = "primary" | "accent" | "success" | "danger" | "muted" | "dark";

interface StatusChipProps {
  label: string;
  tone?: StatusTone;
  outlined?: boolean;
  className?: string;
}

function normalizeLabel(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getStatusTone(value?: string): StatusTone {
  if (!value) {
    return "muted";
  }

  const normalized = value.toUpperCase();
  if (["PAID", "DELIVERED", "CAPTURED", "ACTIVE", "IN STOCK", "AVAILABLE", "CONFIRMED", "PACKED", "READY"].includes(normalized)) {
    return "success";
  }
  if (["PENDING", "CREATED", "SHIPPED", "UPCOMING"].includes(normalized)) {
    return "primary";
  }
  if (["TODAY DEAL", "BEST SELLER", "FEATURED", "CASH", "UPI", "CARD", "BANK TRANSFER"].includes(normalized)) {
    return "accent";
  }
  if (["FAILED", "CANCELLED", "REFUNDED", "RETURN REQUESTED", "OUT OF STOCK", "INACTIVE"].includes(normalized)) {
    return "danger";
  }
  return "muted";
}

export function StatusChip({ label, tone, outlined = false, className }: StatusChipProps) {
  return (
    <Badge tone={tone ?? getStatusTone(label)} outlined={outlined} className={className}>
      {normalizeLabel(label)}
    </Badge>
  );
}
