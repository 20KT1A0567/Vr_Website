import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "types";

export interface GuestCartItem {
  product: Product;
  quantity: number;
}

interface GuestCartState {
  guestCart: GuestCartItem[];
  addGuestCartItem: (product: Product, quantity?: number) => void;
  updateGuestCartQuantity: (productId: number, quantity: number) => void;
  removeGuestCartItem: (productId: number) => void;
  clearGuestCart: () => void;
  guestCartCount: () => number;
}

export const useCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      guestCart: [],
      addGuestCartItem: (product, quantity = 1) =>
        set((state) => {
          const existing = state.guestCart.find((item) => item.product.id === product.id);
          if (existing) {
            return {
              guestCart: state.guestCart.map((item) =>
                item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
              )
            };
          }
          return { guestCart: [{ product, quantity }, ...state.guestCart] };
        }),
      updateGuestCartQuantity: (productId, quantity) =>
        set((state) => ({
          guestCart:
            quantity <= 0
              ? state.guestCart.filter((item) => item.product.id !== productId)
              : state.guestCart.map((item) =>
                  item.product.id === productId ? { ...item, quantity } : item
                )
        })),
      removeGuestCartItem: (productId) =>
        set((state) => ({ guestCart: state.guestCart.filter((item) => item.product.id !== productId) })),
      clearGuestCart: () => set({ guestCart: [] }),
      guestCartCount: () => get().guestCart.length
    }),
    { name: "vrtech-guest-cart" }
  )
);
