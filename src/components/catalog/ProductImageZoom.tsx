import { useState, useRef, useEffect } from "react";
import type { MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2 } from "lucide-react";

interface ProductImageZoomProps {
  imageUrl?: string;
  alt: string;
}

const ZOOM_LEVEL = 2.5;

export function ProductImageZoom({ imageUrl, alt }: ProductImageZoomProps) {
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [renderedImage, setRenderedImage] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const calculateBounds = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const rect = img.parentElement?.getBoundingClientRect();
    if (!rect) return;

    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    if (!naturalW || !naturalH) return;

    // The image is inside a container with padding 24px (p-6)
    const padding = 24;
    const availableW = rect.width - padding * 2;
    const availableH = rect.height - padding * 2;

    const imgRatio = naturalW / naturalH;
    const containerRatio = availableW / availableH;

    let renderedW = availableW;
    let renderedH = availableH;

    if (imgRatio > containerRatio) {
      renderedH = availableW / imgRatio;
    } else {
      renderedW = availableH * imgRatio;
    }

    const x = (availableW - renderedW) / 2 + padding;
    const y = (availableH - renderedH) / 2 + padding;

    setRenderedImage({ width: renderedW, height: renderedH, x, y });
    setContainerSize({ width: rect.width, height: rect.height });
  };

  useEffect(() => {
    calculateBounds();
    window.addEventListener("resize", calculateBounds);
    return () => window.removeEventListener("resize", calculateBounds);
  }, [imageUrl]);

  function handlePointerMove(event: MouseEvent<HTMLDivElement>) {
    if (renderedImage.width === 0) calculateBounds();

    const bounds = event.currentTarget.getBoundingClientRect();
    const lensWidth = bounds.width / ZOOM_LEVEL;
    const lensHeight = bounds.height / ZOOM_LEVEL;

    let mouseX = event.clientX - bounds.left;
    let mouseY = event.clientY - bounds.top;

    let lensX = mouseX - lensWidth / 2;
    let lensY = mouseY - lensHeight / 2;

    // Constrain lens tightly to the actual rendered image boundaries
    const minX = renderedImage.x;
    const minY = renderedImage.y;
    const maxX = renderedImage.x + renderedImage.width - lensWidth;
    const maxY = renderedImage.y + renderedImage.height - lensHeight;

    if (renderedImage.width < lensWidth) {
      lensX = renderedImage.x + (renderedImage.width - lensWidth) / 2;
    } else {
      lensX = Math.max(minX, Math.min(lensX, maxX));
    }

    if (renderedImage.height < lensHeight) {
      lensY = renderedImage.y + (renderedImage.height - lensHeight) / 2;
    } else {
      lensY = Math.max(minY, Math.min(lensY, maxY));
    }

    setLensPosition({ x: lensX, y: lensY });
  }

  if (!imageUrl) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-[1.8rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] text-sm text-[var(--vr-muted)]">
        Image coming soon
      </div>
    );
  }

  const lensWidth = containerSize.width / ZOOM_LEVEL;
  const lensHeight = containerSize.height / ZOOM_LEVEL;

  return (
    <div className="relative z-20">
      <div
        className="group relative overflow-hidden rounded-[1.8rem] border border-[var(--vr-border)] bg-white cursor-crosshair xl:cursor-none"
        onMouseEnter={() => setIsZoomActive(true)}
        onMouseLeave={() => setIsZoomActive(false)}
        onMouseMove={handlePointerMove}
      >
        <div className={`absolute left-6 top-6 z-10 text-sm font-bold text-[var(--vr-text)] drop-shadow-sm transition-opacity duration-300 xl:hidden ${isZoomActive ? "opacity-0" : "opacity-100"}`}>Hover to inspect</div>
        <div className={`absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm border border-[var(--vr-border)] text-[var(--vr-primary)] transition-opacity duration-300 xl:hidden ${isZoomActive ? "opacity-0" : "opacity-100"}`}>
          <Maximize2 className="h-4 w-4" />
        </div>

        {/* Main Image Container */}
        <div className="aspect-[4/3] w-full flex items-center justify-center p-6 bg-white">
          <img
            ref={imgRef}
            src={imageUrl}
            alt={alt}
            onLoad={calculateBounds}
            className={`h-full w-full object-contain ${isZoomActive ? "xl:opacity-90" : ""}`}
            style={{
              transition: 'opacity 0.2s',
            }}
          />
        </div>

        {/* Amazon-style Lens (XL only) */}
        <AnimatePresence>
          {isZoomActive && containerSize.width > 0 && renderedImage.width >= lensWidth && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none absolute z-20 hidden xl:block shadow-[0_0_0_9999px_rgba(255,255,255,0.4)] border border-[rgba(0,0,0,0.1)] bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rV7928GBgYQwgcsAAgwAA9GA+H9xU/xAAAAAElFTkSuQmCC')]"
              style={{
                width: lensWidth,
                height: lensHeight,
                left: lensPosition.x,
                top: lensPosition.y,
                cursor: "crosshair"
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Side-by-Side HD Preview Box (XL only) */}
      <AnimatePresence>
        {isZoomActive && containerSize.width > 0 && renderedImage.width >= lensWidth && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute left-[calc(100%+1.5rem)] top-0 z-[60] hidden h-full w-[95%] overflow-hidden rounded-[1rem] border border-[rgba(0,0,0,0.1)] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)] xl:block"
            style={{ transformOrigin: "left center" }}
          >
            <img
              src={imageUrl}
              className="absolute max-w-none bg-white"
              style={{
                width: renderedImage.width * ZOOM_LEVEL,
                height: renderedImage.height * ZOOM_LEVEL,
                left: -(lensPosition.x - renderedImage.x) * ZOOM_LEVEL,
                top: -(lensPosition.y - renderedImage.y) * ZOOM_LEVEL,
                objectFit: "contain"
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
