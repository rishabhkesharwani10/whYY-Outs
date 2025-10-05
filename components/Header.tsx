import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useCartState } from '../hooks/useCart.ts';
import { useWishlist } from '../hooks/useWishlist.ts';
import Icon from './Icon.tsx';
import { useNotifications } from '../hooks/useNotifications.ts';
import VisualSearchModal from './VisualSearchModal.tsx';

const NotificationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { notifications, markAllAsRead } = useNotifications();
    const navigate = useNavigate();
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        markAllAsRead();
    }, [markAllAsRead]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleNotificationClick = (orderId: string) => {
        navigate(`/order/${orderId}`);
        onClose();
    };

    return (
        <div ref={panelRef} className="absolute top-full right-0 mt-3 w-80 max-w-[90vw] bg-brand-dark border border-brand-gold/30 rounded-lg shadow-2xl z-50 page-fade-in">
            <div className="p-3 border-b border-brand-gold/20">
                <h3 className="font-semibold text-brand-light">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <p className="text-center text-sm text-brand-light/70 py-6">No new notifications.</p>
                ) : (
                    <div className="divide-y divide-brand-gold/20">
                        {notifications.map(notif => (
                            <button
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif.orderId)}
                                className="w-full text-left p-3 hover:bg-brand-gold/5 transition-colors block"
                            >
                                <p className="text-sm text-brand-light/90">{notif.message}</p>
                                <p className="text-xs text-brand-light/60 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const Header: React.FC<{ showSearch?: boolean; onMenuClick?: () => void }> = ({ showSearch = true, onMenuClick }) => {
  const { user, isAuthenticated } = useAuth();
  const { itemCount } = useCartState();
  const { wishlistItems } = useWishlist();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
        navigate('/shop', { state: { searchQuery: searchQuery.trim() } });
    }
  };

  const NavIcon = ({ iconName, badgeCount, ariaLabel, onClick, to }: { iconName: any; badgeCount?: number; ariaLabel: string; onClick?: () => void, to?: string }) => {
    const content = (
        <>
            <Icon name={iconName} className="w-6 h-6" />
            {badgeCount !== undefined && badgeCount > 0 && (
                <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-brand-gold text-brand-dark text-xs flex items-center justify-center font-bold">
                    {badgeCount}
                </span>
            )}
        </>
    );
    const className = "relative p-2 text-brand-light/80 hover:text-white transition-colors duration-300";

    if (to) {
        return <Link to={to} className={className} aria-label={ariaLabel}>{content}</Link>
    }
    return <button onClick={onClick} className={className} aria-label={ariaLabel}>{content}</button>
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-brand-dark/50 backdrop-blur-xl z-50 font-sans shadow-lg shadow-black/30 border-b border-brand-gold/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 h-[72px]">
            <div className="flex items-center">
              {onMenuClick && (
                <button
                  onClick={onMenuClick}
                  className="md:hidden mr-2 p-2 text-brand-light/80 hover:text-white"
                  aria-label="Open navigation menu"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <Link to="/" className="w-32 h-10 flex-shrink-0" aria-label="whYYOuts Homepage">
                <Icon name="logo" className="w-full h-full" />
              </Link>
            </div>

            {showSearch && (
              <div className="hidden md:flex flex-grow max-w-2xl mx-8">
                 <form onSubmit={handleSearchSubmit} className="w-full relative">
                    <input
                      type="text"
                      placeholder="Search for products, brands and more"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/50 border border-brand-gold/30 rounded-full py-2.5 pl-12 pr-24 text-brand-light placeholder-brand-light/50 focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                    />
                    <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-light/50" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button type="button" onClick={() => setIsVisualSearchOpen(true)} className={`p-1.5 rounded-full transition-colors ${isListening ? 'bg-brand-gold/20 animate-mic-pulse' : ''}`} aria-label="Visual Search">
                          <Icon name="camera" className="w-5 h-5 text-brand-gold" />
                        </button>
                    </div>
                    {searchError && <p className="absolute top-full mt-1 text-xs text-red-400">{searchError}</p>}
                 </form>
              </div>
            )}

            <nav className="flex items-center space-x-2 md:space-x-3">
              {showSearch && !onMenuClick && (
                <div className="md:hidden">
                  <NavIcon to="/shop" iconName="search" ariaLabel="Search" />
                </div>
              )}
              {isAuthenticated && user ? (
                <>
                  <Link to="/profile" className="flex items-center gap-2 p-2 text-brand-light/80 hover:text-white transition-colors duration-300" aria-label="Profile">
                      <span className="hidden sm:inline font-medium text-sm">{user.fullName}</span>
                      <Icon name="user" className="w-6 h-6" />
                  </Link>
                  {user.role === 'customer' && (
                    <>
                      <NavIcon to="/cart" iconName="cart" badgeCount={itemCount} ariaLabel="Shopping Cart" />
                      <NavIcon to="/wishlist" iconName="wishlist" badgeCount={wishlistItems.length} ariaLabel="My Wishlist" />
                    </>
                  )}
                  <div className="relative">
                     <NavIcon iconName="offer" badgeCount={unreadCount} ariaLabel="Notifications" onClick={() => setIsNotificationPanelOpen(prev => !prev)} />
                     {isNotificationPanelOpen && <NotificationPanel onClose={() => setIsNotificationPanelOpen(false)} />}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/login" className="px-4 py-2 text-sm uppercase tracking-widest hover:text-white transition-colors duration-300">
                    Login
                  </Link>
                  <Link to="/register" className="px-4 py-2 text-sm uppercase tracking-widest border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 rounded-md">
                    Register
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {isVisualSearchOpen && <VisualSearchModal onClose={() => setIsVisualSearchOpen(false)} />}
    </>
  );
};

export default React.memo(Header);
