import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Minus, Plus, ShieldCheck, ShoppingCart, Trash2, Truck, Undo2 } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { customerApi } from "api/client";
import { getApiErrorMessage } from "../utils/api";

export function CartPage() {
  const queryClient = useQueryClient();
  const { data: cart = [] } = useQuery({ queryKey: ["cart"], queryFn: customerApi.getCart });
  const [couponCode, setCouponCode] = useState("");
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  async function syncCart(action: Promise<unknown>, successMessage?: string) {
    try {
      const nextCart = await action;
      queryClient.setQueryData(["cart"], nextCart);
      if (successMessage) {
        toast.success(successMessage);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update cart"));
    }
  }

  function handleCouponApply() {
    toast("Promo code support can be connected next.");
  }

  if (!cart.length) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-14 lg:px-10">
        <div className="store-dark-panel p-10 text-center">
          <div className="store-kicker">My cart</div>
          <h1 className="mt-5 text-3xl font-bold text-white">Your cart is empty right now.</h1>
          <p className="mt-3 text-white/58">Add products from the catalog and we will keep checkout, store selection, and totals in sync.</p>
          <Link to="/products" className="store-primary-btn mt-8">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-white/40">
        <Link to="/" className="transition hover:text-white/70">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[#aadf67]">Cart</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="store-dark-panel p-5">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/8 pb-5">
            <div>
              <div className="store-kicker">My Cart</div>
              <h1 className="mt-4 text-3xl font-bold text-white">Review your selected products before checkout.</h1>
              <p className="mt-2 text-white/58">{totalItems} item(s) saved in your cart.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/64">
              Total unique products: {cart.length}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {cart.map((item) => (
              <article key={item.id} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="grid gap-4 md:grid-cols-[120px_1fr_auto] md:items-center">
                  <div className="aspect-[4/3] overflow-hidden rounded-[1rem] bg-white">
                    {item.product.images[0]?.imageUrl ? (
                      <img src={item.product.images[0].imageUrl} alt={item.product.title} className="h-full w-full object-contain p-3" />
                    ) : null}
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-white">{item.product.title}</h2>
                    <p className="mt-2 text-sm text-white/56">
                      {item.product.processor || item.product.categoryName || "Configured system"} {item.product.ramGb ? `- ${item.product.ramGb} GB RAM` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/46">
                      <span>{item.product.stores.length} store(s)</span>
                      <span>Stock left: {item.product.stockQuantity ?? 0}</span>
                    </div>

                    <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-3 py-2">
                      <button
                        className="rounded-full border border-white/10 bg-white/[0.06] p-2 text-white/74"
                        onClick={() =>
                          syncCart(
                            item.quantity > 1 ? customerApi.updateCartItem(item.id, item.quantity - 1) : customerApi.removeCartItem(item.id)
                          )
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-semibold text-white">{item.quantity}</span>
                      <button
                        className="rounded-full border border-white/10 bg-white/[0.06] p-2 text-white/74"
                        onClick={() => syncCart(customerApi.updateCartItem(item.id, item.quantity + 1))}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-4 md:items-end">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">Rs. {(item.product.price * item.quantity).toLocaleString()}</div>
                      <div className="mt-1 text-sm text-white/42">Rs. {item.product.price.toLocaleString()} each</div>
                    </div>

                    <button
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-300/25 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200"
                      onClick={() => syncCart(customerApi.removeCartItem(item.id), "Removed from cart")}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="store-dark-panel h-fit p-5 lg:sticky lg:top-28">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#89c73a] p-3 text-[#101510]">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#aadf67]">Order summary</div>
              <div className="mt-1 text-2xl font-bold text-white">My Cart ({totalItems} items)</div>
            </div>
          </div>

          <div className="mt-6 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
            <div className="text-sm font-semibold text-white">Coupon code</div>
            <div className="mt-3 flex gap-2">
              <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Enter coupon code" className="store-field" />
              <button type="button" onClick={handleCouponApply} className="store-primary-btn px-4">
                Apply
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-3 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-white/64">
            <div className="flex items-center justify-between">
              <span>Total MRP</span>
              <span>Rs. {total.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Discount on MRP</span>
              <span className="text-[#bde676]">Rs. 0</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span className="text-[#bde676]">Free</span>
            </div>
            <div className="border-t border-white/8 pt-3">
              <div className="flex items-center justify-between text-base font-semibold text-white">
                <span>Total Amount</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-white/62">
              <div className="inline-flex items-center gap-2 text-white">
                <ShieldCheck className="h-4 w-4 text-[#bde676]" />
                Secure checkout
              </div>
              <div className="mt-2">Branch-aware order placement and payment-ready flow.</div>
            </div>
            <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-white/62">
              <div className="inline-flex items-center gap-2 text-white">
                <Undo2 className="h-4 w-4 text-[#bde676]" />
                Easy returns
              </div>
              <div className="mt-2">Return and support policies remain visible during checkout.</div>
            </div>
            <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-white/62">
              <div className="inline-flex items-center gap-2 text-white">
                <Truck className="h-4 w-4 text-[#bde676]" />
                Fast fulfillment
              </div>
              <div className="mt-2">Choose pickup or delivery based on available stores.</div>
            </div>
          </div>

          <Link to="/checkout" className="store-primary-btn mt-6 w-full py-4 text-base">
            Continue to Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
