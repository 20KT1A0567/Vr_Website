import type { ReactNode } from "react";
import { Card } from "./Card";

interface EmptyStateProps {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ eyebrow, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed text-center">
      {eyebrow ? (
        <div className="inline-flex rounded-full border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">
          {eyebrow}
        </div>
      ) : null}
      <h3 className="mt-4 text-2xl font-bold text-[var(--vr-text)]">{title}</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--vr-muted)]">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </Card>
  );
}
