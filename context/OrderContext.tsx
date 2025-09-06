import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Order, OrderItem } from '../types.ts';
import { supabase } from '../supabase.ts';
import { useAuth } from './AuthContext.tsx';

interface OrderContextType {
  orders: Order[];
  loading: boolean;
  addOrder: (orderData: Omit<Order, 'id'>) => Promise<{ data: Order | null; error: any | null }>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<{ error: any | null }>;
}

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

const mapSupabaseOrder = (order: any): Order => ({
  id: order.id,
  userId: order.user_id,
  items: order.items,
  subtotal: order.subtotal,
  gst: order.gst,
  platformFee: order.platform_fee,
  shippingFee: order.shipping_fee,
  totalPrice: order.total_price,
  orderDate: order.order_date,
  status: order.status,
  shippingAddress: order.shipping_address,
  shippingTrackingNumber: order.shipping_tracking_number,
  paymentId: order.payment_id,
  paymentMethod: order.payment_method,
  couponCode: order.coupon_code,
  couponDiscount: order.coupon_discount,
});

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  
  useEffect(() => {
    if (!user) {
        setOrders([]);
        setLoading(false);
        return;
    }

    setLoading(true);
    let isSubscribed = true;

    const channel = supabase
        .channel('orders-realtime')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            (payload) => {
                if (!isSubscribed) return;

                if (payload.eventType === 'UPDATE') {
                    const updatedOrder = mapSupabaseOrder(payload.new);
                    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
                } else if (payload.eventType === 'INSERT') {
                    const newOrder = mapSupabaseOrder(payload.new);
                    setOrders(prev => {
                        if (prev.some(o => o.id === newOrder.id)) return prev;
                        return [newOrder, ...prev].sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
                    });
                }
            }
        )
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED' && isSubscribed) {
                const { data, error } = await supabase.from('orders')
                  .select('*')
                  .order('order_date', { ascending: false });

                if (error) {
                    console.error("Error fetching initial orders:", error.message);
                } else if (data) {
                    const fetchedOrders = data.map(mapSupabaseOrder);
                     setOrders(currentOrders => {
                        const orderMap = new Map(currentOrders.map(o => [o.id, o]));
                        fetchedOrders.forEach(o => orderMap.set(o.id, o));
                        return Array.from(orderMap.values()).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
                    });
                }
                setLoading(false);
            }
        });

    return () => {
        isSubscribed = false;
        supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);


  const addOrder = useCallback(async (orderData: Omit<Order, 'id'>) => {
    const { data, error } = await supabase.from('orders').insert({
        user_id: orderData.userId, items: orderData.items, subtotal: orderData.subtotal, gst: orderData.gst,
        platform_fee: orderData.platformFee, shipping_fee: orderData.shippingFee, total_price: orderData.totalPrice,
        order_date: orderData.orderDate, status: orderData.status, shipping_address: orderData.shippingAddress,
        shipping_tracking_number: orderData.shippingTrackingNumber, payment_id: orderData.paymentId,
        payment_method: orderData.paymentMethod, coupon_code: orderData.couponCode, coupon_discount: orderData.couponDiscount,
    }).select().single();

    if (data) {
        const newOrder = mapSupabaseOrder(data);
        setOrders(prev => [newOrder, ...prev]); 
        return { data: newOrder, error: null };
    }
    
    return { data: null, error };
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    const originalOrder = orders.find(o => o.id === orderId);

    // If a customer is cancelling, use the secure RPC function which now handles notifications.
    if (status === 'Cancelled' && user && !isAdmin && originalOrder?.userId === user.id) {
        const { error } = await supabase.rpc('cancel_customer_order', { order_id_to_cancel: orderId });
        
        if (error) {
            console.error('Error cancelling order via RPC:', error);
            return { error };
        }
    } else {
        // For other status updates (by seller/admin), use the direct update method.
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId);

        if (error) {
            console.error('Error updating order status:', error);
            return { error };
        }
    }

    // Handle notifications for state changes initiated by admins/sellers (e.g., notifying customer of shipment).
    // The RPC function now handles notifications for customer-initiated cancellations.
    if (originalOrder) {
        try {
            if (status === 'Shipped' || status === 'Delivered') {
              await supabase.from('notifications').insert({ user_id: originalOrder.userId, order_id: orderId, message: `Your order #${orderId.substring(0, 8)} has been ${status.toLowerCase()}.` });
            }
        } catch (notificationError) {
          console.error('Failed to create notification after status update:', notificationError);
        }
    }

    return { error: null };
  }, [orders, user, isAdmin]);

  const value = useMemo(() => ({
    orders, loading, addOrder, updateOrderStatus
  }), [orders, loading, addOrder, updateOrderStatus]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};