import { useState, useCallback, useRef } from 'react';

interface ZoomState {
  scale: number;
  setScale: (scale: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (scale: number) => void;
  resetZoom: () => void;
  handleWheelZoom: (e: React.WheelEvent, containerRef: React.RefObject<HTMLElement>) => void;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const ZOOM_STEP = 1.2;

export function useCanvasZoom(initialScale = 1): ZoomState {
  const [scale, setScaleState] = useState(initialScale);
  const scaleRef = useRef(scale);

  const setScale = useCallback((newScale: number) => {
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    scaleRef.current = clampedScale;
    setScaleState(clampedScale);
  }, []);

  const zoomIn = useCallback(() => {
    setScale(scaleRef.current * ZOOM_STEP);
  }, [setScale]);

  const zoomOut = useCallback(() => {
    setScale(scaleRef.current / ZOOM_STEP);
  }, [setScale]);

  const zoomTo = useCallback((targetScale: number) => {
    setScale(targetScale);
  }, [setScale]);

  const resetZoom = useCallback(() => {
    setScale(1);
  }, [setScale]);

  const handleWheelZoom = useCallback((e: React.WheelEvent, containerRef: React.RefObject<HTMLElement>) => {
    if (!containerRef.current) return;
    
    // 检查是否按住了 Ctrl 或 Meta 键，或者是在画布区域滚动
    const isZoomGesture = e.ctrlKey || e.metaKey;
    
    if (isZoomGesture) {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // 计算缩放前的鼠标位置相对于画布中心
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const mouseOffsetX = mouseX - centerX;
      const mouseOffsetY = mouseY - centerY;
      
      // 计算新的缩放比例
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scaleRef.current * delta));
      
      setScale(newScale);
    }
  }, [setScale]);

  return {
    scale,
    setScale,
    zoomIn,
    zoomOut,
    zoomTo,
    resetZoom,
    handleWheelZoom,
  };
}
