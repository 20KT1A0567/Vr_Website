import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface BannerVideoProps {
  src: string;
  poster?: string;
  className?: string;
}

export function BannerVideo({ src, poster, className = "" }: BannerVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleMute(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    if (!next) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // user interaction unblocked it; ignore
        });
      }
    }
    setMuted(next);
  }

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={className}
        autoPlay
        muted
        loop
        playsInline
      />
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute video" : "Mute video"}
        className="absolute bottom-3 right-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/55 text-white backdrop-blur transition hover:bg-slate-950/75"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </>
  );
}
