import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCanvasStore, WorkItem } from '../hooks/useCanvasStore';
import { WorkCard } from './WorkCard';
import { CanvasControls } from './CanvasControls';
import { EmptyState } from './EmptyState';
import { Loader2 } from 'lucide-react';

interface DraggableCanvasProps {
  isGenerating?: boolean;
  onWorkSelect?: (work: WorkItem) => void;
  onWorkDelete?: (id: string) => void;
  onWorkDownload?: (work: WorkItem) => void;
}

export const DraggableCanvas: React.FC<DraggableCanvasProps> = ({
  isGenerating = false,
  onWorkSelect,
  onWorkDelete,
  onWorkDownload,
}) => {
  const { isDark } = useTheme();
  const {
    works,
    selectedWorkId,
    canvasPosition,
    canvasZoom,
    selectedTool,
    showGrid,
    viewMode,
    isDragging: isCanvasDragging,
    isSpacePressed,
    setCanvasPosition,
    setCanvasZoom,
    selectWork,
    updateWorkPosition,
    updateWork,
    setIsDragging: setIsCanvasDragging,
    setIsSpacePressed,
    resetCanvas,
    setSelectedTool,
    setShowGrid,
  } = useCanvasStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const rafRef = useRef<number | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const previousToolRef = useRef(selectedTool);
  const [isCardDragging, setIsCardDragging] = useState(false);

  // 处理画布鼠标按下
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 如果正在拖拽卡片，不处理画布拖拽
    if (isCardDragging) return;

    // 检查是否点击在卡片上
    const target = e.target as HTMLElement;
    if (target.closest('[data-work-card]')) return;

    // 只有在抓手工具、按住空格键、按住中键或Shift键时才允许拖拽
    if (selectedTool === 'hand' || isSpacePressed || e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      e.stopPropagation();
      setIsCanvasDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: canvasPosition.x,
        posY: canvasPosition.y,
      };
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, [canvasPosition, selectedTool, isSpacePressed, isCardDragging, setIsCanvasDragging]);

  // 处理画布鼠标移动
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isCanvasDragging) return;
    e.preventDefault();
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        const deltaX = lastMousePos.current.x - dragStartRef.current.x;
        const deltaY = lastMousePos.current.y - dragStartRef.current.y;
        setCanvasPosition({
          x: dragStartRef.current.posX + deltaX,
          y: dragStartRef.current.posY + deltaY,
        });
        rafRef.current = null;
      });
    }
  }, [isCanvasDragging, setCanvasPosition]);

  // 处理画布鼠标释放
  const handleMouseUp = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsCanvasDragging(false);
  }, [setIsCanvasDragging]);

  // 全局鼠标事件监听
  useEffect(() => {
    if (!isCanvasDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          const deltaX = lastMousePos.current.x - dragStartRef.current.x;
          const deltaY = lastMousePos.current.y - dragStartRef.current.y;
          setCanvasPosition({
            x: dragStartRef.current.posX + deltaX,
            y: dragStartRef.current.posY + deltaY,
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
      setIsCanvasDragging(false);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove, { capture: true });
    document.addEventListener('mouseup', handleGlobalMouseUp, { capture: true });

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove, { capture: true });
      document.removeEventListener('mouseup', handleGlobalMouseUp, { capture: true });
    };
  }, [isCanvasDragging, setCanvasPosition, setIsCanvasDragging]);

  // 滚轮事件处理
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
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

      // Ctrl+滚轮：缩放画布
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setCanvasZoom(Math.max(10, Math.min(300, canvasZoom * delta)));
      } else {
        // 普通滚轮：平移画布
        const scrollSpeed = 1.5;
        setCanvasPosition({
          x: canvasPosition.x - e.deltaX * scrollSpeed,
          y: canvasPosition.y - e.deltaY * scrollSpeed,
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [canvasZoom, canvasPosition, setCanvasZoom, setCanvasPosition]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        setIsSpacePressed(true);
        previousToolRef.current = selectedTool;
        setSelectedTool('hand');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        if (selectedTool === 'hand' && previousToolRef.current !== 'hand') {
          setSelectedTool(previousToolRef.current);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedTool, setSelectedTool, setIsSpacePressed]);

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
      backgroundPosition: `${canvasPosition.x % gridSize}px ${canvasPosition.y % gridSize}px`,
    };
  }, [showGrid, isDark, canvasPosition]);

  // 光标样式
  const cursorStyle = useMemo(() => {
    if (isCanvasDragging) return 'grabbing';
    if (isSpacePressed || selectedTool === 'hand') return 'grab';
    if (selectedTool === 'move') return 'move';
    return 'default';
  }, [isCanvasDragging, isSpacePressed, selectedTool]);

  // 画布变换样式
  const canvasStyle = useMemo(() => ({
    transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${canvasZoom / 100})`,
    transformOrigin: 'center center',
    willChange: isCanvasDragging ? 'transform' : 'auto',
  }), [canvasPosition, canvasZoom, isCanvasDragging]);

  // 处理作品选择
  const handleWorkSelect = useCallback((work: WorkItem) => {
    if (!isCardDragging) {
      selectWork(work.id);
      onWorkSelect?.(work);
    }
  }, [isCardDragging, selectWork, onWorkSelect]);

  // 处理作品位置更新
  const handleWorkPositionChange = useCallback((id: string, x: number, y: number) => {
    updateWorkPosition(id, { x, y });
  }, [updateWorkPosition]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${isDark ? 'bg-[#0a0f0a]' : 'bg-gray-50'}`}
      style={{ cursor: cursorStyle }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 网格背景 */}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={gridStyle}
        />
      )}

      {/* 画布内容 */}
      <div
        className="absolute inset-0 z-10"
        style={canvasStyle}
      >
        <div className="min-w-full min-h-full p-20">
          {works.length === 0 && !isGenerating ? (
            <EmptyState />
          ) : (
            <div className={`${viewMode === 'grid' ? 'grid grid-cols-3 gap-12' : 'flex flex-wrap gap-16'} justify-center`}>
              <AnimatePresence>
                {works.map((work, index) => (
                  <WorkCard
                    key={work.id}
                    work={work}
                    isSelected={selectedWorkId === work.id}
                    viewMode={viewMode}
                    canvasZoom={canvasZoom}
                    onSelect={() => handleWorkSelect(work)}
                    onPositionChange={(x, y) => handleWorkPositionChange(work.id, x, y)}
                    onDelete={() => onWorkDelete?.(work.id)}
                    onDownload={() => onWorkDownload?.(work)}
                    onDragStart={() => setIsCardDragging(true)}
                    onDragEnd={() => setIsCardDragging(false)}
                  />
                ))}
              </AnimatePresence>
              
              {/* 生成中状态 */}
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed ${
                    isDark 
                      ? 'border-gray-700 bg-gray-800/50' 
                      : 'border-gray-300 bg-gray-100/50'
                  }`}
                  style={{
                    width: viewMode === 'grid' ? 320 : 448,
                    height: 400,
                  }}
                >
                  <Loader2 className={`w-12 h-12 animate-spin mb-4 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    AI 正在创作中...
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    请稍候，精彩即将呈现
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 画布控制工具栏 */}
      <CanvasControls
        zoom={canvasZoom}
        onZoomChange={setCanvasZoom}
        onReset={resetCanvas}
        onToolChange={setSelectedTool}
        selectedTool={selectedTool}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        viewMode={viewMode}
        onViewModeChange={(mode) => useCanvasStore.setState({ viewMode: mode })}
      />
    </div>
  );
};

export default DraggableCanvas;
