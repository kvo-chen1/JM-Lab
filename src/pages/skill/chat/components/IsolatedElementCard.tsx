import React, { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import type { IsolatedElement } from '../hooks/useCanvasStore';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface IsolatedElementCardProps {
  element: IsolatedElement;
  isSelected: boolean;
  canvasZoom: number;
  onSelect: () => void;
  onPositionChange: (x: number, y: number) => void;
  onTransformChange: (transform: Partial<IsolatedElement['transform']>) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export const IsolatedElementCard: React.FC<IsolatedElementCardProps> = ({
  element,
  isSelected,
  canvasZoom,
  onSelect,
  onPositionChange,
  onTransformChange,
  onDragStart,
  onDragEnd,
}) => {
  const { isDark } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // 计算变换样式
  const transformStyle: React.CSSProperties = {
    position: 'absolute',
    left: element.position.x,
    top: element.position.y,
    width: element.position.width || element.originalBounds.width,
    height: element.position.height || element.originalBounds.height,
    transform: `
      scale(${element.transform.scale})
      rotate(${element.transform.rotation}deg)
      scaleX(${element.transform.flipX ? -1 : 1})
      scaleY(${element.transform.flipY ? -1 : 1})
    `,
    filter: `
      brightness(${element.style.brightness}%)
      contrast(${element.style.contrast}%)
      saturate(${element.style.saturation}%)
      hue-rotate(${element.style.hue}deg)
      opacity(${element.style.opacity}%)
    `,
    mixBlendMode: element.style.blendMode as any,
    zIndex: element.zIndex,
    opacity: element.isVisible ? 1 : 0.3,
    cursor: element.isLocked ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
    pointerEvents: element.isLocked ? 'none' : 'auto',
  };

  // 处理拖拽开始
  const handleDragStart = useCallback(() => {
    if (element.isLocked) return;
    setIsDragging(true);
    onDragStart();
  }, [element.isLocked, onDragStart]);

  // 处理拖拽结束
  const handleDragEnd = useCallback((_: any, info: any) => {
    if (element.isLocked) return;
    setIsDragging(false);
    
    // 计算新位置（考虑画布缩放）
    const scale = canvasZoom / 100;
    const newX = element.position.x + info.offset.x / scale;
    const newY = element.position.y + info.offset.y / scale;
    
    onPositionChange(newX, newY);
    onDragEnd();
  }, [element.isLocked, element.position.x, element.position.y, canvasZoom, onPositionChange, onDragEnd]);

  // 处理点击选择
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  }, [onSelect]);

  // 处理缩放
  const handleScale = useCallback((delta: number) => {
    const newScale = Math.max(0.1, Math.min(5, element.transform.scale + delta));
    onTransformChange({ scale: newScale });
  }, [element.transform.scale, onTransformChange]);

  // 处理旋转
  const handleRotate = useCallback((delta: number) => {
    const newRotation = element.transform.rotation + delta;
    onTransformChange({ rotation: newRotation });
  }, [element.transform.rotation, onTransformChange]);

  if (!element.isVisible && !isSelected) {
    return null; // 隐藏且未选中的元素不渲染
  }

  return (
    <motion.div
      drag={!element.isLocked}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      style={transformStyle}
      className={`
        group relative rounded-lg overflow-hidden
        ${isSelected 
          ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent' 
          : 'hover:ring-1 hover:ring-purple-300 hover:ring-offset-1 hover:ring-offset-transparent'
        }
        ${element.isLocked ? 'opacity-70' : ''}
        transition-shadow duration-150
      `}
      whileHover={{ scale: element.isLocked ? 1 : 1.02 }}
      whileTap={{ scale: element.isLocked ? 1 : 0.98 }}
    >
      {/* 元素图片 */}
      <img
        src={element.isolatedImageUrl}
        alt={element.name}
        className="w-full h-full object-contain"
        draggable={false}
      />

      {/* 选中时的控制点 */}
      {isSelected && !element.isLocked && (
        <>
          {/* 四角控制点 */}
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white shadow-sm" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white shadow-sm" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white shadow-sm" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white shadow-sm" />

          {/* 旋转控制 */}
          <div 
            className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500 text-white text-xs shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => handleRotate(-15)}
              className="hover:bg-purple-600 rounded px-1"
            >
              ↺
            </button>
            <span className="text-[10px]">{Math.round(element.transform.rotation)}°</span>
            <button 
              onClick={() => handleRotate(15)}
              className="hover:bg-purple-600 rounded px-1"
            >
              ↻
            </button>
          </div>

          {/* 缩放控制 */}
          <div 
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500 text-white text-xs shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => handleScale(-0.1)}
              className="hover:bg-purple-600 rounded px-1"
            >
              −
            </button>
            <span className="text-[10px]">{Math.round(element.transform.scale * 100)}%</span>
            <button 
              onClick={() => handleScale(0.1)}
              className="hover:bg-purple-600 rounded px-1"
            >
              +
            </button>
          </div>
        </>
      )}

      {/* 元素名称标签 */}
      <div className={`
        absolute bottom-0 left-0 right-0 px-2 py-1
        bg-gradient-to-t from-black/60 to-transparent
        text-white text-xs truncate
        opacity-0 group-hover:opacity-100 transition-opacity
        ${isSelected ? 'opacity-100' : ''}
      `}>
        <div className="flex items-center justify-between">
          <span>{element.name}</span>
          <div className="flex items-center gap-1">
            {element.isLocked && <Lock className="w-3 h-3" />}
            {!element.isVisible && <EyeOff className="w-3 h-3" />}
          </div>
        </div>
      </div>

      {/* 锁定遮罩 */}
      {element.isLocked && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-white/50" />
        </div>
      )}
    </motion.div>
  );
};

export default IsolatedElementCard;
