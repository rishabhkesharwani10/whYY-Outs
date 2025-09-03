
import React, { useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import SellerLayout from '../../components/SellerLayout.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useProducts } from '../../hooks/useProducts.ts';
import { useOrders } from '../../hooks/useOrders.ts';
import StatCard from '../../components/StatCard.tsx';
import type { Order } from '../../types.ts';

const SellerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { products } = useProducts();
  const { orders } = useOrders();

  const sellerProducts = useMemo(() => products.filter(p => p.sellerId === user?.id), [products, user]);

  const sellerOrders = useMemo(() => {
    if (!user) return [];
    return orders
        .map(order => {
            const sellerItems = order.items.filter(item => item.sellerId === user.id);
            if (sellerItems.length === 0) return null;
            const sellerTotal = sellerItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
            return { ...order, sellerItems, sellerTotal };
        })
        .filter((order): order is Order & { sellerItems: any[], sellerTotal: number } => order !== null);
  }, [orders, user]);

  const totalRevenue = useMemo(() => sellerOrders.reduce((acc, order) => acc + order.sellerTotal, 0), [sellerOrders]);

  const recentOrders = sellerOrders.slice(0, 5);

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
        <h1 className="font-serif text-4xl text-brand-light">Dashboard</h1>
        <p className="text-brand-light/70 mt-1">Welcome back, {user?.fullName?.split(' ')[0]}! Here's an overview of your store.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <StatCard title="Total Revenue" value={totalRevenue.toFixed(2)} prefix="$" icon="wallet" />
          <StatCard title="Total Orders" value={sellerOrders.length.toString()} icon="cart" link="/seller/orders" />
          <StatCard title="Products Listed" value={sellerProducts.length.toString()} icon="category" link="/seller/products" />
        </div>

        <div className="mt-8 bg-black/30 border border-brand-gold/20 rounded-lg p-6">
            <h2 className="font-serif text-2xl text-brand-light mb-4">Recent Orders</h2>
            {recentOrders.length > 0 ? (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="border-b border-brand-gold/20">
                            <tr>
                                <th className="p-3 text-sm font-semibold uppercase tracking-wider">Order ID</th>
                                <th className="p-3 text-sm font-semibold uppercase tracking-wider">Date</th>
                                <th className="p-3 text-sm font-semibold uppercase tracking-wider">Amount</th>
                                <th className="p-3 text-sm font-semibold uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-gold/20">
                            {recentOrders.map(order => (
                                <tr key={order.id}>
                                    <td className="p-3 font-mono text-xs">#{order.id.substring(0,8)}</td>
                                    <td className="p-3 text-sm">{new Date(order.orderDate).toLocaleDateString()}</td>
                                    <td className="p-3 text-sm font-bold text-brand-gold-light">${order.sellerTotal.toFixed(2)}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusClass(order.status)}`}>{order.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center py-8 text-brand-light/70">No orders yet.</p>
            )}
        </div>

      </div>
    </SellerLayout>
  );
};

export default SellerDashboardPage;
