import type { Variants } from "framer-motion";

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_SPRING = { type: "spring" as const, stiffness: 420, damping: 28 };
export const EASE_BOUNCE = { type: "spring" as const, stiffness: 550, damping: 20 };
export const EASE_ELASTIC = { type: "spring" as const, stiffness: 600, damping: 18 };

export const VIEWPORT = { once: true, margin: "-60px" } as const;
export const VIEWPORT_TIGHT = { once: true, margin: "-30px" } as const;

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export const fadeDownVariants: Variants = {
  hidden: { opacity: 0, y: -16 },
  show: { opacity: 1, y: 0 },
};

export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: -36 },
  show: { opacity: 1, x: 0 },
};

export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: 36 },
  show: { opacity: 1, x: 0 },
};

export const zoomVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1 },
};

export const blurVariants: Variants = {
  hidden: { opacity: 0, filter: "blur(8px)" },
  show: { opacity: 1, filter: "blur(0px)" },
};

export const clipUpVariants: Variants = {
  hidden: { clipPath: "inset(0% 0% 100% 0%)", opacity: 0.6 },
  show: { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 },
};

export const clipLeftVariants: Variants = {
  hidden: { clipPath: "inset(0% 100% 0% 0%)" },
  show: { clipPath: "inset(0% 0% 0% 0%)" },
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: EASE },
  },
};

export const cardStackVariants: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export const flipCardVariants: Variants = {
  hidden: { opacity: 0, rotateY: 14, scale: 0.96 },
  show: { opacity: 1, rotateY: 0, scale: 1 },
};

export const elasticPopVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 580, damping: 18 },
  },
};

export const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 14 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: EASE },
  },
};

export const fadeFromBottomVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE },
  },
};
