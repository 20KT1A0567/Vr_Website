import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "types";

interface CompareState {
  compareList: Product[];
  addToCompare: (product: Product) => boolean;
  removeFromCompare: (productId: number) => void;
  clearCompare: () => void;
  isInCompare: (productId: number) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      compareList: [],
      addToCompare: (product) => {
        const list = get().compareList;
        if (list.length >= 3 || list.some((p) => p.id === product.id)) return false;
        set({ compareList: [...list, product] });
        return true;
      },
      removeFromCompare: (productId) => set({ compareList: get().compareList.filter((p) => p.id !== productId) }),
      clearCompare: () => set({ compareList: [] }),
      isInCompare: (productId) => get().compareList.some((p) => p.id === productId)
    }),
    { name: "vrtech-compare" }
  )
);
