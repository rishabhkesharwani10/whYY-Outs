import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Product } from '../types.ts';
import { supabase } from '../supabase.ts';

interface ProductContextType {
  products: Product[];
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
});

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching products:', error.message);
      } else if (data) {
        setProducts(data.map(mapSupabaseProduct));
      }
    };
    fetchProducts();

    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProducts(prev => [mapSupabaseProduct(payload.new), ...prev]);
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
        name: productData.name,
        description: productData.description,
        price: productData.price,
        original_price: productData.originalPrice,
        image: productData.image,
        images: productData.images,
        category_id: productData.categoryId,
        features: productData.features,
        sizes: productData.sizes,
        seller_id: productData.sellerId,
        rating: 0,
        review_count: 0,
    };
    
    const { data, error } = await supabase.from('products').insert(newProductData).select().single();
    
    if (error) {
        console.error('Error adding product:', error);
        return { data: null, error };
    } 
    
    if (data) {
        const newProduct = mapSupabaseProduct(data);
        return { data: newProduct, error: null };
    }
    
    return { data: null, error: new Error('Unexpected error: No data returned after insert.') };
  }, []);
  
  const updateProduct = useCallback(async (productId: string, productData: Partial<Product>) => {
    const snakeCaseData = {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      original_price: productData.originalPrice,
      category_id: productData.categoryId,
      image: productData.image,
      features: productData.features,
      sizes: productData.sizes,
    };

    const { data, error } = await supabase
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
      // First, delete the associated image from storage to prevent orphaned files
      if (productToDelete && productToDelete.image) {
          try {
              const BUCKET_NAME = 'product-images';
              const imageUrl = new URL(productToDelete.image);
              const pathSegments = imageUrl.pathname.split('/');
              const bucketIndex = pathSegments.indexOf(BUCKET_NAME);

              if (bucketIndex !== -1) {
                  const filePath = decodeURIComponent(pathSegments.slice(bucketIndex + 1).join('/'));
                  if (filePath) {
                      const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
                      if (storageError) {
                          console.error(`Error deleting product image from storage: ${filePath}`, storageError);
                      }
                  }
              }
          } catch (e) {
              console.error('Error parsing or deleting product image:', e);
          }
      }

      // Then, permanently delete the product from the database
      const { error } = await supabase.from('products').delete().eq('id', productToDelete.id);
      if (error) {
          console.error('Error deleting product record:', error);
      }
      return { error };
  }, []);

  const value = useMemo(() => ({ products, addProduct, updateProduct, deleteProduct }), [products, addProduct, updateProduct, deleteProduct]);

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};