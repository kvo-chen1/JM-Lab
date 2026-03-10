import { useState, useEffect, useRef, useCallback } from 'react';

// 手势状态类型定义
interface GestureState {
  scale: number;
  rotation: number;
  translateX: number;
  translateY: number;
  isDragging: boolean;
  isPinching: boolean;
  isRotating: boolean;
}

// 手势配置类型定义
interface GestureConfig {
  onScale?: (scale: number, previousScale: number) => void;
  onRotate?: (rotation: number, previousRotation: number) => void;
  onDrag?: (deltaX: number, deltaY: number, absoluteX: number, absoluteY: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onPinchStart?: () => void;
  onPinchEnd?: () => void;
  onRotateStart?: () => void;
  onRotateEnd?: () => void;
  onDoubleTap?: () => void;
  enabled?: boolean;
}

// 手势点类型定义
interface Point {
  x: number;
  y: number;
}

const useMobileGestures = (config: GestureConfig = {}) => {
  const [gestureState, setGestureState] = useState<GestureState>({
    scale: 1,
    rotation: 0,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    isPinching: false,
    isRotating: false
  });
  
  const targetRef = useRef<HTMLElement | null>(null);
  const initialDistance = useRef<number>(0);
  const initialAngle = useRef<number>(0);
  const initialScale = useRef<number>(1);
  const initialRotation = useRef<number>(0);
  const initialPinchDistance = useRef<number>(0);
  const initialPinchAngle = useRef<number>(0);
  const previousPoint = useRef<Point | null>(null);
  const doubleTapTimer = useRef<number | null>(null);
  const tapCount = useRef<number>(0);
  
  const enabled = config.enabled !== false;
  
  // 计算两点之间的距离
  const getDistance = useCallback((p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);
  
  // 计算两点之间的角度
  const getAngle = useCallback((p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.atan2(dy, dx) * 180 / Math.PI;
  }, []);
  
  // 获取触摸点的中心点
  const getMidpoint = useCallback((p1: Point, p2: Point): Point => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };
  }, []);
  
