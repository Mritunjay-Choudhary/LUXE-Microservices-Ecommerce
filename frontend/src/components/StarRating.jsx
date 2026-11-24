import { Star } from 'lucide-react';

const StarRating = ({ rating = 0, size = 16, showValue = false }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= Math.round(rating)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          }
        />
      ))}
      {showValue && (
        <span className="ml-1 text-xs text-gray-500">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
};

export default StarRating;
