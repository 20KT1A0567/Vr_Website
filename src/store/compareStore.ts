import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "types";

export type CompareAddResult = "added" | "duplicate" | "full" | "category-mismatch";

interface CompareState {
  compareList: Product[];
  addToCompare: (product: Product) => CompareAddResult;
  removeFromCompare: (productId: number) => void;
  clearCompare: () => void;
  isInCompare: (productId: number) => boolean;
  canCompareWith: (product: Product) => boolean;
}

function sameCategory(left: Product, right: Product) {
  if (left.categoryId != null && right.categoryId != null) {
    return left.categoryId === right.categoryId;
  }
  if (left.categoryName && right.categoryName) {
    return left.categoryName.trim().toLowerCase() === right.categoryName.trim().toLowerCase();
  }
  return false;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      compareList: [],
      addToCompare: (product) => {
        const list = get().compareList;
        if (list.some((existing) => existing.id === product.id)) {
          return "duplicate";
        }
        if (list.length >= 3) {
          return "full";
        }
        if (list.length > 0 && !sameCategory(list[0], product)) {
          return "category-mismatch";
        }
        set({ compareList: [...list, product] });
        return "added";
      },
      removeFromCompare: (productId) =>
        set({ compareList: get().compareList.filter((p) => p.id !== productId) }),
      clearCompare: () => set({ compareList: [] }),
      isInCompare: (productId) => get().compareList.some((p) => p.id === productId),
      canCompareWith: (product) => {
        const list = get().compareList;
        if (!list.length || list.some((existing) => existing.id === product.id)) {
          return true;
        }
        return sameCategory(list[0], product);
      }
    }),
    { name: "vrtech-compare" }
  )
);
