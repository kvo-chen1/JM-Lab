import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import CanvasBackground from './CanvasBackground';
import CanvasControls, { type ToolMode } from './CanvasControls';
import WorkCardItem from './WorkCardItem';
import { useCanvasZoom, useCanvasPan, useWorkDrag, generateDefaultPositions } from './hooks';
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
    setWorkPositions(prev => {
      const newPositions = new Map(prev);
      const containerWidth = containerRef.current?.clientWidth || 1200;
      const containerHeight = containerRef.current?.clientHeight || 800;
      
      works.forEach((work, index) => {
        if (!newPositions.has(work.id)) {
          // 网格布局计算
          const cols = Math.floor(containerWidth / 320);
          const col = index % Math.max(1, cols);
          const row = Math.floor(index / Math.max(1, cols));
          const startX = (containerWidth - Math.min(cols, works.length) * 320 + 40) / 2;
          
          newPositions.set(work.id, {
            x: startX + col * 320,
            y: 100 + row * 240,
            rotation: 0,
            scale: 1,
          });
        }
      });
      
      return newPositions;
    });
  }, [works]);

  // 画布缩放
  const { scale, zoomIn, zoomOut, resetZoom, handleWheelZoom } = useCanvasZoom(1);
  
  // 画布平移
  const { position, isPanning, startPan, updatePan, endPan, resetPosition } = useCanvasPan(
    (containerRef.current?.clientWidth || 1200) / 2 - 600,
    (containerRef.current?.clientHeight || 800) / 2 - 300
  );

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
    // 中键或按住空格时平移
    if (e.button === 1 || toolMode === 'pan') {
      startPan(e);
    } else if (e.target === containerRef.current || (e.target as HTMLElement).dataset?.canvas === 'true') {
      // 点击空白处取消选择
      onSelectWork(null);
    }
  }, [toolMode, startPan, onSelectWork]);

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
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

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setToolMode('select');
          break;
        case 'h':
          setToolMode('pan');
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            resetZoom();
            resetPosition();
          }
          break;
        case 'delete':
        case 'backspace':
          if (selectedWorkId !== null) {
            onDeleteWork(selectedWorkId);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWorkId, onDeleteWork, resetZoom, resetPosition]);

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

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        cursor: isPanning 
          ? 'grabbing' 
          : toolMode === 'pan' 
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
      <div className="absolute top-4 left-4 px-3 py-2 rounded-lg backdrop-blur-md bg-white/10 dark:bg-black/20 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
        <p>按住空格拖拽画布 · 滚轮缩放 · V选择 H拖拽</p>
      </div>
    </div>
  );
}

export { CanvasBackground, CanvasControls, WorkCardItem };
export type { ToolMode, WorkPosition };
