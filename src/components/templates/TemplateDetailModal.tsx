import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { TianjinTemplate } from '@/services/tianjinActivityService';
import { TemplateInteractionState } from '@/services/templateInteractionService';

interface TemplateDetailModalProps {
  template: TianjinTemplate | null;
  interactionState: TemplateInteractionState;
  isOpen: boolean;
  onClose: () => void;
  onLike: (id: number) => void;
  onFavorite: (id: number) => void;
  onUse: (template: TianjinTemplate) => void;
}

// 分类颜色映射
const categoryColors: Record<string, { bg: string; text: string }> = {
  '节日主题': { bg: 'bg-red-50', text: 'text-red-600' },
  '历史风情': { bg: 'bg-amber-50', text: 'text-amber-600' },
  '城市风光': { bg: 'bg-blue-50', text: 'text-blue-600' },
  '品牌联名': { bg: 'bg-purple-50', text: 'text-purple-600' },
  '夜游光影': { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  '城市休闲': { bg: 'bg-green-50', text: 'text-green-600' },
  '美食宣传': { bg: 'bg-orange-50', text: 'text-orange-600' },
  '文博展陈': { bg: 'bg-gray-50', text: 'text-gray-600' },
};

// 难度配置
const difficultyConfig: Record<string, { label: string; color: string; bg: string }> = {
  easy: { label: '简单', color: 'text-green-600', bg: 'bg-green-50' },
  medium: { label: '中等', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  hard: { label: '高级', color: 'text-red-600', bg: 'bg-red-50' },
};

export const TemplateDetailModal: React.FC<TemplateDetailModalProps> = ({
  template,
  interactionState,
  isOpen,
  onClose,
  onLike,
  onFavorite,
  onUse,
}) => {
  const { isDark } = useTheme();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);
  
  // 重置状态当模板变化时
  useEffect(() => {
    setActiveImageIndex(0);
    setIsImageLoading(true);
  }, [template?.id]);
  
  // 处理 ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);
  
  const handleLike = useCallback(() => {
    if (template) onLike(template.id);
  }, [onLike, template]);
  
  const handleFavorite = useCallback(() => {
    if (template) onFavorite(template.id);
  }, [onFavorite, template]);
  
  const handleUse = useCallback(() => {
    if (template) {
      onUse(template);
      onClose();
    }
  }, [onUse, template, onClose]);
  
  if (!template) return null;
  
  const categoryColor = categoryColors[template.category] || { bg: 'bg-gray-50', text: 'text-gray-600' };
  const difficulty = template.difficulty ? difficultyConfig[template.difficulty] : null;
  
  // 获取所有预览图片
  const previewImages = template.previewImages && template.previewImages.length > 0
    ? template.previewImages
    : [template.thumbnail];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* 模态框内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
              isDark ? 'bg-gray-900' : 'bg-white'
            }`}
          >
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-all duration-200 ${
                isDark 
                  ? 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'bg-white/80 text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              } backdrop-blur-md`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
              {/* 左侧图片区域 */}
              <div className={`lg:w-3/5 p-6 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                {/* 主图 */}
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700">
                  {isImageLoading && (
                    <div className={`absolute inset-0 animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  )}
                  <motion.img
                    key={activeImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    src={previewImages[activeImageIndex]}
                    alt={template.name}
                    className="w-full h-full object-cover"
                    onLoad={() => setIsImageLoading(false)}
                  />
                  
                  {/* 图片导航 */}
                  {previewImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImageIndex(prev => (prev > 0 ? prev - 1 : previewImages.length - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setActiveImageIndex(prev => (prev < previewImages.length - 1 ? prev + 1 : 0))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                  
                  {/* 图片指示器 */}
                  {previewImages.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                      {previewImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all duration-200 ${
                            idx === activeImageIndex ? 'bg-white w-6' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                {/* 缩略图列表 */}
                {previewImages.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {previewImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          idx === activeImageIndex
                            ? 'border-red-500 ring-2 ring-red-500/20'
                            : isDark ? 'border-gray-700' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`预览 ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 右侧信息区域 */}
              <div className="lg:w-2/5 p-6 overflow-y-auto">
                {/* 标题和分类 */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${categoryColor.bg} ${categoryColor.text}`}>
                      {template.category}
                    </span>
                    {template.isFeatured && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        精选模板
                      </span>
                    )}
                  </div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {template.name}
                  </h2>
                </div>
                
                {/* 描述 */}
                <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {template.description}
                </p>
                
                {/* 统计信息 */}
                <div className={`flex items-center gap-6 py-4 mb-6 border-y ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {template.usageCount}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>使用次数</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${interactionState.isLiked ? 'text-red-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
                      {interactionState.likeCount}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>点赞</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {template.popularity || 0}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>热度</div>
                  </div>
                </div>
                
                {/* 模板信息 */}
                <div className="space-y-4 mb-6">
                  {/* 风格 */}
                  {template.style && (
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>设计风格</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{template.style}</span>
                    </div>
                  )}
                  
                  {/* 难度 */}
                  {difficulty && (
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>制作难度</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${difficulty.bg} ${difficulty.color}`}>
                        {difficulty.label}
                      </span>
                    </div>
                  )}
                  
                  {/* 预计时间 */}
                  {template.estimatedTime && (
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>预计用时</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{template.estimatedTime}</span>
                    </div>
                  )}
                  
                  {/* 作者 */}
                  {template.author && (
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>模板作者</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{template.author}</span>
                    </div>
                  )}
                </div>
                
                {/* 色彩方案 */}
                {template.colorScheme && template.colorScheme.length > 0 && (
                  <div className="mb-6">
                    <span className={`text-sm block mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>色彩方案</span>
                    <div className="flex items-center gap-2">
                      {template.colorScheme.map((color, idx) => (
                        <div key={idx} className="group relative">
                          <div
                            className="w-10 h-10 rounded-lg border-2 border-white dark:border-gray-700 shadow-md cursor-pointer transition-transform hover:scale-110"
                            style={{ backgroundColor: color }}
                          />
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {color}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 适用场景 */}
                {template.applicableScenes && template.applicableScenes.length > 0 && (
                  <div className="mb-6">
                    <span className={`text-sm block mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>适用场景</span>
                    <div className="flex flex-wrap gap-2">
                      {template.applicableScenes.map((scene, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                            isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {scene}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 标签 */}
                {template.tags && template.tags.length > 0 && (
                  <div className="mb-6">
                    <span className={`text-sm block mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>标签</span>
                    <div className="flex flex-wrap gap-2">
                      {template.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                            isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 操作按钮 */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUse}
                    className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    立即使用模板
                  </button>
                </div>
                
                {/* 次要操作 */}
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={handleLike}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      interactionState.isLiked
                        ? 'bg-red-50 text-red-600 dark:bg-red-500/10'
                        : isDark 
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-5 h-5" fill={interactionState.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {interactionState.isLiked ? '已点赞' : '点赞'}
                  </button>
                  <button
                    onClick={handleFavorite}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      interactionState.isFavorited
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10'
                        : isDark 
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-5 h-5" fill={interactionState.isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    {interactionState.isFavorited ? '已收藏' : '收藏'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TemplateDetailModal;
