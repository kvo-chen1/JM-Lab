import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import CanvasBackground from './CanvasBackground';
import CanvasControls, { type ToolMode } from './CanvasControls';
import WorkCardItem from './WorkCardItem';
import { useCanvasZoom, useCanvasPan, useWorkDrag, useCanvasKeyboard } from './hooks';
import type { GeneratedResult } from '../../types';
import type { WorkPosition } from './hooks';

interface DraggableCanvasProps {
  works: GeneratedResult[];
  selectedWorkId: number | null;
  onSelectWork: (id: number | null) => void;
  onDeleteWork: (id: number) => void;
  onDoubleClickWork?: (work: GeneratedResult) => void;
  className?: string;
}

export default function DraggableCanvas({
  works,
  selectedWorkId,
  onSelectWork,
  onDeleteWork,
  onDoubleClickWork,
  className = '',
}: DraggableCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [showGrid, setShowGrid] = useState(true);

  // 作品位置状态
  const [workPositions, setWorkPositions] = useState<Map<number, WorkPosition>>(new Map());

  // 初始化作品位置
  useEffect(() => {
    const calculatePositions = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const containerWidth = container.clientWidth || 800;
      const containerHeight = container.clientHeight || 600;
      
      // 如果容器尺寸为0，延迟重试
      if (containerWidth === 0 || containerHeight === 0) {
        setTimeout(calculatePositions, 100);
        return;
      }

      setWorkPositions(prev => {
        const newPositions = new Map(prev);

        works.forEach((work, index) => {
          if (!newPositions.has(work.id)) {
            // 网格布局计算 - 居中显示
            const cardWidth = 280;
            const cardHeight = 200;
            const gap = 40;
            const cols = Math.max(1, Math.floor(containerWidth / (cardWidth + gap)));
            const col = index % cols;
            const row = Math.floor(index / cols);

            // 计算总宽度和起始位置，使作品居中
            const totalWidth = Math.min(cols, works.length) * (cardWidth + gap) - gap;
            const startX = (containerWidth - totalWidth) / 2;
            const startY = (containerHeight - cardHeight) / 2;

            newPositions.set(work.id, {
              x: startX + col * (cardWidth + gap),
              y: startY + row * (cardHeight + gap),
              rotation: 0,
              scale: 1,
            });
          }
        });

        return newPositions;
      });
    };

    calculatePositions();
  }, [works]);

  // 监听容器尺寸变化，重新计算位置
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        
        // 如果容器尺寸为0，跳过
        if (width === 0 || height === 0) return;
        
        setWorkPositions(prev => {
          const newPositions = new Map(prev);
          
          // 重新计算所有作品位置，使其居中
          const cardWidth = 280;
          const cardHeight = 200;
          const gap = 40;
          const cols = Math.max(1, Math.floor(width / (cardWidth + gap)));
          
          works.forEach((work, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            const totalWidth = Math.min(cols, works.length) * (cardWidth + gap) - gap;
            const startX = (width - totalWidth) / 2;
            const startY = (height - cardHeight) / 2;

            newPositions.set(work.id, {
              x: startX + col * (cardWidth + gap),
              y: startY + row * (cardHeight + gap),
              rotation: 0,
              scale: 1,
            });
          });

          return newPositions;
        });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [works]);

  // 画布缩放
  const { scale, zoomIn, zoomOut, resetZoom, handleWheelZoom } = useCanvasZoom(1);

  // 画布平移 - 初始位置居中
  const { position, isPanning, startPan, updatePan, endPan, resetPosition, setPosition, isSpacePressed } = useCanvasPan(0, 0);

  // 作品拖拽
  const { dragState, startDrag, updateDrag, endDrag } = useWorkDrag(scale);

  // 处理位置更新
  const handlePositionChange = useCallback((workId: number, newPosition: WorkPosition) => {
    setWorkPositions(prev => {
      const next = new Map(prev);
      next.set(workId, newPosition);
      return next;
    });
  }, []);

  // 复制作品
  const handleDuplicateWork = useCallback((workId: number) => {
    const workToDuplicate = works.find(w => w.id === workId);
    const positionToDuplicate = workPositions.get(workId);

    if (!workToDuplicate || !positionToDuplicate) return;

    // 创建新作品（在实际应用中，这里应该调用父组件的回调来真正复制作品）
    // 目前我们只是选择原作品并稍微偏移位置作为视觉反馈
    handlePositionChange(workId, {
      ...positionToDuplicate,
      x: positionToDuplicate.x + 20,
      y: positionToDuplicate.y + 20,
    });
  }, [works, workPositions, handlePositionChange]);

  // 鼠标移动处理
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragState.isDragging) {
      updateDrag(e, handlePositionChange);
    } else if (isPanning) {
      updatePan(e);
    }
  }, [dragState.isDragging, isPanning, updateDrag, updatePan, handlePositionChange]);

  // 鼠标抬起处理
  const handleMouseUp = useCallback(() => {
    endDrag();
    endPan();
  }, [endDrag, endPan]);

  // 鼠标按下处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 中键或按住空格或抓手工具模式时平移
    if (e.button === 1 || isSpacePressed || toolMode === 'pan') {
      startPan(e);
    } else if (e.target === containerRef.current || (e.target as HTMLElement).dataset?.canvas === 'true') {
      // 点击空白处取消选择
      onSelectWork(null);
    }
  }, [toolMode, isSpacePressed, startPan, onSelectWork]);

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.25, Math.min(4, scale * delta));
      // 使用 zoomTo 逻辑
      if (newScale !== scale) {
        // 这里简化处理，实际应该计算鼠标位置的缩放
        if (e.deltaY > 0) {
          zoomOut();
        } else {
          zoomIn();
        }
      }
    }
  }, [scale, zoomIn, zoomOut]);

  // 阻止浏览器默认的 Ctrl+滚轮 缩放行为
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventBrowserZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    // 使用 passive: false 来确保可以阻止默认行为
    container.addEventListener('wheel', preventBrowserZoom, { passive: false });

    return () => {
      container.removeEventListener('wheel', preventBrowserZoom);
    };
  }, []);

  // 使用键盘控制钩子
  const { HelpModal } = useCanvasKeyboard({
    position,
    setPosition,
    scale,
    zoomIn,
    zoomOut,
    resetZoom,
    resetPosition,
    toolMode,
    setToolMode,
    works,
    selectedWorkId,
    onSelectWork,
    onDeleteWork,
    onDuplicateWork: handleDuplicateWork,
    workPositions,
    onPositionChange: handlePositionChange,
  });

  // 处理作品拖拽开始
  const handleWorkDragStart = useCallback((e: React.MouseEvent, workId: number) => {
    if (toolMode !== 'select') return;

    const currentPos = workPositions.get(workId);
    if (currentPos) {
      onSelectWork(workId);
      startDrag(e, workId, currentPos);
    }
  }, [toolMode, workPositions, onSelectWork, startDrag]);

  // 处理双击
  const handleDoubleClick = useCallback((work: GeneratedResult) => {
    onDoubleClickWork?.(work);
  }, [onDoubleClickWork]);

  // 调试日志
  useEffect(() => {
    console.log('[DraggableCanvas] works:', works.length, 'workPositions:', workPositions.size);
    console.log('[DraggableCanvas] container size:', containerRef.current?.clientWidth, 'x', containerRef.current?.clientHeight);
  }, [works, workPositions]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        cursor: isPanning
          ? 'grabbing'
          : isSpacePressed || toolMode === 'pan'
            ? 'grab'
            : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      data-canvas="true"
    >
      {/* 背景 */}
      <CanvasBackground scale={scale} showGrid={showGrid} />

      {/* 画布内容层 */}
      <motion.div
        className="absolute"
        style={{
          left: 0,
          top: 0,
          x: position.x,
          y: position.y,
          scale,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* 作品卡片 */}
        {works.map((work) => {
          const position = workPositions.get(work.id);
          console.log('[DraggableCanvas] Rendering work:', work.id, 'position:', position, 'thumbnail:', work.thumbnail?.substring(0, 50));
          if (!position) return null;

          return (
            <WorkCardItem
              key={work.id}
              work={work}
              position={position}
              isSelected={selectedWorkId === work.id}
              isDragging={dragState.draggedWorkId === work.id}
              scale={scale}
              onSelect={() => onSelectWork(work.id)}
              onDoubleClick={() => handleDoubleClick(work)}
              onDragStart={(e) => handleWorkDragStart(e, work.id)}
              onDelete={() => onDeleteWork(work.id)}
            />
          );
        })}
      </motion.div>

      {/* 控制栏 */}
      <CanvasControls
        toolMode={toolMode}
        onToolModeChange={setToolMode}
        scale={scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={() => {
          resetZoom();
          resetPosition();
        }}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
      />

      {/* 提示信息 */}
      <div className="absolute top-4 left-4 px-3 py-2 rounded-lg backdrop-blur-md bg-white/10 dark:bg-black/20 text-xs text-gray-500 dark:text-gray-400 pointer-events-none select-none">
        <p className="flex items-center gap-2">
          <span>按住空格拖拽画布</span>
          <span className="opacity-50">·</span>
          <span>滚轮缩放</span>
          <span className="opacity-50">·</span>
          <span>V选择 H抓手</span>
          <span className="opacity-50">·</span>
          <span>方向键移动</span>
          <span className="opacity-50">·</span>
          <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">F1</kbd>
          <span>帮助</span>
        </p>
      </div>

      {/* 帮助模态框 */}
      <HelpModal />
    </div>
  );
}

export { CanvasBackground, CanvasControls, WorkCardItem };
export type { ToolMode, WorkPosition };
