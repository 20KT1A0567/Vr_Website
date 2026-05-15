import { motion, useMotionValue, useSpring } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";
import { useRef } from "react";

interface RevealMagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  as?: "div" | "span";
}

export function RevealMagneticButton({
  children,
  className,
  strength = 0.28,
  as = "div",
}: RevealMagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 380, damping: 22 });
  const springY = useSpring(y, { stiffness: 380, damping: 22 });

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const Tag = as === "span" ? motion.span : motion.div;

  return (
    <Tag
      ref={ref as never}
      style={{ x: springX, y: springY, display: "inline-flex" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </Tag>
  );
}
