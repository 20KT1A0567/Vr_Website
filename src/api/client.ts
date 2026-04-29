import axios from "axios";
import type {
  ApiEnvelope,
  AuthUser,
  Banner,
  Brand,
  CartItem,
  Category,
  EnquiryPayload,
  Order,
  PaymentMethod,
  Product,
  Store
} from "types";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() || "/api").replace(/\/+$/, "");

const api = axios.create({
  baseURL: apiBaseUrl
});

api.interceptors.request.use((config) => {
  const raw = window.localStorage.getItem("vrtech-auth");
  if (raw) {
    const state = JSON.parse(raw) as { state?: { user?: AuthUser | null } };
    const token = state.state?.user?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

const unwrap = async <T>(promise: Promise<{ data: ApiEnvelope<T> }>) => (await promise).data.data;

export const authApi = {
  login: (payload: { email: string; password: string }) => unwrap<AuthUser>(api.post("/auth/login", payload)),
  register: (payload: { name: string; email: string; password: string; phone?: string }) =>
    unwrap<AuthUser>(api.post("/auth/register", payload)),
  me: () => unwrap<AuthUser>(api.get("/auth/me"))
};

export const catalogApi = {
  getBanners: () => unwrap<Banner[]>(api.get("/banners")),
  getBrands: () => unwrap<Brand[]>(api.get("/brands")),
  getCategories: () => unwrap<Category[]>(api.get("/categories")),
  getStores: () => unwrap<Store[]>(api.get("/stores")),
  getFeaturedProducts: () => unwrap<Product[]>(api.get("/products/featured")),
  getProducts: (params?: Record<string, string | number | undefined>) => unwrap<Product[]>(api.get("/products", { params })),
  getProduct: (id: string | number) => unwrap<Product>(api.get(`/products/${id}`)),
  createEnquiry: (payload: EnquiryPayload) => unwrap(api.post("/enquiries", payload))
};

export const customerApi = {
  getCart: () => unwrap<CartItem[]>(api.get("/cart")),
  addToCart: (productId: number, quantity = 1) => unwrap<CartItem[]>(api.post("/cart/add", { productId, quantity })),
  updateCartItem: (itemId: number, quantity: number) => unwrap<CartItem[]>(api.put(`/cart/update/${itemId}`, { quantity })),
  removeCartItem: (itemId: number) => unwrap<CartItem[]>(api.delete(`/cart/remove/${itemId}`)),
  clearCart: () => unwrap(api.delete("/cart/clear")),
  getWishlist: () => unwrap<Product[]>(api.get("/users/wishlist")),
  addToWishlist: (productId: number) => unwrap<Product[]>(api.post(`/users/wishlist/${productId}`)),
  removeFromWishlist: (productId: number) => unwrap<Product[]>(api.delete(`/users/wishlist/${productId}`)),
  getOrders: () => unwrap<Order[]>(api.get("/users/orders")),
  getOrder: (id: number) => unwrap<Order>(api.get(`/users/orders/${id}`)),
  placeOrder: (payload: {
    deliveryType: "PICKUP" | "DELIVERY";
    paymentMethod: PaymentMethod;
    storeId: number;
    contactName: string;
    contactPhone: string;
    contactEmail?: string;
    deliveryAddress?: string;
    notes?: string;
  }) => unwrap<Order>(api.post("/orders/place", payload))
};
