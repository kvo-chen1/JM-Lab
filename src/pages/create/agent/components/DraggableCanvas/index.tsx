import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore } from '../../hooks/useAgentStore';
import CanvasControls from './CanvasControls';

interface DraggableCanvasProps {
  children: React.ReactNode;
  onFeedbackClick?: () => void;
}

const DraggableCanvas = React.memo(function DraggableCanvas({ 
  children,
  onFeedbackClick
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
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // 使用 requestAnimationFrame 优化拖拽性能
  const rafRef = useRef<number | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const previousToolRef = useRef<string>('select');

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 只有在使用抓手工具、按住空格键、按住中键或Shift键时才允许拖拽
    if (selectedTool === 'hand' || isSpacePressed || e.button === 1 || (e.button === 0 && e.shiftKey)) {
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
  }, [canvasPosition, selectedTool, isSpacePressed]);

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

  // 使用 useRef 存储最新的状态，避免在事件监听中依赖状态
  const canvasStateRef = useRef({ canvasZoom, canvasPosition });
  useEffect(() => {
    canvasStateRef.current = { canvasZoom, canvasPosition };
  }, [canvasZoom, canvasPosition]);

  // 滚轮事件处理 - 使用原生事件监听以确保 preventDefault 生效
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // 只有在鼠标在画布区域内时才处理
      const rect = container.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const { canvasZoom: currentZoom, canvasPosition: currentPos } = canvasStateRef.current;

      // Ctrl+滚轮：缩放画布
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setCanvasZoom(Math.max(50, Math.min(200, currentZoom * delta)));
      } else {
        // 普通滚轮：平移画布（上下左右滚动）
        const scrollSpeed = 1.5; // 滚动速度系数
        setCanvasPosition({
          x: currentPos.x - e.deltaX * scrollSpeed,
          y: currentPos.y - e.deltaY * scrollSpeed
        });
      }
    };

    // 使用非 passive 模式添加事件监听
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [setCanvasZoom, setCanvasPosition]);

  // 空格键按下/释放处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        // 避免在输入框中触发
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        setIsSpacePressed(true);
        // 保存当前工具，切换到抓手工具
        previousToolRef.current = selectedTool;
        setSelectedTool('hand');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        // 恢复之前的工具
        if (selectedTool === 'hand' && previousToolRef.current !== 'hand') {
          setSelectedTool(previousToolRef.current as 'select' | 'move' | 'hand');
        }
      }
    };

    // 阻止浏览器默认的Ctrl+滚轮缩放行为
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [selectedTool, setSelectedTool]);

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
    if (isSpacePressed || selectedTool === 'hand') return 'grab';
    if (selectedTool === 'move') return 'move';
    return 'default';
  }, [isDragging, isSpacePressed, selectedTool]);

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
    >
      {/* 网格背景层 */}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={gridStyle}
        />
      )}

      {/* 画布内容 - 使用滚轮平移 */}
      <div
        className="absolute inset-0 z-10 overflow-hidden"
        style={canvasStyle}
      >
        <div className={`min-w-full min-h-full p-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
        onFeedbackClick={onFeedbackClick}
      />
    </div>
  );
});

export default DraggableCanvas;
