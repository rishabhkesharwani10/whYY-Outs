// This file contains all the core type definitions for the application.

export interface FilterOption {
  value: string;
  label: string;
}

export interface Filter {
  id: string;
  name: string;
  type: 'checkbox' | 'range';
  options?: FilterOption[];
}

export interface SubCategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface NavigationCategory extends Category {
  subCategories: SubCategory[];
  filters: Filter[];
}

export interface Product {
  id:string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  images: string[];
  categoryId: string;
  features?: string[];
  sizes?: string[];
  sellerId: string;
  subCategoryId?: string;
  brand?: string;
  sku?: string;
  upc?: string;
  modelNumber?: string;
  videoUrl?: string;
  costPrice?: number;
  stockQuantity?: number;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  deliveryEstimate?: string;
  color?: string;
  material?: string;
  expiryDate?: string;
  returnPolicy?: string;
  warrantyDetails?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  cartItemId: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string; // ISO date string
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  zip: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sellerId: string;
  selectedSize?: string;
  selectedColor?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  gst: number;
  platformFee: number;
  shippingFee: number;
  totalPrice: number;
  orderDate: string; // ISO date string
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingAddress: ShippingAddress;
  shippingTrackingNumber?: string;
  paymentId?: string;
  paymentMethod: 'Razorpay' | 'Cash on Delivery' | 'card' | 'qr';
  couponCode?: string;
  couponDiscount?: number;
}

export interface Notification {
  id: string;
  userId: string;
  orderId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface BaseUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  avatar_url?: string;
  createdAt?: string; // ISO date string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | '';
}

export interface Customer extends BaseUser {
  role: 'customer';
}

export interface Seller extends BaseUser {
  role: 'seller';
  businessName?: string;
  panNumber?: string;
  gstNumber?: string;
  registrationNumber?: string;
}

export interface Admin extends BaseUser {
  role: 'admin';
}

export type AuthenticatedUser = Customer | Seller | Admin;

export interface Payout {
  id: string;
  date: string; // ISO date string
  amount: number;
  status: 'Completed' | 'Processing';
  transactionId: string;
}

export interface SellerBankDetails {
  seller_id: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  updated_at?: string; // ISO date string
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  productId: string;
  userId: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  statusReason?: string;
  createdAt: string; // ISO date string
  // Optional joined properties for UI
  productName?: string;
  productImage?: string;
  customerName?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  text?: string;
  products?: Product[];
  order?: Order;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  min_order_value?: number;
  is_active: boolean;
  expiry_date?: string; // ISO date string
  created_at: string; // ISO date string
  usage_count?: number;
}