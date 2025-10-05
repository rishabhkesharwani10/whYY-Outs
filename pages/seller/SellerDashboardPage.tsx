import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import SellerLayout from '../../components/SellerLayout.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import StatCard from '../../components/StatCard.tsx';
import { useSellerData } from '../../hooks/useSellerData.ts';
import type { Order } from '../../types.ts';

const SellerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { sellerProducts, sellerOrders, totalRevenue } = useSellerData();

  const recentOrders = useMemo(() => sellerOrders.slice(0, 5), [sellerOrders]);

  const getStatusClass = (status: Order['status']) => {
    switch (status) {
      case 'Processing': return 'bg-yellow-500/20 text-yellow-400';
      case 'Shipped': return 'bg-blue-500/20 text-blue-400';
      case 'Delivered': return 'bg-green-500/20 text-green-400';
      case 'Cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <SellerLayout>
      <div className="page-fade-in">
        <h1 className="font-serif text-4xl text-brand-light">Dashboard</h1>
        <p className="text-brand-light/70 mt-1">Welcome back, {user?.fullName?.split(' ')[0]}! Here's an overview of your store.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <StatCard title="Total Revenue" value={totalRevenue.toFixed(2)} prefix="₹" icon="wallet" link="/seller/payouts" />
          <StatCard title="Total Orders" value={sellerOrders.length.toString()} icon="cart" link="/seller/orders" />
          <StatCard title="Products Listed" value={sellerProducts.length.toString()} icon="category" link="/seller/products" />
        </div>

        <div className="mt-8 bg-black/30 border border-brand-gold/20 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-serif text-2xl text-brand-light">Recent Orders</h2>
                <Link to="/seller/orders" className="text-sm text-brand-gold hover:underline">View All</Link>
            </div>
            {sellerOrders.length > 0 ? (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="border-b border-brand-gold/20">
                            <tr>
                                <th className="p-3 text-sm font-semibold uppercase tracking-wider">Order ID</th>
                                <th className="p-3 text-sm font-semibold uppercase tracking-wider">Date</th>
                                <th className="p-3 text-sm font-semibold uppercase tracking-wider">My Revenue</th>
                                <th className="p-3 text-sm font-semibold uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-gold/20">
                            {recentOrders.map(order => (
                                <tr key={order.id}>
                                    <td className="p-3 font-mono text-xs">#{order.id.substring(0,8)}</td>
                                    <td className="p-3 text-sm">{new Date(order.orderDate).toLocaleDateString()}</td>
                                    <td className="p-3 text-sm font-bold text-brand-gold-light">₹{order.sellerTotal.toFixed(2)}</td>
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