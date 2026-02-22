import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import AIActionSuggestions from './AIActionSuggestions';

interface Suggestion {
  id: string;
  text: string;
  type: 'history' | 'template' | 'popular' | 'ai';
  icon?: string;
}

interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onNavigate?: (path: string) => void; // 新增导航回调
  placeholder?: string;
  className?: string;
}

// 预设的快捷指令和热门提示词
const QUICK_COMMANDS: Suggestion[] = [
  { id: 'cmd-1', text: '/生成图片 ', type: 'template', icon: '🎨' },
  { id: 'cmd-2', text: '/生成视频 ', type: 'template', icon: '🎬' },
  { id: 'cmd-3', text: '/文化推荐 ', type: 'template', icon: '🏛️' },
  { id: 'cmd-4', text: '/作品点评 ', type: 'template', icon: '✨' },
  { id: 'cmd-5', text: '/创意灵感 ', type: 'template', icon: '💡' },
  { id: 'cmd-6', text: '/导航到 ', type: 'template', icon: '🧭' },
];

const POPULAR_PROMPTS: Suggestion[] = [
  { id: 'pop-1', text: '帮我设计一个融合杨柳青年画元素的文创产品', type: 'popular', icon: '🔥' },
  { id: 'pop-2', text: '推荐适合春节主题的文化元素', type: 'popular', icon: '🔥' },
  { id: 'pop-3', text: '生成一张天津五大道的插画', type: 'popular', icon: '🔥' },
  { id: 'pop-4', text: '介绍一下泥人张的历史', type: 'popular', icon: '🔥' },
  { id: 'pop-5', text: '如何正确使用非遗元素进行设计', type: 'popular', icon: '🔥' },
];

export const SmartInput: React.FC<SmartInputProps> = ({
  value,
  onChange,
  onSubmit,
  onNavigate,
  placeholder = '输入消息...',
  className = ''
}) => {
  const { isDark } = useTheme();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 更新下拉框位置
  const updateDropdownPosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownStyle({
        width: rect.width,
        left: rect.left,
        bottom: window.innerHeight - rect.top + 8
      });
    }
  }, []);

  // 显示建议时更新位置
  useEffect(() => {
    if (showSuggestions) {
      updateDropdownPosition();
    }
  }, [showSuggestions, updateDropdownPosition]);

  // 从localStorage加载输入历史
  const getInputHistory = useCallback((): Suggestion[] => {
    try {
      const history = localStorage.getItem('ai_input_history');
      if (history) {
        const items = JSON.parse(history) as string[];
        return items.slice(0, 5).map((text, index) => ({
          id: `hist-${index}`,
          text,
          type: 'history' as const,
          icon: '🕐'
        }));
      }
    } catch {
      // 忽略解析错误
    }
    return [];
  }, []);

  // 保存输入到历史
  const saveToHistory = useCallback((text: string) => {
    if (!text.trim()) return;
    try {
      const history = localStorage.getItem('ai_input_history');
      let items: string[] = history ? JSON.parse(history) : [];
      // 去重并添加到开头
      items = [text, ...items.filter(item => item !== text)].slice(0, 20);
      localStorage.setItem('ai_input_history', JSON.stringify(items));
    } catch {
      // 忽略存储错误
    }
  }, []);

  // 生成建议
  useEffect(() => {
    if (!value.trim()) {
      // 当输入为空时，显示历史记录和快捷指令
      const history = getInputHistory();
      setSuggestions([...QUICK_COMMANDS, ...history]);
      return;
    }

    // 检测是否输入了 /
    if (value === '/') {
      setSuggestions(QUICK_COMMANDS);
      return;
    }

    // 根据输入内容过滤建议
    const allSuggestions = [...QUICK_COMMANDS, ...POPULAR_PROMPTS, ...getInputHistory()];
    const filtered = allSuggestions.filter(s => 
      s.text.toLowerCase().includes(value.toLowerCase()) && s.text !== value
    );
    setSuggestions(filtered.slice(0, 6));
  }, [value, getInputHistory]);

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveToHistory(value);
        onSubmit();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        const selected = suggestions[selectedIndex];
        if (selected) {
          onChange(selected.text);
          setShowSuggestions(false);
          // 如果是快捷指令，自动提交
          if (selected.type === 'template') {
            setTimeout(() => {
              saveToHistory(selected.text);
              onSubmit();
            }, 100);
          }
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.text);
    setShowSuggestions(false);
    inputRef.current?.focus();
    
    // 如果是快捷指令，自动提交
    if (suggestion.type === 'template') {
      setTimeout(() => {
        saveToHistory(suggestion.text);
        onSubmit();
      }, 100);
    }
  };

  const getSuggestionStyle = (type: Suggestion['type']) => {
    switch (type) {
      case 'template':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'popular':
        return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'history':
        return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'ai':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return '';
    }
  };

  const getTypeLabel = (type: Suggestion['type']) => {
    switch (type) {
      case 'template': return '快捷指令';
      case 'popular': return '热门';
      case 'history': return '历史';
      case 'ai': return 'AI建议';
      default: return '';
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
          setSelectedIndex(0);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-4 py-3 pr-12 rounded-xl border-2 outline-none transition-all duration-200 ${
          isDark
            ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500'
            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
        }`}
      />
      
      {/* 输入提示按钮 */}
      <button
        onClick={() => setShowSuggestions(!showSuggestions)}
        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
          isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>

      {/* 建议下拉框 */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`fixed rounded-xl shadow-2xl border overflow-hidden z-[9999] max-h-80 overflow-y-auto ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
            style={{
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              ...dropdownStyle
            }}
          >
            {/* 快捷操作建议 */}
            {value.trim() && (
              <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                <AIActionSuggestions
                  input={value}
                  onSuggestionClick={(suggestion) => {
                    onChange(`${value} ${suggestion.title}`);
                    setShowSuggestions(false);
                  }}
                  onNavigate={onNavigate}
                />
              </div>
            )}
            
            {/* 原有建议列表 */}
            {suggestions.length > 0 && (
              <>
                <div className={`px-3 py-2 text-xs font-medium ${
                  isDark ? 'text-gray-400 bg-gray-800/50' : 'text-gray-500 bg-gray-50'
                }`}>
                  {value.trim() ? '建议' : '快捷指令 & 历史记录'}
                </div>
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={suggestion.id}
                    onClick={() => handleSelect(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                      index === selectedIndex
                        ? isDark ? 'bg-gray-700' : 'bg-gray-50'
                        : ''
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    <span className="text-lg">{suggestion.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {suggestion.text}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${getSuggestionStyle(suggestion.type)}`}>
                      {getTypeLabel(suggestion.type)}
                    </span>
                  </motion.button>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartInput;
