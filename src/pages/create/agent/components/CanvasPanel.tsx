import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore, DERIVATIVE_OPTIONS } from '../hooks/useAgentStore';
import WorkCard from './WorkCard';
import CharacterDesignWorkflow from './CharacterDesignWorkflow';
import CanvasControls from './DraggableCanvas/CanvasControls';
import {
  Download,
  Share2,
  Heart,
  Trash2,
  Grid3X3,
  LayoutGrid,
  Wand2,
  Video,
  Film,
  Gift,
  Image,
  Smile,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

// 扩展 GeneratedOutput 类型以支持引用
type GeneratedOutputWithMention = GeneratedOutput & { isMentioned?: boolean };

// 图片加载状态管理组件
function ImageWithLoading({
  src,
  alt,
  className,
  onError,
  isGenerating = false
}: {
  src: string;
  alt: string;
  className?: string;
  onError?: () => void;
  isGenerating?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { isDark } = useTheme();

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
    onError?.();
  }, [onError]);

  // 如果是生成中状态，显示生成中提示
  if (isGenerating) {
    return (
      <div className={`flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'} ${className}`}>
        <div className="text-center px-4">
          <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-[#C02C38]" />
          <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>内容生成中...</p>
          <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>请稍候，AI正在为您创作</p>
        </div>
      </div>
    );
  }

  // 如果是加载错误，显示错误提示
  if (error) {
    return (
      <div className={`flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'} ${className}`}>
        <div className="text-center px-4">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>图片加载失败</p>
          <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>请检查网络连接或稍后重试</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className={`absolute inset-0 flex items-center justify-center ${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'} ${className}`}>
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        crossOrigin="anonymous"
      />
    </div>
  );
}

interface CanvasPanelProps {
  onFeedbackClick?: () => void;
}

export default function CanvasPanel({ onFeedbackClick }: CanvasPanelProps) {
  const { isDark } = useTheme();
  const {
    generatedOutputs,
    selectedOutput,
    selectOutput,
    deleteOutput,
    updateOutput,
    currentTask,
    showSatisfactionModal,
    setShowSatisfactionModal,
    addMessage,
    setCurrentAgent,
    setPendingMention
  } = useAgentStore();

  const [viewMode, setViewMode] = useState<'gallery' | 'grid'>('gallery');
  const [showDerivativeOptions, setShowDerivativeOptions] = useState(false);
  const [selectedDerivative, setSelectedDerivative] = useState<string | null>(null);

  // 画布控制状态
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [selectedTool, setSelectedTool] = useState<'select' | 'move' | 'hand'>('select');
  const [showGrid, setShowGrid] = useState(false);

  const selectedImage = generatedOutputs.find(out => out.id === selectedOutput);

  // 空格键状态和拖拽状态
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // 重置画布
  const handleResetCanvas = () => {
    setCanvasZoom(100);
    setCanvasPosition({ x: 0, y: 0 });
    setSelectedTool('select');
    setShowGrid(false);
    toast.success('画布已重置');
  };

  // 处理作品选择 - 自动聚焦并放大
  const handleSelectOutput = (id: string, event?: React.MouseEvent, index?: number, mode?: 'gallery' | 'grid') => {
    selectOutput(id);

    // 自动聚焦到作品并放大到合适大小
    const targetZoom = 100; // 放大到100%
    setCanvasZoom(targetZoom);

    // 计算居中位置
    if (canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const centerX = canvasRect.width / 2;
      const centerY = canvasRect.height / 2;

      // 估算卡片位置（基于索引）
      const cardWidth = mode === 'grid' ? 320 : 448; // 更准确的卡片宽度
      const cardHeight = 600; // 更准确的卡片高度（包含图片和文字）
      const gap = mode === 'grid' ? 96 : 128; // gap-24 或 gap-32
      const cols = mode === 'grid' ? 3 : 2;
      const padding = 80; // p-20 = 80px
      
      const row = Math.floor((index || 0) / cols);
      const col = (index || 0) % cols;
      
      // 计算卡片中心位置（相对于画布内容区域）
      const cardCenterX = col * (cardWidth + gap) + cardWidth / 2 + padding;
      const cardCenterY = row * (cardHeight + gap) + cardHeight / 2 + padding;

      // 计算需要平移的距离，使卡片居中
      setCanvasPosition({
        x: centerX - cardCenterX,
        y: centerY - cardCenterY
      });
    }

    toast.success('已聚焦到选中作品');
  };

  // 拖拽处理
  const handleMouseDown = (e: React.MouseEvent) => {
    // 只有在抓手工具、按住空格键、按住中键或Shift键时才允许拖拽
    if (selectedTool === 'hand' || isSpacePressed || e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: canvasPosition.x,
        posY: canvasPosition.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setCanvasPosition({
      x: dragStartRef.current.posX + deltaX,
      y: dragStartRef.current.posY + deltaY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 键盘事件处理 - 空格键
  useEffect(() => {
    console.log('[CanvasPanel] 键盘事件监听已添加');

    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('[CanvasPanel] 键盘按下:', e.code, '目标:', (e.target as HTMLElement).tagName);

      // 避免在输入框中触发
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        console.log('[CanvasPanel] 在输入框中，忽略');
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        console.log('[CanvasPanel] 空格键按下，切换到抓手工具');
        e.preventDefault();
        e.stopPropagation();
        setIsSpacePressed(true);
        setSelectedTool('hand');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      console.log('[CanvasPanel] 键盘释放:', e.code);

      if (e.code === 'Space') {
        console.log('[CanvasPanel] 空格键释放，恢复选择工具');
        e.preventDefault();
        e.stopPropagation();
        setIsSpacePressed(false);
        setSelectedTool('select');
      }
    };

    // 使用 capture 阶段确保事件被优先处理
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      console.log('[CanvasPanel] 键盘事件监听已移除');
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, []);

  // 滚轮事件处理 - 滚轮平移画布，Ctrl+滚轮缩放
  useEffect(() => {
    console.log('[CanvasPanel] 滚轮事件监听已添加');

    const handleWheel = (e: WheelEvent) => {
      // 只有在鼠标在画布区域内时才处理
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }

      // Ctrl+滚轮：缩放画布
      if (e.ctrlKey || e.metaKey) {
        console.log('[CanvasPanel] Ctrl+滚轮，缩放画布');
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -10 : 10;
        setCanvasZoom(prev => {
          const newZoom = Math.max(10, Math.min(300, prev + delta));
          console.log('[CanvasPanel] 缩放从', prev, '到', newZoom);
          return newZoom;
        });
      } else {
        // 普通滚轮：平移画布
        console.log('[CanvasPanel] 滚轮平移画布');
        e.preventDefault();
        e.stopPropagation();
        setCanvasPosition(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };

    // 使用 capture 阶段确保事件被优先处理
    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    return () => {
      console.log('[CanvasPanel] 滚轮事件监听已移除');
      window.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, []);

  // 调试日志
  console.log('[CanvasPanel] generatedOutputs:', generatedOutputs);
  console.log('[CanvasPanel] selectedOutput:', selectedOutput);
  console.log('[CanvasPanel] selectedImage:', selectedImage);

  const handleDownload = () => {
    if (selectedImage) {
      toast.success('图片已下载');
    }
  };

  const handleShare = () => {
    toast.success('分享链接已复制到剪贴板');
  };

  const handleFavorite = () => {
    toast.success('已添加到收藏');
  };

  const handleDelete = () => {
    if (selectedOutput) {
      deleteOutput(selectedOutput);
      toast.success('图片已删除');
    }
  };

  // 处理作品引用 - 将作品引用到对话输入框
  const handleMentionWork = useCallback((output: GeneratedOutput) => {
    const workTitle = output.title || '未命名作品';

    // 设置待处理的引用，ChatPanel 会监听这个状态并添加到输入框
    setPendingMention({
      type: 'work',
      name: workTitle,
      id: output.id
    });

    toast.success(`已引用作品：${workTitle}，请在输入框中描述您的需求`);
  }, [setPendingMention]);

  const handleSatisfactionResponse = (satisfied: boolean) => {
    setShowSatisfactionModal(false);
    
    if (satisfied) {
      addMessage({
        role: 'designer',
        content: '太好了！很高兴你喜欢这个设计。接下来我可以为你制作以下衍生内容，请选择你感兴趣的：',
        type: 'derivative-options',
        metadata: {
          derivativeOptions: DERIVATIVE_OPTIONS
        }
      });
      setShowDerivativeOptions(true);
    } else {
      addMessage({
        role: 'designer',
        content: '没问题！请告诉我你想要修改的地方，我会根据你的反馈进行调整。',
        type: 'text'
      });
    }
  };

  const handleDerivativeSelect = (derivativeId: string) => {
    setSelectedDerivative(derivativeId);
    const derivative = DERIVATIVE_OPTIONS.find(d => d.id === derivativeId);
    
    if (derivative) {
      addMessage({
        role: 'designer',
        content: `好的！我来为你${derivative.title}。在开始之前，我需要了解一些细节：`,
        type: 'text'
      });

      // 根据选择的衍生类型追问细节
      setTimeout(() => {
        let followUpQuestion = '';
        switch (derivative.type) {
          case 'video':
            followUpQuestion = '你想要什么主题的视频？比如：产品展示、品牌故事、使用教程等。';
            break;
          case 'short-film':
            followUpQuestion = '你想要什么样的故事情节？可以简单描述一下剧情大纲。';
            break;
          case 'merchandise':
            followUpQuestion = '你想要制作什么类型的文创周边？比如：T恤、马克杯、手机壳、帆布袋等。';
            break;
          case 'poster':
            followUpQuestion = '海报需要什么尺寸？用于什么场景？（线上推广/线下印刷）';
            break;
          case 'animation':
            followUpQuestion = '你想要什么类型的动态表情？比如：打招呼、感谢、开心、惊讶等。';
            break;
        }
        
        addMessage({
          role: 'designer',
          content: followUpQuestion,
          type: 'text'
        });
      }, 1000);
    }
  };

  const getDerivativeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5" />;
      case 'short-film': return <Film className="w-5 h-5" />;
      case 'merchandise': return <Gift className="w-5 h-5" />;
      case 'poster': return <Image className="w-5 h-5" />;
      case 'animation': return <Smile className="w-5 h-5" />;
      default: return <Wand2 className="w-5 h-5" />;
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-[#0a0f0a]' : 'bg-gray-50'}`}>
      {/* Toolbar - 固定在顶部 */}
      <div className={`flex-shrink-0 z-10 h-14 px-4 flex items-center justify-between border-b backdrop-blur-md ${
        isDark ? 'bg-[#1a1f1a]/50 border-[#2a2f2a]' : 'bg-white/50 border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {currentTask ? currentTask.title : '画布'}
          </span>
          {generatedOutputs.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
            }`}>
              {generatedOutputs.length} 个作品
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className={`flex items-center p-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <button
              onClick={() => setViewMode('gallery')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'gallery'
                  ? isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>

          <div className={`w-px h-4 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

          {/* Action Buttons */}
          {selectedImage && (
            <>
              <button
                onClick={handleDownload}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
                title="下载"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleShare}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
                title="分享"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleFavorite}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
                title="收藏"
              >
                <Heart className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className={`p-1.5 rounded-lg transition-colors hover:text-red-500 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Canvas Area - 无限画布模式 */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: isDragging ? 'grabbing' : (selectedTool === 'hand' || isSpacePressed) ? 'grab' : 'default'
        }}
      >
        {/* 角色设计工作流 - 当任务是IP角色设计时显示 */}
        {currentTask?.type === 'ip-character' && (
          <CharacterDesignWorkflow
            onComplete={(result) => {
              console.log('[CanvasPanel] 角色设计工作流完成:', result);
            }}
          />
        )}

        {generatedOutputs.length === 0 && currentTask?.type !== 'ip-character' ? (
          // Empty State - 优化深色主题样式
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                  isDark ? 'bg-[#1E1E2E] border border-[#2A2A3E]' : 'bg-white border border-gray-200'
                } shadow-lg`}
              >
                <Wand2 className={`w-10 h-10 ${isDark ? 'text-[#8B5CF6]' : 'text-gray-400'}`} />
              </motion.div>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                开始你的设计之旅
              </h3>
              <p className={`text-sm max-w-xs mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                在左侧对话框中描述你的设计需求，Agent会帮你完成创作
              </p>
            </div>
          </div>
        ) : (
          // 无限画布内容层 - 支持自由平移和缩放
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${canvasZoom / 100})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            <div className="p-20 min-w-max">
              <AnimatePresence mode="wait">
                {viewMode === 'gallery' ? (
                  <motion.div
                    key="gallery"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="inline-block"
                  >
                    {/* Work Cards - 自由排列 - 优化间距 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
                      {generatedOutputs.map((output, index) => (
                        <motion.div
                          key={output.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          data-output-id={output.id}
                        >
                          <WorkCard
                            data={{
                              id: output.id,
                              title: output.title || '未命名作品',
                              description: output.description || '暂无描述',
                              imageUrl: output.url,
                              thumbnailUrl: output.thumbnail || output.url,
                              createdAt: output.createdAt,
                              isFavorite: output.isFavorite
                            }}
                            isSelected={selectedOutput === output.id}
                            onSelect={(e) => handleSelectOutput(output.id, e, index, viewMode)}
                            onUpdate={(id, updates) => {
                              updateOutput(id, updates);
                            }}
                            onDelete={(id) => {
                              deleteOutput(id);
                            }}
                            onRefresh={(id) => {
                              toast.info('重新生成功能开发中...');
                            }}
                            onDownload={(data) => {
                              handleDownload();
                            }}
                            onMention={(data) => {
                              handleMentionWork(output);
                            }}
                            showMentionButton={true}
                          />
                        </motion.div>
                      ))}
                    </div>

                    {/* Satisfaction Check Modal */}
                    {showSatisfactionModal && selectedImage && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`fixed bottom-8 left-1/2 -translate-x-1/2 p-4 rounded-xl backdrop-blur-md z-50 ${
                          isDark
                            ? 'bg-gray-900/90 border border-gray-700'
                            : 'bg-white/90 border border-gray-200'
                        }`}
                      >
                        <p className={`text-sm mb-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                          请问你对当前设计满意吗？
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSatisfactionResponse(true)}
                            className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            满意
                          </button>
                          <button
                            onClick={() => handleSatisfactionResponse(false)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                              isDark
                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <X className="w-4 h-4" />
                            修改
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  // Grid View - 使用WorkCard的紧凑模式 - 优化间距
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="inline-block"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl p-8">
                      {generatedOutputs.map((output, index) => (
                        <motion.div
                          key={output.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="max-w-sm"
                        >
                          <WorkCard
                            data={{
                              id: output.id,
                              title: output.title || '未命名作品',
                              description: output.description || '暂无描述',
                              imageUrl: output.url,
                              thumbnailUrl: output.thumbnail || output.url,
                              createdAt: output.createdAt,
                              isFavorite: output.isFavorite
                            }}
                            isSelected={selectedOutput === output.id}
                            onSelect={(e) => handleSelectOutput(output.id, e, index, 'grid')}
                            onUpdate={(id, updates) => {
                              updateOutput(id, updates);
                            }}
                            onDelete={(id) => {
                              deleteOutput(id);
                            }}
                            onRefresh={(id) => {
                              toast.info('重新生成功能开发中...');
                            }}
                            onDownload={(data) => {
                              handleDownload();
                            }}
                            onMention={(data) => {
                              handleMentionWork(output);
                            }}
                            showMentionButton={true}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Derivative Options Panel */}
      <AnimatePresence>
        {showDerivativeOptions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`border-t ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white/50'}`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  选择衍生内容类型
                </h3>
                <button
                  onClick={() => setShowDerivativeOptions(false)}
                  className={`text-xs ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  关闭
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {DERIVATIVE_OPTIONS.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDerivativeSelect(option.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${
                      selectedDerivative === option.id
                        ? 'bg-gradient-to-r from-[#C02C38] to-[#E85D75] text-white'
                        : isDark 
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                          : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {getDerivativeIcon(option.type)}
                    <span className="text-xs text-center">{option.title}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部画布控制工具栏 */}
      <CanvasControls
        zoom={canvasZoom}
        onZoomChange={setCanvasZoom}
        onReset={handleResetCanvas}
        onToolChange={setSelectedTool}
        selectedTool={selectedTool}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onFeedbackClick={onFeedbackClick}
      />
    </div>
  );
}
