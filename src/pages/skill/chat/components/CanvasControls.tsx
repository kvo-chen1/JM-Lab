import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { CanvasTool, ViewMode } from '../hooks/useCanvasStore';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  LayoutGrid,
  Hand,
  MousePointer2,
  Move,
  MessageSquare,
  RotateCcw
} from 'lucide-react';

interface CanvasControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onReset: () => void;
  onToolChange: (tool: CanvasTool) => void;
  selectedTool: CanvasTool;
  showGrid: boolean;
  onToggleGrid: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onFeedbackClick?: () => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  zoom,
  onZoomChange,
  onReset,
  onToolChange,
  selectedTool,
  showGrid,
  onToggleGrid,
  viewMode,
  onViewModeChange,
  onFeedbackClick,
}) => {
  const { isDark } = useTheme();

  const handleZoomIn = () => onZoomChange(Math.min(300, zoom + 10));
  const handleZoomOut = () => onZoomChange(Math.max(10, zoom - 10));

  return (
    <>
      {/* 顶部工具栏 */}
      <div className={`absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none`}>
        {/* 左侧：视图模式切换 */}
        <div className={`flex items-center gap-1 p-1 rounded-xl pointer-events-auto ${
          isDark ? 'bg-gray-900/80 backdrop-blur-md border border-gray-800' : 'bg-white/80 backdrop-blur-md border border-gray-200 shadow-sm'
        }`}>
          <button
            onClick={() => onViewModeChange('gallery')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'gallery'
                ? 'bg-purple-500 text-white'
                : isDark 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="画廊模式"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            画廊
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'grid'
                ? 'bg-purple-500 text-white'
                : isDark 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="网格模式"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            网格
          </button>
        </div>

        {/* 右侧：工具切换 */}
        <div className={`flex items-center gap-1 p-1 rounded-xl pointer-events-auto ${
          isDark ? 'bg-gray-900/80 backdrop-blur-md border border-gray-800' : 'bg-white/80 backdrop-blur-md border border-gray-200 shadow-sm'
        }`}>
          <button
            onClick={() => onToolChange('select')}
            className={`p-2 rounded-lg transition-all ${
              selectedTool === 'select'
                ? 'bg-purple-500 text-white'
                : isDark 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="选择工具 (V)"
          >
            <MousePointer2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToolChange('hand')}
            className={`p-2 rounded-lg transition-all ${
              selectedTool === 'hand'
                ? 'bg-purple-500 text-white'
                : isDark 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="抓手工具 (H) - 按住空格键临时切换"
          >
            <Hand className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToolChange('move')}
            className={`p-2 rounded-lg transition-all ${
              selectedTool === 'move'
                ? 'bg-purple-500 text-white'
                : isDark 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="移动工具 (M)"
          >
            <Move className="w-4 h-4" />
          </button>
          <div className={`w-px h-4 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
          <button
            onClick={onToggleGrid}
            className={`p-2 rounded-lg transition-all ${
              showGrid
                ? 'bg-purple-500/20 text-purple-500'
                : isDark 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="显示网格 (G)"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 底部缩放控制栏 */}
      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-2 rounded-2xl ${
        isDark ? 'bg-gray-900/90 backdrop-blur-md border border-gray-800' : 'bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg'
      }`}>
        {/* 缩放控制 */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className={`p-2 rounded-xl transition-all ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            title="缩小"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <div className={`min-w-[70px] px-3 py-1.5 rounded-xl text-sm font-medium text-center ${
            isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
          }`}>
            {Math.round(zoom)}%
          </div>
          
          <button
            onClick={handleZoomIn}
            className={`p-2 rounded-xl transition-all ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <div className={`w-px h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

        {/* 适应屏幕 */}
        <button
          onClick={() => onZoomChange(100)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
            isDark 
              ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
          title="适应屏幕"
        >
          <Maximize className="w-4 h-4" />
          100%
        </button>

        {/* 重置 */}
        <button
          onClick={onReset}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
            isDark 
              ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
          title="重置视图"
        >
          <RotateCcw className="w-4 h-4" />
          重置
        </button>

        {onFeedbackClick && (
          <>
            <div className={`w-px h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
            <button
              onClick={onFeedbackClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                isDark 
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
              title="反馈"
            >
              <MessageSquare className="w-4 h-4" />
              反馈
            </button>
          </>
        )}
      </div>

      {/* 快捷键提示 */}
      <div className={`absolute bottom-4 right-4 z-20 text-xs ${
        isDark ? 'text-gray-600' : 'text-gray-400'
      }`}>
        <div className="flex flex-col items-end gap-1">
          <span>空格 + 拖拽：平移画布</span>
          <span>Ctrl + 滚轮：缩放画布</span>
          <span>滚轮：平移画布</span>
        </div>
      </div>
    </>
  );
};

export default CanvasControls;
