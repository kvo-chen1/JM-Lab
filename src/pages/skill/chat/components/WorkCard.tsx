import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { WorkItem, ViewMode } from '../hooks/useCanvasStore';
import {
  Download,
  Share2,
  Heart,
  Trash2,
  MoreHorizontal,
  Image as ImageIcon,
  FileText,
  Code,
  Palette,
  Loader2,
  AlertCircle,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkCardProps {
  work: WorkItem;
  isSelected: boolean;
  viewMode: ViewMode;
  canvasZoom: number;
  onSelect: () => void;
  onPositionChange: (x: number, y: number) => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export const WorkCard: React.FC<WorkCardProps> = ({
  work,
  isSelected,
  viewMode,
  canvasZoom,
  onSelect,
  onPositionChange,
  onDelete,
  onDownload,
  onDragStart,
  onDragEnd,
}) => {
  const { isDark } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(work.isFavorite || false);

  const cardRef = React.useRef<HTMLDivElement>(null);
  const dragStartPos = React.useRef({ x: 0, y: 0, mouseX: 0, mouseY: 0 });
  const isDraggingRef = React.useRef(false);
  const currentDragPos = React.useRef({ x: 0, y: 0 });

  // 同步 isDragging 状态到 ref
  React.useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  // 根据类型获取图标
  const getTypeIcon = () => {
    switch (work.type) {
      case 'image':
      case 'design':
        return <ImageIcon className="w-4 h-4" />;
      case 'text':
        return <FileText className="w-4 h-4" />;
      case 'code':
        return <Code className="w-4 h-4" />;
      default:
        return <Palette className="w-4 h-4" />;
    }
  };

  // 处理鼠标按下开始拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (viewMode === 'grid') return; // 网格模式下不允许拖拽
    
    // 如果点击的是操作按钮，不触发拖拽
    if ((e.target as HTMLElement).closest('[data-action-button]')) return;

    e.preventDefault();
    e.stopPropagation();

    // 获取当前实际位置
    const currentX = work.position.x;
    const currentY = work.position.y;

    // 记录起始位置
    dragStartPos.current = {
      x: currentX,
      y: currentY,
      mouseX: e.clientX,
      mouseY: e.clientY
    };

    // 初始化当前拖拽位置
    currentDragPos.current = { x: currentX, y: currentY };

    setIsDragging(true);
    onDragStart();
  }, [viewMode, work.position.x, work.position.y, onDragStart]);

  // 使用 useEffect 将鼠标事件绑定到 window，提高拖拽灵敏度
  useEffect(() => {
    if (!isDragging) return;

    // 处理窗口鼠标移动 - 直接操作 DOM，避免频繁重渲染
    const handleWindowMouseMove = (moveEvent: MouseEvent) => {
      // 如果不在拖拽状态，忽略
      if (!isDraggingRef.current) return;

      const scale = (canvasZoom || 100) / 100;
      const deltaX = (moveEvent.clientX - dragStartPos.current.mouseX) / scale;
      const deltaY = (moveEvent.clientY - dragStartPos.current.mouseY) / scale;

      // 计算新位置
      const newX = dragStartPos.current.x + deltaX;
      const newY = dragStartPos.current.y + deltaY;

      // 保存当前拖拽位置
      currentDragPos.current = { x: newX, y: newY };

      // 实时更新 DOM 位置（使用 left/top 而不是 transform，避免与 React 渲染冲突）
      if (cardRef.current) {
        cardRef.current.style.left = `${newX}px`;
        cardRef.current.style.top = `${newY}px`;
      }
    };

    // 处理窗口鼠标释放
    const handleWindowMouseUp = (upEvent: MouseEvent) => {
      // 如果不在拖拽状态，忽略
      if (!isDraggingRef.current) return;

      const scale = (canvasZoom || 100) / 100;
      const deltaX = (upEvent.clientX - dragStartPos.current.mouseX) / scale;
      const deltaY = (upEvent.clientY - dragStartPos.current.mouseY) / scale;

      const newPosition = {
        x: dragStartPos.current.x + deltaX,
        y: dragStartPos.current.y + deltaY
      };

      setIsDragging(false);
      onDragEnd();

      // 延迟通知父组件，确保状态已更新
      requestAnimationFrame(() => {
        onPositionChange(newPosition.x, newPosition.y);
      });

      // 移除事件监听
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging, canvasZoom, onPositionChange, onDragEnd]);

  // 处理下载
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (work.imageUrl) {
      const link = document.createElement('a');
      link.href = work.imageUrl;
      link.download = work.title || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('已开始下载');
    }
    onDownload?.();
  };

  // 处理分享
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href);
    toast.success('链接已复制到剪贴板');
  };

  // 处理收藏
  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? '已取消收藏' : '已添加到收藏');
  };

  // 处理删除
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  // 卡片尺寸
  const cardWidth = viewMode === 'grid' ? 320 : 448;
  const cardHeight = work.type === 'image' || work.type === 'design' ? 400 : 300;

  // 根据拖拽状态返回不同的 transition 配置
  const getTransition = () => {
    if (isDragging) {
      return { duration: 0 }; // 拖拽时无动画
    }
    return {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30
    };
  };

  return (
    <motion.div
      ref={cardRef}
      data-work-card
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: isSelected ? 1.02 : 1,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={getTransition()}
      className={`absolute rounded-2xl overflow-hidden shadow-lg transition-shadow duration-200 ${
        isSelected
          ? 'ring-2 ring-purple-500 shadow-purple-500/20'
          : isHovered
            ? 'shadow-xl'
            : ''
      } ${isDark ? 'bg-[#1a1f1a] border border-gray-800' : 'bg-white border border-gray-200'}`}
      style={{
        width: cardWidth,
        height: cardHeight,
        left: isDragging ? currentDragPos.current.x : work.position.x,
        top: isDragging ? currentDragPos.current.y : work.position.y,
        cursor: viewMode === 'gallery' ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
      }}
      onMouseDown={handleMouseDown}
      onMouseLeave={() => setIsHovered(false)}
      onMouseEnter={() => setIsHovered(true)}
      onClick={onSelect}
    >
      {/* 图片类型内容 */}
      {(work.type === 'image' || work.type === 'design') && work.imageUrl && (
        <div className="relative w-full h-full">
          {/* 图片加载状态 */}
          {!imageLoaded && !imageError && (
            <div className={`absolute inset-0 flex items-center justify-center ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
          )}
          
          {/* 图片错误状态 */}
          {imageError && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>图片加载失败</span>
            </div>
          )}
          
          {/* 实际图片 */}
          <img
            src={work.imageUrl}
            alt={work.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            crossOrigin="anonymous"
          />
          
          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* 状态标签 */}
          {work.status === 'generating' && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              生成中
            </div>
          )}
          
          {work.status === 'error' && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/80 backdrop-blur-sm text-white text-xs">
              <AlertCircle className="w-3 h-3" />
              生成失败
            </div>
          )}
          
          {isFavorite && (
            <div className="absolute top-3 right-3">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            </div>
          )}
        </div>
      )}

      {/* 文本类型内容 */}
      {(work.type === 'text' || work.type === 'code') && (
        <div className={`w-full h-full p-4 overflow-auto ${
          isDark ? 'bg-[#1a1f1a]' : 'bg-white'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {getTypeIcon()}
            <span className={`text-xs font-medium uppercase tracking-wider ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {work.type}
            </span>
          </div>
          <h3 className={`font-semibold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {work.title}
          </h3>
          <p className={`text-sm line-clamp-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {work.content || work.description}
          </p>
        </div>
      )}

      {/* 底部信息栏 */}
      <div className={`absolute bottom-0 left-0 right-0 p-3 transition-opacity duration-200 ${
        isHovered || isSelected ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium truncate max-w-[150px]">
              {work.title}
            </span>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex items-center gap-1">
            <button
              data-action-button
              onClick={handleDownload}
              className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
              title="下载"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              data-action-button
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
              title="分享"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              data-action-button
              onClick={handleFavorite}
              className={`p-1.5 rounded-lg backdrop-blur-sm transition-colors ${
                isFavorite 
                  ? 'bg-red-500/80 text-white' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title={isFavorite ? '取消收藏' : '收藏'}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              data-action-button
              onClick={handleDelete}
              className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-red-500/80 transition-colors"
              title="删除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 选中指示器 */}
      {isSelected && (
        <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
};

export default WorkCard;
