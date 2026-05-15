import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { customerApi } from "api/client";
import { useAuthStore } from "store/authStore";
import { useWishlistStore } from "store/wishlistStore";
import { getApiErrorMessage } from "../utils/api";
import { showWishlistToast } from "../utils/cartNotifications";
import type { Product } from "types";

type WishlistMutationPayload = {
  productId: number;
  currentlyWishlisted: boolean;
  productTitle?: string;
};

export function useWishlist() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const isAuthenticated = Boolean(user);
  const guestWishlist = useWishlistStore((state) => state.guestWishlist);
  const toggleGuestWishlistItem = useWishlistStore((state) => state.toggleGuestWishlistItem);
  const isGuestWishlisted = useWishlistStore((state) => state.isGuestWishlisted);

  const { data: wishlist = [] } = useQuery({
    queryKey: ["wishlist"],
    queryFn: customerApi.getWishlist,
    enabled: isAuthenticated
  });

  const safeWishlist = isAuthenticated ? wishlist : guestWishlist;
  const wishlistIds = useMemo(() => new Set(safeWishlist.map((product) => product.id)), [safeWishlist]);

  const wishlistMutation = useMutation({
    mutationFn: async ({ productId, currentlyWishlisted }: WishlistMutationPayload) =>
      currentlyWishlisted ? customerApi.removeFromWishlist(productId) : customerApi.addToWishlist(productId),
    onSuccess: (updatedWishlist, variables) => {
      queryClient.setQueryData(["wishlist"], updatedWishlist);
      showWishlistToast({
        productTitle: variables.productTitle,
        variant: variables.currentlyWishlisted ? "removed" : "saved"
      });
    },
    onError: (error, variables) => {
      toast.error(
        getApiErrorMessage(
          error,
          variables.currentlyWishlisted ? "Failed to remove item from wishlist" : "Failed to save item to wishlist"
        ),
        { id: "wishlist-toast" }
      );
    }
  });

  function toggleWishlist(product: Product) {
    if (!isAuthenticated) {
      const wasWishlisted = isGuestWishlisted(product.id);
      toggleGuestWishlistItem(product);
      showWishlistToast({
        productTitle: product.title,
        variant: wasWishlisted ? "removed" : "saved"
      });
      return;
    }

    wishlistMutation.mutate({
      productId: product.id,
      productTitle: product.title,
      currentlyWishlisted: wishlistIds.has(product.id)
    });
  }

  return {
    wishlist: safeWishlist,
    wishlistCount: safeWishlist.length,
    wishlistIds,
    isAuthenticated,
    isWishlisted: (productId: number) => wishlistIds.has(productId),
    isWishlistUpdating:
      wishlistMutation.isPending && wishlistMutation.variables != null ? wishlistMutation.variables.productId : null,
    toggleWishlist
  };
}
