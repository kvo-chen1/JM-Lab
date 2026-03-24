import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Type,
  Image as ImageIcon,
  Sliders,
  Wand2,
  Undo,
  Redo,
  Download,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
}

interface FilterPreset {
  name: string;
  label: string;
  filter: string;
}

const FILTER_PRESETS: FilterPreset[] = [
  { name: 'none', label: '原图', filter: 'none' },
  { name: 'grayscale', label: '黑白', filter: 'grayscale(100%)' },
  { name: 'sepia', label: '复古', filter: 'sepia(100%)' },
  { name: 'warm', label: '暖色', filter: 'sepia(30%) saturate(140%) brightness(105%)' },
  { name: 'cool', label: '冷色', filter: 'hue-rotate(180deg) saturate(80%)' },
  { name: 'vintage', label: '怀旧', filter: 'sepia(50%) contrast(120%) brightness(90%)' },
  { name: 'vivid', label: '鲜艳', filter: 'saturate(180%) contrast(110%)' },
  { name: 'soft', label: '柔和', filter: 'brightness(110%) contrast(90%) saturate(90%)' },
  { name: 'dramatic', label: '戏剧', filter: 'contrast(150%) saturate(120%)' },
  { name: 'blur', label: '模糊', filter: 'blur(5px)' },
  { name: 'sharpen', label: '锐化', filter: 'contrast(130%)' },
  { name: 'invert', label: '反色', filter: 'invert(100%)' },
];

type EditorTab = 'filters' | 'adjust' | 'text' | 'crop';

interface HistoryState {
  filter: string;
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

export default function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 编辑状态
  const [activeTab, setActiveTab] = useState<EditorTab>('filters');
  const [filter, setFilter] = useState('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // 文字状态
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(30);
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [isDraggingText, setIsDraggingText] = useState(false);

  // 历史记录
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 保存当前状态到历史记录
  const saveToHistory = useCallback(() => {
    const newState: HistoryState = {
      filter,
      brightness,
      contrast,
      saturation,
      rotation,
      flipH,
      flipV,
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      // 限制历史记录数量
      if (newHistory.length > 20) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 19));
  }, [filter, brightness, contrast, saturation, rotation, flipH, flipV, historyIndex]);

  // 撤销
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setFilter(prevState.filter);
      setBrightness(prevState.brightness);
      setContrast(prevState.contrast);
      setSaturation(prevState.saturation);
      setRotation(prevState.rotation);
      setFlipH(prevState.flipH);
      setFlipV(prevState.flipV);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  // 重做
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setFilter(nextState.filter);
      setBrightness(nextState.brightness);
      setContrast(nextState.contrast);
      setSaturation(nextState.saturation);
      setRotation(nextState.rotation);
      setFlipH(nextState.flipH);
      setFlipV(nextState.flipV);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  // 加载图片
  useEffect(() => {
    setIsLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setOriginalImage(img);
      setIsLoading(false);
      // 初始化历史记录
      const initialState: HistoryState = {
        filter: 'none',
        brightness: 100,
        contrast: 100,
        saturation: 100,
        rotation: 0,
        flipH: false,
        flipV: false,
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    };
    img.onerror = () => {
      toast.error('无法加载图片');
      setIsLoading(false);
    };
  }, [imageUrl]);

