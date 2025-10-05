import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BackButton from '../components/BackButton.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useOrders } from '../hooks/useOrders.ts';
import type { Order } from '../types.ts';

const getStatusClass = (status: Order['status']) => {
  switch (status) {
    case 'Processing': return 'bg-yellow-500/20 text-yellow-400';
    case 'Shipped': return 'bg-blue-500/20 text-blue-400';
    case 'Delivered': return 'bg-green-500/20 text-green-400';
    case 'Cancelled': return 'bg-red-500/20 text-red-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

const OrderRow: React.FC<{ order: Order }> = React.memo(({ order }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-brand-gold/20 rounded-lg">
    <div className="mb-4 sm:mb-0">
      <h2 className="font-bold text-lg text-brand-light">Order #{order.id.split('-')[1]}</h2>
      <p className="text-sm text-brand-light/70">Placed on: {new Date(order.orderDate).toLocaleDateString()}</p>
      <p className="text-sm text-brand-light/70">Total: ₹{order.totalPrice.toFixed(2)}</p>
      {order.shippingTrackingNumber && (
        <p className="text-xs text-brand-light/60 mt-1">
          Tracking #: {order.shippingTrackingNumber}
        </p>
      )}
    </div>
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(order.status)}`}>
        {order.status}
      </span>
      <Link to={`/order/${order.id}`} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase">
          View Details
      </Link>
    </div>
  </div>
));

const OrderHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { orders } = useOrders();
  const userOrders = orders.filter(order => order.userId === user?.id);

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="mb-8">
          <BackButton fallback="/profile" />
        </div>
        <h1 className="font-serif text-4xl text-brand-light mb-2">My Orders</h1>
        <p className="text-brand-light/70 mb-8">View your past orders and their status.</p>

        <div className="bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg shadow-brand-gold/10 p-6">
          {userOrders.length > 0 ? (
            <div className="space-y-6">
              {userOrders.map(order => (
                <OrderRow key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-xl font-semibold text-brand-light">No orders found.</h2>
              <p className="text-brand-light/70 mt-2">You haven't placed any orders with us yet.</p>
              <Link to="/shop" className="mt-8 inline-block font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase">
                Start Shopping
             </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderHistoryPage;