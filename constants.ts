import type { Category, NavigationCategory } from './types.ts';

export const CATEGORIES: Category[] = [
  { id: 'fashion', name: 'Fashion', image: 'https://picsum.photos/seed/fashion/300/300' },
  { id: 'mobiles', name: 'Mobiles', image: 'https://picsum.photos/seed/mobiles/300/300' },
  { id: 'electronics', name: 'Electronics', image: 'https://picsum.photos/seed/electronics/300/300' },
  { id: 'home-furniture', name: 'Home & Furniture', image: 'https://picsum.photos/seed/home/300/300' },
  { id: 'tv-appliances', name: 'TV & Appliances', image: 'https://picsum.photos/seed/tv/300/300' },
  { id: 'beauty', name: 'Beauty', image: 'https://picsum.photos/seed/beauty/300/300' },
  { id: 'grocery', name: 'Grocery', image: 'https://picsum.photos/seed/grocery/300/300' },
];

export const SHOP_BY_GOAL = [
  { name: 'Wedding Prep', icon: 'gift', image: 'https://picsum.photos/seed/wedding/400/400' },
  { name: 'Exam Season', icon: 'book-open', image: 'https://picsum.photos/seed/exam/400/400' },
  { name: 'Puja Shopping', icon: 'flower', image: 'https://picsum.photos/seed/puja/400/400' },
  { name: 'Travel Essentials', icon: 'plane', image: 'https://picsum.photos/seed/travel/400/400' },
];

export const NAVIGATION_CATEGORIES: NavigationCategory[] = [
  {
    id: 'fashion',
    name: 'Fashion',
    image: 'https://picsum.photos/seed/fashion/300/300',
    subCategories: [
      { id: 'mens-clothes', name: 'Men\'s Clothes' },
      { id: 'womens-clothes', name: 'Women\'s Clothes' },
      { id: 'mens-shoes', name: 'Men\'s Shoes' },
      { id: 'womens-shoes', name: 'Women\'s Shoes' },
      { id: 'watches', name: 'Watches' },
      { id: 'bags', name: 'Bags & Wallets' },
    ],
    filters: [
      {
        id: 'size', name: 'Size', type: 'checkbox', options: [
          { value: 'S', label: 'S' },
          { value: 'M', label: 'M' },
          { value: 'L', label: 'L' },
          { value: 'XL', label: 'XL' },
        ]
      },
    ]
  },
  {
    id: 'mobiles',
    name: 'Mobiles',
    image: 'https://picsum.photos/seed/mobiles/300/300',
    subCategories: [
      { id: 'smartphones', name: 'Smartphones' },
      { id: 'smartwatches', name: 'Smartwatches' },
      { id: 'mobile-accessories', name: 'Accessories' },
    ],
    filters: []
  },
  {
    id: 'electronics',
    name: 'Electronics',
    image: 'https://picsum.photos/seed/electronics/300/300',
    subCategories: [
      { id: 'laptops', name: 'Laptops' },
      { id: 'tablets', name: 'Tablets' },
      { id: 'headphones', name: 'Headphones & Audio' },
      { id: 'cameras', name: 'Cameras' },
      { id: 'gadgets', name: 'Gadgets' },
    ],
    filters: []
  },
  {
    id: 'home-furniture',
    name: 'Home & Furniture',
    image: 'https://picsum.photos/seed/home/300/300',
    subCategories: [
      { id: 'sofas', name: 'Sofas & Seating' },
      { id: 'beds', name: 'Beds & Mattresses' },
      { id: 'dining', name: 'Dining Furniture' },
      { id: 'decor', name: 'Home Décor' },
      { id: 'lighting', name: 'Lighting' },
      { id: 'bedding', name: 'Bedding' },
    ],
    filters: []
  },
  {
    id: 'tv-appliances',
    name: 'TV & Appliances',
    image: 'https://picsum.photos/seed/tv/300/300',
    subCategories: [
      { id: 'smart-tv', name: 'Smart TVs' },
      { id: 'washing-machines', name: 'Washing Machines' },
      { id: 'refrigerators', name: 'Refrigerators' },
      { id: 'ac', name: 'Air Conditioners' },
      { id: 'kitchen-appliances', name: 'Kitchen Appliances' },
    ],
    filters: []
  },
  {
    id: 'beauty',
    name: 'Beauty',
    image: 'https://picsum.photos/seed/beauty/300/300',
    subCategories: [
      { id: 'skincare', name: 'Skincare' },
      { id: 'makeup', name: 'Makeup' },
      { id: 'haircare', name: 'Haircare' },
      { id: 'fragrance', name: 'Fragrance' },
    ],
    filters: []
  },
  {
    id: 'grocery',
    name: 'Grocery',
    image: 'https://picsum.photos/seed/grocery/300/300',
    subCategories: [
      { id: 'fruits-veg', name: 'Fruits & Vegetables' },
      { id: 'snacks', name: 'Snacks' },
      { id: 'beverages', name: 'Beverages' },
      { id: 'dairy', name: 'Dairy & Eggs' },
      { id: 'household', name: 'Household Items' },
    ],
    filters: []
  },
];

export const SMART_SUGGESTIONS: { [key: string]: { name: string, icon: any }[] } = {
    'mobiles': [
        { name: 'Cases & Covers', icon: 'category' },
        { name: 'Screen Guards', icon: 'category' },
        { name: 'Power Banks', icon: 'wallet' },
    ],
    'fashion': [
        { name: 'Shoes', icon: 'category' },
        { name: 'Watches', icon: 'category' },
        { name: 'Sunglasses', icon: 'category' },
    ],
    'electronics': [
        { name: 'Laptop Bags', icon: 'category' },
        { name: 'Mouse & Keyboards', icon: 'category' },
        { name: 'External Hard Drives', icon: 'category' },
    ]
};

export const SITE_MAP_WITH_ROUTES = {
  'Company': [
    { name: 'About Us', to: '/about-us' },
    { name: 'Careers', to: '/shop' },
    { name: 'Press', to: '/shop' },
    { name: 'whYYOuts Live', to: '/shop' }
  ],
  'Help': [
    { name: 'Help Center', to: '/help-center' },
    { name: 'Contact Us', to: '/contact-us' }
  ],
  'Policy': [
    { name: 'Cancellation & Refund Policy', to: '/return-policy' },
    { name: 'Terms of Use', to: '/terms-of-use' },
    { name: 'Security Policy', to: '/security-policy' },
    { name: 'Privacy Policy', to: '/privacy-policy' },
    { name: 'Shipping Policy', to: '/shipping-policy' }
  ],
};

// This ID corresponds to the admin user's auth.uid and its entry in the public.sellers table.
export const ADMIN_USER_ID = 'cb460ef0-9dc3-4f2f-a884-366d2f70ed0d';