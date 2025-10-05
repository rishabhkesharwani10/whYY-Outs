import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import Header from './Header.tsx';
import { useProducts } from '../hooks/useProducts.ts';
import { useOrders } from '../hooks/useOrders.ts';
import { useReturns } from '../hooks/useReturns.ts';

const SellerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuth();
  const { refreshProducts } = useProducts();
  const { refreshOrders } = useOrders();
  const { refreshReturnRequests } = useReturns();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMessage('');
    try {
      await Promise.all([
        refreshProducts(),
        refreshOrders(),
        refreshReturnRequests(),
      ]);
      setRefreshMessage('Data refreshed!');
    } catch (e) {
      console.error("Failed to refresh seller data", e);
      setRefreshMessage('Refresh failed.');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setRefreshMessage(''), 2000);
    }
  };

  const NavLink: React.FC<{ to: string, icon: any, label: string }> = ({ to, icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);
    return (
      <Link to={to} className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${isActive ? 'bg-brand-gold/10 text-brand-gold' : 'text-brand-light/70 hover:bg-brand-light/5 hover:text-white'}`}>
        <Icon name={icon} className="w-5 h-5" />
        <span className="font-semibold">{label}</span>
      </Link>
    );
  };
  
  return (
    <>
      <Header showSearch={false} onMenuClick={() => setIsSidebarOpen(prev => !prev)} />
      <div className="bg-brand-dark text-brand-light min-h-screen flex font-sans pt-[72px]">
        {isSidebarOpen && (
            <div
                className="fixed inset-0 bg-black/60 z-30 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
            />
        )}
        <aside className={`fixed top-[72px] left-0 h-[calc(100vh-72px)] w-64 bg-black/30 p-4 border-r border-brand-gold/20 flex flex-col z-40 transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 mb-4">
            <Icon name="logo" className="w-32 h-10"/>
            <p className="text-sm text-brand-light/50 mt-1">Seller Panel</p>
          </div>
          <nav className="flex-grow space-y-2 overflow-y-auto">
            <NavLink to="/seller-dashboard" icon="home" label="Dashboard" />
            <NavLink to="/seller/products" icon="category" label="Products" />
            <NavLink to="/seller/orders" icon="cart" label="Orders" />
            <NavLink to="/seller/payouts" icon="wallet" label="Payouts" />
            <NavLink to="/seller/returns" icon="return" label="Returns" />
            <NavLink to="/edit-profile" icon="user" label="Edit Profile" />
          </nav>
           <div className="mt-4">
            <button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-brand-light/70 hover:bg-brand-light/5 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              <Icon name={'refresh'} className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="font-semibold">{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
            {refreshMessage && <p className="text-xs text-center mt-2 text-brand-gold animate-pulse">{refreshMessage}</p>}
          </div>
          <div className="mt-4 pt-4 border-t border-brand-gold/20 space-y-2">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors">
              <Icon name="trash" className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>
        <main className="flex-grow p-4 sm:p-8 overflow-y-auto md:ml-64">
          {children}
        </main>
      </div>
    </>
  );
};

export default SellerLayout;
