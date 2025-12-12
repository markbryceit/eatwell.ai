import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RatingStars({ rating, onRate, size = 'md', readonly = false }) {
  const [hoverRating, setHoverRating] = React.useState(0);
  
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const sizeClass = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverRating || rating);
        return (
          <motion.button
            key={star}
            whileHover={!readonly ? { scale: 1.2 } : {}}
            whileTap={!readonly ? { scale: 0.9 } : {}}
            onClick={() => !readonly && onRate?.(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
            disabled={readonly}
          >
            <Star
              className={`${sizeClass} transition-all ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300'
              }`}
            />
          </motion.button>
        );
      })}
    </div>
  );
}