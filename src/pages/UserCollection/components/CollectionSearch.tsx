import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Sparkles,
  Trash2,
} from 'lucide-react';

/**
 * 搜索建议项
 */
interface SearchSuggestion {
  id: string;
  text: string;
  type: 'history' | 'trending' | 'suggestion';
}

/**
 * 收藏搜索组件属性
 */
interface CollectionSearchProps {
  /** 当前搜索值 */
  value: string;
  /** 搜索值变化回调 */
  onChange: (value: string) => void;
  /** 搜索历史 */
  searchHistory: string[];
  /** 清除搜索历史 */
  onClearHistory: () => void;
  /** 移除某条搜索历史 */
  onRemoveHistoryItem: (item: string) => void;
  /** 是否正在搜索 */
  isSearching?: boolean;
  /** 搜索结果数量 */
  resultCount?: number;
  /** 占位符文本 */
  placeholder?: string;
}

/**
 * 收藏搜索组件
 * 提供实时搜索、搜索历史、搜索建议等功能
 */
export function CollectionSearch({
  value,
  onChange,
  searchHistory,
  onClearHistory,
  onRemoveHistoryItem,
  isSearching = false,
  resultCount,
  placeholder = '搜索收藏内容...',
}: CollectionSearchProps) {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭建议框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (e.target.value) {
      setShowSuggestions(true);
    }
  }, [onChange]);

  // 清除搜索
  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  // 选择搜索历史
  const handleSelectHistory = useCallback((item: string) => {
    onChange(item);
    setShowSuggestions(false);
    inputRef.current?.blur();
  }, [onChange]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  }, []);

  // 生成搜索建议
  const suggestions: SearchSuggestion[] = [
    // 历史记录
    ...searchHistory
      .filter((item) => item.toLowerCase().includes(value.toLowerCase()) && item !== value)
      .slice(0, 5)
      .map((item, index) => ({
        id: `history-${index}`,
        text: item,
        type: 'history' as const,
      })),
  ];

  const hasSuggestions = suggestions.length > 0;
  const shouldShowSuggestions = isFocused && (showSuggestions || hasSuggestions) && !value;

  return (
    <div ref={containerRef} className="relative w-64">
      {/* 搜索输入框 */}
      <div
        className={`
          relative flex items-center gap-3 px-4 py-3 rounded-xl
          border-2 transition-all duration-200
          ${isFocused
            ? isDark
              ? 'border-blue-500 bg-gray-800/80 shadow-lg shadow-blue-500/10'
              : 'border-blue-500 bg-white shadow-lg shadow-blue-500/10'
            : isDark
              ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }
        `}
      >
        {/* 搜索图标 */}
        <motion.div
          animate={isSearching ? { rotate: 360 } : { rotate: 0 }}
          transition={isSearching ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
        >
          <Search
            className={`w-5 h-5 transition-colors ${
              isFocused
                ? 'text-blue-500'
                : isDark
                  ? 'text-gray-400'
                  : 'text-gray-500'
            }`}
          />
        </motion.div>

        {/* 输入框 */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            flex-1 bg-transparent outline-none text-base
            placeholder:transition-colors
            ${isDark
              ? 'text-white placeholder:text-gray-500'
              : 'text-gray-900 placeholder:text-gray-400'
            }
          `}
        />

        {/* 清除按钮 */}
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              className={`
                p-1 rounded-full transition-colors
                ${isDark
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                }
              `}
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* 搜索结果计数 */}
        {value && resultCount !== undefined && !isSearching && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`
              text-xs px-2 py-1 rounded-full
              ${isDark
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-blue-100 text-blue-600'
              }
            `}
          >
            {resultCount} 个结果
          </motion.span>
        )}
      </div>

      {/* 搜索建议下拉框 */}
      <AnimatePresence>
        {shouldShowSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute top-full left-0 right-0 mt-2 py-2 rounded-xl
              border shadow-xl z-50 overflow-hidden
              ${isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
              }
            `}
          >
            {/* 搜索历史 */}
            {searchHistory.length > 0 && (
              <div className="px-3 pb-2">
                <div className="flex items-center justify-between px-2 py-2">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      搜索历史
                    </span>
                  </div>
                  <button
                    onClick={onClearHistory}
                    className={`
                      text-xs flex items-center gap-1 px-2 py-1 rounded-lg
                      transition-colors
                      ${isDark
                        ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                      }
                    `}
                  >
                    <Trash2 className="w-3 h-3" />
                    清除
                  </button>
                </div>

                <div className="space-y-1">
                  {searchHistory.slice(0, 5).map((item, index) => (
                    <motion.button
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelectHistory(item)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                        text-left text-sm transition-colors group
                        ${isDark
                          ? 'text-gray-300 hover:bg-gray-700/50'
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className="truncate">{item}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveHistoryItem(item);
                        }}
                        className={`
                          p-1 rounded-full opacity-0 group-hover:opacity-100
                          transition-all
                          ${isDark
                            ? 'hover:bg-gray-600 text-gray-500 hover:text-gray-300'
                            : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                          }
                        `}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* 空状态 */}
            {searchHistory.length === 0 && (
              <div className="px-4 py-6 text-center">
                <Sparkles className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  开始搜索您的收藏内容
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  支持搜索标题、描述、作者和标签
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CollectionSearch;
