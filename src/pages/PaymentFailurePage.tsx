import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { startOrderPayment } from "utils/orderPayment";
import { getApiErrorMessage } from "../utils/api";

export function PaymentFailurePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const orderId = Number(searchParams.get("orderId"));

  async function retryPayment() {
    if (!Number.isFinite(orderId)) {
      return;
    }

    try {
      await startOrderPayment({ orderId, queryClient, navigate });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to restart payment"));
    }
  }

  return (
    <div className="mx-auto max-w-[900px] px-6 py-16 lg:px-10">
      <div className="store-dark-panel p-10 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-amber-500" />
        <div className="store-kicker mt-6">Payment Pending</div>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-950">The payment was not completed yet.</h1>
        <p className="mt-4 text-slate-500">
          Your order is still saved, and you can safely retry payment from here or from the order detail page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {Number.isFinite(orderId) ? (
            <>
              <button type="button" onClick={retryPayment} className="store-primary-btn inline-flex items-center gap-2 px-6 py-3 text-sm">
                <RefreshCcw className="h-4 w-4" />
                Retry Payment
              </button>
              <Link to={`/orders/${orderId}`} className="rounded-full border border-[rgba(30,58,138,0.12)] bg-white px-6 py-3 text-sm font-semibold text-[#1e3a8a]">
                View Order
              </Link>
            </>
          ) : (
            <Link to="/orders" className="store-primary-btn px-6 py-3 text-sm">
              View Orders
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
