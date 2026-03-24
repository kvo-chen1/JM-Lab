// 图片轮播组件

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { CaseImage } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: CaseImage[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  currentIndex,
  onIndexChange,
}) => {
  const { isDark } = useTheme();
  const [direction, setDirection] = useState(0);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    onIndexChange(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  }, [currentIndex, images.length, onIndexChange]);

  const handleNext = useCallback(() => {
    setDirection(1);
    onIndexChange(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  }, [currentIndex, images.length, onIndexChange]);

  const handleThumbnailClick = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    onIndexChange(index);
  };

  if (images.length === 0) return null;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="space-y-4">
      {/* 主图区域 */}
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]?.url}
            alt={`图片 ${currentIndex + 1}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* 左右切换按钮 */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="
                absolute left-3 top-1/2 -translate-y-1/2
                w-10 h-10 rounded-full
                bg-black/40 backdrop-blur-sm
                flex items-center justify-center
                text-white
                hover:bg-black/60
                transition-colors
              "
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="
                absolute right-3 top-1/2 -translate-y-1/2
                w-10 h-10 rounded-full
                bg-black/40 backdrop-blur-sm
                flex items-center justify-center
                text-white
                hover:bg-black/60
                transition-colors
              "
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* 图片计数器 */}
        <div className="
          absolute bottom-3 right-3
          px-3 py-1 rounded-full
          bg-black/40 backdrop-blur-sm
          text-white text-sm font-medium
        ">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* 缩略图列表 */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => handleThumbnailClick(index)}
              className={`
                relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden
                transition-all duration-200
                ${index === currentIndex
                  ? 'ring-2 ring-[#C02C38] ring-offset-2 ring-offset-transparent'
                  : 'opacity-60 hover:opacity-100'
                }
              `}
            >
              <img
                src={image.thumbnailUrl || image.url}
                alt={`缩略图 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
