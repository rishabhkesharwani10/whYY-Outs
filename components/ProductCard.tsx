
import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types.ts';
import StarRating from './StarRating.tsx';
import LazyImage from './LazyImage.tsx';
import WishlistButton from './WishlistButton.tsx';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div 
      className="group bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg shadow-brand-gold/10 hover:border-brand-gold/50 transition-colors duration-300 overflow-hidden relative flex flex-col h-full"
    >
      {/* The main link that makes the card clickable. It covers the whole card. */}
      <Link to={`/product/${product.id}`} className="absolute inset-0 z-10" aria-label={`View details for ${product.name}`} />

      {/* Visual content part. It's under the link overlay, but hover effects still work due to `group` on the parent. */}
      <div className="relative aspect-square w-full overflow-hidden">
        <LazyImage 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 transform-gpu" 
        />
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-brand-gold text-brand-dark text-xs font-bold px-2 py-1 rounded z-20">
            {discountPercentage}% OFF
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-md font-semibold text-brand-light group-hover:text-brand-gold transition-colors duration-300 min-h-10">{product.name}</h3>
        {product.sellerBusinessName && (
          <Link
            to="/shop"
            state={{ sellerId: product.sellerId }}
            onClick={(e) => e.stopPropagation()} // Prevent card's main link from firing
            className="relative z-20 mt-1 text-xs text-brand-light/70 hover:text-brand-gold hover:underline"
            aria-label={`View all products from ${product.sellerBusinessName}`}
          >
            Sold by: {product.sellerBusinessName}
          </Link>
        )}
        <div className="flex items-center mt-2">
          <StarRating rating={product.rating} />
          <span className="text-xs text-brand-light/70 ml-2">({product.reviewCount})</span>
        </div>
        <div className="flex items-baseline mt-auto pt-2">
          <p className="text-lg font-bold text-brand-light">₹{product.price.toFixed(2)}</p>
          {product.originalPrice && (
            <p className="text-sm text-brand-light/60 line-through ml-2">₹{product.originalPrice.toFixed(2)}</p>
          )}
        </div>
      </div>
      
      {/* Wishlist button must have a higher z-index than the link overlay to be clickable. */}
      <div className="absolute top-2 right-2 z-20">
        <WishlistButton productId={product.id} />
      </div>
    </div>
  );
};

export default React.memo(ProductCard);