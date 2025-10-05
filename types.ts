

export interface FilterOption {
  value: string;
  label: string;
}

export interface Filter {
  id: string;
  name: string;
  type: 'checkbox' | 'range' | 'select';
  options: FilterOption[];
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface SubCategory {
  id: string;
  name: string;
}

export interface NavigationCategory extends Category {
  subCategories: SubCategory[];
  filters: Filter[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  images: string[];
  categoryId: string;
  subCategoryId?: string;
  features?: string[];
  sizes?: string[];
  sellerId: string;
  sellerBusinessName?: string;
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
  returnDays?: number;
  warrantyDetails?: string;
  createdAt?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  cartItemId: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'flat' | 'percentage';
  value: number;
  min_order_value?: number;
  expiry_date?: string;
  is_active: boolean;
  usage_count?: number;
  created_at?: string;
}

export interface Review {
    id: string;
    productId: string;
    userId: string;
    reviewerName: string;
    rating: number;
    comment: string;
    createdAt: string;
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
  sellerBusinessName?: string;
  selectedSize?: string;
  selectedColor?: string;
  returnDays?: number;
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
  orderDate: string;
  deliveryDate?: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingAddress: ShippingAddress;
  shippingTrackingNumber?: string;
  paymentId: string;
  paymentMethod: 'Razorpay' | 'Cash on Delivery' | 'cod' | 'razorpay';
  couponCode?: string;
  couponDiscount?: number;
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
  createdAt?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  latitude?: number;
  longitude?: number;
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

export interface Notification {
    id: string;
    userId: string;
    orderId: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export interface ReturnRequest {
    id: string;
    orderId: string;
    productId: string;
    userId: string;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    statusReason?: string;
    createdAt: string;
    productName?: string;
    productImage?: string;
    customerName?: string;
    customerDetails?: {
        phone?: string;
        shippingAddress?: ShippingAddress;
    }
}

export interface Payout {
  id: string;
  seller_id: string;
  amount: number;
  status: 'Processing' | 'Completed';
  requested_at: string;
  transaction_id?: string;
}

export interface SellerBankDetails {
    seller_id: string;
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  text?: string;
  products?: Product[];
  order?: Order;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: string;
  createdAt: string;
  status: 'open' | 'closed';
  replyMessage?: string;
  repliedAt?: string;
}

export interface Story {
  id: string;
  created_at: string;
  admin_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  title: string;
  duration_seconds: number;
}

export interface LiveChatSession {
    id: string;
    user_id: string;
    created_at: string;
    status: 'open' | 'closed';
    agent_id?: string;
}

export interface LiveChatMessage {
    id: number;
    session_id: string;
    sender_id: string;
    sender_role: 'user' | 'agent';
    message_text: string;
    created_at: string;
}