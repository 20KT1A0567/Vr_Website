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
  primary: "bg-[var(--vr-primary)] text-white hover:bg-[var(--vr-primary-strong)] shadow-sm hover:shadow-md",
  secondary: "border border-[var(--vr-border-strong)] bg-white text-[var(--vr-text)] hover:bg-[var(--vr-surface-soft)] shadow-sm",
  accent: "bg-[var(--vr-accent)] text-white hover:bg-blue-700 shadow-sm",
  ghost: "bg-transparent text-[var(--vr-muted)] hover:bg-[var(--vr-surface-soft)] hover:text-[var(--vr-text)]",
  danger: "bg-[var(--vr-danger)] text-white hover:bg-red-700 shadow-sm"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 rounded-xl px-3 text-xs",
  md: "h-11 rounded-xl px-5 text-sm",
  lg: "h-14 rounded-2xl px-8 text-base"
};

export function getButtonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = ""
}: ButtonClassOptions = {}) {
  return [
    "inline-flex items-center justify-center gap-2 font-bold tracking-tight transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
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
