import React, { useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import type { IsolatedElement, ElementTransform, ElementStyle } from '../hooks/useCanvasStore';
import { 
  Sun, 
  Contrast, 
  Droplets, 
  Palette, 
  Eye, 
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Move,
  Maximize,
  Layers
} from 'lucide-react';

interface ElementPropertyPanelProps {
  element: IsolatedElement | null;
  onTransformChange: (transform: Partial<ElementTransform>) => void;
  onStyleChange: (style: Partial<ElementStyle>) => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
}

const BLEND_MODES = [
  { value: 'normal', label: '正常' },
  { value: 'multiply', label: '正片叠底' },
  { value: 'screen', label: '滤色' },
  { value: 'overlay', label: '叠加' },
  { value: 'darken', label: '变暗' },
  { value: 'lighten', label: '变亮' },
  { value: 'color-dodge', label: '颜色减淡' },
  { value: 'color-burn', label: '颜色加深' },
  { value: 'difference', label: '差值' },
  { value: 'exclusion', label: '排除' },
];

export const ElementPropertyPanel: React.FC<ElementPropertyPanelProps> = ({
  element,
  onTransformChange,
  onStyleChange,
  onToggleVisibility,
  onToggleLock,
  onDelete,
}) => {
  const { isDark } = useTheme();

  if (!element) {
    return (
      <div className={`w-64 h-full flex flex-col ${isDark ? 'bg-gray-900 border-l border-gray-800' : 'bg-white border-l border-gray-200'}`}>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className={`text-sm text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            选择一个元素以编辑属性
          </p>
        </div>
      </div>
    );
  }

  // 滑块组件
  const SliderControl = ({ 
    label, 
    icon: Icon, 
    value, 
    min, 
    max, 
    onChange,
    unit = ''
  }: { 
    label: string; 
    icon: any; 
    value: number; 
    min: number; 
    max: number; 
    onChange: (val: number) => void;
    unit?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
        </div>
        <span className={`text-xs font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
          isDark ? 'bg-gray-700' : 'bg-gray-200'
        }`}
        style={{
          background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((value - min) / (max - min)) * 100}%, ${isDark ? '#374151' : '#e5e7eb'} ${((value - min) / (max - min)) * 100}%, ${isDark ? '#374151' : '#e5e7eb'} 100%)`
        }}
      />
    </div>
  );

  return (
    <div className={`w-64 h-full flex flex-col ${isDark ? 'bg-gray-900 border-l border-gray-800' : 'bg-white border-l border-gray-200'}`}>
      {/* 头部 */}
      <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>元素属性</h3>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{element.name}</p>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 变换控制 */}
        <div className="space-y-3">
          <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            变换
          </h4>
          
          {/* 位置 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>X 位置</label>
              <input
                type="number"
                value={Math.round(element.position.x)}
                onChange={(e) => onTransformChange({})}
                className={`w-full mt-1 px-2 py-1 text-xs rounded border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Y 位置</label>
              <input
                type="number"
                value={Math.round(element.position.y)}
                onChange={(e) => onTransformChange({})}
                className={`w-full mt-1 px-2 py-1 text-xs rounded border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              />
            </div>
          </div>

          {/* 缩放 */}
          <SliderControl
            label="缩放"
            icon={Maximize}
            value={Math.round(element.transform.scale * 100)}
            min={10}
            max={500}
            onChange={(val) => onTransformChange({ scale: val / 100 })}
            unit="%"
          />

          {/* 旋转 */}
          <SliderControl
            label="旋转"
            icon={RotateCw}
            value={element.transform.rotation}
            min={-180}
            max={180}
            onChange={(val) => onTransformChange({ rotation: val })}
            unit="°"
          />

          {/* 翻转按钮 */}
          <div className="flex gap-2">
            <button
              onClick={() => onTransformChange({ flipX: !element.transform.flipX })}
              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs transition-colors ${
                element.transform.flipX
                  ? 'bg-purple-500 text-white'
                  : isDark
                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              水平翻转
            </button>
            <button
              onClick={() => onTransformChange({ flipY: !element.transform.flipY })}
              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs transition-colors ${
                element.transform.flipY
                  ? 'bg-purple-500 text-white'
                  : isDark
                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FlipVertical className="w-3.5 h-3.5" />
              垂直翻转
            </button>
          </div>
        </div>

        {/* 样式控制 */}
        <div className="space-y-3">
          <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            样式
          </h4>

          {/* 亮度 */}
          <SliderControl
            label="亮度"
            icon={Sun}
            value={element.style.brightness}
            min={0}
            max={200}
            onChange={(val) => onStyleChange({ brightness: val })}
            unit="%"
          />

          {/* 对比度 */}
          <SliderControl
            label="对比度"
            icon={Contrast}
            value={element.style.contrast}
            min={0}
            max={200}
            onChange={(val) => onStyleChange({ contrast: val })}
            unit="%"
          />

          {/* 饱和度 */}
          <SliderControl
            label="饱和度"
            icon={Droplets}
            value={element.style.saturation}
            min={0}
            max={200}
            onChange={(val) => onStyleChange({ saturation: val })}
            unit="%"
          />

          {/* 色相 */}
          <SliderControl
            label="色相"
            icon={Palette}
            value={element.style.hue}
            min={-180}
            max={180}
            onChange={(val) => onStyleChange({ hue: val })}
            unit="°"
          />

          {/* 透明度 */}
          <SliderControl
            label="透明度"
            icon={Eye}
            value={element.style.opacity}
            min={0}
            max={100}
            onChange={(val) => onStyleChange({ opacity: val })}
            unit="%"
          />

          {/* 混合模式 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Layers className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>混合模式</span>
            </div>
            <select
              value={element.style.blendMode}
              onChange={(e) => onStyleChange({ blendMode: e.target.value })}
              className={`w-full px-2 py-1.5 text-xs rounded border ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              {BLEND_MODES.map(mode => (
                <option key={mode.value} value={mode.value}>{mode.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-2 pt-4 border-t border-dashed ${isDark ? 'border-gray-800' : 'border-gray-200'}">
          <button
            onClick={onToggleVisibility}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
              element.isVisible
                ? isDark
                  ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-purple-500 text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {element.isVisible ? '隐藏元素' : '显示元素'}
          </button>

          <button
            onClick={onDelete}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
              isDark
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            删除元素
          </button>
        </div>
      </div>
    </div>
  );
};

export default ElementPropertyPanel;
