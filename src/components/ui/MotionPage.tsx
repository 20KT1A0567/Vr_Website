import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface MotionPageProps {
  children: ReactNode;
}

export function MotionPage({ children }: MotionPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col flex-1 min-h-0"
    >
      {children}
    </motion.div>
  );
}
