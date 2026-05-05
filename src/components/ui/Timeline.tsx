import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock3, XCircle } from "lucide-react";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  status: "complete" | "current" | "upcoming" | "cancelled";
}

interface TimelineProps {
  items: TimelineItem[];
  compact?: boolean;
}

function TimelineIcon({ status }: { status: TimelineItem["status"] }) {
  if (status === "complete") {
    return <CheckCircle2 className="h-5 w-5 text-[var(--vr-success)]" />;
  }
  if (status === "current") {
    return <Clock3 className="h-5 w-5 text-[var(--vr-primary)]" />;
  }
  if (status === "cancelled") {
    return <XCircle className="h-5 w-5 text-[var(--vr-danger)]" />;
  }
  return <Circle className="h-5 w-5 text-slate-300" />;
}

export function Timeline({ items, compact = false }: TimelineProps) {
  return (
    <div className="space-y-0">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          className="relative flex gap-4 pb-5 last:pb-0"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          {index !== items.length - 1 ? <div className="absolute left-[0.62rem] top-7 h-[calc(100%-0.25rem)] w-px bg-[var(--vr-border)]" /> : null}
          <motion.div
            className="relative z-10 mt-0.5 rounded-full bg-white"
            initial={{ scale: 0 }}
            animate={{ scale: item.status === "current" ? [0, 1.25, 1] : 1 }}
            transition={{ duration: 0.4, delay: index * 0.08 + 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <TimelineIcon status={item.status} />
          </motion.div>
          <div className={`min-w-0 flex-1 ${compact ? "pt-0.5" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className={`font-semibold text-[var(--vr-text)] ${compact ? "text-sm" : "text-base"}`}>{item.title}</div>
                {item.description ? (
                  <p className={`mt-1 text-[var(--vr-muted)] ${compact ? "text-xs leading-5" : "text-sm leading-6"}`}>{item.description}</p>
                ) : null}
              </div>
              {item.timestamp ? <div className="text-xs text-slate-400">{item.timestamp}</div> : null}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
