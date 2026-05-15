import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePageMeta } from "../hooks/usePageMeta";
import { BookmarkPlus, Building2, CalendarClock, ChevronRight, CreditCard, Landmark, MapPinned, QrCode, Tag, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { catalogApi, customerApi } from "api/client";
import { Button } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { SectionHeader } from "components/ui/SectionHeader";
import { StickyMobileBar } from "components/ui/StickyMobileBar";
import { useAuthStore } from "store/authStore";
import { startOrderPayment } from "utils/orderPayment";
import { getApiErrorMessage } from "../utils/api";
import { formatCartUnitCount, getCartQuantityCount } from "../utils/cartCounts";
import { formatCurrency } from "../utils/catalog";
import { calculateDeliveryCharge, calculateTaxAmount, getEstimatedDeliveryLabel, getGstRatePercent } from "../utils/orderPricing";
import type { CouponValidation, UserAddress } from "types";

type SavedAddress = UserAddress;

function getDeliveryETA(days = 5): string {
  const now = new Date();
  let businessDaysAdded = 0;
  const target = new Date(now);
  while (businessDaysAdded < days) {
    target.setDate(target.getDate() + 1);
    const day = target.getDay();
    if (day !== 0 && day !== 6) {
      businessDaysAdded++;
    }
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
  deliveryState: string;
  notes: string;
};

const basePaymentOptions = [
  { value: "CASH", label: "Cash", description: "Pay at pickup or delivery", icon: Building2 },
  { value: "UPI", label: "UPI", description: "Pay securely with Razorpay UPI", icon: QrCode },
  { value: "CARD", label: "Card", description: "Pay securely with Razorpay cards", icon: CreditCard },
  { value: "BANK_TRANSFER", label: "Net Banking", description: "Pay securely with Razorpay banking", icon: Landmark }
] as const;

const checkoutSteps = ["Cart", "Address", "Payment", "Review"] as const;

export function CheckoutPage() {
  usePageMeta({ title: "Checkout", description: "Complete your order at VR Technologies. Choose pickup or delivery, apply coupon codes, and pay securely." });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: cart = [] } = useQuery({ queryKey: ["cart"], queryFn: customerApi.getCart, enabled: Boolean(user) });
  const { data: siteSettings } = useQuery({ queryKey: ["site-settings"], queryFn: catalogApi.getSiteSettings });
  const { data: razorpaySettings } = useQuery({ queryKey: ["public-razorpay-settings"], queryFn: catalogApi.getRazorpaySettings });
  const { data: checkoutProfile } = useQuery({ queryKey: ["checkout-profile"], queryFn: customerApi.getCheckoutProfile, enabled: Boolean(user) });
  const { data: userProfile } = useQuery({ queryKey: ["user-profile"], queryFn: customerApi.getProfile, enabled: Boolean(user) });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
  const [saveAddressLabel, setSaveAddressLabel] = useState("");

  const [form, setForm] = useState<CheckoutFormState>({
    deliveryType: "PICKUP",
    paymentMethod: "CASH",
    storeId: "",
    contactName: user?.name ?? "",
    contactPhone: user?.phone ?? "",
    contactEmail: user?.email ?? "",
    deliveryAddress: "",
    deliveryState: "",
    notes: ""
  });

  useEffect(() => {
    setForm((current) => ({
      ...current,
      contactName: current.contactName || checkoutProfile?.contactName || userProfile?.preferredContactName || user?.name || "",
      contactPhone: current.contactPhone || checkoutProfile?.contactPhone || userProfile?.preferredContactPhone || user?.phone || "",
      contactEmail: current.contactEmail || checkoutProfile?.contactEmail || userProfile?.preferredContactEmail || user?.email || "",
      deliveryAddress: current.deliveryAddress || checkoutProfile?.defaultDeliveryAddress || "",
      deliveryState: current.deliveryState || siteSettings?.defaultState || ""
    }));
  }, [checkoutProfile, siteSettings?.defaultState, user?.email, user?.name, user?.phone, userProfile?.preferredContactEmail, userProfile?.preferredContactName, userProfile?.preferredContactPhone]);

  useEffect(() => {
    if (siteSettings && !siteSettings.deliveryEnabled && form.deliveryType === "DELIVERY") {
      setForm((current) => ({ ...current, deliveryType: "PICKUP" }));
    }
    if (siteSettings && !siteSettings.pickupEnabled && form.deliveryType === "PICKUP" && siteSettings.deliveryEnabled) {
      setForm((current) => ({ ...current, deliveryType: "DELIVERY" }));
    }
  }, [form.deliveryType, siteSettings]);

  const availableStores = useMemo(() => {
    if (!cart.length) {
      return [];
    }

    const firstProductStores = cart[0].product.stores;
    return firstProductStores.filter((store) =>
      cart.every((item) => item.product.stores.some((productStore) => productStore.id === store.id))
    );
  }, [cart]);

  useEffect(() => {
    if (!form.storeId && availableStores[0]) {
      setForm((current) => ({ ...current, storeId: String(availableStores[0].id) }));
    } else if (form.storeId && !availableStores.some((store) => String(store.id) === form.storeId)) {
      setForm((current) => ({ ...current, storeId: availableStores[0] ? String(availableStores[0].id) : "" }));
    }
  }, [availableStores, form.storeId]);

  const onlinePaymentsEnabled = Boolean(razorpaySettings?.enabled && razorpaySettings?.configured);
  const paymentOptions = useMemo(
    () => basePaymentOptions.filter((option) => option.value === "CASH" || onlinePaymentsEnabled),
    [onlinePaymentsEnabled]
  );

  useEffect(() => {
    if (!onlinePaymentsEnabled && form.paymentMethod !== "CASH") {
      setForm((current) => ({ ...current, paymentMethod: "CASH" }));
    }
  }, [form.paymentMethod, onlinePaymentsEnabled]);

  const selectedStore = availableStores.find((store) => String(store.id) === form.storeId);
  const savedAddresses = useMemo<SavedAddress[]>(() => {
    if (userProfile?.addresses?.length) {
      return userProfile.addresses;
    }
    return (checkoutProfile?.savedAddresses ?? []).map((address, index) => ({
      id: Number(address.id) || index + 1,
      label: address.label,
      contactName: address.contactName ?? checkoutProfile?.contactName ?? "",
      contactPhone: address.contactPhone ?? checkoutProfile?.contactPhone ?? "",
      contactEmail: checkoutProfile?.contactEmail ?? "",
      address: address.address,
      state: "",
      city: "",
      postalCode: "",
      defaultAddress: Boolean(address.defaultAddress)
    }));
  }, [checkoutProfile, userProfile?.addresses]);

  const totalItems = getCartQuantityCount(cart);
  const unitCountLabel = formatCartUnitCount(totalItems);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const afterDiscount = Math.max(0, subtotal - couponDiscount);
  const gstRatePercent = getGstRatePercent(siteSettings);
  const gstAmount = calculateTaxAmount(siteSettings, afterDiscount);
  const deliveryCharge = calculateDeliveryCharge(siteSettings, form.deliveryType, afterDiscount, form.deliveryState);
  const total = afterDiscount + gstAmount + deliveryCharge;
  const shippingEstimate = getEstimatedDeliveryLabel(siteSettings);

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      return;
    }

    try {
      setIsCouponLoading(true);
      const validation = await customerApi.validateCoupon(code, subtotal);
      setAppliedCoupon(validation);
      setCouponInput("");
      toast.success(validation.message || `Coupon applied: ${validation.code}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Invalid or expired coupon code"));
    } finally {
      setIsCouponLoading(false);
    }
  }

  async function saveCurrentAddress() {
    if (!saveAddressLabel.trim() || !form.deliveryAddress.trim()) {
      return;
    }

    try {
      const created = await customerApi.createAddress({
        label: saveAddressLabel.trim(),
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim() || undefined,
        address: form.deliveryAddress.trim(),
        state: form.deliveryState.trim() || undefined,
        defaultAddress: savedAddresses.length === 0
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["checkout-profile"] })
      ]);
      setSaveAddressLabel("");
      toast.success(`Address saved: ${created.label}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save address"));
    }
  }

  async function deleteSavedAddress(id: number) {
    try {
      await customerApi.deleteAddress(id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["checkout-profile"] })
      ]);
      toast.success("Address removed");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to remove address"));
    }
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

    if (form.deliveryType === "DELIVERY") {
      if (!form.deliveryAddress.trim()) {
        toast.error("Enter a delivery address");
        return;
      }
      if (!form.deliveryState.trim()) {
        toast.error("Enter a delivery state");
        return;
      }
    }

    if (form.paymentMethod !== "CASH" && !onlinePaymentsEnabled) {
      toast.error("Online payments are not configured right now");
      return;
    }

    try {
      setIsSubmitting(true);
      const order = await customerApi.placeOrder({
        ...form,
        storeId: Number(form.storeId),
        deliveryAddress: form.deliveryType === "DELIVERY" ? form.deliveryAddress.trim() : undefined,
        deliveryState: form.deliveryType === "DELIVERY" ? form.deliveryState.trim() : undefined,
        couponCode: appliedCoupon?.code
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

  if (!user) {
    return (
      <div className="vr-page-shell-tight">
        <Card className="p-10 text-center">
          <h1 className="text-3xl font-bold text-[var(--vr-text)]">Sign in to continue with checkout.</h1>
          <Link to="/login" className="mt-5 inline-flex rounded-2xl bg-[var(--vr-primary)] px-5 py-3 text-sm font-semibold text-white">
            Go to Login
          </Link>
        </Card>
      </div>
    );
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
          description="GST, delivery charges, and payment availability now follow the backend site settings and admin panel configuration."
        />
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {checkoutSteps.map((step, index) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 + index * 0.07, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                index <= 2 ? "border-[rgba(30,58,138,0.14)] bg-white text-[var(--vr-text)]" : "border-[var(--vr-border)] bg-[var(--vr-surface-soft)] text-[var(--vr-muted)]"
              }`}
            >
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--vr-primary)]">Step {index + 1}</div>
              <div className="mt-1">{step}</div>
            </motion.div>
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
                disabled={!siteSettings?.pickupEnabled}
                onClick={() => setForm((current) => ({ ...current, deliveryType: "PICKUP" }))}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  form.deliveryType === "PICKUP" ? "border-[rgba(30,58,138,0.16)] bg-[var(--vr-surface-soft)]" : "border-[var(--vr-border)] bg-white"
                } disabled:cursor-not-allowed disabled:opacity-45`}
              >
                <div className="font-semibold text-[var(--vr-text)]">Store Pickup</div>
                <div className="mt-1 text-sm leading-6 text-[var(--vr-muted)]">Choose a branch for collection and support.</div>
              </button>
              <button
                type="button"
                disabled={!siteSettings?.deliveryEnabled}
                onClick={() => setForm((current) => ({ ...current, deliveryType: "DELIVERY" }))}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  form.deliveryType === "DELIVERY" ? "border-[rgba(30,58,138,0.16)] bg-[var(--vr-surface-soft)]" : "border-[var(--vr-border)] bg-white"
                } disabled:cursor-not-allowed disabled:opacity-45`}
              >
                <div className="font-semibold text-[var(--vr-text)]">Home Delivery</div>
                <div className="mt-1 text-sm leading-6 text-[var(--vr-muted)]">Deliver the order to the buyer&apos;s address.</div>
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
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            contactName: saved.contactName || current.contactName,
                            contactPhone: saved.contactPhone || current.contactPhone,
                            contactEmail: saved.contactEmail || current.contactEmail,
                            deliveryAddress: saved.address,
                            deliveryState: saved.state || current.deliveryState
                          }))
                        }
                      >
                        <div className="text-xs font-semibold text-[var(--vr-primary)]">{saved.label}</div>
                        <div className="mt-0.5 text-xs text-[var(--vr-muted)] line-clamp-1">{saved.address}</div>
                        {saved.state ? <div className="mt-1 text-[11px] text-slate-400">{saved.state}</div> : null}
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

            {form.deliveryType === "DELIVERY" ? (
              <>
                <textarea
                  className="vr-input mt-5 min-h-[120px] rounded-[1.3rem] py-3"
                  placeholder="Delivery address"
                  value={form.deliveryAddress}
                  onChange={(event) => setForm((current) => ({ ...current, deliveryAddress: event.target.value }))}
                />
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_220px]">
                  <div className="rounded-[1.2rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] px-4 py-3 text-sm text-[var(--vr-muted)]">
                    <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">
                      <MapPinned className="h-4 w-4" />
                      Delivery State
                    </div>
                    <input
                      className="mt-2 w-full bg-transparent text-sm font-semibold text-[var(--vr-text)] outline-none"
                      placeholder="State for GST/shipping"
                      value={form.deliveryState}
                      onChange={(event) => setForm((current) => ({ ...current, deliveryState: event.target.value }))}
                    />
                  </div>
                  <div className="rounded-[1.2rem] border border-[var(--vr-border)] bg-[rgba(30,58,138,0.04)] px-4 py-3 text-sm text-[var(--vr-muted)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">Estimated delivery</div>
                    <div className="mt-2 font-semibold text-[var(--vr-text)]">{getDeliveryETA(siteSettings?.estimatedDeliveryDays ?? 5)}</div>
                  </div>
                </div>

                {form.deliveryAddress.trim() ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      className="vr-input flex-1 py-2 text-xs"
                      placeholder="Label (e.g. Home, Office)"
                      value={saveAddressLabel}
                      onChange={(event) => setSaveAddressLabel(event.target.value)}
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
              </>
            ) : (
              <textarea
                className="vr-input mt-5 min-h-[120px] rounded-[1.3rem] py-3"
                placeholder="Pickup note or landmark"
                value={form.deliveryAddress}
                onChange={(event) => setForm((current) => ({ ...current, deliveryAddress: event.target.value }))}
              />
            )}

            <textarea
              className="vr-input mt-4 min-h-[120px] rounded-[1.3rem] py-3"
              placeholder="Additional notes"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </Card>

          <Card>
            <SectionHeader eyebrow="Coupon" title="Apply admin-configured coupon" />
            <div className="mt-5">
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-2xl border border-[rgba(22,163,74,0.2)] bg-[rgba(22,163,74,0.06)] px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--vr-success)]">
                    <Tag className="h-4 w-4" />
                    {appliedCoupon.code} — {appliedCoupon.message || "Coupon applied"}
                  </div>
                  <button type="button" onClick={() => setAppliedCoupon(null)} className="text-xs text-[var(--vr-danger)]">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    className="vr-input flex-1"
                    placeholder="Enter coupon code"
                    value={couponInput}
                    onChange={(event) => setCouponInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void applyCoupon();
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={() => void applyCoupon()} disabled={isCouponLoading}>
                    {isCouponLoading ? "Checking..." : "Apply"}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <SectionHeader eyebrow="Payment" title="Choose payment method" />
            {!onlinePaymentsEnabled ? (
              <div className="mt-4 rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Online payment methods are currently disabled in admin settings. Cash checkout is still available.
              </div>
            ) : null}
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {paymentOptions.map((option, index) => {
                const selected = form.paymentMethod === option.value;
                return (
                  <motion.button
                    key={option.value}
                    type="button"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setForm((current) => ({ ...current, paymentMethod: option.value }))}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected ? "border-[rgba(30,58,138,0.16)] bg-[var(--vr-surface-soft)]" : "border-[var(--vr-border)] bg-white hover:bg-[var(--vr-surface-soft)]"
                    }`}
                  >
                    <div className="relative flex items-center gap-2">
                      <option.icon className={`h-5 w-5 transition ${selected ? "text-[var(--vr-primary)]" : "text-slate-400"}`} />
                      <AnimatePresence>
                        {selected && (
                          <motion.span
                            key="dot"
                            className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--vr-primary)]"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 22 }}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="mt-3 font-semibold text-[var(--vr-text)]">{option.label}</div>
                    <div className="mt-1 text-sm leading-6 text-[var(--vr-muted)]">{option.description}</div>
                  </motion.button>
                );
              })}
            </div>
          </Card>
        </section>

        <motion.aside
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
          className="space-y-4 lg:sticky lg:top-[13rem] lg:h-fit"
        >
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
                <span>Subtotal ({unitCountLabel})</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {couponDiscount > 0 ? (
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold text-[var(--vr-success)]">Coupon ({appliedCoupon?.code})</span>
                  <span className="font-semibold text-[var(--vr-success)]">-{formatCurrency(couponDiscount)}</span>
                </div>
              ) : null}
              <div className="mt-3 flex items-center justify-between">
                <span>{gstRatePercent > 0 ? `GST (${gstRatePercent}%)` : "Tax"}</span>
                <span>{formatCurrency(gstAmount)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span>Delivery</span>
                <span className={deliveryCharge > 0 ? "font-semibold text-[var(--vr-text)]" : "font-semibold text-[var(--vr-success)]"}>
                  {deliveryCharge > 0 ? formatCurrency(deliveryCharge) : "Free"}
                </span>
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
                  <span className="text-xs font-semibold">Est. delivery by {getDeliveryETA(siteSettings?.estimatedDeliveryDays ?? 5)}</span>
                </div>
              ) : null}
              <div className="mt-3 rounded-xl border border-[var(--vr-border)] bg-white px-3 py-2 text-xs">
                {siteSettings?.shippingNote || shippingEstimate}
                {siteSettings?.gstNumber ? <div className="mt-1 text-slate-400">GSTIN: {siteSettings.gstNumber}</div> : null}
              </div>
              <div className="mt-4 border-t border-[var(--vr-border)] pt-4">
                <div className="flex items-center justify-between text-lg font-semibold text-[var(--vr-text)]">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <motion.div className="mt-6" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}>
              <Button fullWidth size="lg" disabled={!availableStores.length || !form.storeId || isSubmitting} type="submit">
                {isSubmitting ? "Processing..." : form.paymentMethod === "CASH" ? "Place Order" : "Continue to Payment"}
              </Button>
            </motion.div>
          </Card>
        </motion.aside>
      </form>

      <StickyMobileBar>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[var(--vr-muted)]">{unitCountLabel} · {gstRatePercent > 0 ? `GST ${gstRatePercent}%` : "tax incl."}</div>
            <div className="text-lg font-extrabold text-[var(--vr-text)]">{formatCurrency(total)}</div>
          </div>
          <Button fullWidth className="flex-1" disabled={!availableStores.length || !form.storeId || isSubmitting} form="checkout-form" type="submit">
            {isSubmitting ? "Processing..." : "Continue"}
          </Button>
        </div>
      </StickyMobileBar>
    </div>
  );
}
