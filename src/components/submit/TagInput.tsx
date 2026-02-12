import React, { useState, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hash, Plus } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
  maxTagLength?: number;
  placeholder?: string;
  disabled?: boolean;
}

const popularTags = [
  '国潮设计', '纹样设计', '品牌设计', '非遗传承', '插画设计',
  '工艺创新', '老字号品牌', 'IP设计', '包装设计', '字体设计',
  '海报设计', 'UI设计', '产品设计', '空间设计', '摄影'
];

export function TagInput({
  tags,
  onTagsChange,
  maxTags = 10,
  maxTagLength = 20,
  placeholder = '输入标签后按回车添加',
  disabled = false
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= maxTagLength) {
      setInputValue(value);
      setShowSuggestions(value.length > 0);
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;

    if (tags.length >= maxTags) {
      return;
    }

    if (tags.includes(trimmedTag)) {
      return;
    }

    onTagsChange([...tags, trimmedTag]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const filteredSuggestions = popularTags.filter(
    tag =>
      tag.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(tag)
  );

  return (
    <div className="space-y-3">
      {/* 输入框 */}
      <div
        className={`
          flex flex-wrap items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200
          ${isFocused
            ? 'border-red-500 shadow-lg shadow-red-500/10 bg-white dark:bg-gray-800'
            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />

        {/* 已选标签 */}
        <AnimatePresence mode="popLayout">
          {tags.map((tag, index) => (
            <motion.span
              key={tag}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 text-red-700 dark:text-red-300 text-sm rounded-lg border border-red-200 dark:border-red-800"
            >
              <span>{tag}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  className="p-0.5 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.span>
          ))}
        </AnimatePresence>

        {/* 输入框 */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(inputValue.length > 0);
          }}
          onBlur={() => {
            setIsFocused(false);
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          disabled={disabled || tags.length >= maxTags}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 disabled:cursor-not-allowed"
        />

        {/* 添加按钮 */}
        {inputValue.trim() && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            type="button"
            onClick={() => addTag(inputValue)}
            disabled={disabled}
            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* 字数统计 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{tags.length}/{maxTags} 个标签</span>
        {inputValue.length > 0 && (
          <span className={inputValue.length >= maxTagLength ? 'text-red-500' : ''}>
            {inputValue.length}/{maxTagLength}
          </span>
        )}
      </div>

      {/* 建议标签 */}
      <AnimatePresence>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg"
          >
            <p className="text-xs text-gray-500 mb-2">推荐标签：</p>
            <div className="flex flex-wrap gap-2">
              {filteredSuggestions.slice(0, 8).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 热门标签 */}
      {!showSuggestions && tags.length === 0 && (
        <div className="pt-2">
          <p className="text-xs text-gray-500 mb-2">热门标签：</p>
          <div className="flex flex-wrap gap-2">
            {popularTags.slice(0, 8).map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                disabled={disabled || tags.length >= maxTags}
                className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TagInput;
