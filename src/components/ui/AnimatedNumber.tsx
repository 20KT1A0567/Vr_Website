import { animate, useMotionValue, useTransform, motion } from "framer-motion";
import { useEffect } from "react";

interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({ value, format, className, duration = 0.6 }: AnimatedNumberProps) {
  const motionValue = useMotionValue(value);
  const display = useTransform(motionValue, (current) => (format ? format(current) : Math.round(current).toString()));

  useEffect(() => {
    const controls = animate(motionValue, value, { duration, ease: [0.22, 1, 0.36, 1] });
    return controls.stop;
  }, [value, duration, motionValue]);

  return <motion.span className={className}>{display}</motion.span>;
}
