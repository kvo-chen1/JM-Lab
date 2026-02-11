import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TagSelectorProps {
  tags: string[];
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
  onAddCustomTag: () => void;
  customTagInput: string;
  onCustomTagChange: (value: string) => void;
  showCustomTagInput: boolean;
  onToggleCustomTagInput: () => void;
}

const TagSelector = memo(function TagSelector({
  tags,
  selectedTags,
  onTagSelect,
  onAddCustomTag,
  customTagInput,
  onCustomTagChange,
  showCustomTagInput,
  onToggleCustomTagInput
}: TagSelectorProps) {
  return (
    <div className="flex gap-3 px-4 sm:px-6 pb-2 sm:pb-3 mt-3 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory">
      {/* 现有标签 */}
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        return (
          <motion.button
            key={tag}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onTagSelect(tag)}
            className={`text-xs sm:text-sm px-3 sm:px-4 py-2 min-w-max rounded-full border transition-all ${isSelected
              ? 'bg-white text-black border-white shadow-lg'
              : 'bg-transparent text-white/70 border-white/20 hover:bg-white/10'
            }`}
            style={{
              touchAction: 'manipulation',
              minHeight: '36px',
              scrollSnapAlign: 'start',
              opacity: 1,
              willChange: 'transform',
              transform: 'none',
              transformOrigin: '50% 50% 0px'
            }}
            tabIndex={0}
          >
            {tag}
          </motion.button>
        );
      })}

      {/* 添加自定义标签按钮 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleCustomTagInput}
        className="text-xs sm:text-sm px-3 sm:px-4 py-2 min-w-max rounded-full border transition-all bg-transparent text-white/70 border-dashed border-white/30 hover:bg-white/10"
        style={{
          touchAction: 'manipulation',
          minHeight: '36px',
          scrollSnapAlign: 'start',
          opacity: 1,
          willChange: 'transform',
          transform: 'none',
          transformOrigin: '50% 50% 0px'
        }}
        tabIndex={0}
      >
        <i className="fas fa-plus mr-1"></i>自定义
      </motion.button>
      
      {/* 自定义标签输入框 */}
      <AnimatePresence>
        {showCustomTagInput && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-1"
            style={{
              scrollSnapAlign: 'start'
            }}
          >
            <input
              type="text"
              placeholder="输入标签"
              value={customTagInput}
              onChange={(e) => onCustomTagChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onAddCustomTag();
                }
              }}
              className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-full border border-white/30 bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
              style={{
                minHeight: '36px'
              }}
              autoFocus
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onAddCustomTag}
              className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              style={{
                minHeight: '36px',
                minWidth: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              tabIndex={0}
            >
              <i className="fas fa-check text-xs"></i>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 已选标签显示 */}
      {selectedTags.length > 0 && (
        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs text-white/50 whitespace-nowrap">已选:</span>
          <div className="flex gap-1">
            {selectedTags.slice(0, 3).map((tag) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-xs px-2 py-1 rounded-full bg-blue-400/20 text-blue-300 border border-blue-400/30"
              >
                {tag}
              </motion.span>
            ))}
            {selectedTags.length > 3 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-xs px-2 py-1 rounded-full bg-gray-400/20 text-gray-300 border border-gray-400/30"
              >
                +{selectedTags.length - 3}
              </motion.span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default TagSelector;
