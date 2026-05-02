import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { usePageMeta } from "../hooks/usePageMeta";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { catalogApi, customerApi } from "api/client";
import { ProductCard } from "components/catalog/ProductCard";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { SectionHeader } from "components/ui/SectionHeader";
import { StickyMobileBar } from "components/ui/StickyMobileBar";
import { getApiErrorMessage } from "../utils/api";
import { formatCurrency, getProductPrimaryImage, getProductSavings } from "../utils/catalog";

const GST_RATE = 0.18;

export function CartPage() {
  usePageMeta({ title: "Your Cart", description: "Review your selected products and proceed to checkout." });
  const queryClient = useQueryClient();
  const { data: cart = [] } = useQuery({ queryKey: ["cart"], queryFn: customerApi.getCart });
  const { data: featuredProducts = [] } = useQuery({
    queryKey: ["cart-upsell"],
    queryFn: () => catalogApi.getProducts({ inStock: true }),
    enabled: cart.length === 0
  });

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalSavings = cart.reduce((sum, item) => sum + getProductSavings(item.product) * item.quantity, 0);
  const gstAmount = Math.round(subtotal * GST_RATE);
  const total = subtotal + gstAmount;

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

  if (!cart.length) {
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

      <Card variant="hero">
        <SectionHeader
          eyebrow="My Cart"
          title="Review your products before checkout"
          action={<span className="rounded-full border border-[var(--vr-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--vr-text)]">{totalItems} items</span>}
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          <Card variant="subtle">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Total (incl. GST)</div>
            <div className="mt-3 text-3xl font-extrabold text-[var(--vr-text)]">{formatCurrency(total)}</div>
            <div className="mt-1 text-xs text-[var(--vr-muted)]">Subtotal {formatCurrency(subtotal)} + GST {formatCurrency(gstAmount)}</div>
          </Card>
          <Card variant="subtle">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">You saved</div>
            <div className="mt-3 text-3xl font-extrabold text-[var(--vr-success)]">{formatCurrency(totalSavings)}</div>
          </Card>
          <Card variant="subtle">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Fulfillment</div>
            <div className="mt-3 text-base font-semibold text-[var(--vr-text)]">Store-aware pickup or delivery at checkout</div>
          </Card>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="space-y-4">
          {cart.map((item) => (
            <Card key={item.id} className="p-4 sm:p-5">
              <div className="grid gap-4 md:grid-cols-[140px_1fr_auto] md:items-center">
                <div className="overflow-hidden rounded-[1.2rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)]">
                  {getProductPrimaryImage(item.product) ? (
                    <img src={getProductPrimaryImage(item.product)} alt={item.product.title} className="h-32 w-full object-contain p-3" />
                  ) : (
                    <div className="flex h-32 items-center justify-center text-sm text-[var(--vr-muted)]">Image coming soon</div>
                  )}
                </div>

                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">{item.product.brandName ?? "VR Certified"}</div>
                  <h2 className="mt-2 text-xl font-bold text-[var(--vr-text)]">{item.product.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--vr-muted)]">
                    {item.product.processor || item.product.categoryName || "Configured system"} {item.product.ramGb ? `| ${item.product.ramGb} GB RAM` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--vr-muted)]">
                    <span>{item.product.stores.length} store(s)</span>
                    <span>{item.product.stockQuantity ?? 0} in stock</span>
                    {getProductSavings(item.product) > 0 ? <span className="font-semibold text-[var(--vr-success)]">Saving {formatCurrency(getProductSavings(item.product) * item.quantity)}</span> : null}
                  </div>

                  <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-[var(--vr-border)] bg-white px-3 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                    <button
                      type="button"
                      className="rounded-full border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-2 text-slate-600"
                      onClick={() => syncCart(item.quantity > 1 ? customerApi.updateCartItem(item.id, item.quantity - 1) : customerApi.removeCartItem(item.id))}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-semibold text-[var(--vr-text)]">{item.quantity}</span>
                    <button
                      type="button"
                      className="rounded-full border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-2 text-slate-600"
                      onClick={() => syncCart(customerApi.updateCartItem(item.id, item.quantity + 1))}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-4 md:items-end">
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-[var(--vr-text)]">{formatCurrency(item.product.price * item.quantity)}</div>
                    <div className="mt-1 text-sm text-slate-400">{formatCurrency(item.product.price)} each</div>
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(220,38,38,0.16)] bg-[rgba(220,38,38,0.08)] px-4 py-2 text-sm font-semibold text-[var(--vr-danger)]"
                    onClick={() => syncCart(customerApi.removeCartItem(item.id), "Removed from cart")}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:h-fit">
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[var(--vr-primary)] p-3 text-white">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--vr-primary)]">Order Summary</div>
                <div className="mt-1 text-2xl font-bold text-[var(--vr-text)]">Ready to checkout</div>
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-[1.4rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4 text-sm text-[var(--vr-muted)]">
              <div className="flex items-center justify-between">
                <span>Total MRP</span>
                <span>{formatCurrency(subtotal + totalSavings)}</span>
              </div>
              {totalSavings > 0 ? (
                <div className="flex items-center justify-between">
                  <span>Your savings</span>
                  <span className="font-semibold text-[var(--vr-success)]">−{formatCurrency(totalSavings)}</span>
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
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <Link to="/checkout" className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[var(--vr-primary)] px-5 py-4 text-base font-semibold text-white">
              Continue to Checkout
            </Link>
          </Card>
        </aside>
      </div>

      <StickyMobileBar>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[var(--vr-muted)]">{totalItems} items · incl. GST</div>
            <div className="text-lg font-extrabold text-[var(--vr-text)]">{formatCurrency(total)}</div>
          </div>
          <Link to="/checkout" className="inline-flex min-h-[3rem] flex-1 items-center justify-center rounded-2xl bg-[var(--vr-primary)] px-5 text-sm font-semibold text-white">
            Checkout
          </Link>
        </div>
      </StickyMobileBar>
    </div>
  );
}
