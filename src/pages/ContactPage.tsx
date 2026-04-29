import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { catalogApi } from "api/client";

export function ContactPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await catalogApi.createEnquiry(form);
    toast.success("Enquiry sent");
    setForm({ name: "", phone: "", email: "", message: "" });
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface p-8">
          <div className="eyebrow">Human Support</div>
          <h1 className="mt-4 text-4xl font-semibold text-slate-950">Talk to the team before you buy.</h1>
          <p className="mt-4 text-slate-600">
            The marketplace is strongest when customers can ask practical questions about battery, condition, store pickup, and warranty before checkout.
          </p>
        </div>

        <form className="surface space-y-5 p-8" onSubmit={handleSubmit}>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Your name"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950 placeholder:text-slate-400"
          />
          <input
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            placeholder="Phone number"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950 placeholder:text-slate-400"
          />
          <input
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="Email"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950 placeholder:text-slate-400"
          />
          <textarea
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            placeholder="Tell us what model, budget, or usage you need help with."
            rows={6}
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950 placeholder:text-slate-400"
          />
          <button className="button-primary w-full">Send enquiry</button>
        </form>
      </div>
    </div>
  );
}
