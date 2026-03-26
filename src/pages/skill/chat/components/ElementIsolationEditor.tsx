import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCanvasStore } from '../hooks/useCanvasStore';
import { IsolatedElementCard } from './IsolatedElementCard';
import { ElementPropertyPanel } from './ElementPropertyPanel';
import { ElementListPanel } from './ElementListPanel';
import { performElementIsolation } from '../services/elementIsolationService';
import { 
  Check, 
  X, 
  Loader2,
  Sparkles,
  Layers,
  Download,
  Grid3X3
} from 'lucide-react';
import { toast } from 'sonner';

interface ElementIsolationEditorProps {
  onClose: (save: boolean) => void;
}

export const ElementIsolationEditor: React.FC<ElementIsolationEditorProps> = ({
  onClose,
}) => {
  const { isDark } = useTheme();
  const {
    elementEditWorkId,
    works,
    isolatedElements,
    selectedElementId,
    canvasZoom,
    canvasPosition,
    selectIsolatedElement,
    updateElementTransform,
    updateElementStyle,
    updateElementPosition,
    toggleElementVisibility,
    toggleElementLock,
    deleteIsolatedElement,
    reorderElements,
    addIsolatedElement,
    setCanvasPosition,
    setCanvasZoom,
  } = useCanvasStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCardDragging, setIsCardDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // 获取当前编辑的作品
  const currentWork = works.find(w => w.id === elementEditWorkId);

  // 获取选中的元素
  const selectedElement = isolatedElements.find(el => el.id === selectedElementId) || null;

  // 自动执行元素分离（如果还没有分离的元素）
  useEffect(() => {
    if (currentWork?.imageUrl && isolatedElements.length === 0 && !isProcessing) {
      handleAutoIsolate();
    }
  }, [currentWork?.imageUrl]);

  // 自动分离元素
  const handleAutoIsolate = async () => {
    if (!currentWork?.imageUrl || !elementEditWorkId) return;

    setIsProcessing(true);
    try {
      toast.info('正在智能识别图片元素...');
      const elements = await performElementIsolation(currentWork.imageUrl, elementEditWorkId);
      
      // 添加到 store
      elements.forEach(element => {
        addIsolatedElement(element);
      });
      
      toast.success(`成功分离 ${elements.length} 个元素`);
    } catch (error) {
      console.error('[ElementIsolationEditor] 元素分离失败:', error);
      toast.error('元素分离失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理元素选择
  const handleSelectElement = useCallback((id: string) => {
    if (!isCardDragging) {
      selectIsolatedElement(id);
    }
  }, [isCardDragging, selectIsolatedElement]);

  // 处理位置更新
  const handlePositionChange = useCallback((id: string, x: number, y: number) => {
    updateElementPosition(id, { x, y });
  }, [updateElementPosition]);

  // 处理变换更新
  const handleTransformChange = useCallback((id: string, transform: Parameters<typeof updateElementTransform>[1]) => {
    updateElementTransform(id, transform);
  }, [updateElementTransform]);

  // 处理样式更新
  const handleStyleChange = useCallback((id: string, style: Parameters<typeof updateElementStyle>[1]) => {
    updateElementStyle(id, style);
  }, [updateElementStyle]);

  // 处理保存
  const handleSave = useCallback(() => {
    onClose(true);
    toast.success('元素编辑已保存');
  }, [onClose]);

  // 处理取消
  const handleCancel = useCallback(() => {
    onClose(false);
    toast.info('已取消元素编辑');
  }, [onClose]);

  // 处理画布点击（取消选择）
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectIsolatedElement(null);
    }
  }, [selectIsolatedElement]);

  // 网格背景样式
  const gridStyle = showGrid ? {
    backgroundImage: `
      linear-gradient(${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px),
      linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px)
    `,
    backgroundSize: '20px 20px',
  } : {};

  // 画布变换样式
  const canvasTransformStyle = {
    transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${canvasZoom / 100})`,
    transformOrigin: 'center center',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
    >
      {/* 顶部工具栏 */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-500" />
            <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              编辑元素
            </h2>
          </div>
          
          {currentWork && (
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {currentWork.title}
            </span>
          )}

          {/* 工具按钮 */}
          <div className="flex items-center gap-1 ml-4">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg transition-colors ${
                showGrid
                  ? 'bg-purple-500 text-white'
                  : isDark
                    ? 'hover:bg-gray-800 text-gray-400'
                    : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="显示/隐藏网格"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 重新识别按钮 */}
          <button
            onClick={handleAutoIsolate}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            重新识别
          </button>

          {/* 取消按钮 */}
          <button
            onClick={handleCancel}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <X className="w-4 h-4" />
            取消
          </button>

          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-purple-500 text-white hover:bg-purple-600 transition-colors"
          >
            <Check className="w-4 h-4" />
            完成编辑
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧元素列表 */}
        <ElementListPanel
          elements={isolatedElements}
          selectedElementId={selectedElementId}
          onSelectElement={handleSelectElement}
          onToggleVisibility={toggleElementVisibility}
          onToggleLock={toggleElementLock}
          onDeleteElement={deleteIsolatedElement}
          onReorderElements={reorderElements}
        />

        {/* 中间画布区域 */}
        <div 
          className={`flex-1 relative overflow-hidden ${
            isDark ? 'bg-[#0a0f0a]' : 'bg-gray-50'
          }`}
          onClick={handleCanvasClick}
        >
          {/* 网格背景 */}
          {showGrid && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={gridStyle}
            />
          )}

          {/* 画布内容 */}
          <div 
            className="absolute inset-0 overflow-auto"
            style={canvasTransformStyle}
          >
            <div className="relative min-w-full min-h-full p-20" style={{ minWidth: '2000px', minHeight: '2000px' }}>
              {/* 分离的元素卡片 */}
              <AnimatePresence>
                {isolatedElements.map((element) => (
                  <IsolatedElementCard
                    key={element.id}
                    element={element}
                    isSelected={selectedElementId === element.id}
                    canvasZoom={canvasZoom}
                    onSelect={() => handleSelectElement(element.id)}
                    onPositionChange={(x, y) => handlePositionChange(element.id, x, y)}
                    onTransformChange={(transform) => handleTransformChange(element.id, transform)}
                    onDragStart={() => setIsCardDragging(true)}
                    onDragEnd={() => setIsCardDragging(false)}
                  />
                ))}
              </AnimatePresence>

              {/* 空状态 */}
              {isolatedElements.length === 0 && !isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Layers className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                    <p className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      暂无分离的元素
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      点击"重新识别"按钮自动识别图片中的元素
                    </p>
                  </div>
                </div>
              )}

              {/* 处理中状态 */}
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      正在智能识别元素...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 画布控制提示 */}
          <div className={`absolute bottom-4 left-4 px-3 py-2 rounded-lg text-xs ${
            isDark ? 'bg-gray-800/80 text-gray-400' : 'bg-white/80 text-gray-500'
          }`}>
            滚轮缩放 · 拖拽移动 · 点击选择
          </div>
        </div>

        {/* 右侧属性面板 */}
        <ElementPropertyPanel
          element={selectedElement}
          onTransformChange={(transform) => selectedElementId && handleTransformChange(selectedElementId, transform)}
          onStyleChange={(style) => selectedElementId && handleStyleChange(selectedElementId, style)}
          onToggleVisibility={() => selectedElementId && toggleElementVisibility(selectedElementId)}
          onToggleLock={() => selectedElementId && toggleElementLock(selectedElementId)}
          onDelete={() => selectedElementId && deleteIsolatedElement(selectedElementId)}
        />
      </div>
    </motion.div>
  );
};

export default ElementIsolationEditor;
