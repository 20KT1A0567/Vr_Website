import { CheckCircle2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="mx-auto max-w-[900px] px-6 py-16 lg:px-10">
      <div className="store-dark-panel p-10 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <div className="store-kicker mt-6">Payment Success</div>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-950">Your payment was verified successfully.</h1>
        <p className="mt-4 text-slate-500">
          The order has been saved with payment tracking, timeline events, and invoice access.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {orderId ? (
            <Link to={`/orders/${orderId}`} className="store-primary-btn px-6 py-3 text-sm">
              View Order
            </Link>
          ) : (
            <Link to="/orders" className="store-primary-btn px-6 py-3 text-sm">
              View Orders
            </Link>
          )}
          <Link to="/products" className="rounded-full border border-[rgba(30,58,138,0.12)] bg-white px-6 py-3 text-sm font-semibold text-[#1e3a8a]">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
