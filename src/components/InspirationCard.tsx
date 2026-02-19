import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { aiCreativeAssistantService, CreativeSuggestion } from '@/services/aiCreativeAssistantService';
import { Sparkles, Lightbulb, Palette, Layout, Type, Image, RefreshCw, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface InspirationCardProps {
  onSelect?: (text: string) => void;
  className?: string;
}

const TYPE_ICONS = {
  theme: Lightbulb,
  style: Palette,
  color: Type,
  element: Image,
  layout: Layout,
  concept: Sparkles
};

const TYPE_LABELS = {
  theme: '主题',
  style: '风格',
  color: '色彩',
  element: '元素',
  layout: '布局',
  concept: '概念'
};

const TYPE_COLORS = {
  theme: 'from-amber-500 to-orange-500',
  style: 'from-blue-500 to-cyan-500',
  color: 'from-purple-500 to-pink-500',
  element: 'from-green-500 to-emerald-500',
  layout: 'from-indigo-500 to-violet-500',
  concept: 'from-rose-500 to-red-500'
};

export const InspirationCard: React.FC<InspirationCardProps> = ({ onSelect, className = '' }) => {
  const { isDark } = useTheme();
  const [suggestions, setSuggestions] = useState<CreativeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCard, setShowCard] = useState(false);

  // 生成灵感建议
  const generateSuggestions = async () => {
    setIsLoading(true);
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      const newSuggestions = aiCreativeAssistantService.generateCreativeSuggestions('创作灵感', 6);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('生成灵感失败:', error);
      toast.error('生成灵感失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    generateSuggestions();
  }, []);

  // 复制到剪贴板
  const handleCopy = async (suggestion: CreativeSuggestion) => {
    try {
      await navigator.clipboard.writeText(suggestion.content);
      setCopiedId(suggestion.id);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  // 选择建议
  const handleSelect = (suggestion: CreativeSuggestion) => {
    if (onSelect) {
      onSelect(suggestion.content);
      toast.success('已添加到输入框');
    }
    setShowCard(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* 触发按钮 */}
      <motion.button
        onClick={() => setShowCard(!showCard)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
          showCard
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
            : isDark
            ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Sparkles className="w-4 h-4" />
        <span>灵感推荐</span>
      </motion.button>

      {/* 灵感卡片弹窗 */}
      <AnimatePresence>
        {showCard && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute bottom-full left-0 mb-3 w-96 rounded-2xl shadow-2xl border overflow-hidden z-50 ${
              isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            {/* 头部 */}
            <div className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>创作灵感</h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>AI 智能推荐</p>
                  </div>
                </div>
                <motion.button
                  onClick={generateSuggestions}
                  disabled={isLoading}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </motion.button>
              </div>
            </div>

            {/* 灵感列表 */}
            <div className={`p-3 space-y-2 max-h-80 overflow-y-auto ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
              {isLoading ? (
                // 加载骨架屏
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl animate-pulse ${
                      isDark ? 'bg-gray-800' : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                      <div className="flex-1 space-y-2">
                        <div className={`h-3 rounded w-3/4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                        <div className={`h-2 rounded w-1/2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                      </div>
                    </div>
                  </div>
                ))
              ) : suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => {
                  const Icon = TYPE_ICONS[suggestion.type];
                  const gradient = TYPE_COLORS[suggestion.type];
                  return (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group p-3 rounded-xl border cursor-pointer transition-all ${
                        isDark
                          ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800'
                          : 'border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-white hover:shadow-md'
                      }`}
                      onClick={() => handleSelect(suggestion)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {TYPE_LABELS[suggestion.type]}
                            </span>
                            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              相关度 {suggestion.relevance}%
                            </span>
                          </div>
                          <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            {suggestion.content}
                          </p>
                          <p className={`text-xs line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {suggestion.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {suggestion.tags.slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(suggestion);
                          }}
                          className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all ${
                            isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {copiedId === suggestion.id ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">暂无灵感推荐</p>
                  <button
                    onClick={generateSuggestions}
                    className="mt-2 text-xs text-indigo-500 hover:text-indigo-600"
                  >
                    点击刷新
                  </button>
                </div>
              )}
            </div>

            {/* 底部 */}
            <div className={`p-3 border-t ${isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-100 bg-gray-50/30'}`}>
              <p className={`text-[10px] text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                点击卡片添加到输入框，点击复制按钮复制内容
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InspirationCard;
