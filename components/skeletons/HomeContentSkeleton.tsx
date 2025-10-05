import React from 'react';
import Skeleton from './Skeleton.tsx';

const HomeContentSkeleton: React.FC = () => (
  <section className="container mx-auto px-4 sm:px-6 lg:px-8">
    <div className="max-w-3xl mx-auto h-[22rem]">
      {/* Flash Deals Skeleton */}
      <div className="bg-black/40 border border-brand-gold/20 rounded-2xl p-6 flex flex-col justify-between h-full">
        <div className="flex justify-between items-center">
          <Skeleton className="w-1/3 h-8" />
          <Skeleton className="w-16 h-6" />
        </div>
        <Skeleton className="w-2/3 h-6 mt-2" />
        <div className="flex justify-center gap-3 my-4">
          <Skeleton className="w-14 h-12" />
          <Skeleton className="w-14 h-12" />
          <Skeleton className="w-14 h-12" />
        </div>
        <Skeleton className="w-full h-11" />
      </div>
    </div>
  </section>
);

export default HomeContentSkeleton;