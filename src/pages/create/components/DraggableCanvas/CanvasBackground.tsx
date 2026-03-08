import React from 'react';
import { useTheme } from '@/hooks/useTheme';

interface CanvasBackgroundProps {
  scale?: number;
  showGrid?: boolean;
  gridSize?: number;
  dotSize?: number;
}

export default function CanvasBackground({
  scale = 1,
  showGrid = true,
  gridSize = 20,
  dotSize = 1.5,
}: CanvasBackgroundProps) {
  const { isDark } = useTheme();

  // 根据缩放比例调整网格密度
  const adjustedGridSize = Math.max(10, gridSize * Math.min(1, scale));
  const adjustedDotSize = Math.max(1, dotSize * Math.min(1, scale));

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        backgroundColor: isDark ? '#0f0f0f' : '#f5f5f5',
      }}
    >
      {showGrid && (
        <>
          {/* 点状网格 - 使用CSS背景图案替代SVG以提高性能 */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.3)'} ${adjustedDotSize / 2}px, transparent ${adjustedDotSize / 2}px)`,
              backgroundSize: `${adjustedGridSize}px ${adjustedGridSize}px`,
            }}
          />

          {/* 中心十字线 */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{
              opacity: isDark ? 0.1 : 0.2,
            }}
          >
            <line
              x1="50%"
              y1="0"
              x2="50%"
              y2="100%"
              stroke={isDark ? '#ffffff' : '#000000'}
              strokeWidth={1 / scale}
              strokeDasharray={`${4 / scale},${4 / scale}`}
            />
            <line
              x1="0"
              y1="50%"
              x2="100%"
              y2="50%"
              stroke={isDark ? '#ffffff' : '#000000'}
              strokeWidth={1 / scale}
              strokeDasharray={`${4 / scale},${4 / scale}`}
            />
          </svg>
        </>
      )}

      {/* 渐变遮罩 */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.3) 100%)'
            : 'radial-gradient(circle at center, transparent 0%, rgba(255,255,255,0.5) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
