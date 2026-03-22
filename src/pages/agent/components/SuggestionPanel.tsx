import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore } from '../hooks/useAgentStore';
import { getSuggestionEngine } from '../services/suggestionEngine';
import { 
  Suggestion, 
  SuggestionType,
  SuggestionTriggerEvent 
} from '../types/suggestion';
import { 
  Lightbulb, X, Sparkles, Palette, User, Zap, MessageSquare, 
  ArrowRight, Wand2, Layers, BookOpen, Image, RefreshCw,
  CheckCircle, AlertCircle, TrendingUp, Star, Gift, Brush
} from 'lucide-react';

interface SuggestionPanelProps {
  onSuggestionClick?: (suggestion: Suggestion) => void;
  onSuggestionAction?: (action: string, payload?: any) => void;
}

// 建议类型配置
const SUGGESTION_TYPE_CONFIG: Record<SuggestionType, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}> = {
  [SuggestionType.STYLE]: { icon: Palette, color: 'text-pink-500', bgColor: 'bg-pink-100', label: '风格' },
  [SuggestionType.AGENT]: { icon: User, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Agent' },
  [SuggestionType.TASK]: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100', label: '任务' },
  [SuggestionType.ACTION]: { icon: Zap, color: 'text-yellow-500', bgColor: 'bg-yellow-100', label: '操作' },
  [SuggestionType.CONTENT]: { icon: MessageSquare, color: 'text-purple-500', bgColor: 'bg-purple-100', label: '内容' },
  [SuggestionType.SHORTCUT]: { icon: Sparkles, color: 'text-amber-500', bgColor: 'bg-amber-100', label: '快捷' },
  
  // 智能内容建议
  [SuggestionType.PROMPT_OPTIMIZATION]: { icon: Wand2, color: 'text-cyan-500', bgColor: 'bg-cyan-100', label: '优化' },
  [SuggestionType.ELEMENT_SUGGESTION]: { icon: Layers, color: 'text-indigo-500', bgColor: 'bg-indigo-100', label: '元素' },
  [SuggestionType.REFERENCE_CASE]: { icon: BookOpen, color: 'text-emerald-500', bgColor: 'bg-emerald-100', label: '案例' },
  [SuggestionType.STYLE_MATCHING]: { icon: Brush, color: 'text-rose-500', bgColor: 'bg-rose-100', label: '匹配' },
  
  // 智能操作建议
  [SuggestionType.ONE_CLICK_OPTIMIZE]: { icon: RefreshCw, color: 'text-orange-500', bgColor: 'bg-orange-100', label: '优化' },
  [SuggestionType.VARIANT_GENERATION]: { icon: Image, color: 'text-teal-500', bgColor: 'bg-teal-100', label: '变体' },
  [SuggestionType.DERIVATIVE_CREATION]: { icon: Gift, color: 'text-violet-500', bgColor: 'bg-violet-100', label: '衍生' },
  [SuggestionType.COLLABORATION_SUGGESTION]: { icon: User, color: 'text-sky-500', bgColor: 'bg-sky-100', label: '协作' },
  
  // 智能学习建议
  [SuggestionType.SKILL_TIP]: { icon: Star, color: 'text-amber-500', bgColor: 'bg-amber-100', label: '技巧' },
  [SuggestionType.TREND_INSIGHT]: { icon: TrendingUp, color: 'text-red-500', bgColor: 'bg-red-100', label: '趋势' },
  [SuggestionType.EFFICIENCY_BOOST]: { icon: Zap, color: 'text-lime-500', bgColor: 'bg-lime-100', label: '效率' },
  
  // 个性化洞察
  [SuggestionType.STYLE_ANALYSIS]: { icon: Brush, color: 'text-fuchsia-500', bgColor: 'bg-fuchsia-100', label: '分析' },
  [SuggestionType.SKILL_IMPROVEMENT]: { icon: TrendingUp, color: 'text-cyan-500', bgColor: 'bg-cyan-100', label: '提升' },
  [SuggestionType.WORK_IMPROVEMENT]: { icon: Wand2, color: 'text-pink-500', bgColor: 'bg-pink-100', label: '改进' }
};

export default function SuggestionPanel({ onSuggestionClick, onSuggestionAction }: SuggestionPanelProps) {
  const { isDark } = useTheme();
  const { currentAgent, messages, currentTask, generatedOutputs } = useAgentStore();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [lastUserInput, setLastUserInput] = useState('');

  const suggestionEngine = getSuggestionEngine();

  // 获取建议
  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const conversationStage = determineConversationStage();
      
      const recentMessages = Array.isArray(messages) ? messages.slice(-5).map(m => ({
        role: m.role,
        content: m.content
      })) : [];

      const newSuggestions = await suggestionEngine.generateSuggestions({
        currentAgent,
        conversationStage,
        recentMessages,
        currentTask: currentTask ? {
          type: currentTask.type,
          requirements: currentTask.requirements
        } : undefined
      });

      // 过滤掉已关闭的建议
      const filtered = newSuggestions.filter(s => !dismissedSuggestions.has(s.id));
      setSuggestions(filtered.slice(0, 3));
    } catch (error) {
      console.error('[SuggestionPanel] Failed to fetch suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentAgent, messages, currentTask, dismissedSuggestions]);

  // 确定对话阶段
  const determineConversationStage = () => {
    if (messages.length === 0) return 'initial';
    if (currentTask?.status === 'completed') return 'reviewing';
    if (currentTask) return 'executing';
    return 'collecting';
  };

  // 监听生成完成事件
  useEffect(() => {
    const handleGenerationComplete = async (data: any) => {
      if (data?.success) {
        const eventSuggestions = await suggestionEngine.triggerSuggestion(
          SuggestionTriggerEvent.GENERATION_COMPLETE,
          data
        );
        if (eventSuggestions.length > 0) {
          setSuggestions(prev => {
            const combined = [...eventSuggestions, ...prev];
            return combined.slice(0, 3);
          });
        }
      }
    };

    suggestionEngine.on(SuggestionTriggerEvent.GENERATION_COMPLETE, handleGenerationComplete);
    return () => {
      suggestionEngine.off(SuggestionTriggerEvent.GENERATION_COMPLETE, handleGenerationComplete);
    };
  }, [suggestionEngine]);

  // 监听用户输入
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user') {
      const content = lastMessage.content;
      if (content !== lastUserInput) {
        setLastUserInput(content);
        
        // 用户停止输入3秒后获取建议
        const timer = setTimeout(() => {
          fetchSuggestions();
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [messages, lastUserInput, fetchSuggestions]);

  // 初始加载和定期刷新
  useEffect(() => {
    fetchSuggestions();
    
    const interval = setInterval(fetchSuggestions, 60000); // 改为60秒
    return () => clearInterval(interval);
  }, [fetchSuggestions]);

  // 获取建议图标
  const getSuggestionIcon = (type: SuggestionType) => {
    const config = SUGGESTION_TYPE_CONFIG[type] || SUGGESTION_TYPE_CONFIG[SuggestionType.ACTION];
    const Icon = config.icon;
    return <Icon className="w-4 h-4" />;
  };

  // 获取建议样式
  const getSuggestionStyles = (type: SuggestionType, isDark: boolean) => {
    const config = SUGGESTION_TYPE_CONFIG[type] || SUGGESTION_TYPE_CONFIG[SuggestionType.ACTION];
    
    if (isDark) {
      return {
        iconBg: `bg-gray-700 ${config.color}`,
        badge: `text-xs px-1.5 py-0.5 rounded ${config.bgColor} ${config.color}`
      };
    }
    return {
      iconBg: `${config.bgColor} ${config.color}`,
      badge: `text-xs px-1.5 py-0.5 rounded ${config.bgColor} ${config.color}`
    };
  };

  // 处理建议点击
  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
    
    if (onSuggestionAction) {
      onSuggestionAction(suggestion.action.type, suggestion.action.payload);
    }
    
    // 记录建议被使用
    suggestionEngine.applySuggestion(suggestion);
  };

  // 关闭单个建议
  const handleDismissSuggestion = (e: React.MouseEvent, suggestionId: string) => {
    e.stopPropagation();
    setDismissedSuggestions(prev => new Set(prev).add(suggestionId));
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return 'from-red-400 to-orange-400';
    if (priority >= 60) return 'from-orange-400 to-amber-400';
    if (priority >= 40) return 'from-amber-400 to-yellow-400';
    return 'from-gray-300 to-gray-400';
  };

  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900/90 to-gray-900/90 border-slate-700/50 shadow-xl shadow-black/20' 
          : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-lg shadow-gray-200/50'
      }`}
    >
      {/* 头部 */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-black/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            isDark ? 'bg-amber-500/20' : 'bg-amber-100'
          }`}>
            <Lightbulb className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
          <span className={`text-sm font-semibold ${
            isDark ? 'text-gray-200' : 'text-gray-800'
          }`}>
            AI 创意助手
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'
          }`}>
            {suggestions.length}
          </span>
          {isLoading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="w-3 h-3 text-amber-500" />
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              fetchSuggestions();
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark 
                ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' 
                : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
            }`}
            title="刷新建议"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark 
                ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' 
                : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 建议列表 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 pb-3 space-y-2"
          >
            {suggestions.map((suggestion, index) => {
              const styles = getSuggestionStyles(suggestion.type, isDark);
              const config = SUGGESTION_TYPE_CONFIG[suggestion.type];
              
              return (
                <motion.button
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all group relative ${
                    isDark 
                      ? 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-500/30' 
                      : 'bg-white hover:bg-gray-50 border border-gray-200/50 hover:border-amber-300 hover:shadow-md'
                  }`}
                >
                  {/* 类型标签 */}
                  <div className="absolute top-2 right-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${config?.bgColor} ${config?.color}`}>
                      {config?.label}
                    </span>
                  </div>

                  {/* 图标 */}
                  <div className={`flex-shrink-0 p-2.5 rounded-lg ${styles.iconBg}`}>
                    {getSuggestionIcon(suggestion.type)}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium truncate ${
                        isDark ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {suggestion.title}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 line-clamp-2 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {suggestion.description}
                    </p>
                    {suggestion.reason && (
                      <p className={`text-xs mt-1.5 flex items-center gap-1 ${
                        isDark ? 'text-amber-400/80' : 'text-amber-600/80'
                      }`}>
                        <Sparkles className="w-3 h-3" />
                        {suggestion.reason}
                      </p>
                    )}
                  </div>

                  {/* 操作区 */}
                  <div className="flex-shrink-0 self-center flex flex-col items-end gap-2">
                    {/* 置信度指示器 */}
                    <div className={`w-10 h-1.5 rounded-full overflow-hidden ${
                      isDark ? 'bg-slate-700' : 'bg-gray-200'
                    }`}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${suggestion.confidence * 100}%` }}
                        transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                        className={`h-full bg-gradient-to-r ${getPriorityColor(suggestion.priority)}`}
                      />
                    </div>
                    
                    {/* 箭头 */}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 text-amber-500" />
                  </div>

                  {/* 关闭按钮 */}
                  <button
                    onClick={(e) => handleDismissSuggestion(e, suggestion.id)}
                    className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                      isDark 
                        ? 'hover:bg-slate-700 text-slate-500 hover:text-slate-300' 
                        : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.button>
              );
            })}

            {/* 底部提示 */}
            <div className={`text-center py-2 text-xs ${
              isDark ? 'text-slate-500' : 'text-gray-400'
            }`}>
              基于您的创作习惯智能推荐
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
