import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Order, OrderItem } from '../types.ts';
import { supabase } from '../supabase.ts';
import { useAuth } from './AuthContext.tsx';

interface OrderContextType {
  orders: Order[];
  loading: boolean;
  addOrder: (orderData: Omit<Order, 'id'>) => Promise<{ data: Order | null; error: any | null }>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<{ error: any | null }>;
  refreshOrders: () => Promise<void>;
}

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

const ORDERS_CACHE_KEY = 'whyyouts_orders_cache';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

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
  deliveryDate: order.delivery_date,
  status: order.status,
  shippingAddress: order.shipping_address,
  shippingTrackingNumber: order.shipping_tracking_number,
  paymentId: order.payment_id,
  paymentMethod: order.payment_method,
  couponCode: order.coupon_code,
  couponDiscount: order.coupon_discount,
});

// Assumed to exist on the backend for secure notification creation
const createNotification = async (userId: string, orderId: string, message: string) => {
    try {
        const { error } = await supabase.rpc('create_notification', {
            target_user_id: userId,
            order_id_param: orderId,
            message_param: message,
        });
        if (error) throw error;
    } catch (err) {
        console.error(`Failed to create notification for user ${userId}:`, err);
    }
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    
    let query = supabase.from('orders').select('*');

    if (user.role === 'customer') {
        query = query.eq('user_id', user.id);
    }
    // For admins and sellers, we fetch all and filter client-side for sellers.
    // This is a compromise for performance without a dedicated DB function.
    
    const { data, error } = await query.order('order_date', { ascending: false });

    if (error) {
        console.error("Error fetching orders:", error.message || error);
    } else if (data) {
        let fetchedOrders = data.map(mapSupabaseOrder);
        
        // If the user is a seller, filter down to only their orders to reduce memory footprint.
        if (user.role === 'seller') {
            fetchedOrders = fetchedOrders.filter(order =>
                order.items.some(item => item.sellerId === user.id)
            );
        }
        
        setOrders(fetchedOrders);
        sessionStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            userId: user.id,
            orders: fetchedOrders
        }));
    }
    setLoading(false);
  }, [user]);
  
  useEffect(() => {
    if (!user) {
        setOrders([]);
        setLoading(false);
        return;
    }

    let isSubscribed = true;

    const loadInitialOrders = async () => {
        try {
            const cachedData = sessionStorage.getItem(ORDERS_CACHE_KEY);
            if(cachedData) {
                const { timestamp, userId, orders: cachedOrders } = JSON.parse(cachedData);
                const isCacheValid = (Date.now() - timestamp) < CACHE_DURATION_MS;
                if (isCacheValid && userId === user.id && cachedOrders) {
                    setOrders(cachedOrders);
                    setLoading(false); // Render instantly from cache
                    await fetchOrders(); // Fetch in background
                    return;
                }
            }
        } catch (e) {
            console.error("Failed to read order cache", e);
        }

        setLoading(true);
        await fetchOrders();
    };

    loadInitialOrders();

    const channel = supabase
        .channel('orders-realtime')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            (payload) => {
                 // A simple and robust way to handle real-time updates is to just re-fetch the data.
                 // This avoids complex client-side logic for filtering seller/customer orders.
                if (isSubscribed) {
                    fetchOrders();
                }
            }
        )
        .subscribe();

    return () => {
        isSubscribed = false;
        supabase.removeChannel(channel);
    };
  }, [user, fetchOrders]);


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

    // If a customer is cancelling, use the secure RPC function.
    if (status === 'Cancelled' && user && user.role !== 'admin' && originalOrder?.userId === user.id) {
        const { error } = await supabase.rpc('cancel_customer_order', { order_id_to_cancel: orderId });
        
        if (error) {
            console.error('Error cancelling order via RPC:', error.message || error);
            return { error };
        }
        
        // Send a notification to the customer confirming the cancellation.
        try {
            await supabase.from('notifications').insert({
                user_id: user.id,
                order_id: orderId,
                message: `Your order #${orderId.substring(0, 8)} has been successfully cancelled.`
            });
        } catch (notificationError: any) {
            console.error('Failed to create cancellation notification for customer:', notificationError.message || notificationError);
            // Don't block the main flow for a notification failure.
        }

        // Optimistically update UI for instant feedback. The real-time listener will confirm this state.
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o));

    } else {
        // For other status updates (by seller/admin), use the direct update method.
        const updatePayload: { status: Order['status'], delivery_date?: string } = { status };
        if (status === 'Delivered') {
            updatePayload.delivery_date = new Date().toISOString();
        }
        const { error } = await supabase
            .from('orders')
            .update(updatePayload)
            .eq('id', orderId);

        if (error) {
            console.error('Error updating order status:', error.message || error);
            return { error };
        }
    }

    // Handle notifications for state changes initiated by admins/sellers (e.g., notifying customer of shipment).
    if (originalOrder && (status === 'Shipped' || status === 'Delivered')) {
        const message = `Your order #${orderId.substring(0, 8)} has been ${status.toLowerCase()}.`;
        await createNotification(originalOrder.userId, orderId, message);
    }

    return { error: null };
  }, [orders, user]);

  const value = useMemo(() => ({
    orders, loading, addOrder, updateOrderStatus, refreshOrders: fetchOrders
  }), [orders, loading, addOrder, updateOrderStatus, fetchOrders]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};
