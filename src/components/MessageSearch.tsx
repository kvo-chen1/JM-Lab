import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Search, X, ChevronUp, ChevronDown, MessageSquare } from 'lucide-react';
import { Message } from '@/services/llmService';

interface MessageSearchProps {
  messages: Message[];
  onNavigateToMessage?: (index: number) => void;
  className?: string;
}

export const MessageSearch: React.FC<MessageSearchProps> = ({
  messages,
  onNavigateToMessage,
  className = ''
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 搜索消息
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const indices: number[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    messages.forEach((message, index) => {
      if (message.content.toLowerCase().includes(lowerQuery)) {
        indices.push(index);
      }
    });

    setResults(indices);
    setCurrentIndex(indices.length > 0 ? 0 : -1);
  }, [messages]);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // 打开搜索时聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F 打开搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsOpen(true);
      }
      // ESC 关闭搜索
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 导航到结果
  const navigateToResult = (direction: 'prev' | 'next') => {
    if (results.length === 0) return;

    let newIndex: number;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % results.length;
    } else {
      newIndex = (currentIndex - 1 + results.length) % results.length;
    }

    setCurrentIndex(newIndex);
    if (onNavigateToMessage) {
      onNavigateToMessage(results[newIndex]);
    }
  };

  // 高亮匹配文本
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-600/50 text-inherit rounded px-0.5">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* 搜索按钮 */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors ${
          isOpen
            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
            : isDark
            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="搜索消息 (Ctrl+F)"
      >
        <Search className="w-4 h-4" />
      </motion.button>

      {/* 搜索面板 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl border overflow-hidden z-50 ${
              isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            {/* 搜索输入 */}
            <div className={`p-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="搜索消息..."
                    className={`w-full pl-9 pr-8 py-2 rounded-lg text-sm outline-none transition-colors ${
                      isDark
                        ? 'bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:border-indigo-500'
                        : 'bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-indigo-500'
                    }`}
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full ${
                        isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`p-2 rounded-lg ${
                    isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 导航控制 */}
              {results.length > 0 && (
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {currentIndex + 1} / {results.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigateToResult('prev')}
                      className={`p-1 rounded ${
                        isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigateToResult('next')}
                      className={`p-1 rounded ${
                        isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 搜索结果 */}
            <div className={`max-h-64 overflow-y-auto ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
              {query.trim() ? (
                results.length > 0 ? (
                  results.map((messageIndex, idx) => {
                    const message = messages[messageIndex];
                    const isSelected = idx === currentIndex;
                    return (
                      <motion.button
                        key={messageIndex}
                        onClick={() => {
                          setCurrentIndex(idx);
                          if (onNavigateToMessage) {
                            onNavigateToMessage(messageIndex);
                          }
                        }}
                        className={`w-full px-4 py-3 text-left border-b last:border-b-0 transition-colors ${
                          isDark
                            ? isSelected
                              ? 'bg-indigo-900/30 border-gray-700'
                              : 'border-gray-700/50 hover:bg-gray-800'
                            : isSelected
                            ? 'bg-indigo-50 border-gray-100'
                            : 'border-gray-100 hover:bg-gray-50'
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className={`w-3 h-3 ${
                            message.role === 'user'
                              ? 'text-blue-500'
                              : 'text-indigo-500'
                          }`} />
                          <span className={`text-[10px] uppercase ${
                            message.role === 'user'
                              ? 'text-blue-500'
                              : 'text-indigo-500'
                          }`}>
                            {message.role === 'user' ? '我' : 'AI'}
                          </span>
                        </div>
                        <p className={`text-sm line-clamp-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {highlightMatch(message.content.slice(0, 100) + (message.content.length > 100 ? '...' : ''), query)}
                        </p>
                      </motion.button>
                    );
                  })
                ) : (
                  <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">未找到匹配的消息</p>
                  </div>
                )
              ) : (
                <div className={`text-center py-6 px-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <p className="text-xs">输入关键词搜索历史消息</p>
                  <p className="text-[10px] mt-1">支持搜索消息内容</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageSearch;
