import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'history' | 'hot' | 'suggestion';
  count?: number;
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  loading?: boolean;
  showHistory?: boolean;
  searchHistory?: string[];
  onClearHistory?: () => void;
  onSelectSuggestion?: (suggestion: string) => void;
  className?: string;
  autoFocus?: boolean;
}

/**
 * 增强型搜索输入组件
 * 支持自动补全、搜索历史、热门搜索建议
 */
export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = '搜索...',
  suggestions = [],
  loading = false,
  showHistory = true,
  searchHistory = [],
  onClearHistory,
  onSelectSuggestion,
  className = '',
  autoFocus = false
}: SearchInputProps) {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowDropdown(true);
  }, [onChange]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    if (onSearch && value.trim()) {
      onSearch(value.trim());
    }
    setShowDropdown(false);
  }, [onSearch, value]);

  // 处理按键
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  }, [handleSearch]);

  // 清除搜索
  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  // 选择建议
  const handleSelectSuggestion = useCallback((suggestionText: string) => {
    onChange(suggestionText);
    if (onSelectSuggestion) {
      onSelectSuggestion(suggestionText);
    }
    setShowDropdown(false);
    onSearch?.(suggestionText);
  }, [onChange, onSelectSuggestion, onSearch]);

  // 高亮匹配文本
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          className={`
            px-0.5 rounded
            ${isDark ? 'bg-yellow-500/30 text-yellow-200' : 'bg-yellow-200 text-yellow-900'}
          `}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // 过滤建议
  const filteredSuggestions = suggestions.filter(s =>
    s.text.toLowerCase().includes(value.toLowerCase())
  );

  // 是否有内容显示
  const hasContent = showHistory && searchHistory.length > 0 || filteredSuggestions.length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 搜索输入框 */}
      <div
        className={`
          relative flex items-center rounded-2xl overflow-hidden transition-all duration-200
          ${isFocused
            ? isDark
              ? 'border-indigo-500/50 ring-2 ring-indigo-500/20'
              : 'border-indigo-300 ring-2 ring-indigo-100'
            : ''
          }
          ${isDark
            ? 'bg-slate-800/50 border border-slate-700/50'
            : 'bg-white border border-gray-200'
          }
        `}
      >
        <Search
          size={20}
          className={`
            absolute left-4 transition-colors
            ${isFocused
              ? isDark ? 'text-indigo-400' : 'text-indigo-500'
              : isDark ? 'text-slate-400' : 'text-gray-400'
            }
          `}
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            setShowDropdown(true);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`
            w-full pl-12 pr-12 py-4 bg-transparent outline-none text-base
            ${isDark ? 'text-white placeholder-slate-500' : 'text-gray-900 placeholder-gray-400'}
          `}
        />
        <div className="absolute right-3 flex items-center gap-1">
          {loading && (
            <Loader2 size={18} className="animate-spin text-indigo-500" />
          )}
          {value && !loading && (
            <button
              onClick={handleClear}
              className={`
                p-1.5 rounded-full transition-colors
                ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-400'}
              `}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 下拉建议框 */}
      <AnimatePresence>
        {showDropdown && hasContent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50
              shadow-xl border
              ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}
            `}
          >
            {/* 搜索历史 */}
            {showHistory && searchHistory.length > 0 && !value && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    搜索历史
                  </span>
                  {onClearHistory && (
                    <button
                      onClick={onClearHistory}
                      className={`
                        text-xs transition-colors
                        ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}
                      `}
                    >
                      清除
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectSuggestion(term)}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5
                        ${isDark
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      <Clock size={12} />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 建议列表 */}
            {filteredSuggestions.length > 0 && (
              <div className={searchHistory.length > 0 && !value ? 'border-t ' + (isDark ? 'border-slate-700' : 'border-gray-100') : ''}>
                {filteredSuggestions.some(s => s.type === 'hot') && (
                  <div className="px-3 py-2">
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      热门搜索
                    </span>
                  </div>
                )}
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSelectSuggestion(suggestion.text)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                      ${index !== filteredSuggestions.length - 1 ? (isDark ? 'border-b border-slate-700/50' : 'border-b border-gray-100') : ''}
                      ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}
                    `}
                  >
                    {suggestion.type === 'history' && <Clock size={16} className={isDark ? 'text-slate-400' : 'text-gray-400'} />}
                    {suggestion.type === 'hot' && <TrendingUp size={16} className="text-orange-500" />}
                    {suggestion.type === 'suggestion' && <Search size={16} className={isDark ? 'text-slate-400' : 'text-gray-400'} />}
                    <span className={`flex-1 text-sm ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                      {highlightMatch(suggestion.text, value)}
                    </span>
                    {suggestion.count && (
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        {suggestion.count} 次搜索
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SearchInput;
