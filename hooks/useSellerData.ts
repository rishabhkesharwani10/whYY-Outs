import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useProducts } from './useProducts.ts';
import { useOrders } from './useOrders.ts';
import type { Order, Product, OrderItem } from '../types.ts';

interface SellerOrder extends Order {
    sellerItems: OrderItem[];
    sellerTotal: number;
}

export const useSellerData = () => {
    const { user } = useAuth();
    const { products } = useProducts();
    const { orders } = useOrders();

    const sellerProducts = useMemo((): Product[] => {
        if (!user) return [];
        return products.filter(p => p.sellerId === user.id);
    }, [products, user]);

    const sellerOrders = useMemo((): SellerOrder[] => {
        if (!user) return [];
        return orders
            .map(order => {
                const sellerItems = order.items.filter(item => item.sellerId === user.id);
                if (sellerItems.length === 0) {
                    return null;
                }
                const sellerSubtotal = sellerItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
                
                let sellerPortionOfDiscount = 0;
                // Prorate the discount if one was applied and the subtotal is not zero
                if (order.couponDiscount && order.subtotal > 0) {
                    const sellerContributionRatio = sellerSubtotal / order.subtotal;
                    sellerPortionOfDiscount = order.couponDiscount * sellerContributionRatio;
                }

                const sellerTotal = sellerSubtotal - sellerPortionOfDiscount;

                return { ...order, sellerItems, sellerTotal };
            })
            .filter((order): order is SellerOrder => order !== null);
    }, [orders, user]);

    const totalRevenue = useMemo((): number => {
        return sellerOrders
            .filter(order => order.status === 'Delivered')
            .reduce((acc, order) => acc + order.sellerTotal, 0);
    }, [sellerOrders]);

    return {
        sellerProducts,
        sellerOrders,
        totalRevenue,
    };
};
