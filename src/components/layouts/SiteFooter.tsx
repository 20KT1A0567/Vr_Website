import { Link } from "react-router-dom";
import { CreditCard, MapPin, ShieldCheck, Truck, Undo2 } from "lucide-react";
import type { Category, Store } from "types";
import { getCategoryLink } from "../../utils/catalog";

interface SiteFooterProps {
  vrTechnologiesLogo: string;
  quickCategories: Category[];
  footerSupportLinks: readonly { label: string; to: string }[];
  footerPolicyLinks: readonly { label: string; to: string }[];
  primaryStore: Store | null;
}

export function SiteFooter({ 
  vrTechnologiesLogo, 
  quickCategories, 
  footerSupportLinks, 
  footerPolicyLinks, 
  primaryStore 
}: SiteFooterProps) {
  return (
    <footer className="bg-[var(--vr-dark)] text-white">
      {/* ── Trust strip ── */}
      <div className="border-b border-white/8">
        <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { icon: ShieldCheck, label: "Warranty Included", sub: "On every eligible product" },
            { icon: ShieldCheck, label: "Quality Checked", sub: "Tested before dispatch" },
            { icon: Undo2, label: "7-Day Easy Returns", sub: "Hassle-free process" },
            { icon: Truck, label: "Fast Delivery", sub: "Pickup or doorstep" }
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-4 py-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/8">
                <item.icon className="h-4 w-4 text-[#bfdbfe]" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">{item.label}</div>
                <div className="mt-0.5 text-[11px] text-white/50">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main columns ── */}
      <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.1fr]">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="overflow-hidden rounded-[1rem] border border-white/10 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
                <img src={vrTechnologiesLogo} alt="VR Technologies" className="h-12 w-12 object-cover" />
              </div>
              <div>
                <div className="display-font text-lg font-extrabold uppercase tracking-tight text-white">VR Technologies</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">Refurbished · Warranted · Trusted</div>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-6 text-white/55">
              Certified refurbished laptops and desktops with warranty, quality checks, and store-backed support across Hyderabad.
            </p>
          </div>

          {/* Shop */}
          <div>
            <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">Shop</div>
            <ul className="space-y-2.5">
              {quickCategories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link to={getCategoryLink(category)} className="text-sm text-white/65 transition hover:text-white">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">Support</div>
            <ul className="space-y-2.5">
              {footerSupportLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-sm text-white/65 transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy */}
          <div>
            <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">Company</div>
            <ul className="space-y-2.5">
              {footerPolicyLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-sm text-white/65 transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">Contact</div>
            <ul className="space-y-3 text-[13px] text-white/65">
              {primaryStore && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
                  <span>{primaryStore.address}, {primaryStore.city}</span>
                </li>
              )}
              {primaryStore?.phone && (
                <li className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 shrink-0 text-center text-[10px] text-white/30">✆</span>
                  <a href={`tel:${primaryStore.phone}`} className="transition hover:text-white">{primaryStore.phone}</a>
                </li>
              )}
              <li className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 shrink-0 text-center text-[10px] text-white/30">@</span>
                <a href="mailto:support@vrtechnologies.in" className="transition hover:text-white">support@vrtechnologies.in</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/8">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:justify-between lg:px-8">
          <p className="text-xs text-white/40">© 2026 VR Technologies. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {["Visa", "Mastercard", "UPI", "Net Banking", "COD"].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/60">
                <CreditCard className="h-3 w-3 text-[#fde68a]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
