import type { HTMLAttributes, ReactNode } from "react";

type BadgeTone = "primary" | "accent" | "success" | "danger" | "muted" | "dark";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  outlined?: boolean;
  children: ReactNode;
}

const toneClasses: Record<BadgeTone, { solid: string; outline: string }> = {
  primary: {
    solid: "bg-[rgba(30,58,138,0.1)] text-[var(--vr-primary)]",
    outline: "border border-[rgba(30,58,138,0.14)] bg-white text-[var(--vr-primary)]"
  },
  accent: {
    solid: "bg-[rgba(245,158,11,0.14)] text-[#b45309]",
    outline: "border border-[rgba(245,158,11,0.18)] bg-white text-[#b45309]"
  },
  success: {
    solid: "bg-[rgba(22,163,74,0.12)] text-[var(--vr-success)]",
    outline: "border border-[rgba(22,163,74,0.18)] bg-white text-[var(--vr-success)]"
  },
  danger: {
    solid: "bg-[rgba(220,38,38,0.12)] text-[var(--vr-danger)]",
    outline: "border border-[rgba(220,38,38,0.18)] bg-white text-[var(--vr-danger)]"
  },
  muted: {
    solid: "bg-[var(--vr-surface-soft)] text-[var(--vr-muted)]",
    outline: "border border-[var(--vr-border)] bg-white text-[var(--vr-muted)]"
  },
  dark: {
    solid: "bg-[var(--vr-dark)] text-white",
    outline: "border border-[var(--vr-dark)] bg-white text-[var(--vr-dark)]"
  }
};

export function Badge({ tone = "primary", outlined = false, className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        outlined ? toneClasses[tone].outline : toneClasses[tone].solid,
        className
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
