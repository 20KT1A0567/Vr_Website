import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  Headphones,
  Heart,
  LayoutDashboard,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Undo2,
  User
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { catalogApi, customerApi } from "api/client";
import { useWishlist } from "../../hooks/useWishlist";
import { useAuthStore } from "store/authStore";

const utilityLinks = [
  { label: "Stores", to: "/stores" },
  { label: "Support", to: "/contact" },
  { label: "Orders", to: "/orders" }
];

const secondaryLinks = [
  { label: "Brands", to: "/products" },
  { label: "Offers", to: "/products" },
  { label: "New Arrivals", to: "/products" }
];

const trustPoints = [
  { label: "6 Months Warranty", icon: ShieldCheck },
  { label: "7 Days Easy Returns", icon: Undo2 },
  { label: "Fast and Safe Delivery", icon: Truck }
];

export function SiteLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { wishlistCount } = useWishlist();
  const { data: cart = [] } = useQuery({ queryKey: ["cart"], queryFn: customerApi.getCart, enabled: Boolean(user) });
  const { data: categories = [] } = useQuery({ queryKey: ["header-categories"], queryFn: catalogApi.getCategories });
  const { data: headerProducts = [] } = useQuery({ queryKey: ["header-products"], queryFn: () => catalogApi.getProducts() });
  const { data: stores = [] } = useQuery({ queryKey: ["header-stores"], queryFn: catalogApi.getStores });
  const [headerSearch, setHeaderSearch] = useState("");

  useEffect(() => {
    if (location.pathname === "/products") {
      setHeaderSearch(new URLSearchParams(location.search).get("q") ?? "");
    }
  }, [location.pathname, location.search]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = headerSearch.trim();
    navigate(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : "/products");
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const primaryStore = stores[0];
  const categoryLinks = useMemo(() => {
    const categoryIdsWithProducts = new Set(headerProducts.map((product) => product.categoryId).filter((value): value is number => typeof value === "number"));
    return categories.filter((category) => categoryIdsWithProducts.has(category.id)).slice(0, 4);
  }, [categories, headerProducts]);

  return (
    <div className="min-h-screen bg-transparent text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090c09]/95 backdrop-blur">
        <div className="border-b border-white/6 bg-[#050705]">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-6 py-2.5 text-[11px] lg:px-10">
            <div className="flex flex-wrap items-center gap-4 text-white/70">
              {trustPoints.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-2">
                  <item.icon className="h-3.5 w-3.5 text-[#97d83e]" />
                  {item.label}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-white/60">
              <Link to="/stores" className="inline-flex items-center gap-2 transition hover:text-white">
                <MapPin className="h-3.5 w-3.5 text-[#97d83e]" />
                Store Locator
              </Link>
              <Link to="/contact" className="inline-flex items-center gap-2 transition hover:text-white">
                <Headphones className="h-3.5 w-3.5 text-[#97d83e]" />
                Help and Support
              </Link>
            </div>
          </div>
        </div>

        <div className="border-b border-white/6 bg-[#0d110e]">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 px-6 py-4 lg:px-10">
            <Link to="/" className="min-w-[220px]">
              <div className="display-font flex items-center gap-2 text-[1.9rem] font-extrabold uppercase leading-none tracking-tight text-white">
                <span className="text-[#97d83e]">VR</span>
                <span>Technologies</span>
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/38">Refurbished. Reliable. Ready for you.</div>
            </Link>

            <form
              onSubmit={handleSearchSubmit}
              className="flex min-w-[280px] flex-1 items-center overflow-hidden rounded-xl border border-white/10 bg-white"
            >
              <Search className="ml-4 h-4 w-4 text-slate-400" />
              <input
                value={headerSearch}
                onChange={(event) => setHeaderSearch(event.target.value)}
                placeholder="Search laptops, brands, models..."
                className="h-11 flex-1 border-0 bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button className="flex h-11 w-12 items-center justify-center bg-[#89c73a] text-[#101510] transition hover:bg-[#9edd43]">
                <Search className="h-4 w-4" />
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
              {primaryStore ? (
                <div className="hidden rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm text-white/82 md:block">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/38">Deliver to</div>
                  <div className="mt-1 inline-flex items-center gap-2 font-medium">
                    <MapPin className="h-4 w-4 text-[#97d83e]" />
                    {primaryStore.city}, {primaryStore.state}
                    <ChevronDown className="h-4 w-4 text-white/35" />
                  </div>
                </div>
              ) : null}

              <div className="hidden items-center gap-4 rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm text-white/80 lg:flex">
                <Link to={user ? "/orders" : "/login"} className="inline-flex items-center gap-2 transition hover:text-white">
                  <User className="h-4 w-4 text-white/55" />
                  {user ? user.name : "My Account"}
                </Link>
                {user ? (
                  <button onClick={logout} className="text-white/55 transition hover:text-white">
                    Logout
                  </button>
                ) : null}
              </div>

              <NavLink
                to="/wishlist"
                className="relative rounded-xl border border-white/10 bg-white/4 p-3 text-white/75 transition hover:bg-white/8 hover:text-white"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#97d83e] px-1 text-[10px] font-bold text-[#101510]">
                    {wishlistCount}
                  </span>
                ) : null}
              </NavLink>

              <NavLink
                to="/cart"
                className="relative rounded-xl border border-white/10 bg-white/4 p-3 text-white/75 transition hover:bg-white/8 hover:text-white"
              >
                <ShoppingCart className="h-5 w-5" />
                {user && cartCount ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#97d83e] px-1 text-[10px] font-bold text-[#101510]">
                    {cartCount}
                  </span>
                ) : null}
              </NavLink>

              {user?.role === "ADMIN" ? (
                <a
                  href="/admin-panel"
                  className="hidden rounded-xl border border-white/10 bg-white/4 p-3 text-white/75 transition hover:bg-white/8 hover:text-white md:block"
                >
                  <LayoutDashboard className="h-5 w-5" />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="bg-[#0a0d0a]">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-6 py-3 lg:px-10">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-xl bg-[#89c73a] px-4 py-2.5 text-sm font-semibold text-[#101510]"
            >
              <Menu className="h-4 w-4" />
              All Categories
            </Link>

            <nav className="flex flex-wrap items-center gap-1">
              {categoryLinks.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.slug}`}
                  className="rounded-xl px-4 py-2.5 text-sm text-white/74 transition hover:bg-white/6 hover:text-white"
                >
                  {category.name}
                </Link>
              ))}
              {secondaryLinks.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-2.5 text-sm transition ${
                      isActive && item.to !== "/products"
                        ? "bg-white/8 text-white"
                        : "text-white/70 hover:bg-white/6 hover:text-white"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="pb-12">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-white/8 bg-[#080b08]">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-6 py-14 lg:grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr_1fr] lg:px-10">
          <div>
            <div className="display-font flex items-center gap-2 text-[1.9rem] font-extrabold uppercase leading-none tracking-tight text-white">
              <span className="text-[#97d83e]">VR</span>
              <span>Technologies</span>
            </div>
            <p className="mt-5 max-w-sm leading-7 text-white/58">
              Refurbished laptops, desktops, and accessories presented in a modern storefront with branch-aware checkout and admin-managed campaigns.
            </p>
            <div className="mt-6 flex items-center gap-3 text-white/52">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10">f</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10">in</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10">ig</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10">yt</span>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/34">Shop</div>
            <div className="mt-5 space-y-3 text-sm text-white/66">
              {categories.slice(0, 6).map((category) => (
                <Link key={category.id} to={`/products?category=${category.slug}`} className="block transition hover:text-white">
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/34">Customer Service</div>
            <div className="mt-5 space-y-3 text-sm text-white/66">
              {utilityLinks.map((link) => (
                <Link key={link.label} to={link.to} className="block transition hover:text-white">
                  {link.label}
                </Link>
              ))}
              <Link to="/wishlist" className="block transition hover:text-white">
                Wishlist
              </Link>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/34">About</div>
            <div className="mt-5 space-y-3 text-sm text-white/66">
              <p>About VR Technologies</p>
              <p>Quality Checked Systems</p>
              <p>Warranty Policy</p>
              <p>Shipping and Returns</p>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/34">Contact Us</div>
            <div className="mt-5 space-y-3 text-sm text-white/66">
              {primaryStore ? (
                <>
                  <p>{primaryStore.address}</p>
                  <p>
                    {primaryStore.city}, {primaryStore.state}
                  </p>
                  <p>{primaryStore.phone}</p>
                  {primaryStore.whatsapp ? <p>WhatsApp: {primaryStore.whatsapp}</p> : null}
                </>
              ) : (
                <>
                  <p>Hyderabad, Telangana, India</p>
                  <p>91000 12345</p>
                  <p>support@vrtechnologies.in</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/8">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-6 py-5 text-xs text-white/42 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <p>© 2026 VR Technologies. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-5 text-[13px] font-semibold tracking-[0.18em] text-white/58">
              <span>VISA</span>
              <span>MASTERCARD</span>
              <span>UPI</span>
              <span>NET BANKING</span>
              <span>COD</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
