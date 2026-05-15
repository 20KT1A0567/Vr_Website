import { AnimatePresence, motion } from "framer-motion";

interface AnimatedCounterBadgeProps {
  count: number;
  className?: string;
}

export function AnimatedCounterBadge({ count, className }: AnimatedCounterBadgeProps) {
  if (count <= 0) return null;
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={count}
        initial={{ scale: 0.4, opacity: 0, y: -4 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.4, opacity: 0, y: 4 }}
        transition={{ type: "spring", stiffness: 520, damping: 18 }}
        className={className}
      >
        {count > 99 ? "99+" : count}
      </motion.span>
    </AnimatePresence>
  );
}
