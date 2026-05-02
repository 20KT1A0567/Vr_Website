import type { ReactNode } from "react";

interface StickyMobileBarProps {
  children: ReactNode;
}

export function StickyMobileBar({ children }: StickyMobileBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--vr-border)] bg-white/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_42px_rgba(15,23,42,0.1)] backdrop-blur lg:hidden">
      {children}
    </div>
  );
}
