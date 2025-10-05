import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SellerLayout from '../components/SellerLayout.tsx';
import { useSellerData } from '../hooks/useSellerData.ts';
import BackButton from '../components/BackButton.tsx';
import type { Order } from '../types.ts';
import { useOrders } from '../hooks/useOrders.ts';

const SellerOrdersPage: React.FC = () => {
    const { sellerOrders } = useSellerData();
    const { updateOrderStatus } = useOrders();
    const [updatingStatus, setUpdatingStatus] = useState<{ [orderId: string]: boolean }>({});

    const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
        setUpdatingStatus(prev => ({...prev, [orderId]: true}));
        await updateOrderStatus(orderId, newStatus);
        setUpdatingStatus(prev => ({...prev, [orderId]: false}));
    };

    const getStatusClass = (status: Order['status']) => {
        switch (status) {
          case 'Processing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
          case 'Shipped': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
          case 'Delivered': return 'bg-green-500/20 text-green-400 border-green-500/50';
          case 'Cancelled': return 'bg-red-500/20 text-red-400 border-red-500/50';
          default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
        }
    };
    
    return (
        <SellerLayout>
            <div className="page-fade-in">
                <div className="mb-6">
                    <BackButton fallback="/seller-dashboard" />
                </div>
                <h1 className="font-serif text-4xl text-brand-light">My Orders</h1>
                <p className="text-brand-light/70 mt-1">Viewing all {sellerOrders.length} orders containing your products.</p>
                
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
                                    <td className="p-4 font-bold text-brand-gold-light">₹{order.sellerTotal.toFixed(2)}</td>
                                    <td className="p-4">
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                                            disabled={updatingStatus[order.id] || order.status !== 'Processing'}
                                            className={`w-32 text-xs font-semibold rounded-md border py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-brand-gold transition-colors ${getStatusClass(order.status)} disabled:opacity-70 disabled:cursor-not-allowed`}
                                            style={{ backgroundColor: 'transparent' }}
                                        >
                                            <option value="Processing">Processing</option>
                                            <option value="Shipped">Shipped</option>
                                            {/* To ensure the select shows the correct value if it's in a state the seller can't set */}
                                            {order.status === 'Delivered' && <option value="Delivered">Delivered</option>}
                                            {order.status === 'Cancelled' && <option value="Cancelled">Cancelled</option>}
                                        </select>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link to={`/order/${order.id}`} className="text-sm font-semibold text-brand-gold hover:underline">View</Link>
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