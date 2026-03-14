import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { TianjinTemplate } from '@/services/tianjinActivityService';
import { generateTemplatePrompt, generateCreativeSuggestions } from '@/utils/templatePromptGenerator';
import { templateUsageService } from '@/services/templateUsageService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  X,
  Heart,
  Bookmark,
  Eye,
  Zap,
  Copy,
  Check,
  Lightbulb,
  Palette,
  Layout,
  Wand2
} from 'lucide-react';

interface TemplatePreviewModalProps {
  template: TianjinTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (id: number) => void;
  onFavorite?: (id: number) => void;
  isLiked?: boolean;
  isFavorited?: boolean;
}

// 获取难度标签
const getDifficultyLabel = (difficulty?: string) => {
  switch (difficulty) {
    case 'easy': return { label: '简单', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
    case 'medium': return { label: '中等', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' };
    case 'hard': return { label: '高级', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    default: return { label: '简单', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
  }
};

// 获取分类图标
const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    '节日主题': '🎉',
    '美食宣传': '🍜',
    '城市风光': '🌆',
    '历史风情': '🏛️',
    '品牌联名': '🏷️',
    '夜游光影': '🌙',
    '城市休闲': '🌳',
    '文博展陈': '🏺'
  };
  return icons[category] || '✨';
};

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  onLike,
  onFavorite,
  isLiked = false,
  isFavorited = false
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'prompt' | 'tips'>('preview');

  // 生成提示词和建议
  useEffect(() => {
    if (template) {
      const prompt = generateTemplatePrompt(template);
      setGeneratedPrompt(prompt);
      setSuggestions(generateCreativeSuggestions(template));
    }
  }, [template]);

  // 复制提示词
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    toast.success('提示词已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  // 使用模板
  const handleUseTemplate = async () => {
    if (!template) return;

    // 保存使用记录
    if (user?.id) {
      try {
        await templateUsageService.saveTemplateUsage(user.id, template, generatedPrompt);
      } catch (error) {
        console.error('保存模板使用记录失败:', error);
      }
    }

    // 关闭弹窗
    onClose();

    // 跳转到创作页面
    navigate('/create', {
      state: {
        templatePrompt: generatedPrompt,
        templateId: template.id,
        templateName: template.name,
        templateStyle: template.style,
        templateCategory: template.category
      }
    });

    toast.success(`正在使用"${template.name}"模板创建作品...`);
  };

  // 处理点赞
  const handleLike = () => {
    if (template && onLike) {
      onLike(template.id);
    }
  };

  // 处理收藏
  const handleFavorite = () => {
    if (template && onFavorite) {
      onFavorite(template.id);
    }
  };

  if (!template) return null;

  const difficulty = getDifficultyLabel(template.difficulty);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            onClick={onClose}
          />

          {/* 弹窗内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed inset-4 md:inset-10 lg:inset-20 rounded-3xl overflow-hidden z-[70] flex flex-col ${
              isDark ? 'bg-gray-900' : 'bg-white'
            }`}
          >
            {/* 头部 */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {template.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${difficulty.color}`}>
                      {difficulty.label}
                    </span>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {template.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 点赞按钮 */}
                <button
                  onClick={handleLike}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    isLiked
                      ? 'bg-red-500 text-white'
                      : isDark 
                        ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>

                {/* 收藏按钮 */}
                <button
                  onClick={handleFavorite}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    isFavorited
                      ? 'bg-amber-500 text-white'
                      : isDark 
                        ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                </button>

                {/* 关闭按钮 */}
                <button
                  onClick={onClose}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    isDark 
                      ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 标签页导航 */}
            <div className={`flex items-center gap-1 px-6 py-3 border-b ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            }`}>
              {[
                { id: 'preview', label: '模板预览', icon: Layout },
                { id: 'prompt', label: 'AI提示词', icon: Wand2 },
                { id: 'tips', label: '创作建议', icon: Lightbulb }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-red-500 text-white'
                      : isDark 
                        ? 'text-gray-400 hover:bg-gray-800' 
                        : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-auto">
              {/* 预览标签 */}
              {activeTab === 'preview' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 大图预览 */}
                    <div className={`rounded-2xl overflow-hidden ${
                      isDark ? 'bg-gray-800' : 'bg-gray-100'
                    }`}>
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://picsum.photos/seed/template-${template.id}/800/600`;
                        }}
                      />
                    </div>

                    {/* 模板信息 */}
                    <div className="space-y-6">
                      {/* 描述 */}
                      <div>
                        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          模板介绍
                        </h3>
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {template.description}
                        </p>
                      </div>

                      {/* 统计信息 */}
                      <div className={`grid grid-cols-3 gap-4 p-4 rounded-xl ${
                        isDark ? 'bg-gray-800' : 'bg-gray-50'
                      }`}>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {template.usageCount || 0}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>使用次数</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {template.likes || 0}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>点赞数</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {template.estimatedTime || '10分钟'}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>预计时间</div>
                        </div>
                      </div>

                      {/* 标签 */}
                      {template.tags && template.tags.length > 0 && (
                        <div>
                          <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            标签
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {template.tags.map((tag, i) => (
                              <span
                                key={i}
                                className={`text-sm px-3 py-1 rounded-full ${
                                  isDark 
                                    ? 'bg-gray-800 text-gray-400' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 色彩方案 */}
                      {template.colorScheme && template.colorScheme.length > 0 && (
                        <div>
                          <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            色彩方案
                          </h3>
                          <div className="flex items-center gap-2">
                            {template.colorScheme.map((color, i) => (
                              <div
                                key={i}
                                className="w-10 h-10 rounded-xl shadow-sm border-2 border-white dark:border-gray-700"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 适用场景 */}
                      {template.applicableScenes && template.applicableScenes.length > 0 && (
                        <div>
                          <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            适用场景
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {template.applicableScenes.map((scene, i) => (
                              <span
                                key={i}
                                className={`text-sm px-3 py-1 rounded-full ${
                                  isDark 
                                    ? 'bg-blue-900/30 text-blue-400' 
                                    : 'bg-blue-50 text-blue-600'
                                }`}
                              >
                                {scene}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 提示词标签 */}
              {activeTab === 'prompt' && (
                <div className="p-6">
                  <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-red-500" />
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          AI生成提示词
                        </h3>
                      </div>
                      <button
                        onClick={handleCopyPrompt}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                          copied
                            ? 'bg-green-500 text-white'
                            : isDark 
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                              : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span className="text-sm font-medium">
                          {copied ? '已复制' : '复制提示词'}
                        </span>
                      </button>
                    </div>
                    <p className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {generatedPrompt}
                    </p>
                  </div>

                  <div className="mt-6 text-center">
                    <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      使用此提示词，AI将根据模板风格自动生成作品
                    </p>
                    <button
                      onClick={handleUseTemplate}
                      className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium shadow-lg shadow-red-500/25 transition-all duration-200"
                    >
                      <Zap className="w-5 h-5" />
                      立即使用此模板创作
                    </button>
                  </div>
                </div>
              )}

              {/* 创作建议标签 */}
              {activeTab === 'tips' && (
                <div className="p-6">
                  <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-6">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        创作建议
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-3 p-4 rounded-xl ${
                            isDark ? 'bg-gray-700/50' : 'bg-white'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {index + 1}
                          </div>
                          <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 底部操作栏 */}
            <div className={`flex items-center justify-between px-6 py-4 border-t ${
              isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
            }`}>
              <div className="flex items-center gap-4 text-sm">
                <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Eye className="w-4 h-4" />
                  {template.usageCount || 0} 次使用
                </span>
                {template.style && (
                  <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Palette className="w-4 h-4" />
                    {template.style}
                  </span>
                )}
              </div>

              <button
                onClick={handleUseTemplate}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium shadow-lg shadow-red-500/25 transition-all duration-200"
              >
                <Zap className="w-4 h-4" />
                做同款
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TemplatePreviewModal;
