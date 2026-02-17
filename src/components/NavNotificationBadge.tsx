import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface NavNotificationBadgeProps {
  count?: number;
  showDot?: boolean;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'error' | 'warning' | 'success';
  maxCount?: number;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const sizeMap = {
  sm: {
    badge: 'min-w-[18px] h-[18px] text-[10px] px-1',
    dot: 'w-2 h-2',
  },
  md: {
    badge: 'min-w-[20px] h-[20px] text-[11px] px-1.5',
    dot: 'w-2.5 h-2.5',
  },
  lg: {
    badge: 'min-w-[24px] h-[24px] text-xs px-2',
    dot: 'w-3 h-3',
  },
};

const variantMap = {
  default: 'bg-red-500 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-amber-500 text-white',
  success: 'bg-green-500 text-white',
};

const dotVariantMap = {
  default: 'bg-red-500',
  error: 'bg-red-600',
  warning: 'bg-amber-500',
  success: 'bg-green-500',
};

export const NavNotificationBadge: React.FC<NavNotificationBadgeProps> = ({
  count,
  showDot = false,
  pulse = true,
  size = 'md',
  variant = 'default',
  maxCount = 99,
  className = '',
  onClick,
}) => {
  const displayCount = count !== undefined && count > maxCount ? `${maxCount}+` : count;
  const hasNotification = count !== undefined && count > 0;

  return (
    <AnimatePresence mode="wait">
      {(hasNotification || showDot) && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            type: 'spring',
            stiffness: 500,
            damping: 25,
            duration: 0.2 
          }}
          onClick={onClick}
          className={`
            inline-flex items-center justify-center
            rounded-full font-semibold
            ${count !== undefined ? sizeMap[size].badge : sizeMap[size].dot}
            ${count !== undefined ? variantMap[variant] : dotVariantMap[variant]}
            ${className}
          `}
        >
          {count !== undefined ? (
            <motion.span
              key={displayCount}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              {displayCount}
            </motion.span>
          ) : pulse ? (
            <motion.span
              className="absolute inset-0 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.7, 0, 0.7],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                backgroundColor: 'inherit',
              }}
            />
          ) : null}
        </motion.span>
      )}
    </AnimatePresence>
  );
};

export default NavNotificationBadge;
