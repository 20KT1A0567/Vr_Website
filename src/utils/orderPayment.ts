import type { QueryClient } from "@tanstack/react-query";
import type { NavigateFunction } from "react-router-dom";
import type { Order } from "types";
import { customerApi } from "api/client";
import { openRazorpayCheckout } from "./payment";

async function refreshOrderQueries(queryClient: QueryClient, orderId: number) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["orders"] }),
    queryClient.invalidateQueries({ queryKey: ["order", orderId] }),
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
    queryClient.invalidateQueries({ queryKey: ["admin-order", orderId] }),
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] })
  ]);
}

export async function startOrderPayment({
  orderId,
  queryClient,
  navigate,
  onVerified
}: {
  orderId: number;
  queryClient: QueryClient;
  navigate: NavigateFunction;
  onVerified?: (order: Order) => void | Promise<void>;
}) {
  const session = await customerApi.createPaymentOrder(orderId);

  await openRazorpayCheckout(session, {
    onSuccess: async (response) => {
      try {
        const order = await customerApi.verifyPayment(orderId, {
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        });
        await refreshOrderQueries(queryClient, orderId);
        if (onVerified) {
          await onVerified(order);
        }
        navigate(`/payment/success?orderId=${orderId}`);
      } catch {
        navigate(`/payment/failure?orderId=${orderId}`);
      }
    },
    onDismiss: () => {
      navigate(`/payment/failure?orderId=${orderId}`);
    }
  });
}
