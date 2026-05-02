import type { HTMLAttributes } from "react";

type CardVariant = "default" | "subtle" | "hero" | "dark";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padded?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default: "border border-[var(--vr-border)] bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]",
  subtle: "border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] shadow-[0_12px_28px_rgba(15,23,42,0.04)]",
  hero: "border border-[rgba(30,58,138,0.08)] bg-[linear-gradient(180deg,#ffffff,#f6f9ff)] shadow-[0_24px_55px_rgba(30,58,138,0.1)]",
  dark: "border border-white/10 bg-[linear-gradient(180deg,#0f172a,#172554)] text-white shadow-[0_24px_55px_rgba(15,23,42,0.24)]"
};

export function Card({ variant = "default", padded = true, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-[1.6rem] transition duration-200",
        variantClasses[variant],
        padded ? "p-5" : "",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
