import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useProducts } from './useProducts.ts';
import { useOrders } from './useOrders.ts';
import type { Order, Product, OrderItem } from '../types.ts';
import { useReturns } from './useReturns.ts';

interface SellerOrder extends Order {
    sellerItems: OrderItem[];
    sellerTotal: number;
}

export const useSellerData = () => {
    const { user } = useAuth();
    const { products } = useProducts();
    const { orders } = useOrders();
    const { returnRequests } = useReturns();

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
        // Step 1: Identify orders where revenue can be recognized.
        const recognizableOrders = sellerOrders
            .filter(order => {
                const isCod = order.paymentMethod === 'Cash on Delivery' || order.paymentMethod === 'cod';
                const isPrepaid = order.paymentMethod === 'Razorpay' || order.paymentMethod === 'razorpay';

                if (isCod) {
                    // For COD, revenue is recognized ONLY upon delivery.
                    return order.status === 'Delivered';
                }
                if (isPrepaid) {
                    // For prepaid, revenue is recognized as soon as it's processed and not cancelled.
                    return order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Delivered';
                }
                return false;
            });
        
        const recognizableOrderIds = new Set(recognizableOrders.map(o => o.id));
        
        // Step 2: Calculate gross revenue from these recognizable orders.
        const grossRevenue = recognizableOrders.reduce((acc, order) => acc + order.sellerTotal, 0);

        // Step 3: Find all approved return requests for this seller's products.
        const sellerProductIds = new Set(sellerProducts.map(p => p.id));
        const approvedReturns = returnRequests.filter(req => 
            req.status === 'Approved' && sellerProductIds.has(req.productId)
        );

        // Step 4: Calculate total deductions from returns, but ONLY for recognizable orders.
        const totalDeductions = approvedReturns.reduce((deductionSum, ret) => {
            // FIX: Only deduct if the return belongs to an order whose revenue was already recognized.
            if (!recognizableOrderIds.has(ret.orderId)) {
                return deductionSum;
            }

            const originalOrder = orders.find(o => o.id === ret.orderId);
            if (!originalOrder) return deductionSum;
            
            const returnedItem = originalOrder.items.find(i => i.productId === ret.productId);
            if (!returnedItem) return deductionSum;
            
            const returnedValue = returnedItem.price * returnedItem.quantity;

            let itemDeduction = returnedValue;
            if (originalOrder.couponDiscount && originalOrder.subtotal > 0) {
                const itemContributionRatio = returnedValue / originalOrder.subtotal;
                const portionOfDiscount = originalOrder.couponDiscount * itemContributionRatio;
                itemDeduction -= portionOfDiscount;
            }
            
            return deductionSum + itemDeduction;
        }, 0);

        // Step 5: Calculate net revenue.
        return grossRevenue - totalDeductions;
    }, [sellerOrders, sellerProducts, returnRequests, orders]);


    return {
        sellerProducts,
        sellerOrders,
        totalRevenue,
    };
};