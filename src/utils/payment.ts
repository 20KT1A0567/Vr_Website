import type { PaymentCheckoutSession } from "types";

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayScript() {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay checkout")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.dataset.razorpayCheckout = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
      document.body.appendChild(script);
    }).finally(() => {
      if (!window.Razorpay) {
        razorpayScriptPromise = null;
      }
    });
  }

  return razorpayScriptPromise;
}

export async function openRazorpayCheckout(
  session: PaymentCheckoutSession,
  handlers: {
    onSuccess: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void | Promise<void>;
    onDismiss?: () => void;
  }
) {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error("Razorpay checkout is unavailable");
  }

  const instance = new window.Razorpay({
    key: session.keyId,
    amount: Math.round(session.amount * 100),
    currency: session.currency,
    name: session.merchantName,
    description: session.description,
    order_id: session.gatewayOrderId,
    prefill: {
      name: session.customerName,
      email: session.customerEmail,
      contact: session.customerPhone
    },
    notes: {
      internal_order_number: session.orderNumber
    },
    theme: {
      color: "#1e3a8a"
    },
    handler: (response) => {
      void handlers.onSuccess(response);
    },
    modal: {
      ondismiss: handlers.onDismiss
    }
  });

  instance.open();
}
