import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../hooks/useCreateStore';
import { traditionalPatterns } from '../data';
import { toast } from 'sonner';
import HistoryPanel from './HistoryPanel';

export default function CanvasArea() {
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const generatedResults = useCreateStore((state) => state.generatedResults);
  const selectedResult = useCreateStore((state) => state.selectedResult);
  const setSelectedResult = useCreateStore((state) => state.setSelectedResult);
  const isGenerating = useCreateStore((state) => state.isGenerating);
  const currentStep = useCreateStore((state) => state.currentStep);
  const activeTool = useCreateStore((state) => state.activeTool);
  const selectedPatternId = useCreateStore((state) => state.selectedPatternId);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
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

  // 自动选择第一张图片进行预览
  useEffect(() => {
    if (generatedResults.length > 0 && (!selectedResult || !generatedResults.some(result => result.id === selectedResult))) {
      setSelectedResult(generatedResults[0].id);
    }
  }, [generatedResults, selectedResult, setSelectedResult]);

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

      const selectedImage = generatedResults.find(r => r.id === selectedResult);
      if (!selectedImage) return;

      const patternImage = selectedPatternId ? traditionalPatterns.find(p => p.id === selectedPatternId) : null;
      if (!patternImage) return;

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
      ctx.globalCompositeOperation = patternBlendMode;

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
          <span className={`px-2 py-1 rounded text-xs font-bold tracking-wider ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>CANVAS</span>
          <i className="fas fa-chevron-right text-[10px] opacity-30"></i>
          <span className={isDark ? 'text-gray-200' : 'text-gray-900'}>
            {activeTool === 'sketch' ? '一键设计' : activeTool === 'pattern' ? '纹样嵌入' : '创作预览'}
          </span>
        </div>
        
        {/* View Controls & Actions */}
        <div className="flex items-center gap-3 pr-12 md:pr-0">
          <button 
            onClick={() => useCreateStore.getState().updateState({ showCollaborationPanel: true })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-600 shadow-sm border border-gray-200'}`}
          >
            <i className="fas fa-users text-blue-500"></i>
            <span className="hidden sm:inline">协作</span>
          </button>
          
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
            onClick={() => setShowHistory(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-600 shadow-sm border border-gray-200'}`}
          >
            <i className="fas fa-box-archive text-yellow-500"></i>
            <span className="hidden sm:inline">草稿箱</span>
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
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col relative">
        {/* Background Pattern (Optional) */}
        <div className={`absolute inset-0 opacity-[0.02] pointer-events-none ${isDark ? 'bg-[url("https://www.transparenttextures.com/patterns/cubes.png")] invert' : 'bg-[url("https://www.transparenttextures.com/patterns/cubes.png")]'}`}></div>

        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center max-w-lg z-0 mx-auto mt-10"
            >
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
                点击“生成”即可见证灵感化为现实。
              </p>
            </motion.div>
          ) : (
            <div className="w-full flex flex-col items-center z-0 pb-6">
              {/* Focus View */}
              <div className="w-full flex items-center justify-center min-h-[300px] max-h-[55vh] mb-8">
                {selectedResult ? (
                  <div className="relative w-full max-w-4xl max-h-full">
                    <motion.div 
                      layoutId={`result-${selectedResult}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className={`relative w-full max-w-full max-h-full overflow-hidden group ${selectedBorderStyle === 'none' ? 'rounded-2xl' : selectedBorderStyle === 'thin' ? 'rounded-2xl border-2 border-gray-500' : selectedBorderStyle === 'thick' ? 'rounded-2xl border-4 border-gray-500' : 'rounded-full border-2 border-gray-500'} shadow-2xl ${selectedBackground === 'transparent' ? '' : selectedBackground === 'light' ? 'bg-gray-100 dark:bg-gray-200' : selectedBackground === 'dark' ? 'bg-gray-800 dark:bg-gray-900' : 'bg-gradient-to-br from-blue-400 to-purple-400 dark:from-blue-600 dark:to-purple-800'} ${selectedLayout === 'center' ? 'flex items-center justify-center' : selectedLayout === 'left' ? 'flex items-center justify-start' : selectedLayout === 'right' ? 'flex items-center justify-end' : 'w-full'}`}
                    >
                      <motion.img 
                        src={generatedResults.find(r => r.id === selectedResult)?.thumbnail} 
                        alt="Selected Result" 
                        className={`w-full h-auto max-h-[55vh] object-contain ${selectedBackground === 'transparent' ? 'bg-gray-100 dark:bg-gray-900' : ''}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                        style={{
                          filter: selectedFilter === 'normal' ? 'none' : 
                                  selectedFilter === 'sepia' ? 'sepia(100%)' : 
                                  selectedFilter === 'grayscale' ? 'grayscale(100%)' : 
                                  selectedFilter === 'vintage' ? 'sepia(50%) contrast(120%) brightness(90%)' : 'none'
                        }}
                      />
                        
                      {/* 纹样叠加层 */}
                      {selectedPatternId && activeTool === 'pattern' && (
                        <motion.div 
                          className="absolute inset-0 pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: patternOpacity / 100 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          style={{
                            transform: `scale(${patternScale / 100}) rotate(${patternRotation}deg)`,
                            transformOrigin: 'center center',
                            backgroundImage: `url(${traditionalPatterns.find(p => p.id === selectedPatternId)?.thumbnail})`,
                            backgroundSize: 'auto',
                            backgroundRepeat: patternTileMode,
                            backgroundPosition: `${patternPositionX}% ${patternPositionY}%`,
                            mixBlendMode: patternBlendMode
                          }}
                        />
                      )}
                        
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                        
                      {/* Floating Actions on Image */}
                      <div className="absolute bottom-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out transform translate-y-4 group-hover:translate-y-0">
                        {activeTool === 'pattern' && selectedResult && (
                          <motion.button 
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-10 h-10 rounded-full bg-white text-gray-900 shadow-lg flex items-center justify-center" 
                            title="导出纹样图片"
                            onClick={() => handleExportPatternImage()}
                          >
                            <i className="fas fa-file-export"></i>
                          </motion.button>
                        )}
                        <motion.button 
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-10 h-10 rounded-full bg-white text-gray-900 shadow-lg flex items-center justify-center" 
                          title="下载"
                        >
                          <i className="fas fa-download"></i>
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleFullscreenToggle} 
                          className="w-10 h-10 rounded-full bg-white text-gray-900 shadow-lg flex items-center justify-center" 
                          title={isFullscreen ? "退出全屏" : "全屏"}
                        >
                          <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                        </motion.button>
                      </div>
                    </motion.div>
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
                  <div className="flex gap-3 sm:gap-4 overflow-x-auto custom-scrollbar justify-center pr-4">
                    {generatedResults.map((result, index) => (
                      <motion.button
                        key={result.id}
                        layoutId={`thumb-${result.id}`}
                        onClick={() => setSelectedResult(result.id)}
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * index, ease: "easeOut" }}
                        whileHover={{ scale: 1.1, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden border-2 transition-all shadow-md ${selectedResult === result.id ? 'border-[#C02C38] ring-2 ring-[#C02C38]/20 scale-110 z-10' : 'border-white dark:border-gray-700 opacity-70 hover:opacity-100'}`}
                      >
                        <motion.img 
                          src={result.thumbnail} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.15 * index, ease: "easeOut" }}
                        />
                        {result.score && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, delay: 0.2 * index, ease: "easeOut" }}
                            className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-md"
                          >
                            {result.score}
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
                
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
              <p className="font-bold text-lg text-[#C02C38] tracking-widest animate-pulse">AI GENERATING</p>
              <p className="text-sm text-gray-500 mt-2">正在为您构建创意方案...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      </AnimatePresence>
    </div>
  );
}