
import React, { useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import SellerLayout from '../../components/SellerLayout.tsx';
import { useOrders } from '../../hooks/useOrders.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Order } from '../../types.ts';

const SellerOrdersPage: React.FC = () => {
    const { orders } = useOrders();
    const { user } = useAuth();

    const sellerOrders = useMemo(() => {
        if (!user) return [];
        return orders
            .map(order => {
                const sellerItems = order.items.filter(item => item.sellerId === user.id);
                if (sellerItems.length === 0) {
                    return null;
                }
                const sellerTotal = sellerItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
                return { ...order, sellerItems, sellerTotal };
            })
            .filter((order): order is Order & { sellerItems: any[], sellerTotal: number } => order !== null);
    }, [orders, user]);

    const getStatusClass = (status: 'Processing' | 'Shipped' | 'Delivered') => {
        switch (status) {
          case 'Processing': return 'bg-yellow-500/20 text-yellow-400';
          case 'Shipped': return 'bg-blue-500/20 text-blue-400';
          case 'Delivered': return 'bg-green-500/20 text-green-400';
          default: return 'bg-gray-500/20 text-gray-400';
        }
    };
    
    return (
        <SellerLayout>
            <div className="page-fade-in">
                <h1 className="font-serif text-4xl text-brand-light">My Orders</h1>
                <p className="text-brand-light/70 mt-1">Viewing all orders containing your products.</p>
                
                <div className="bg-black/30 border border-brand-gold/20 rounded-lg overflow-x-auto mt-6">
                    <table className="w-full text-left min-w-[720px]">
                        <thead className="bg-black/50 border-b border-brand-gold/20">
                            <tr>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Order ID</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Customer</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Date</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">My Revenue</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Status</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-gold/20">
                            {sellerOrders.map(order => (
                                <tr key={order.id} className="hover:bg-brand-gold/5">
                                    <td className="p-4 font-mono text-xs">#{order.id.substring(0, 8)}</td>
                                    <td className="p-4 font-semibold">{order.shippingAddress.fullName}</td>
                                    <td className="p-4">{new Date(order.orderDate).toLocaleDateString()}</td>
                                    <td className="p-4 font-bold text-brand-gold-light">${order.sellerTotal.toFixed(2)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusClass(order.status)}`}>{order.status}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <ReactRouterDOM.Link to={`/order/${order.id}`} className="text-sm font-semibold text-brand-gold hover:underline">View</ReactRouterDOM.Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {sellerOrders.length === 0 && (
                        <div className="text-center py-16">
                            <h3 className="text-xl font-semibold text-brand-light">No orders found.</h3>
                            <p className="text-brand-light/70 mt-2">When a customer purchases one of your products, the order will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </SellerLayout>
    );
};

export default SellerOrdersPage;
