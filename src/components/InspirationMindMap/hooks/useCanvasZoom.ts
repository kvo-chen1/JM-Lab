import { useState, useCallback, useRef, useEffect } from 'react';

interface ViewportState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface UseCanvasZoomReturn {
  viewport: ViewportState;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  pan: (deltaX: number, deltaY: number) => void;
  setZoom: (scale: number) => void;
  handleWheel: (e: React.WheelEvent) => void;
  getTransformStyle: () => React.CSSProperties;
  getMousePosition: (e: React.MouseEvent) => { x: number; y: number };
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.1;

export const useCanvasZoom = (
  containerRef: React.RefObject<HTMLElement | null>
): UseCanvasZoomReturn => {
  const [viewport, setViewport] = useState<ViewportState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // 放大
  const zoomIn = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      scale: Math.min(prev.scale + ZOOM_STEP, MAX_SCALE),
    }));
  }, []);

  // 缩小
  const zoomOut = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      scale: Math.max(prev.scale - ZOOM_STEP, MIN_SCALE),
    }));
  }, []);

  // 重置缩放
  const resetZoom = useCallback(() => {
    setViewport({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });
  }, []);

  // 平移
  const pan = useCallback((deltaX: number, deltaY: number) => {
    setViewport(prev => ({
      ...prev,
      offsetX: prev.offsetX + deltaX / prev.scale,
      offsetY: prev.offsetY + deltaY / prev.scale,
    }));
  }, []);

  // 设置缩放级别
  const setZoom = useCallback((scale: number) => {
    setViewport(prev => ({
      ...prev,
      scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale)),
    }));
  }, []);

  // 处理滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewport.scale + delta));
    
    // 以鼠标位置为中心缩放
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const scaleRatio = newScale / viewport.scale;
      
      setViewport(prev => ({
        scale: newScale,
        offsetX: mouseX / prev.scale - mouseX / newScale + prev.offsetX,
        offsetY: mouseY / prev.scale - mouseY / newScale + prev.offsetY,
      }));
    } else {
      setZoom(newScale);
    }
  }, [viewport.scale, containerRef, setZoom]);

  // 获取变换样式
  const getTransformStyle = useCallback((): React.CSSProperties => {
    return {
      transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.scale})`,
      transformOrigin: '0 0',
    };
  }, [viewport]);

  // 获取鼠标在画布上的位置
  const getMousePosition = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - viewport.offsetX) / viewport.scale;
    const y = (e.clientY - rect.top - viewport.offsetY) / viewport.scale;
    
    return { x, y };
  }, [viewport, containerRef]);

  // 处理空格键 + 拖拽平移
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        isPanning.current = true;
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grabbing';
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isPanning.current = false;
        if (containerRef.current) {
          containerRef.current.style.cursor = 'default';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [containerRef]);

  return {
    viewport,
    zoomIn,
    zoomOut,
    resetZoom,
    pan,
    setZoom,
    handleWheel,
    getTransformStyle,
    getMousePosition,
  };
};

export default useCanvasZoom;
