

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
}

export interface CartItem extends Product {
  cartItemId: string;
  quantity: number;
  selectedSize?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  phone: string;
  address: string;
  pincode: string;
  avatar_url?: string;
  role: 'customer' | 'seller';
  createdAt?: string;
}

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