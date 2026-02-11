import { useState, useCallback, useRef } from 'react';
import { NodePosition } from '../types';

interface DragState {
  isDragging: boolean;
  draggedNodeId: string | null;
  dragOffset: { x: number; y: number };
}

interface UseNodeDragReturn {
  dragState: DragState;
  handleMouseDown: (e: React.MouseEvent, nodeId: string, position: NodePosition) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  getNodePosition: (nodeId: string, defaultPosition: NodePosition) => NodePosition;
}

export const useNodeDrag = (
  scale: number,
  onPositionChange?: (nodeId: string, position: { x: number; y: number }) => void
): UseNodeDragReturn => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedNodeId: null,
    dragOffset: { x: 0, y: 0 },
  });
  
  // 使用 ref 存储覆盖后的位置，避免频繁重渲染
  const overriddenPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  const handleMouseDown = useCallback((
    e: React.MouseEvent,
    nodeId: string,
    position: NodePosition
  ) => {
    e.stopPropagation();
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const offsetX = (e.clientX - rect.left) / scale;
    const offsetY = (e.clientY - rect.top) / scale;
    
    setDragState({
      isDragging: true,
      draggedNodeId: nodeId,
      dragOffset: { x: offsetX, y: offsetY },
    });
  }, [scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedNodeId) return;
    
    const canvasRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - canvasRect.left) / scale - dragState.dragOffset.x;
    const y = (e.clientY - canvasRect.top) / scale - dragState.dragOffset.y;
    
    // 更新覆盖位置
    overriddenPositions.current.set(dragState.draggedNodeId, { x, y });
    
    // 触发位置变化回调
    if (onPositionChange) {
      onPositionChange(dragState.draggedNodeId, { x, y });
    }
  }, [dragState, scale, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedNodeId: null,
      dragOffset: { x: 0, y: 0 },
    });
  }, []);

  const getNodePosition = useCallback((
    nodeId: string,
    defaultPosition: NodePosition
  ): NodePosition => {
    // 如果正在拖拽该节点，使用拖拽位置
    if (dragState.draggedNodeId === nodeId && dragState.isDragging) {
      const overridden = overriddenPositions.current.get(nodeId);
      if (overridden) {
        return { ...defaultPosition, ...overridden };
      }
    }
    
    // 如果有覆盖位置，使用覆盖位置
    const overridden = overriddenPositions.current.get(nodeId);
    if (overridden) {
      return { ...defaultPosition, ...overridden };
    }
    
    return defaultPosition;
  }, [dragState]);

  return {
    dragState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    getNodePosition,
  };
};

export default useNodeDrag;
