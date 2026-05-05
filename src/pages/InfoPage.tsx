import { Link, Navigate, useParams } from "react-router-dom";
import { CheckCircle2, Clock, CreditCard, FileText, MapPin, ShieldCheck, Truck, Undo2 } from "lucide-react";
import { Card } from "components/ui/Card";
import { SectionHeader } from "components/ui/SectionHeader";
import { usePageMeta } from "../hooks/usePageMeta";

const pageContent = {
  about: {
    eyebrow: "Company",
    title: "About VR Technologies",
    description: "VR Technologies supplies certified refurbished laptops, desktops, workstations, monitors, and accessories with store-backed support.",
    icon: ShieldCheck,
    sections: [
      {
        title: "What we sell",
        copy: "We focus on practical business and student systems: refurbished laptops, desktops, MacBooks, workstations, monitors, chargers, SSDs, RAM, and accessories."
      },
      {
        title: "How we build trust",
        copy: "Every eligible product is quality checked, listed with clear condition details, mapped to real store availability, and supported through branch contact channels."
      },
      {
        title: "Store-backed service",
        copy: "Customers can use online ordering, store pickup, WhatsApp support, and branch follow-up for warranty, delivery, and product questions."
      }
    ]
  },
  warranty: {
    eyebrow: "Support",
    title: "Warranty Policy",
    description: "Warranty coverage depends on the product listing and invoice, with carry-in support through VR Technologies branches.",
    icon: ShieldCheck,
    sections: [
      {
        title: "Coverage",
        copy: "Eligible refurbished products include the warranty duration shown on the product page and invoice. Accessories may have different warranty periods."
      },
      {
        title: "What to bring",
        copy: "Carry the invoice, product, charger/accessory if relevant, and a short description of the issue when visiting the store."
      },
      {
        title: "Exclusions",
        copy: "Physical damage, liquid damage, unauthorized repair, software misuse, and consumable wear are not covered unless explicitly stated by the store."
      }
    ]
  },
  returns: {
    eyebrow: "Returns",
    title: "Returns and Refunds",
    description: "Return support is designed to be simple and branch-aware for eligible products.",
    icon: Undo2,
    sections: [
      {
        title: "Return window",
        copy: "Eligible products show the return window on the product page. Return requests should be raised quickly with the original invoice and product condition intact."
      },
      {
        title: "Inspection",
        copy: "Returned products are checked by the store team before approval. Refund or replacement depends on product condition and issue verification."
      },
      {
        title: "Refund mode",
        copy: "Approved refunds are processed through the original or agreed payment method. Offline payments may be settled directly by the fulfillment branch."
      }
    ]
  },
  shipping: {
    eyebrow: "Delivery",
    title: "Shipping and Store Pickup",
    description: "Choose delivery or pickup where available. Store mapping helps customers know where support and fulfillment come from.",
    icon: Truck,
    sections: [
      {
        title: "Delivery estimate",
        copy: "Most local orders are prepared after store confirmation. Delivery timelines depend on product availability, address, and store operations."
      },
      {
        title: "Store pickup",
        copy: "Pickup orders can be collected from the selected branch after confirmation. Please carry order details and contact information."
      },
      {
        title: "Address accuracy",
        copy: "Customers are responsible for providing a reachable phone number and accurate delivery address during checkout."
      }
    ]
  },
  privacy: {
    eyebrow: "Privacy",
    title: "Privacy Policy",
    description: "We collect only the information needed to run orders, support, customer accounts, and store communication.",
    icon: FileText,
    sections: [
      {
        title: "Information used",
        copy: "Name, phone, email, delivery address, cart, wishlist, and order details may be used to process orders and provide support."
      },
      {
        title: "Security",
        copy: "Account access uses authenticated sessions. Customers should keep login details private and contact support if something looks wrong."
      },
      {
        title: "Communication",
        copy: "We may contact customers for order confirmation, delivery, warranty, returns, and support through phone, email, or WhatsApp."
      }
    ]
  },
  terms: {
    eyebrow: "Terms",
    title: "Terms and Conditions",
    description: "These terms describe how product information, pricing, ordering, and store support work on the VR Technologies website.",
    icon: CreditCard,
    sections: [
      {
        title: "Product information",
        copy: "Refurbished product stock, condition, price, and accessories can vary by branch. Final confirmation happens at checkout or store verification."
      },
      {
        title: "Pricing",
        copy: "Prices and discounts may change without prior notice. Confirmed orders retain the order amount unless a correction is required due to stock or listing error."
      },
      {
        title: "Orders",
        copy: "Orders are accepted after customer details, payment method, and store availability are confirmed. VR Technologies may cancel orders that cannot be fulfilled."
      }
    ]
  }
} as const;

const processSteps = [
  { title: "Browse", subtitle: "Compare specs, prices, stores, and warranty.", icon: FileText },
  { title: "Confirm", subtitle: "Place order with delivery or pickup details.", icon: CheckCircle2 },
  { title: "Fulfil", subtitle: "Store team prepares and supports the order.", icon: Clock },
  { title: "Support", subtitle: "Use store, WhatsApp, or warranty help.", icon: MapPin }
] as const;

export function InfoPage() {
  const { slug = "about" } = useParams();
  const content = pageContent[slug as keyof typeof pageContent];

  if (!content) {
    return <Navigate to="/about" replace />;
  }

  const HeroIcon = content.icon;
  usePageMeta({
    title: content.title,
    description: content.description
  });

  return (
    <div className="vr-page-shell space-y-6">
      <Card variant="hero" className="overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <SectionHeader eyebrow={content.eyebrow} title={content.title} description={content.description} />
          <div className="rounded-[1.6rem] border border-[var(--vr-border)] bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.07)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(30,58,138,0.08)] text-[var(--vr-primary)]">
              <HeroIcon className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--vr-muted)]">
              This page gives customers the core business rules before ordering, so the purchase feels clear and supported.
            </p>
            <Link to="/contact" className="mt-5 inline-flex rounded-2xl bg-[var(--vr-primary)] px-5 py-3 text-sm font-semibold text-white">
              Contact support
            </Link>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {content.sections.map((section) => (
          <Card key={section.title} className="h-full">
            <h2 className="text-xl font-bold text-[var(--vr-text)]">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--vr-muted)]">{section.copy}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {processSteps.map((step) => (
          <div key={step.title} className="rounded-[1.4rem] border border-[var(--vr-border)] bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.055)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[rgba(30,58,138,0.08)] p-2.5 text-[var(--vr-primary)]">
                <step.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--vr-text)]">{step.title}</div>
                <div className="mt-1 text-xs leading-5 text-[var(--vr-muted)]">{step.subtitle}</div>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
