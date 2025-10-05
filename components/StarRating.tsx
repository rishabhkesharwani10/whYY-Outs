import React from 'react';
import Icon from './Icon.tsx';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, maxRating = 5, className = 'w-5 h-5' }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = maxRating - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <Icon key={`full-${i}`} name="star-filled" className={`${className} text-yellow-400`} />
      ))}
      {/* Note: This simple version doesn't render half stars, but can be extended to. */}
      {[...Array(emptyStars)].map((_, i) => (
        <Icon key={`empty-${i}`} name="star-empty" className={`${className} text-gray-300`} />
      ))}
    </div>
  );
};

export default React.memo(StarRating);
