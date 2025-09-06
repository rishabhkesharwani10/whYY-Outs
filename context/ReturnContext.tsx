
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { ReturnRequest } from '../types.ts';
import { supabase } from '../supabase.ts';
import { useAuth } from './AuthContext.tsx';

interface ReturnContextType {
  returnRequests: ReturnRequest[];
  loading: boolean;
  createReturnRequest: (orderId: string, productId: string, reason: string) => Promise<{ error: any | null }>;
  updateReturnRequestStatus: (requestId: string, status: 'Approved' | 'Rejected', statusReason?: string) => Promise<{ error: any | null }>;
}

export const ReturnContext = createContext<ReturnContextType | undefined>(undefined);

const mapSupabaseReturnRequest = (request: any): Omit<ReturnRequest, 'customerName'> => ({
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

        // Step 1: Fetch requests and join with products. This join is valid.
        const { data, error } = await supabase
            .from('return_requests')
            .select('*, products(name, image)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching return requests:", error);
            setReturnRequests([]);
        } else if (data && data.length > 0) {
            // Step 2: Get unique user IDs from the results
            const userIds = [...new Set(data.map(req => req.user_id))];

            // Step 3: Fetch customer profiles for these IDs separately
            const { data: customersData, error: customersError } = await supabase
                .from('customers')
                .select('id, full_name')
                .in('id', userIds);

            if (customersError) {
                console.error("Error fetching customer names for returns:", customersError);
            }

            // Step 4: Create a map for easy lookup
            const customerNameMap = new Map<string, string>();
            if (customersData) {
                customersData.forEach(c => c.full_name && customerNameMap.set(c.id, c.full_name));
            }

            // Step 5: Merge names into the return requests
            const enrichedData = data.map(req => ({
                ...mapSupabaseReturnRequest(req),
                customerName: customerNameMap.get(req.user_id) || 'N/A'
            }));
            
            setReturnRequests(enrichedData);
        } else {
            setReturnRequests([]);
        }

        setLoading(false);
    }, [user, isAdmin]);

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
                () => {
                    fetchReturnRequests(); // Refetch on any change.
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchReturnRequests]);

    const createReturnRequest = useCallback(async (orderId: string, productId: string, reason: string) => {
        if (!user) return { error: { message: "User not logged in." } };

        const { error } = await supabase.from('return_requests').insert({
            order_id: orderId,
            product_id: productId,
            user_id: user.id,
            reason: reason,
            status: 'Pending',
        });
        
        if (error) {
            console.error("Error creating return request:", error);
        }

        return { error };
    }, [user]);

    const updateReturnRequestStatus = useCallback(async (requestId: string, status: 'Approved' | 'Rejected', statusReason?: string) => {
        const { error } = await supabase
            .from('return_requests')
            .update({ status, status_reason: statusReason })
            .eq('id', requestId);

        if (error) {
            console.error("Error updating return request status:", error);
        }

        return { error };
    }, []);

    const value = useMemo(() => ({
        returnRequests,
        loading,
        createReturnRequest,
        updateReturnRequestStatus,
    }), [returnRequests, loading, createReturnRequest, updateReturnRequestStatus]);

    return <ReturnContext.Provider value={value}>{children}</ReturnContext.Provider>;
};
