import { useCallback, useState } from "react";
import type { Product } from "types";

const STORAGE_KEY = "vrtech-recently-viewed";
const MAX_ITEMS = 10;

function loadStored(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(loadStored);

  const trackProduct = useCallback((product: Product) => {
    setRecentlyViewed((current) => {
      const next = [product, ...current.filter((p) => p.id !== product.id)].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setRecentlyViewed([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { recentlyViewed, trackProduct, clearHistory };
}
