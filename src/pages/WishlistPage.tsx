import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductCard } from "components/catalog/ProductCard";
import { useWishlist } from "../hooks/useWishlist";

export function WishlistPage() {
  const { wishlist } = useWishlist();

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
      <div className="surface relative overflow-hidden p-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.12),transparent_55%)]" />
        <div className="relative">
          <div className="eyebrow">
            <Heart className="h-3.5 w-3.5" />
            Wishlist
          </div>
          <h1 className="mt-4 text-4xl font-semibold text-slate-950">Keep a sharper shortlist and revisit it faster.</h1>
          <p className="mt-3 max-w-3xl text-slate-600">Your saved products stay ready for later comparison, store follow-up, and checkout decisions.</p>
        </div>
      </div>

      {wishlist.length ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="surface mt-6 p-10 text-center">
          <h2 className="text-3xl font-semibold text-slate-950">Your wishlist is still empty.</h2>
          <p className="mt-3 text-slate-600">Tap the heart on any product card to save it here for later.</p>
          <Link to="/products" className="button-primary mt-6">
            Explore products
          </Link>
        </div>
      )}
    </div>
  );
}
