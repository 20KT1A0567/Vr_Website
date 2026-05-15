import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePageMeta } from "../hooks/usePageMeta";
import { motion } from "framer-motion";
import { ArrowRight, PackageCheck, Receipt, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { SectionHeader } from "components/ui/SectionHeader";
import { StatusChip } from "components/ui/StatusChip";
import { Timeline, type TimelineItem } from "components/ui/Timeline";
import { customerApi } from "api/client";
import type { OrderTimelineEventType } from "types";
import { formatCurrency } from "../utils/catalog";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};

const cardVariant = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.38, ease: EASE } }
};

const statVariant = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } }
};

function formatLabel(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getTimelinePreview(order: Awaited<ReturnType<typeof customerApi.getOrder>>) {
  const orderedStatuses: OrderTimelineEventType[] = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "READY", "DELIVERED"];
  const timelineMap = new Map(order.timeline.map((event) => [event.eventType, event]));

  return orderedStatuses
    .filter((status) => status === "PLACED" || timelineMap.has(status))
    .slice(0, 4)
    .map<TimelineItem>((status, index, all) => {
      const event = timelineMap.get(status) ?? order.timeline[0];
      const isCurrent = index === all.length - 1 && !["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status);
      return {
        id: `${order.id}-${status}`,
        title: status === "PLACED" ? "Order Placed" : formatLabel(status),
        description: event?.description,
        timestamp: event?.createdAt ? formatDate(event.createdAt) : undefined,
        status: order.status === "CANCELLED" ? "cancelled" : isCurrent ? "current" : "complete"
      };
    });
}

export function OrdersPage() {
  usePageMeta({ title: "My Orders", description: "Track and manage your orders from VR Technologies." });
  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: customerApi.getOrders });

  const summary = useMemo(
    () => ({
      total: orders.length,
      active: orders.filter((order) => !["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status)).length,
      delivered: orders.filter((order) => order.status === "DELIVERED").length,
      paid: orders.filter((order) => order.paymentStatus === "PAID").length
    }),
    [orders]
  );

  return (
    <div className="vr-page-shell-tight space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <Card variant="hero">
          <SectionHeader
            eyebrow="Orders"
            title="Track every order with a cleaner progress view"
            description="Status, payment, and timeline preview now sit together so customers can understand order progress immediately."
          />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            {[
              { label: "Total Orders", value: summary.total },
              { label: "In Progress", value: summary.active },
              { label: "Delivered", value: summary.delivered },
              { label: "Paid Orders", value: summary.paid }
            ].map((stat) => (
              <motion.div key={stat.label} variants={statVariant}>
                <Card variant="subtle">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">{stat.label}</div>
                  <div className="mt-3 text-3xl font-extrabold text-[var(--vr-text)]">{stat.value}</div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </Card>
      </motion.div>

      {orders.length ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          className="space-y-4"
        >
          {orders.map((order) => (
            <motion.div key={order.id} variants={cardVariant}>
              <Card>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip label={order.status} />
                      <StatusChip label={order.paymentStatus} tone={order.paymentStatus === "PAID" ? "success" : undefined} />
                      <StatusChip label={order.deliveryType} tone="muted" />
                    </div>
                    <h2 className="mt-4 text-2xl font-bold text-[var(--vr-text)]">{order.orderNumber}</h2>
                    <p className="mt-2 text-sm text-[var(--vr-muted)]">
                      Ordered on {formatDate(order.createdAt)} | {order.store?.name ?? "No store assigned"} | {order.items.length} item(s)
                    </p>

                    <div className="mt-5 rounded-[1.4rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4">
                      <Timeline items={getTimelinePreview(order)} compact />
                    </div>
                  </div>

                  <div className="grid min-w-[260px] gap-3 lg:max-w-[280px]">
                    <div className="rounded-[1.4rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4">
                      <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vr-primary)]">
                        <Wallet className="h-4 w-4" />
                        Order Value
                      </div>
                      <div className="mt-3 text-3xl font-extrabold text-[var(--vr-text)]">{formatCurrency(order.totalAmount)}</div>
                    </div>
                    <div className="rounded-[1.4rem] border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] p-4">
                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--vr-text)]">
                        <PackageCheck className="h-4 w-4 text-[var(--vr-primary)]" />
                        {formatLabel(order.paymentMethod)}
                      </div>
                      <div className="mt-2 text-sm text-[var(--vr-muted)]">Invoice {order.invoiceNumber}</div>
                      <div className="mt-2 text-sm text-[var(--vr-muted)]">Contact {order.contactPhone}</div>
                    </div>
                    <Link to={`/orders/${order.id}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--vr-primary)] px-5 py-3 text-sm font-semibold text-white">
                      View Detail
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState
          eyebrow="No Orders Yet"
          title="Your order history is empty."
          description="Orders placed from your cart will appear here with payment, timeline, and store details."
          action={<Link to="/products" className="inline-flex rounded-2xl bg-[var(--vr-primary)] px-5 py-3 text-sm font-semibold text-white">Start Shopping</Link>}
        />
      )}
    </div>
  );
}
