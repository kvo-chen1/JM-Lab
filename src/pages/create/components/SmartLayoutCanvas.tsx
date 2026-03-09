import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { traditionalPatterns } from '../data';
import { LayoutRecommendation, SmartLayoutConfig, GeneratedResult } from '../types';

interface SmartLayoutCanvasProps {
  selectedResult: number;
  generatedResults: GeneratedResult[];
  layoutRecommendation: LayoutRecommendation | null;
  smartLayoutConfig: SmartLayoutConfig;
  selectedBorderStyle: string;
  selectedFilter: string;
  selectedBackground: string;
  selectedPatternId: number | null;
  activeTool: string;
  patternOpacity: number;
  patternScale: number;
  patternRotation: number;
  patternBlendMode: string;
  patternTileMode: string;
  patternPositionX: number;
  patternPositionY: number;
  isFullscreen: boolean;
  handleFullscreenToggle: () => void;
  handleExportPatternImage: () => void;
}

export const SmartLayoutCanvas: React.FC<SmartLayoutCanvasProps> = ({
  selectedResult,
  generatedResults,
  layoutRecommendation,
  smartLayoutConfig,
  selectedBorderStyle,
  selectedFilter,
  selectedBackground,
  selectedPatternId,
  activeTool,
  patternOpacity,
  patternScale,
  patternRotation,
  patternBlendMode,
  patternTileMode,
  patternPositionX,
  patternPositionY,
  isFullscreen,
  handleFullscreenToggle,
  handleExportPatternImage,
}) => {
  const { isDark } = useTheme();
  
  const selectedItem = generatedResults.find(r => r.id === selectedResult);
  const isVideo = selectedItem?.type === 'video' || selectedItem?.video;
  
  // 获取边框样式
  const getBorderClass = () => {
    switch (selectedBorderStyle) {
      case 'thin': return 'rounded-2xl border-2 border-gray-500';
      case 'thick': return 'rounded-2xl border-4 border-gray-500';
      case 'rounded': return 'rounded-full border-2 border-gray-500';
      default: return 'rounded-2xl';
    }
  };
  
  // 获取背景样式
  const getBackgroundClass = () => {
    switch (selectedBackground) {
      case 'light': return 'bg-gray-100 dark:bg-gray-200';
      case 'dark': return 'bg-gray-800 dark:bg-gray-900';
      case 'gradient': return 'bg-gradient-to-br from-blue-400 to-purple-400 dark:from-blue-600 dark:to-purple-800';
      default: return isDark ? 'bg-gray-950' : 'bg-gray-50';
    }
  };
  
  // 获取滤镜样式
  const getFilterStyle = () => {
    switch (selectedFilter) {
      case 'sepia': return 'sepia(100%)';
      case 'grayscale': return 'grayscale(100%)';
      case 'vintage': return 'sepia(50%) contrast(120%) brightness(90%)';
      default: return 'none';
    }
  };
  
  // 如果有智能排版推荐，使用推荐的布局
  const hasSmartLayout = layoutRecommendation !== null;
  
  // 构建容器样式 - 调整高度让下方内容可见
  const containerStyle: React.CSSProperties = hasSmartLayout
    ? {
        display: layoutRecommendation!.layoutStyle.display,
        flexDirection: layoutRecommendation!.layoutStyle.flexDirection as any,
        alignItems: layoutRecommendation!.layoutStyle.alignItems,
        justifyContent: layoutRecommendation!.layoutStyle.justifyContent,
        gridTemplateColumns: layoutRecommendation!.layoutStyle.gridTemplateColumns,
        flexWrap: layoutRecommendation!.layoutStyle.flexWrap as any,
        width: '100%',
        height: '100%',
        maxHeight: '55vh',
        overflow: 'hidden',
        borderRadius: '16px',
      }
    : {
        width: '100%',
        height: '100%',
        maxHeight: '55vh',
        overflow: 'hidden',
        borderRadius: '16px',
      };

  // 构建图片样式 - 调整高度让下方内容可见
  const imageStyle: React.CSSProperties = hasSmartLayout
    ? {
        width: '100%',
        height: '100%',
        maxHeight: '55vh',
        objectFit: 'contain',
        borderRadius: '16px',
        filter: getFilterStyle(),
      }
    : {
        width: '100%',
        height: '100%',
        maxHeight: '55vh',
        objectFit: 'contain',
        borderRadius: '16px',
        filter: getFilterStyle(),
      };
  
  // 构建文字样式
  const textStyle: React.CSSProperties = hasSmartLayout && smartLayoutConfig.customText
    ? {
        position: layoutRecommendation!.textStyle.position as any,
        fontSize: layoutRecommendation!.textStyle.fontSize,
        fontWeight: layoutRecommendation!.textStyle.fontWeight,
        textAlign: layoutRecommendation!.textStyle.textAlign as any,
        color: layoutRecommendation!.textStyle.color,
        backgroundColor: layoutRecommendation!.textStyle.backgroundColor,
        padding: layoutRecommendation!.textStyle.padding,
        borderRadius: layoutRecommendation!.textStyle.borderRadius,
        width: layoutRecommendation!.textStyle.width,
        height: layoutRecommendation!.textStyle.height,
      }
    : {};
  
  return (
    <motion.div
      layoutId={`result-${selectedResult}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`relative w-full h-full overflow-hidden group shadow-2xl ${getBackgroundClass()}`}
      style={containerStyle}
    >
      {/* 图片/视频渲染 */}
      {isVideo && selectedItem?.video ? (
        <motion.video
          src={selectedItem.video}
          poster={selectedItem.thumbnail}
          controls
          autoPlay
          loop
          className={selectedBackground === 'transparent' ? (isDark ? 'bg-gray-950' : 'bg-gray-50') : ''}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          style={imageStyle}
        />
      ) : (
        <motion.img
          src={selectedItem?.thumbnail || 'https://via.placeholder.com/800x600?text=No+Image'}
          alt="选中的作品"
          className={selectedBackground === 'transparent' ? (isDark ? 'bg-gray-950' : 'bg-gray-50') : ''}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=No+Image';
          }}
          style={imageStyle}
        />
      )}
      
      {/* 智能排版文字叠加 */}
      {hasSmartLayout && smartLayoutConfig.customText && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="smart-layout-text"
          style={textStyle}
        >
          {smartLayoutConfig.customText}
        </motion.div>
      )}
      
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
            backgroundRepeat: patternTileMode as any,
            backgroundPosition: `${patternPositionX}% ${patternPositionY}%`,
            mixBlendMode: patternBlendMode as any
          }}
        />
      )}
      
      {/* 智能排版标识 */}
      {hasSmartLayout && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-4 left-4 px-3 py-1.5 bg-purple-500/90 text-white text-xs font-medium rounded-full backdrop-blur-sm"
        >
          <i className="fas fa-magic mr-1" />
          智能排版
        </motion.div>
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
            onClick={handleExportPatternImage}
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
  );
};
