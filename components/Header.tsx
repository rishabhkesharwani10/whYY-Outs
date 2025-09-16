import React, { useState, useRef, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../hooks/useCart.ts';
import { useWishlist } from '../hooks/useWishlist.ts';
import Icon from './Icon.tsx';
import { useNotifications } from '../hooks/useNotifications.ts';
import { SITE_MAP, PAGE_ROUTES } from '../constants.ts';

const NotificationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { notifications, markAllAsRead } = useNotifications();
    const navigate = ReactRouterDOM.useNavigate();
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

const NavDropdown: React.FC<{ title: string, items: string[], pageLinks: { [key: string]: string } }> = ({ title, items, pageLinks }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-1 text-brand-light/80 hover:text-white transition-colors duration-300 py-2">
        <span className="text-sm uppercase tracking-wider">{title}</span>
        <Icon name="chevron-down" className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-56 bg-brand-dark border border-brand-gold/30 rounded-lg shadow-2xl z-50 page-fade-in">
          <div className="p-2">
            {items.map(item => {
              const to = pageLinks[item];
              const className = "block w-full text-left px-4 py-2 text-sm rounded-md text-brand-light/90 hover:bg-brand-gold/10 transition-colors";
              if (to) {
                return <ReactRouterDOM.Link to={to} key={item} className={className}>{item}</ReactRouterDOM.Link>
              }
              return <a href="#" key={item} className={className}>{item}</a>
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const Header: React.FC<{ showSearch?: boolean }> = ({ showSearch = true }) => {
  const { user, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const { wishlistItems } = useWishlist();
  const { unreadCount } = useNotifications();
  const navigate = ReactRouterDOM.useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
        navigate('/shop', { state: { searchQuery: searchQuery.trim() } });
    }
  };

  const handleVoiceSearch = () => { /* ... existing code ... */ };
  const handleCameraSearch = async () => { /* ... existing code ... */ };
  const handleCloseCamera = () => { /* ... existing code ... */ };
  const handleCaptureImage = () => { /* ... existing code ... */ };

  useEffect(() => { /* ... existing code for video stream ... */ }, [videoStream]);

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
        return <ReactRouterDOM.Link to={to} className={className} aria-label={ariaLabel}>{content}</ReactRouterDOM.Link>
    }
    return <button onClick={onClick} className={className} aria-label={ariaLabel}>{content}</button>
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-brand-dark/50 backdrop-blur-xl z-50 font-sans shadow-lg shadow-black/30 border-b border-brand-gold/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 h-[72px]">
            <ReactRouterDOM.Link to="/" className="w-32 h-10 flex-shrink-0" aria-label="whYYOuts Homepage">
              <Icon name="logo" className="w-full h-full" />
            </ReactRouterDOM.Link>

            {showSearch && (
              <div className="hidden md:flex flex-col flex-grow max-w-2xl mx-8">
                 <form onSubmit={handleSearchSubmit} className="w-full relative">{/* ... existing search form ... */}</form>
              </div>
            )}

            <nav className="flex items-center space-x-2 md:space-x-3">
              <div className="hidden lg:flex items-center gap-4">
                <NavDropdown title="Company" items={SITE_MAP.Company} pageLinks={PAGE_ROUTES} />
                <NavDropdown title="Help" items={SITE_MAP.Help} pageLinks={PAGE_ROUTES} />
                <NavDropdown title="Policy" items={SITE_MAP.Policy} pageLinks={PAGE_ROUTES} />
              </div>

              <div className="hidden lg:block w-px h-6 bg-brand-gold/20 mx-2"></div>

              {isAuthenticated && user ? (
                <>
                  <ReactRouterDOM.Link to="/profile" className="flex items-center gap-2 p-2 text-brand-light/80 hover:text-white transition-colors duration-300" aria-label="Profile">
                      <span className="hidden sm:inline font-medium text-sm">{user.fullName}</span>
                      <Icon name="user" className="w-6 h-6" />
                  </ReactRouterDOM.Link>
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

      {/* Camera Modal ... existing code ... */}
    </>
  );
};

export default React.memo(Header);