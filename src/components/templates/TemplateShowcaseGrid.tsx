import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { TianjinTemplate } from '@/services/tianjinActivityService';
import { templateInteractionService, TemplateInteractionState } from '@/services/templateInteractionService';
import { generateTemplatePrompt } from '@/utils/templatePromptGenerator';
import { templateUsageService } from '@/services/templateUsageService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Sparkles,
  Heart,
  Bookmark,
  Eye,
  Clock,
  Zap,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';

interface TemplateShowcaseGridProps {
  templates: TianjinTemplate[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  viewMode?: 'grid' | 'masonry';
}

// 分类配置
const CATEGORIES = [
  { id: 'all', name: '全部', icon: '✨', color: 'from-red-500 to-pink-500', bgColor: 'bg-red-50' },
  { id: '节日主题', name: '节日主题', icon: '🎉', color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-50' },
  { id: '美食宣传', name: '美食宣传', icon: '🍜', color: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-50' },
  { id: '城市风光', name: '城市风光', icon: '🌆', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50' },
  { id: '历史风情', name: '历史风情', icon: '🏛️', color: 'from-amber-600 to-yellow-500', bgColor: 'bg-amber-50' },
  { id: '品牌联名', name: '品牌联名', icon: '🏷️', color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-50' },
  { id: '夜游光影', name: '夜游光影', icon: '🌙', color: 'from-indigo-500 to-purple-500', bgColor: 'bg-indigo-50' },
  { id: '城市休闲', name: '城市休闲', icon: '🌳', color: 'from-green-500 to-teal-500', bgColor: 'bg-green-50' },
  { id: '文博展陈', name: '文博展陈', icon: '🏺', color: 'from-gray-500 to-slate-500', bgColor: 'bg-gray-50' },
];

// 获取分类信息
const getCategoryInfo = (categoryId: string) => {
  return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
};

// 难度标签组件
const DifficultyBadge: React.FC<{ difficulty?: string; isDark: boolean }> = ({ difficulty, isDark }) => {
  if (!difficulty) return null;
  
  const config = {
    easy: { color: 'text-green-600', bg: isDark ? 'bg-green-500/20' : 'bg-green-100', label: '简单' },
    medium: { color: 'text-yellow-600', bg: isDark ? 'bg-yellow-500/20' : 'bg-yellow-100', label: '中等' },
    hard: { color: 'text-red-600', bg: isDark ? 'bg-red-500/20' : 'bg-red-100', label: '高级' },
  };
  
  const { color, bg, label } = config[difficulty as keyof typeof config] || config.easy;
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${bg} ${color}`}>
      {label}
    </span>
  );
};

// 单个模板卡片组件
const TemplateCard: React.FC<{
  template: TianjinTemplate;
  interactionState: TemplateInteractionState;
  onLike: (id: number) => void;
  onFavorite: (id: number) => void;
  onUse: (template: TianjinTemplate) => void;
  onPreview: (template: TianjinTemplate) => void;
  isDark: boolean;
  index: number;
}> = ({ template, interactionState, onLike, onFavorite, onUse, onPreview, isDark, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const categoryInfo = getCategoryInfo(template.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
        isDark 
          ? 'bg-gray-800/80 border border-gray-700/50 hover:border-gray-600' 
          : 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-xl'
      } ${isHovered ? 'scale-[1.02]' : 'scale-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPreview(template)}
    >
      {/* 图片区域 */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* 骨架屏 */}
        {!imageLoaded && (
          <div className={`absolute inset-0 animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
        )}
        
        {/* 图片 */}
        <img
          src={template.thumbnail}
          alt={template.name}
          className={`w-full h-full object-cover transition-all duration-500 ${
            isHovered ? 'scale-110' : 'scale-100'
          } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://picsum.photos/seed/template-${template.id}/800/600`;
          }}
        />

        {/* 渐变遮罩 */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 ${
          isHovered ? 'opacity-80' : 'opacity-40'
        }`} />

        {/* 分类标签 */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-md ${categoryInfo.bgColor} ${
            isDark ? 'text-gray-800' : 'text-gray-700'
          }`}>
            <span>{categoryInfo.icon}</span>
            {template.category}
          </span>
        </div>

        {/* 精选标签 */}
        {template.isFeatured && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg">
              <Sparkles className="w-3 h-3" />
              精选
            </span>
          </div>
        )}

        {/* 悬停操作按钮 */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-4 right-4 flex items-center gap-2"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUse(template);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg"
              >
                <Zap className="w-4 h-4" />
                做同款
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLike(template.id);
                }}
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  interactionState.isLiked
                    ? 'bg-red-500 text-white'
                    : 'bg-white/90 text-gray-700 hover:bg-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${interactionState.isLiked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite(template.id);
                }}
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  interactionState.isFavorited
                    ? 'bg-amber-500 text-white'
                    : 'bg-white/90 text-gray-700 hover:bg-white'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${interactionState.isFavorited ? 'fill-current' : ''}`} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className={`font-semibold text-base line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {template.name}
          </h3>
          <DifficultyBadge difficulty={template.difficulty} isDark={isDark} />
        </div>
        
        <p className={`text-sm line-clamp-2 mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {template.description}
        </p>

        {/* 标签 */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {template.tags.slice(0, 3).map((tag, i) => (
              <span 
                key={i}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 底部信息 */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 text-sm">
            <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <Eye className="w-4 h-4" />
              {template.usageCount || 0}
            </span>
            <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <Heart className={`w-4 h-4 ${interactionState.isLiked ? 'text-red-500 fill-current' : ''}`} />
              {interactionState.likeCount}
            </span>
            {template.estimatedTime && (
              <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Clock className="w-4 h-4" />
                {template.estimatedTime}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// 主组件
export const TemplateShowcaseGrid: React.FC<TemplateShowcaseGridProps> = ({
  templates,
  selectedCategory,
  onCategoryChange,
  searchQuery = '',
  onSearchChange,
  viewMode = 'grid'
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filteredTemplates, setFilteredTemplates] = useState<TianjinTemplate[]>([]);
  const [interactionStates, setInteractionStates] = useState<Record<number, TemplateInteractionState>>({});
  const [isLoading, setIsLoading] = useState(true);

  // 加载互动状态
  useEffect(() => {
    const loadInteractionStates = async () => {
      if (templates.length === 0) {
        setIsLoading(false);
        return;
      }

      const templateIds = templates.map(t => t.id);
      const batchStates = await templateInteractionService.getBatchTemplateInteractions(templateIds);

      const states: Record<number, TemplateInteractionState> = {};
      for (const template of templates) {
        const state = batchStates.get(template.id);
        if (state) {
          states[template.id] = state;
        }
      }

      setInteractionStates(states);
      setIsLoading(false);
    };

    loadInteractionStates();
  }, [templates]);

  // 过滤模板
  useEffect(() => {
    let filtered = templates;

    // 按分类过滤
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // 按搜索词过滤
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, selectedCategory, searchQuery]);

  // 处理点赞
  const handleLike = useCallback(async (templateId: number) => {
    try {
      const result = await templateInteractionService.toggleTemplateLike(templateId);
      setInteractionStates(prev => ({
        ...prev,
        [templateId]: {
          ...prev[templateId],
          isLiked: result.isLiked,
          likeCount: result.likeCount
        }
      }));
    } catch (error) {
      console.error('点赞失败:', error);
    }
  }, []);

  // 处理收藏
  const handleFavorite = useCallback(async (templateId: number) => {
    try {
      const isFavorited = await templateInteractionService.toggleTemplateFavorite(templateId);
      setInteractionStates(prev => ({
        ...prev,
        [templateId]: {
          ...prev[templateId],
          isFavorited
        }
      }));
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

  // 处理预览
  const handlePreview = useCallback((template: TianjinTemplate) => {
    // 可以在这里打开预览弹窗
    console.log('预览模板:', template);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 搜索框 */}
      <div className="relative mb-4">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        <input
          type="text"
          placeholder="搜索模板..."
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className={`w-full pl-12 pr-4 py-3 rounded-xl border outline-none transition-all ${
            isDark
              ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 focus:border-red-500'
              : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500'
          }`}
        />
      </div>

      {/* 模板网格 */}
      {filteredTemplates.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/80'}`}>
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <Search className={`w-10 h-10 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            暂无符合条件的模板
          </h3>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            试试其他分类或搜索词
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template, index) => (
            <TemplateCard
              key={template.id}
              template={template}
              interactionState={interactionStates[template.id] || { isLiked: false, isFavorited: false, likeCount: 0 }}
              onLike={handleLike}
              onFavorite={handleFavorite}
              onUse={handleUseTemplate}
              onPreview={handlePreview}
              isDark={isDark}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateShowcaseGrid;