  // 触摸开始事件处理
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || !targetRef.current) return;
    
    // 处理双击
    tapCount.current++;
    
    if (tapCount.current === 1) {
      doubleTapTimer.current = window.setTimeout(() => {
        tapCount.current = 0;
      }, 300);
    } else if (tapCount.current === 2) {
      if (doubleTapTimer.current) {
        clearTimeout(doubleTapTimer.current);
        doubleTapTimer.current = null;
      }
      tapCount.current = 0;
      if (config.onDoubleTap) {
        config.onDoubleTap();
      }
      return;
    }
    
    const touches = e.touches;
    
    // 处理拖拽
    if (touches.length === 1) {
      const point: Point = {
        x: touches[0].clientX,
        y: touches[0].clientY
      };
      
      previousPoint.current = point;
      
      setGestureState(prev => ({
        ...prev,
        isDragging: true
      }));
      
      if (config.onDragStart) {
        config.onDragStart();
      }
    }
    
    // 处理捏合和旋转
    if (touches.length === 2) {
      const point1: Point = {
        x: touches[0].clientX,
        y: touches[0].clientY
      };
      
      const point2: Point = {
        x: touches[1].clientX,
        y: touches[1].clientY
      };
      
      initialDistance.current = getDistance(point1, point2);
      initialAngle.current = getAngle(point1, point2);
      initialPinchDistance.current = initialDistance.current;
      initialPinchAngle.current = initialAngle.current;
      initialScale.current = gestureState.scale;
      initialRotation.current = gestureState.rotation;
      
      setGestureState(prev => ({
        ...prev,
        isPinching: true,
        isRotating: true
      }));
      
      if (config.onPinchStart) {
        config.onPinchStart();
      }
      
      if (config.onRotateStart) {
        config.onRotateStart();
      }
    }
  }, [enabled, getDistance, getAngle, gestureState.scale, gestureState.rotation, config]);
  
  // 触摸移动事件处理
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !targetRef.current) return;
    
    const touches = e.touches;
    
    // 阻止默认行为，避免页面滚动
    e.preventDefault();
    
    // 处理拖拽
    if (touches.length === 1 && gestureState.isDragging) {
      const currentPoint: Point = {
        x: touches[0].clientX,
        y: touches[0].clientY
      };
      
      if (previousPoint.current) {
        const deltaX = currentPoint.x - previousPoint.current.x;
        const deltaY = currentPoint.y - previousPoint.current.y;
        
        setGestureState(prev => ({
          ...prev,
          translateX: prev.translateX + deltaX,
          translateY: prev.translateY + deltaY
        }));
        
        if (config.onDrag) {
          config.onDrag(
            deltaX, 
            deltaY, 
            gestureState.translateX + deltaX, 
            gestureState.translateY + deltaY
          );
        }
      }
      
      previousPoint.current = currentPoint;
    }
    
    // 处理捏合和旋转
    if (touches.length === 2 && (gestureState.isPinching || gestureState.isRotating)) {
      const point1: Point = {
        x: touches[0].clientX,
        y: touches[0].clientY
      };
      
      const point2: Point = {
        x: touches[1].clientX,
        y: touches[1].clientY
      };
      
      const currentDistance = getDistance(point1, point2);
      const currentAngle = getAngle(point1, point2);
      
      // 计算缩放
      const scale = initialScale.current * (currentDistance / initialPinchDistance.current);
      
      // 计算旋转
      const rotation = initialRotation.current + (currentAngle - initialPinchAngle.current);
      
      // 计算中心点位移
      const initialMidpoint = getMidpoint({
        x: point1.x - (currentDistance / initialPinchDistance.current) * (point1.x - getMidpoint(point1, point2).x),
        y: point1.y - (currentDistance / initialPinchDistance.current) * (point1.y - getMidpoint(point1, point2).y)
      }, {
        x: point2.x - (currentDistance / initialPinchDistance.current) * (point2.x - getMidpoint(point1, point2).x),
        y: point2.y - (currentDistance / initialPinchDistance.current) * (point2.y - getMidpoint(point1, point2).y)
      });
      
      const currentMidpoint = getMidpoint(point1, point2);
      
      const deltaX = currentMidpoint.x - initialMidpoint.x;
      const deltaY = currentMidpoint.y - initialMidpoint.y;
      
      setGestureState(prev => ({
        ...prev,
        scale,
        rotation,
        translateX: prev.translateX + deltaX,
        translateY: prev.translateY + deltaY
      }));
      
      if (config.onScale) {
        config.onScale(scale, gestureState.scale);
      }
      
      if (config.onRotate) {
        config.onRotate(rotation, gestureState.rotation);
      }
      
      if (config.onDrag) {
        config.onDrag(
          deltaX, 
          deltaY, 
          gestureState.translateX + deltaX, 
          gestureState.translateY + deltaY
        );
      }
    }
  }, [enabled, getDistance, getAngle, getMidpoint, gestureState, config]);
  
  // 触摸结束事件处理
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !targetRef.current) return;
    
    // 处理拖拽结束
    if (gestureState.isDragging) {
      setGestureState(prev => ({
        ...prev,
        isDragging: false
      }));
      
      if (config.onDragEnd) {
        config.onDragEnd();
      }
    }
    
    // 处理捏合和旋转结束
    if (gestureState.isPinching || gestureState.isRotating) {
      setGestureState(prev => ({
        ...prev,
        isPinching: false,
        isRotating: false
      }));
      
      if (gestureState.isPinching && config.onPinchEnd) {
        config.onPinchEnd();
      }
      
      if (gestureState.isRotating && config.onRotateEnd) {
        config.onRotateEnd();
      }
    }
    
    previousPoint.current = null;
  }, [enabled, gestureState, config]);
  
  // 绑定事件
  useEffect(() => {
    const target = targetRef.current;
    
    if (!target || !enabled) return;
    
    // 优化事件监听器配置
    // touchstart 和 touchend 使用 passive: true，因为它们不调用 preventDefault
    target.addEventListener('touchstart', handleTouchStart, { passive: true });
    // touchmove 使用 passive: false，因为它可能调用 preventDefault
    target.addEventListener('touchmove', handleTouchMove, { passive: false });
    target.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      if (target) {
        target.removeEventListener('touchstart', handleTouchStart);
        target.removeEventListener('touchmove', handleTouchMove);
        target.removeEventListener('touchend', handleTouchEnd);
      }
      
      if (doubleTapTimer.current) {
        clearTimeout(doubleTapTimer.current);
        doubleTapTimer.current = null;
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, enabled]);
  
  // 重置手势状态
  const reset = useCallback(() => {
    setGestureState({
      scale: 1,
      rotation: 0,
      translateX: 0,
      translateY: 0,
      isDragging: false,
      isPinching: false,
      isRotating: false
    });
  }, []);
  
  return {
    targetRef,
    gestureState,
    reset
  };
};

export default useMobileGestures;
