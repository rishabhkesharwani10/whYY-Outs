import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { ReturnRequest, ShippingAddress } from '../types.ts';
import { supabase } from '../supabase.ts';
import { useAuth } from './AuthContext.tsx';

interface ReturnContextType {
  returnRequests: ReturnRequest[];
  loading: boolean;
  createReturnRequest: (orderId: string, productId: string, reason: string) => Promise<{ data: ReturnRequest | null; error: any | null }>;
  updateReturnRequestStatus: (requestId: string, status: 'Approved' | 'Rejected', statusReason?: string) => Promise<{ error: any | null }>;
  refreshReturnRequests: () => Promise<void>;
}

export const ReturnContext = createContext<ReturnContextType | undefined>(undefined);

const mapSupabaseReturnRequest = (request: any): Omit<ReturnRequest, 'customerName' | 'customerDetails'> => ({
    id: request.id,
    orderId: request.order_id,
    productId: request.product_id,
    userId: request.user_id,
    reason: request.reason,
    status: request.status,
    statusReason: request.status_reason,
    createdAt: request.created_at,
    productName: request.products?.name,
    productImage: request.products?.image,
});

export const ReturnProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, isAdmin } = useAuth();

    const fetchReturnRequests = useCallback(async () => {
        if (!user) {
            setReturnRequests([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const { data, error } = await supabase
            .from('return_requests')
            .select('*, products(name, image)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching return requests:", error);
            setReturnRequests([]);
        } else if (data && data.length > 0) {
            const userIds = [...new Set(data.map(req => req.user_id))];
            const orderIds = [...new Set(data.map(req => req.order_id))];

            const { data: customersData } = await supabase
                .from('customers')
                .select('id, full_name, phone')
                .in('id', userIds);
            
            const { data: ordersData } = await supabase
                .from('orders')
                .select('id, shipping_address')
                .in('id', orderIds);

            const customerMap = new Map<string, { fullName: string, phone: string }>();
            if (customersData) {
                customersData.forEach(c => customerMap.set(c.id, { fullName: c.full_name, phone: c.phone }));
            }

            const orderMap = new Map<string, { shippingAddress: ShippingAddress }>();
            if (ordersData) {
                ordersData.forEach(o => orderMap.set(o.id, { shippingAddress: o.shipping_address }));
            }

            const enrichedData: ReturnRequest[] = data.map(req => {
                const customer = customerMap.get(req.user_id);
                const order = orderMap.get(req.order_id);
                return {
                    ...mapSupabaseReturnRequest(req),
                    customerName: customer?.fullName || 'N/A',
                    customerDetails: {
                        phone: customer?.phone,
                        shippingAddress: order?.shippingAddress
                    }
                };
            });
            
            setReturnRequests(enrichedData);
        } else {
            setReturnRequests([]);
        }

        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchReturnRequests();
    }, [fetchReturnRequests]);
    
    useEffect(() => {
        if (!user) return;
        const channel = supabase
            .channel('return-requests-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'return_requests' },
                async (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const changedRequest = payload.new;
                        const { data: productData } = await supabase.from('products').select('name, image').eq('id', changedRequest.product_id).single();
                        const { data: customerData } = await supabase.from('customers').select('full_name, phone').eq('id', changedRequest.user_id).single();
                        const { data: orderData } = await supabase.from('orders').select('shipping_address').eq('id', changedRequest.order_id).single();
                        
                        const enrichedRequest: ReturnRequest = {
                            ...mapSupabaseReturnRequest({ ...changedRequest, products: productData }),
                            customerName: customerData?.full_name || 'N/A',
                            customerDetails: { phone: customerData?.phone, shippingAddress: orderData?.shipping_address }
                        };

                        if (payload.eventType === 'INSERT') {
                            setReturnRequests(prev => [enrichedRequest, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                        } else { // UPDATE
                            setReturnRequests(prev => prev.map(r => r.id === enrichedRequest.id ? enrichedRequest : r));
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setReturnRequests(prev => prev.filter(r => r.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const createReturnRequest = useCallback(async (orderId: string, productId: string, reason: string) => {
        if (!user) return { data: null, error: { message: "User not logged in." } };

        const { data, error } = await supabase.from('return_requests').insert({
            order_id: orderId,
            product_id: productId,
            user_id: user.id,
            reason: reason,
            status: 'Pending',
        }).select('*, products(name, image)').single();
        
        if (error) {
            console.error("Error creating return request:", error);
            return { data: null, error };
        }
        
        // The real-time listener will handle the state update.
        return { data: data as any, error: null };
    }, [user]);

    const updateReturnRequestStatus = useCallback(async (requestId: string, status: 'Approved' | 'Rejected', statusReason?: string) => {
        const { error } = await supabase
            .from('return_requests')
            .update({ status, status_reason: statusReason })
            .eq('id', requestId);

        if (error) {
            console.error("Error updating return request status:", error);
        }
        // The real-time listener will handle the state update.
        return { error };
    }, []);

    const value = useMemo(() => ({
        returnRequests,
        loading,
        createReturnRequest,
        updateReturnRequestStatus,
        refreshReturnRequests: fetchReturnRequests,
    }), [returnRequests, loading, createReturnRequest, updateReturnRequestStatus, fetchReturnRequests]);

    return <ReturnContext.Provider value={value}>{children}</ReturnContext.Provider>;
};