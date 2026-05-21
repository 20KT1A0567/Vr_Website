import { useEffect } from "react";

const BASE_TITLE = "VR Technologies - Refurbished Laptops & Desktops in Hyderabad";
const BASE_DESCRIPTION =
  "Buy certified refurbished laptops, desktops, and accessories in Hyderabad with 6-month warranty, quality checks, and 7-day easy returns. Multiple store locations.";

function setMetaDescription(content: string) {
  let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = "description";
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setNamedMeta(name: string, content: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setOgMeta(property: string, content: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setCanonical(url?: string) {
  let tag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!url) {
    tag?.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = "canonical";
    document.head.appendChild(tag);
  }
  tag.href = url;
}

export function usePageMeta(options?: { title?: string; description?: string; keywords?: string; image?: string; canonicalUrl?: string; noIndex?: boolean }) {
  useEffect(() => {
    const title = options?.title ? `${options.title} | VR Technologies` : BASE_TITLE;
    const description = options?.description ?? BASE_DESCRIPTION;

    document.title = title;
    setMetaDescription(description);
    if (options?.keywords) setNamedMeta("keywords", options.keywords);
    setNamedMeta("robots", options?.noIndex ? "noindex,nofollow" : "index,follow");
    setCanonical(options?.canonicalUrl);
    setOgMeta("og:title", title);
    setOgMeta("og:description", description);
    setOgMeta("og:site_name", "VR Technologies");
    setOgMeta("og:type", "website");
    if (options?.image) setOgMeta("og:image", options.image);

    return () => {
      document.title = BASE_TITLE;
      setMetaDescription(BASE_DESCRIPTION);
      setNamedMeta("robots", "index,follow");
      setCanonical(undefined);
    };
  }, [options?.title, options?.description, options?.keywords, options?.image, options?.canonicalUrl, options?.noIndex]);
}
