import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronRight,
  Heart,
  MapPin,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  Undo2
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { catalogApi, customerApi } from "api/client";
import { ProductImageZoom } from "components/catalog/ProductImageZoom";
import { useAuthStore } from "store/authStore";
import { useWishlist } from "../hooks/useWishlist";
import { getApiErrorMessage } from "../utils/api";

const trustHighlights = [
  { title: "6 Months Warranty", subtitle: "On all products", icon: ShieldCheck },
  { title: "Quality Checked", subtitle: "100+ tests passed", icon: CheckCircle2 },
  { title: "7 Days Easy Returns", subtitle: "No questions asked", icon: Undo2 },
  { title: "Fast Delivery", subtitle: "Across Hyderabad", icon: Truck }
] as const;

function formatStorage(storageGb?: number, storageType?: string) {
  if (!storageGb) {
    return "Available on request";
  }

  const label = storageGb >= 1024 ? `${storageGb / 1024} TB` : `${storageGb} GB`;
  return `${label} ${storageType ?? ""}`.trim();
}

type DetailTab = "description" | "specifications" | "reviews" | "shipping";

export function ProductDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { isWishlisted, isWishlistUpdating, toggleWishlist } = useWishlist();
  const productQuery = useQuery({ queryKey: ["product", id], queryFn: () => catalogApi.getProduct(id), enabled: Boolean(id) });
  const product = productQuery.data;
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<DetailTab>("description");

  useEffect(() => {
    setActiveIndex(0);
    setActiveTab("description");
  }, [product?.id]);

  const images = useMemo(
    () => (product?.images.length ? product.images : [{ id: 0, imageUrl: "", primaryImage: true, sortOrder: 0 }]),
    [product]
  );
  const activeImage = images[activeIndex] ?? images[0];

  if (productQuery.error) {
    return (
      <div className="mx-auto max-w-[1600px] px-6 py-12 lg:px-10">
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-8 py-10 text-rose-700">
          <div className="text-sm font-semibold uppercase tracking-[0.24em]">Product API error</div>
          <h1 className="mt-4 text-3xl font-bold text-rose-900">This product could not be loaded.</h1>
          <p className="mt-3 text-base">{getApiErrorMessage(productQuery.error, "Check the backend product API.")}</p>
        </div>
      </div>
    );
  }

  if (productQuery.isLoading || !product) {
    return (
      <div className="mx-auto max-w-[1600px] px-6 py-12 lg:px-10">
        <div className="store-dark-panel px-8 py-10 text-white/70">Loading product...</div>
      </div>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const detailChips = [
    product.processor,
    product.ramGb ? `${product.ramGb} GB RAM` : undefined,
    formatStorage(product.storageGb, product.storageType),
    product.displayType,
    product.os
  ].filter((item): item is string => Boolean(item));
  const specItems = [
    ["Category", product.categoryName ?? "Curated system"],
    ["Processor", product.processor ? `${product.processor}${product.processorGeneration ? ` / ${product.processorGeneration}` : ""}` : "Available on request"],
    ["Memory", product.ramGb ? `${product.ramGb} GB RAM` : "Available on request"],
    ["Storage", formatStorage(product.storageGb, product.storageType)],
    ["Display", [product.displaySize, product.displayType].filter(Boolean).join(" / ") || "Available on request"],
    ["Operating system", product.os ?? "Available on request"],
    ["Graphics", product.graphicsCard ?? "Integrated or store-confirmed"],
    ["Battery", product.battery ?? "Health checked"],
    ["Warranty", product.warrantyMonths ? `${product.warrantyMonths} months` : "Store-backed coverage"],
    ["Returns", product.returnDays ? `${product.returnDays} days` : "Store-backed return support"]
  ];
  const whatsappNumber = product.stores.find((store) => store.whatsapp)?.whatsapp ?? "919999999999";

  async function handleAddToCart() {
    if (!user) {
      toast.error("Login to add this product to cart");
      return;
    }

    if (!product) {
      return;
    }

    try {
      const updatedCart = await customerApi.addToCart(product.id, 1);
      queryClient.setQueryData(["cart"], updatedCart);
      toast.success("Added to cart");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to add product to cart"));
    }
  }

  async function handleBuyNow() {
    if (!user) {
      toast.error("Login to continue to checkout");
      navigate("/login");
      return;
    }

    if (!product) {
      return;
    }

    try {
      const updatedCart = await customerApi.addToCart(product.id, 1);
      queryClient.setQueryData(["cart"], updatedCart);
      navigate("/checkout");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to continue to checkout"));
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-white/40">
        <Link to="/" className="transition hover:text-white/70">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/products" className="transition hover:text-white/70">
          Products
        </Link>
        {product.categoryName ? (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>{product.categoryName}</span>
          </>
        ) : null}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[#aadf67]">{product.title}</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <section className="store-dark-panel p-5">
          <div className="grid gap-4 lg:grid-cols-[88px_minmax(0,1fr)]">
            <div className="grid grid-cols-4 gap-3 lg:grid-cols-1">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => setActiveIndex(index)}
                  className={`aspect-square overflow-hidden rounded-[1rem] border p-1 transition ${
                    index === activeIndex ? "border-[#89c73a] bg-white" : "border-white/10 bg-white/[0.04]"
                  }`}
                >
                  {image.imageUrl ? (
                    <img src={image.imageUrl} alt="" className="h-full w-full rounded-[0.8rem] object-contain bg-[#f7f9f3] p-2" />
                  ) : (
                    <div className="h-full w-full rounded-[0.8rem] bg-[#f7f9f3]" />
                  )}
                </button>
              ))}
            </div>

            <ProductImageZoom imageUrl={activeImage.imageUrl} alt={product.title} />
          </div>
        </section>

        <aside className="store-dark-panel p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-semibold uppercase tracking-[0.18em] text-white/68">
              {product.brandName ?? "VR Technologies"}
            </span>
            <span className="rounded-full border border-[#89c73a]/25 bg-[#89c73a]/10 px-3 py-1.5 font-semibold uppercase tracking-[0.18em] text-[#c3ec80]">
              {product.productCondition ?? "Certified"}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold leading-tight text-white lg:text-4xl">{product.title}</h1>
          <p className="mt-2 text-sm text-white/54">
            {product.processor || "Configured system"} {product.modelNumber ? `- ${product.modelNumber}` : ""}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/62">
            <div className="flex items-center gap-1 text-[#c6ee82]">
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
            </div>
            <span className="font-semibold text-white">4.7</span>
            <span>({product.stores.length + 18} reviews)</span>
            <span>|</span>
            <span>{product.stockQuantity ?? 0}+ sold</span>
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <div className="text-4xl font-extrabold text-white">Rs. {product.price.toLocaleString()}</div>
            {product.originalPrice ? <div className="pb-1 text-lg text-white/32 line-through">Rs. {product.originalPrice.toLocaleString()}</div> : null}
            {product.discountPercent ? (
              <div className="rounded-full bg-[#89c73a]/12 px-3 py-1 text-sm font-semibold text-[#c3ec80]">{product.discountPercent}% off</div>
            ) : null}
          </div>

          <div className="mt-5 rounded-[1.2rem] border border-[#89c73a]/20 bg-[#89c73a]/10 px-4 py-3 text-sm font-semibold text-[#c3ec80]">
            {product.available ? "In stock" : "Check with store"} {product.warrantyMonths ? `- ${product.warrantyMonths} months warranty included` : ""}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {detailChips.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/72">
                {item}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <button type="button" className="store-primary-btn w-full py-4 text-base" onClick={handleAddToCart}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </button>
            <button type="button" className="store-secondary-btn w-full py-4 text-base" onClick={handleBuyNow}>
              Buy Now
            </button>
            <button
              type="button"
              className={`store-secondary-btn w-full md:col-span-2 ${wishlisted ? "border-rose-300 bg-rose-500/10 text-rose-200" : ""}`}
              disabled={isWishlistUpdating === product.id}
              onClick={() => toggleWishlist(product)}
            >
              <Heart className="mr-2 h-4 w-4" fill={wishlisted ? "currentColor" : "none"} />
              {wishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {trustHighlights.map((item) => (
              <div key={item.title} className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-[#bde676]">
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm font-semibold text-white">{item.title}</span>
                </div>
                <div className="mt-2 text-xs text-white/52">{item.subtitle}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-white/68">
            <div className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#bde676]" />
              {product.stores.length} store(s) can fulfill this order
            </div>
            <div className="inline-flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-[#bde676]" />
              Store-backed phone support available
            </div>
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#c3ec80]">
              <MessageCircle className="h-4 w-4" />
              WhatsApp enquiry
            </a>
          </div>
        </aside>
      </div>

      <section className="store-dark-panel mt-6 p-5">
        <div className="flex flex-wrap gap-2 border-b border-white/8 pb-4">
          {[
            ["description", "Description"],
            ["specifications", "Specifications"],
            ["reviews", "Reviews"],
            ["shipping", "Shipping & Returns"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value as DetailTab)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === value ? "bg-[#89c73a] text-[#101510]" : "bg-white/[0.03] text-white/62 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "description" ? (
          <div className="grid gap-6 pt-6 xl:grid-cols-[1fr_320px]">
            <div>
              <h2 className="text-2xl font-bold text-white">Product Description</h2>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-white/66">
                {product.description ??
                  "This refurbished business laptop is screened for dependable everyday performance, smooth office productivity, and store-backed peace of mind. It is suited for work, classes, browsing, and professional workflows where value matters as much as reliability."}
              </p>
              <ul className="mt-5 grid gap-3 text-sm text-white/70">
                <li>- Intel-powered performance configured for stable multitasking</li>
                <li>- Genuine refurbished condition with branch-level verification</li>
                <li>- Warranty and return support through VR Technologies stores</li>
                <li>- Tested for battery, display, keyboard, ports, and general performance</li>
              </ul>
            </div>

            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
              {product.images[0]?.imageUrl ? (
                <img src={product.images[0].imageUrl} alt={product.title} className="mx-auto h-48 w-full object-contain" />
              ) : null}
            </div>
          </div>
        ) : null}

        {activeTab === "specifications" ? (
          <div className="grid gap-3 pt-6 md:grid-cols-2 xl:grid-cols-3">
            {specItems.map(([label, value]) => (
              <div key={label} className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/34">{label}</div>
                <div className="mt-2 text-base font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "reviews" ? (
          <div className="pt-6">
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-6">
              <h2 className="text-2xl font-bold text-white">Customer Confidence</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/64">
                Reviews are not yet published from the backend, but this layout is ready for verified ratings, customer comments, and store response history.
              </p>
            </div>
          </div>
        ) : null}

        {activeTab === "shipping" ? (
          <div className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold text-white">Warranty</div>
              <p className="mt-2 text-sm text-white/62">{product.warrantySummary ?? "Store-backed warranty support across mapped branches."}</p>
            </div>
            <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold text-white">Returns</div>
              <p className="mt-2 text-sm text-white/62">{product.returnDays ? `${product.returnDays} day easy return window.` : "Return support available from your fulfillment store."}</p>
            </div>
            <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold text-white">Delivery</div>
              <p className="mt-2 text-sm text-white/62">Fast delivery or store pickup depending on branch availability.</p>
            </div>
            <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold text-white">Support</div>
              <p className="mt-2 text-sm text-white/62">Phone and WhatsApp support for product questions and order status.</p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="store-dark-panel mt-6 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#aadf67]">Store availability</div>
            <h2 className="mt-2 text-2xl font-bold text-white">Pick a nearby branch for support and fulfillment.</h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/64">
            {product.stores.length} mapped store(s)
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {product.stores.map((store) => (
            <div key={store.id} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-5">
              <h3 className="text-lg font-semibold text-white">{store.name}</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">
                {store.address}, {store.city}, {store.state}
              </p>

              <div className="mt-4 space-y-2 text-sm text-white/64">
                <div className="inline-flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-[#bde676]" />
                  {store.phone}
                </div>
                {store.timings ? (
                  <div className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#bde676]" />
                    {store.timings}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {store.mapLink ? (
                  <a href={store.mapLink} target="_blank" rel="noreferrer" className="store-secondary-btn px-4 py-2.5">
                    Directions
                  </a>
                ) : null}
                {store.whatsapp ? (
                  <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noreferrer" className="store-primary-btn px-4 py-2.5">
                    WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