  // 绘制图片
  const drawImage = useCallback((img: HTMLImageElement = originalImage!) => {
    if (!img || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 计算旋转后的画布尺寸
    const rad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const newWidth = img.naturalWidth * cos + img.naturalHeight * sin;
    const newHeight = img.naturalWidth * sin + img.naturalHeight * cos;

    canvas.width = newWidth;
    canvas.height = newHeight;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 保存上下文
    ctx.save();

    // 移动到画布中心
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // 应用旋转
    ctx.rotate(rad);

    // 应用翻转
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // 构建滤镜字符串
    let filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    const preset = FILTER_PRESETS.find(f => f.name === filter);
    if (preset && preset.name !== 'none') {
      filterString += ' ' + preset.filter;
    }
    ctx.filter = filterString;

    // 绘制图片
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

    ctx.restore();

    // 绘制文字（不受滤镜影响）
    if (text) {
      ctx.save();
      ctx.filter = 'none';
      ctx.font = `bold ${textSize}px sans-serif`;
      ctx.fillStyle = textColor;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = textSize / 8;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const x = (textPosition.x / 100) * canvas.width;
      const y = (textPosition.y / 100) * canvas.height;

      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
      ctx.restore();
    }
  }, [originalImage, brightness, contrast, saturation, filter, rotation, flipH, flipV, text, textColor, textSize, textPosition]);

  // 当参数变化时重绘
  useEffect(() => {
    if (originalImage) {
      drawImage(originalImage);
    }
  }, [drawImage, originalImage]);

  // 处理参数变化并保存历史
  const handleParamChange = useCallback((
    setter: React.Dispatch<React.SetStateAction<any>>,
    value: any
  ) => {
    setter(value);
    // 延迟保存历史，避免频繁操作
    setTimeout(() => saveToHistory(), 100);
  }, [saveToHistory]);

  // 处理旋转
  const handleRotate = useCallback((direction: 'left' | 'right') => {
    setRotation(prev => {
      const newRotation = direction === 'left' ? prev - 90 : prev + 90;
      return newRotation % 360;
    });
    setTimeout(() => saveToHistory(), 100);
  }, [saveToHistory]);

  // 处理翻转
  const handleFlip = useCallback((direction: 'horizontal' | 'vertical') => {
    if (direction === 'horizontal') {
      setFlipH(prev => !prev);
    } else {
      setFlipV(prev => !prev);
    }
    setTimeout(() => saveToHistory(), 100);
  }, [saveToHistory]);

  // 重置所有调整
  const handleReset = useCallback(() => {
    setFilter('none');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setText('');
    setTimeout(() => saveToHistory(), 100);
  }, [saveToHistory]);

  // 处理保存
  const handleSave = useCallback(() => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png', 1.0);
      onSave(dataUrl);
    } catch (e) {
      console.error(e);
      toast.error('保存失败，可能是跨域问题');
    }
  }, [onSave]);

  // 处理文字拖拽
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!text || activeTab !== 'text') return;
    setIsDraggingText(true);
  }, [text, activeTab]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingText || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setTextPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }, [isDraggingText]);

  const handleCanvasMouseUp = useCallback(() => {
    if (isDraggingText) {
      setIsDraggingText(false);
      saveToHistory();
    }
  }, [isDraggingText, saveToHistory]);

  // Tab 按钮组件
  const TabButton = ({ tab, icon: Icon, label }: { tab: EditorTab; icon: any; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        activeTab === tab
          ? 'bg-purple-500 text-white'
          : isDark
            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col w-full h-full ${isDark ? 'bg-[#0a0f0a]' : 'bg-gray-50'}`}
    >
      {/* 顶部工具栏 */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <TabButton tab="filters" icon={Wand2} label="滤镜" />
          <TabButton tab="adjust" icon={Sliders} label="调整" />
          <TabButton tab="text" icon={Type} label="文字" />
        </div>

        <div className="flex items-center gap-2">
          {/* 撤销/重做 */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className={`p-2 rounded-lg transition-colors ${
              historyIndex <= 0
                ? 'opacity-30 cursor-not-allowed'
                : isDark
                  ? 'hover:bg-gray-800 text-gray-400'
                  : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="撤销"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className={`p-2 rounded-lg transition-colors ${
              historyIndex >= history.length - 1
                ? 'opacity-30 cursor-not-allowed'
                : isDark
                  ? 'hover:bg-gray-800 text-gray-400'
                  : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="重做"
          >
            <Redo className="w-4 h-4" />
          </button>

          <div className={`w-px h-6 mx-2 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

          {/* 旋转和翻转 */}
          <button
            onClick={() => handleRotate('left')}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="向左旋转"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleRotate('right')}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="向右旋转"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleFlip('horizontal')}
            className={`p-2 rounded-lg transition-colors ${
              flipH ? 'bg-purple-500/20 text-purple-500' : isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="水平翻转"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleFlip('vertical')}
            className={`p-2 rounded-lg transition-colors ${
              flipV ? 'bg-purple-500/20 text-purple-500' : isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="垂直翻转"
          >
            <FlipVertical className="w-4 h-4" />
          </button>

          <div className={`w-px h-6 mx-2 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

          {/* 重置 */}
          <button
            onClick={handleReset}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            重置
          </button>
        </div>

        {/* 右侧操作按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-500 hover:bg-purple-600 text-white transition-colors"
          >
            保存
          </button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧工具面板 */}
        <div className={`w-72 flex-shrink-0 border-r overflow-y-auto ${isDark ? 'border-gray-800 bg-[#121212]' : 'border-gray-200 bg-white'}`}>
          {/* 滤镜面板 */}
          {activeTab === 'filters' && (
            <div className="p-4">
              <h4 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                滤镜预设
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {FILTER_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setFilter(preset.name);
                      saveToHistory();
                    }}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      filter === preset.name
                        ? 'border-purple-500 ring-2 ring-purple-500/20'
                        : isDark ? 'border-gray-700' : 'border-gray-200'
                    }`}
                  >
                    {originalImage && (
                      <img
                        src={originalImage.src}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                        style={{ filter: preset.filter }}
                      />
                    )}
                    <span className={`absolute inset-0 flex items-end justify-center pb-1 text-[10px] font-medium ${
                      isDark ? 'bg-gradient-to-t from-black/80 to-transparent text-white' : 'bg-gradient-to-t from-white/80 to-transparent text-gray-900'
                    }`}>
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 调整面板 */}
          {activeTab === 'adjust' && (
            <div className="p-4 space-y-6">
              <h4 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                基础调整
              </h4>

              {/* 亮度 */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>亮度</span>
                  <span className={`text-xs font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  onMouseUp={saveToHistory}
                  className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                    isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                  style={{
                    background: `linear-gradient(to right, ${isDark ? '#8b5cf6' : '#8b5cf6'} 0%, ${isDark ? '#8b5cf6' : '#8b5cf6'} ${brightness / 2}%, ${isDark ? '#374151' : '#e5e7eb'} ${brightness / 2}%, ${isDark ? '#374151' : '#e5e7eb'} 100%)`
                  }}
                />
              </div>

              {/* 对比度 */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>对比度</span>
                  <span className={`text-xs font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  onMouseUp={saveToHistory}
                  className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                    isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                  style={{
                    background: `linear-gradient(to right, ${isDark ? '#8b5cf6' : '#8b5cf6'} 0%, ${isDark ? '#8b5cf6' : '#8b5cf6'} ${contrast / 2}%, ${isDark ? '#374151' : '#e5e7eb'} ${contrast / 2}%, ${isDark ? '#374151' : '#e5e7eb'} 100%)`
                  }}
                />
              </div>

              {/* 饱和度 */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>饱和度</span>
                  <span className={`text-xs font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  onMouseUp={saveToHistory}
                  className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                    isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                  style={{
                    background: `linear-gradient(to right, ${isDark ? '#8b5cf6' : '#8b5cf6'} 0%, ${isDark ? '#8b5cf6' : '#8b5cf6'} ${saturation / 2}%, ${isDark ? '#374151' : '#e5e7eb'} ${saturation / 2}%, ${isDark ? '#374151' : '#e5e7eb'} 100%)`
                  }}
                />
              </div>
            </div>
          )}

          {/* 文字面板 */}
          {activeTab === 'text' && (
            <div className="p-4 space-y-4">
              <h4 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                文字设置
              </h4>

              <div>
                <label className={`block text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  文字内容
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="输入文字..."
                  className={`w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  文字大小
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={textSize}
                    onChange={(e) => setTextSize(Number(e.target.value))}
                    className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer ${
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                  />
                  <span className={`text-xs font-mono w-10 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {textSize}
                  </span>
                </div>
              </div>

              <div>
                <label className={`block text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  文字颜色
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                  />
                  <span className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {textColor}
                  </span>
                </div>
              </div>

              <div className={`p-3 rounded-lg text-xs ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                💡 提示：在画布上拖拽文字可调整位置
              </div>
            </div>
          )}
        </div>

        {/* 画布区域 */}
        <div className={`flex-1 flex items-center justify-center p-8 overflow-auto ${isDark ? 'bg-[#0a0f0a]' : 'bg-gray-100'}`}>
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>加载中...</span>
            </div>
          ) : (
            <div className="relative shadow-2xl">
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className={`max-w-full max-h-[70vh] object-contain ${
                  activeTab === 'text' && text ? 'cursor-move' : 'cursor-default'
                }`}
              />
              {/* 文字位置指示器 */}
              {text && activeTab === 'text' && (
                <div
                  className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-purple-500 border-2 border-white shadow-lg pointer-events-none"
                  style={{
                    left: `${textPosition.x}%`,
                    top: `${textPosition.y}%`,
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
