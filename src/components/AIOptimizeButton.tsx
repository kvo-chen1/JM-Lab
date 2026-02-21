import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Check, Loader2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { llmService } from '@/services/llmService';
import { toast } from 'sonner';

interface AIOptimizeButtonProps {
  content: string;
  fieldLabel: string;
  onAccept: (optimizedContent: string) => void;
  disabled?: boolean;
  className?: string;
}

export const AIOptimizeButton: React.FC<AIOptimizeButtonProps> = ({
  content,
  fieldLabel,
  onAccept,
  disabled = false,
  className = '',
}) => {
  const { isDark } = useTheme();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedContent, setOptimizedContent] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleOptimize = useCallback(async () => {
    if (!content.trim() || isOptimizing) return;

    setIsOptimizing(true);
    try {
      const prompt = `请优化以下"${fieldLabel}"的描述，使其更加专业、清晰、有吸引力，同时保持原意：

原始内容：
${content}

要求：
1. 语言更加专业和流畅
2. 突出关键信息和卖点
3. 结构清晰，易于理解
4. 保持简洁，避免冗余

请直接返回优化后的内容，不需要解释。`;

      const response = await llmService.directGenerateResponse(prompt);
      setOptimizedContent(response || content);
      setShowResult(true);
    } catch (error) {
      console.error('AI优化失败:', error);
      toast.error('AI优化失败，请稍后重试');
    } finally {
      setIsOptimizing(false);
    }
  }, [content, fieldLabel, isOptimizing]);

  const handleAccept = useCallback(() => {
    if (optimizedContent) {
      onAccept(optimizedContent);
      setShowResult(false);
      setOptimizedContent(null);
      toast.success('已应用优化内容');
    }
  }, [optimizedContent, onAccept]);

  const handleReject = useCallback(() => {
    setShowResult(false);
    setOptimizedContent(null);
  }, []);

  // 如果没有内容，不显示优化按钮
  if (!content.trim()) return null;

  return (
    <div className={className}>
      {/* AI优化按钮 */}
      {!showResult && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOptimize}
          disabled={isOptimizing || disabled}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
            isOptimizing
              ? isDark
                ? 'bg-purple-500/20 text-purple-400 cursor-wait'
                : 'bg-purple-100 text-purple-600 cursor-wait'
              : isDark
              ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
              : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
          }`}
        >
          {isOptimizing ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              优化中...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3" />
              AI优化
            </>
          )}
        </motion.button>
      )}

      {/* 优化结果展示 */}
      <AnimatePresence>
        {showResult && optimizedContent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mt-3 p-4 rounded-xl border-2 ${
              isDark
                ? 'bg-purple-500/10 border-purple-500/30'
                : 'bg-purple-50 border-purple-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                AI优化建议
              </span>
            </div>
            <p className={`text-sm mb-3 whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {optimizedContent}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAccept}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <Check className="w-3 h-3" />
                采用
              </button>
              <button
                onClick={handleReject}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <X className="w-3 h-3" />
                放弃
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIOptimizeButton;
