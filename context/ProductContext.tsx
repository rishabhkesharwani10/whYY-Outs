import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Product } from '../types.ts';
import { supabase } from '../supabase.ts';
import { useAuth } from './AuthContext.tsx';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchAndCacheProducts: (productIds: string[]) => Promise<void>;
  addProduct: (productData: Omit<Product, 'id' | 'rating' | 'reviewCount'>) => Promise<{ data: Product | null; error: any | null }>;
  updateProduct: (productId: string, productData: Partial<Product>) => Promise<{ error: any | null }>;
  deleteProduct: (product: Product) => Promise<{ error: any | null }>;
  refreshProducts: () => Promise<void>;
  lastRefreshed: number;
}

export const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Helper to map Supabase product (snake_case) to our app's Product type (camelCase)
const mapSupabaseProduct = (product: any): Product => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: product.price,
  originalPrice: product.original_price,
  rating: product.rating,
  reviewCount: product.review_count,
  image: product.image,
  images: product.images,
  categoryId: product.category_id,
  features: product.features,
  sizes: product.sizes,
  sellerId: product.seller_id,
  sellerBusinessName: product.sellers?.business_name,
  subCategoryId: product.sub_category_id,
  brand: product.brand,
  sku: product.sku,
  upc: product.upc,
  modelNumber: product.model_number,
  videoUrl: product.video_url,
  costPrice: product.cost_price,
  stockQuantity: product.stock_quantity,
  minOrderQuantity: product.min_order_quantity,
  maxOrderQuantity: product.max_order_quantity,
  weightKg: product.weight_kg,
  lengthCm: product.length_cm,
  widthCm: product.width_cm,
  heightCm: product.height_cm,
  deliveryEstimate: product.delivery_estimate,
  color: product.color,
  material: product.material,
  expiryDate: product.expiry_date,
  returnPolicy: product.return_policy,
  returnDays: product.return_days,
  warrantyDetails: product.warranty_details,
  createdAt: product.created_at,
});

const mapAppProductToSupabase = (productData: Partial<Product>) => {
  const supabaseData: { [key: string]: any } = {};
  for (const key in productData) {
    const snakeCaseKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    supabaseData[snakeCaseKey] = (productData as any)[key];
  }
  return supabaseData;
};

const PRODUCT_QUERY_FIELDS = `
    id, name, description, price, original_price, rating, review_count, image, images, category_id,
    sub_category_id, features, sizes, seller_id, brand, sku, upc, model_number, video_url, cost_price,
    stock_quantity, min_order_quantity, max_order_quantity, weight_kg, length_cm, width_cm, height_cm,
    delivery_estimate, color, material, expiry_date, return_policy, return_days, warranty_details, created_at,
    sellers(business_name)
`;

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
  const { user } = useAuth();

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        if (!user) {
            setProducts([]);
            return;
        }

        let query = supabase.from('products').select(PRODUCT_QUERY_FIELDS);

        if (user.role === 'seller') {
            query = query.eq('seller_id', user.id);
        } else if (user.role === 'customer') {
            // For customers, the context is primarily a cache.
            // We don't pre-fetch all products to keep it lightweight.
            // Individual pages like ShopPage will handle their own fetching.
            setProducts([]);
            return;
        }
        // For 'admin', the query remains to select all products, which is needed for analytics.

        const { data, error: fetchError } = await query.order('created_at', { ascending: false });
        if (fetchError) throw fetchError;
        
        setProducts(data ? data.map(mapSupabaseProduct) : []);

    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
        setLastRefreshed(Date.now());
    }
  }, [user]);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const fetchAndCacheProducts = useCallback(async (productIds: string[]) => {
    if (productIds.length === 0) return;
    setLoading(true);
    try {
        const { data, error: fetchError } = await supabase
            .from('products')
            .select(PRODUCT_QUERY_FIELDS)
            .in('id', productIds);

        if (fetchError) throw fetchError;

        if (data) {
            const newProducts = data.map(mapSupabaseProduct);
            setProducts(currentProducts => {
                const productMap = new Map(currentProducts.map(p => [p.id, p]));
                newProducts.forEach(p => productMap.set(p.id, p));
                return Array.from(productMap.values());
            });
        }
    } catch (err: any) {
        console.error('Error fetching products by IDs:', err.message);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          // A simple and robust way to handle real-time updates is to just re-fetch the data.
          // This ensures consistency without complex client-side logic.
          refreshProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshProducts]);

  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'rating' | 'reviewCount'>) => {
    const newProductData = {
      ...mapAppProductToSupabase(productData),
      rating: 0,
      review_count: 0,
    };
    
    const { data, error } = await supabase.from('products').insert(newProductData).select().single();
    
    if (error) {
        console.error('Error adding product:', error.message || error);
    }
    return { data: data ? mapSupabaseProduct(data) : null, error };
  }, []);
  
  const updateProduct = useCallback(async (productId: string, productData: Partial<Product>) => {
    const snakeCaseData = mapAppProductToSupabase(productData);
    Object.keys(snakeCaseData).forEach(key => (snakeCaseData as any)[key] === undefined && delete (snakeCaseData as any)[key]);

    const { error } = await supabase
        .from('products')
        .update(snakeCaseData)
        .eq('id', productId);
    
    if (error) {
        console.error('Error updating product:', error.message || error);
    }
    return { error };
  }, []);
  
  const deleteProduct = useCallback(async (productToDelete: Product) => {
      const { error: wishlistError } = await supabase.from('wishlist').delete().eq('product_id', productToDelete.id);
      if (wishlistError) {
          console.error('Error deleting product from wishlists:', wishlistError);
          return { error: wishlistError };
      }

      const { error: reviewsError } = await supabase.from('reviews').delete().eq('product_id', productToDelete.id);
      if (reviewsError) {
          console.error('Error deleting product reviews:', reviewsError);
          return { error: reviewsError };
      }

      const { error: returnsError } = await supabase.from('return_requests').delete().eq('product_id', productToDelete.id);
      if (returnsError) {
          console.error('Error deleting product return requests:', returnsError);
          return { error: returnsError };
      }

      const allImageUrls = [productToDelete.image, ...(productToDelete.images || [])].filter(Boolean);
      if (allImageUrls.length > 0) {
          const BUCKET_NAME = 'product-images';
          const filePaths: string[] = [];
          
          allImageUrls.forEach(url => {
              try {
                  const imageUrl = new URL(url);
                  const pathSegments = imageUrl.pathname.split('/');
                  const bucketIndex = pathSegments.indexOf(BUCKET_NAME);
                  if (bucketIndex !== -1) {
                      const filePath = decodeURIComponent(pathSegments.slice(bucketIndex + 1).join('/'));
                      if (filePath) filePaths.push(filePath);
                  }
              } catch (e) {
                  console.error('Error parsing product image URL for deletion:', url, e);
              }
          });

          if (filePaths.length > 0) {
            const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove(filePaths);
            if (storageError) {
                console.error('Error deleting product images from storage:', storageError.message || storageError);
            }
          }
      }

      const { error } = await supabase.from('products').delete().eq('id', productToDelete.id);
      if (error) {
          console.error('Error deleting product record:', error.message || error);
      }
      
      return { error };
  }, []);

  const value = useMemo(() => ({ products, loading, error, addProduct, updateProduct, deleteProduct, refreshProducts, lastRefreshed, fetchAndCacheProducts }), [products, loading, error, addProduct, updateProduct, deleteProduct, refreshProducts, lastRefreshed, fetchAndCacheProducts]);

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};
