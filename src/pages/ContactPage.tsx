import { FormEvent, useState } from "react";
import { Building2, Package } from "lucide-react";
import { usePageMeta } from "../hooks/usePageMeta";
import toast from "react-hot-toast";
import { catalogApi } from "api/client";

const inputClass = "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950 placeholder:text-slate-400";

export function ContactPage() {
  usePageMeta({ title: "Contact Us", description: "Get in touch with VR Technologies for product enquiries, bulk orders, warranty support, or general assistance. We're here to help." });
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [b2bForm, setB2bForm] = useState({ companyName: "", contactName: "", phone: "", email: "", quantity: "", requirements: "" });
  const [activeSection, setActiveSection] = useState<"general" | "b2b">("general");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await catalogApi.createEnquiry(form);
    toast.success("Enquiry sent");
    setForm({ name: "", phone: "", email: "", message: "" });
  }

  async function handleB2bSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await catalogApi.createEnquiry({
      name: b2bForm.contactName,
      phone: b2bForm.phone,
      email: b2bForm.email,
      message: `[B2B/Bulk] Company: ${b2bForm.companyName} | Qty: ${b2bForm.quantity} | Requirements: ${b2bForm.requirements}`
    });
    toast.success("Bulk inquiry sent — our team will reach out within 24 hours");
    setB2bForm({ companyName: "", contactName: "", phone: "", email: "", quantity: "", requirements: "" });
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10 space-y-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface p-8">
          <div className="eyebrow">Human Support</div>
          <h1 className="mt-4 text-4xl font-semibold text-slate-950">Talk to us before you buy.</h1>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setActiveSection("general")}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                activeSection === "general"
                  ? "border-[rgba(30,58,138,0.2)] bg-[rgba(30,58,138,0.06)] text-[var(--vr-primary)]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <Package className="h-4 w-4" />
              General Enquiry
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("b2b")}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                activeSection === "b2b"
                  ? "border-[rgba(30,58,138,0.2)] bg-[rgba(30,58,138,0.06)] text-[var(--vr-primary)]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Bulk / B2B
            </button>
          </div>

          {activeSection === "b2b" ? (
            <div className="mt-6 rounded-[1.4rem] border border-[rgba(30,58,138,0.1)] bg-[rgba(30,58,138,0.04)] p-4">
              <div className="text-sm font-semibold text-[var(--vr-primary)]">Bulk discounts available</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>• 5+ units: up to 8% discount</li>
                <li>• 10+ units: up to 15% discount</li>
                <li>• 25+ units: custom pricing + dedicated support</li>
                <li>• Free delivery for bulk orders above ₹5 lakhs</li>
              </ul>
            </div>
          ) : null}
        </div>

        {activeSection === "general" ? (
          <form className="surface space-y-5 p-8" onSubmit={handleSubmit}>
            <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="Your name" className={inputClass} />
            <input value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} placeholder="Phone number" className={inputClass} />
            <input value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} placeholder="Email" className={inputClass} />
            <textarea
              value={form.message}
              onChange={(e) => setForm((c) => ({ ...c, message: e.target.value }))}
              placeholder="Tell us what model, budget, or usage you need help with."
              rows={6}
              className={`${inputClass} rounded-3xl`}
            />
            <button className="button-primary w-full">Send enquiry</button>
          </form>
        ) : (
          <form className="surface space-y-5 p-8" onSubmit={handleB2bSubmit}>
            <div className="text-lg font-bold text-slate-950">Bulk / B2B Order Enquiry</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={b2bForm.companyName}
                onChange={(e) => setB2bForm((c) => ({ ...c, companyName: e.target.value }))}
                placeholder="Company / Organisation name"
                required
                className={inputClass}
              />
              <input
                value={b2bForm.contactName}
                onChange={(e) => setB2bForm((c) => ({ ...c, contactName: e.target.value }))}
                placeholder="Contact person name"
                required
                className={inputClass}
              />
              <input
                value={b2bForm.phone}
                onChange={(e) => setB2bForm((c) => ({ ...c, phone: e.target.value }))}
                placeholder="Phone number"
                required
                className={inputClass}
              />
              <input
                value={b2bForm.email}
                onChange={(e) => setB2bForm((c) => ({ ...c, email: e.target.value }))}
                placeholder="Business email"
                type="email"
                required
                className={inputClass}
              />
            </div>
            <input
              value={b2bForm.quantity}
              onChange={(e) => setB2bForm((c) => ({ ...c, quantity: e.target.value }))}
              placeholder="Approximate quantity needed (e.g. 20 laptops)"
              required
              className={inputClass}
            />
            <textarea
              value={b2bForm.requirements}
              onChange={(e) => setB2bForm((c) => ({ ...c, requirements: e.target.value }))}
              placeholder="Describe your requirements — model preferences, specs, budget range, timeline..."
              rows={5}
              required
              className={`${inputClass} rounded-3xl`}
            />
            <button className="button-primary w-full">Submit Bulk Inquiry</button>
          </form>
        )}
      </div>
    </div>
  );
}
