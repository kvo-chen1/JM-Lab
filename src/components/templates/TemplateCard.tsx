import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { TianjinTemplate } from '@/services/tianjinActivityService';
import { TemplateInteractionState } from '@/services/templateInteractionService';

interface TemplateCardProps {
  template: TianjinTemplate;
  interactionState: TemplateInteractionState;
  onLike: (id: number) => void;
  onFavorite: (id: number) => void;
  onUse: (template: TianjinTemplate) => void;
  onDetail: (template: TianjinTemplate) => void;
  viewMode?: 'grid' | 'list';
  index?: number;
}

// 分类颜色映射
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  '节日主题': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  '历史风情': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  '城市风光': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  '品牌联名': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  '夜游光影': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  '城市休闲': { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  '美食宣传': { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  '文博展陈': { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
};

// 获取分类颜色
const getCategoryColors = (category: string) => {
  return categoryColors[category] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
};

// 难度标签
const DifficultyBadge: React.FC<{ difficulty?: string; isDark: boolean }> = ({ difficulty, isDark }) => {
  if (!difficulty) return null;
  
  const config = {
    easy: { color: 'text-green-500', bg: isDark ? 'bg-green-500/10' : 'bg-green-50', label: '简单' },
    medium: { color: 'text-yellow-500', bg: isDark ? 'bg-yellow-500/10' : 'bg-yellow-50', label: '中等' },
    hard: { color: 'text-red-500', bg: isDark ? 'bg-red-500/10' : 'bg-red-50', label: '高级' },
  };
  
  const { color, bg, label } = config[difficulty as keyof typeof config] || config.easy;
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${color}`}>
      {label}
    </span>
  );
};

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  interactionState,
  onLike,
  onFavorite,
  onUse,
  onDetail,
  viewMode = 'grid',
  index = 0,
}) => {
  const { isDark } = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const categoryColors = getCategoryColors(template.category);
  
  // 处理图片加载
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);
  
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);
  
  // 处理点赞
  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(template.id);
  }, [onLike, template.id]);
  
  // 处理收藏
  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite(template.id);
  }, [onFavorite, template.id]);
  
  // 处理使用模板
  const handleUse = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onUse(template);
  }, [onUse, template]);
  
  // 处理查看详情
  const handleDetail = useCallback(() => {
    onDetail(template);
  }, [onDetail, template]);
  
  // 列表模式
  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className={`group flex gap-4 p-4 rounded-xl transition-all duration-300 cursor-pointer ${
          isDark 
            ? 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600' 
            : 'bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200'
        } ${isHovered ? 'shadow-lg' : 'shadow-sm'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleDetail}
      >
        {/* 缩略图 */}
        <div className="relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden">
          {!imageLoaded && !imageError && (
            <div className={`absolute inset-0 animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          )}
          <img
            src={imageError ? '/images/placeholder-image.jpg' : template.thumbnail}
            alt={template.name}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isHovered ? 'scale-110' : 'scale-100'
            } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
          {/* Featured Badge */}
          {template.isFeatured && (
            <div className="absolute top-1 left-1">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                精选
              </span>
            </div>
          )}
        </div>
        
        {/* 内容区 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-base truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {template.name}
              </h3>
              <p className={`text-sm mt-1 line-clamp-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {template.description}
              </p>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={handleLike}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  interactionState.isLiked
                    ? 'text-red-500 bg-red-50 dark:bg-red-500/10'
                    : isDark 
                      ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' 
                      : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill={interactionState.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button
                onClick={handleFavorite}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  interactionState.isFavorited
                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10'
                    : isDark 
                      ? 'text-gray-400 hover:text-amber-400 hover:bg-gray-700' 
                      : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill={interactionState.isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* 标签和统计 */}
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors.bg} ${categoryColors.text} ${categoryColors.border} border`}>
              {template.category}
            </span>
            <DifficultyBadge difficulty={template.difficulty} isDark={isDark} />
            <div className={`flex items-center gap-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {template.usageCount}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill={interactionState.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {interactionState.likeCount}
              </span>
            </div>
          </div>
        </div>
        
        {/* 使用按钮 */}
        <button
          onClick={handleUse}
          className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          使用模板
        </button>
      </motion.div>
    );
  }
  
  // 网格模式（默认）
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`group relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${
        isDark 
          ? 'bg-gray-800 border border-gray-700/50 hover:border-gray-600' 
          : 'bg-white border border-gray-100 hover:border-gray-200'
      } ${isHovered ? 'shadow-xl -translate-y-1' : 'shadow-md'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleDetail}
    >
      {/* 图片区域 */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* 骨架屏 */}
        {!imageLoaded && !imageError && (
          <div className={`absolute inset-0 animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}
        
        {/* 图片 */}
        <img
          src={imageError ? '/images/placeholder-image.jpg' : template.thumbnail}
          alt={template.name}
          className={`w-full h-full object-cover transition-all duration-500 ${
            isHovered ? 'scale-110' : 'scale-100'
          } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
        
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
        
        {/* Featured Badge */}
        {template.isFeatured && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              精选
            </span>
          </div>
        )}
        
        {/* 分类标签 */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-md ${categoryColors.bg} ${categoryColors.text} bg-opacity-90`}>
            {template.category}
          </span>
        </div>
        
        {/* 悬停操作按钮 */}
        <motion.div
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-3 left-3 right-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md transition-all duration-200 ${
                interactionState.isLiked
                  ? 'bg-red-500 text-white'
                  : 'bg-white/90 text-gray-700 hover:bg-white'
              }`}
            >
              <svg className="w-4 h-4" fill={interactionState.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {interactionState.likeCount > 0 && interactionState.likeCount}
            </button>
            <button
              onClick={handleFavorite}
              className={`flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-md transition-all duration-200 ${
                interactionState.isFavorited
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/90 text-gray-700 hover:bg-white'
              }`}
            >
              <svg className="w-4 h-4" fill={interactionState.isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={handleUse}
            className="px-4 py-1.5 rounded-full text-sm font-medium bg-white text-gray-900 hover:bg-gray-100 transition-all duration-200 shadow-lg"
          >
            使用
          </button>
        </motion.div>
      </div>
      
      {/* 内容区域 */}
      <div className="p-4">
        <h3 className={`font-semibold text-base mb-1 line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {template.name}
        </h3>
        <p className={`text-sm mb-3 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {template.description}
        </p>
        
        {/* 底部信息 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DifficultyBadge difficulty={template.difficulty} isDark={isDark} />
            {template.estimatedTime && (
              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {template.estimatedTime}
              </span>
            )}
          </div>
          
          <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {template.usageCount}
          </div>
        </div>
        
        {/* 色彩方案预览 */}
        {template.colorScheme && template.colorScheme.length > 0 && (
          <div className="flex items-center gap-1 mt-3">
            {template.colorScheme.slice(0, 4).map((color, idx) => (
              <div
                key={idx}
                className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-700 shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TemplateCard;
