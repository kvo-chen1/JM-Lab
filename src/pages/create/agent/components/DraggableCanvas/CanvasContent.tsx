import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

interface CanvasContentProps {
  children: React.ReactNode;
  zoom?: number;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  selectedTool?: 'select' | 'move' | 'hand';
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const CanvasContent = React.memo(function CanvasContent({
  children,
  zoom = 100,
  position = { x: 0, y: 0 },
  onPositionChange = () => {},
  selectedTool = 'select',
  isDragging = false,
  onDragStart = () => {},
  onDragEnd = () => {}
}: CanvasContentProps) {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDraggingInternal, setIsDraggingInternal] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 处理鼠标按下事件
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (selectedTool === 'hand' || selectedTool === 'move') {
      e.preventDefault();
      setIsDraggingInternal(true);
      onDragStart();
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragOffset(position);
    }
  }, [selectedTool, onDragStart, position]);

  // 处理鼠标移动事件
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDraggingInternal) {
      e.preventDefault();
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      onPositionChange({
        x: dragOffset.x + deltaX,
        y: dragOffset.y + deltaY
      });
    }
  }, [isDraggingInternal, dragStart, dragOffset, onPositionChange]);

  // 处理鼠标释放事件
  const handleMouseUp = useCallback(() => {
    if (isDraggingInternal) {
      setIsDraggingInternal(false);
      onDragEnd();
    }
  }, [isDraggingInternal, onDragEnd]);

  // 处理鼠标离开事件
  const handleMouseLeave = useCallback(() => {
    if (isDraggingInternal) {
      setIsDraggingInternal(false);
      onDragEnd();
    }
  }, [isDraggingInternal, onDragEnd]);

  // 处理滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    // 缩放逻辑在父组件中处理
  }, []);

  // 添加全局事件监听
  useEffect(() => {
    if (isDraggingInternal) {
      // 使用 passive 事件监听器提高性能
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: true });
      document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [isDraggingInternal, handleMouseMove, handleMouseUp, handleMouseLeave]);

  // 计算变换样式
  const transformStyle = useMemo(() => {
    return {
      transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom / 100})`,
      transition: isDragging ? 'none' : 'transform 0.1s ease-out'
    };
  }, [position, zoom, isDragging]);

  // 计算光标样式
  const cursorStyle = useMemo(() => {
    return {
      cursor: selectedTool === 'hand' || isDragging ? 'grabbing' : 
              selectedTool === 'move' ? 'move' : 'default'
    };
  }, [selectedTool, isDragging]);

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full"
      style={cursorStyle}
    >
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        style={transformStyle}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        drag={false} // 禁用 framer-motion 的拖拽，使用自定义拖拽
      >
        <div className={`relative ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {children}
        </div>
      </motion.div>

      {/* 网格背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`w-full h-full ${isDark ? 'bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)]' : 'bg-[radial-gradient(circle,rgba(0,0,0,0.03)_1px,transparent_1px)]'}`} style={{ backgroundSize: '20px 20px' }} />
      </div>
    </div>
  );
});

export default CanvasContent;
