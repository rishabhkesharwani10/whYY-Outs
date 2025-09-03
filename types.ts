
export interface Category {
  id: string;
  name: string;
  image: string;
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
  features: string[];
  sizes?: string[];
  sellerId: string;

  // New detailed fields
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
  expiryDate?: string; // Using string for DATE type
  returnPolicy?: string;
  warrantyDetails?: string;
}

export interface CartItem extends Product {
  cartItemId: string;
  quantity: number;
  selectedSize?: string;
}

// Base for common user properties
interface BaseUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  pincode: string;
  avatar_url?: string;
  createdAt?: string;
}

// Represents a customer profile
export interface Customer extends BaseUser {
  role: 'customer';
}

// Represents a seller profile
export interface Seller extends BaseUser {
  role: 'seller';
  panNumber?: string;
  gstNumber?: string;
}

// The user object in the auth context will be this union type
export type AuthenticatedUser = Customer | Seller;


export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalPrice: number;
  orderDate: string; // ISO string
  status: 'Processing' | 'Shipped' | 'Delivered';
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    zip: string;
  };
  trackingNumber?: string;
}


// New types for advanced navigation and filtering
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
  id:string;
  name: string;
}

export interface NavigationCategory {
  id: string;
  name: string;
  image: string;
  subCategories: SubCategory[];
  brands?: string[];
  filters?: Filter[];
}

// Types for the new Seller Portal
export interface ReturnRequest {
  id: string;
  orderId: string;
  productName: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedAt: string; // ISO string
}

export interface Payout {
  id: string;
  date: string; // ISO string
  amount: number;
  status: 'Completed' | 'Processing';
  transactionId: string;
}

// Type for the new seller_bank_details table
export interface SellerBankDetails {
  seller_id: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
}


// Types for AI Co-Pilot
export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  text?: string;
  products?: Product[];
  order?: Order;
}
