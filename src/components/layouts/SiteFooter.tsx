import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CreditCard, MapPin, ShieldCheck, Truck, Undo2 } from "lucide-react";
import type { Category, NavigationItem, SiteSettings, Store } from "types";
import { getCategoryLink } from "../../utils/catalog";
import { EASE, VIEWPORT } from "../../animations/variants";

interface SiteFooterProps {
  vrTechnologiesLogo: string;
  quickCategories: Category[];
  footerLinks: NavigationItem[];
  primaryStore: Store | null;
  siteSettings?: SiteSettings;
}

function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

const trustItems = [
  { icon: ShieldCheck, label: "Warranty Included", sub: "On every eligible product" },
  { icon: ShieldCheck, label: "Quality Checked", sub: "Tested before dispatch" },
  { icon: Undo2, label: "7-Day Easy Returns", sub: "Hassle-free process" },
  { icon: Truck, label: "Fast Delivery", sub: "Pickup or doorstep" },
] as const;

export function SiteFooter({
  vrTechnologiesLogo,
  quickCategories,
  footerLinks,
  primaryStore,
  siteSettings,
}: SiteFooterProps) {
  const midpoint = Math.ceil(footerLinks.length / 2);
  const footerSupportLinks = footerLinks.slice(0, midpoint);
  const footerPolicyLinks = footerLinks.slice(midpoint);
  const companyName = siteSettings?.companyName || "VR Technologies";
  const logoUrl = siteSettings?.logoUrl || vrTechnologiesLogo;
  const tagline = siteSettings?.tagline || "Refurbished - Warranted - Trusted";
  const footerDescription = siteSettings?.footerDescription || "Certified refurbished laptops and desktops with warranty, quality checks, and store-backed support across Hyderabad.";
  const address = siteSettings?.companyAddress || (primaryStore ? `${primaryStore.address}, ${primaryStore.city}` : "");
  const supportPhone = siteSettings?.supportPhone || primaryStore?.phone || "";
  const supportEmail = siteSettings?.supportEmail || "support@vrtechnologies.in";
  const whatsappNumber = siteSettings?.whatsappNumber || primaryStore?.whatsapp || "";
  const socialLinks = [
    { label: "Facebook", url: siteSettings?.facebookUrl },
    { label: "Instagram", url: siteSettings?.instagramUrl },
    { label: "X", url: siteSettings?.xUrl },
    { label: "LinkedIn", url: siteSettings?.linkedinUrl },
    { label: "YouTube", url: siteSettings?.youtubeUrl }
  ].filter((item): item is { label: string; url: string } => Boolean(item.url));
  return (
    <footer className="bg-[var(--vr-dark)] text-white">
      {/* ── Trust strip ── */}
      <div className="border-b border-white/8">
        <motion.div
          className="mx-auto grid max-w-[1600px] grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4 lg:px-8"
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
          }}
        >
          {trustItems.map((item) => (
            <motion.div
              key={item.label}
              className="flex items-center gap-3 px-4 py-5"
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE } },
              }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/8">
                <item.icon className="h-4 w-4 text-[#bfdbfe]" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">{item.label}</div>
                <div className="mt-0.5 text-[11px] text-white/50">{item.sub}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Main columns ── */}
      <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.1fr]"
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
          }}
        >
          {/* Brand */}
          <motion.div
            className="sm:col-span-2 lg:col-span-1"
            variants={{
              hidden: { opacity: 0, y: 28 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
            }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="overflow-hidden rounded-[1rem] border border-white/10 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.2)]"
                whileHover={{ scale: 1.06, rotate: 1 }}
                transition={{ duration: 0.22, ease: EASE }}
              >
                <img src={logoUrl} alt={companyName} className="h-12 w-12 object-cover" />
              </motion.div>
              <div>
                <div className="display-font text-lg font-extrabold uppercase tracking-tight text-white">{companyName}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">{tagline}</div>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-6 text-white/55">
              {footerDescription}
            </p>
          </motion.div>

          {/* Shop */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 28 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
            }}
          >
            <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">Shop</div>
            <motion.ul
              className="space-y-2.5"
              initial="hidden"
              whileInView="show"
              viewport={VIEWPORT}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } },
              }}
            >
              {quickCategories.slice(0, 6).map((category) => (
                <motion.li
                  key={category.id}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    show: { opacity: 1, x: 0, transition: { duration: 0.32, ease: EASE } },
                  }}
                >
                  <Link to={getCategoryLink(category)} className="text-sm text-white/65 transition hover:text-white">
                    {category.name}
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Support */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 28 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
            }}
          >
            <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">Support</div>
            <motion.ul
              className="space-y-2.5"
              initial="hidden"
              whileInView="show"
              viewport={VIEWPORT}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.05, delayChildren: 0.25 } },
              }}
            >
              {footerSupportLinks.map((item) => (
                <motion.li
                  key={item.label}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    show: { opacity: 1, x: 0, transition: { duration: 0.32, ease: EASE } },
                  }}
                >
                  {isExternalUrl(item.url) ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-white/65 transition hover:text-white">
                      {item.label}
                    </a>
                  ) : (
                    <Link to={item.url} className="text-sm text-white/65 transition hover:text-white">
                      {item.label}
                    </Link>
                  )}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Policy */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 28 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
            }}
          >
            <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">Company</div>
            <motion.ul
              className="space-y-2.5"
              initial="hidden"
              whileInView="show"
              viewport={VIEWPORT}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.05, delayChildren: 0.28 } },
              }}
            >
              {footerPolicyLinks.map((item) => (
                <motion.li
                  key={item.label}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    show: { opacity: 1, x: 0, transition: { duration: 0.32, ease: EASE } },
                  }}
                >
                  {isExternalUrl(item.url) ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-white/65 transition hover:text-white">
                      {item.label}
                    </a>
                  ) : (
                    <Link to={item.url} className="text-sm text-white/65 transition hover:text-white">
                      {item.label}
                    </Link>
                  )}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 28 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
            }}
          >
            <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">Contact</div>
            <ul className="space-y-3 text-[13px] text-white/65">
              {address ? (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
                  <span>{address}</span>
                </li>
              ) : null}
              {supportPhone ? (
                <li className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 shrink-0 text-center text-[10px] text-white/30">P</span>
                  <a href={`tel:${supportPhone}`} className="transition hover:text-white">{supportPhone}</a>
                </li>
              ) : null}
              {whatsappNumber ? (
                <li className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 shrink-0 text-center text-[10px] text-white/30">W</span>
                  <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="transition hover:text-white">{whatsappNumber}</a>
                </li>
              ) : null}
              <li className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 shrink-0 text-center text-[10px] text-white/30">@</span>
                <a href={`mailto:${supportEmail}`} className="transition hover:text-white">{supportEmail}</a>
              </li>
            </ul>
            {socialLinks.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {socialLinks.map((item) => (
                  <a key={item.label} href={item.url} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/60 transition hover:border-white/20 hover:text-white">
                    {item.label}
                  </a>
                ))}
              </div>
            ) : null}
            <ul className="hidden space-y-3 text-[13px] text-white/65">
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
          </motion.div>
        </motion.div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/8">
        <motion.div
          className="mx-auto flex max-w-[1600px] flex-col items-center gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:justify-between lg:px-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
        >
          <p className="text-xs text-white/40">© 2026 {companyName}. All rights reserved.</p>
          <motion.div
            className="flex flex-wrap items-center justify-center gap-2"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.06, delayChildren: 0.35 } },
            }}
          >
            {["Visa", "Mastercard", "UPI", "Net Banking", "COD"].map((item) => (
              <motion.span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/60"
                variants={{
                  hidden: { opacity: 0, scale: 0.85 },
                  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE } },
                }}
              >
                <CreditCard className="h-3 w-3 text-[#fde68a]" />
                {item}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}
