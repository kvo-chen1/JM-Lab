import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import {
  MousePointer2,
  Hand,
  Minus,
  Plus,
  Maximize2,
  Minimize2,
  Grid3X3,
  RotateCcw,
  GripVertical,
  MessageSquare
} from 'lucide-react';

interface CanvasControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onReset: () => void;
  onToolChange: (tool: 'select' | 'move' | 'hand') => void;
  selectedTool: 'select' | 'move' | 'hand';
  showGrid?: boolean;
  onToggleGrid?: () => void;
  onFeedbackClick?: () => void;
}

export default function CanvasControls({
  zoom,
  onZoomChange,
  onReset,
  onToolChange,
  selectedTool,
  showGrid = false,
  onToggleGrid,
  onFeedbackClick
}: CanvasControlsProps) {
  const { isDark } = useTheme();
  const [zoomInput, setZoomInput] = useState(zoom.toString());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 拖拽状态
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const controlsRef = useRef<HTMLDivElement>(null);

  // 同步 zoom 输入值
  useEffect(() => {
    setZoomInput(zoom.toString());
  }, [zoom]);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 10, 200);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 10, 10);
    onZoomChange(newZoom);
  };

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomInput(e.target.value);
  };

  const handleZoomInputBlur = () => {
    const newZoom = parseInt(zoomInput) || 100;
    const clampedZoom = Math.max(10, Math.min(newZoom, 200));
    onZoomChange(clampedZoom);
  };

  const handleZoomInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleZoomInputBlur();
    }
  };

  const handleToolSelect = (tool: 'select' | 'move' | 'hand') => {
    onToolChange(tool);
  };

  // 切换全屏
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  // 开始拖拽
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // 只有点击拖拽手柄时才允许拖拽
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [position]);

  // 拖拽中
  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  // 结束拖拽
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 计算固定定位的位置
  const getFixedPosition = () => {
    if (position.x === 0 && position.y === 0) {
      // 默认位置：右下角
      return { right: 16, bottom: 16 };
    }
    // 拖拽后的位置
    return {
      left: position.x,
      top: position.y,
      right: 'auto',
      bottom: 'auto'
    };
  };

  const fixedPos = getFixedPosition();

  return (
    <div
      ref={controlsRef}
      className={`fixed flex items-center gap-1 px-2 py-2 rounded-2xl backdrop-blur-md z-[9999] shadow-2xl cursor-default ${
        isDragging ? 'cursor-grabbing' : ''
      } ${
        isDark
          ? 'bg-gray-900/95 border border-gray-700/50 shadow-black/50'
          : 'bg-white/95 border border-gray-200/50 shadow-gray-200/50'
      }`}
      style={{
        left: fixedPos.left,
        top: fixedPos.top,
        right: fixedPos.right,
        bottom: fixedPos.bottom,
      }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* 拖拽手柄 */}
      <div
        className={`drag-handle p-1.5 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${
          isDark
            ? 'hover:bg-gray-700 text-gray-500'
            : 'hover:bg-gray-200 text-gray-400'
        }`}
        title="拖拽移动"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* 分隔线 */}
      <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

      {/* 工具选择组 */}
      <div className={`flex items-center gap-0.5 p-1 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'}`}>
        <button
          onClick={() => handleToolSelect('move')}
          className={`p-2.5 rounded-lg transition-all duration-200 ${
            selectedTool === 'move'
              ? (isDark ? 'bg-gray-700 text-white shadow-lg' : 'bg-white text-gray-900 shadow-md')
              : (isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200')
          }`}
          title="移动工具"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleToolSelect('hand')}
          className={`p-2.5 rounded-lg transition-all duration-200 ${
            selectedTool === 'hand'
              ? (isDark ? 'bg-gray-700 text-white shadow-lg' : 'bg-white text-gray-900 shadow-md')
              : (isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200')
          }`}
          title="抓手工具"
        >
          <Hand className="w-4 h-4" />
        </button>
      </div>

      {/* 分隔线 */}
      <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

      {/* 缩放控制组 */}
      <div className={`flex items-center gap-0.5 p-1 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'}`}>
        <button
          onClick={handleZoomOut}
          className={`p-2.5 rounded-lg transition-all duration-200 ${
            isDark
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
              : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
          }`}
          title="缩小"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className={`relative w-14 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <input
            type="text"
            value={zoomInput}
            onChange={handleZoomInputChange}
            onBlur={handleZoomInputBlur}
            onKeyDown={handleZoomInputKeyDown}
            className={`w-full bg-transparent border-none outline-none text-center text-sm font-semibold focus:ring-2 focus:ring-[#C02C38]/50 rounded py-1 ${
              isDark ? 'placeholder-gray-500' : 'placeholder-gray-400'
            }`}
            placeholder="100"
          />
          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">%</span>
        </div>

        <button
          onClick={handleZoomIn}
          className={`p-2.5 rounded-lg transition-all duration-200 ${
            isDark
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
              : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
          }`}
          title="放大"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* 分隔线 */}
      <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

      {/* 视图控制组 */}
      <div className={`flex items-center gap-0.5 p-1 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'}`}>
        <button
          onClick={toggleFullscreen}
          className={`p-2.5 rounded-lg transition-all duration-200 ${
            isDark
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
              : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
          }`}
          title={isFullscreen ? "退出全屏" : "全屏"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onToggleGrid}
          className={`p-2.5 rounded-lg transition-all duration-200 ${
            showGrid
              ? (isDark ? 'bg-[#C02C38]/20 text-[#C02C38]' : 'bg-[#C02C38]/10 text-[#C02C38]')
              : (isDark
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700')
          }`}
          title="显示/隐藏网格"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>

        <button
          onClick={onReset}
          className={`p-2.5 rounded-lg transition-all duration-200 ${
            isDark
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
              : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
          }`}
          title="重置视图"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 分隔线 */}
      <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

      {/* 反馈按钮 */}
      <div className={`flex items-center gap-0.5 p-1 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'}`}>
        <button
          onClick={onFeedbackClick}
          className={`p-2.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
            isDark
              ? 'hover:bg-[#C02C38]/20 text-[#C02C38]'
              : 'hover:bg-[#C02C38]/10 text-[#C02C38]'
          }`}
          title="反馈"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs font-medium">反馈</span>
        </button>
      </div>
    </div>
  );
}
