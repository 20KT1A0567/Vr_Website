import { useCallback, useEffect, useState } from "react";
import type { Product } from "types";
import { customerApi } from "api/client";
import { useAuthStore } from "store/authStore";

const STORAGE_KEY = "vrtech-recently-viewed";
const ANON_ID_KEY = "vrtech-anon-id";
const MAX_ITEMS = 10;

function loadStored(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

function saveStored(products: Product[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch {}
}

function getAnonymousId(): string {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

export function useRecentlyViewed() {
  const user = useAuthStore((state) => state.user);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(loadStored);

  useEffect(() => {
    const anonymousId = getAnonymousId();
    customerApi
      .getRecentlyViewed(user ? undefined : anonymousId)
      .then((products) => {
        setRecentlyViewed((current) => {
          const merged = [
            ...products,
            ...current.filter((p) => !products.some((bp) => bp.id === p.id))
          ].slice(0, MAX_ITEMS);
          saveStored(merged);
          return merged;
        });
      })
      .catch(() => {});
  }, [user]);

  const trackProduct = useCallback(
    (product: Product) => {
      setRecentlyViewed((current) => {
        const next = [product, ...current.filter((p) => p.id !== product.id)].slice(0, MAX_ITEMS);
        saveStored(next);
        return next;
      });
      const anonymousId = getAnonymousId();
      customerApi
        .recordRecentView(product.id, user ? undefined : anonymousId)
        .catch(() => {});
    },
    [user]
  );

  const clearHistory = useCallback(() => {
    setRecentlyViewed([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { recentlyViewed, trackProduct, clearHistory };
}
