import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePageMeta } from "../hooks/usePageMeta";
import { BookmarkPlus, Building2, CalendarClock, ChevronRight, CreditCard, Landmark, QrCode, Tag, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { customerApi } from "api/client";
import { Button } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { SectionHeader } from "components/ui/SectionHeader";
import { StickyMobileBar } from "components/ui/StickyMobileBar";
import { useAuthStore } from "store/authStore";
import { startOrderPayment } from "utils/orderPayment";
import { getApiErrorMessage } from "../utils/api";
import { formatCurrency } from "../utils/catalog";

const GST_RATE = 0.18;

const VALID_COUPONS: Record<string, { type: "percent" | "flat"; value: number; label: string }> = {
  WELCOME10: { type: "percent", value: 10, label: "10% off — Welcome offer" },
  SAVE500: { type: "flat", value: 500, label: "₹500 flat discount" },
  REFURB15: { type: "percent", value: 15, label: "15% off — Refurb special" }
};

const SAVED_ADDRESSES_KEY = "vrtech-saved-addresses";

interface SavedAddress {
  id: string;
  label: string;
  address: string;
}

function loadSavedAddresses(): SavedAddress[] {
  try {
    const raw = localStorage.getItem(SAVED_ADDRESSES_KEY);
    return raw ? (JSON.parse(raw) as SavedAddress[]) : [];
  } catch {
    return [];
  }
}

function persistAddresses(addresses: SavedAddress[]) {
  try {
    localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(addresses));
  } catch {}
}

function getDeliveryETA(): string {
  const now = new Date();
  let businessDaysAdded = 0;
  const target = new Date(now);
  while (businessDaysAdded < 5) {
    target.setDate(target.getDate() + 1);
    const day = target.getDay();
    if (day !== 0 && day !== 6) businessDaysAdded++;
  }
  return target.toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" });
}

type CheckoutFormState = {
  deliveryType: "PICKUP" | "DELIVERY";
  paymentMethod: "CASH" | "UPI" | "CARD" | "BANK_TRANSFER";
  storeId: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  deliveryAddress: string;
  notes: string;
};

const paymentOptions = [
  { value: "CASH", label: "Cash", description: "Pay at pickup or delivery", icon: Building2 },
  { value: "UPI", label: "UPI", description: "Fast digital payment flow", icon: QrCode },
  { value: "CARD", label: "Card", description: "Pay securely online", icon: CreditCard },
  { value: "BANK_TRANSFER", label: "Bank Transfer", description: "Manual payment via bank transfer", icon: Landmark }
] as const;

const checkoutSteps = ["Cart", "Address", "Payment", "Review"] as const;

