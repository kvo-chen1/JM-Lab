import React, { useState, useCallback } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Play, X, Star, Loader2, AtSign } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { GeneratedResult } from '../../types';
import type { WorkPosition } from './hooks';

interface WorkCardItemProps {
  work: GeneratedResult;
  position: WorkPosition;
  isSelected: boolean;
  isDragging: boolean;
  scale: number;
  onSelect: () => void;
  onDoubleClick: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onPositionChange?: (position: WorkPosition) => void;
  onMention?: (work: GeneratedResult) => void;
}

export default function WorkCardItem({
  work,
  position,
  isSelected,
  isDragging: externalIsDragging,
  scale,
  onSelect,
  onDoubleClick,
  onDragStart,
  onDelete,
  onPositionChange,
  onMention,
}: WorkCardItemProps) {
  const { isDark } = useTheme();
  const isVideo = work.type === 'video' || work.video;
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragControls = useDragControls();

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    dragControls.start(e);
    setIsDragging(true);
    onDragStart?.(e);
  }, [dragControls, onDragStart]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => {
    setIsDragging(false);

    // 计算最终位置（考虑画布缩放）
    const newPosition: WorkPosition = {
      x: position.x + info.offset.x / scale,
      y: position.y + info.offset.y / scale,
      rotation: position.rotation,
      scale: position.scale,
    };

    onPositionChange?.(newPosition);
  }, [position, scale, onPositionChange]);

  const isCurrentlyDragging = isDragging || externalIsDragging;

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        x: position.x,
        y: position.y,
        rotate: position.rotation || 0,
        scale: isCurrentlyDragging ? 1.05 : 1,
      }}
      transition={isCurrentlyDragging ? { duration: 0 } : {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        opacity: { duration: 0.2 },
      }}
      className="absolute"
      style={{
        width: 280,
        height: 200,
        zIndex: isCurrentlyDragging ? 100 : isSelected ? 50 : 1,
        cursor: isCurrentlyDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleDragStart}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={onDoubleClick}
    >
      {/* 卡片主体 */}
      <div
        className={`relative w-full h-full rounded-xl overflow-hidden shadow-2xl transition-shadow duration-200 ${
          isSelected 
            ? 'shadow-blue-500/30' 
            : isDark 
              ? 'shadow-black/50' 
              : 'shadow-gray-400/30'
        }`}
      >
        {/* 图片/视频内容 */}
        {isVideo ? (
          <>
            <video
              src={work.video || work.thumbnail}
              className="w-full h-full object-cover bg-gray-800"
              preload="metadata"
              muted
              playsInline
              onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
              onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <Play className="w-5 h-5 text-gray-900 ml-1" fill="currentColor" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 加载指示器 */}
            {isLoading && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            )}
            {/* 图片加载失败时的占位符 */}
            {hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 z-5">
                <i className="fas fa-image text-4xl text-gray-600 mb-2"></i>
                <span className="text-xs text-gray-500">图片加载失败</span>
              </div>
            )}
            <img
              src={work.thumbnail || 'https://via.placeholder.com/280x200?text=No+Image'}
              alt=""
              className="w-full h-full object-contain bg-gray-800"
              crossOrigin="anonymous"
              draggable={false}
              style={{ display: hasError ? 'none' : 'block' }}
              onError={(e) => {
                console.error('[WorkCardItem] Image load error for work', work.id, ':', work.thumbnail);
                setIsLoading(false);
                setHasError(true);
              }}
              onLoad={() => {
                console.log('[WorkCardItem] Image loaded for work', work.id);
                setIsLoading(false);
                setHasError(false);
              }}
            />
          </>
        )}

        {/* 悬停遮罩 */}
        <div 
          className={`absolute inset-0 transition-opacity duration-200 ${
            isSelected ? 'opacity-100' : 'opacity-0 hover:opacity-100'
          }`}
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 100%)',
          }}
        >
          {/* 引用按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMention?.(work);
            }}
            className="absolute top-2 right-11 w-7 h-7 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shadow-lg hover:bg-[#7C3AED] transition-colors"
            title="引用此作品"
          >
            <AtSign className="w-4 h-4" />
          </button>

          {/* 删除按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
            title="删除此作品"
          >
            <X className="w-4 h-4" />
          </button>

          {/* 分数标签 */}
          {work.score && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
              <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
              <span className="text-white text-xs font-medium">{work.score}分</span>
            </div>
          )}

          {/* 类型标签 */}
          {isVideo && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-blue-500/80 backdrop-blur-sm">
              <span className="text-white text-[10px] font-medium">视频</span>
            </div>
          )}
        </div>
      </div>

      {/* 阴影效果 */}
      <div 
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: isDark 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      />
    </motion.div>
  );
}
