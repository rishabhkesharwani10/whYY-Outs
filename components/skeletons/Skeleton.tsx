import React from 'react';

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-black/40 animate-pulse rounded-md ${className}`} />
);

export default Skeleton;
