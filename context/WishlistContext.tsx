import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import { useAuth } from './AuthContext.tsx';
import { useProducts } from '../hooks/useProducts.ts';
import type { Product } from '../types.ts';

interface WishlistContextType {
  wishlistItems: Product[];
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

export const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { products } = useProducts();
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>([]);

  // Fetch wishlist from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      const fetchWishlist = async () => {
        const { data, error } = await supabase
          .from('wishlist')
          .select('product_id')
          .eq('user_id', user.id);
        
        if (error) {
          console.error("Error fetching wishlist:", error);
        } else if (data) {
          setWishlistProductIds(data.map(item => item.product_id));
        }
      };
      fetchWishlist();
    } else {
      // Clear wishlist on logout
      setWishlistProductIds([]);
    }
  }, [user]);

  // Derive full product objects from the main product list
  const wishlistItems = useMemo(() => {
    if (products.length === 0 || wishlistProductIds.length === 0) {
      return [];
    }
    return products.filter(p => wishlistProductIds.includes(p.id));
  }, [products, wishlistProductIds]);

  const addToWishlist = useCallback(async (productId: string) => {
    if (!user) {
      console.error("User must be logged in to add to wishlist.");
      return;
    }
    
    // Optimistic update
    setWishlistProductIds(prev => [...prev, productId]);

    const { error } = await supabase.from('wishlist').insert({
      user_id: user.id,
      product_id: productId,
    });

    if (error) {
      console.error("Error adding to wishlist:", error);
      // Revert state on error
      setWishlistProductIds(prev => prev.filter(id => id !== productId));
    }
  }, [user]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    if (!user) {
      console.error("User must be logged in to remove from wishlist.");
      return;
    }

    // Optimistic update
    setWishlistProductIds(prev => prev.filter(id => id !== productId));

    const { error } = await supabase.from('wishlist').delete().match({
      user_id: user.id,
      product_id: productId,
    });

    if (error) {
      console.error("Error removing from wishlist:", error);
      // Revert state on error
      setWishlistProductIds(prev => [...prev, productId]);
    }
  }, [user]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlistProductIds.includes(productId);
  }, [wishlistProductIds]);

  const value = useMemo(() => ({
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  }), [wishlistItems, addToWishlist, removeFromWishlist, isInWishlist]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
