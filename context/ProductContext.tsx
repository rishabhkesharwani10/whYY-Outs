import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Product } from '../types.ts';
import { supabase } from '../supabase.ts';

interface ProductContextType {
  products: Product[];
  addProduct: (productData: Omit<Product, 'id' | 'rating' | 'reviewCount'>) => Promise<{ error: any | null }>;
  updateProduct: (productId: string, productData: Partial<Product>) => Promise<{ error: any | null }>;
  deleteProduct: (productId: string) => Promise<{ error: any | null }>;
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
        console.error('Error fetching products:', error);
      } else if (data) {
        setProducts(data.map(mapSupabaseProduct));
      }
    };
    fetchProducts();
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
    } else if (data) {
        setProducts(prev => [mapSupabaseProduct(data), ...prev]);
    }
    return { error };
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
    } else if (data) {
        setProducts(prev => prev.map(p => p.id === productId ? mapSupabaseProduct(data) : p));
    }
    return { error };
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) {
          console.error('Error deleting product:', error);
      } else {
          setProducts(prev => prev.filter(p => p.id !== productId));
      }
      return { error };
  }, []);

  const value = useMemo(() => ({ products, addProduct, updateProduct, deleteProduct }), [products, addProduct, updateProduct, deleteProduct]);

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};