import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonClassOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonClassOptions {
  icon?: ReactNode;
  iconRight?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[var(--vr-primary)] text-white shadow-[0_18px_35px_rgba(30,58,138,0.22)] hover:bg-[var(--vr-primary-strong)]",
  secondary: "border border-[var(--vr-border)] bg-white text-[var(--vr-text)] hover:border-[var(--vr-primary)] hover:bg-[var(--vr-surface-soft)]",
  accent: "bg-[var(--vr-accent)] text-[var(--vr-dark)] shadow-[0_18px_35px_rgba(245,158,11,0.22)] hover:bg-[#d97706]",
  ghost: "border border-transparent bg-transparent text-[var(--vr-muted)] hover:bg-[var(--vr-surface-soft)] hover:text-[var(--vr-text)]",
  danger: "border border-[rgba(220,38,38,0.14)] bg-[rgba(220,38,38,0.08)] text-[var(--vr-danger)] hover:bg-[rgba(220,38,38,0.14)]"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-[2.5rem] rounded-xl px-3.5 text-sm",
  md: "min-h-[2.875rem] rounded-2xl px-4.5 text-sm",
  lg: "min-h-[3.25rem] rounded-2xl px-5.5 text-base"
};

export function getButtonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = ""
}: ButtonClassOptions = {}) {
  return [
    "inline-flex items-center justify-center gap-2 font-semibold transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? "w-full" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  icon,
  iconRight,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={getButtonClassName({ variant, size, fullWidth, className })} {...props}>
      {icon}
      <span>{children}</span>
      {iconRight}
    </button>
  );
}
