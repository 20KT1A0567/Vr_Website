export type Role = "USER" | "ADMIN";
export type ProductCondition = "EXCELLENT" | "GOOD" | "FAIR";
export type DeliveryType = "PICKUP" | "DELIVERY";
export type PaymentMethod = "CASH" | "UPI" | "CARD" | "BANK_TRANSFER";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type OrderStatus = "PENDING" | "CONFIRMED" | "READY" | "DELIVERED" | "CANCELLED";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  token: string;
}

export interface Banner {
  id: number;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  videoUrl?: string;
  linkUrl?: string;
  active: boolean;
  sortOrder: number;
}

export interface Brand {
  id: number;
  name: string;
  logoUrl?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  iconUrl?: string;
}

export interface Store {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  whatsapp?: string;
  timings?: string;
  mapLink?: string;
  imageUrl?: string;
  videoUrl?: string;
  active: boolean;
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  publicId?: string;
  primaryImage: boolean;
  sortOrder: number;
}

export interface Product {
  id: number;
  title: string;
  brandId?: number;
  brandName?: string;
  brandLogoUrl?: string;
  categoryId?: number;
  categoryName?: string;
  categorySlug?: string;
  modelNumber?: string;
  processor?: string;
  processorGeneration?: string;
  ramGb?: number;
  storageGb?: number;
  storageType?: string;
  displaySize?: string;
  displayType?: string;
  os?: string;
  graphicsCard?: string;
  battery?: string;
  weight?: string;
  warrantyMonths?: number;
  warrantySummary?: string;
  returnDays?: number;
  sku?: string;
  serialNumber?: string;
  productCondition?: ProductCondition;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  stockQuantity?: number;
  available: boolean;
  featured: boolean;
  description?: string;
  stores: Store[];
  images: ProductImage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: number;
  quantity: number;
  product: Product;
}

export interface OrderItem {
  id: number;
  quantity: number;
  priceAtTime: number;
  product: Product;
}

export interface Order {
  id: number;
  totalAmount: number;
  status: OrderStatus;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  store?: Store;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  deliveryAddress?: string;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryPayload {
  name: string;
  phone: string;
  email?: string;
  productId?: number;
  message?: string;
}
