import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCanvasStore, WorkItem, IsolatedElement } from '../hooks/useCanvasStore';
import { WorkCard } from './WorkCard';
import { IsolatedElementCard } from './IsolatedElementCard';
import { CanvasControls } from './CanvasControls';
import { EmptyState } from './EmptyState';
import { Loader2, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { performElementIsolation } from '../services/elementIsolationService';

interface DraggableCanvasProps {
  isGenerating?: boolean;
  onWorkSelect?: (work: WorkItem) => void;
  onWorkDelete?: (id: string) => void;
  onWorkDownload?: (work: WorkItem) => void;
  onExampleClick?: (example: string) => void;
}

export const DraggableCanvas: React.FC<DraggableCanvasProps> = ({
  isGenerating = false,
  onWorkSelect,
  onWorkDelete,
  onWorkDownload,
  onExampleClick,
}) => {
  const { isDark } = useTheme();
  const {
    works,
    selectedWorkId,
    canvasPosition,
    canvasZoom,
    selectedTool,
    showGrid,
    viewMode,
    isDragging: isCanvasDragging,
    isSpacePressed,
    setCanvasPosition,
    setCanvasZoom,
    selectWork,
    updateWorkPosition,
    updateWork,
    setIsDragging: setIsCanvasDragging,
    setIsSpacePressed,
    resetCanvas,
    setSelectedTool,
    setShowGrid,
  } = useCanvasStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const rafRef = useRef<number | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const previousToolRef = useRef(selectedTool);
  const [isCardDragging, setIsCardDragging] = useState(false);

  // 元素编辑状态
  const [elementEditingWorkId, setElementEditingWorkId] = useState<string | null>(null);
  const [isolatedElements, setIsolatedElements] = useState<IsolatedElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isIsolating, setIsIsolating] = useState(false);
  const [isElementDragging, setIsElementDragging] = useState(false);

  // 处理画布鼠标按下
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 如果正在拖拽卡片，不处理画布拖拽
    if (isCardDragging) return;

    // 检查是否点击在卡片上
    const target = e.target as HTMLElement;
    if (target.closest('[data-work-card]')) return;

    // 只有在抓手工具、按住空格键、按住中键或Shift键时才允许拖拽
    if (selectedTool === 'hand' || isSpacePressed || e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      e.stopPropagation();
      setIsCanvasDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: canvasPosition.x,
        posY: canvasPosition.y,
      };
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, [canvasPosition, selectedTool, isSpacePressed, isCardDragging, setIsCanvasDragging]);

  // 处理画布鼠标移动
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isCanvasDragging) return;
    e.preventDefault();
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        const deltaX = lastMousePos.current.x - dragStartRef.current.x;
        const deltaY = lastMousePos.current.y - dragStartRef.current.y;
        setCanvasPosition({
          x: dragStartRef.current.posX + deltaX,
          y: dragStartRef.current.posY + deltaY,
        });
        rafRef.current = null;
      });
    }
  }, [isCanvasDragging, setCanvasPosition]);

  // 处理画布鼠标释放
  const handleMouseUp = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsCanvasDragging(false);
  }, [setIsCanvasDragging]);

  // 全局鼠标事件监听
  useEffect(() => {
    if (!isCanvasDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          const deltaX = lastMousePos.current.x - dragStartRef.current.x;
          const deltaY = lastMousePos.current.y - dragStartRef.current.y;
          setCanvasPosition({
            x: dragStartRef.current.posX + deltaX,
            y: dragStartRef.current.posY + deltaY,
          });
          rafRef.current = null;
        });
      }
    };

    const handleGlobalMouseUp = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setIsCanvasDragging(false);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove, { capture: true });
    document.addEventListener('mouseup', handleGlobalMouseUp, { capture: true });

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove, { capture: true });
      document.removeEventListener('mouseup', handleGlobalMouseUp, { capture: true });
    };
  }, [isCanvasDragging, setCanvasPosition, setIsCanvasDragging]);

  // 滚轮事件处理
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const rect = container.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // Ctrl+滚轮：缩放画布
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setCanvasZoom(Math.max(10, Math.min(300, canvasZoom * delta)));
      } else {
        // 普通滚轮：平移画布
        const scrollSpeed = 1.5;
        setCanvasPosition({
          x: canvasPosition.x - e.deltaX * scrollSpeed,
          y: canvasPosition.y - e.deltaY * scrollSpeed,
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [canvasZoom, canvasPosition, setCanvasZoom, setCanvasPosition]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        setIsSpacePressed(true);
        previousToolRef.current = selectedTool;
        setSelectedTool('hand');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        if (selectedTool === 'hand' && previousToolRef.current !== 'hand') {
          setSelectedTool(previousToolRef.current);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedTool, setSelectedTool, setIsSpacePressed]);

  // 网格背景样式
  const gridStyle = useMemo(() => {
    if (!showGrid) return {};
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const gridSize = 20;
    return {
      backgroundImage: `
        linear-gradient(${gridColor} 1px, transparent 1px),
        linear-gradient(90deg, ${gridColor} 1px, transparent 1px)
      `,
      backgroundSize: `${gridSize}px ${gridSize}px`,
      backgroundPosition: `${canvasPosition.x % gridSize}px ${canvasPosition.y % gridSize}px`,
    };
  }, [showGrid, isDark, canvasPosition]);

  // 光标样式
  const cursorStyle = useMemo(() => {
    if (isCanvasDragging) return 'grabbing';
    if (isSpacePressed || selectedTool === 'hand') return 'grab';
    if (selectedTool === 'move') return 'move';
    return 'default';
  }, [isCanvasDragging, isSpacePressed, selectedTool]);

  // 画布变换样式
  const canvasStyle = useMemo(() => ({
    transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${canvasZoom / 100})`,
    transformOrigin: 'center center',
    willChange: isCanvasDragging ? 'transform' : 'auto',
  }), [canvasPosition, canvasZoom, isCanvasDragging]);

  // 处理作品选择
  const handleWorkSelect = useCallback((work: WorkItem) => {
    if (!isCardDragging) {
      selectWork(work.id);
      onWorkSelect?.(work);
    }
  }, [isCardDragging, selectWork, onWorkSelect]);

  // 处理作品位置更新
  const handleWorkPositionChange = useCallback((id: string, x: number, y: number) => {
    updateWorkPosition(id, { x, y });
  }, [updateWorkPosition]);

  // 处理元素编辑
  const handleElementEdit = useCallback(async (workId: string) => {
    const work = works.find(w => w.id === workId);
    if (!work) return;

    if (elementEditingWorkId === workId) {
      // 退出元素编辑模式
      setElementEditingWorkId(null);
      // 保存到 work
      updateWork(workId, {
        isolatedElements,
        isElementSeparated: isolatedElements.length > 0,
      });
      toast.success('元素编辑已保存');
    } else {
      // 进入元素编辑模式
      setElementEditingWorkId(workId);
      setSelectedElementId(null);
      // 如果已有分离的元素，使用它们
      if (work.isolatedElements && work.isolatedElements.length > 0) {
        setIsolatedElements(work.isolatedElements);
      } else if (work.imageUrl) {
        // 自动识别元素
        setIsIsolating(true);
        try {
          toast.info('正在智能识别图片元素...');
          const elements = await performElementIsolation(work.imageUrl, work.id);
          setIsolatedElements(elements);
          toast.success(`成功分离 ${elements.length} 个元素`);
        } catch (error) {
          console.error('[DraggableCanvas] 元素分离失败:', error);
          toast.error('元素识别失败');
        } finally {
          setIsIsolating(false);
        }
      }
    }
  }, [elementEditingWorkId, works, isolatedElements, updateWork]);

  // 处理重新识别元素
  const handleReisolate = useCallback(async () => {
    if (!elementEditingWorkId) return;
    const work = works.find(w => w.id === elementEditingWorkId);
    if (!work?.imageUrl) return;

    setIsIsolating(true);
    try {
      toast.info('正在重新识别图片元素...');
      const elements = await performElementIsolation(work.imageUrl, work.id);
      setIsolatedElements(elements);
      toast.success(`成功分离 ${elements.length} 个元素`);
    } catch (error) {
      console.error('[DraggableCanvas] 元素分离失败:', error);
      toast.error('元素识别失败');
    } finally {
      setIsIsolating(false);
    }
  }, [elementEditingWorkId, works]);

  // 处理元素位置更新
  const handleElementPositionChange = useCallback((id: string, x: number, y: number) => {
    setIsolatedElements(prev => prev.map(el =>
      el.id === id ? { ...el, position: { ...el.position, x, y } } : el
    ));
  }, []);

  // 处理元素变换更新
  const handleElementTransformChange = useCallback((id: string, transform: Partial<IsolatedElement['transform']>) => {
    setIsolatedElements(prev => prev.map(el =>
      el.id === id ? { ...el, transform: { ...el.transform, ...transform } } : el
    ));
  }, []);

  // 处理元素样式更新
  const handleElementStyleChange = useCallback((id: string, style: Partial<IsolatedElement['style']>) => {
    setIsolatedElements(prev => prev.map(el =>
      el.id === id ? { ...el, style: { ...el.style, ...style } } : el
    ));
  }, []);

  // 处理删除元素
  const handleDeleteElement = useCallback((id: string) => {
    setIsolatedElements(prev => prev.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  }, [selectedElementId]);

  // 获取当前编辑的作品
  const elementEditingWork = elementEditingWorkId ? works.find(w => w.id === elementEditingWorkId) : null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${isDark ? 'bg-[#0a0f0a]' : 'bg-gray-50'}`}
      style={{ cursor: cursorStyle }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 网格背景 */}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={gridStyle}
        />
      )}

      {/* 画布内容 */}
      <div
        className="absolute inset-0 z-10"
        style={canvasStyle}
      >
        <div className="min-w-full min-h-full p-20">
          {works.length === 0 && !isGenerating ? (
            <EmptyState onExampleClick={onExampleClick} />
          ) : (
            <div className={`${viewMode === 'grid' ? 'grid grid-cols-3 gap-12' : 'flex flex-wrap gap-16'} justify-center`}>
              <AnimatePresence>
                {works.map((work, index) => (
                  <WorkCard
                    key={work.id}
                    work={work}
                    isSelected={selectedWorkId === work.id}
                    viewMode={viewMode}
                    canvasZoom={canvasZoom}
                    onSelect={() => handleWorkSelect(work)}
                    onPositionChange={(x, y) => handleWorkPositionChange(work.id, x, y)}
                    onDelete={() => onWorkDelete?.(work.id)}
                    onDownload={() => onWorkDownload?.(work)}
                    onDragStart={() => setIsCardDragging(true)}
                    onDragEnd={() => setIsCardDragging(false)}
                    onElementEdit={handleElementEdit}
                    isElementEditing={elementEditingWorkId === work.id}
                  />
                ))}
              </AnimatePresence>

              {/* 分离的元素卡片 - 显示在画布上 */}
              {elementEditingWork && isolatedElements.length > 0 && (
                <>
                  {isolatedElements.map((element, index) => (
                    <motion.div
                      key={element.id}
                      initial={{ opacity: 0, scale: 0.8, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      style={{
                        position: 'absolute',
                        left: elementEditingWork.position.x + element.position.x,
                        top: elementEditingWork.position.y + element.position.y,
                        width: element.position.width || 150,
                        height: element.position.height || 150,
                        zIndex: 1000 + index,
                      }}
                    >
                      <IsolatedElementCard
                        element={{
                          ...element,
                          position: {
                            ...element.position,
                            x: 0,
                            y: 0,
                          }
                        }}
                        isSelected={selectedElementId === element.id}
                        canvasZoom={canvasZoom}
                        onSelect={() => {
                          if (!isElementDragging) {
                            setSelectedElementId(selectedElementId === element.id ? null : element.id);
                          }
                        }}
                        onPositionChange={(x, y) => {
                          // 计算相对于原作品的位置
                          const relativeX = x - elementEditingWork.position.x;
                          const relativeY = y - elementEditingWork.position.y;
                          handleElementPositionChange(element.id, relativeX, relativeY);
                        }}
                        onTransformChange={(transform) => handleElementTransformChange(element.id, transform)}
                        onDragStart={() => setIsElementDragging(true)}
                        onDragEnd={() => setIsElementDragging(false)}
                      />
                    </motion.div>
                  ))}

                  {/* 元素编辑工具栏 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className={`absolute flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg ${
                      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                    }`}
                    style={{
                      left: elementEditingWork.position.x,
                      top: elementEditingWork.position.y - 50,
                      zIndex: 2000,
                    }}
                  >
                    <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      元素编辑模式
                    </span>
                    <div className={`w-px h-4 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <button
                      onClick={handleReisolate}
                      disabled={isIsolating}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        isDark
                          ? 'hover:bg-gray-700 text-gray-300'
                          : 'hover:bg-gray-100 text-gray-600'
                      } disabled:opacity-50`}
                    >
                      {isIsolating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      重新识别
                    </button>
                    <button
                      onClick={() => handleElementEdit(elementEditingWork.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      完成
                    </button>
                  </motion.div>

                  {/* 选中元素的属性面板 */}
                  <AnimatePresence>
                    {selectedElementId && (() => {
                      const selectedElement = isolatedElements.find(el => el.id === selectedElementId);
                      if (!selectedElement) return null;
                      return (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`absolute w-56 rounded-lg shadow-lg overflow-hidden ${
                            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                          }`}
                          style={{
                            left: elementEditingWork.position.x + (elementEditingWork.position.width || 448) + 520,
                            top: elementEditingWork.position.y,
                            zIndex: 2000,
                            maxHeight: '500px',
                          }}
                        >
                          {/* 属性面板头部 */}
                          <div className={`px-3 py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {selectedElement.name}
                            </h4>
                          </div>

                          {/* 属性面板内容 */}
                          <div className="p-3 space-y-4 overflow-y-auto" style={{ maxHeight: '450px' }}>
                            {/* 变换控制 */}
                            <div className="space-y-2">
                              <label className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                变换
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>缩放</span>
                                  <input
                                    type="range"
                                    min="10"
                                    max="500"
                                    value={Math.round(selectedElement.transform.scale * 100)}
                                    onChange={(e) => handleElementTransformChange(selectedElementId, { scale: Number(e.target.value) / 100 })}
                                    className="w-full h-1 mt-1"
                                  />
                                </div>
                                <div>
                                  <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>旋转</span>
                                  <input
                                    type="range"
                                    min="-180"
                                    max="180"
                                    value={selectedElement.transform.rotation}
                                    onChange={(e) => handleElementTransformChange(selectedElementId, { rotation: Number(e.target.value) })}
                                    className="w-full h-1 mt-1"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* 样式控制 */}
                            <div className="space-y-2">
                              <label className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                样式
                              </label>
                              <div className="space-y-2">
                                <div>
                                  <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>亮度</span>
                                  <input
                                    type="range"
                                    min="0"
                                    max="200"
                                    value={selectedElement.style.brightness}
                                    onChange={(e) => handleElementStyleChange(selectedElementId, { brightness: Number(e.target.value) })}
                                    className="w-full h-1 mt-1"
                                  />
                                </div>
                                <div>
                                  <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>对比度</span>
                                  <input
                                    type="range"
                                    min="0"
                                    max="200"
                                    value={selectedElement.style.contrast}
                                    onChange={(e) => handleElementStyleChange(selectedElementId, { contrast: Number(e.target.value) })}
                                    className="w-full h-1 mt-1"
                                  />
                                </div>
                                <div>
                                  <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>透明度</span>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={selectedElement.style.opacity}
                                    onChange={(e) => handleElementStyleChange(selectedElementId, { opacity: Number(e.target.value) })}
                                    className="w-full h-1 mt-1"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* 删除按钮 */}
                            <button
                              onClick={() => handleDeleteElement(selectedElementId)}
                              className={`w-full py-2 rounded text-xs transition-colors ${
                                isDark
                                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                  : 'bg-red-50 text-red-600 hover:bg-red-100'
                              }`}
                            >
                              删除元素
                            </button>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </>
              )}
              
              {/* 生成中状态 */}
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed ${
                    isDark 
                      ? 'border-gray-700 bg-gray-800/50' 
                      : 'border-gray-300 bg-gray-100/50'
                  }`}
                  style={{
                    width: viewMode === 'grid' ? 320 : 448,
                    height: 400,
                  }}
                >
                  <Loader2 className={`w-12 h-12 animate-spin mb-4 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    AI 正在创作中...
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    请稍候，精彩即将呈现
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 画布控制工具栏 */}
      <CanvasControls
        zoom={canvasZoom}
        onZoomChange={setCanvasZoom}
        onReset={resetCanvas}
        onToolChange={setSelectedTool}
        selectedTool={selectedTool}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        viewMode={viewMode}
        onViewModeChange={(mode) => useCanvasStore.setState({ viewMode: mode })}
      />

    </div>
  );
};

export default DraggableCanvas;
