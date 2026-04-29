import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronRight, CreditCard, Landmark, MapPin, QrCode, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { customerApi } from "api/client";
import { useAuthStore } from "store/authStore";
import { getApiErrorMessage } from "../utils/api";

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
  { value: "CASH", label: "Cash", icon: Building2 },
  { value: "UPI", label: "UPI", icon: QrCode },
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Landmark }
] as const;

export function CheckoutPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: cart = [] } = useQuery({ queryKey: ["cart"], queryFn: customerApi.getCart });

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
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

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
      await customerApi.placeOrder({
        ...form,
        storeId: Number(form.storeId),
        deliveryAddress: form.deliveryType === "DELIVERY" ? form.deliveryAddress : undefined
      });
      toast.success("Order placed successfully");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cart"] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] })
      ]);
      navigate("/orders");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to place order"));
    }
  }

  if (!cart.length) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-14 lg:px-10">
        <div className="store-dark-panel p-10 text-center">
          <h1 className="text-3xl font-bold text-white">Add products to your cart before checkout.</h1>
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
        <Link to="/cart" className="transition hover:text-white/70">
          Cart
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[#aadf67]">Checkout</span>
      </div>

      <form className="grid gap-6 xl:grid-cols-[1fr_360px]" onSubmit={handleSubmit}>
        <section className="space-y-5">
          <div className="store-dark-panel p-5">
            <div className="store-kicker">Checkout</div>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {["Address", "Delivery", "Payment", "Review"].map((step, index) => (
                <div
                  key={step}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                    index === 0 ? "border-[#89c73a]/30 bg-[#89c73a]/12 text-[#c6ee82]" : "border-white/8 bg-white/[0.03] text-white/54"
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="store-dark-panel p-5">
            <h2 className="text-2xl font-bold text-white">Delivery address</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                className="store-field"
                placeholder="Contact name"
                value={form.contactName}
                onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))}
              />
              <input
                className="store-field"
                placeholder="Contact phone"
                value={form.contactPhone}
                onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))}
              />
              <input
                className="store-field md:col-span-2"
                placeholder="Email"
                value={form.contactEmail}
                onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))}
              />
            </div>
          </div>

          <div className="store-dark-panel p-5">
            <h2 className="text-2xl font-bold text-white">Delivery options</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, deliveryType: "PICKUP" }))}
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  form.deliveryType === "PICKUP"
                    ? "border-[#89c73a]/30 bg-[#89c73a]/12 text-[#c6ee82]"
                    : "border-white/8 bg-white/[0.03] text-white/64"
                }`}
              >
                <div className="font-semibold text-white">Standard Pickup</div>
                <div className="mt-1 text-sm">Choose a store branch for collection.</div>
              </button>
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, deliveryType: "DELIVERY" }))}
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  form.deliveryType === "DELIVERY"
                    ? "border-[#89c73a]/30 bg-[#89c73a]/12 text-[#c6ee82]"
                    : "border-white/8 bg-white/[0.03] text-white/64"
                }`}
              >
                <div className="font-semibold text-white">Express Delivery</div>
                <div className="mt-1 text-sm">Deliver to your selected address.</div>
              </button>
            </div>

            <div className="mt-5">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/34">Choose store</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {availableStores.map((store) => (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, storeId: String(store.id) }))}
                    className={`rounded-xl border p-4 text-left transition ${
                      String(store.id) === form.storeId
                        ? "border-[#89c73a]/30 bg-[#89c73a]/12"
                        : "border-white/8 bg-white/[0.03] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="font-semibold text-white">{store.name}</div>
                    <div className="mt-1 text-sm text-white/58">
                      {store.address}, {store.city}
                    </div>
                    {store.timings ? <div className="mt-2 text-xs text-white/42">{store.timings}</div> : null}
                  </button>
                ))}
              </div>
            </div>

            {!availableStores.length ? (
              <div className="mt-5 rounded-[1.2rem] border border-amber-300/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
                These cart items do not share a common active store, so checkout cannot continue until the cart is adjusted.
              </div>
            ) : null}

            <textarea
              className="store-textarea mt-5"
              rows={4}
              placeholder={form.deliveryType === "DELIVERY" ? "Delivery address" : "Pickup note or landmark"}
              value={form.deliveryAddress}
              onChange={(event) => setForm((current) => ({ ...current, deliveryAddress: event.target.value }))}
            />

            <textarea
              className="store-textarea mt-4"
              rows={4}
              placeholder="Additional notes"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </div>

          <div className="store-dark-panel p-5">
            <h2 className="text-2xl font-bold text-white">Payment method</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {paymentOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, paymentMethod: option.value }))}
                  className={`rounded-xl border p-4 text-left transition ${
                    form.paymentMethod === option.value
                      ? "border-[#89c73a]/30 bg-[#89c73a]/12"
                      : "border-white/8 bg-white/[0.03] hover:bg-white/[0.05]"
                  }`}
                >
                  <option.icon className={`h-5 w-5 ${form.paymentMethod === option.value ? "text-[#c6ee82]" : "text-white/54"}`} />
                  <div className="mt-3 font-semibold text-white">{option.label}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="store-dark-panel h-fit p-5 lg:sticky lg:top-28">
          <h2 className="text-2xl font-bold text-white">Order summary</h2>
          <div className="mt-5 space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-white">{item.product.title}</div>
                    <div className="mt-1 text-sm text-white/46">
                      Qty {item.quantity} - Rs. {item.product.price.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-white">Rs. {(item.product.price * item.quantity).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-white/62">
            <div className="flex items-center justify-between">
              <span>Items</span>
              <span>{totalItems}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span>Store</span>
              <span>{selectedStore?.name ?? "Select store"}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span>Payment</span>
              <span>{form.paymentMethod}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span>Shipping</span>
              <span className="text-[#bde676]">Free</span>
            </div>
            <div className="mt-4 border-t border-white/8 pt-4">
              <div className="flex items-center justify-between text-lg font-semibold text-white">
                <span>Total Amount</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-white/60">
            <div className="inline-flex items-center gap-2 text-white">
              <ShieldCheck className="h-4 w-4 text-[#bde676]" />
              100% Secure Payments
            </div>
            <div className="mt-2">Your order, payment choice, and fulfillment store are saved together for clean admin tracking.</div>
          </div>

          <button className="store-primary-btn mt-6 w-full py-4 text-base" disabled={!availableStores.length || !form.storeId}>
            Continue to Payment
          </button>
        </aside>
      </form>
    </div>
  );
}
