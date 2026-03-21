import React, { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  description?: string;
}

export default function ImageLightbox({
  isOpen,
  onClose,
  imageUrl,
  title,
  description
}: ImageLightboxProps) {
  const { isDark } = useTheme();
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);

  // ESC 键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // 重置缩放和加载状态
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setLoading(true);
    }
  }, [isOpen, imageUrl]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleImageLoad = useCallback(() => {
    setLoading(false);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(3, prev + 0.25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(0.5, prev - 0.25));
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={handleBackdropClick}
        >
          {/* 背景遮罩 */}
          <div className={`absolute inset-0 ${isDark ? 'bg-black/90' : 'bg-black/80'}`} />

          {/* 图片容器 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 max-w-[90vw] max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 - 放在图片容器内部右上角 */}
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 z-20 p-2 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-lg transition-all"
              title="关闭 (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
            {/* 图片 */}
            <div className="relative overflow-hidden rounded-lg">
              {loading && (
                <div className={`absolute inset-0 flex items-center justify-center ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}
              <img
                src={imageUrl}
                alt={title || '图片'}
                className="max-w-full max-h-[80vh] object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
                onLoad={handleImageLoad}
                crossOrigin="anonymous"
              />
            </div>

            {/* 标题和描述 */}
            {(title || description) && (
              <div className="mt-4 text-center max-w-2xl px-4 text-white">
                {title && (
                  <h3 className="text-lg font-semibold mb-1">{title}</h3>
                )}
                {description && (
                  <p className="text-sm opacity-80">{description}</p>
                )}
              </div>
            )}

            {/* 缩放控制 */}
            <div className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-full ${
              isDark ? 'bg-white/10' : 'bg-black/20'
            }`}>
              <button
                onClick={handleZoomOut}
                className="p-1 text-white/80 hover:text-white transition-colors disabled:opacity-30"
                disabled={zoom <= 0.5}
                title="缩小"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-white text-sm min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 text-white/80 hover:text-white transition-colors disabled:opacity-30"
                disabled={zoom >= 3}
                title="放大"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
