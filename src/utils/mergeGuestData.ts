import type { QueryClient } from "@tanstack/react-query";
import { customerApi } from "api/client";
import { useCartStore } from "store/cartStore";
import { useWishlistStore } from "store/wishlistStore";

export async function mergeGuestDataAfterLogin(queryClient: QueryClient) {
  const { guestCart, clearGuestCart } = useCartStore.getState();
  const guestWishlist = useWishlistStore.getState().guestWishlist;

  let lastCart: unknown = null;
  for (const item of guestCart) {
    try {
      lastCart = await customerApi.addToCart(item.product.id, item.quantity);
    } catch {
      // skip products that fail (out-of-stock, etc.)
    }
  }
  if (lastCart) {
    queryClient.setQueryData(["cart"], lastCart);
  } else {
    await queryClient.invalidateQueries({ queryKey: ["cart"] });
  }
  clearGuestCart();

  let lastWishlist: unknown = null;
  for (const product of guestWishlist) {
    try {
      lastWishlist = await customerApi.addToWishlist(product.id);
    } catch {
      // skip duplicates / unavailable
    }
  }
  if (lastWishlist) {
    queryClient.setQueryData(["wishlist"], lastWishlist);
  } else {
    await queryClient.invalidateQueries({ queryKey: ["wishlist"] });
  }
  useWishlistStore.setState({ guestWishlist: [] });
}
