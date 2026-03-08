import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore, DERIVATIVE_OPTIONS } from '../hooks/useAgentStore';
import { 
  Maximize2, 
  Download, 
  Share2, 
  Heart, 
  Trash2, 
  ZoomIn, 
  ZoomOut,
  Grid3X3,
  LayoutGrid,
  Wand2,
  Video,
  Film,
  Gift,
  Image,
  Smile,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export default function CanvasPanel() {
  const { isDark } = useTheme();
  const { 
    generatedOutputs, 
    selectedOutput, 
    selectOutput, 
    deleteOutput,
    currentTask,
    showSatisfactionModal,
    setShowSatisfactionModal,
    addMessage,
    setCurrentAgent
  } = useAgentStore();

  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<'gallery' | 'grid'>('gallery');
  const [showDerivativeOptions, setShowDerivativeOptions] = useState(false);
  const [selectedDerivative, setSelectedDerivative] = useState<string | null>(null);

  const selectedImage = generatedOutputs.find(out => out.id === selectedOutput);

  const handleZoomIn = () => setZoom(Math.min(zoom + 25, 200));
  const handleZoomOut = () => setZoom(Math.max(zoom - 25, 50));

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
    <div className={`flex flex-col h-full ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Toolbar */}
      <div className={`h-14 px-4 flex items-center justify-between border-b backdrop-blur-md ${
        isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'
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

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className={`text-xs w-12 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <ZoomIn className="w-4 h-4" />
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

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-hidden relative">
        {generatedOutputs.length === 0 ? (
          // Empty State
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <Wand2 className={`w-10 h-10 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              </motion.div>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                开始你的设计之旅
              </h3>
              <p className={`text-sm max-w-xs mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                在左侧对话框中描述你的设计需求，Agent会帮你完成创作
              </p>
            </div>
          </div>
        ) : (
          // Canvas with Generated Content
          <div className="absolute inset-0 overflow-auto p-8">
            <AnimatePresence mode="wait">
              {viewMode === 'gallery' ? (
                <motion.div
                  key="gallery"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-6"
                >
                  {/* Main Image */}
                  {selectedImage && (
                    <motion.div
                      layoutId={selectedImage.id}
                      className="relative max-w-3xl w-full"
                      style={{ transform: `scale(${zoom / 100})` }}
                    >
                      <div className={`rounded-2xl overflow-hidden shadow-2xl ${
                        isDark ? 'shadow-black/50' : 'shadow-gray-200'
                      }`}>
                        <img
                          src={selectedImage.url}
                          alt="Generated"
                          className="w-full h-auto"
                        />
                      </div>

                      {/* Satisfaction Check Modal */}
                      {showSatisfactionModal && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`absolute bottom-4 left-4 right-4 p-4 rounded-xl backdrop-blur-md ${
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
                  )}

                  {/* Thumbnail Strip */}
                  <div className={`flex gap-3 p-3 rounded-xl ${
                    isDark ? 'bg-gray-900/50' : 'bg-white/50'
                  }`}>
                    {generatedOutputs.map((output, index) => (
                      <motion.button
                        key={output.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => selectOutput(output.id)}
                        className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedOutput === output.id
                            ? 'border-[#C02C38] ring-2 ring-[#C02C38]/20'
                            : isDark ? 'border-gray-700' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={output.thumbnail || output.url}
                          alt={`Output ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                // Grid View
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {generatedOutputs.map((output, index) => (
                    <motion.button
                      key={output.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => selectOutput(output.id)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        selectedOutput === output.id
                          ? 'border-[#C02C38] ring-2 ring-[#C02C38]/20'
                          : isDark ? 'border-gray-700' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={output.thumbnail || output.url}
                        alt={`Output ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
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
    </div>
  );
}
