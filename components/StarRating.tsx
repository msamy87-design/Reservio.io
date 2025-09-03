
import React from 'react';
import { StarIcon } from './Icons';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, maxStars = 5 }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  return (
    <div className="flex items-center">
      {[...Array(maxStars)].map((_, i) => {
        const starValue = i + 1;
        if (starValue <= fullStars) {
          return <StarIcon key={i} className="w-4 h-4 text-yellow-400 fill-current" />;
        }
        if (hasHalfStar && starValue === fullStars + 1) {
          return (
            <div key={i} className="relative">
                <StarIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 fill-current" />
                <div className="absolute top-0 left-0 w-1/2 h-full overflow-hidden">
                    <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                </div>
            </div>
          );
        }
        return <StarIcon key={i} className="w-4 h-4 text-gray-300 dark:text-gray-600 fill-current" />;
      })}
    </div>
  );
};

export default StarRating;
