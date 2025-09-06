import React, { createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { CartItem, Product, Coupon } from '../types.ts';
import { useAuth } from './AuthContext.tsx';
import { useProducts } from '../hooks/useProducts.ts';
import { supabase } from '../supabase.ts';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number, size?: string, color?: string) => boolean;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => boolean;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  gstAmount: number;
  platformFee: number;
  shippingFee: number;
  grandTotal: number;
  loadingCart: boolean;
  toast: ToastState | null;
  hideToast: () => void;
  setShippingFee: (fee: number) => void;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  couponCode: string | null;
  couponDiscount: number;
  couponMessage: { text: string; type: 'success' | 'error' } | null;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [shippingFee, setShippingFee] = useState(0);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [gstPercentage, setGstPercentage] = useState(18); // Default to 18%
  const couponMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user, loading: authLoading } = useAuth();
  const { products, loading: productsLoading } = useProducts();

  const updateCartInDb = useCallback(async (items: CartItem[]) => {
      if (user) {
        await supabase.from('user_carts').upsert({ user_id: user.id, cart_items: items, updated_at: new Date().toISOString() });
      } else {
        localStorage.setItem('guestCart', JSON.stringify(items));
      }
  }, [user]);

  useEffect(() => {
    const fetchGstSetting = async () => {
        const { data } = await supabase.from('site_settings').select('gst_percentage').single();
        if (data && data.gst_percentage) {
            setGstPercentage(data.gst_percentage);
        }
    };
    fetchGstSetting();
  }, []);
  
  useEffect(() => {
    const loadCart = async () => {
      setLoadingCart(true);
      if (user) {
        const { data: dbData } = await supabase.from('user_carts').select('cart_items').eq('user_id', user.id).single();
        const dbCart: CartItem[] = dbData?.cart_items || [];
        const localData = localStorage.getItem('guestCart');
        const guestCart: CartItem[] = localData ? JSON.parse(localData) : [];
        
        if (guestCart.length > 0) {
          const mergedCart = [...dbCart];
          guestCart.forEach(guestItem => {
            const existingIndex = mergedCart.findIndex(item => item.cartItemId === guestItem.cartItemId);
            if (existingIndex > -1) {
              const product = products.find(p => p.id === guestItem.id);
              const stock = product?.stockQuantity;
              const dbItem = mergedCart[existingIndex];
              const newQuantity = Math.max(dbItem.quantity, guestItem.quantity);
              mergedCart[existingIndex].quantity = (stock !== undefined && newQuantity > stock) ? stock : newQuantity;
            } else {
              mergedCart.push(guestItem);
            }
          });
          setCartItems(mergedCart);
          await updateCartInDb(mergedCart);
          localStorage.removeItem('guestCart');
        } else {
          setCartItems(dbCart);
        }
      } else {
        const localData = localStorage.getItem('guestCart');
        setCartItems(localData ? JSON.parse(localData) : []);
      }
      setLoadingCart(false);
    };

    if (!authLoading && !productsLoading) {
      loadCart();
    }
  }, [user, authLoading, productsLoading, products, updateCartInDb]);
  
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };
  const hideToast = useCallback(() => setToast(null), []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCartItems(prevItems => {
        const newItems = prevItems.filter(item => item.cartItemId !== cartItemId);
        updateCartInDb(newItems);
        return newItems;
    });
  }, [updateCartInDb]);

  const addToCart = useCallback((product: Product, quantity: number, size?: string, color?: string): boolean => {
    const productInStore = products.find(p => p.id === product.id);
    const stock = productInStore?.stockQuantity;
    
    if (stock === 0) {
      showToast(`${product.name} is out of stock.`, 'error');
      return false;
    }
    
    const cartItemId = `${product.id}${size ? `-${size}` : ''}${color ? `-${color.replace('#', '')}` : ''}`;
    
    let currentQuantityInCart = 0;
    setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.cartItemId === cartItemId);
        currentQuantityInCart = existingItem?.quantity || 0;
        
        if (stock !== undefined && (currentQuantityInCart + quantity) > stock) {
          showToast(`Cannot add more. Only ${stock} of ${product.name} in stock.`, 'error');
          return prevItems; // Return original items without change
        }
        
        let newItems;
        if (existingItem) {
          newItems = prevItems.map(item =>
            item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
          );
        } else {
          newItems = [...prevItems, { ...product, quantity, selectedSize: size, selectedColor: color, cartItemId }];
        }

        updateCartInDb(newItems);
        return newItems;
    });

    if (stock !== undefined && (currentQuantityInCart + quantity) > stock) {
        return false;
    }

    showToast(`${product.name} added to cart!`, 'success');
    return true;
  }, [products, updateCartInDb]);

  const updateQuantity = useCallback((cartItemId: string, quantity: number): boolean => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return true;
    }
    
    let success = true;
    
    setCartItems(prevItems => {
        const itemToUpdate = prevItems.find(item => item.cartItemId === cartItemId);
        if (!itemToUpdate) {
            success = false;
            return prevItems;
        }

        const productInStore = products.find(p => p.id === itemToUpdate.id);
        const stock = productInStore?.stockQuantity;
        
        let newItems;

        if (stock !== undefined && quantity > stock) {
          showToast(`Only ${stock} of ${itemToUpdate.name} available.`, 'error');
          newItems = prevItems.map(item =>
            item.cartItemId === cartItemId ? { ...item, quantity: stock } : item
          );
          success = false;
        } else {
          newItems = prevItems.map(item =>
            item.cartItemId === cartItemId ? { ...item, quantity } : item
          );
        }
        
        updateCartInDb(newItems);
        return newItems;
    });

    return success;
  }, [products, removeFromCart, updateCartInDb]);

  const subtotal = useMemo(() => cartItems.reduce((total, item) => total + item.price * item.quantity, 0), [cartItems]);

  const setAndClearCouponMessage = useCallback((message: string, type: 'success' | 'error') => {
    if (couponMessageTimerRef.current) {
        clearTimeout(couponMessageTimerRef.current);
    }
    setCouponMessage({ text: message, type });
    couponMessageTimerRef.current = setTimeout(() => {
        setCouponMessage(null);
        couponMessageTimerRef.current = null;
    }, 4000);
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    const upperCode = code.toUpperCase();
    if (couponCode) {
        setAndClearCouponMessage('A coupon is already applied. Please remove it first.', 'error');
        return;
    }

    const { data, error } = await supabase.from('coupons').select('*').eq('code', upperCode).single();
    
    if (error || !data) {
        setAndClearCouponMessage('Invalid coupon code.', 'error');
        return;
    }

    const coupon: Coupon = data;

    if (!coupon.is_active) {
        setAndClearCouponMessage('This coupon is currently inactive.', 'error');
        return;
    }

    if (coupon.expiry_date) {
        const expiry = new Date(coupon.expiry_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        if (expiry < today) {
            setAndClearCouponMessage('This coupon has expired.', 'error');
            return;
        }
    }
    
    if (coupon.min_order_value && subtotal < coupon.min_order_value) {
        setAndClearCouponMessage(`This coupon requires a minimum order of ₹${coupon.min_order_value}.`, 'error');
        return;
    }

    let newDiscount = 0;
    if (coupon.type === 'flat') {
        newDiscount = Math.min(coupon.value, subtotal);
    } else if (coupon.type === 'percentage') {
        newDiscount = subtotal * (coupon.value / 100);
    }

    setCouponCode(coupon.code);
    setCouponDiscount(newDiscount);
    setAndClearCouponMessage(`Success! Coupon "${coupon.code}" applied.`, 'success');

  }, [subtotal, couponCode, setAndClearCouponMessage]);

  const removeCoupon = useCallback(() => {
    setCouponCode(null);
    setCouponDiscount(0);
    setAndClearCouponMessage('Coupon removed.', 'success');
  }, [setAndClearCouponMessage]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    updateCartInDb([]); // Explicitly clear the DB cart
    setShippingFee(0);
    setCouponCode(null);
    setCouponDiscount(0);
    setCouponMessage(null);
    if (couponMessageTimerRef.current) {
        clearTimeout(couponMessageTimerRef.current);
    }
  }, [updateCartInDb]);

  const itemCount = useMemo(() => cartItems.reduce((total, item) => total + item.quantity, 0), [cartItems]);
  const gstAmount = useMemo(() => subtotal * (gstPercentage / 100), [subtotal, gstPercentage]);
  const platformFee = 5;
  const grandTotal = useMemo(() => {
    const total = subtotal + gstAmount + platformFee + shippingFee - couponDiscount;
    return Math.max(0, total);
  }, [subtotal, gstAmount, platformFee, shippingFee, couponDiscount]);

  const value = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    itemCount,
    subtotal,
    gstAmount,
    platformFee,
    shippingFee,
    grandTotal,
    loadingCart,
    toast,
    hideToast,
    setShippingFee,
    applyCoupon,
    removeCoupon,
    couponCode,
    couponDiscount,
    couponMessage,
  }), [
    cartItems, 
    loadingCart, 
    toast, 
    shippingFee, 
    couponCode, 
    couponDiscount, 
    couponMessage,
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    hideToast, 
    applyCoupon, 
    removeCoupon,
    itemCount,
    subtotal,
    gstAmount,
    platformFee,
    grandTotal,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};