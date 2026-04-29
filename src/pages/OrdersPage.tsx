import { useQuery } from "@tanstack/react-query";
import { customerApi } from "api/client";

export function OrdersPage() {
  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: customerApi.getOrders });

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10">
      <div className="rounded-[2rem] bg-[#111714] px-8 py-9 text-white shadow-[0_30px_70px_rgba(16,21,16,0.2)]">
        <div className="inline-flex rounded-full border border-[#8fd23f]/35 bg-[#8fd23f]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b8ea6f]">
          Orders
        </div>
        <h1 className="mt-5 text-4xl font-extrabold">Track order status with store-aware fulfilment details.</h1>
      </div>

      <div className="mt-6 grid gap-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-[2rem] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Order #{order.id}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {order.status} • {order.paymentStatus} • {order.store?.name ?? "No store assigned"}
                </p>
                <p className="mt-1 text-sm text-slate-500">{order.items.length} item(s)</p>
              </div>
              <div className="text-3xl font-extrabold text-slate-950">Rs. {order.totalAmount.toLocaleString()}</div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
