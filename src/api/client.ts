import axios, { type InternalAxiosRequestConfig } from "axios";
import type {
  ApiEnvelope,
  AuthUser,
  Banner,
  Brand,
  CartItem,
  Category,
  EnquiryPayload,
  HomeSection,
  Order,
  PaymentCheckoutSession,
  PaymentMethod,
  Product,
  Store
} from "types";
import { useAuthStore } from "store/authStore";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() || "/api").replace(/\/+$/, "");

const api = axios.create({
  baseURL: apiBaseUrl
});

const AUTH_STORAGE_KEY = "vrtech-auth";
let refreshPromise: Promise<AuthUser> | null = null;

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

function readPersistedUser() {
  const stateUser = useAuthStore.getState().user;
  if (stateUser) {
    return stateUser;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { state?: { user?: AuthUser | null } };
    return parsed.state?.user ?? null;
  } catch {
    return null;
  }
}

function setPersistedUser(user: AuthUser | null) {
  if (user) {
    useAuthStore.getState().setUser(user);
    return;
  }
  useAuthStore.getState().logout();
}

function isAuthRefreshBypassed(url?: string) {
  if (!url) {
    return false;
  }
  return ["/auth/login", "/auth/register", "/auth/phone/send", "/auth/phone/verify", "/auth/refresh", "/auth/logout"].some((path) => url.includes(path));
}

async function refreshAccessToken() {
  const refreshToken = readPersistedUser()?.refreshToken;
  if (!refreshToken) {
    throw new Error("Missing refresh token");
  }
  if (!refreshPromise) {
    refreshPromise = api
      .post<ApiEnvelope<AuthUser>>("/auth/refresh", { refreshToken })
      .then(({ data }) => {
        setPersistedUser(data.data);
        return data.data;
      })
      .catch((error) => {
        setPersistedUser(null);
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = readPersistedUser()?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }

    const requestConfig = error.config as RetryableRequestConfig;
    if (error.response?.status === 401 && !requestConfig._retry && !isAuthRefreshBypassed(requestConfig.url)) {
      requestConfig._retry = true;

      try {
        const refreshedUser = await refreshAccessToken();
        requestConfig.headers = requestConfig.headers ?? {};
        requestConfig.headers.Authorization = `Bearer ${refreshedUser.token}`;
        return api(requestConfig);
      } catch (refreshError) {
        setPersistedUser(null);
        if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
          window.location.assign("/login");
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const unwrap = async <T>(promise: Promise<{ data: ApiEnvelope<T> }>) => (await promise).data.data;

type CatalogProductQueryParams = Record<string, string | number | boolean | undefined>;

export const authApi = {
  sendPhoneOtp: (phone: string) => unwrap<{ verificationId: string; sessionInfo: string; token: string }>(api.post("/auth/phone/send", { phone })),
  verifyPhone: (idToken: string, sessionInfo?: string) => unwrap<AuthUser>(api.post("/auth/phone/verify", { idToken, sessionInfo })),
  me: () => unwrap<AuthUser>(api.get("/auth/me")),
  refresh: (refreshToken: string) => unwrap<AuthUser>(api.post("/auth/refresh", { refreshToken })),
  logout: (refreshToken: string) => unwrap(api.post("/auth/logout", { refreshToken }))
};

export const catalogApi = {
  getBanners: (placement?: string) =>
    unwrap<Banner[]>(api.get("/banners", { params: placement ? { placement } : undefined })),
  getBrands: () => unwrap<Brand[]>(api.get("/brands")),
  getCategories: () => unwrap<Category[]>(api.get("/categories")),
  getHomeSections: () => unwrap<HomeSection[]>(api.get("/public/home-sections")),
  getBestSellers: (limit = 8) => unwrap<Product[]>(api.get("/public/products/best-sellers", { params: { limit } })),
  getTodaysDeals: (limit = 8) => unwrap<Product[]>(api.get("/public/products/todays-deals", { params: { limit } })),
  getStores: () => unwrap<Store[]>(api.get("/stores")),
  getFeaturedProducts: () => unwrap<Product[]>(api.get("/products/featured")),
  getProducts: (params?: CatalogProductQueryParams) => unwrap<Product[]>(api.get("/products", { params })),
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
  createPaymentOrder: (id: number) => unwrap<PaymentCheckoutSession>(api.post(`/users/orders/${id}/payment-order`)),
  verifyPayment: (id: number, payload: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    unwrap<Order>(api.post(`/users/orders/${id}/verify-payment`, payload)),
  cancelOrder: (id: number, reason: string) => unwrap<Order>(api.patch(`/users/orders/${id}/cancel`, { reason })),
  requestReturn: (id: number, reason: string) => unwrap<Order>(api.patch(`/users/orders/${id}/return-request`, { reason })),
  downloadInvoice: async (id: number) => {
    const response = await api.get(`/users/orders/${id}/invoice`, { responseType: "blob" });
    return response.data as Blob;
  },
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
