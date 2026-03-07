import { useState, useCallback, useRef } from 'react';

export interface WorkPosition {
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
}

interface DragState {
  isDragging: boolean;
  draggedWorkId: number | null;
  dragOffset: { x: number; y: number };
}

interface UseWorkDragReturn {
  dragState: DragState;
  startDrag: (e: React.MouseEvent, workId: number, currentPos: WorkPosition) => void;
  updateDrag: (e: React.MouseEvent, onPositionChange: (id: number, pos: WorkPosition) => void) => void;
  endDrag: () => void;
}

export function useWorkDrag(scale: number = 1): UseWorkDragReturn {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedWorkId: null,
    dragOffset: { x: 0, y: 0 },
  });

  const dragStartPosRef = useRef({ x: 0, y: 0 });

  const startDrag = useCallback((e: React.MouseEvent, workId: number, currentPos: WorkPosition) => {
    e.stopPropagation();
    e.preventDefault();
    
    dragStartPosRef.current = {
      x: currentPos.x,
      y: currentPos.y,
    };

    setDragState({
      isDragging: true,
      draggedWorkId: workId,
      dragOffset: {
        x: e.clientX,
        y: e.clientY,
      },
    });
  }, []);

  const updateDrag = useCallback((e: React.MouseEvent, onPositionChange: (id: number, pos: WorkPosition) => void) => {
    if (!dragState.isDragging || dragState.draggedWorkId === null) return;

    const deltaX = (e.clientX - dragState.dragOffset.x) / scale;
    const deltaY = (e.clientY - dragState.dragOffset.y) / scale;

    const newPosition: WorkPosition = {
      x: dragStartPosRef.current.x + deltaX,
      y: dragStartPosRef.current.y + deltaY,
    };

    onPositionChange(dragState.draggedWorkId, newPosition);
  }, [dragState, scale]);

  const endDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedWorkId: null,
      dragOffset: { x: 0, y: 0 },
    });
  }, []);

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
  };
}

// 生成默认的作品排列位置
export function generateDefaultPositions(
  workIds: number[],
  containerWidth: number = 1200,
  containerHeight: number = 800,
  cardWidth: number = 280,
  cardHeight: number = 200
): Map<number, WorkPosition> {
  const positions = new Map<number, WorkPosition>();
  const cols = Math.floor(containerWidth / (cardWidth + 40));
  const startX = (containerWidth - (cols * (cardWidth + 40) - 40)) / 2;
  const startY = 100;

  workIds.forEach((id, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    positions.set(id, {
      x: startX + col * (cardWidth + 40),
      y: startY + row * (cardHeight + 40),
      rotation: 0,
      scale: 1,
    });
  });

  return positions;
}
