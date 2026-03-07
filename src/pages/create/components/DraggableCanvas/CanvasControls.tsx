import React from 'react';
import { motion } from 'framer-motion';
import { 
  MousePointer2, 
  Hand, 
  ZoomIn, 
  ZoomOut, 
  Maximize,
  Grid3X3,
  MessageSquare
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export type ToolMode = 'select' | 'pan';

interface CanvasControlsProps {
  toolMode: ToolMode;
  onToolModeChange: (mode: ToolMode) => void;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  showMinimap?: boolean;
  onToggleMinimap?: () => void;
}

export default function CanvasControls({
  toolMode,
  onToolModeChange,
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  showGrid = true,
  onToggleGrid,
  showMinimap = true,
  onToggleMinimap,
}: CanvasControlsProps) {
  const { isDark } = useTheme();

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
      {/* 主控制栏 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-1 px-2 py-2 rounded-2xl backdrop-blur-xl shadow-2xl border ${
          isDark 
            ? 'bg-gray-900/80 border-gray-700/50' 
            : 'bg-white/90 border-gray-200/50'
        }`}
      >
        {/* AI 点评按钮 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`p-3 rounded-xl transition-all ${
            isDark 
              ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
          }`}
          title="AI 点评"
        >
          <MessageSquare className="w-5 h-5" />
        </motion.button>

        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

        {/* 工具切换 */}
        <div className={`flex items-center p-1 rounded-xl ${
          isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
        }`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToolModeChange('select')}
            className={`p-2.5 rounded-lg transition-all ${
              toolMode === 'select'
                ? isDark 
                  ? 'bg-gray-700 text-white shadow-lg' 
                  : 'bg-white text-gray-900 shadow-md'
                : isDark 
                  ? 'text-gray-400 hover:text-gray-200' 
                  : 'text-gray-500 hover:text-gray-700'
            }`}
            title="选择工具 (V)"
          >
            <MousePointer2 className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToolModeChange('pan')}
            className={`p-2.5 rounded-lg transition-all ${
              toolMode === 'pan'
                ? isDark 
                  ? 'bg-gray-700 text-white shadow-lg' 
                  : 'bg-white text-gray-900 shadow-md'
                : isDark 
                  ? 'text-gray-400 hover:text-gray-200' 
                  : 'text-gray-500 hover:text-gray-700'
            }`}
            title="拖拽工具 (H)"
          >
            <Hand className="w-5 h-5" />
          </motion.button>
        </div>

        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

        {/* 缩放控制 */}
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onZoomOut}
            className={`p-2.5 rounded-xl transition-all ${
              isDark 
                ? 'text-gray-400 hover:bg-gray-800 hover:text-white' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="缩小"
          >
            <ZoomOut className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onResetZoom}
            className={`min-w-[70px] px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              isDark 
                ? 'text-gray-300 hover:bg-gray-800' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="重置缩放"
          >
            {Math.round(scale * 100)}%
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onZoomIn}
            className={`p-2.5 rounded-xl transition-all ${
              isDark 
                ? 'text-gray-400 hover:bg-gray-800 hover:text-white' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="放大"
          >
            <ZoomIn className="w-5 h-5" />
          </motion.button>
        </div>

        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

        {/* 视图控制 */}
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onResetZoom}
            className={`p-2.5 rounded-xl transition-all ${
              isDark 
                ? 'text-gray-400 hover:bg-gray-800 hover:text-white' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="适应屏幕"
          >
            <Maximize className="w-5 h-5" />
          </motion.button>

          {onToggleGrid && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleGrid}
              className={`p-2.5 rounded-xl transition-all ${
                showGrid
                  ? isDark 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-gray-200 text-gray-900'
                  : isDark 
                    ? 'text-gray-400 hover:bg-gray-800 hover:text-white' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title="切换网格"
            >
              <Grid3X3 className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
