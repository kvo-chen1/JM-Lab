import React, { useCallback, useMemo } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore } from '../../hooks/useAgentStore';
import CanvasControls from './CanvasControls';
import CanvasContent from './CanvasContent';

interface DraggableCanvasProps {
  children: React.ReactNode;
}

const DraggableCanvas = React.memo(function DraggableCanvas({ 
  children 
}: DraggableCanvasProps) {
  const { isDark } = useTheme();
  const { 
    canvasZoom, 
    canvasPosition, 
    selectedTool, 
    setCanvasZoom, 
    setCanvasPosition, 
    setSelectedTool, 
    resetCanvas 
  } = useAgentStore();
  const [isDragging, setIsDragging] = React.useState(false);

  // 处理缩放变化
  const handleZoomChange = useCallback((newZoom: number) => {
    setCanvasZoom(newZoom);
  }, [setCanvasZoom]);

  // 处理位置变化
  const handlePositionChange = useCallback((newPosition: { x: number; y: number }) => {
    setCanvasPosition(newPosition);
  }, [setCanvasPosition]);

  // 处理工具变化
  const handleToolChange = useCallback((tool: 'select' | 'move' | 'hand') => {
    setSelectedTool(tool);
  }, [setSelectedTool]);

  // 处理拖拽开始
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 处理滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -5 : 5;
    const newZoom = Math.max(10, Math.min(canvasZoom + delta, 200));
    handleZoomChange(newZoom);
  }, [canvasZoom, handleZoomChange]);

  // 缓存事件处理函数，避免不必要的重新渲染
  const canvasProps = useMemo(() => ({
    zoom: canvasZoom,
    position: canvasPosition,
    selectedTool,
    isDragging,
    onPositionChange: handlePositionChange,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd
  }), [canvasZoom, canvasPosition, selectedTool, isDragging, handlePositionChange, handleDragStart, handleDragEnd]);

  const controlsProps = useMemo(() => ({
    zoom: canvasZoom,
    onZoomChange: handleZoomChange,
    onReset: resetCanvas,
    onToolChange: handleToolChange,
    selectedTool
  }), [canvasZoom, handleZoomChange, resetCanvas, handleToolChange, selectedTool]);

  return (
    <div className="relative w-full h-full" onWheel={handleWheel}>
      {/* 画布内容 */}
      <CanvasContent {...canvasProps}>
        {children}
      </CanvasContent>

      {/* 画布控制工具栏 */}
      <CanvasControls {...controlsProps} />
    </div>
  );
});

export default DraggableCanvas;
