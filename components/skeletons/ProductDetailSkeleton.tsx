import React from 'react';
import Skeleton from './Skeleton.tsx';

const ProductDetailSkeleton: React.FC = () => (
  <div className="bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg p-4 md:p-8">
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
      {/* Image Side */}
      <div className="flex flex-col gap-4 lg:col-span-3">
        <Skeleton className="aspect-square w-full" />
        <div className="flex space-x-2">
          <Skeleton className="w-20 h-20" />
          <Skeleton className="w-20 h-20" />
          <Skeleton className="w-20 h-20" />
        </div>
      </div>
      {/* Info Side */}
      <div className="flex flex-col lg:col-span-2">
        <Skeleton className="w-1/3 h-4 mb-2" /> {/* Brand */}
        <Skeleton className="w-full h-10 mb-4" /> {/* Title */}
        <Skeleton className="w-1/2 h-6 mb-5" /> {/* Rating */}
        <Skeleton className="w-1/3 h-12 mb-6" /> {/* Price */}
        <Skeleton className="w-full h-10 mb-4" /> {/* Size selection */}
        <div className="mt-auto pt-8 flex items-stretch gap-4">
          <Skeleton className="flex-grow h-16" /> {/* Add to cart */}
          <Skeleton className="flex-shrink-0 w-16 h-16" /> {/* Wishlist */}
        </div>
      </div>
    </div>
    {/* Tabs */}
    <div className="mt-12 border-t border-brand-gold/20">
      <div className="flex items-center border-b border-brand-gold/20">
        <Skeleton className="w-24 h-12" />
        <Skeleton className="w-24 h-12 ml-4" />
        <Skeleton className="w-24 h-12 ml-4" />
      </div>
      <div className="py-6">
        <Skeleton className="w-full h-4 mb-3" />
        <Skeleton className="w-full h-4 mb-3" />
        <Skeleton className="w-5/6 h-4" />
      </div>
    </div>
  </div>
);

export default ProductDetailSkeleton;