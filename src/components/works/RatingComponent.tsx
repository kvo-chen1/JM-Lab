import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Star } from 'lucide-react';

interface RatingComponentProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  userRating?: number | null;
  onRate?: (rating: number) => void;
  showValue?: boolean;
  ratingCount?: number;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function RatingComponent({
  rating,
  maxRating = 10,
  size = 'md',
  interactive = false,
  userRating = null,
  onRate,
  showValue = true,
  ratingCount = 0,
}: RatingComponentProps) {
  const { isDark } = useTheme();
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || userRating || rating;
  const fullStars = Math.floor(displayRating / 2);
  const hasHalfStar = displayRating % 2 >= 1;

  const handleClick = (index: number) => {
    if (interactive && onRate) {
      onRate(index + 1);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (interactive) {
      setHoverRating((index + 1) * 2);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {/* 5颗星，每颗代表2分 */}
        {Array.from({ length: 5 }).map((_, index) => {
          const starValue = (index + 1) * 2;
          const isFilled = starValue <= displayRating;
          const isHalfFilled = !isFilled && starValue - 1 <= displayRating && displayRating % 2 === 1;

          return (
            <motion.button
              key={index}
              whileHover={interactive ? { scale: 1.2 } : {}}
              whileTap={interactive ? { scale: 0.9 } : {}}
              onClick={() => handleClick(index)}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              disabled={!interactive}
              className={`
                relative transition-colors duration-200
                ${interactive ? 'cursor-pointer' : 'cursor-default'}
                ${sizeClasses[size]}
              `}
            >
              {/* 背景星（空） */}
              <Star
                className={`
                  absolute inset-0 transition-colors duration-200
                  ${isDark ? 'text-gray-600' : 'text-gray-300'}
                `}
              />
              
              {/* 填充星 */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  width: isHalfFilled ? '50%' : isFilled ? '100%' : '0%',
                }}
              >
                <Star
                  className={`
                    ${sizeClasses[size]}
                    ${interactive && hoverRating > 0 ? 'text-amber-400' : 'text-amber-500'}
                    fill-current
                  `}
                />
              </div>
            </motion.button>
          );
        })}

        {/* 评分数值 */}
        {showValue && (
          <div className="ml-2 flex items-baseline gap-1">
            <span className={`
              font-bold text-lg
              ${isDark ? 'text-gray-100' : 'text-gray-900'}
            `}>
              {rating.toFixed(1)}
            </span>
            {ratingCount > 0 && (
              <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                ({ratingCount} 人评分)
              </span>
            )}
          </div>
        )}
      </div>

      {/* 用户已评分提示 */}
      {userRating && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-sm ${isDark ? 'text-primary-400' : 'text-primary-600'}`}
        >
          您已评分: {userRating} 分
        </motion.p>
      )}
    </div>
  );
}

// 简化的评分显示组件
export function RatingBadge({ rating, count }: { rating: number; count?: number }) {
  const { isDark } = useTheme();

  return (
    <div className={`
      inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium
      ${isDark 
        ? 'bg-amber-500/20 text-amber-300' 
        : 'bg-amber-100 text-amber-700'
      }
    `}>
      <Star className="w-3.5 h-3.5 fill-current" />
      <span>{rating.toFixed(1)}</span>
      {count !== undefined && (
        <span className="opacity-70">({count})</span>
      )}
    </div>
  );
}

export default RatingComponent;
