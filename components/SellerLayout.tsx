
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Icon from './Icon.tsx';
import { useAuth } from '../context/AuthContext.tsx';

const SellerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const NavLink: React.FC<{ to: string, icon: any, label: string }> = ({ to, icon, label }) => {
    const location = ReactRouterDOM.useLocation();
    const isActive = location.pathname.startsWith(to);
    return (
      <ReactRouterDOM.Link to={to} className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${isActive ? 'bg-brand-gold/10 text-brand-gold' : 'text-brand-light/70 hover:bg-brand-light/5 hover:text-white'}`}>
        <Icon name={icon} className="w-5 h-5" />
        <span className="font-semibold">{label}</span>
      </ReactRouterDOM.Link>
    );
  };
  
  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex font-sans">
      <aside className="w-64 bg-black/30 p-4 border-r border-brand-gold/20 flex-shrink-0 flex flex-col hidden md:flex">
        <div className="p-4 mb-4">
          <Icon name="logo" className="w-32 h-10"/>
          <p className="text-sm text-brand-light/50 mt-1">Seller Panel</p>
        </div>
        <nav className="flex-grow space-y-2">
          <NavLink to="/seller-dashboard" icon="home" label="Dashboard" />
          <NavLink to="/seller/products" icon="category" label="Products" />
          <NavLink to="/seller/orders" icon="cart" label="Orders" />
          <NavLink to="/seller/returns" icon="return" label="Returns" />
          <NavLink to="/seller/payouts" icon="wallet" label="Payouts" />
        </nav>
        <div className="mt-4 pt-4 border-t border-brand-gold/20 space-y-2">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors">
            <Icon name="trash" className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-grow p-4 sm:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default SellerLayout;