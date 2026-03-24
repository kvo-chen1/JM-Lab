import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Type,
  Sliders,
  Wand2,
  Undo,
  Redo,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Sun,
  Contrast,
  Droplets
} from 'lucide-react';

interface InlineImageEditorProps {
  imageUrl: string;
  onChange: (editedUrl: string) => void;
  onSave: (editedUrl: string) => void;
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
];

type EditorTab = 'filters' | 'adjust' | 'text';

interface HistoryState {
  filter: string;
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

export const InlineImageEditor: React.FC<InlineImageEditorProps> = ({
  imageUrl,
  onChange,
  onSave,
  onCancel,
}) => {
  const { isDark } = useTheme();
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // 编辑状态
  const [activeTab, setActiveTab] = useState<EditorTab>('filters');
  const [showToolbar, setShowToolbar] = useState(true);
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

  // 历史记录
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 保存当前状态到历史记录
  const saveToHistory = useCallback(() => {
    const newState: HistoryState = {
      filter, brightness, contrast, saturation, rotation, flipH, flipV,
    };
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      if (newHistory.length > 20) newHistory.shift();
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
    
    // 必须在使用 Canvas 前设置 crossOrigin
    img.crossOrigin = 'anonymous';
    
    // 尝试添加时间戳避免缓存问题
    const imageUrlWithTimestamp = imageUrl.includes('?') 
      ? `${imageUrl}&_t=${Date.now()}` 
      : `${imageUrl}?_t=${Date.now()}`;
    
    img.src = imageUrlWithTimestamp;
    
    img.onload = () => {
      console.log('[InlineImageEditor] 图片加载成功:', imageUrl.substring(0, 50));
      setOriginalImage(img);
      setIsLoading(false);
      const initialState: HistoryState = {
        filter: 'none', brightness: 100, contrast: 100, saturation: 100, rotation: 0, flipH: false, flipV: false,
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    };
    
    img.onerror = () => {
      console.error('[InlineImageEditor] 图片加载失败:', imageUrl);
      toast.error('无法加载图片，可能是跨域限制。请尝试使用其他图片来源。');
      setIsLoading(false);
    };
  }, [imageUrl]);

  // 绘制图片到 Canvas
  const drawImage = useCallback((img: HTMLImageElement = originalImage!, targetCanvas: HTMLCanvasElement) => {
    if (!img || !targetCanvas) return;
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    const rad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const newWidth = img.naturalWidth * cos + img.naturalHeight * sin;
    const newHeight = img.naturalWidth * sin + img.naturalHeight * cos;

    targetCanvas.width = newWidth;
    targetCanvas.height = newHeight;

    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    ctx.save();
    ctx.translate(targetCanvas.width / 2, targetCanvas.height / 2);
    ctx.rotate(rad);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    let filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    const preset = FILTER_PRESETS.find(f => f.name === filter);
    if (preset && preset.name !== 'none') filterString += ' ' + preset.filter;
    ctx.filter = filterString;

    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    if (text) {
      ctx.save();
      ctx.filter = 'none';
      ctx.font = `bold ${textSize}px sans-serif`;
      ctx.fillStyle = textColor;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = textSize / 8;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(text, targetCanvas.width / 2, targetCanvas.height / 2);
      ctx.fillText(text, targetCanvas.width / 2, targetCanvas.height / 2);
      ctx.restore();
    }
  }, [originalImage, brightness, contrast, saturation, filter, rotation, flipH, flipV, text, textColor, textSize]);

  // 更新预览
  useEffect(() => {
    if (originalImage && previewCanvasRef.current) {
      try {
        drawImage(originalImage, previewCanvasRef.current);
        const dataUrl = previewCanvasRef.current.toDataURL('image/png', 0.8);
        onChange(dataUrl);
      } catch (error) {
        console.error('[InlineImageEditor] Canvas 导出失败:', error);
        // 如果 Canvas 导出失败，使用原始图片 URL 作为备选
        toast.warning('图片编辑功能受限（跨域问题），将使用原始图片');
        onChange(imageUrl);
      }
    }
  }, [drawImage, originalImage, onChange, imageUrl]);

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
    if (direction === 'horizontal') setFlipH(prev => !prev);
    else setFlipV(prev => !prev);
    setTimeout(() => saveToHistory(), 100);
  }, [saveToHistory]);

  // 重置
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

  // 保存
  const handleSave = useCallback(() => {
    if (previewCanvasRef.current) {
      try {
        const dataUrl = previewCanvasRef.current.toDataURL('image/png', 1.0);
        console.log('[InlineImageEditor] 生成图片数据:', dataUrl.substring(0, 50) + '...');
        onSave(dataUrl);
      } catch (error) {
        console.error('[InlineImageEditor] 保存失败:', error);
        // 如果 Canvas 导出失败，尝试直接保存原始图片
        toast.warning('由于跨域限制，将保存原始图片');
        onSave(imageUrl);
      }
    }
  }, [onSave, imageUrl]);

  // 图标按钮组件
  const IconBtn = ({ icon: Icon, onClick, active = false, disabled = false, title }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-all ${
        active ? 'bg-purple-500 text-white' : 
        disabled ? 'opacity-30 cursor-not-allowed' : 
        isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2" />
        加载中...
      </div>
    );
  }

