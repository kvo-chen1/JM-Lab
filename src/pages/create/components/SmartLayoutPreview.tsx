import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { LayoutRecommendation, SmartLayoutConfig, GeneratedResult } from '../types';

interface SmartLayoutPreviewProps {
  selectedResult: number | null;
  generatedResults: GeneratedResult[];
  layoutRecommendation: LayoutRecommendation | null;
  smartLayoutConfig: SmartLayoutConfig;
}

export const SmartLayoutPreview: React.FC<SmartLayoutPreviewProps> = ({
  selectedResult,
  generatedResults,
  layoutRecommendation,
  smartLayoutConfig,
}) => {
  const { isDark } = useTheme();
  
  const selectedItem = selectedResult 
    ? generatedResults.find(r => r.id === selectedResult)
    : generatedResults[0];
    
  const isVideo = selectedItem?.type === 'video' || selectedItem?.video;
  
  // 如果没有推荐配置，显示提示
  if (!layoutRecommendation) {
    return (
      <div className={`w-full p-8 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'} flex flex-col items-center justify-center min-h-[500px]`}>
        <i className="fas fa-magic text-4xl text-gray-400 mb-4" />
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          在右侧选择排版样式，点击"应用排版到画布"查看效果
        </p>
      </div>
    );
  }
  
  // 构建容器样式 - 增大尺寸
  const containerStyle: React.CSSProperties = {
    display: layoutRecommendation.layoutStyle.display,
    flexDirection: layoutRecommendation.layoutStyle.flexDirection as any,
    alignItems: layoutRecommendation.layoutStyle.alignItems,
    justifyContent: layoutRecommendation.layoutStyle.justifyContent,
    width: '100%',
    height: 'auto',
    minHeight: '550px',
    overflow: 'hidden',
    backgroundColor: isDark ? '#1f2937' : '#f9fafb',
    borderRadius: '20px',
  };
  
  // 构建图片样式 - 调整图片尺寸
  const imageStyle: React.CSSProperties = {
    width: layoutRecommendation.imageStyle.width === '80%' ? '70%' :
           layoutRecommendation.imageStyle.width === '60%' ? '55%' :
           layoutRecommendation.imageStyle.width,
    height: layoutRecommendation.imageStyle.height,
    maxHeight: '320px',
    objectFit: layoutRecommendation.imageStyle.objectFit as any,
    borderRadius: layoutRecommendation.imageStyle.borderRadius,
  };
  
  // 构建文字样式
  const textStyle: React.CSSProperties = smartLayoutConfig.customText
    ? {
        position: layoutRecommendation.textStyle.position as any,
        fontSize: layoutRecommendation.textStyle.fontSize,
        fontWeight: layoutRecommendation.textStyle.fontWeight,
        textAlign: layoutRecommendation.textStyle.textAlign as any,
        color: layoutRecommendation.textStyle.color,
        backgroundColor: layoutRecommendation.textStyle.backgroundColor,
        padding: layoutRecommendation.textStyle.padding,
        borderRadius: layoutRecommendation.textStyle.borderRadius,
        width: layoutRecommendation.textStyle.width,
        maxWidth: '100%',
      }
    : {};

  return (
    <div className="w-full">
      {/* 标题栏 */}
      <div className={`flex items-center justify-between mb-4 px-2`}>
        <div className="flex items-center gap-2">
          <i className="fas fa-magic text-purple-500" />
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            AI 智能排版预览
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
            {layoutRecommendation.aspectRatio}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-600`}>
            {smartLayoutConfig.platform === 'xiaohongshu' ? '小红书' :
             smartLayoutConfig.platform === 'weibo' ? '微博' :
             smartLayoutConfig.platform === 'douyin' ? '抖音' :
             smartLayoutConfig.platform === 'wechat' ? '朋友圈' :
             smartLayoutConfig.platform === 'instagram' ? 'Instagram' : '海报'}
          </span>
        </div>
      </div>
      
      {/* 排版预览区域 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative shadow-lg"
        style={containerStyle}
      >
        {/* 图片/视频渲染 */}
        {isVideo && selectedItem?.video ? (
          <video
            src={selectedItem.video}
            poster={selectedItem.thumbnail}
            controls
            autoPlay
            loop
            muted
            style={imageStyle}
          />
        ) : (
          <img 
            src={selectedItem?.thumbnail || 'https://via.placeholder.com/800x600?text=No+Image'} 
            alt="排版预览" 
            style={imageStyle}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=No+Image';
            }}
          />
        )}
        
        {/* 文字叠加 */}
        {smartLayoutConfig.customText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={textStyle}
          >
            {smartLayoutConfig.customText}
          </motion.div>
        )}
        
        {/* AI 推荐标签 */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-purple-500/90 text-white text-xs font-medium rounded-full backdrop-blur-sm">
          <i className="fas fa-robot mr-1" />
          AI 排版
        </div>
      </motion.div>
      
      {/* 排版信息 */}
      <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
          {layoutRecommendation.recommendation}
        </p>
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600'}`}>
            场景: {smartLayoutConfig.scenario === 'product' ? '产品展示' :
                   smartLayoutConfig.scenario === 'festival' ? '节日海报' :
                   smartLayoutConfig.scenario === 'quote' ? '金句分享' :
                   smartLayoutConfig.scenario === 'event' ? '活动宣传' :
                   smartLayoutConfig.scenario === 'brand' ? '品牌宣传' : '社交媒体'}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600'}`}>
            模板: {smartLayoutConfig.template === 'center' ? '中心聚焦' :
                   smartLayoutConfig.template === 'left-text' ? '左文右图' :
                   smartLayoutConfig.template === 'top-text' ? '上文下图' :
                   smartLayoutConfig.template === 'grid' ? '网格布局' :
                   smartLayoutConfig.template === 'masonry' ? '瀑布流' : '全屏沉浸'}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600'}`}>
            文字: {smartLayoutConfig.textStyle === 'minimal' ? '极简留白' :
                   smartLayoutConfig.textStyle === 'elegant' ? '优雅衬线' :
                   smartLayoutConfig.textStyle === 'bold' ? '粗体冲击' :
                   smartLayoutConfig.textStyle === 'vertical' ? '竖排古典' :
                   smartLayoutConfig.textStyle === 'overlay' ? '图文叠加' : '边框装饰'}
          </span>
        </div>
      </div>
    </div>
  );
};
