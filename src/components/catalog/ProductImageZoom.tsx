import { useState } from "react";
import type { MouseEvent } from "react";
import { Search } from "lucide-react";

interface ProductImageZoomProps {
  imageUrl?: string;
  alt: string;
}

export function ProductImageZoom({ imageUrl, alt }: ProductImageZoomProps) {
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  function handlePointerMove(event: MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - bounds.left) / bounds.width) * 100;
    const relativeY = ((event.clientY - bounds.top) / bounds.height) * 100;

    setZoomPosition({
      x: Math.min(100, Math.max(0, relativeX)),
      y: Math.min(100, Math.max(0, relativeY))
    });
  }

  if (!imageUrl) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-[1.8rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] text-sm text-[var(--vr-muted)]">
        Image coming soon
      </div>
    );
  }

  return (
    <div
      className="group relative overflow-hidden rounded-[1.8rem] border border-[var(--vr-border)] bg-white"
      onMouseEnter={() => setIsZoomActive(true)}
      onMouseLeave={() => setIsZoomActive(false)}
      onMouseMove={handlePointerMove}
    >
      <div className="aspect-[4/3] overflow-hidden bg-[linear-gradient(180deg,#ffffff,#f8fbff)]">
        <img
          src={imageUrl}
          alt={alt}
          className="h-full w-full object-contain p-6 transition duration-150 ease-out"
          style={
            isZoomActive
              ? {
                  transform: "scale(2.05)",
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                }
              : undefined
          }
        />
      </div>

      <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center justify-between rounded-full border border-[var(--vr-border)] bg-white/94 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-muted)] shadow-[0_12px_24px_rgba(15,23,42,0.08)] backdrop-blur">
        <span className="inline-flex items-center gap-2">
          <Search className="h-3.5 w-3.5" />
          Zoom Enabled
        </span>
        <span>{isZoomActive ? "Inspecting" : "Hover Here"}</span>
      </div>
    </div>
  );
}
