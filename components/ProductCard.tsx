import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import type { Product } from '../types.ts';
import StarRating from './StarRating.tsx';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <ReactRouterDOM.Link to={`/product/${product.id}`} className="block group bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg shadow-brand-gold/10 hover:border-brand-gold/50 transition-all duration-300 overflow-hidden">
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity duration-300" 
        />
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-brand-gold text-brand-dark text-xs font-bold px-2 py-1 rounded">
            {discountPercentage}% OFF
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-md font-semibold text-brand-light truncate group-hover:text-brand-gold transition-colors duration-300">{product.name}</h3>
        <div className="flex items-center mt-2">
          <StarRating rating={product.rating} />
          <span className="text-xs text-brand-light/70 ml-2">({product.reviewCount})</span>
        </div>
        <div className="flex items-baseline mt-2">
          <p className="text-lg font-bold text-brand-light">${product.price.toFixed(2)}</p>
          {product.originalPrice && (
            <p className="text-sm text-brand-light/60 line-through ml-2">${product.originalPrice.toFixed(2)}</p>
          )}
        </div>
      </div>
    </ReactRouterDOM.Link>
  );
};

export default React.memo(ProductCard);