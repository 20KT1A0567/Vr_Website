import { useQueryClient } from "@tanstack/react-query";
import { Heart, MapPin, ShieldCheck, ShoppingCart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { customerApi } from "api/client";
import type { Product } from "types";
import { useAuthStore } from "store/authStore";
import { useWishlist } from "../../hooks/useWishlist";
import { getApiErrorMessage } from "../../utils/api";

interface ProductCardProps {
  product: Product;
}

function formatStorage(product: Product) {
  if (!product.storageGb) {
    return undefined;
  }

  return product.storageGb >= 1024
    ? `${product.storageGb / 1024} TB ${product.storageType ?? ""}`.trim()
    : `${product.storageGb} GB ${product.storageType ?? ""}`.trim();
}

export function ProductCard({ product }: ProductCardProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { isWishlisted, isWishlistUpdating, toggleWishlist } = useWishlist();
  const primaryImage = product.images.find((image) => image.primaryImage)?.imageUrl ?? product.images[0]?.imageUrl;
  const secondaryImage = product.images.find((image) => !image.primaryImage)?.imageUrl ?? product.images[1]?.imageUrl;
  const wishlisted = isWishlisted(product.id);
  const locationLabel = product.stores[0]?.city ?? "Hyderabad";
  const specLine = [product.processor, product.ramGb ? `${product.ramGb} GB` : undefined, formatStorage(product)].filter(Boolean).join(" / ");

  async function handleAddToCart() {
    if (!user) {
      toast.error("Login to add this product to cart");
      return;
    }

    try {
      const nextCart = await customerApi.addToCart(product.id, 1);
      queryClient.setQueryData(["cart"], nextCart);
      toast.success("Added to cart");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to add product to cart"));
    }
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-[#dfe5d8] bg-white shadow-[0_18px_42px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(0,0,0,0.24)]">
      {product.discountPercent ? (
        <div className="absolute left-3 top-3 z-20 rounded-full bg-[#8fcf3a] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#101510]">
          {product.discountPercent}% off
        </div>
      ) : null}

      <button
        type="button"
        className={`absolute right-3 top-3 z-20 rounded-full border p-2.5 transition ${
          wishlisted
            ? "border-rose-200 bg-rose-50 text-rose-600"
            : "border-slate-200 bg-white/95 text-slate-500 hover:border-slate-300 hover:text-slate-900"
        }`}
        disabled={isWishlistUpdating === product.id}
        onClick={() => toggleWishlist(product)}
      >
        <Heart className="h-4 w-4" fill={wishlisted ? "currentColor" : "none"} />
      </button>

      <Link to={`/products/${product.id}`} className="block border-b border-slate-100 bg-[#f8fbf4] p-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1rem] bg-white">
          {primaryImage ? (
            <>
              <img
                src={primaryImage}
                alt={product.title}
                className={`h-full w-full object-contain p-3 transition duration-500 ${
                  secondaryImage ? "opacity-100 group-hover:scale-105 group-hover:opacity-0" : "group-hover:scale-105"
                }`}
              />
              {secondaryImage ? (
                <img
                  src={secondaryImage}
                  alt={product.title}
                  className="absolute inset-0 h-full w-full object-contain p-3 opacity-0 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                />
              ) : null}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">Image coming soon</div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{product.brandName ?? "VR Certified"}</div>
        <Link to={`/products/${product.id}`} className="mt-2 line-clamp-2 text-[1.02rem] font-bold leading-6 text-slate-950 transition hover:text-[#4d781a]">
          {product.title}
        </Link>
        <p className="mt-1.5 text-xs leading-5 text-slate-500">
          {specLine || product.categoryName || "Certified refurbished system"}
        </p>

        <div className="mt-3 flex items-center gap-2 text-xs text-[#5f8e25]">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-current" />
            <Star className="h-3.5 w-3.5 fill-current" />
            <Star className="h-3.5 w-3.5 fill-current" />
            <Star className="h-3.5 w-3.5 fill-current" />
            <Star className="h-3.5 w-3.5 fill-current" />
          </div>
          <span className="font-semibold text-slate-700">{product.featured ? "4.8" : "4.6"}</span>
          <span className="text-slate-400">({product.stores.length + 12} reviews)</span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-[1.65rem] font-extrabold leading-none text-slate-950">Rs. {product.price.toLocaleString()}</div>
            <div className="mt-1 flex items-center gap-2 text-xs">
              {product.originalPrice ? <span className="text-slate-400 line-through">Rs. {product.originalPrice.toLocaleString()}</span> : null}
              <span className="text-[#5f8e25]">{product.available ? "In stock" : "Check availability"}</span>
            </div>
          </div>
          <div className="space-y-1 text-right text-[11px] text-slate-500">
            <div className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#5f8e25]" />
              {locationLabel}
            </div>
            <div className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#5f8e25]" />
              {product.warrantyMonths ? `${product.warrantyMonths}M warranty` : "Quality checked"}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#88c83b] px-4 py-3 text-sm font-semibold text-[#101510] transition hover:bg-[#9edd43]"
        >
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </button>
      </div>
    </article>
  );
}
