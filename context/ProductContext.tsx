import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Product } from '../types.ts';
import { supabase } from '../supabase.ts';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  addProduct: (productData: Omit<Product, 'id' | 'rating' | 'reviewCount'>) => Promise<{ data: Product | null; error: any | null }>;
  updateProduct: (productId: string, productData: Partial<Product>) => Promise<{ error: any | null }>;
  deleteProduct: (product: Product) => Promise<{ error: any | null }>;
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
  warrantyDetails: product.warranty_details,
});

const mapAppProductToSupabase = (productData: Partial<Product>) => {
  const supabaseData: { [key: string]: any } = {};
  for (const key in productData) {
    const snakeCaseKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    supabaseData[snakeCaseKey] = (productData as any)[key];
  }
  return supabaseData;
};

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching products:', error.message);
      } else if (data) {
        setProducts(data.map(mapSupabaseProduct));
      }
      setLoading(false);
    };
    fetchProducts();

    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newProduct = mapSupabaseProduct(payload.new);
            // Add to local state optimistically, but prevent duplicates if it already exists
            setProducts(prev => prev.find(p => p.id === newProduct.id) ? prev : [newProduct, ...prev]);
          }
          if (payload.eventType === 'UPDATE') {
            setProducts(prev => prev.map(p => p.id === payload.new.id ? mapSupabaseProduct(payload.new) : p));
          }
          if (payload.eventType === 'DELETE') {
            setProducts(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'rating' | 'reviewCount'>) => {
    const newProductData = {
      ...mapAppProductToSupabase(productData),
      rating: 0,
      review_count: 0,
    };
    
    const { data, error } = await supabase.from('products').insert(newProductData).select().single();
    
    if (error) {
        console.error('Error adding product:', error.message);
        return { data: null, error };
    } 
    
    if (data) {
        const newProduct = mapSupabaseProduct(data);
        // Optimistic update to provide instant feedback to the user who added it
        setProducts(prev => [newProduct, ...prev]);
        return { data: newProduct, error: null };
    }
    
    return { data: null, error: new Error('Unexpected error: No data returned after insert.') };
  }, []);
  
  const updateProduct = useCallback(async (productId: string, productData: Partial<Product>) => {
    const snakeCaseData = mapAppProductToSupabase(productData);

    // Remove undefined keys so they don't overwrite existing data in Supabase with null
    Object.keys(snakeCaseData).forEach(key => (snakeCaseData as any)[key] === undefined && delete (snakeCaseData as any)[key]);

    const { error } = await supabase
        .from('products')
        .update(snakeCaseData)
        .eq('id', productId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating product:', error);
    }
    return { error };
  }, []);
  
  const deleteProduct = useCallback(async (productToDelete: Product) => {
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
                // Log but don't block deletion of the record
                console.error(`Error deleting product images from storage`, storageError);
            }
          }
      }

      // Then, permanently delete the product from the database
      const { error } = await supabase.from('products').delete().eq('id', productToDelete.id);
      if (error) {
          console.error('Error deleting product record:', error);
      }
      return { error };
  }, []);

  const value = useMemo(() => ({ products, loading, addProduct, updateProduct, deleteProduct }), [products, loading, addProduct, updateProduct, deleteProduct]);

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};