import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Minus, PackageCheck, Plus, ShieldCheck, ShoppingCart, Trash2, Truck } from "lucide-react";
import { usePageMeta } from "../hooks/usePageMeta";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { catalogApi, customerApi } from "api/client";
import { ProductCard } from "components/catalog/ProductCard";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { SectionHeader } from "components/ui/SectionHeader";
import { StickyMobileBar } from "components/ui/StickyMobileBar";
import { AnimatedNumber } from "components/ui/AnimatedNumber";
import { useAuthStore } from "store/authStore";
import { useCartStore } from "store/cartStore";
import type { CartItem, Product } from "types";
import { getApiErrorMessage } from "../utils/api";
import { formatCartItemCount, formatCartProductCount, formatCartUnitCount, getCartItemCount, getCartQuantityCount } from "../utils/cartCounts";
import { showCartToast } from "../utils/cartNotifications";
import { formatCurrency, getProductPrimaryImage, getProductSavings } from "../utils/catalog";

const GST_RATE = 0.18;

interface DisplayCartItem {
  id: string | number;
  productId: number;
  quantity: number;
  product: Product;
}

function getStockLimit(item: DisplayCartItem) {
  return Math.max(0, item.product.stockQuantity ?? 0);
}

export function CartPage() {
  usePageMeta({ title: "Your Cart", description: "Review your selected products and proceed to checkout." });
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const guestCart = useCartStore((state) => state.guestCart);
  const updateGuestCartQuantity = useCartStore((state) => state.updateGuestCartQuantity);
  const removeGuestCartItem = useCartStore((state) => state.removeGuestCartItem);
  const { data: cart = [] } = useQuery({ queryKey: ["cart"], queryFn: customerApi.getCart, enabled: Boolean(user) });
  const displayCart: DisplayCartItem[] = user
    ? cart.map((item) => ({ id: item.id, productId: item.product.id, quantity: item.quantity, product: item.product }))
    : guestCart.map((item) => ({ id: `guest-${item.product.id}`, productId: item.product.id, quantity: item.quantity, product: item.product }));
  const { data: featuredProducts = [] } = useQuery({
    queryKey: ["cart-upsell"],
    queryFn: () => catalogApi.getProducts({ inStock: true }),
    enabled: displayCart.length === 0
  });

  const subtotal = displayCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItems = getCartQuantityCount(displayCart);
  const totalSavings = displayCart.reduce((sum, item) => sum + getProductSavings(item.product) * item.quantity, 0);
  const totalMrp = subtotal + totalSavings;
  const gstAmount = Math.round(subtotal * GST_RATE);
  const total = subtotal + gstAmount;
  const cartItemCount = getCartItemCount(displayCart);
  const productCountLabel = formatCartProductCount(cartItemCount);
  const itemCountLabel = formatCartItemCount(cartItemCount);
  const unitCountLabel = formatCartUnitCount(totalItems);

  async function syncCart(action: Promise<CartItem[]>, successMessage?: string, onSuccess?: (nextCart: CartItem[]) => void) {
    try {
      const nextCart = await action;
      queryClient.setQueryData(["cart"], nextCart);
      if (onSuccess) {
        onSuccess(nextCart);
      } else if (successMessage) {
        toast.success(successMessage);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update cart"));
    }
  }

  if (!displayCart.length) {
    const upsellProducts = featuredProducts.slice(0, 4);
    return (
      <div className="vr-page-shell space-y-6">
        <EmptyState
          eyebrow="My Cart"
          title="Your cart is empty right now."
          description="Add products from the catalog and we will keep checkout, store selection, and totals in sync."
          action={<Link to="/products" className="inline-flex rounded-2xl bg-[var(--vr-primary)] px-5 py-3 text-sm font-semibold text-white">Continue Shopping</Link>}
        />
        {upsellProducts.length > 0 ? (
          <section>
            <SectionHeader
              eyebrow="You May Like"
              title="Popular picks to get started"
              description="Customers who browse our catalog most often pick these."
            />
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {upsellProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="vr-page-shell space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="transition hover:text-slate-700">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--vr-primary)]">Cart</span>
      </div>

      <Card variant="hero" className="overflow-hidden">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <SectionHeader
            eyebrow="My Cart"
            title="Review your products before checkout"
            description={`${itemCountLabel} in your cart, ${unitCountLabel} total quantity. Change quantities here before checkout.`}
          />
          <div className="flex shrink-0 flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--vr-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--vr-text)] shadow-sm">
              <ShoppingCart className="h-4 w-4 text-[var(--vr-primary)]" />
              {itemCountLabel}
            </span>
            <Link
              to="/products"
              className="inline-flex items-center justify-center rounded-full border border-[rgba(30,58,138,0.16)] bg-white px-4 py-2 text-sm font-bold text-[var(--vr-primary)] shadow-sm transition hover:border-[var(--vr-primary)] hover:bg-[var(--vr-surface-soft)]"
            >
              Add more products
            </Link>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          <Card variant="subtle">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Total (incl. GST)</div>
            <div className="mt-3 text-3xl font-extrabold text-[var(--vr-text)]">
              <AnimatedNumber value={total} format={(n) => formatCurrency(n)} />
            </div>
            <div className="mt-1 text-xs text-[var(--vr-muted)]">Subtotal {formatCurrency(subtotal)} + GST {formatCurrency(gstAmount)}</div>
          </Card>
          <Card variant="subtle">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">You saved</div>
            <div className="mt-3 text-3xl font-extrabold text-[var(--vr-success)]">
              <AnimatedNumber value={totalSavings} format={(n) => formatCurrency(n)} />
            </div>
          </Card>
          <Card variant="subtle">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white p-2 text-[var(--vr-primary)] shadow-sm">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Fulfillment</div>
                <div className="mt-1 text-base font-semibold text-[var(--vr-text)]">Pickup or delivery at checkout</div>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      {!user ? (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Guest Cart</div>
              <div className="mt-1 text-base font-bold text-amber-900">Sign in to checkout - your saved cart and wishlist will move with you.</div>
            </div>
            <Link to="/login" className="inline-flex items-center justify-center rounded-2xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white">
              Sign in &amp; Merge Cart
            </Link>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="space-y-4">
          <AnimatePresence initial={false}>
            {displayCart.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 36, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="overflow-hidden p-0">
                  <div className="grid gap-0 lg:grid-cols-[180px_1fr_220px]">
                    <Link
                      to={`/products/${item.product.id}`}
                      className="flex min-h-[180px] items-center justify-center border-b border-[var(--vr-border)] bg-[linear-gradient(135deg,#f8fbff,#eef4ff)] p-5 lg:border-b-0 lg:border-r"
                    >
                      {getProductPrimaryImage(item.product) ? (
                        <img
                          src={getProductPrimaryImage(item.product)}
                          alt={item.product.title}
                          className="h-36 w-full object-contain transition duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-36 w-full items-center justify-center rounded-2xl border border-dashed border-[var(--vr-border)] text-sm text-[var(--vr-muted)]">
                          Image coming soon
                        </div>
                      )}
                    </Link>

                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[rgba(30,58,138,0.08)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--vr-primary)]">
                          {item.product.brandName ?? "VR Certified"}
                        </span>
                        {getProductSavings(item.product) > 0 ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-[var(--vr-success)]">
                            Saving {formatCurrency(getProductSavings(item.product) * item.quantity)}
                          </span>
                        ) : null}
                      </div>

                      <Link to={`/products/${item.product.id}`}>
                        <h2 className="mt-3 text-xl font-extrabold leading-snug text-[var(--vr-text)] transition hover:text-[var(--vr-primary)]">
                          {item.product.title}
                        </h2>
                      </Link>
                      <p className="mt-2 text-sm leading-7 text-[var(--vr-muted)]">
                        {item.product.processor || item.product.categoryName || "Configured system"}
                        {item.product.ramGb ? ` | ${item.product.ramGb} GB RAM` : ""}
                        {item.product.storageGb ? ` | ${item.product.storageGb} GB storage` : ""}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[var(--vr-muted)]">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--vr-border)] bg-white px-3 py-1.5">
                          <PackageCheck className="h-3.5 w-3.5 text-[var(--vr-primary)]" />
                          {item.product.stores?.length ?? 0} store(s)
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--vr-border)] bg-white px-3 py-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-[var(--vr-success)]" />
                          {getStockLimit(item)} in stock
                        </span>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center overflow-hidden rounded-2xl border border-[var(--vr-border)] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                          <button
                            type="button"
                            aria-label={`Decrease quantity for ${item.product.title}`}
                            className="flex h-11 w-12 items-center justify-center text-slate-600 transition hover:bg-[var(--vr-surface-soft)] hover:text-[var(--vr-primary)]"
                            onClick={() => {
                              if (user) {
                                syncCart(item.quantity > 1 ? customerApi.updateCartItem(item.id as number, item.quantity - 1) : customerApi.removeCartItem(item.id as number));
                                return;
                              }
                              updateGuestCartQuantity(item.productId, item.quantity - 1);
                            }}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <div className="flex h-11 min-w-[3.4rem] items-center justify-center border-x border-[var(--vr-border)] bg-[var(--vr-surface-soft)] text-base font-extrabold text-[var(--vr-text)]">
                            {item.quantity}
                          </div>
                          <button
                            type="button"
                            aria-label={`Increase quantity for ${item.product.title}`}
                            disabled={getStockLimit(item) > 0 && item.quantity >= getStockLimit(item)}
                            className="flex h-11 w-12 items-center justify-center text-slate-600 transition hover:bg-[var(--vr-surface-soft)] hover:text-[var(--vr-primary)] disabled:cursor-not-allowed disabled:opacity-35"
                            onClick={() => {
                              if (user) {
                                syncCart(customerApi.updateCartItem(item.id as number, item.quantity + 1));
                                return;
                              }
                              updateGuestCartQuantity(item.productId, item.quantity + 1);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="text-xs font-semibold text-[var(--vr-muted)]">
                          {formatCurrency(item.product.price)} each
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between gap-5 border-t border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-5 lg:border-l lg:border-t-0">
                      <div className="lg:text-right">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Line total</div>
                        <div className="mt-2 text-2xl font-extrabold text-[var(--vr-text)]">
                          <AnimatedNumber value={item.product.price * item.quantity} format={(n) => formatCurrency(n)} />
                        </div>
                        {getProductSavings(item.product) > 0 ? (
                          <div className="mt-2 text-xs font-bold text-[var(--vr-success)]">
                            You save {formatCurrency(getProductSavings(item.product) * item.quantity)}
                          </div>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(220,38,38,0.16)] bg-white px-4 py-3 text-sm font-bold text-[var(--vr-danger)] transition hover:bg-[rgba(220,38,38,0.08)]"
                        onClick={() => {
                          if (user) {
                            syncCart(customerApi.removeCartItem(item.id as number), undefined, (nextCart) => {
                              showCartToast({ variant: "removed", productTitle: item.product.title, items: nextCart });
                            });
                            return;
                          }
                          removeGuestCartItem(item.productId);
                          showCartToast({ variant: "removed", productTitle: item.product.title, items: useCartStore.getState().guestCart });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-[13rem] lg:h-fit">
          <Card className="overflow-hidden p-0">
            <div className="bg-[linear-gradient(135deg,#1e3a8a,#233f9d)] p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/12 p-3 text-white">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">Order Summary</div>
                <div className="mt-1 text-2xl font-bold">Ready to checkout</div>
                <div className="mt-1 text-xs font-semibold text-white/68">{productCountLabel} | {unitCountLabel} total quantity</div>
              </div>
            </div>
            </div>

            <div className="p-5">
            <div className="space-y-3 rounded-[1.4rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4 text-sm text-[var(--vr-muted)]">
              <div className="flex items-center justify-between">
                <span>Total MRP</span>
                <span>{formatCurrency(totalMrp)}</span>
              </div>
              {totalSavings > 0 ? (
                <div className="flex items-center justify-between">
                  <span>Your savings</span>
                  <span className="font-semibold text-[var(--vr-success)]">-{formatCurrency(totalSavings)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>GST (18%)</span>
                <span>{formatCurrency(gstAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-[var(--vr-success)]">Free</span>
              </div>
              <div className="border-t border-[var(--vr-border)] pt-3">
                <div className="flex items-center justify-between text-base font-semibold text-[var(--vr-text)]">
                  <span>Total (incl. GST)</span>
                  <span>
                    <AnimatedNumber value={total} format={(n) => formatCurrency(n)} />
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-xs font-semibold text-[var(--vr-muted)]">
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--vr-border)] bg-white px-3 py-2.5">
                <ShieldCheck className="h-4 w-4 text-[var(--vr-success)]" />
                Warranty and quality check included
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--vr-border)] bg-white px-3 py-2.5">
                <Truck className="h-4 w-4 text-[var(--vr-primary)]" />
                Delivery or store pickup selected next
              </div>
            </div>

            <Link
              to={user ? "/checkout" : "/login"}
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[var(--vr-primary)] px-5 py-4 text-base font-bold text-white shadow-[0_14px_30px_rgba(30,58,138,0.22)] transition hover:bg-[var(--vr-primary-strong)]"
            >
              {user ? "Continue to Checkout" : "Sign in to Checkout"}
            </Link>
            </div>
          </Card>
        </aside>
      </div>

      <StickyMobileBar>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[var(--vr-muted)]">{itemCountLabel} | {unitCountLabel} | incl. GST</div>
            <div className="text-lg font-extrabold text-[var(--vr-text)]">{formatCurrency(total)}</div>
          </div>
          <Link to={user ? "/checkout" : "/login"} className="inline-flex min-h-[3rem] flex-1 items-center justify-center rounded-2xl bg-[var(--vr-primary)] px-5 text-sm font-semibold text-white">
            {user ? "Checkout" : "Sign in"}
          </Link>
        </div>
      </StickyMobileBar>
    </div>
  );
}
