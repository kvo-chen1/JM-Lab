/**
 * Skill 执行状态追踪组件
 * 显示当前正在执行的 Skill 及其状态
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  Brain,
  Image,
  Type,
  Video,
  Search,
  Wand2,
  MessageSquare
} from 'lucide-react';
import { SkillResult } from '../types/skill';

interface SkillExecutionStatusProps {
  isProcessing: boolean;
  currentSkillName?: string;
  lastResult?: SkillResult | null;
  error?: string | null;
  className?: string;
}

// Skill 类型到图标的映射
const skillIconMap: Record<string, React.ReactNode> = {
  'intent-recognition': <Brain className="w-4 h-4" />,
  'image-generation': <Image className="w-4 h-4" />,
  'text-generation': <Type className="w-4 h-4" />,
  'video-generation': <Video className="w-4 h-4" />,
  'requirement-analysis': <Search className="w-4 h-4" />,
  'requirement-collection': <MessageSquare className="w-4 h-4" />,
  'default': <Wand2 className="w-4 h-4" />
};

// 获取 Skill 图标
const getSkillIcon = (skillName?: string): React.ReactNode => {
  if (!skillName) return skillIconMap['default'];
  
  const normalizedName = skillName.toLowerCase().replace(/\s+/g, '-');
  
  for (const [key, icon] of Object.entries(skillIconMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return icon;
    }
  }
  
  return skillIconMap['default'];
};

export const SkillExecutionStatus: React.FC<SkillExecutionStatusProps> = ({
  isProcessing,
  currentSkillName,
  lastResult,
  error,
  className = ''
}) => {
  const { isDark } = useTheme();

  // 如果没有正在处理且没有结果，不显示
  if (!isProcessing && !lastResult && !error) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {/* 执行中状态 */}
      {isProcessing && (
        <motion.div
          key="processing"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`rounded-lg p-3 ${
            isDark 
              ? 'bg-blue-900/20 border border-blue-700/50' 
              : 'bg-blue-50 border border-blue-200'
          } ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              isDark ? 'bg-blue-800/50' : 'bg-blue-100'
            }`}>
              <Loader2 className={`w-5 h-5 animate-spin ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                isDark ? 'text-blue-300' : 'text-blue-700'
              }`}>
                {currentSkillName || '正在处理...'}
              </p>
              <p className={`text-xs ${
                isDark ? 'text-blue-400/70' : 'text-blue-600/70'
              }`}>
                AI 正在分析并执行相应操作
              </p>
            </div>
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className={`w-4 h-4 ${
                isDark ? 'text-blue-400' : 'text-blue-500'
              }`} />
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* 成功状态 */}
      {!isProcessing && lastResult?.success && (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`rounded-lg p-3 ${
            isDark
              ? 'bg-green-900/20 border border-green-700/50'
              : 'bg-green-50 border border-green-200'
          } ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              isDark ? 'bg-green-800/50' : 'bg-green-100'
            }`}>
              <CheckCircle2 className={`w-5 h-5 ${
                isDark ? 'text-green-400' : 'text-green-600'
              }`} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                isDark ? 'text-green-300' : 'text-green-700'
              }`}>
                执行成功
              </p>
              <p className={`text-xs ${
                isDark ? 'text-green-400/70' : 'text-green-600/70'
              }`}>
                {lastResult?.type === 'image'
                  ? '图片已生成'
                  : lastResult?.type === 'text'
                  ? '文本已生成'
                  : '操作已完成'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 错误状态 */}
      {!isProcessing && error && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`rounded-lg p-3 ${
            isDark 
              ? 'bg-red-900/20 border border-red-700/50' 
              : 'bg-red-50 border border-red-200'
          } ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              isDark ? 'bg-red-800/50' : 'bg-red-100'
            }`}>
              <XCircle className={`w-5 h-5 ${
                isDark ? 'text-red-400' : 'text-red-600'
              }`} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                isDark ? 'text-red-300' : 'text-red-700'
              }`}>
                执行失败
              </p>
              <p className={`text-xs ${
                isDark ? 'text-red-400/70' : 'text-red-600/70'
              }`}>
                {error}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 简化的内联版本，适合放在输入框附近
export const SkillExecutionBadge: React.FC<{
  isProcessing: boolean;
  skillName?: string;
}> = ({ isProcessing, skillName }) => {
  const { isDark } = useTheme();

  if (!isProcessing) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
        isDark 
          ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50' 
          : 'bg-blue-50 text-blue-700 border border-blue-200'
      }`}
    >
      <Loader2 className="w-3 h-3 animate-spin" />
      <span className="flex items-center gap-1">
        {getSkillIcon(skillName)}
        {skillName || '处理中'}
      </span>
    </motion.div>
  );
};

export default SkillExecutionStatus;
