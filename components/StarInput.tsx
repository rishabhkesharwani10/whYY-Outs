
import React, { useState } from 'react';
import Icon from './Icon.tsx';

interface StarInputProps {
  rating: number;
  setRating: (rating: number) => void;
  className?: string;
}

const StarInput: React.FC<StarInputProps> = ({ rating, setRating, className = 'w-8 h-8' }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            type="button"
            key={starValue}
            onClick={() => setRating(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus:outline-none transition-transform duration-150 hover:scale-110"
            aria-label={`Rate ${starValue} stars`}
          >
            <Icon
              name="star-filled"
              className={`${className} transition-colors ${
                starValue <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-500'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarInput;
