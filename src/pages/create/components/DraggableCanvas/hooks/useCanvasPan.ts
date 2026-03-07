import { useState, useCallback, useRef, useEffect } from 'react';

interface PanState {
  position: { x: number; y: number };
  isPanning: boolean;
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
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: initialX, y: initialY });
  const isSpacePressedRef = useRef(false);

  const setPosition = useCallback((newPos: { x: number; y: number }) => {
    positionRef.current = newPos;
    setPositionState(newPos);
  }, []);

  const startPan = useCallback((e: React.MouseEvent) => {
    // 只有在按住空格键或者是中键点击时才开始平移
    if (!isSpacePressedRef.current && e.button !== 1) return;
    
    e.preventDefault();
    setIsPanning(true);
    dragStartRef.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };
  }, []);

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
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        isSpacePressedRef.current = true;
        document.body.style.cursor = 'grab';
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        document.body.style.cursor = '';
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.body.style.cursor = '';
    };
  }, []);

  return {
    position,
    isPanning,
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
