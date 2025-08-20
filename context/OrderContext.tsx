import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Order } from '../types.ts';
import { supabase } from '../supabase.ts';
import { useAuth } from './AuthContext.tsx';

interface OrderContextType {
  orders: Order[];
  addOrder: (orderData: Omit<Order, 'id'>) => Promise<{ error: any | null }>;
}

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Helper to map Supabase order (snake_case) to our app's Order type (camelCase)
const mapSupabaseOrder = (order: any): Order => ({
    id: order.id,
    userId: order.user_id,
    items: order.items,
    totalPrice: order.total_price,
    orderDate: order.order_date,
    status: order.status,
    shippingAddress: order.shipping_address,
    trackingNumber: order.tracking_number,
});


export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      if (user) {
        const isAdmin = user.email === 'whyyouts@gmail.com';
        let query = supabase.from('orders').select('*');
        
        // If user is not admin, only fetch their own orders.
        if (!isAdmin) {
          query = query.eq('user_id', user.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error fetching orders:', error);
        } else if (data) {
            setOrders(data.map(mapSupabaseOrder));
        }
      } else {
        setOrders([]); // Clear orders on logout
      }
    };

    fetchOrders();
  }, [user]);

  const addOrder = useCallback(async (orderData: Omit<Order, 'id'>) => {
    // Map to snake_case for Supabase insert
    const newOrderData = {
        user_id: orderData.userId,
        items: orderData.items,
        total_price: orderData.totalPrice,
        order_date: orderData.orderDate,
        status: orderData.status,
        shipping_address: orderData.shippingAddress,
        tracking_number: orderData.trackingNumber,
    };
    
    const { data, error } = await supabase.from('orders').insert(newOrderData).select().single();

    if (error) {
        console.error('Error adding order:', error);
    } else if (data) {
        setOrders(prevOrders => [mapSupabaseOrder(data), ...prevOrders]);
    }
    
    return { error };
  }, []);

  const value = useMemo(() => ({ orders, addOrder }), [orders, addOrder]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};