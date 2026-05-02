import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePageMeta } from "../hooks/usePageMeta";
import { ArrowLeft, CalendarClock, Download, RefreshCcw, RotateCcw } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { ConfirmDialog } from "components/ui/ConfirmDialog";
import { SectionHeader } from "components/ui/SectionHeader";
import { StatusChip } from "components/ui/StatusChip";
import { Timeline, type TimelineItem } from "components/ui/Timeline";
import { customerApi } from "api/client";
import type { OrderTimelineEventType } from "types";
import { startOrderPayment } from "utils/orderPayment";
import { getApiErrorMessage } from "../utils/api";
import { formatCurrency } from "../utils/catalog";

function formatLabel(value?: string) {
  if (!value) {
    return "-";
  }
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function buildTrackingTimeline(order: Awaited<ReturnType<typeof customerApi.getOrder>>) {
  const eventMap = new Map(order.timeline.map((event) => [event.eventType, event]));
  const plannedSteps: Array<{ key: OrderTimelineEventType; title: string }> = [
    { key: "PLACED", title: "Order Placed" },
    { key: "CONFIRMED", title: "Confirmed" },
    { key: "PACKED", title: "Packed" },
    { key: "SHIPPED", title: "Out for Delivery" },
    { key: "DELIVERED", title: "Delivered" }
  ];

  return plannedSteps.map<TimelineItem>((step) => {
    const event = eventMap.get(step.key);
    const reached = Boolean(event);
    const cancelled = order.status === "CANCELLED" || order.status === "REFUNDED";
    const current =
      !cancelled &&
      ((step.key === "PLACED" && !eventMap.get("CONFIRMED")) ||
        (step.key === "CONFIRMED" && eventMap.get("CONFIRMED") && !eventMap.get("PACKED")) ||
        (step.key === "PACKED" && eventMap.get("PACKED") && !eventMap.get("SHIPPED")) ||
        (step.key === "SHIPPED" && eventMap.get("SHIPPED") && !eventMap.get("DELIVERED")) ||
        (step.key === "DELIVERED" && order.status === "DELIVERED"));

    return {
      id: step.key,
      title: step.title,
      description: event?.description ?? (current ? "This is the current progress step for your order." : "Pending this stage."),
      timestamp: event?.createdAt ? formatDateTime(event.createdAt) : undefined,
      status: cancelled ? (reached ? "complete" : "cancelled") : reached ? "complete" : current ? "current" : "upcoming"
    };
  });
}

export function OrderDetailPage() {
  const params = useParams();
  const orderId = Number(params.id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [dialogState, setDialogState] = useState<{ type: "cancel" | "return" | null; reason: string }>({
    type: null,
    reason: ""
  });

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => customerApi.getOrder(orderId),
    enabled: Number.isFinite(orderId)
  });

  const order = orderQuery.data;
  usePageMeta({ title: order ? `Order ${order.orderNumber}` : "Order Details" });
  const canRetryPayment = !!order && order.paymentMethod !== "CASH" && order.paymentStatus !== "PAID" && !["CANCELLED", "REFUNDED"].includes(order.status);
  const canCancel = !!order && ["PENDING", "CONFIRMED", "PACKED"].includes(order.status);
  const canReturn = order?.status === "DELIVERED";

  const trackingTimeline = useMemo(() => (order ? buildTrackingTimeline(order) : []), [order]);

  async function downloadInvoice() {
    if (!order) {
      return;
    }

    try {
      const blob = await customerApi.downloadInvoice(order.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${order.invoiceNumber}.html`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to download invoice"));
    }
  }

  async function retryPayment() {
    if (!order) {
      return;
    }

    try {
      await startOrderPayment({ orderId: order.id, queryClient, navigate });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to start payment"));
    }
  }

  async function submitDialogAction() {
    if (!order || !dialogState.type || !dialogState.reason.trim()) {
      return;
    }

    try {
      if (dialogState.type === "cancel") {
        await customerApi.cancelOrder(order.id, dialogState.reason.trim());
        toast.success("Order cancelled");
      } else {
        await customerApi.requestReturn(order.id, dialogState.reason.trim());
        toast.success("Return request submitted");
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["order", order.id] }),
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-order", order.id] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] })
      ]);

      setDialogState({ type: null, reason: "" });
    } catch (error) {
      toast.error(getApiErrorMessage(error, dialogState.type === "cancel" ? "Unable to cancel order" : "Unable to request return"));
    }
  }

  if (orderQuery.isLoading) {
    return (
      <div className="vr-page-shell-tight">
        <Card className="p-10 text-center text-slate-500">Loading order details...</Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="vr-page-shell-tight">
        <Card className="p-10 text-center">
          <h1 className="text-3xl font-semibold text-[var(--vr-text)]">Order not found.</h1>
          <Link to="/orders" className="mt-4 inline-flex text-sm font-semibold text-[var(--vr-primary)]">
            Back to orders
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="vr-page-shell-tight space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <Link to="/orders" className="inline-flex items-center gap-2 font-semibold text-[var(--vr-primary)]">
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
        <span>/</span>
        <span>{order.orderNumber}</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <Card variant="hero">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip label={order.status} />
                  <StatusChip label={order.paymentStatus} />
                  <StatusChip label={order.paymentMethod} tone="muted" />
                </div>
                <h1 className="mt-4 text-4xl font-extrabold text-[var(--vr-text)]">{order.orderNumber}</h1>
                <p className="mt-3 text-sm text-[var(--vr-muted)]">
                  Placed on {formatDateTime(order.createdAt)} | Invoice {order.invoiceNumber} | {order.store?.name ?? "No store assigned"}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={downloadInvoice}>
                  Invoice
                </Button>
                {canRetryPayment ? (
                  <Button icon={<RefreshCcw className="h-4 w-4" />} onClick={retryPayment}>
                    Retry Payment
                  </Button>
                ) : null}
                {canCancel ? (
                  <Button variant="danger" onClick={() => setDialogState({ type: "cancel", reason: "" })}>
                    Cancel Order
                  </Button>
                ) : null}
                {canReturn ? (
                  <Button variant="accent" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setDialogState({ type: "return", reason: "" })}>
                    Request Return
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeader eyebrow="Timeline" title="Live order progress" description="A clearer delivery timeline makes order status easier to understand at a glance." />
            <div className="mt-5 rounded-[1.4rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-5">
              <Timeline items={trackingTimeline} />
            </div>
          </Card>

          <Card>
            <SectionHeader eyebrow="Items" title="Products in this order" description="Line items, quantities, and captured prices remain visible for quick review." />
            <div className="mt-5 space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="rounded-[1.3rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-[var(--vr-text)]">{item.product.title}</div>
                      <div className="mt-1 text-sm text-[var(--vr-muted)]">
                        Qty {item.quantity} | Unit {formatCurrency(item.priceAtTime)}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-[var(--vr-text)]">{formatCurrency(item.priceAtTime * item.quantity)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader eyebrow="Activity" title="Detailed timeline events" description="Backend timeline entries still exist in full and are now easier to scan." />
            <div className="mt-5 space-y-3">
              {order.timeline.map((event) => (
                <div key={event.id} className="rounded-[1.3rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">{formatLabel(event.eventType)}</div>
                      <div className="mt-2 text-lg font-semibold text-[var(--vr-text)]">{event.title}</div>
                      {event.description ? <div className="mt-2 text-sm leading-7 text-[var(--vr-muted)]">{event.description}</div> : null}
                      {(event.actorName || event.actorEmail) ? (
                        <div className="mt-2 text-xs text-slate-400">
                          By {event.actorName ?? event.actorEmail} {event.source ? `| ${formatLabel(event.source)}` : ""}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-sm text-slate-400">{formatDateTime(event.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:h-fit">
          <Card>
            <SectionHeader eyebrow="Summary" title="Order snapshot" />
            <div className="mt-5 space-y-3 text-sm text-[var(--vr-muted)]">
              <div className="flex items-center justify-between">
                <span>Invoice</span>
                <span className="font-semibold text-[var(--vr-text)]">{order.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total</span>
                <span className="font-semibold text-[var(--vr-text)]">{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="font-semibold text-[var(--vr-text)]">{formatLabel(order.status)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment</span>
                <span className="font-semibold text-[var(--vr-text)]">{formatLabel(order.paymentStatus)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Method</span>
                <span className="font-semibold text-[var(--vr-text)]">{formatLabel(order.paymentMethod)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Store</span>
                <span className="font-semibold text-[var(--vr-text)]">{order.store?.name ?? "Not assigned"}</span>
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeader eyebrow="Customer" title="Customer and delivery details" />
            <div className="mt-5 space-y-3 text-sm text-[var(--vr-muted)]">
              <div>{order.contactName}</div>
              <div>{order.contactPhone}</div>
              {order.contactEmail ? <div>{order.contactEmail}</div> : null}
              {order.deliveryAddress ? <div>{order.deliveryAddress}</div> : null}
              {order.notes ? <div className="rounded-2xl bg-[var(--vr-surface-soft)] p-3 text-[var(--vr-muted)]">{order.notes}</div> : null}
              {order.cancellationReason ? <div className="rounded-2xl bg-[rgba(220,38,38,0.08)] p-3 text-[var(--vr-danger)]">Cancellation reason: {order.cancellationReason}</div> : null}
              {order.returnReason ? <div className="rounded-2xl bg-[rgba(245,158,11,0.14)] p-3 text-[#b45309]">Return reason: {order.returnReason}</div> : null}
            </div>
          </Card>

          {order.paymentStatus === "REFUNDED" || order.status === "REFUNDED" ? (
            <Card>
              <SectionHeader eyebrow="Refund" title="Refund status" />
              <div className="mt-5 space-y-3 text-sm text-[var(--vr-muted)]">
                <div className="flex items-center gap-3 rounded-[1.2rem] border border-[rgba(22,163,74,0.2)] bg-[rgba(22,163,74,0.06)] px-4 py-3">
                  <div className="h-2 w-2 rounded-full bg-[var(--vr-success)]" />
                  <span className="font-semibold text-[var(--vr-success)]">Refund Processed</span>
                </div>
                {order.latestPayment?.refundedAt ? (
                  <div className="flex items-center justify-between">
                    <span>Refunded on</span>
                    <span className="font-semibold text-[var(--vr-text)]">{formatDateTime(order.latestPayment.refundedAt)}</span>
                  </div>
                ) : null}
                {order.latestPayment?.amount ? (
                  <div className="flex items-center justify-between">
                    <span>Refund amount</span>
                    <span className="font-semibold text-[var(--vr-text)]">{formatCurrency(order.latestPayment.amount)}</span>
                  </div>
                ) : null}
                <p className="rounded-[1.1rem] bg-[var(--vr-surface-soft)] p-3 text-xs leading-6">
                  Refunds typically reflect in your account within 5–7 business days depending on your bank or payment provider.
                </p>
              </div>
            </Card>
          ) : order.status === "RETURN_REQUESTED" ? (
            <Card>
              <SectionHeader eyebrow="Return" title="Return request status" />
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center gap-3 rounded-[1.2rem] border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.08)] px-4 py-3">
                  <div className="h-2 w-2 rounded-full bg-[var(--vr-accent)]" />
                  <span className="font-semibold text-[#b45309]">Return Request Under Review</span>
                </div>
                <p className="rounded-[1.1rem] bg-[var(--vr-surface-soft)] p-3 text-xs leading-6 text-[var(--vr-muted)]">
                  Our team will review your return request and contact you within 2–3 business days. Refund will be processed after item inspection.
                </p>
              </div>
            </Card>
          ) : null}

          {order.deliveryType === "DELIVERY" && !["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status) ? (
            <Card>
              <SectionHeader eyebrow="Delivery" title="Estimated arrival" />
              <div className="mt-4 flex items-center gap-3 rounded-[1.2rem] border border-[rgba(30,58,138,0.12)] bg-[rgba(30,58,138,0.04)] px-4 py-3">
                <CalendarClock className="h-5 w-5 shrink-0 text-[var(--vr-primary)]" />
                <div>
                  <div className="text-sm font-semibold text-[var(--vr-text)]">3–5 business days from confirmation</div>
                  <div className="mt-1 text-xs text-[var(--vr-muted)]">Delivery timeline starts once the order is confirmed by your store.</div>
                </div>
              </div>
            </Card>
          ) : null}

          <Card>
            <SectionHeader eyebrow="Payment" title="Latest transaction" />
            {order.latestPayment ? (
              <div className="mt-5 space-y-3 text-sm text-[var(--vr-muted)]">
                <div className="flex items-center justify-between">
                  <span>Gateway</span>
                  <span className="font-semibold text-[var(--vr-text)]">{formatLabel(order.latestPayment.gateway)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="font-semibold text-[var(--vr-text)]">{formatLabel(order.latestPayment.status)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Amount</span>
                  <span className="font-semibold text-[var(--vr-text)]">{formatCurrency(order.latestPayment.amount)}</span>
                </div>
                {order.latestPayment.gatewayOrderId ? <div className="break-all text-xs text-slate-400">Gateway order ID: {order.latestPayment.gatewayOrderId}</div> : null}
                {order.latestPayment.gatewayPaymentId ? <div className="break-all text-xs text-slate-400">Gateway payment ID: {order.latestPayment.gatewayPaymentId}</div> : null}
                {order.latestPayment.failureReason ? <div className="rounded-2xl bg-[rgba(220,38,38,0.08)] p-3 text-[var(--vr-danger)]">{order.latestPayment.failureReason}</div> : null}
              </div>
            ) : (
              <div className="mt-5 text-sm text-[var(--vr-muted)]">No payment transaction has been recorded yet.</div>
            )}
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={dialogState.type !== null}
        title={dialogState.type === "cancel" ? "Cancel this order?" : "Request a return?"}
        description={
          dialogState.type === "cancel"
            ? "Tell us why you want to cancel. This reason will be sent through the same backend flow already used by the app."
            : "Tell us why you want to request a return. This will use the existing return-request API."
        }
        confirmLabel={dialogState.type === "cancel" ? "Submit Cancellation" : "Submit Return Request"}
        value={dialogState.reason}
        placeholder={dialogState.type === "cancel" ? "Reason for cancellation" : "Reason for return request"}
        requireValue
        confirmTone={dialogState.type === "cancel" ? "danger" : "accent"}
        onValueChange={(value) => setDialogState((current) => ({ ...current, reason: value }))}
        onCancel={() => setDialogState({ type: null, reason: "" })}
        onConfirm={submitDialogAction}
      />
    </div>
  );
}
