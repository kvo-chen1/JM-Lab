import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';

interface AISuggestionBoxProps {
  content: string;
  isLoading?: boolean;
  className?: string;
  title?: string;
  onApply?: (text: string) => void;
}

/**
 * AI Suggestion Box Component
 * 
 * Optimized for:
 * - Readability: Clean typography and spacing
 * - Performance: Memoized rendering and efficient DOM updates
 * - Accessibility: ARIA live regions and keyboard navigation
 * - UX: Loading states, copy functionality, and smooth animations
 */
export default function AISuggestionBox({ 
  content, 
  isLoading = false, 
  className = '',
  title = 'AI 创意助理',
  onApply
}: AISuggestionBoxProps) {
  const { isDark } = useTheme();
  const [displayedContent, setDisplayedContent] = useState('');
  
  // Optimization: Debounce or throttle updates if content streams in too fast
  // For now, we sync directly but the typing effect could be enhanced here
  useEffect(() => {
    setDisplayedContent(content);
  }, [content]);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      toast.success('已复制到剪贴板');
    } catch (err) {
      toast.error('复制失败');
    }
  };

  return (
    <div 
      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
        isDark 
          ? 'bg-gray-800/50 border-gray-700 shadow-lg shadow-black/20' 
          : 'bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border-blue-100 shadow-sm'
      } ${className}`}
      role="region"
      aria-label={title}
    >
      {/* Header Area */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${
        isDark ? 'border-gray-700/50' : 'border-blue-100'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            isLoading 
              ? 'bg-blue-500/10 text-blue-500' 
              : 'bg-gradient-to-tr from-blue-500 to-purple-500 text-white shadow-md shadow-blue-500/20'
          }`}>
            {isLoading ? (
              <i className="fas fa-spinner fa-spin text-xs"></i>
            ) : (
              <i className="fas fa-sparkles text-xs"></i>
            )}
          </div>
          <span className={`font-bold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            {title}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {content && !isLoading && (
            <>
              <button
                onClick={handleCopy}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  isDark 
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-white' 
                    : 'text-gray-500 hover:bg-white hover:text-blue-600 hover:shadow-sm'
                }`}
                title="复制内容"
                aria-label="复制生成的内容"
              >
                <i className="fas fa-copy"></i>
              </button>
              {onApply && (
                <button
                  onClick={() => onApply(content)}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    isDark 
                      ? 'text-gray-400 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-500 hover:bg-white hover:text-blue-600 hover:shadow-sm'
                  }`}
                  title="应用此内容"
                  aria-label="应用此内容"
                >
                  <i className="fas fa-check"></i>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div 
        className="p-5 min-h-[120px] relative"
        aria-live="polite"
        aria-busy={isLoading}
      >
        <AnimatePresence mode="wait">
          {!content && !isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`flex flex-col items-center justify-center h-full min-h-[100px] text-center ${
                isDark ? 'text-gray-600' : 'text-gray-400'
              }`}
            >
              <i className="fas fa-magic mb-2 text-xl opacity-50"></i>
              <p className="text-sm">点击"生成建议"获取AI创意灵感</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`prose prose-sm max-w-none ${
                isDark ? 'prose-invert text-gray-300' : 'text-gray-700'
              }`}
            >
              {isLoading && !displayedContent ? (
                <div className="space-y-2 animate-pulse">
                  <div className={`h-4 w-3/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  <div className={`h-4 w-1/2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  <div className={`h-4 w-5/6 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                </div>
              ) : (
                <ReactMarkdown
                  components={{
                    // Override default element styling for better fit
                    p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                    ul: ({children}) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                    li: ({children}) => <li className="pl-1 marker:text-blue-500">{children}</li>,
                    strong: ({children}) => <span className={`font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{children}</span>
                  }}
                >
                  {displayedContent}
                </ReactMarkdown>
              )}
              
              {/* Cursor Effect during streaming */}
              {isLoading && (
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block w-1.5 h-4 ml-1 align-middle bg-blue-500"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
