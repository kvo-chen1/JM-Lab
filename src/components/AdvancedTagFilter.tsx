import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdvancedTagFilterProps {
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClose: () => void;
  onClear: () => void;
  className?: string;
}

export default function AdvancedTagFilter({
  allTags,
  selectedTags,
  onToggleTag,
  onClose,
  onClear,
  className = ''
}: AdvancedTagFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // 模拟 AI 推荐标签
  // 在实际应用中，这应该来自后端 API，基于用户的浏览历史或当前热门趋势
  const aiRecommendations = useMemo(() => {
    return {
      matched: selectedTags.filter(t => ['老字号品牌', '国潮设计', '非遗传承'].includes(t)),
      new: ['数字非遗', '文化创意', '传统工艺'].filter(t => !selectedTags.includes(t))
    };
  }, [selectedTags]);

  // 根据搜索词过滤标签
  const filteredTags = useMemo(() => {
    if (!searchQuery) return allTags;
    return allTags.filter(tag => 
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allTags, searchQuery]);

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 ${className}`}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg text-gray-800 dark:text-white">标签筛选</h3>
        <button 
          onClick={onClose} 
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
        >
          收起标签 <i className="fas fa-chevron-up"></i>
        </button>
      </div>

      {/* 搜索框 */}
      <div className="relative mb-6">
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <input
          type="text"
          placeholder="搜索标签..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
        />
      </div>

      <div className="space-y-6">
        {/* 热门标签 */}
        <div>
          <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            热门标签
          </h4>
          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 8).map(tag => (
              <TagButton 
                key={tag} 
                tag={tag} 
                selected={selectedTags.includes(tag)} 
                onClick={() => onToggleTag(tag)} 
                showStar
              />
            ))}
          </div>
        </div>

        {/* AI 标签推荐 */}
        <div>
           <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-3">AI标签推荐</h4>
           <div className="space-y-3">
             {aiRecommendations.matched.length > 0 && (
               <div className="flex flex-wrap gap-2 items-center">
                 <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">命中已有标签</span>
                 {aiRecommendations.matched.map(tag => (
                   <span key={tag} className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800 rounded-full text-xs font-medium">
                     {tag}
                   </span>
                 ))}
               </div>
             )}
             <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">推荐新标签</span>
                {aiRecommendations.new.map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => onToggleTag(tag)}
                    className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800 rounded-full text-xs font-medium hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
             </div>
           </div>
        </div>

        {/* 所有标签 */}
        <div>
          <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-3">所有标签</h4>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
            {filteredTags.map(tag => (
               <TagButton 
                key={tag} 
                tag={tag} 
                selected={selectedTags.includes(tag)} 
                onClick={() => onToggleTag(tag)} 
                showStar
              />
            ))}
            {filteredTags.length === 0 && (
              <div className="text-sm text-gray-500 py-2">未找到匹配的标签</div>
            )}
          </div>
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
        <button 
          onClick={onClear} 
          className="px-5 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
        >
          清空
        </button>
        <button 
          onClick={onClose} 
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 text-sm font-bold"
        >
          完成
        </button>
      </div>
    </motion.div>
  );
}

function TagButton({ tag, selected, onClick, showStar }: { tag: string, selected: boolean, onClick: () => void, showStar?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1 border ${
        selected
          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      {tag}
      {showStar && <i className={`far fa-star text-xs ml-1 ${selected ? 'text-white/70' : 'text-gray-400'}`}></i>}
    </button>
  );
}
