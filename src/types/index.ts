export type Role =
  | "USER"
  | "ADMIN"
  | "SUPER_ADMIN"
  | "MANAGER"
  | "STORE_MANAGER"
  | "SALES_EXECUTIVE"
  | "SUPPORT_AGENT"
  | "INVENTORY_MANAGER"
  | "CONTENT_MANAGER"
  | "ACCOUNTANT";
export type ProductCondition = "EXCELLENT" | "GOOD" | "FAIR";
export type DeliveryType = "PICKUP" | "DELIVERY";
export type PaymentMethod = "CASH" | "UPI" | "CARD" | "BANK_TRANSFER";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type OrderStatus = "PENDING" | "CONFIRMED" | "PACKED" | "SHIPPED" | "READY" | "DELIVERED" | "CANCELLED" | "RETURN_REQUESTED" | "REFUNDED";
export type PaymentGateway = "OFFLINE" | "RAZORPAY";
export type PaymentTransactionStatus = "CREATED" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED" | "CANCELLED";
export type BannerMediaType = "IMAGE" | "VIDEO";
export type BannerPlacement = "HOME_HERO" | "HOME_MIDDLE" | "CATEGORY" | "PRODUCT_DETAIL" | "USE_CASE";
export type ProductSectionType =
  | "BEST_SELLERS"
  | "TODAYS_DEALS"
  | "FEATURED_PRODUCTS"
  | "NEW_ARRIVALS"
  | "TRENDING_PRODUCTS"
  | "RECOMMENDED_PRODUCTS"
  | "TOP_RATED"
  | "LOW_PRICE_DEALS";
export type OrderTimelineEventType =
  | "PLACED"
  | "PAYMENT_PENDING"
  | "PAYMENT_AUTHORIZED"
  | "PAYMENT_CAPTURED"
  | "PAYMENT_FAILED"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "READY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "REFUNDED";
export type NavigationMenuLocation = "HEADER" | "FOOTER" | "MOBILE";

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
  refreshToken?: string;
  sessionId?: number;
  tokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
}

export interface Banner {
  id: number;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  desktopImageUrl?: string;
  mobileImageUrl?: string;
  videoUrl?: string;
  mediaType?: BannerMediaType;
  ctaText?: string;
  linkUrl?: string;
  placement?: BannerPlacement;
  active: boolean;
  activeNow?: boolean;
  sortOrder: number;
  startAt?: string;
  endAt?: string;
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
  compareFields?: string;
}

export interface CmsPageSection {
  title?: string;
  content?: string;
}

export interface CmsPageFaqItem {
  question?: string;
  answer?: string;
}

export interface CmsPage {
  id: number;
  slug: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  eyebrow?: string;
  heroTitle?: string;
  heroDescription?: string;
  body?: string;
  active: boolean;
  sections: CmsPageSection[];
  faqItems: CmsPageFaqItem[];
  updatedAt?: string;
}

export interface NavigationItem {
  id?: number;
  menuLocation: NavigationMenuLocation;
  label: string;
  url: string;
  visible: boolean;
  sortOrder?: number;
}

export interface NavigationConfig {
  headerMenu: NavigationItem[];
  footerMenu: NavigationItem[];
  mobileMenu: NavigationItem[];
}

export type HomepageBuilderSectionType =
  | "ANNOUNCEMENT_BAR"
  | "HERO_BANNER"
  | "FEATURED_CATEGORIES"
  | "FEATURED_PRODUCTS"
  | "BEST_SELLERS"
  | "OFFER_BANNER"
  | "TRUST_BADGES"
  | "WHY_CHOOSE_US";

export interface HomepageBuilderSection {
  type: HomepageBuilderSectionType;
  enabled: boolean;
  order: number;
}

export interface HomepageBuilderTrustBadge {
  label: string;
}

export interface HomepageBuilderWhyCard {
  stat: string;
  title: string;
  desc: string;
  tone: "blue" | "emerald" | "amber" | "rose";
}

export interface HomepageBuilderAnnouncementBar {
  enabled: boolean;
  text: string;
  linkLabel?: string;
  linkUrl?: string;
}

export interface HomepageBuilderConfig {
  announcementBar: HomepageBuilderAnnouncementBar;
  featuredCategoryIds: number[];
  sections: HomepageBuilderSection[];
  trustBadges: HomepageBuilderTrustBadge[];
  whyChooseUsCards: HomepageBuilderWhyCard[];
}