  return (
    <div className={`${isDark ? 'bg-gray-900/80' : 'bg-gray-50'}`}>
      {/* 顶部工具栏 - 紧凑布局 */}
      <div className={`flex items-center justify-between px-2 py-1.5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-1">
          {/* 收起/展开 */}
          <button
            onClick={() => setShowToolbar(!showToolbar)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            快捷编辑
            {showToolbar ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <div className={`w-px h-3 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

          {/* 撤销/重做 */}
          <IconBtn icon={Undo} onClick={handleUndo} disabled={historyIndex <= 0} title="撤销" />
          <IconBtn icon={Redo} onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="重做" />
        </div>

        {/* 保存/取消 */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            保存
          </button>
          <button
            onClick={onCancel}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            取消
          </button>
        </div>
      </div>

      {/* 展开的工具栏内容 */}
      <AnimatePresence>
        {showToolbar && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* 工具按钮行 */}
            <div className={`flex items-center gap-0.5 px-2 py-1.5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-x-auto`}>
              {/* Tab 切换 */}
              <button
                onClick={() => setActiveTab('filters')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  activeTab === 'filters' ? 'bg-purple-500 text-white' : isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                }`}
              >
                <Wand2 className="w-3 h-3" />
                滤镜
              </button>
              <button
                onClick={() => setActiveTab('adjust')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  activeTab === 'adjust' ? 'bg-purple-500 text-white' : isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                }`}
              >
                <Sliders className="w-3 h-3" />
                调整
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  activeTab === 'text' ? 'bg-purple-500 text-white' : isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                }`}
              >
                <Type className="w-3 h-3" />
                文字
              </button>

              <div className={`w-px h-4 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

              {/* 快捷操作 */}
              <IconBtn icon={RotateCcw} onClick={() => handleRotate('left')} title="左转" />
              <IconBtn icon={RotateCw} onClick={() => handleRotate('right')} title="右转" />
              <IconBtn icon={FlipHorizontal} onClick={() => handleFlip('horizontal')} active={flipH} title="水平翻转" />
              <IconBtn icon={FlipVertical} onClick={() => handleFlip('vertical')} active={flipV} title="垂直翻转" />

              <div className={`w-px h-4 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

              <button
                onClick={handleReset}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  isDark ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-200 text-gray-600'
                }`}
              >
                重置
              </button>
            </div>

            {/* 详细设置面板 */}
            <div className="px-2 py-2">
              {activeTab === 'filters' && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {FILTER_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => { setFilter(preset.name); saveToHistory(); }}
                      className={`flex-shrink-0 relative w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                        filter === preset.name ? 'border-purple-500' : isDark ? 'border-gray-700' : 'border-gray-200'
                      }`}
                    >
                      {originalImage && (
                        <img src={originalImage.src} alt={preset.label} className="w-full h-full object-cover" style={{ filter: preset.filter }} />
                      )}
                      <span className={`absolute inset-0 flex items-end justify-center pb-0.5 text-[8px] ${
                        isDark ? 'bg-gradient-to-t from-black/80 to-transparent text-white' : 'bg-gradient-to-t from-white/80 to-transparent text-gray-900'
                      }`}>
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'adjust' && (
                <div className="space-y-2">
                  {/* 亮度 */}
                  <div className="flex items-center gap-2">
                    <Sun className={`w-3.5 h-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <span className={`text-xs w-10 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>亮度</span>
                    <input
                      type="range" min="0" max="200" value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      onMouseUp={saveToHistory}
                      className={`flex-1 h-1 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                      style={{ background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${brightness / 2}%, ${isDark ? '#374151' : '#e5e7eb'} ${brightness / 2}%, ${isDark ? '#374151' : '#e5e7eb'} 100%)` }}
                    />
                    <span className={`text-xs w-8 text-right font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{brightness}%</span>
                  </div>

                  {/* 对比度 */}
                  <div className="flex items-center gap-2">
                    <Contrast className={`w-3.5 h-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <span className={`text-xs w-10 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>对比</span>
                    <input
                      type="range" min="0" max="200" value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      onMouseUp={saveToHistory}
                      className={`flex-1 h-1 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                      style={{ background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${contrast / 2}%, ${isDark ? '#374151' : '#e5e7eb'} ${contrast / 2}%, ${isDark ? '#374151' : '#e5e7eb'} 100%)` }}
                    />
                    <span className={`text-xs w-8 text-right font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{contrast}%</span>
                  </div>

                  {/* 饱和度 */}
                  <div className="flex items-center gap-2">
                    <Droplets className={`w-3.5 h-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <span className={`text-xs w-10 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>饱和</span>
                    <input
                      type="range" min="0" max="200" value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      onMouseUp={saveToHistory}
                      className={`flex-1 h-1 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                      style={{ background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${saturation / 2}%, ${isDark ? '#374151' : '#e5e7eb'} ${saturation / 2}%, ${isDark ? '#374151' : '#e5e7eb'} 100%)` }}
                    />
                    <span className={`text-xs w-8 text-right font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{saturation}%</span>
                  </div>
                </div>
              )}

              {activeTab === 'text' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text" value={text} onChange={(e) => setText(e.target.value)}
                      placeholder="输入文字..."
                      className={`flex-1 px-2 py-1.5 rounded text-sm border outline-none transition-colors ${
                        isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
                      }`}
                    />
                    <input
                      type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                      className="w-8 h-8 rounded border-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>大小</span>
                    <input
                      type="range" min="10" max="100" value={textSize}
                      onChange={(e) => setTextSize(Number(e.target.value))}
                      className={`flex-1 h-1 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                    />
                    <span className={`text-xs font-mono w-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{textSize}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 隐藏的 Canvas */}
      <canvas ref={previewCanvasRef} className="hidden" />
    </div>
  );
};

export default InlineImageEditor;
