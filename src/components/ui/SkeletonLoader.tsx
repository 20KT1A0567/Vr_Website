import type { HTMLAttributes } from "react";

interface SkeletonLoaderProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

export function SkeletonLoader({ lines = 1, className = "", ...props }: SkeletonLoaderProps) {
  if (lines <= 1) {
    return <div className={`vr-skeleton ${className}`.trim()} {...props} />;
  }

  return (
    <div className={`space-y-3 ${className}`.trim()} {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className={`vr-skeleton ${index === lines - 1 ? "w-3/4" : "w-full"} h-4`} />
      ))}
    </div>
  );
}
