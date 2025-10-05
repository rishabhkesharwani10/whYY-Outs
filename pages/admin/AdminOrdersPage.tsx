import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout.tsx';
import { useOrders } from '../../hooks/useOrders.ts';
import BackButton from '../../components/BackButton.tsx';
import type { Order } from '../../types.ts';

const getStatusClass = (status: Order['status']) => {
    switch (status) {
      case 'Processing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'Shipped': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'Delivered': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Cancelled': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
};

const OrderTableRow = React.memo(({ order, onStatusChange, isUpdating }: { order: Order; onStatusChange: (orderId: string, status: Order['status']) => void; isUpdating: boolean }) => {
    return (
        <tr className="hover:bg-brand-gold/5">
            <td className="p-4 font-mono text-xs">#{order.id.substring(0, 8)}</td>
            <td className="p-4 font-semibold">{order.shippingAddress.fullName}</td>
            <td className="p-4">{new Date(order.orderDate).toLocaleDateString()}</td>
            <td className="p-4">₹{order.totalPrice.toFixed(2)}</td>
            <td className="p-4">
                <select
                    value={order.status}
                    onChange={(e) => onStatusChange(order.id, e.target.value as Order['status'])}
                    disabled={isUpdating || order.status === 'Delivered' || order.status === 'Cancelled'}
                    className={`w-32 text-xs font-semibold rounded-md border py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-brand-gold transition-colors ${getStatusClass(order.status)} disabled:opacity-70 disabled:cursor-not-allowed`}
                    style={{ backgroundColor: 'transparent' }}
                >
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </td>
            <td className="p-4 text-right">
                <Link to={`/order/${order.id}`} className="text-sm font-semibold text-brand-gold hover:underline">View</Link>
            </td>
        </tr>
    );
});

const AdminOrdersPage: React.FC = () => {
    const { orders, updateOrderStatus } = useOrders();
    const [updatingStatus, setUpdatingStatus] = useState<{ [orderId: string]: boolean }>({});

    const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
        setUpdatingStatus(prev => ({...prev, [orderId]: true}));
        await updateOrderStatus(orderId, newStatus);
        // The real-time listener in OrderContext handles the state update.
        setUpdatingStatus(prev => ({...prev, [orderId]: false}));
    };
    
    return (
        <AdminLayout>
            <div className="page-fade-in">
                <div className="mb-6">
                    <BackButton fallback="/admin" />
                </div>
                <h1 className="font-serif text-4xl text-brand-light">Manage Orders</h1>
                <p className="text-brand-light/70 mt-1">Viewing all {orders.length} orders placed on the platform.</p>
                
                 <div className="bg-black/30 border border-brand-gold/20 rounded-lg overflow-x-auto mt-6">
                    <table className="w-full text-left min-w-[720px]">
                        <thead className="bg-black/50 border-b border-brand-gold/20">
                            <tr>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Order ID</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Customer</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Date</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Total</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Status</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-gold/20">
                            {orders.map(order => (
                                <OrderTableRow
                                    key={order.id}
                                    order={order}
                                    onStatusChange={handleStatusChange}
                                    isUpdating={!!updatingStatus[order.id]}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminOrdersPage;