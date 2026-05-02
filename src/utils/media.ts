const directVideoPattern = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;

export function isDirectVideoUrl(url?: string) {
  return Boolean(url && directVideoPattern.test(url));
}

export function getVideoEmbedUrl(url?: string) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId = parsed.searchParams.get("v");
      if (!videoId) {
        return null;
      }

      return `https://www.youtube.com/embed/${videoId}`;
    }

    if (host === "youtu.be") {
      const videoId = parsed.pathname.replace(/\//g, "").trim();
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (host === "vimeo.com") {
      const videoId = parsed.pathname.replace(/\//g, "").trim();
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
}
