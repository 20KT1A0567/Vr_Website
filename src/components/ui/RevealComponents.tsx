import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE, VIEWPORT } from "../../animations/variants";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

// ─── RevealFadeUp ────────────────────────────────────────────────────────────
export function RevealFadeUp({ children, delay = 0, duration = 0.55, className }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// ─── RevealSlideLeft ─────────────────────────────────────────────────────────
export function RevealSlideLeft({ children, delay = 0, duration = 0.55, className }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: reduce ? 0 : -36 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={VIEWPORT}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// ─── RevealSlideRight ────────────────────────────────────────────────────────
export function RevealSlideRight({ children, delay = 0, duration = 0.55, className }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: reduce ? 0 : 36 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={VIEWPORT}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// ─── RevealZoom ──────────────────────────────────────────────────────────────
export function RevealZoom({ children, delay = 0, duration = 0.5, className }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: reduce ? 1 : 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={VIEWPORT}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// ─── RevealBlur ──────────────────────────────────────────────────────────────
export function RevealBlur({ children, delay = 0, duration = 0.6, className }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, filter: reduce ? "blur(0px)" : "blur(8px)" }}
      whileInView={{ opacity: 1, filter: "blur(0px)" }}
      viewport={VIEWPORT}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// ─── RevealClip ──────────────────────────────────────────────────────────────
export function RevealClip({ children, delay = 0, duration = 0.65, className }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)", opacity: 0.5 }}
      whileInView={reduce ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
      viewport={VIEWPORT}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// ─── RevealStagger ───────────────────────────────────────────────────────────
interface RevealStaggerProps {
  children: ReactNode;
  stagger?: number;
  delay?: number;
  className?: string;
}

export function RevealStagger({ children, stagger = 0.07, delay = 0, className }: RevealStaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealStaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: reduce ? 0 : 22, scale: reduce ? 1 : 0.97 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.44, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── RevealCardStack ─────────────────────────────────────────────────────────
export function RevealCardStack({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 40, scale: reduce ? 1 : 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.5, delay: index * 0.08, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// ─── AnimatedProductCard ─────────────────────────────────────────────────────
export function AnimatedProductCard({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 28, scale: reduce ? 1 : 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.46, delay: (index % 4) * 0.08, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// ─── AnimatedSearchResults ───────────────────────────────────────────────────
export function AnimatedSearchResults({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.22, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedSearchItem({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.18, delay: index * 0.04, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