export function CheckoutPage() {
  usePageMeta({ title: "Checkout", description: "Complete your order at VR Technologies. Choose pickup or delivery, apply coupon codes, and pay securely." });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: cart = [] } = useQuery({ queryKey: ["cart"], queryFn: customerApi.getCart });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(loadSavedAddresses);
  const [saveAddressLabel, setSaveAddressLabel] = useState("");

  const availableStores = useMemo(() => {
    if (!cart.length) {
      return [];
    }

    const firstProductStores = cart[0].product.stores;
    return firstProductStores.filter((store) =>
      cart.every((item) => item.product.stores.some((productStore) => productStore.id === store.id))
    );
  }, [cart]);

  const [form, setForm] = useState<CheckoutFormState>({
    deliveryType: "PICKUP",
    paymentMethod: "CASH",
    storeId: "",
    contactName: user?.name ?? "",
    contactPhone: user?.phone ?? "",
    contactEmail: user?.email ?? "",
    deliveryAddress: "",
    notes: ""
  });

  useEffect(() => {
    if (!form.storeId && availableStores[0]) {
      setForm((current) => ({ ...current, storeId: String(availableStores[0].id) }));
    } else if (form.storeId && !availableStores.some((store) => String(store.id) === form.storeId)) {
      setForm((current) => ({ ...current, storeId: availableStores[0] ? String(availableStores[0].id) : "" }));
    }
  }, [availableStores, form.storeId]);

  const selectedStore = availableStores.find((store) => String(store.id) === form.storeId);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const coupon = VALID_COUPONS[appliedCoupon];
    if (!coupon) return 0;
    return coupon.type === "percent" ? Math.round(subtotal * (coupon.value / 100)) : Math.min(coupon.value, subtotal);
  }, [appliedCoupon, subtotal]);

  const afterDiscount = subtotal - couponDiscount;
  const gstAmount = Math.round(afterDiscount * GST_RATE);
  const total = afterDiscount + gstAmount;

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (VALID_COUPONS[code]) {
      setAppliedCoupon(code);
      toast.success(`Coupon applied: ${VALID_COUPONS[code].label}`);
      setCouponInput("");
    } else {
      toast.error("Invalid or expired coupon code");
    }
  }

  function saveCurrentAddress() {
    if (!form.deliveryAddress.trim() || !saveAddressLabel.trim()) return;
    const newAddress: SavedAddress = {
      id: Date.now().toString(),
      label: saveAddressLabel.trim(),
      address: form.deliveryAddress.trim()
    };
    const next = [...savedAddresses, newAddress];
    setSavedAddresses(next);
    persistAddresses(next);
    setSaveAddressLabel("");
    toast.success("Address saved");
  }

  function deleteSavedAddress(id: string) {
    const next = savedAddresses.filter((a) => a.id !== id);
    setSavedAddresses(next);
    persistAddresses(next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cart.length) {
      toast.error("Your cart is empty");
      return;
    }

    if (!form.storeId) {
      toast.error("Select a fulfillment store");
      return;
    }

    if (form.deliveryType === "DELIVERY" && !form.deliveryAddress.trim()) {
      toast.error("Enter a delivery address");
      return;
    }

    try {
      setIsSubmitting(true);
      const order = await customerApi.placeOrder({
        ...form,
        storeId: Number(form.storeId),
        deliveryAddress: form.deliveryType === "DELIVERY" ? form.deliveryAddress : undefined
      });
      toast.success("Order placed successfully");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cart"] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["order", order.id] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] })
      ]);

      if (form.paymentMethod === "CASH") {
        navigate(`/orders/${order.id}`);
        return;
      }

      try {
        await startOrderPayment({ orderId: order.id, queryClient, navigate });
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Order placed, but payment could not be started"));
        navigate(`/payment/failure?orderId=${order.id}`);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to place order"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!cart.length) {
    return (
      <div className="vr-page-shell-tight">
        <Card className="p-10 text-center">
          <h1 className="text-3xl font-bold text-[var(--vr-text)]">Add products to your cart before checkout.</h1>
        </Card>
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
        <Link to="/cart" className="transition hover:text-slate-700">
          Cart
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--vr-primary)]">Checkout</span>
      </div>

      <Card variant="hero">
        <SectionHeader
          eyebrow="Checkout"
          title="Complete your order"
        />
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {checkoutSteps.map((step, index) => (
            <div
              key={step}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                index <= 2 ? "border-[rgba(30,58,138,0.14)] bg-white text-[var(--vr-text)]" : "border-[var(--vr-border)] bg-[var(--vr-surface-soft)] text-[var(--vr-muted)]"
              }`}
            >
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--vr-primary)]">Step {index + 1}</div>
              <div className="mt-1">{step}</div>
            </div>
          ))}
        </div>
      </Card>

      <form id="checkout-form" className="grid gap-6 xl:grid-cols-[1fr_380px]" onSubmit={handleSubmit}>
        <section className="space-y-5">
          <Card>
            <SectionHeader eyebrow="Address" title="Contact details" />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input className="vr-input" placeholder="Contact name" value={form.contactName} onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))} />
              <input className="vr-input" placeholder="Contact phone" value={form.contactPhone} onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))} />
              <input className="vr-input md:col-span-2" placeholder="Email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} />
            </div>
          </Card>

          <Card>
            <SectionHeader eyebrow="Fulfillment" title="Choose pickup or delivery" />

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, deliveryType: "PICKUP" }))}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  form.deliveryType === "PICKUP" ? "border-[rgba(30,58,138,0.16)] bg-[var(--vr-surface-soft)]" : "border-[var(--vr-border)] bg-white"
                }`}
              >
                <div className="font-semibold text-[var(--vr-text)]">Store Pickup</div>
                <div className="mt-1 text-sm leading-6 text-[var(--vr-muted)]">Choose a branch for collection and support.</div>
              </button>
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, deliveryType: "DELIVERY" }))}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  form.deliveryType === "DELIVERY" ? "border-[rgba(30,58,138,0.16)] bg-[var(--vr-surface-soft)]" : "border-[var(--vr-border)] bg-white"
                }`}
              >
                <div className="font-semibold text-[var(--vr-text)]">Home Delivery</div>
                <div className="mt-1 text-sm leading-6 text-[var(--vr-muted)]">Deliver the order to the buyer's address.</div>
              </button>
            </div>

            <div className="mt-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Select Store</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {availableStores.map((store) => (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, storeId: String(store.id) }))}
                    className={`rounded-2xl border p-4 text-left transition ${
                      String(store.id) === form.storeId ? "border-[rgba(30,58,138,0.16)] bg-[var(--vr-surface-soft)]" : "border-[var(--vr-border)] bg-white hover:bg-[var(--vr-surface-soft)]"
                    }`}
                  >
                    <div className="font-semibold text-[var(--vr-text)]">{store.name}</div>
                    <div className="mt-1 text-sm leading-6 text-[var(--vr-muted)]">
                      {store.address}, {store.city}
                    </div>
                    {store.timings ? <div className="mt-2 text-xs text-[var(--vr-primary)]">{store.timings}</div> : null}
                  </button>
                ))}
              </div>
            </div>

            {!availableStores.length ? (
              <div className="mt-5 rounded-[1.2rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                These cart items do not share a common active store, so checkout cannot continue until the cart is adjusted.
              </div>
            ) : null}

            {form.deliveryType === "DELIVERY" && savedAddresses.length > 0 ? (
              <div className="mt-5">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Saved Addresses</div>
                <div className="space-y-2">
                  {savedAddresses.map((saved) => (
                    <div key={saved.id} className="flex items-center gap-3 rounded-2xl border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-3">
                      <button
                        type="button"
                        className="flex-1 text-left"
                        onClick={() => setForm((c) => ({ ...c, deliveryAddress: saved.address }))}
                      >
                        <div className="text-xs font-semibold text-[var(--vr-primary)]">{saved.label}</div>
                        <div className="mt-0.5 text-xs text-[var(--vr-muted)] line-clamp-1">{saved.address}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSavedAddress(saved.id)}
                        className="shrink-0 text-[var(--vr-muted)] hover:text-[var(--vr-danger)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <textarea
              className="vr-input mt-5 min-h-[120px] rounded-[1.3rem] py-3"
              placeholder={form.deliveryType === "DELIVERY" ? "Delivery address" : "Pickup note or landmark"}
              value={form.deliveryAddress}
              onChange={(event) => setForm((current) => ({ ...current, deliveryAddress: event.target.value }))}
            />

            {form.deliveryType === "DELIVERY" && form.deliveryAddress.trim() ? (
              <div className="mt-3 flex gap-2">
                <input
                  className="vr-input flex-1 py-2 text-xs"
                  placeholder="Label (e.g. Home, Office)"
                  value={saveAddressLabel}
                  onChange={(e) => setSaveAddressLabel(e.target.value)}
                />
                <button
                  type="button"
                  onClick={saveCurrentAddress}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--vr-text)] transition hover:border-[var(--vr-primary)]"
                >
                  <BookmarkPlus className="h-3.5 w-3.5 text-[var(--vr-primary)]" />
                  Save
                </button>
              </div>
            ) : null}

            <textarea
              className="vr-input mt-4 min-h-[120px] rounded-[1.3rem] py-3"
              placeholder="Additional notes"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </Card>

          <Card>
            <SectionHeader eyebrow="Coupon" title="Have a discount code?" />
            <div className="mt-5">
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-2xl border border-[rgba(22,163,74,0.2)] bg-[rgba(22,163,74,0.06)] px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--vr-success)]">
                    <Tag className="h-4 w-4" />
                    {appliedCoupon} — {VALID_COUPONS[appliedCoupon]?.label}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAppliedCoupon(null)}
                    className="text-xs text-[var(--vr-danger)]"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    className="vr-input flex-1"
                    placeholder="Enter coupon code (e.g. WELCOME10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
                  />
                  <Button type="button" variant="secondary" onClick={applyCoupon}>Apply</Button>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(VALID_COUPONS).map(([code, info]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => { setAppliedCoupon(code); toast.success(`Coupon applied: ${info.label}`); }}
                    className="rounded-full border border-dashed border-[var(--vr-border)] px-3 py-1.5 text-xs font-semibold text-[var(--vr-primary)] transition hover:border-[var(--vr-primary)]"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeader eyebrow="Payment" title="Choose payment method" />
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {paymentOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, paymentMethod: option.value }))}
                  className={`rounded-2xl border p-4 text-left transition ${
                    form.paymentMethod === option.value ? "border-[rgba(30,58,138,0.16)] bg-[var(--vr-surface-soft)]" : "border-[var(--vr-border)] bg-white hover:bg-[var(--vr-surface-soft)]"
                  }`}
                >
                  <option.icon className={`h-5 w-5 ${form.paymentMethod === option.value ? "text-[var(--vr-primary)]" : "text-slate-400"}`} />
                  <div className="mt-3 font-semibold text-[var(--vr-text)]">{option.label}</div>
                  <div className="mt-1 text-sm leading-6 text-[var(--vr-muted)]">{option.description}</div>
                </button>
              ))}
            </div>
          </Card>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:h-fit">
          <Card>
            <SectionHeader eyebrow="Review" title="Order summary" />
            <div className="mt-5 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="rounded-[1.2rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-[var(--vr-text)]">{item.product.title}</div>
                      <div className="mt-1 text-sm text-[var(--vr-muted)]">Qty {item.quantity} | {formatCurrency(item.product.price)}</div>
                    </div>
                    <div className="text-sm font-semibold text-[var(--vr-text)]">{formatCurrency(item.product.price * item.quantity)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[1.4rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4 text-sm text-[var(--vr-muted)]">
              <div className="flex items-center justify-between">
                <span>Subtotal ({totalItems} items)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {couponDiscount > 0 ? (
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold text-[var(--vr-success)]">Coupon ({appliedCoupon})</span>
                  <span className="font-semibold text-[var(--vr-success)]">−{formatCurrency(couponDiscount)}</span>
                </div>
              ) : null}
              <div className="mt-3 flex items-center justify-between">
                <span>GST (18%)</span>
                <span>{formatCurrency(gstAmount)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-[var(--vr-success)]">Free</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span>Store</span>
                <span>{selectedStore?.name ?? "Select store"}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span>Payment</span>
                <span>{form.paymentMethod}</span>
              </div>
              {form.deliveryType === "DELIVERY" ? (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-[rgba(30,58,138,0.06)] px-3 py-2 text-[var(--vr-primary)]">
                  <CalendarClock className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-semibold">Est. delivery by {getDeliveryETA()}</span>
                </div>
              ) : null}
              <div className="mt-4 border-t border-[var(--vr-border)] pt-4">
                <div className="flex items-center justify-between text-lg font-semibold text-[var(--vr-text)]">
                  <span>Total (incl. GST)</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <Button fullWidth size="lg" className="mt-6" disabled={!availableStores.length || !form.storeId || isSubmitting} type="submit">
              {isSubmitting ? "Processing..." : "Continue to Payment"}
            </Button>
          </Card>
        </aside>
      </form>

      <StickyMobileBar>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[var(--vr-muted)]">{totalItems} items · incl. GST</div>
            <div className="text-lg font-extrabold text-[var(--vr-text)]">{formatCurrency(total)}</div>
          </div>
          <Button
            fullWidth
            className="flex-1"
            disabled={!availableStores.length || !form.storeId || isSubmitting}
            form="checkout-form"
            type="submit"
          >
            {isSubmitting ? "Processing..." : "Continue"}
          </Button>
        </div>
      </StickyMobileBar>
    </div>
  );
}