export interface Store {
  id: number;
  name: string;
  address: string;
  landmark?: string;
  postalCode?: string;
  city: string;
  state: string;
  phone: string;
  whatsapp?: string;
  timings?: string;
  mapLink?: string;
  imageUrl?: string;
  videoUrl?: string;
  googleRating?: number;
  googleReviewCount?: number;
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
  gstRatePercent?: number;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  stockQuantity?: number;
  available: boolean;
  featured: boolean;
  bestSeller: boolean;
  todayDeal: boolean;
  dealStartDate?: string;
  dealEndDate?: string;
  videoUrl?: string;
  lowStockThreshold?: number;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  customAttributes?: Record<string, unknown>;
  stores: Store[];
  images: ProductImage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface HomeSection {
  id?: number;
  title: string;
  subtitle?: string;
  sectionType: ProductSectionType;
  displayOrder?: number;
  maxProducts?: number;
  startAt?: string;
  endAt?: string;
  products: Product[];
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

export interface PaymentTransaction {
  id: number;
  gateway: PaymentGateway;
  status: PaymentTransactionStatus;
  amount: number;
  currency: string;
  receipt?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewayStatus?: string;
  failureReason?: string;
  refundId?: string;
  refundedAmount?: number;
  refundReason?: string;
  refundStatus?: string;
  verifiedAt?: string;
  paidAt?: string;
  refundedAt?: string;
  createdAt?: string;
}

export interface OrderTimelineEvent {
  id: number;
  eventType: OrderTimelineEventType;
  title: string;
  description?: string;
  source?: string;
  actorId?: number;
  actorName?: string;
  actorEmail?: string;
  createdAt: string;
}

export interface PaymentCheckoutSession {
  orderId: number;
  orderNumber: string;
  transactionId: number;
  gateway: PaymentGateway;
  keyId: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  merchantName: string;
  description: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  invoiceNumber: string;
  subtotalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  deliveryCharge?: number;
  couponCode?: string;
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
  deliveryState?: string;
  notes?: string;
  cancellationReason?: string;
  returnReason?: string;
  paidAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  returnRequestedAt?: string;
  latestPayment?: PaymentTransaction;
  timeline: OrderTimelineEvent[];
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  id?: number;
  companyName: string;
  logoUrl?: string;
  faviconUrl?: string;
  tagline?: string;
  footerDescription?: string;
  supportEmail?: string;
  supportPhone?: string;
  shippingNote?: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  standardDeliveryCharge?: number;
  freeDeliveryThreshold?: number;
  stateDeliveryCharges?: string;
  stateDeliveryWindows?: string;
  estimatedDeliveryDays?: number;
  gstEnabled: boolean;
  gstRate?: number;
  gstNumber?: string;
  companyPan?: string;
  defaultHsnCode?: string;
  companyAddress?: string;
  companyPincode?: string;
  invoicePrefix?: string;
  invoiceNextSequence?: number;
  invoicePadding?: number;
  invoiceTerms?: string;
  returnPolicy?: string;
  defaultCity?: string;
  defaultState?: string;
  mapLink?: string;
  includeDefaultHomeSections?: boolean;
  defaultHomeSectionTypes?: string;
  notificationEmailFrom?: string;
  notificationReplyTo?: string;
  whatsappNumber?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  homepageBuilderJson?: string;
  orderNotificationsEnabled?: boolean;
  paymentNotificationsEnabled?: boolean;
  returnNotificationsEnabled?: boolean;
  securityNotice?: string;
}

export type SeoTargetType = "HOME" | "PRODUCT_LIST" | "PRODUCT" | "CATEGORY" | "CMS_PAGE";

export interface SeoSetting {
  id?: number;
  targetType: SeoTargetType;
  targetId?: number;
  targetSlug?: string;
  pageTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  noIndex: boolean;
  sitemapEnabled: boolean;
}

export interface CheckoutSavedAddress {
  id: string;
  label: string;
  address: string;
  contactName?: string;
  contactPhone?: string;
  defaultAddress?: boolean;
}

export interface CheckoutProfile {
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  defaultDeliveryAddress?: string;
  savedAddresses: CheckoutSavedAddress[];
}

export interface UserAddress {
  id: number;
  label: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  defaultAddress: boolean;
}

export interface UserProfile {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  preferredContactName?: string;
  preferredContactPhone?: string;
  preferredContactEmail?: string;
  addresses: UserAddress[];
}

export interface CouponValidation {
  code: string;
  valid: boolean;
  message?: string;
  subtotal: number;
  discountAmount: number;
  finalAmount: number;
  minOrder?: number;
  expiryDate?: string;
  remainingUses?: number;
}

export interface RazorpaySettings {
  enabled: boolean;
  configured: boolean;
  keyId?: string;
  keySecretConfigured?: boolean;
  webhookSecretConfigured?: boolean;
  currency?: string;
  merchantName?: string;
  apiBaseUrl?: string;
}

export interface EnquiryPayload {
  name: string;
  phone: string;
  email?: string;
  productId?: number;
  message?: string;
  enquiryType?: string;
  companyName?: string;
  quantity?: number;
  budget?: number;
}

export interface ProductReview {
  id: number;
  productId?: number;
  productTitle?: string;
  productImageUrl?: string;
  userId?: number;
  customerName: string;
  customerEmail?: string;
  rating: number;
  title?: string;
  comment: string;
  status?: string;
  featured?: boolean;
  adminNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BackInStockRequest {
  id?: number;
  productId: number;
  email: string;
  phone?: string;
}

export interface PriceDropAlert {
  id?: number;
  productId: number;
  email: string;
  phone?: string;
  targetPrice?: number;
}
