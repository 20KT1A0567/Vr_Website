import { Building2, MessageSquare, Sparkles, Home, ShoppingBag, ShoppingCart, Package, User, ShieldCheck, CreditCard, Undo2, Truck } from "lucide-react";

export const vrTechnologiesLogo = "/logo.jpg";

export const trustPoints = [
  { label: "12-Month Warranty on Every Laptop", icon: ShieldCheck },
  { label: "COD Available on Eligible Products", icon: CreditCard },
  { label: "Quality Checked", icon: ShieldCheck },
  { label: "7-Day Easy Returns", icon: Undo2 },
  { label: "Fast Delivery Across India", icon: Truck }
] as const;

export const desktopLinks = [
  { label: "Help me choose", to: "/help-me-choose", icon: Sparkles },
  { label: "Stores", to: "/stores", icon: Building2 },
  { label: "Contact", to: "/contact", icon: MessageSquare }
] as const;

export const mobileBottomLinks = [
  { label: "Home", to: "/", icon: Home },
  { label: "Categories", to: "/products", icon: ShoppingBag },
  { label: "Cart", to: "/cart", icon: ShoppingCart },
  { label: "Orders", to: "/orders", icon: Package },
  { label: "Profile", to: "/login", icon: User }
] as const;

export const footerSupportLinks = [
  { label: "Track Order", to: "/orders" },
  { label: "Returns and Refunds", to: "/returns" },
  { label: "Warranty Support", to: "/warranty" },
  { label: "Store Locations", to: "/stores" }
] as const;

export const footerPolicyLinks = [
  { label: "About VR Technologies", to: "/about" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms and Conditions", to: "/terms" },
  { label: "Shipping Policy", to: "/shipping" },
  { label: "Contact Us", to: "/contact" }
] as const;
