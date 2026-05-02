import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: "start" | "center";
}

export function SectionHeader({ eyebrow, title, description, action, align = "start" }: SectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-4 ${align === "center" ? "items-center text-center" : "lg:flex-row lg:items-end lg:justify-between"}`}>
      <div className={align === "center" ? "max-w-3xl" : "max-w-3xl"}>
        {eyebrow ? (
          <div className={`mb-3 flex items-center gap-2.5 ${align === "center" ? "justify-center" : ""}`}>
            <span className="inline-block h-[3px] w-8 rounded-full bg-[var(--vr-accent)]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--vr-accent)]">{eyebrow}</span>
          </div>
        ) : null}
        <h2 className="text-[2rem] font-extrabold leading-[1.08] text-[var(--vr-text)] lg:text-[2.75rem]">{title}</h2>
        {description ? <p className="mt-3 text-sm leading-7 text-[var(--vr-muted)] lg:text-base">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
