import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Icon from './Icon.tsx';
import { useCart } from '../hooks/useCart.ts';

const BottomNav: React.FC = () => {
  const { itemCount } = useCart();
  const location = ReactRouterDOM.useLocation();

  const NavLink = ({ to, icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <ReactRouterDOM.NavLink 
        to={to} 
        className={`flex flex-col items-center justify-center space-y-1 w-full text-xs transition-all duration-300 group ${isActive ? 'text-brand-gold' : 'text-brand-light/70 hover:text-brand-light'}`}
      >
        <div className="relative p-1">
          <Icon name={icon} className="w-6 h-6" />
          {isActive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand-gold rounded-full transition-all duration-300"></div>}
        </div>
        <span className={`transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-100 group-hover:opacity-100'}`}>{label}</span>
      </ReactRouterDOM.NavLink>
    );
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/70 backdrop-blur-xl border-t border-brand-gold/10 z-40">
      <div className="container mx-auto flex justify-around items-center h-20">
        <NavLink to="/" icon="home" label="Home" />
        <NavLink to="/shop" icon="category" label="Categories" />
        <NavLink to="/shop" icon="offer" label="Offers" />
        <ReactRouterDOM.Link to="/cart" className="relative flex flex-col items-center justify-center space-y-1 w-full text-xs text-brand-light/70 hover:text-brand-light p-1">
          <div className="relative">
            <Icon name="cart" className="w-6 h-6" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 block h-4 w-4 rounded-full bg-brand-gold text-brand-dark text-[10px] flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </div>
          <span>Cart</span>
        </ReactRouterDOM.Link>
        <NavLink to="/profile" icon="user" label="Profile" />
      </div>
    </nav>
  );
};

export default React.memo(BottomNav);