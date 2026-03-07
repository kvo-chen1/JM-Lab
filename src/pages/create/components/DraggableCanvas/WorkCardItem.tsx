import React from 'react';
import { motion } from 'framer-motion';
import { Play, X, Star } from 'lucide-react';
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
}

export default function WorkCardItem({
  work,
  position,
  isSelected,
  isDragging,
  scale,
  onSelect,
  onDoubleClick,
  onDragStart,
  onDelete,
}: WorkCardItemProps) {
  const { isDark } = useTheme();
  const isVideo = work.type === 'video' || work.video;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: isDragging ? 1.05 : 1,
        x: position.x,
        y: position.y,
        rotate: position.rotation || 0,
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 30,
        opacity: { duration: 0.2 },
      }}
      className="absolute"
      style={{
        width: 280,
        height: 200,
        zIndex: isDragging ? 100 : isSelected ? 50 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={onDragStart}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={onDoubleClick}
    >
      {/* 选中状态边框 */}
      {isSelected && (
        <motion.div
          layoutId={`selection-${work.id}`}
          className="absolute -inset-2 rounded-2xl border-2 border-blue-500 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2)',
          }}
        >
          {/* 控制点 */}
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
        </motion.div>
      )}

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
              className="w-full h-full object-cover"
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
          <img
            src={work.thumbnail || 'https://via.placeholder.com/280x200?text=No+Image'}
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/280x200?text=No+Image';
            }}
          />
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
          {/* 删除按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
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
