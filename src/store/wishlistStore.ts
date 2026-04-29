import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "types";

interface WishlistState {
  guestWishlist: Product[];
  addGuestWishlistItem: (product: Product) => void;
  removeGuestWishlistItem: (productId: number) => void;
  toggleGuestWishlistItem: (product: Product) => void;
  isGuestWishlisted: (productId: number) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      guestWishlist: [],
      addGuestWishlistItem: (product) =>
        set((state) => ({
          guestWishlist: state.guestWishlist.some((item) => item.id === product.id)
            ? state.guestWishlist
            : [product, ...state.guestWishlist]
        })),
      removeGuestWishlistItem: (productId) =>
        set((state) => ({
          guestWishlist: state.guestWishlist.filter((item) => item.id !== productId)
        })),
      toggleGuestWishlistItem: (product) => {
        if (get().isGuestWishlisted(product.id)) {
          get().removeGuestWishlistItem(product.id);
          return;
        }

        get().addGuestWishlistItem(product);
      },
      isGuestWishlisted: (productId) => get().guestWishlist.some((item) => item.id === productId)
    }),
    { name: "vrtech-guest-wishlist" }
  )
);
