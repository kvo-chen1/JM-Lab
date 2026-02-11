import { motion } from 'framer-motion';
import { useState } from 'react';

interface Brand {
  id: string;
  name: string;
  story: string;
  image: string;
}

interface BrandCard3DProps {
  brand: Brand;
  isSelected: boolean;
  isDark: boolean;
  onClick: () => void;
}

export default function BrandCard3D({ brand, isSelected, isDark, onClick }: BrandCard3DProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative p-4 rounded-2xl border-2 text-left transition-all overflow-hidden ${
        isSelected
          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-lg shadow-red-500/10'
          : (isDark ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md')
      }`}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {/* 3D Flip Container */}
      <motion.div
        className="relative"
        animate={{
          rotateY: isHovered ? 180 : 0,
        }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Front Side - Image */}
        <motion.div
          className="relative aspect-[4/3] rounded-xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
          }}
        >
          <img 
            src={brand.image} 
            alt={brand.name} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {isSelected && (
            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white">
                <i className="fas fa-check"></i>
              </div>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Brand Name on Image */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h4 className="font-bold text-sm text-white truncate">{brand.name}</h4>
          </div>
        </motion.div>

        {/* Back Side - Story */}
        <motion.div
          className={`absolute inset-0 rounded-xl p-4 flex flex-col justify-center ${
            isDark ? 'bg-gray-700' : 'bg-gray-50'
          }`}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <h4 className="font-bold text-sm mb-2">{brand.name}</h4>
          <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} line-clamp-4 leading-relaxed`}>
            {brand.story}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
            <i className="fas fa-info-circle"></i>
            <span>点击选择此品牌</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <i className="fas fa-check"></i>
        </motion.div>
      )}

      {/* Hover Hint */}
      {!isSelected && !isHovered && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <i className="fas fa-sync-alt text-gray-400 text-xs"></i>
        </div>
      )}
    </motion.button>
  );
}
