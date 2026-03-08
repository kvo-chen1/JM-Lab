import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { MessageSquare, Move, Hand, Minus, Plus, RefreshCw } from 'lucide-react';

interface CanvasControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onReset: () => void;
  onToolChange: (tool: 'select' | 'move' | 'hand') => void;
  selectedTool: 'select' | 'move' | 'hand';
}

export default function CanvasControls({ 
  zoom, 
  onZoomChange, 
  onReset, 
  onToolChange, 
  selectedTool 
}: CanvasControlsProps) {
  const { isDark } = useTheme();
  const [zoomInput, setZoomInput] = useState(zoom.toString());

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 10, 200);
    onZoomChange(newZoom);
    setZoomInput(newZoom.toString());
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 10, 10);
    onZoomChange(newZoom);
    setZoomInput(newZoom.toString());
  };

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomInput(e.target.value);
  };

  const handleZoomInputBlur = () => {
    const newZoom = parseInt(zoomInput) || 100;
    const clampedZoom = Math.max(10, Math.min(newZoom, 200));
    onZoomChange(clampedZoom);
    setZoomInput(clampedZoom.toString());
  };

  const handleToolSelect = (tool: 'select' | 'move' | 'hand') => {
    onToolChange(tool);
  };

  return (
    <div className={`fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md z-50 ${isDark ? 'bg-gray-900/80 border border-gray-700' : 'bg-white/80 border border-gray-200'}`}>
      {/* 工具选择 */}
      <div className={`flex items-center gap-1.5 p-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <button
          onClick={() => handleToolSelect('select')}
          className={`p-1.5 rounded-md transition-colors ${selectedTool === 'select' ? (isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900') : (isDark ? 'text-gray-400' : 'text-gray-600')}`}
          title="选择工具"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleToolSelect('move')}
          className={`p-1.5 rounded-md transition-colors ${selectedTool === 'move' ? (isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900') : (isDark ? 'text-gray-400' : 'text-gray-600')}`}
          title="移动工具"
        >
          <Move className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleToolSelect('hand')}
          className={`p-1.5 rounded-md transition-colors ${selectedTool === 'hand' ? (isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900') : (isDark ? 'text-gray-400' : 'text-gray-600')}`}
          title="手形工具"
        >
          <Hand className="w-4 h-4" />
        </button>
      </div>

      {/* 分隔线 */}
      <div className={`w-px h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

      {/* 缩放控制 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleZoomOut}
          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
          title="缩小"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className={`relative w-16 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <input
            type="text"
            value={zoomInput}
            onChange={handleZoomInputChange}
            onBlur={handleZoomInputBlur}
            className={`w-full bg-transparent border-none outline-none text-center text-sm font-medium focus:ring-1 focus:ring-[#C02C38] ${isDark ? 'placeholder-gray-500' : 'placeholder-gray-400'}`}
            placeholder="100"
          />
          <span className="absolute right-0 top-0 text-xs text-gray-400">%</span>
        </div>
        <button
          onClick={handleZoomIn}
          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
          title="放大"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* 分隔线 */}
      <div className={`w-px h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

      {/* 重置按钮 */}
      <button
        onClick={onReset}
        className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
        title="重置视图"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );
}
