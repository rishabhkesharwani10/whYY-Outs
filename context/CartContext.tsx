
import React, { createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { CartItem, Product, Coupon } from '../types.ts';
import { useAuth } from './AuthContext.tsx';
import { supabase } from '../supabase.ts';
import { useToast } from '../hooks/useToast.ts';

interface CartStateType {
  cartItems: CartItem[];
  itemCount: number;
  subtotal: number;
  gstAmount: number;
  gstPercentage: number;
  platformFee: number;
  shippingFee: number;
  grandTotal: number;
  loadingCart: boolean;
  updatingItemId: string | null;
  couponCode: string | null;
  couponDiscount: number;
  couponMessage: { text: string; type: 'success' | 'error' } | null;
}

interface CartActionsType {
  addToCart: (product: Product, quantity: number, size?: string, color?: string) => Promise<boolean>;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<void>;
  setShippingFee: (fee: number) => void;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
}

export const CartStateContext = createContext<CartStateType | undefined>(undefined);
export const CartActionsContext = createContext<CartActionsType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [shippingFee, setShippingFee] = useState(0);
  const [couponCode, setCouponCode] = useState<string | null>(() => sessionStorage.getItem('appliedCouponCode'));
  const [couponDiscount, setCouponDiscount] = useState<number>(() => parseFloat(sessionStorage.getItem('appliedCouponDiscount') || '0'));
  const [couponMessage, setCouponMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [gstPercentage, setGstPercentage] = useState(18); // Default to 18%
  const couponMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  
  const updateCartInDb = useCallback(async (items: CartItem[]): Promise<boolean> => {
      if (user) {
        try {
            const { error } = await supabase.from('user_carts').upsert({ user_id: user.id, cart_items: items, updated_at: new Date().toISOString() });
            if (error) throw error;
        } catch (error: any) {
            console.error("Failed to update cart in DB:", error.message || error);
            showToast('Failed to sync your cart. Please check your connection.', 'error');
            return false;
        }
      } else {
        localStorage.setItem('guestCart', JSON.stringify(items));
      }
      return true;
  }, [user, showToast]);

  useEffect(() => {
    const fetchAndSetGst = async () => {
        const { data } = await supabase.from('site_settings').select('gst_percentage').single();
        if (data?.gst_percentage) {
            setGstPercentage(data.gst_percentage);
        }
    };
    
    fetchAndSetGst();
    const channel = supabase
        .channel('site-settings-gst-change')
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'site_settings', filter: 'id=eq.1' },
            (payload) => {
                const newGst = payload.new?.gst_percentage;
                if (typeof newGst === 'number') {
                    setGstPercentage(newGst);
                }
            }
        )
        .subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    };
  }, []);
  
  useEffect(() => {
    const loadCart = async () => {
      setLoadingCart(true);
      let cartItemsToLoad: CartItem[] = [];
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
              mergedCart[existingIndex].quantity = Math.max(mergedCart[existingIndex].quantity, guestItem.quantity);
            } else {
              mergedCart.push(guestItem);
            }
          });
          cartItemsToLoad = mergedCart;
          await updateCartInDb(mergedCart);
          localStorage.removeItem('guestCart');
        } else {
          cartItemsToLoad = dbCart;
        }
      } else {
        const localData = localStorage.getItem('guestCart');
        cartItemsToLoad = localData ? JSON.parse(localData) : [];
      }

      // Re-validate cart items with the latest data from the database
      if (cartItemsToLoad.length > 0) {
        const productIds = [...new Set(cartItemsToLoad.map(item => item.id))];
        const { data: freshProductsData, error } = await supabase
            .from('products')
            .select('id, name, price, original_price, stock_quantity, image, images')
            .in('id', productIds);
        
        if (freshProductsData) {
            // Fix: Added a type for the product data fetched from Supabase to resolve property access errors.
            type FreshProductInfo = {
                id: string;
                name: string;
                price: number;
                original_price?: number;
                stock_quantity?: number;
                image: string;
                images: string[];
            };
            const freshProductMap = new Map((freshProductsData as FreshProductInfo[]).map(p => [p.id, p]));
            const validatedCartItems = cartItemsToLoad.map(item => {
                const freshData = freshProductMap.get(item.id);
                if (freshData) {
                    const updatedItem = { ...item };
                    updatedItem.price = freshData.price;
                    updatedItem.originalPrice = freshData.original_price;
                    updatedItem.name = freshData.name;
                    updatedItem.image = freshData.image;
                    updatedItem.images = freshData.images;
                    
                    if (freshData.stock_quantity !== undefined && updatedItem.quantity > freshData.stock_quantity) {
                        showToast(`Quantity for ${updatedItem.name} reduced to ${freshData.stock_quantity} due to stock limits.`, 'error');
                        updatedItem.quantity = freshData.stock_quantity;
                    }
                    return updatedItem;
                }
                return null; // Product no longer exists
            }).filter((item): item is CartItem => item !== null && item.quantity > 0);
            
            if (validatedCartItems.length < cartItemsToLoad.length) {
                showToast('Some items in your cart were removed as they are no longer available.', 'error');
            }
            
            setCartItems(validatedCartItems);
            await updateCartInDb(validatedCartItems);
        } else {
            console.error("Could not re-validate cart items:", error);
            setCartItems(cartItemsToLoad); // Fallback to stale data
        }
      } else {
         setCartItems([]);
      }
      setLoadingCart(false);
    };

    if (!authLoading) {
      loadCart();
    }
  }, [user, authLoading, updateCartInDb, showToast]);
  
  const removeFromCart = useCallback((cartItemId: string) => {
    setCartItems(prevItems => {
        const newItems = prevItems.filter(item => item.cartItemId !== cartItemId);
        updateCartInDb(newItems);
        return newItems;
    });
  }, [updateCartInDb]);

  const addToCart = useCallback(async (product: Product, quantity: number, size?: string, color?: string): Promise<boolean> => {
    const cartItemId = `${product.id}${size ? `-${size}` : ''}${color ? `-${color.replace('#', '')}` : ''}`;
    setUpdatingItemId(cartItemId);

    const { data: productInStore, error: fetchError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', product.id)
        .single();
    
    if (fetchError) {
        showToast('Could not verify stock. Please try again.', 'error');
        setUpdatingItemId(null);
        return false;
    }
    
    const stock = productInStore?.stock_quantity;
    
    if (stock === 0) {
      showToast(`${product.name} is out of stock.`, 'error');
      setUpdatingItemId(null);
      return false;
    }
    
    const existingItem = cartItems.find(item => item.cartItemId === cartItemId);
    const currentQuantityInCart = existingItem?.quantity || 0;
        
    if (stock !== undefined && (currentQuantityInCart + quantity) > stock) {
      showToast(`Cannot add more. Only ${stock} of ${product.name} in stock.`, 'error');
      setUpdatingItemId(null);
      return false;
    }
    
    let newItems;
    if (existingItem) {
      newItems = cartItems.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
      );
    } else {
      newItems = [...cartItems, { ...product, quantity, selectedSize: size, selectedColor: color, cartItemId }];
    }

    setCartItems(newItems);
    const success = await updateCartInDb(newItems);
    
    if(success) {
        showToast(`${product.name} added to cart!`, 'success');
    }

    setUpdatingItemId(null);
    return success;
  }, [cartItems, updateCartInDb, showToast]);

  const updateQuantity = useCallback(async (cartItemId: string, quantity: number): Promise<boolean> => {
    setUpdatingItemId(cartItemId);

    if (quantity <= 0) {
      removeFromCart(cartItemId);
      setUpdatingItemId(null);
      return true;
    }
    
    const itemToUpdate = cartItems.find(item => item.cartItemId === cartItemId);
    if (!itemToUpdate) {
        setUpdatingItemId(null);
        return false;
    }

    const { data: productInStore, error: fetchError } = await supabase
        .from('products')
        .select('stock_quantity, name')
        .eq('id', itemToUpdate.id)
        .single();

    if (fetchError) {
        showToast('Could not verify stock. Please try again.', 'error');
        setUpdatingItemId(null);
        return false;
    }

    const stock = productInStore?.stock_quantity;
    const productName = productInStore?.name || itemToUpdate.name;
    
    let newItems;
    let success = true;

    if (stock !== undefined && quantity > stock) {
      showToast(`Only ${stock} of ${productName} available.`, 'error');
      newItems = cartItems.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity: stock } : item
      );
      success = false;
    } else {
      newItems = cartItems.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      );
    }
    
    setCartItems(newItems);
    await updateCartInDb(newItems);
    setUpdatingItemId(null);
    return success;
  }, [cartItems, removeFromCart, updateCartInDb, showToast]);

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

  const removeCoupon = useCallback(() => {
    setCouponCode(null);
    setCouponDiscount(0);
    sessionStorage.removeItem('appliedCouponCode');
    sessionStorage.removeItem('appliedCouponDiscount');
    setAndClearCouponMessage('Coupon removed.', 'success');
  }, [setAndClearCouponMessage]);

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
    sessionStorage.setItem('appliedCouponCode', coupon.code);
    sessionStorage.setItem('appliedCouponDiscount', newDiscount.toString());
    setAndClearCouponMessage(`Success! Coupon "${coupon.code}" applied.`, 'success');

  }, [subtotal, couponCode, setAndClearCouponMessage]);

  useEffect(() => {
    const validatePersistedCoupon = async () => {
        if (!couponCode) return;
        const { data } = await supabase.from('coupons').select('*').eq('code', couponCode).single();
        if (data) {
            const coupon: Coupon = data;
            const isExpired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date();
            const meetsMinValue = !coupon.min_order_value || subtotal >= coupon.min_order_value;
            if (coupon.is_active && !isExpired && meetsMinValue) {
                let newDiscount = 0;
                if (coupon.type === 'flat') newDiscount = Math.min(coupon.value, subtotal);
                else if (coupon.type === 'percentage') newDiscount = subtotal * (coupon.value / 100);
                setCouponDiscount(newDiscount);
                sessionStorage.setItem('appliedCouponDiscount', newDiscount.toString());
            } else {
                removeCoupon();
            }
        } else {
            removeCoupon();
        }
    };
    if (!loadingCart) {
        validatePersistedCoupon();
    }
  }, [subtotal, loadingCart, couponCode, removeCoupon]);

  const clearCart = useCallback(async () => {
    const originalCartItems = [...cartItems];

    setCartItems([]);
    setShippingFee(0);
    removeCoupon();
    setCouponMessage(null);
    if (couponMessageTimerRef.current) {
        clearTimeout(couponMessageTimerRef.current);
    }
    
    const success = await updateCartInDb([]);

    if (!success) {
      setCartItems(originalCartItems);
      showToast(
        "Your order was placed, but we couldn't clear your cart. Please refresh or clear it manually.",
        'error'
      );
    }
  }, [cartItems, updateCartInDb, removeCoupon, showToast]);

  const itemCount = useMemo(() => cartItems.reduce((total, item) => total + item.quantity, 0), [cartItems]);
  const gstAmount = useMemo(() => subtotal * (gstPercentage / 100), [subtotal, gstPercentage]);
  const platformFee = 5;
  const grandTotal = useMemo(() => {
    const total = subtotal + gstAmount + platformFee + shippingFee - couponDiscount;
    return Math.max(0, total);
  }, [subtotal, gstAmount, platformFee, shippingFee, couponDiscount]);

  const stateValue = useMemo<CartStateType>(() => ({
    cartItems,
    itemCount,
    subtotal,
    gstAmount,
    gstPercentage,
    platformFee,
    shippingFee,
    grandTotal,
    loadingCart,
    updatingItemId,
    couponCode,
    couponDiscount,
    couponMessage,
  }), [
    cartItems, 
    itemCount, 
    subtotal, 
    gstAmount, 
    gstPercentage, 
    platformFee, 
    shippingFee, 
    grandTotal, 
    loadingCart, 
    updatingItemId, 
    couponCode, 
    couponDiscount, 
    couponMessage
  ]);

  const actionsValue = useMemo<CartActionsType>(() => ({
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setShippingFee,
    applyCoupon,
    removeCoupon,
  }), [
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    applyCoupon, 
    removeCoupon
  ]);

  return (
    <CartStateContext.Provider value={stateValue}>
      <CartActionsContext.Provider value={actionsValue}>
        {children}
      </CartActionsContext.Provider>
    </CartStateContext.Provider>
  );
};
