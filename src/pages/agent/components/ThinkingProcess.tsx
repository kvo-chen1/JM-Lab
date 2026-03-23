/**
 * 思考过程展示组件
 * 显示 AI 生成过程中的思考细节
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Brain, ChevronDown, ChevronUp, Sparkles, Wand2, MessageSquare } from 'lucide-react';

export interface ThinkingData {
  userRequirement: string;
  modelSelection: {
    model: string;
    reason: string;
  };
  promptDesign: {
    strategy: string;
    finalPrompt: string;
  };
}

interface ThinkingProcessProps {
  thinking: ThinkingData;
  isGenerating?: boolean;
}

export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({
  thinking,
  isGenerating = false
}) => {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`rounded-lg overflow-hidden ${
      isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'
    }`}>
      {/* 头部 - 可点击展开/折叠 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
          isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <Brain className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {isGenerating ? '正在思考...' : '展示思考过程'}
          </span>
          {isGenerating && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className={`w-3 h-3 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
            </motion.div>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        ) : (
          <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        )}
      </button>

      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className={`px-4 pb-4 space-y-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {/* 用户需求 */}
              <div className="space-y-1">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <MessageSquare className="w-3 h-3" />
                  用户需求
                </div>
                <p className={`text-sm pl-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {thinking.userRequirement}
                </p>
              </div>

              {/* 模型选择 */}
              <div className="space-y-1">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Wand2 className="w-3 h-3" />
                  模型选择
                </div>
                <div className={`text-sm pl-4 space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    选择模型：{thinking.modelSelection.model}
                  </p>
                  <p>{thinking.modelSelection.reason}</p>
                </div>
              </div>

              {/* 提示词设计 */}
              <div className="space-y-1">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Sparkles className="w-3 h-3" />
                  提示词设计
                </div>
                <div className={`text-sm pl-4 space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p>{thinking.promptDesign.strategy}</p>
                  <div className={`mt-2 p-2 rounded text-xs font-mono ${
                    isDark ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {thinking.promptDesign.finalPrompt}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThinkingProcess;
