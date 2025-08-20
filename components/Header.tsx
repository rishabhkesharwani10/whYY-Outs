import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../hooks/useCart.ts';
import Icon from './Icon.tsx';

const Header: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  
  const NavIcon = ({ to, iconName, badgeCount, ariaLabel }: { to: string; iconName: any; badgeCount?: number; ariaLabel: string; }) => (
    <ReactRouterDOM.Link to={to} className="relative p-2 text-brand-light/80 hover:text-white transition-colors duration-300" aria-label={ariaLabel}>
      <Icon name={iconName} className="w-6 h-6" />
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-brand-gold text-brand-dark text-xs flex items-center justify-center font-bold">
          {badgeCount}
        </span>
      )}
    </ReactRouterDOM.Link>
  );

  return (
    <header className="fixed top-0 left-0 right-0 bg-brand-dark/50 backdrop-blur-xl z-50 font-sans shadow-lg shadow-black/30 border-b border-brand-gold/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <ReactRouterDOM.Link to="/" className="w-32 h-10 flex-shrink-0" aria-label="whYYOuts Homepage">
            <Icon name="logo" className="w-full h-full" />
          </ReactRouterDOM.Link>

          {/* Smart Search Bar (Centered) */}
          <div className="hidden md:flex flex-grow max-w-2xl mx-8 items-center relative">
            <input
              type="text"
              placeholder="Search anything... try voice or image!"
              className="w-full bg-black/50 border border-brand-gold/30 rounded-full py-2.5 pl-5 pr-28 text-brand-light placeholder-brand-light/50 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all"
            />
            <div className="absolute right-3 flex items-center space-x-2">
               <button className="text-brand-light/70 hover:text-white p-1" aria-label="Search by Image">
                <Icon name="camera" className="w-5 h-5" />
              </button>
               <button onClick={() => alert('Voice search is coming soon!')} className="text-brand-light/70 hover:text-white p-1" aria-label="Voice Search">
                <Icon name="microphone" className="w-5 h-5" />
              </button>
              <div className="border-l border-brand-gold/30 h-5"></div>
              <button className="text-brand-light/70 hover:text-white p-1" aria-label="Search">
                <Icon name="search" className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Icons and Auth */}
          <nav className="flex items-center space-x-2 md:space-x-3">
            {isAuthenticated && user ? (
              <>
                 <div className="hidden lg:flex items-center gap-4 mr-4">
                  <div className="flex items-center gap-1.5">
                    <Icon name="gem" className="w-5 h-5 text-brand-gold-light"/>
                    <span className="font-bold text-sm">2,450</span>
                  </div>
                   <div className="flex items-center gap-1.5">
                    <Icon name="wallet" className="w-5 h-5 text-brand-gold-light"/>
                    <span className="font-bold text-sm">$120.50</span>
                  </div>
                 </div>
                 <ReactRouterDOM.Link to="/profile" className="flex items-center gap-2 p-2 text-brand-light/80 hover:text-white transition-colors duration-300" aria-label="Profile">
                    <span className="hidden sm:inline font-medium text-sm">{user.fullName}</span>
                    <Icon name="user" className="w-6 h-6" />
                 </ReactRouterDOM.Link>
                 <NavIcon to="/cart" iconName="cart" badgeCount={itemCount} ariaLabel="Shopping Cart" />
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <ReactRouterDOM.Link to="/login" className="px-4 py-2 text-sm uppercase tracking-widest hover:text-white transition-colors duration-300">
                  Login
                </ReactRouterDOM.Link>
                <ReactRouterDOM.Link to="/register" className="px-4 py-2 text-sm uppercase tracking-widest border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 rounded-md">
                  Register
                </ReactRouterDOM.Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);