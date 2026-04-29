import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock3, MapPinned, PhoneCall } from "lucide-react";
import { catalogApi } from "api/client";
import { getApiErrorMessage } from "../utils/api";

export function StoresPage() {
  const storesQuery = useQuery({ queryKey: ["stores"], queryFn: catalogApi.getStores });
  const stores = storesQuery.data ?? [];

  if (storesQuery.error) {
    return (
      <div className="mx-auto max-w-[1600px] px-6 py-12 lg:px-10">
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-8 py-10 text-rose-700">
          <div className="text-sm font-semibold uppercase tracking-[0.24em]">Stores API error</div>
          <h1 className="mt-4 text-3xl font-bold text-rose-900">Store locations could not be loaded.</h1>
          <p className="mt-3 text-base">{getApiErrorMessage(storesQuery.error, "Check the backend stores API.")}</p>
        </div>
      </div>
    );
  }

  if (storesQuery.isLoading) {
    return (
      <div className="mx-auto max-w-[1600px] px-6 py-12 lg:px-10">
        <div className="rounded-[2rem] bg-white px-8 py-10 text-slate-600 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          Loading store locations...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-10 lg:px-10">
      <div className="rounded-[2rem] bg-[#111714] px-8 py-10 text-white shadow-[0_30px_70px_rgba(16,21,16,0.2)]">
        <div className="inline-flex rounded-full border border-[#8fd23f]/35 bg-[#8fd23f]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b8ea6f]">
          Store network
        </div>
        <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight">Choose the branch customers can use for pickup-backed checkout and local support.</h1>
        <p className="mt-4 max-w-3xl text-lg text-white/70">
          These stores are managed from the admin panel and are used on the homepage, product detail availability, and checkout fulfilment selection.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {stores.map((store) => (
          <article key={store.id} className="overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
            <div className="aspect-[16/8] bg-slate-100">
              {store.imageUrl ? <img src={store.imageUrl} alt={store.name} className="h-full w-full object-cover" /> : null}
            </div>

            <div className="p-6 lg:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">{store.name}</h2>
                  <p className="mt-2 text-slate-600">
                    {store.address}, {store.city}, {store.state}
                  </p>
                </div>
                <span className="rounded-full bg-[#eef7e0] px-4 py-2 text-sm font-semibold text-[#577221]">{store.active ? "Active" : "Hidden"}</span>
              </div>

              <div className="mt-6 grid gap-3 text-sm text-slate-600">
                <div className="inline-flex items-center gap-2">
                  <MapPinned className="h-4 w-4 text-[#5d7a28]" />
                  {store.city}, {store.state}
                </div>
                <div className="inline-flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-[#5d7a28]" />
                  {store.phone}
                </div>
                {store.timings ? (
                  <div className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-[#5d7a28]" />
                    {store.timings}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {store.mapLink ? (
                  <a
                    href={store.mapLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[#8fd23f]/30 bg-[#f4fbe8] px-5 py-3 text-sm font-semibold text-[#4f6d1f]"
                  >
                    Get directions
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ) : null}
                {store.whatsapp ? (
                  <a
                    href={`https://wa.me/${store.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-[#8fd23f] px-5 py-3 text-sm font-semibold text-[#101510]"
                  >
                    WhatsApp store
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
