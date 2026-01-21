import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../hooks/useCreateStore';
import { traditionalPatterns } from '../data';

export default function CanvasArea() {
  const { isDark } = useTheme();
  const generatedResults = useCreateStore((state) => state.generatedResults);
  const selectedResult = useCreateStore((state) => state.selectedResult);
  const setSelectedResult = useCreateStore((state) => state.setSelectedResult);
  const isGenerating = useCreateStore((state) => state.isGenerating);
  const currentStep = useCreateStore((state) => state.currentStep);
  const activeTool = useCreateStore((state) => state.activeTool);
  const selectedPatternId = useCreateStore((state) => state.selectedPatternId);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
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
    <div className={`flex-1 flex flex-col relative overflow-hidden transition-colors ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
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
        <div className="flex items-center gap-3">
          <button 
            onClick={() => useCreateStore.getState().updateState({ showCollaborationPanel: true })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-600 shadow-sm border border-gray-200'}`}
          >
            <i className="fas fa-users text-blue-500"></i>
            <span className="hidden sm:inline">协作</span>
          </button>
          
          <button 
            onClick={() => useCreateStore.getState().updateState({ showAIReview: true })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-600 shadow-sm border border-gray-200'}`}
          >
            <i className="fas fa-magic text-purple-500"></i>
            <span className="hidden sm:inline">AI点评</span>
          </button>

          <div className={`h-4 w-px mx-1 ${isDark ? 'bg-gray-800' : 'bg-gray-300'}`}></div>

          <button onClick={handleFullscreenToggle} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`} title={isFullscreen ? "退出全屏" : "全屏"}>
            <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-xs`}></i>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center relative">
        {/* Background Pattern (Optional) */}
        <div className={`absolute inset-0 opacity-[0.02] pointer-events-none ${isDark ? 'bg-[url("https://www.transparenttextures.com/patterns/cubes.png")] invert' : 'bg-[url("https://www.transparenttextures.com/patterns/cubes.png")]'}`}></div>

        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center max-w-lg z-0"
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
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full flex flex-col items-center z-0"
            >
              {/* Focus View */}
              <div className="flex-1 w-full flex items-center justify-center mb-8 min-h-[400px]">
                {selectedResult ? (
                  <div className="relative max-w-full max-h-full">
                    <motion.div 
                      layoutId={`result-${selectedResult}`}
                      className="relative max-w-full max-h-full rounded-2xl shadow-2xl overflow-hidden group border-4 border-white dark:border-gray-800"
                    >
                      <img 
                        src={generatedResults.find(r => r.id === selectedResult)?.thumbnail} 
                        alt="Selected Result" 
                        className="max-w-full max-h-[65vh] object-contain bg-gray-100 dark:bg-gray-900"
                      />
                      
                      {/* 纹样叠加层 */}
                      {selectedPatternId && activeTool === 'pattern' && (
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            opacity: patternOpacity / 100,
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
                      <div className="absolute bottom-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                        {activeTool === 'pattern' && selectedResult && (
                          <button 
                            className="w-10 h-10 rounded-full bg-white text-gray-900 shadow-lg hover:scale-110 transition-transform flex items-center justify-center" 
                            title="导出纹样图片"
                            onClick={() => handleExportPatternImage()}
                          >
                            <i className="fas fa-file-export"></i>
                          </button>
                        )}
                        <button className="w-10 h-10 rounded-full bg-white text-gray-900 shadow-lg hover:scale-110 transition-transform flex items-center justify-center" title="下载">
                          <i className="fas fa-download"></i>
                        </button>
                        <button onClick={handleFullscreenToggle} className="w-10 h-10 rounded-full bg-white text-gray-900 shadow-lg hover:scale-110 transition-transform flex items-center justify-center" title={isFullscreen ? "退出全屏" : "全屏"}>
                          <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                        </button>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <div className="text-gray-400">请选择一张图片进行预览</div>
                )}
              </div>

              {/* 纹样属性控制面板 */}
              {selectedPatternId && activeTool === 'pattern' && (
                <div className={`w-full max-w-4xl backdrop-blur-sm p-4 rounded-2xl border mb-6 ${isDark ? 'bg-black/30 border-white/20' : 'bg-white/30 border-gray-200'}`}>
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>纹样属性</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 透明度控制 */}
                        <div>
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
                        </div>
                        
                        {/* 缩放控制 */}
                        <div>
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
                        </div>
                        
                        {/* 旋转控制 */}
                        <div>
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
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>高级设置</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 混合模式 */}
                        <div>
                          <label className={`text-xs block mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>混合模式</label>
                          <select
                            value={patternBlendMode}
                            onChange={(e) => updateState({ patternBlendMode: e.target.value as any })}
                            className={`w-full text-xs rounded-lg p-1.5 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                          >
                            <option value="normal">正常</option>
                            <option value="multiply">正片叠底</option>
                            <option value="screen">滤色</option>
                            <option value="overlay">叠加</option>
                            <option value="darken">变暗</option>
                            <option value="lighten">变亮</option>
                          </select>
                        </div>
                        
                        {/* 平铺方式 */}
                        <div>
                          <label className={`text-xs block mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>平铺方式</label>
                          <select
                            value={patternTileMode}
                            onChange={(e) => updateState({ patternTileMode: e.target.value as any })}
                            className={`w-full text-xs rounded-lg p-1.5 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                          >
                            <option value="repeat">重复</option>
                            <option value="repeat-x">水平重复</option>
                            <option value="repeat-y">垂直重复</option>
                            <option value="no-repeat">不重复</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>位置调整</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* X位置 */}
                        <div>
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
                        </div>
                        
                        {/* Y位置 */}
                        <div>
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
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-300 dark:bg-gray-700"
                            style={{
                              background: `linear-gradient(to right, #C02C38 0%, #C02C38 ${patternPositionY}%, ${isDark ? '#374151' : '#D1D5DB'} ${patternPositionY}%, ${isDark ? '#374151' : '#D1D5DB'} 100%)`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className={`w-full max-w-4xl backdrop-blur-sm p-4 rounded-2xl border mb-6 ${isDark ? 'bg-black/30 border-white/20' : 'bg-white/30 border-gray-200'}`}>
                <div className="flex flex-wrap justify-center gap-3">
                  {/* Download Button */}
                  <button
                    onClick={() => {
                      const selectedImage = generatedResults.find(r => r.id === selectedResult);
                      if (selectedImage) {
                        const link = document.createElement('a');
                        link.href = selectedImage.thumbnail;
                        link.download = `design_${Date.now()}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }}
                    disabled={!selectedResult}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm ${selectedResult ? (isDark ? 'bg-[#C02C38] hover:bg-[#E60012] text-white' : 'bg-[#C02C38] hover:bg-[#E60012] text-white') : (isDark ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')}`}
                  >
                    <i className="fas fa-download"></i>
                    <span>下载设计</span>
                  </button>
                  
                  {/* Edit Button */}
                  <button
                    onClick={() => {
                      // 这里可以跳转到编辑页面或打开编辑面板
                      console.log('Edit design');
                    }}
                    disabled={!selectedResult}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm ${selectedResult ? (isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white') : (isDark ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')}`}
                  >
                    <i className="fas fa-edit"></i>
                    <span>编辑设计</span>
                  </button>
                  
                  {/* Save to Drafts Button */}
                  <button
                    onClick={() => {
                      saveToDrafts();
                    }}
                    disabled={!selectedResult}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm ${selectedResult ? (isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white') : (isDark ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')}`}
                  >
                    <i className="fas fa-save"></i>
                    <span>保存草稿</span>
                  </button>
                  
                  {/* Share Button */}
                  <button
                    onClick={() => {
                      shareDesign();
                    }}
                    disabled={!selectedResult}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm ${selectedResult ? (isDark ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white') : (isDark ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')}`}
                  >
                    <i className="fas fa-share-alt"></i>
                    <span>分享设计</span>
                  </button>
                  
                  {/* Apply to Other Tools Button */}
                  <button
                    onClick={() => {
                      // 弹出工具选择菜单或直接切换到某个工具
                      applyToOtherTool('filter'); // 这里可以根据需要修改为默认工具
                    }}
                    disabled={!selectedResult}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm ${selectedResult ? (isDark ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-yellow-600 hover:bg-yellow-700 text-white') : (isDark ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')}`}
                  >
                    <i className="fas fa-tools"></i>
                    <span>其他工具</span>
                  </button>
                </div>
              </div>
              
              {/* Thumbnails Strip */}
              <div className="w-full max-w-4xl backdrop-blur-sm bg-white/30 dark:bg-black/30 p-4 rounded-2xl border border-white/20">
                <div className="flex gap-4 overflow-x-auto custom-scrollbar justify-center">
                  {generatedResults.map((result) => (
                    <motion.button
                      key={result.id}
                      layoutId={`thumb-${result.id}`}
                      onClick={() => setSelectedResult(result.id)}
                      className={`relative flex-shrink-0 w-20 h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden border-2 transition-all shadow-sm ${selectedResult === result.id ? 'border-[#C02C38] ring-2 ring-[#C02C38]/20 scale-105 z-10' : 'border-white dark:border-gray-700 opacity-70 hover:opacity-100 hover:scale-105'}`}
                    >
                      <img src={result.thumbnail} alt="" className="w-full h-full object-cover" />
                      {result.score && (
                        <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-md">
                          {result.score}
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
  );
}
