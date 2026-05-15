import { useCallback, useMemo, useState } from "react";
import { customerApi } from "api/client";

export interface ProductReview {
  id: string;
  productId: number;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

const STORAGE_KEY = "vrtech-product-reviews";

function loadAllReviews(): ProductReview[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProductReview[]) : [];
  } catch {
    return [];
  }
}

function saveAllReviews(reviews: ProductReview[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch {}
}

export function useReviews(productId: number) {
  const [allReviews, setAllReviews] = useState<ProductReview[]>(loadAllReviews);

  const reviews = useMemo(
    () => allReviews.filter((r) => r.productId === productId),
    [allReviews, productId]
  );

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  const addReview = useCallback(
    (draft: {
      rating: number;
      title: string;
      body: string;
      authorName: string;
      verifiedPurchase?: boolean;
    }) => {
      const newReview: ProductReview = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        productId,
        rating: draft.rating,
        title: draft.title,
        body: draft.body,
        authorName: draft.authorName,
        verifiedPurchase: draft.verifiedPurchase ?? false,
        createdAt: new Date().toISOString()
      };
      setAllReviews((current) => {
        const next = [newReview, ...current];
        saveAllReviews(next);
        return next;
      });
      customerApi
        .submitReview({
          productId,
          customerName: draft.authorName,
          rating: draft.rating,
          title: draft.title,
          comment: draft.body
        })
        .catch(() => {});
      return newReview;
    },
    [productId]
  );

  return { reviews, addReview, averageRating };
}
