import React from 'react';
import Skeleton from './Skeleton.tsx';

const ProductCardSkeleton: React.FC = () => (
  <div className="bg-black/20 border border-brand-gold/20 rounded-lg p-4">
    <Skeleton className="w-full h-48 mb-4" />
    <Skeleton className="w-3/4 h-5 mb-2" />
    <Skeleton className="w-1/2 h-4 mb-3" />
    <Skeleton className="w-1/3 h-6" />
  </div>
);

export default ProductCardSkeleton;
