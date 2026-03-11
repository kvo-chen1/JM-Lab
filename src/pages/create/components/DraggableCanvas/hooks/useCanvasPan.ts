import { useState, useCallback, useRef, useEffect } from 'react';

interface PanState {
  position: { x: number; y: number };
  isPanning: boolean;
  isSpacePressed: boolean;
  setPosition: (pos: { x: number; y: number }) => void;
  startPan: (e: React.MouseEvent) => void;
  updatePan: (e: React.MouseEvent) => void;
  endPan: () => void;
  resetPosition: () => void;
  centerOnPoint: (x: number, y: number, containerWidth: number, containerHeight: number) => void;
}

export function useCanvasPan(initialX = 0, initialY = 0): PanState {
  const [position, setPositionState] = useState({ x: initialX, y: initialY });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: initialX, y: initialY });

  const setPosition = useCallback((newPos: { x: number; y: number }) => {
    positionRef.current = newPos;
    setPositionState(newPos);
  }, []);

  const startPan = useCallback((e: React.MouseEvent) => {
    // 只有在按住空格键或者是中键点击时才开始平移
    if (!isSpacePressed && e.button !== 1) return;
    
    e.preventDefault();
    setIsPanning(true);
    dragStartRef.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };
  }, [isSpacePressed]);

  const updatePan = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    
    setPosition({ x: newX, y: newY });
  }, [isPanning, setPosition]);

  const endPan = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetPosition = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, [setPosition]);

  const centerOnPoint = useCallback((x: number, y: number, containerWidth: number, containerHeight: number) => {
    const newX = containerWidth / 2 - x;
    const newY = containerHeight / 2 - y;
    setPosition({ x: newX, y: newY });
  }, [setPosition]);

  // 监听空格键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查是否在输入元素中
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
        document.body.style.cursor = 'grab';
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        document.body.style.cursor = '';
        setIsPanning(false);
      }
    };

    // 使用 capture 阶段确保优先处理
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      document.body.style.cursor = '';
    };
  }, []);

  return {
    position,
    isPanning,
    isSpacePressed,
    setPosition,
    startPan,
    updatePan,
    endPan,
    resetPosition,
    centerOnPoint,
  };
}

export function useSpaceKey(): boolean {
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return isSpacePressed;
}
