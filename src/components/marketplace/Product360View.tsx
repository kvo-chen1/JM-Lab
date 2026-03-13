import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCcw, ZoomIn, ZoomOut, Maximize, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Product360ViewProps {
  images: string[];
  onClose: () => void;
  productName?: string;
}

const Product360View: React.FC<Product360ViewProps> = ({
  images,
  onClose,
  productName = '商品'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [lastIndex, setLastIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const totalImages = images.length;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setLastIndex(currentIndex);
    if (isAutoPlaying) setIsAutoPlaying(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const indexChange = Math.round(deltaX / 50);
    let newIndex = lastIndex - indexChange;
    newIndex = ((newIndex % totalImages) + totalImages) % totalImages;
    setCurrentIndex(newIndex);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setLastIndex(currentIndex);
    if (isAutoPlaying) setIsAutoPlaying(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - startX;
    const indexChange = Math.round(deltaX / 50);
    let newIndex = lastIndex - indexChange;
    newIndex = ((newIndex % totalImages) + totalImages) % totalImages;
    setCurrentIndex(newIndex);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % totalImages);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const reset = () => {
    setCurrentIndex(0);
    setZoom(1);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        nextImage();
      }, 100);
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    }
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 1));
  };

  if (images.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="mb-4">没有可用的360度图片</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black/50">
        <h2 className="text-white font-semibold">{productName} - 360度预览</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div
          ref={containerRef}
          className="relative cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`${productName} - ${currentIndex + 1}/${totalImages}`}
            className="max-w-full max-h-[70vh] object-contain select-none"
            style={{ transform: `scale(${zoom})` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
            draggable={false}
          />
        </div>

        <button
          onClick={prevImage}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextImage}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-black/50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex gap-1 bg-white/10 rounded-lg p-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>

            <button
              onClick={toggleAutoPlay}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${
                isAutoPlaying ? 'bg-[#C02C38]' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {isAutoPlaying ? '停止' : '自动播放'}
            </button>

            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                className="text-white hover:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-white text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="text-white hover:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="text-white/60 text-sm">
              拖动图片旋转查看
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product360View;
