import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useJinbi } from '@/hooks/useJinbi';
import { useCreateStore } from '../hooks/useCreateStore';
import { traditionalPatterns } from '../data';
import { toast } from 'sonner';
import HistoryPanel from './HistoryPanel';
import DraggableCanvas from './DraggableCanvas';
import { SmartLayoutCanvas } from './SmartLayoutCanvas';
import { SmartLayoutPreview } from './SmartLayoutPreview';
import { LayoutGrid, GalleryHorizontal } from 'lucide-react';
import JinbiInsufficientModal from '@/components/jinbi/JinbiInsufficientModal';
import { IPMascotVideoLoader } from '@/components/ip-mascot';

interface CanvasAreaProps {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

type ViewMode = 'gallery' | 'canvas';

export default function CanvasArea({ isSidebarCollapsed, setIsSidebarCollapsed }: CanvasAreaProps) {
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const generatedResults = useCreateStore((state) => state.generatedResults);
  const selectedResult = useCreateStore((state) => state.selectedResult);
  const setSelectedResult = useCreateStore((state) => state.setSelectedResult);
  const setPrompt = useCreateStore((state) => state.setPrompt);
  const isGenerating = useCreateStore((state) => state.isGenerating);
  const currentStep = useCreateStore((state) => state.currentStep);
  const activeTool = useCreateStore((state) => state.activeTool);
  const selectedPatternId = useCreateStore((state) => state.selectedPatternId);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  
  // 样式预览状态管理
  const [selectedBorderStyle, setSelectedBorderStyle] = useState('none');
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [selectedBackground, setSelectedBackground] = useState('transparent');
  const [selectedLayout, setSelectedLayout] = useState('center');
  const [isStylePanelExpanded, setIsStylePanelExpanded] = useState(false);
  
  // 纹样属性状态 - 从全局状态获取
  const patternOpacity = useCreateStore((state) => state.patternOpacity);
  const patternScale = useCreateStore((state) => state.patternScale);
  const patternRotation = useCreateStore((state) => state.patternRotation);
  const patternBlendMode = useCreateStore((state) => state.patternBlendMode);
  const patternTileMode = useCreateStore((state) => state.patternTileMode);
  const patternPositionX = useCreateStore((state) => state.patternPositionX);
  const patternPositionY = useCreateStore((state) => state.patternPositionY);
  const updateState = useCreateStore((state) => state.updateState);
  
  // 新添加的状态管理函数
  const saveToDrafts = useCreateStore((state) => state.saveToDrafts);
  const shareDesign = useCreateStore((state) => state.shareDesign);
  const applyToOtherTool = useCreateStore((state) => state.applyToOtherTool);
  const deleteGeneratedResult = useCreateStore((state) => state.deleteGeneratedResult);
  
  // 智能排版相关状态
  const smartLayoutConfig = useCreateStore((state) => state.smartLayoutConfig);
  const layoutRecommendation = useCreateStore((state) => state.layoutRecommendation);

  // 津币相关状态
  const {
    balance: jinbiBalance,
    consumeJinbi,
    checkBalance,
  } = useJinbi();
  const [showJinbiModal, setShowJinbiModal] = useState(false);
  const EXPORT_COST = 50; // 导出图片消耗50津币

  // 仅在初始加载且没有选中任何作品时，自动选择第一张图片
  useEffect(() => {
    // 只在 generatedResults 从空变为有数据时执行，避免覆盖用户手动选择
    if (generatedResults.length > 0 && !selectedResult) {
      setSelectedResult(generatedResults[0].id);
    }
    // 如果当前选中的作品不在列表中，则清除选择
    else if (selectedResult && !generatedResults.some(result => result.id === selectedResult)) {
      setSelectedResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedResults.length]); // 只监听数量变化，不监听 selectedResult

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch(err => {
          console.warn("当前环境禁止全屏 API:", err);
        });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => {
            setIsFullscreen(false);
          })
          .catch(err => console.warn("退出全屏失败:", err));
      }
    }
  };

  // 导出纹样图片功能
  const handleExportPatternImage = async () => {
    try {
      if (!selectedResult) return;

      // 检查津币余额
      const balanceCheck = await checkBalance(EXPORT_COST);
      if (!balanceCheck.sufficient) {
        setShowJinbiModal(true);
        return;
      }

      const selectedImage = generatedResults.find(r => r.id === selectedResult);
      if (!selectedImage) return;

      const patternImage = selectedPatternId ? traditionalPatterns.find(p => p.id === selectedPatternId) : null;
      if (!patternImage) return;

      // 消费津币
      const consumeResult = await consumeJinbi(
        EXPORT_COST,
        'export',
        '导出纹样图片',
        { serviceParams: { type: 'pattern_export' } }
      );

      if (!consumeResult.success) {
        toast.error('津币扣除失败：' + consumeResult.error);
        return;
      }

      toast.success(`已消耗 ${EXPORT_COST} 津币`, { duration: 2000 });

      // 创建临时图像元素
      const originalImg = new Image();
      originalImg.crossOrigin = 'anonymous';
      originalImg.src = selectedImage.thumbnail;

      await new Promise((resolve, reject) => {
        originalImg.onload = resolve;
        originalImg.onerror = reject;
      });

      const patternImg = new Image();
      patternImg.crossOrigin = 'anonymous';
      patternImg.src = patternImage.thumbnail;

      await new Promise((resolve, reject) => {
        patternImg.onload = resolve;
        patternImg.onerror = reject;
      });

      // 创建 Canvas 元素
      const canvas = document.createElement('canvas');
      canvas.width = originalImg.width;
      canvas.height = originalImg.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 绘制原图
      ctx.drawImage(originalImg, 0, 0);

      // 绘制纹样
      ctx.globalAlpha = patternOpacity / 100;
      ctx.globalCompositeOperation = patternBlendMode as any;

      // 计算纹样绘制区域
      const scaleFactor = patternScale / 100;
      const patternWidth = patternImg.width * scaleFactor;
      const patternHeight = patternImg.height * scaleFactor;

      // 计算起始位置
      const offsetX = (canvas.width - patternWidth) * (patternPositionX / 100);
      const offsetY = (canvas.height - patternHeight) * (patternPositionY / 100);

      // 保存当前上下文状态
      ctx.save();

      // 旋转和缩放
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((patternRotation * Math.PI) / 180);
      ctx.scale(scaleFactor, scaleFactor);

      // 根据平铺方式绘制纹样
      if (patternTileMode === 'repeat') {
        // 重复平铺
        const pattern = ctx.createPattern(patternImg, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        }
      } else if (patternTileMode === 'no-repeat') {
        // 不重复
        ctx.drawImage(patternImg, -patternWidth / 2, -patternHeight / 2);
      } else if (patternTileMode === 'repeat-x') {
        // 水平重复
        for (let x = -canvas.width / 2; x < canvas.width / 2; x += patternWidth) {
          ctx.drawImage(patternImg, x, -patternHeight / 2);
        }
      } else if (patternTileMode === 'repeat-y') {
        // 垂直重复
        for (let y = -canvas.height / 2; y < canvas.height / 2; y += patternHeight) {
          ctx.drawImage(patternImg, -patternWidth / 2, y);
        }
      }

      // 恢复上下文状态
      ctx.restore();

      // 重置全局属性
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // 导出图片
      const link = document.createElement('a');
      link.download = `纹样作品_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      console.log('纹样图片导出成功');
    } catch (error) {
      console.error('导出纹样图片失败:', error);
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 获取当前选中的纹样
  const selectedPattern = traditionalPatterns.find(p => p.id === selectedPatternId);

  const isEmpty = generatedResults.length === 0;

  return (
    <div className={`flex-1 flex flex-col relative transition-colors ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Canvas Toolbar / Header - Glassmorphism */}
      <div className={`h-16 px-6 flex items-center justify-between border-b backdrop-blur-md z-10 ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'}`}>
        <div className="font-medium text-sm flex items-center gap-2">
          <motion.button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center gap-2 transition-all ${isDark ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40' : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'} hover:scale-105 active:scale-95`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isSidebarCollapsed ? '展开工具栏' : '收起工具栏'}
          >
            <i className={`fas fa-layer-group transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}></i>
            <span>CANVAS</span>
          </motion.button>
          <i className="fas fa-chevron-right text-[10px] opacity-30"></i>
          <span className={isDark ? 'text-gray-200' : 'text-gray-900'}>
            {activeTool === 'sketch' ? 'AI创作工坊' : activeTool === 'pattern' ? '纹样嵌入' : '创作预览'}
          </span>
        </div>
        
        {/* View Controls & Actions */}
        <div className="flex items-center gap-3 pr-12 md:pr-0">
          {/* 视图模式切换 */}
          {!isEmpty && (
            <div className={`flex items-center p-1 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('gallery')}
                className={`p-2 rounded-md transition-all flex items-center gap-1.5 ${
                  viewMode === 'gallery'
                    ? isDark 
                      ? 'bg-gray-700 text-white shadow-sm' 
                      : 'bg-white text-gray-900 shadow-sm'
                    : isDark 
                      ? 'text-gray-400 hover:text-gray-200' 
                      : 'text-gray-500 hover:text-gray-700'
                }`}
                title="画廊预览模式"
              >
                <GalleryHorizontal className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">画廊</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('canvas')}
                className={`p-2 rounded-md transition-all flex items-center gap-1.5 ${
                  viewMode === 'canvas'
                    ? isDark 
                      ? 'bg-gray-700 text-white shadow-sm' 
                      : 'bg-white text-gray-900 shadow-sm'
                    : isDark 
                      ? 'text-gray-400 hover:text-gray-200' 
                      : 'text-gray-500 hover:text-gray-700'
                }`}
                title="画布拖拽模式"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">画布</span>
              </motion.button>
            </div>
          )}

          <div className={`h-4 w-px mx-1 ${isDark ? 'bg-gray-800' : 'bg-gray-300'}`}></div>

          <button 
            onClick={() => {
              if (isEmpty) {
                toast.error('请先生成作品后再进行AI点评');
                return;
              }
              useCreateStore.getState().updateState({ showAIReview: true });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${isEmpty ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-600 shadow-sm border border-gray-200'}`}
          >
            <i className="fas fa-magic text-purple-500"></i>
            <span className="hidden sm:inline">AI点评</span>
          </button>
          
          <button 
            onClick={() => {
              if (isEmpty) {
                toast.error('请先生成作品后再保存到草稿箱');
                return;
              }
              saveToDrafts();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${isEmpty ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-600 shadow-sm border border-gray-200'}`}
          >
            <i className="fas fa-box-archive text-yellow-500"></i>
            <span className="hidden sm:inline">保存到草稿箱</span>
          </button>
          
          <button 
            onClick={() => setShowHistory(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-600 shadow-sm border border-gray-200'}`}
          >
            <i className="fas fa-history text-green-500"></i>
            <span className="hidden sm:inline">历史记录</span>
          </button>
          
          <button 
            onClick={() => useCreateStore.getState().updateState({ showPublishModal: true })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${isDark ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'}`}
          >
            <i className="fas fa-globe"></i>
            <span className="hidden sm:inline">发布到广场</span>
          </button>

          <div className={`h-4 w-px mx-1 ${isDark ? 'bg-gray-800' : 'bg-gray-300'}`}></div>

          <button onClick={handleFullscreenToggle} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`} title={isFullscreen ? "退出全屏" : "全屏"}>
            <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-xs`}></i>
          </button>
          
          {/* 测试按钮 - 手动触发IP形象动画 */}
          <button 
            onClick={() => {
              const store = useCreateStore.getState();
              store.setIsGenerating(!store.isGenerating);
            }}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-pink-400' : 'hover:bg-gray-200 text-pink-500'}`}
            title="测试IP形象动画"
          >
            <i className="fas fa-palette text-xs"></i>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* IP形象视频加载动画 - 生成时显示在右侧画布区域 */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] flex items-center justify-center"
              style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)' }}
            >
              <IPMascotVideoLoader
                isVisible={true}
                message="AI正在创作中..."
                progress={0}
                showProgress={false}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-950"
            >
              <div className="text-center max-w-lg">
                <div className={`w-32 h-32 mx-auto mb-8 rounded-full flex items-center justify-center text-5xl shadow-2xl relative ${isDark ? 'bg-gray-800 text-red-500' : 'bg-white text-[#C02C38]'}`}>
                  {/* Decorative Rings */}
                  <div className="absolute inset-0 rounded-full border-4 border-current opacity-10 animate-ping-slow"></div>
                  <div className="absolute -inset-4 rounded-full border border-current opacity-5"></div>
                  
                  <i className={`fas fa-${activeTool === 'sketch' ? 'magic' : 'paint-brush'}`}></i>
                </div>
                <h2 className={`text-2xl font-bold mb-3 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  开始您的AI创作之旅
                </h2>
                <p className={`mb-8 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  在左侧选择工具，或在右侧面板配置创意参数。<br/>
                  点击"生成"即可见证灵感化为现实。
                </p>
              </div>
            </motion.div>
          ) : viewMode === 'canvas' ? (
            <motion.div
              key="canvas"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-50 dark:bg-gray-950 w-full h-full"
            >
              {/* 拖拽画布模式 */}
              <DraggableCanvas
                works={generatedResults}
                selectedWorkId={selectedResult}
                onSelectWork={setSelectedResult}
                onDeleteWork={(id) => {
                  deleteGeneratedResult(id);
                  toast.success('作品已删除');
                }}
                onDoubleClickWork={(work) => {
                  // 双击打开详情或预览
                  console.log('Double clicked work:', work);
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="gallery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 overflow-y-auto p-4 sm:p-8 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}
            >
              {/* 传统画廊预览模式 */}
              <div className="w-full flex flex-col items-center z-0 pb-6">
                {/* Focus View - 支持智能排版 - 全屏沉浸式 */}
                <div className={`w-full flex items-center justify-center min-h-[300px] mb-8 px-4 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                  {selectedResult ? (
                    <div className="relative w-full max-w-5xl">
                      <SmartLayoutCanvas
                        selectedResult={selectedResult}
                        generatedResults={generatedResults}
                        layoutRecommendation={layoutRecommendation}
                        smartLayoutConfig={smartLayoutConfig}
                        selectedBorderStyle={selectedBorderStyle}
                        selectedFilter={selectedFilter}
                        selectedBackground={selectedBackground}
                        selectedPatternId={selectedPatternId}
                        activeTool={activeTool}
                        patternOpacity={patternOpacity}
                        patternScale={patternScale}
                        patternRotation={patternRotation}
                        patternBlendMode={patternBlendMode}
                        patternTileMode={patternTileMode}
                        patternPositionX={patternPositionX}
                        patternPositionY={patternPositionY}
                        isFullscreen={isFullscreen}
                        handleFullscreenToggle={handleFullscreenToggle}
                        handleExportPatternImage={handleExportPatternImage}
                      />
                    </div>
                  ) : (
                    <div className="text-gray-400">请选择一张图片进行预览</div>
                  )}
                </div>

                {selectedPatternId && activeTool === 'pattern' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
                    className={`w-full max-w-4xl backdrop-blur-md p-5 rounded-2xl border mb-6 shadow-lg ${isDark ? 'bg-black/50 border-white/20' : 'bg-white/50 border-gray-200'}`}
                  >
                    <div className="flex flex-col gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
                      >
                        <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>纹样属性</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* 透明度控制 */}
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.25, ease: "easeOut" }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <label className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>透明度</label>
                              <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{patternOpacity}%</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={patternOpacity}
                              onChange={(e) => updateState({ patternOpacity: parseInt(e.target.value) })}
                              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-300 dark:bg-gray-700"
                              style={{
                                background: `linear-gradient(to right, #C02C38 0%, #C02C38 ${patternOpacity}%, ${isDark ? '#374151' : '#D1D5DB'} ${patternOpacity}%, ${isDark ? '#374151' : '#D1D5DB'} 100%)`
                              }}
                            />
                          </motion.div>
                          
                          {/* 缩放控制 */}
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <label className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>缩放</label>
                              <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{patternScale}%</span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="200"
                              value={patternScale}
                              onChange={(e) => updateState({ patternScale: parseInt(e.target.value) })}
                              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-300 dark:bg-gray-700"
                              style={{
                                background: `linear-gradient(to right, #C02C38 0%, #C02C38 ${(patternScale - 50) / 1.5}%, ${isDark ? '#374151' : '#D1D5DB'} ${(patternScale - 50) / 1.5}%, ${isDark ? '#374151' : '#D1D5DB'} 100%)`
                              }}
                            />
                          </motion.div>
                          
                          {/* 旋转控制 */}
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.35, ease: "easeOut" }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <label className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>旋转</label>
                              <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{patternRotation}°</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="360"
                              value={patternRotation}
                              onChange={(e) => updateState({ patternRotation: parseInt(e.target.value) })}
                              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-300 dark:bg-gray-700"
                              style={{
                                background: `linear-gradient(to right, #C02C38 0%, #C02C38 ${patternRotation / 3.6}%, ${isDark ? '#374151' : '#D1D5DB'} ${patternRotation / 3.6}%, ${isDark ? '#374151' : '#D1D5DB'} 100%)`
                              }}
                            />
                          </motion.div>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.4, ease: "easeOut" }}
                      >
                        <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>高级设置</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* 混合模式 */}
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.45, ease: "easeOut" }}
                          >
                            <label className={`text-xs block mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>混合模式</label>
                            <motion.select
                              value={patternBlendMode}
                              onChange={(e) => updateState({ patternBlendMode: e.target.value as any })}
                              className={`w-full text-xs rounded-lg p-1.5 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <option value="normal">正常</option>
                              <option value="multiply">正片叠底</option>
                              <option value="screen">滤色</option>
                              <option value="overlay">叠加</option>
                              <option value="darken">变暗</option>
                              <option value="lighten">变亮</option>
                            </motion.select>
                          </motion.div>
                          
                          {/* 平铺方式 */}
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.5, ease: "easeOut" }}
                          >
                            <label className={`text-xs block mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>平铺方式</label>
                            <motion.select
                              value={patternTileMode}
                              onChange={(e) => updateState({ patternTileMode: e.target.value as any })}
                              className={`w-full text-xs rounded-lg p-1.5 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <option value="repeat">重复</option>
                              <option value="repeat-x">水平重复</option>
                              <option value="repeat-y">垂直重复</option>
                              <option value="no-repeat">不重复</option>
                            </motion.select>
                          </motion.div>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.55, ease: "easeOut" }}
                      >
                        <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>位置调整</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* X位置 */}
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.6, ease: "easeOut" }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <label className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>水平位置</label>
                              <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{patternPositionX}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={patternPositionX}
                              onChange={(e) => updateState({ patternPositionX: parseInt(e.target.value) })}
                              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-300 dark:bg-gray-700"
                              style={{
                                background: `linear-gradient(to right, #C02C38 0%, #C02C38 ${patternPositionX}%, ${isDark ? '#374151' : '#D1D5DB'} ${patternPositionX}%, ${isDark ? '#374151' : '#D1D5DB'} 100%)`
                              }}
                            />
                          </motion.div>
                          
                          {/* Y位置 */}
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.65, ease: "easeOut" }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <label className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>垂直位置</label>
                              <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{patternPositionY}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={patternPositionY}
                              onChange={(e) => updateState({ patternPositionY: parseInt(e.target.value) })}
                              className={`w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-300 dark:bg-gray-700`}
                              style={{
                                background: `linear-gradient(to right, #C02C38 0%, #C02C38 ${patternPositionY}%, ${isDark ? '#374151' : '#D1D5DB'} ${patternPositionY}%, ${isDark ? '#374151' : '#D1D5DB'} 100%)`
                              }}
                            />
                          </motion.div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* 底部操作区 */}
                <div className="w-full max-w-4xl">
                  {/* Thumbnails Strip - 移动端优化 */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                    className={`w-full backdrop-blur-md p-3 rounded-2xl border mb-3 shadow-lg ${isDark ? 'bg-black/50 border-white/20' : 'bg-white/50 border-gray-200'}`}
                  >
                    {/* 缩略图数量提示 */}
                    <div className="flex items-center justify-between mb-2 px-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          作品缩略图
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                          共 {generatedResults.length} 个
                        </span>
                      </div>
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <i className="fas fa-arrows-alt-h mr-1"></i>可左右拖动浏览
                      </span>
                    </div>

                    <div className="flex gap-3 sm:gap-4 overflow-x-auto custom-scrollbar pr-4">
                      {generatedResults.map((result, index) => (
                        <motion.div
                          key={result.id}
                          layoutId={`thumb-${result.id}`}
                          initial={{ opacity: 0, scale: 0.8, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 * index, ease: "easeOut" }}
                          className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden border-2 transition-all shadow-md group ${selectedResult === result.id ? 'border-[#C02C38] ring-2 ring-[#C02C38]/20 scale-110 z-10' : 'border-white dark:border-gray-700 opacity-70 hover:opacity-100'}`}
                        >
                          <motion.button
                            onClick={() => {
                              setSelectedResult(result.id);
                              // 如果作品有保存prompt，则同步更新创意描述
                              if (result.prompt) {
                                setPrompt(result.prompt);
                              }
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full h-full"
                          >
                            {/* 视频直接显示视频元素，图片显示图片 */}
                            {(result.type === 'video' || result.video) ? (
                              <>
                                <video 
                                  src={result.video || result.thumbnail}
                                  className="w-full h-full object-cover"
                                  preload="metadata"
                                  muted
                                  playsInline
                                  onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                                  onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                                />
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.2, delay: 0.2 * index, ease: "easeOut" }}
                                  className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none"
                                >
                                  <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                                    <i className="fas fa-play text-[#C02C38] text-xs ml-0.5"></i>
                                  </div>
                                </motion.div>
                              </>
                            ) : (
                              <motion.img 
                                src={result.thumbnail || 'https://via.placeholder.com/150?text=No+Image'} 
                                alt="" 
                                className="w-full h-full object-cover" 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.15 * index, ease: "easeOut" }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                                }}
                              />
                            )}
                          </motion.button>
                          
                          {/* 删除按钮 - 默认隐藏，悬浮时显示 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('确定要删除这张作品吗？')) {
                                deleteGeneratedResult(result.id);
                                toast.success('作品已删除');
                              }
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-90"
                            title="删除作品"
                          >
                            <i className="fas fa-times text-[10px] sm:text-xs"></i>
                          </button>
                          
                          {result.score && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2, delay: 0.2 * index, ease: "easeOut" }}
                              className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-md"
                            >
                              {result.score}分
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                  
                  {/* AI 智能排版预览区 - 仅在智能排版工具激活时显示 */}
                  {activeTool === 'layout' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
                      className={`hidden md:block w-full max-w-5xl mx-auto backdrop-blur-md p-10 rounded-2xl border mb-8 shadow-xl ${isDark ? 'bg-black/50 border-white/20' : 'bg-white/50 border-gray-200'}`}
                    >
                      <SmartLayoutPreview 
                        selectedResult={selectedResult}
                        generatedResults={generatedResults}
                        layoutRecommendation={layoutRecommendation}
                        smartLayoutConfig={smartLayoutConfig}
                      />
                    </motion.div>
                  )}

                  {/* 样式预览区 - 可折叠 - 手机端隐藏 */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                    className={`hidden md:block w-full backdrop-blur-md p-3 rounded-2xl border mb-3 shadow-lg ${isDark ? 'bg-black/50 border-white/20' : 'bg-white/50 border-gray-200'}`}
                  >
                    {/* 标题栏带折叠按钮 */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>样式预览</h3>
                      <motion.button
                        onClick={() => setIsStylePanelExpanded(!isStylePanelExpanded)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                        aria-label={isStylePanelExpanded ? '折叠面板' : '展开面板'}
                      >
                        <motion.i 
                          className={`fas ${isStylePanelExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs`}
                          animate={{ rotate: isStylePanelExpanded ? 0 : 180 }}
                          transition={{ duration: 0.3 }}
                        />
                      </motion.button>
                    </div>
                    
                    {/* 样式选项网格 - 带折叠动画 */}
                    <AnimatePresence>
                      {isStylePanelExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* 边框样式 */}
                      {['none', 'thin', 'thick', 'rounded'].map((borderStyle, index) => (
                        <motion.button
                          key={`border-${index}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: 0.05 * index, ease: "easeOut" }}

                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedBorderStyle(borderStyle)}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all shadow-sm ${isDark ? `bg-gray-800 hover:bg-gray-700 text-white ${selectedBorderStyle === borderStyle ? 'ring-2 ring-[#C02C38]' : ''}` : `bg-white hover:bg-gray-50 text-gray-900 ${selectedBorderStyle === borderStyle ? 'ring-2 ring-[#C02C38]' : ''}`}`}
                        >
                          <div className={`w-10 h-10 rounded-lg mb-1 flex items-center justify-center ${borderStyle === 'none' ? '' : borderStyle === 'thin' ? 'border border-gray-500' : borderStyle === 'thick' ? 'border-2 border-gray-500' : 'rounded-full border border-gray-500'}`}>
                            <i className="fas fa-border-all text-xs"></i>
                          </div>
                          <span className="text-[10px] font-medium">{borderStyle === 'none' ? '无边框' : borderStyle === 'thin' ? '细边框' : borderStyle === 'thick' ? '粗边框' : '圆形边框'}</span>
                        </motion.button>
                      ))}
                      
                      {/* 滤镜效果 */}
                      {['normal', 'sepia', 'grayscale', 'vintage'].map((filter, index) => (
                        <motion.button
                          key={`filter-${index}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: 0.05 * (index + 4), ease: "easeOut" }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedFilter(filter)}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all shadow-sm ${isDark ? `bg-gray-800 hover:bg-gray-700 text-white ${selectedFilter === filter ? 'ring-2 ring-[#C02C38]' : ''}` : `bg-white hover:bg-gray-50 text-gray-900 ${selectedFilter === filter ? 'ring-2 ring-[#C02C38]' : ''}`}`}
                        >
                          <div className={`w-10 h-10 rounded-lg mb-1 flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${filter === 'sepia' ? 'bg-amber-200 dark:bg-amber-900' : filter === 'grayscale' ? 'bg-gray-400 dark:bg-gray-600' : filter === 'vintage' ? 'bg-yellow-300 dark:bg-yellow-800' : ''}`}>
                            <i className="fas fa-filter text-xs"></i>
                          </div>
                          <span className="text-[10px] font-medium">{filter === 'normal' ? '原图' : filter === 'sepia' ? '复古' : filter === 'grayscale' ? '黑白' : '怀旧'}</span>
                        </motion.button>
                      ))}
                      
                      {/* 背景样式 */}
                      {['transparent', 'light', 'dark', 'gradient'].map((background, index) => (
                        <motion.button
                          key={`bg-${index}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: 0.05 * (index + 8), ease: "easeOut" }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedBackground(background)}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all shadow-sm ${isDark ? `bg-gray-800 hover:bg-gray-700 text-white ${selectedBackground === background ? 'ring-2 ring-[#C02C38]' : ''}` : `bg-white hover:bg-gray-50 text-gray-900 ${selectedBackground === background ? 'ring-2 ring-[#C02C38]' : ''}`}`}
                        >
                          <div className={`w-10 h-10 rounded-lg mb-1 flex items-center justify-center ${background === 'transparent' ? '' : background === 'light' ? 'bg-gray-100 dark:bg-gray-800' : background === 'dark' ? 'bg-gray-700 dark:bg-gray-900' : 'bg-gradient-to-br from-blue-400 to-purple-400 dark:from-blue-600 dark:to-purple-600'}`}>
                            <i className="fas fa-fill-drip text-xs"></i>
                          </div>
                          <span className="text-[10px] font-medium">{background === 'transparent' ? '透明' : background === 'light' ? '浅色' : background === 'dark' ? '深色' : '渐变'}</span>
                        </motion.button>
                      ))}
                      
                      {/* 布局样式 */}
                      {['center', 'left', 'right', 'full'].map((layout, index) => (
                        <motion.button
                          key={`layout-${index}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: 0.05 * (index + 12), ease: "easeOut" }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedLayout(layout)}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all shadow-sm ${isDark ? `bg-gray-800 hover:bg-gray-700 text-white ${selectedLayout === layout ? 'ring-2 ring-[#C02C38]' : ''}` : `bg-white hover:bg-gray-50 text-gray-900 ${selectedLayout === layout ? 'ring-2 ring-[#C02C38]' : ''}`}`}
                        >
                          <div className={`w-10 h-10 rounded-lg mb-1 flex items-center justify-center ${layout === 'center' ? 'justify-center' : layout === 'left' ? 'justify-start' : layout === 'right' ? 'justify-end' : 'justify-stretch'} gap-1`}>
                            <div className={`w-2 h-2 rounded-sm ${isDark ? 'bg-white' : 'bg-black'}`}></div>
                            {layout === 'full' && <div className={`w-2 h-2 rounded-sm ${isDark ? 'bg-white' : 'bg-black'}`}></div>}
                          </div>
                          <span className="text-[10px] font-medium">{layout === 'center' ? '居中' : layout === 'left' ? '左对齐' : layout === 'right' ? '右对齐' : '全屏'}</span>
                        </motion.button>
                      ))}
                    </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Overlay */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-md"
            >
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#C02C38] border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <i className="fas fa-magic text-[#C02C38] animate-pulse"></i>
                </div>
              </div>
              <p className="font-bold text-lg text-[#C02C38] tracking-widest animate-pulse">AI 生成中</p>
              <p className="text-sm text-gray-500 mt-2">正在为您构建创意方案...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      </AnimatePresence>

      {/* 津币不足弹窗 */}
      <JinbiInsufficientModal
        isOpen={showJinbiModal}
        onClose={() => setShowJinbiModal(false)}
        requiredAmount={EXPORT_COST}
        currentBalance={jinbiBalance?.availableBalance || 0}
        serviceName="导出纹样图片"
      />
    </div>
  );
}
