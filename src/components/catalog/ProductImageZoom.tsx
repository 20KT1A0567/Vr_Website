import { useState } from "react";
import type { MouseEvent } from "react";

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
      <div className="flex aspect-[4/3] items-center justify-center rounded-[1.5rem] bg-[#f5f8ef] text-sm text-slate-500">
        Image coming soon
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div
        className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white"
        onMouseEnter={() => setIsZoomActive(true)}
        onMouseLeave={() => setIsZoomActive(false)}
        onMouseMove={handlePointerMove}
      >
        <div className="aspect-[4/3] overflow-hidden bg-[#f7f9f3]">
          <img
            src={imageUrl}
            alt={alt}
            className="h-full w-full object-contain p-6 transition duration-150"
            style={
              isZoomActive
                ? {
                    transform: "scale(1.85)",
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                  }
                : undefined
            }
          />
        </div>

        <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center justify-between rounded-full border border-slate-200 bg-white/96 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600 shadow-sm backdrop-blur">
          <span>Hover to zoom</span>
          <span>{isZoomActive ? "Live" : "Ready"}</span>
        </div>
      </div>

      <div
        className={`hidden overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0f130f] xl:block ${
          isZoomActive ? "opacity-100" : "opacity-80"
        }`}
      >
        <div
          className="h-full min-h-[280px] bg-contain bg-center bg-no-repeat transition duration-150"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
            backgroundSize: "235%"
          }}
        />
      </div>
    </div>
  );
}
