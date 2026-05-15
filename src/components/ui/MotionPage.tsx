import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface MotionPageProps {
  children: ReactNode;
}

export function MotionPage({ children }: MotionPageProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, y: 18, filter: "blur(6px)" }
      }
      animate={
        reduce
          ? { opacity: 1 }
          : { opacity: 1, y: 0, filter: "blur(0px)" }
      }
      exit={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, y: -10, filter: "blur(4px)" }
      }
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col flex-1 min-h-0"
    >
      {children}
    </motion.div>
  );
}
