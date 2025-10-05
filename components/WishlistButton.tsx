import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon.tsx';
import { useWishlist } from '../hooks/useWishlist.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({ productId, className }) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const inWishlist = isInWishlist(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (inWishlist) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  };

  const iconColor = inWishlist ? 'text-red-500' : 'text-white';
  const defaultClassName = 'p-2 bg-black/40 rounded-full backdrop-blur-sm hover:bg-black/70 transition-colors duration-300';
  
  return (
    <button
      onClick={handleClick}
      className={`${defaultClassName} ${className}`}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Icon
        name={inWishlist ? 'wishlist-filled' : 'wishlist'}
        className={`w-6 h-6 transition-colors ${iconColor}`}
      />
    </button>
  );
};

export default WishlistButton;