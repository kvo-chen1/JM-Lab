/**
 * IP 海报拼接独立页面
 * 将生成的多个元素拼接成一张完整的展示海报
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rnd } from 'react-rnd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  LayoutGrid,
  LayoutTemplate,
  Type,
  Palette,
  Image,
  Check,
  Loader2,
  Copy,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Grid3X3,
  Layers,
  Film,
  BookOpen,
  Minimize2,
  Move,
  Edit3,
  MousePointer2,
  RotateCw,
  Maximize2,
  Trash2,
  Settings2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import {
  posterLayouts,
  defaultLayout,
  type PosterLayout,
  type LayoutArea,
  shadowSystem,
  premiumBackgrounds,
} from '@/config/posterLayouts';
import {
  exportElementToImage,
  copyImageToClipboard,
  type ExportOptions,
  type ExportProgress,
} from '@/utils/imageExport';

// Image mapping type
interface ImageMap {
  mainPoster?: string;
  threeViews?: string;
  emojiSheet?: string;
  actionSheet?: string;
  colorPalette?: string;
  merchandiseMockup?: string;
}

// Text content
interface TextContent {
  title: string;
  subtitle: string;
}

// Editable element
interface EditableElement extends LayoutArea {
  actualX: number;
  actualY: number;
  actualWidth: number;
  actualHeight: number;
  actualRotate: number;
}

// Layout icons mapping
const layoutIcons: Record<string, React.ReactNode> = {
  classic: <Grid3X3 className="w-5 h-5" />,
  magazine: <LayoutTemplate className="w-5 h-5" />,
  cinematic: <Film className="w-5 h-5" />,
  brandbook: <BookOpen className="w-5 h-5" />,
  masonry: <Layers className="w-5 h-5" />,
  'minimal-art': <Minimize2 className="w-5 h-5" />,
};

// Decoration element renderer
const DecorationElement: React.FC<{
  decoration: NonNullable<PosterLayout['decorations']>[number];
  layoutWidth: number;
  layoutHeight: number;
}> = ({ decoration, layoutWidth, layoutHeight }) => {
  const { type, x, y, size, color, opacity = 1 } = decoration;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    opacity,
    pointerEvents: 'none',
  };

  switch (type) {
    case 'circle':
      return (
        <div
          style={{
            ...style,
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: color,
            transform: 'translate(-50%, -50%)',
          }}
        />
      );
    case 'line':
      return (
        <div
          style={{
            ...style,
            width: `${size}%`,
            height: 2,
            backgroundColor: color,
          }}
        />
      );
    case 'dot':
      return (
        <div
          style={{
            ...style,
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: color,
            transform: 'translate(-50%, -50%)',
          }}
        />
      );
    default:
      return null;
  }
};

export default function IPPosterComposerPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get data from navigation state
  const { images, defaultTitle = '', defaultSubtitle = '' } = (location.state as {
    images?: ImageMap;
    defaultTitle?: string;
    defaultSubtitle?: string;
  }) || {};

  const [selectedLayout, setSelectedLayout] = useState<PosterLayout>(defaultLayout);
  const [textContent, setTextContent] = useState<TextContent>({
    title: defaultTitle,
    subtitle: defaultSubtitle,
  });
  const [zoom, setZoom] = useState(0.5);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 0.95,
    scale: 2,
    filename: `IP海报_${defaultTitle || '未命名'}`,
  });
  const [selectedBackground, setSelectedBackground] = useState<string>(selectedLayout.background || '#ffffff');

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableElements, setEditableElements] = useState<EditableElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Update background and editable elements when layout changes
  useEffect(() => {
    setSelectedBackground(selectedLayout.background || '#ffffff');
    const elements: EditableElement[] = selectedLayout.areas.map((area) => ({
      ...area,
      actualX: area.x,
      actualY: area.y,
      actualWidth: area.width,
      actualHeight: area.height,
      actualRotate: area.rotate || 0,
    }));
    setEditableElements(elements);
    setSelectedElementId(null);
  }, [selectedLayout]);

  // Reset zoom
  const handleResetZoom = () => setZoom(0.5);

  // Export poster
  const handleExport = async () => {
    if (!canvasRef.current) return;

    setIsExporting(true);
    setExportProgress(null);

    try {
      await exportElementToImage(
        canvasRef.current,
        exportOptions,
        (progress) => setExportProgress(progress)
      );
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!canvasRef.current) return;

    try {
      await copyImageToClipboard(canvasRef.current, exportOptions);
      alert('已复制到剪贴板！');
    } catch (error) {
      console.error('Copy failed:', error);
      alert('复制失败，请尝试导出后手动复制');
    }
  };

  // Get area image
  const getAreaImage = (area: LayoutArea): string | undefined => {
    switch (area.type) {
      case 'main':
        return images?.mainPoster;
      case 'threeViews':
        return images?.threeViews;
      case 'emojis':
        return images?.emojiSheet;
      case 'actions':
        return images?.actionSheet;
      case 'colors':
        return images?.colorPalette;
      case 'merchandise':
        return images?.merchandiseMockup;
      default:
        return undefined;
    }
  };

  // Get shadow style
  const getShadowStyle = (shadow?: LayoutArea['shadow']): string => {
    if (!shadow || shadow === 'none') return 'none';
    return shadowSystem[shadow] || shadowSystem.md;
  };

  // Update element properties
  const updateElement = useCallback((id: string, updates: Partial<EditableElement>) => {
    setEditableElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  }, []);

  // Delete element
  const deleteElement = useCallback((id: string) => {
    setEditableElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedElementId(null);
  }, []);

  // Reset element to initial position
  const resetElement = useCallback((id: string) => {
    const originalArea = selectedLayout.areas.find((a) => a.id === id);
    if (originalArea) {
      updateElement(id, {
        actualX: originalArea.x,
        actualY: originalArea.y,
        actualWidth: originalArea.width,
        actualHeight: originalArea.height,
        actualRotate: originalArea.rotate || 0,
      });
    }
  }, [selectedLayout.areas, updateElement]);

  // Render area content
  const renderAreaContent = (area: LayoutArea) => {
    const imageUrl = getAreaImage(area);

    if (area.type === 'decoration') {
      return <div className="w-full h-full" style={area.style} />;
    }

    if (area.type === 'title') {
      return (
        <div className="w-full h-full flex items-center justify-center p-2" style={area.style}>
          <input
            type="text"
            value={textContent.title}
            onChange={(e) => setTextContent({ ...textContent, title: e.target.value })}
            placeholder={area.label}
            className="w-full text-center bg-transparent border-none outline-none placeholder-gray-400/50"
            style={{ ...area.style, fontFamily: 'inherit' }}
          />
        </div>
      );
    }

    if (area.type === 'subtitle') {
      return (
        <div className="w-full h-full flex items-center justify-center p-2" style={area.style}>
          <textarea
            value={textContent.subtitle}
            onChange={(e) => setTextContent({ ...textContent, subtitle: e.target.value })}
            placeholder={area.label}
            className="w-full h-full text-center bg-transparent border-none outline-none placeholder-gray-400/50 resize-none"
            style={{ ...area.style, fontFamily: 'inherit' }}
            rows={2}
          />
        </div>
      );
    }

    if (imageUrl) {
      return (
        <div className="w-full h-full p-1 overflow-hidden" style={{ borderRadius: area.borderRadius || '12px' }}>
          <img
            src={imageUrl}
            alt={area.label}
            className="w-full h-full object-contain"
            style={{ borderRadius: 'inherit' }}
            crossOrigin="anonymous"
          />
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400/60 bg-gray-100/30 m-1" style={{ borderRadius: area.borderRadius || '12px' }}>
        <Image className="w-8 h-8 mb-2 opacity-40" />
        <span className="text-xs">{area.label}</span>
      </div>
    );
  };

  const selectedElement = editableElements.find((el) => el.id === selectedElementId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/ip-poster-generator')}
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white shadow-lg">
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">海报拼接</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isEditMode ? '自由编辑模式 - 拖拽调整元素位置' : '选择布局，打造专业级 IP 展示海报'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => {
              setIsEditMode(!isEditMode);
              setSelectedElementId(null);
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              isEditMode
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {isEditMode ? <MousePointer2 className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditMode ? '完成编辑' : '自由编辑'}
          </motion.button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Layout selection */}
        <AnimatePresence>
          {showLeftPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-r border-gray-200 dark:border-gray-800 overflow-hidden flex-shrink-0 bg-white dark:bg-gray-900"
            >
              <div className="w-80 h-full p-5 overflow-y-auto">
                {/* Layout selection - only show in non-edit mode */}
                {!isEditMode && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-blue-500" />
                      选择布局
                    </h3>
                    <div className="space-y-2.5">
                      {posterLayouts.map((layout) => (
                        <motion.button
                          key={layout.id}
                          onClick={() => setSelectedLayout(layout)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full p-3 rounded-2xl text-left transition-all duration-300 ${
                            selectedLayout.id === layout.id
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md border border-gray-100 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${
                              selectedLayout.id === layout.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
                            }`}>
                              {layoutIcons[layout.id] || <Grid3X3 className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm">{layout.name}</div>
                              <div className={`text-xs mt-0.5 line-clamp-2 ${
                                selectedLayout.id === layout.id ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {layout.description}
                              </div>
                            </div>
                            {selectedLayout.id === layout.id && (
                              <Check className="w-4 h-4 text-white flex-shrink-0" />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Background selection */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-500" />
                    背景样式
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(premiumBackgrounds).slice(0, 8).map(([key, bg]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedBackground(bg)}
                        className={`aspect-square rounded-xl transition-all ${
                          selectedBackground === bg ? 'ring-2 ring-blue-500 ring-offset-2 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ background: bg }}
                        title={key}
                      />
                    ))}
                  </div>
                </div>

                {/* Text editing */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <Type className="w-4 h-4 text-green-500" />
                    文字内容
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">标题</label>
                      <input
                        type="text"
                        value={textContent.title}
                        onChange={(e) => setTextContent({ ...textContent, title: e.target.value })}
                        className="w-full mt-1.5 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-gray-700 transition-shadow"
                        placeholder="输入标题..."
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">副标题</label>
                      <textarea
                        value={textContent.subtitle}
                        onChange={(e) => setTextContent({ ...textContent, subtitle: e.target.value })}
                        className="w-full mt-1.5 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-gray-700 transition-shadow resize-none"
                        placeholder="输入副标题..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Export options */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <Download className="w-4 h-4 text-orange-500" />
                    导出选项
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">格式</label>
                      <select
                        value={exportOptions.format}
                        onChange={(e) => setExportOptions({ ...exportOptions, format: e.target.value as ExportOptions['format'] })}
                        className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-gray-700"
                      >
                        <option value="png">PNG (透明背景)</option>
                        <option value="jpg">JPG (白色背景)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">分辨率</label>
                      <select
                        value={exportOptions.scale}
                        onChange={(e) => setExportOptions({ ...exportOptions, scale: Number(e.target.value) })}
                        className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-gray-700"
                      >
                        <option value={1}>1x (标准)</option>
                        <option value={2}>2x (高清)</option>
                        <option value={4}>4x (超清)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left panel toggle */}
        <button
          onClick={() => setShowLeftPanel(!showLeftPanel)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white dark:bg-gray-800 shadow-lg rounded-r-xl border border-l-0 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {showLeftPanel ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Center: Canvas preview */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-950 overflow-auto p-8 relative">
          {/* Zoom controls */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl px-5 py-3 z-10 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium w-16 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
            <button onClick={handleResetZoom} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas */}
          <div
            className="mx-auto transition-transform origin-top"
            style={{ width: selectedLayout.width, height: selectedLayout.height, transform: `scale(${zoom})` }}
          >
            <div
              ref={canvasRef}
              data-export-element
              className="relative w-full h-full overflow-hidden"
              style={{ background: selectedBackground, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
              onClick={() => setSelectedElementId(null)}
            >
              {/* Decoration elements */}
              {selectedLayout.decorations?.map((deco, index) => (
                <DecorationElement key={index} decoration={deco} layoutWidth={selectedLayout.width} layoutHeight={selectedLayout.height} />
              ))}

              {/* Layout areas - Edit mode uses Rnd */}
              {isEditMode ? (
                editableElements.map((element) => (
                  <Rnd
                    key={element.id}
                    size={{ width: `${element.actualWidth}%`, height: `${element.actualHeight}%` }}
                    position={{ x: (element.actualX / 100) * selectedLayout.width, y: (element.actualY / 100) * selectedLayout.height }}
                    onDragStop={(e, d) => {
                      const newX = (d.x / selectedLayout.width) * 100;
                      const newY = (d.y / selectedLayout.height) * 100;
                      updateElement(element.id, { actualX: newX, actualY: newY });
                    }}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      const newWidth = (parseInt(ref.style.width) / selectedLayout.width) * 100;
                      const newHeight = (parseInt(ref.style.height) / selectedLayout.height) * 100;
                      const newX = (position.x / selectedLayout.width) * 100;
                      const newY = (position.y / selectedLayout.height) * 100;
                      updateElement(element.id, { actualWidth: newWidth, actualHeight: newHeight, actualX: newX, actualY: newY });
                    }}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setSelectedElementId(element.id);
                    }}
                    bounds="parent"
                    className={`overflow-hidden transition-shadow ${
                      selectedElementId === element.id ? 'ring-2 ring-blue-500 ring-offset-2 z-50' : 'hover:ring-1 hover:ring-blue-300'
                    }`}
                    style={{
                      borderRadius: element.borderRadius || '0',
                      boxShadow: getShadowStyle(element.shadow),
                      transform: `rotate(${element.actualRotate}deg)`,
                      backdropFilter: element.glass ? 'blur(10px)' : undefined,
                      background: element.glass ? 'rgba(255, 255, 255, 0.1)' : undefined,
                      border: element.glass ? '1px solid rgba(255, 255, 255, 0.2)' : undefined,
                      zIndex: selectedElementId === element.id ? 100 : element.zIndex || 1,
                    }}
                  >
                    {renderAreaContent(element)}
                  </Rnd>
                ))
              ) : (
                editableElements.map((element) => (
                  <motion.div
                    key={element.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: editableElements.indexOf(element) * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="absolute overflow-hidden"
                    style={{
                      left: `${element.actualX}%`,
                      top: `${element.actualY}%`,
                      width: `${element.actualWidth}%`,
                      height: `${element.actualHeight}%`,
                      zIndex: element.zIndex || 1,
                      borderRadius: element.borderRadius || '0',
                      boxShadow: getShadowStyle(element.shadow),
                      transform: `rotate(${element.actualRotate}deg)`,
                      backdropFilter: element.glass ? 'blur(10px)' : undefined,
                      background: element.glass ? 'rgba(255, 255, 255, 0.1)' : undefined,
                      border: element.glass ? '1px solid rgba(255, 255, 255, 0.2)' : undefined,
                    }}
                  >
                    {renderAreaContent(element)}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right panel: Property editing */}
        <AnimatePresence>
          {isEditMode && showRightPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-l border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 flex-shrink-0"
            >
              <div className="w-75 h-full flex flex-col">
                {/* Panel header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-blue-500" />
                    属性编辑
                  </h3>
                </div>

                {/* Property content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {selectedElement ? (
                    <>
                      {/* Element info */}
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <div className="text-sm font-medium text-blue-900 dark:text-blue-100">{selectedElement.label}</div>
                        <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">类型: {selectedElement.type}</div>
                      </div>

                      {/* Position */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                          <Move className="w-3 h-3" /> 位置 (%)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-400">X</label>
                            <input
                              type="number"
                              value={Math.round(selectedElement.actualX)}
                              onChange={(e) => updateElement(selectedElement.id, { actualX: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Y</label>
                            <input
                              type="number"
                              value={Math.round(selectedElement.actualY)}
                              onChange={(e) => updateElement(selectedElement.id, { actualY: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Size */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                          <Maximize2 className="w-3 h-3" /> 尺寸 (%)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-400">宽度</label>
                            <input
                              type="number"
                              value={Math.round(selectedElement.actualWidth)}
                              onChange={(e) => updateElement(selectedElement.id, { actualWidth: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">高度</label>
                            <input
                              type="number"
                              value={Math.round(selectedElement.actualHeight)}
                              onChange={(e) => updateElement(selectedElement.id, { actualHeight: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Rotation */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                          <RotateCw className="w-3 h-3" /> 旋转 (度)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            value={selectedElement.actualRotate}
                            onChange={(e) => updateElement(selectedElement.id, { actualRotate: Number(e.target.value) })}
                            className="flex-1"
                          />
                          <input
                            type="number"
                            value={selectedElement.actualRotate}
                            onChange={(e) => updateElement(selectedElement.id, { actualRotate: Number(e.target.value) })}
                            className="w-16 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-center"
                          />
                        </div>
                      </div>

                      {/* Z-Index */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">层级 (z-index)</label>
                        <input
                          type="number"
                          value={selectedElement.zIndex || 1}
                          onChange={(e) => updateElement(selectedElement.id, { zIndex: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
                        />
                      </div>

                      {/* Border Radius */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">圆角</label>
                        <select
                          value={selectedElement.borderRadius || '0'}
                          onChange={(e) => updateElement(selectedElement.id, { borderRadius: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
                        >
                          <option value="0">无</option>
                          <option value="8px">小</option>
                          <option value="12px">中</option>
                          <option value="16px">大</option>
                          <option value="24px">超大</option>
                          <option value="50%">圆形</option>
                        </select>
                      </div>

                      {/* Shadow */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">阴影</label>
                        <select
                          value={selectedElement.shadow || 'none'}
                          onChange={(e) => updateElement(selectedElement.id, { shadow: e.target.value as LayoutArea['shadow'] })}
                          className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
                        >
                          <option value="none">无</option>
                          <option value="sm">小</option>
                          <option value="md">中</option>
                          <option value="lg">大</option>
                          <option value="xl">超大</option>
                          <option value="premium">高级</option>
                        </select>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                        <button
                          onClick={() => resetElement(selectedElement.id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-sm transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                          重置位置
                        </button>
                        <button
                          onClick={() => deleteElement(selectedElement.id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          删除元素
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <MousePointer2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">点击画布上的元素进行编辑</p>
                      <p className="text-xs mt-2 opacity-60">或拖拽调整位置和大小</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right panel toggle */}
        {isEditMode && (
          <button
            onClick={() => setShowRightPanel(!showRightPanel)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white dark:bg-gray-800 shadow-lg rounded-l-xl border border-r-0 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {showRightPanel ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-between p-5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono">
            {selectedLayout.width} x {selectedLayout.height} px
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            {selectedLayout.name} 布局
          </span>
          {isEditMode && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
              <Edit3 className="w-3 h-3" />
              编辑模式
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Export progress */}
          {isExporting && exportProgress && (
            <div className="flex items-center gap-3 mr-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{exportProgress.message}</span>
              <div className="w-28 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${exportProgress.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          <motion.button
            onClick={handleCopy}
            disabled={isExporting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 font-medium"
          >
            <Copy className="w-4 h-4" />
            复制
          </motion.button>

          <motion.button
            onClick={handleExport}
            disabled={isExporting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                导出海报
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
