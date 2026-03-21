import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore } from '../hooks/useAgentStore';
import { getSuggestionEngine, Suggestion, SuggestionType } from '../services/suggestionEngine';
import { Lightbulb, X, Sparkles, Palette, User, Zap, MessageSquare, ArrowRight } from 'lucide-react';

interface SuggestionPanelProps {
  onSuggestionClick?: (suggestion: Suggestion) => void;
}

export default function SuggestionPanel({ onSuggestionClick }: SuggestionPanelProps) {
  const { isDark } = useTheme();
  const { currentAgent, messages, currentTask } = useAgentStore();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const suggestionEngine = getSuggestionEngine();

  // 获取建议
  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      // 确定对话阶段
      const conversationStage = determineConversationStage();
      
      // 获取最近的消息
      const recentMessages = Array.isArray(messages) ? messages.slice(-5).map(m => ({
        role: m.role,
        content: m.content
      })) : [];

      // 生成建议
      const newSuggestions = await suggestionEngine.generateSuggestions({
        currentAgent,
        conversationStage,
        recentMessages,
        currentTask: currentTask ? {
          type: currentTask.type,
          requirements: currentTask.requirements
        } : undefined
      });

      setSuggestions(newSuggestions.slice(0, 3)); // 最多显示3个
    } catch (error) {
      console.error('[SuggestionPanel] Failed to fetch suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 确定对话阶段
  const determineConversationStage = () => {
    if (messages.length === 0) return 'initial';
    if (currentTask?.status === 'completed') return 'reviewing';
    if (currentTask) return 'executing';
    return 'collecting';
  };

  // 组件挂载时获取建议
  useEffect(() => {
    fetchSuggestions();
    
    // 每30秒刷新一次
    const interval = setInterval(fetchSuggestions, 30000);
    return () => clearInterval(interval);
  }, [currentAgent, messages.length, currentTask?.id]);

  // 获取建议图标
  const getSuggestionIcon = (type: SuggestionType) => {
    switch (type) {
      case SuggestionType.STYLE:
        return <Palette className="w-4 h-4" />;
      case SuggestionType.AGENT:
        return <User className="w-4 h-4" />;
      case SuggestionType.ACTION:
        return <Zap className="w-4 h-4" />;
      case SuggestionType.CONTENT:
        return <MessageSquare className="w-4 h-4" />;
      case SuggestionType.SHORTCUT:
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  // 处理建议点击
  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
    
    // 根据建议类型执行不同操作
    switch (suggestion.action.type) {
      case 'message':
        // 发送建议的消息
        break;
      case 'switch_agent':
        // 切换Agent
        break;
      case 'generate':
        // 触发生成
        break;
      case 'navigate':
        // 导航到指定页面
        break;
    }
  };

  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${
        isDark 
          ? 'bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-700/30' 
          : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
      }`}
    >
      {/* 头部 */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            isDark ? 'bg-amber-500/20' : 'bg-amber-100'
          }`}>
            <Lightbulb className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
          <span className={`text-sm font-medium ${
            isDark ? 'text-amber-200' : 'text-amber-800'
          }`}>
            智能建议
          </span>
          {isLoading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
            </motion.div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={`p-1 rounded transition-colors ${
            isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
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
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all group ${
                  isDark 
                    ? 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-amber-500/30' 
                    : 'bg-white/70 hover:bg-white border border-gray-200/50 hover:border-amber-300'
                }`}
              >
                {/* 图标 */}
                <div className={`flex-shrink-0 p-2 rounded-lg ${
                  isDark ? 'bg-gray-700 text-amber-400' : 'bg-amber-100 text-amber-600'
                }`}>
                  {getSuggestionIcon(suggestion.type)}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium truncate ${
                      isDark ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {suggestion.title}
                    </span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-amber-500" />
                  </div>
                  <p className={`text-xs mt-0.5 line-clamp-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {suggestion.description}
                  </p>
                  {suggestion.reason && (
                    <p className={`text-xs mt-1 ${
                      isDark ? 'text-amber-400/70' : 'text-amber-600/70'
                    }`}>
                      💡 {suggestion.reason}
                    </p>
                  )}
                </div>

                {/* 置信度指示器 */}
                <div className="flex-shrink-0 self-center">
                  <div className={`w-8 h-1 rounded-full overflow-hidden ${
                    isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-400"
                      style={{ width: `${suggestion.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </motion.button>
            ))}

            {/* 刷新按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchSuggestions();
              }}
              className={`w-full py-2 text-xs text-center rounded-lg transition-colors ${
                isDark 
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              刷新建议
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
