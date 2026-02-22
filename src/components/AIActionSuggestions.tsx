import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  Image,
  Video,
  FileText,
  Sparkles,
  Lightbulb,
  Palette,
  Wand2,
  ArrowRight,
  MessageSquare,
  Search,
  BookOpen,
  Compass
} from 'lucide-react';

export type ActionType = 
  | 'generate_image'
  | 'generate_video'
  | 'create_design'
  | 'get_inspiration'
  | 'cultural_info'
  | 'write_text'
  | 'navigate'
  | 'search';

export interface ActionSuggestion {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  action: () => void;
  navigateTo?: string; // 可选的导航路径
}

interface AIActionSuggestionsProps {
  input: string;
  onSuggestionClick: (suggestion: ActionSuggestion) => void;
  onNavigate?: (path: string) => void; // 新增导航回调
  className?: string;
}

export const AIActionSuggestions: React.FC<AIActionSuggestionsProps> = ({
  input,
  onSuggestionClick,
  onNavigate,
  className = ''
}) => {
  const { isDark } = useTheme();

  const suggestions = useMemo(() => {
    const lowerInput = input.toLowerCase();
    const matchedSuggestions: ActionSuggestion[] = [];

    // 图片生成建议
    if (lowerInput.includes('图') || lowerInput.includes('画') || lowerInput.includes('照片') ||
        lowerInput.includes('生成') || lowerInput.includes('绘制')) {
      matchedSuggestions.push({
        id: 'generate_image',
        type: 'generate_image',
        title: '生成图片',
        description: '基于描述生成AI图片',
        icon: <Image className="w-5 h-5" />,
        color: 'from-purple-500 to-pink-500',
        gradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
        action: () => {},
        navigateTo: '/create'
      });
    }

    // 视频生成建议
    if (lowerInput.includes('视频') || lowerInput.includes('动画') || lowerInput.includes('影片')) {
      matchedSuggestions.push({
        id: 'generate_video',
        type: 'generate_video',
        title: '生成视频',
        description: '创建动态视频内容',
        icon: <Video className="w-5 h-5" />,
        color: 'from-blue-500 to-cyan-500',
        gradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
        action: () => {},
        navigateTo: '/create'
      });
    }

    // 设计创作建议
    if (lowerInput.includes('设计') || lowerInput.includes('创作') || lowerInput.includes('方案')) {
      matchedSuggestions.push({
        id: 'create_design',
        type: 'create_design',
        title: '设计创作',
        description: '获取专业设计建议',
        icon: <Palette className="w-5 h-5" />,
        color: 'from-amber-500 to-orange-500',
        gradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
        action: () => {},
        navigateTo: '/create'
      });
    }

    // 灵感建议
    if (lowerInput.includes('灵感') || lowerInput.includes('想法') || lowerInput.includes('创意')) {
      matchedSuggestions.push({
        id: 'get_inspiration',
        type: 'get_inspiration',
        title: '获取灵感',
        description: '探索创意可能性',
        icon: <Lightbulb className="w-5 h-5" />,
        color: 'from-yellow-500 to-amber-500',
        gradient: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
        action: () => {},
        navigateTo: '/inspiration'
      });
    }

    // 文化知识建议
    if (lowerInput.includes('文化') || lowerInput.includes('历史') || lowerInput.includes('传统') ||
        lowerInput.includes('杨柳青') || lowerInput.includes('泥人张') || lowerInput.includes('风筝')) {
      matchedSuggestions.push({
        id: 'cultural_info',
        type: 'cultural_info',
        title: '文化知识',
        description: '了解传统文化背景',
        icon: <BookOpen className="w-5 h-5" />,
        color: 'from-red-500 to-rose-500',
        gradient: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
        action: () => {},
        navigateTo: '/cultural-knowledge'
      });
    }

    // 文案写作建议
    if (lowerInput.includes('写') || lowerInput.includes('文案') || lowerInput.includes('描述') ||
        lowerInput.includes('介绍') || lowerInput.includes('说明')) {
      matchedSuggestions.push({
        id: 'write_text',
        type: 'write_text',
        title: '文案写作',
        description: '生成专业文案内容',
        icon: <FileText className="w-5 h-5" />,
        color: 'from-emerald-500 to-teal-500',
        gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
        action: () => {},
        navigateTo: '/create'
      });
    }

    // 导航建议
    if (lowerInput.includes('导航') || lowerInput.includes('去') || lowerInput.includes('打开') ||
        lowerInput.includes('前往') || lowerInput.includes('跳转')) {
      matchedSuggestions.push({
        id: 'navigate',
        type: 'navigate',
        title: '页面导航',
        description: '快速跳转到相关页面',
        icon: <Compass className="w-5 h-5" />,
        color: 'from-indigo-500 to-violet-500',
        gradient: 'from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20',
        action: () => {},
        navigateTo: '/'
      });
    }

    // 搜索建议
    if (lowerInput.includes('搜索') || lowerInput.includes('查找') || lowerInput.includes('查询')) {
      matchedSuggestions.push({
        id: 'search',
        type: 'search',
        title: '智能搜索',
        description: '搜索相关内容',
        icon: <Search className="w-5 h-5" />,
        color: 'from-cyan-500 to-blue-500',
        gradient: 'from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20',
        action: () => {},
        navigateTo: '/search'
      });
    }

    // 如果没有匹配到任何建议，显示通用建议
    if (matchedSuggestions.length === 0 && input.length > 0) {
      matchedSuggestions.push({
        id: 'general_chat',
        type: 'generate_image',
        title: '智能对话',
        description: '继续与AI交流',
        icon: <MessageSquare className="w-5 h-5" />,
        color: 'from-gray-500 to-slate-500',
        gradient: 'from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50',
        action: () => {}
      });
    }

    return matchedSuggestions.slice(0, 4); // 最多显示4个建议
  }, [input]);

  if (suggestions.length === 0 || !input.trim()) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={`space-y-2 ${className}`}
      >
        <div className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          快捷操作
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                // 优先执行导航
                if (suggestion.navigateTo && onNavigate) {
                  onNavigate(suggestion.navigateTo);
                }
                // 同时触发点击回调
                onSuggestionClick(suggestion);
              }}
              className={`relative p-3 rounded-xl border-2 transition-all duration-200 text-left group ${
                isDark
                  ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {/* 背景渐变 */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${suggestion.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
              
              <div className="relative flex items-center gap-2">
                {/* 图标 */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${suggestion.color} text-white shadow-md`}>
                  {suggestion.icon}
                </div>
                
                {/* 文字内容 */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {suggestion.title}
                  </div>
                  <div className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {suggestion.description}
                  </div>
                </div>
                
                {/* 箭头 */}
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIActionSuggestions;
