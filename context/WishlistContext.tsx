import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import { useAuth } from './AuthContext.tsx';
import { useProducts } from '../hooks/useProducts.ts';
import type { Product } from '../types.ts';

interface WishlistContextType {
  wishlistItems: Product[];
  loading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

export const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { products: cachedProducts, loading: productsLoading, fetchAndCacheProducts } = useProducts();
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>([]);
  const [wishlistFetchLoading, setWishlistFetchLoading] = useState(true);

  // Fetch wishlist from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      const fetchWishlist = async () => {
        setWishlistFetchLoading(true);
        const { data, error } = await supabase
          .from('wishlist')
          .select('product_id')
          .eq('user_id', user.id);
        
        if (error) {
          console.error("Error fetching wishlist:", JSON.stringify(error, null, 2));
        } else if (data) {
          const ids = data.map(item => item.product_id);
          setWishlistProductIds(ids);

          // Fetch details for any products that aren't already in the global cache
          const missingIds = ids.filter(id => !cachedProducts.some(p => p.id === id));
          if (missingIds.length > 0) {
            await fetchAndCacheProducts(missingIds);
          }
        }
        setWishlistFetchLoading(false);
      };
      fetchWishlist();
    } else if (!authLoading) {
      // Clear wishlist on logout or if no user after auth check
      setWishlistProductIds([]);
      setWishlistFetchLoading(false);
    }
  }, [user, authLoading, fetchAndCacheProducts]);

  // Derive full product objects from the main product list
  const wishlistItems = useMemo(() => {
    if (cachedProducts.length === 0 || wishlistProductIds.length === 0) {
      return [];
    }
    return cachedProducts.filter(p => wishlistProductIds.includes(p.id));
  }, [cachedProducts, wishlistProductIds]);
  
  const loading = productsLoading || wishlistFetchLoading;

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
      console.error("Error adding to wishlist:", JSON.stringify(error, null, 2));
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
      console.error("Error removing from wishlist:", JSON.stringify(error, null, 2));
      // Revert state on error
      setWishlistProductIds(prev => [...prev, productId]);
    }
  }, [user]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlistProductIds.includes(productId);
  }, [wishlistProductIds]);

  const value = useMemo(() => ({
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  }), [wishlistItems, loading, addToWishlist, removeFromWishlist, isInWishlist]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};