
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Coupon } from '../types.ts';
import { supabase } from '../supabase.ts';

interface CouponContextType {
  coupons: Coupon[];
  loading: boolean;
  error: string | null;
  refreshCoupons: () => Promise<void>;
  addCoupon: (newCouponData: Omit<Coupon, 'id' | 'created_at' | 'usage_count' | 'is_active'>) => Promise<{ error: any | null }>;
  toggleCouponActive: (coupon: Coupon) => Promise<{ error: any | null }>;
  deleteCoupon: (couponId: string) => Promise<{ error: any | null }>;
}

export const CouponContext = createContext<CouponContextType | undefined>(undefined);

export const CouponProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: couponsData, error: couponsError } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });
            if (couponsError) throw couponsError;

            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('coupon_code')
                .not('coupon_code', 'is', null);
            if (ordersError) throw ordersError;

            const usageCounts = ordersData.reduce((acc, order) => {
                if (order.coupon_code) {
                    acc[order.coupon_code] = (acc[order.coupon_code] || 0) + 1;
                }
                return acc;
            }, {} as { [key: string]: number });

            const enrichedCoupons = couponsData.map(coupon => ({
                ...coupon,
                usage_count: usageCounts[coupon.code] || 0,
            }));
            
            setCoupons(enrichedCoupons as Coupon[]);

        } catch (err: any) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const addCoupon = useCallback(async (newCouponData: Omit<Coupon, 'id' | 'created_at' | 'usage_count' | 'is_active'>) => {
        const { error } = await supabase.from('coupons').insert({
            code: newCouponData.code.toUpperCase(),
            type: newCouponData.type,
            value: newCouponData.value,
            min_order_value: newCouponData.min_order_value || null,
            expiry_date: newCouponData.expiry_date || null,
            is_active: true,
        });

        if (!error) {
            await fetchCoupons();
        }
        return { error };
    }, [fetchCoupons]);
    
    const toggleCouponActive = useCallback(async (coupon: Coupon) => {
        const { error } = await supabase
            .from('coupons')
            .update({ is_active: !coupon.is_active })
            .eq('id', coupon.id);
        
        if (!error) {
            await fetchCoupons();
        }
        return { error };
    }, [fetchCoupons]);

    const deleteCoupon = useCallback(async (couponId: string) => {
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', couponId);
        
        if (!error) {
            await fetchCoupons();
        }
        return { error };
    }, [fetchCoupons]);

    const value = useMemo(() => ({
        coupons,
        loading,
        error,
        refreshCoupons: fetchCoupons,
        addCoupon,
        toggleCouponActive,
        deleteCoupon,
    }), [coupons, loading, error, fetchCoupons, addCoupon, toggleCouponActive, deleteCoupon]);

    return <CouponContext.Provider value={value}>{children}</CouponContext.Provider>;
};
