import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore } from '../../hooks/useAgentStore';
import CanvasControls from './CanvasControls';

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
    setCanvasZoom, 
    setCanvasPosition,
    selectedTool,
    setSelectedTool,
    resetCanvas
  } = useAgentStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // 使用 requestAnimationFrame 优化拖拽性能
  const rafRef = useRef<number | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 只有在使用抓手工具或按住中键/Shift键时才允许拖拽
    if (selectedTool === 'hand' || e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      e.stopPropagation();
      
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: canvasPosition.x,
        posY: canvasPosition.y
      };
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, [canvasPosition, selectedTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    
    // 使用 requestAnimationFrame 优化性能
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        const deltaX = lastMousePos.current.x - dragStartRef.current.x;
        const deltaY = lastMousePos.current.y - dragStartRef.current.y;
        
        setCanvasPosition({
          x: dragStartRef.current.posX + deltaX,
          y: dragStartRef.current.posY + deltaY
        });
        
        rafRef.current = null;
      });
    }
  }, [isDragging, setCanvasPosition]);

  const handleMouseUp = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsDragging(false);
  }, []);

  // 添加全局鼠标事件监听，防止拖拽时鼠标移出画布
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(() => {
            const deltaX = lastMousePos.current.x - dragStartRef.current.x;
            const deltaY = lastMousePos.current.y - dragStartRef.current.y;
            
            setCanvasPosition({
              x: dragStartRef.current.posX + deltaX,
              y: dragStartRef.current.posY + deltaY
            });
            
            rafRef.current = null;
          });
        }
      };

      const handleGlobalMouseUp = () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        setIsDragging(false);
      };

      // 使用 capture 阶段确保事件被捕获
      document.addEventListener('mousemove', handleGlobalMouseMove, { capture: true });
      document.addEventListener('mouseup', handleGlobalMouseUp, { capture: true });
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove, { capture: true });
        document.removeEventListener('mouseup', handleGlobalMouseUp, { capture: true });
      };
    }
  }, [isDragging, setCanvasPosition]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setCanvasZoom(Math.max(50, Math.min(200, canvasZoom * delta)));
    }
  }, [canvasZoom, setCanvasZoom]);

  const handleReset = useCallback(() => {
    resetCanvas();
    setCanvasPosition({ x: 0, y: 0 });
    setCanvasZoom(100);
  }, [resetCanvas, setCanvasPosition, setCanvasZoom]);

  const handleToggleGrid = useCallback(() => {
    setShowGrid(prev => !prev);
  }, []);

  // 网格背景样式
  const gridStyle = useMemo(() => {
    if (!showGrid) return {};
    
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const gridSize = 20;
    
    return {
      backgroundImage: `
        linear-gradient(${gridColor} 1px, transparent 1px),
        linear-gradient(90deg, ${gridColor} 1px, transparent 1px)
      `,
      backgroundSize: `${gridSize}px ${gridSize}px`,
      backgroundPosition: `${canvasPosition.x % gridSize}px ${canvasPosition.y % gridSize}px`
    };
  }, [showGrid, isDark, canvasPosition]);

  // 根据工具设置光标样式
  const cursorStyle = useMemo(() => {
    if (isDragging) return 'grabbing';
    if (selectedTool === 'hand') return 'grab';
    if (selectedTool === 'move') return 'move';
    return 'default';
  }, [isDragging, selectedTool]);

  // 画布变换样式 - 使用 will-change 优化性能
  const canvasStyle = useMemo(() => ({
    transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${canvasZoom / 100})`,
    transformOrigin: 'center center',
    willChange: isDragging ? 'transform' : 'auto',
  }), [canvasPosition, canvasZoom, isDragging]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      style={{ cursor: cursorStyle, touchAction: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* 网格背景层 */}
      {showGrid && (
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={gridStyle}
        />
      )}
      
      {/* 画布内容 - 简化结构，移除嵌套的 CanvasContent */}
      <div 
        className="absolute inset-0 flex items-center justify-center z-10"
        style={canvasStyle}
      >
        <div className={`relative ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {children}
        </div>
      </div>

      {/* 控制工具栏 */}
      <CanvasControls 
        zoom={canvasZoom}
        onZoomChange={setCanvasZoom}
        onReset={handleReset}
        onToolChange={setSelectedTool}
        selectedTool={selectedTool}
        showGrid={showGrid}
        onToggleGrid={handleToggleGrid}
      />
    </div>
  );
});

export default DraggableCanvas;
