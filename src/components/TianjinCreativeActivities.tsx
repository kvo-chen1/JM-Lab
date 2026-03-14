import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { tianjinActivityService, TianjinTemplate } from '@/services/tianjinActivityService';
import { templateInteractionService } from '@/services/templateInteractionService';
import { generateTemplatePrompt } from '@/utils/templatePromptGenerator';
import { templateUsageService } from '@/services/templateUsageService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import TemplatePreviewModal from './templates/TemplatePreviewModal';

interface TianjinCreativeActivitiesProps {
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  search?: string;
}

export default function TianjinCreativeActivities({ 
  selectedCategory = 'all', 
  onCategoryChange,
  search = ''
}: TianjinCreativeActivitiesProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TianjinTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TianjinTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedTemplates, setLikedTemplates] = useState<Set<number>>(new Set());
  const [favoritedTemplates, setFavoritedTemplates] = useState<Set<number>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
  
  // 预览弹窗状态
  const [previewTemplate, setPreviewTemplate] = useState<TianjinTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 加载模板数据
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true);
      try {
        const data = await tianjinActivityService.getTemplates();
        setTemplates(data);
        
        // 加载用户互动状态
        const likedIds = await templateInteractionService.getUserLikedTemplateIds();
        const favoritedIds = await templateInteractionService.getUserFavoritedTemplateIds();
        setLikedTemplates(new Set(likedIds));
        setFavoritedTemplates(new Set(favoritedIds));
        
        // 加载点赞数
        const counts: Record<number, number> = {};
        const templateIds = data.map(t => t.id);
        const batchStates = await templateInteractionService.getBatchTemplateInteractions(templateIds);
        for (const template of data) {
          const state = batchStates.get(template.id);
          if (state) {
            counts[template.id] = state.likeCount;
          }
        }
        setLikeCounts(counts);
      } catch (error) {
        console.error('加载模板失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // 过滤模板
  useEffect(() => {
    let filtered = templates;

    // 按分类过滤
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // 按搜索词过滤
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, selectedCategory, search]);

  // 处理点赞
  const handleLike = useCallback(async (templateId: number) => {
    try {
      const result = await templateInteractionService.toggleTemplateLike(templateId);
      setLikedTemplates(prev => {
        const newSet = new Set(prev);
        if (result.isLiked) {
          newSet.add(templateId);
        } else {
          newSet.delete(templateId);
        }
        return newSet;
      });
      
      // 更新点赞数
      setLikeCounts(prev => ({
        ...prev,
        [templateId]: result.likeCount
      }));
    } catch (error) {
      console.error('点赞失败:', error);
    }
  }, []);

  // 处理收藏
  const handleFavorite = useCallback(async (templateId: number) => {
    try {
      const isFavorited = await templateInteractionService.toggleTemplateFavorite(templateId);
      setFavoritedTemplates(prev => {
        const newSet = new Set(prev);
        if (isFavorited) {
          newSet.add(templateId);
        } else {
          newSet.delete(templateId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('收藏失败:', error);
    }
  }, []);

  // 处理使用模板
  const handleUseTemplate = useCallback(async (template: TianjinTemplate) => {
    // 生成提示词
    const prompt = generateTemplatePrompt(template);
    
    // 保存使用记录
    if (user?.id) {
      try {
        await templateUsageService.saveTemplateUsage(user.id, template, prompt);
      } catch (error) {
        console.error('保存模板使用记录失败:', error);
      }
    }
    
    // 增加模板使用次数
    try {
      await tianjinActivityService.incrementTemplateUsage(template.id);
    } catch (error) {
      console.error('增加使用次数失败:', error);
    }
    
    // 跳转到创作页面
    navigate('/create', {
      state: {
        templatePrompt: prompt,
        templateId: template.id,
        templateName: template.name,
        templateStyle: template.style,
        templateCategory: template.category
      }
    });
    
    toast.success(`正在使用"${template.name}"模板创建作品...`);
  }, [navigate, user]);

  // 处理查看详情（打开预览弹窗）
  const handleViewDetail = useCallback((template: TianjinTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  }, []);

  // 关闭预览弹窗
  const handleClosePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewTemplate(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (filteredTemplates.length === 0) {
    return (
      <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          暂无符合条件的模板
        </p>
        <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          试试其他分类或搜索词
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 模板网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
              isDark 
                ? 'bg-gray-900 border border-gray-800 hover:border-gray-700' 
                : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg'
            }`}
            onClick={() => handleViewDetail(template)}
          >
            {/* 缩略图 */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-200 dark:bg-gray-700">
              <img
                src={template.thumbnail}
                alt={template.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://picsum.photos/seed/fallback-${template.id}/800/600`;
                }}
              />
              
              {/* 分类标签 */}
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
                  {template.category}
                </span>
              </div>

              {/* 难度标签 */}
              {template.difficulty && (
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    template.difficulty === 'easy' 
                      ? 'bg-green-500/80 text-white' 
                      : template.difficulty === 'medium'
                      ? 'bg-yellow-500/80 text-white'
                      : 'bg-red-500/80 text-white'
                  }`}>
                    {template.difficulty === 'easy' ? '简单' : template.difficulty === 'medium' ? '中等' : '困难'}
                  </span>
                </div>
              )}

              {/* 悬停操作按钮 */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUseTemplate(template);
                  }}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-all duration-200 hover:scale-105"
                >
                  做同款
                </button>
              </div>
            </div>

            {/* 模板信息 */}
            <div className="p-4">
              <h3 className={`font-semibold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {template.name}
              </h3>
              <p className={`text-sm line-clamp-2 mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {template.description}
              </p>

              {/* 标签 */}
              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {template.tags.slice(0, 3).map((tag, i) => (
                    <span 
                      key={i}
                      className={`text-xs px-2 py-0.5 rounded ${
                        isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 底部信息栏 */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-4 text-sm">
                  <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {template.usageCount || 0}
                  </span>
                  <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {template.estimatedTime || '10分钟'}
                  </span>
                </div>

                {/* 互动按钮 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(template.id);
                    }}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      likedTemplates.has(template.id)
                        ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                        : isDark 
                          ? 'text-gray-400 hover:text-red-400 hover:bg-gray-800' 
                          : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-5 h-5" fill={likedTemplates.has(template.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {likeCounts[template.id] > 0 && (
                      <span className="ml-1 text-xs">{likeCounts[template.id]}</span>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavorite(template.id);
                    }}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      favoritedTemplates.has(template.id)
                        ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                        : isDark 
                          ? 'text-gray-400 hover:text-yellow-400 hover:bg-gray-800' 
                          : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-5 h-5" fill={favoritedTemplates.has(template.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 模板预览弹窗 */}
      <TemplatePreviewModal
        template={previewTemplate}
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        onLike={handleLike}
        onFavorite={handleFavorite}
        isLiked={previewTemplate ? likedTemplates.has(previewTemplate.id) : false}
        isFavorited={previewTemplate ? favoritedTemplates.has(previewTemplate.id) : false}
      />
    </div>
  );
}
