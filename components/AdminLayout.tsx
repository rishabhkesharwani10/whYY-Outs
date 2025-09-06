

import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Icon from './Icon.tsx';
import { useAuth } from '../context/AuthContext.tsx';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const NavLink: React.FC<{ to: string, icon: any, label: string }> = ({ to, icon, label }) => {
    const location = ReactRouterDOM.useLocation();
    const isActive = location.pathname === to || (to === '/admin/products' && location.pathname.startsWith('/admin/products'));
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
          <p className="text-sm text-brand-light/50 mt-1">Admin Panel</p>
        </div>
        <nav className="flex-grow space-y-2">
          <NavLink to="/admin" icon="home" label="Dashboard" />
          <NavLink to="/admin/products" icon="category" label="Products" />
          <NavLink to="/admin/orders" icon="cart" label="Orders" />
          <NavLink to="/admin/users" icon="user" label="Users" />
          <NavLink to="/admin/coupons" icon="offer" label="Coupons" />
          <NavLink to="/admin/returns" icon="return" label="Returns" />
        </nav>
        <div className="mt-4 pt-4 border-t border-brand-gold/20 space-y-2">
          <ReactRouterDOM.Link to="/shop" className="flex items-center gap-3 px-4 py-2 rounded-md text-brand-light/70 hover:bg-brand-light/5 hover:text-white transition-colors">
            <Icon name="chevron-left" className="w-5 h-5" />
            <span>Exit to Shop</span>
          </ReactRouterDOM.Link>
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

export default AdminLayout;