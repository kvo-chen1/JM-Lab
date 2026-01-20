import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../../hooks/useCreateStore';
import tianjinCultureService from '@/services/tianjinCultureService';
import { KnowledgeItem, KNOWLEDGE_CATEGORIES } from '@/services/tianjinCultureService';

const CulturalTracePanel: React.FC = () => {
  const { isDark } = useTheme();
  const { culturalInfoText, updateState } = useCreateStore();
  const [selectedCategory, setSelectedCategory] = useState<string>(KNOWLEDGE_CATEGORIES[0]);
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 获取文化知识列表
  const knowledgeItems = tianjinCultureService.getKnowledgeByCategory(selectedCategory);
  
  // 搜索功能
  const filteredItems = searchQuery
    ? tianjinCultureService.searchKnowledge(searchQuery)
    : knowledgeItems;

  // 处理知识项选择
  const handleKnowledgeSelect = (knowledge: KnowledgeItem) => {
    setSelectedKnowledge(knowledge);
    updateState({ culturalInfoText: knowledge.content });
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">文化溯源</h3>
        <p className="text-xs opacity-70 mb-3">了解文化元素的历史背景和文化内涵</p>
        
        {/* 搜索框 */}
        <div className={`relative mb-3`}>
          <input
            type="text"
            placeholder="搜索文化知识..."
            className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-[#C02C38]/30`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-50"></i>
        </div>
        
        {/* 分类选择 */}
        <div className="flex overflow-x-auto space-x-2 mb-3 pb-2 scrollbar-hide scroll-smooth snap-x snap-mandatory">
          {KNOWLEDGE_CATEGORIES.map((category) => (
            <motion.button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setSearchQuery('');
              }}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all duration-200 ease-in-out snap-center ${isDark 
                ? selectedCategory === category 
                  ? 'bg-[#C02C38]/20 text-[#C02C38] shadow-md' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300' 
                : selectedCategory === category 
                  ? 'bg-[#C02C38]/10 text-[#C02C38] shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              tabIndex={0}
              role="tab"
              aria-selected={selectedCategory === category}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4">
        {/* 知识列表 */}
        <div className={`flex-1 overflow-y-auto rounded-lg border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} p-3`}>
          <h4 className="text-sm font-medium mb-2">相关知识</h4>
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                onClick={() => handleKnowledgeSelect(item)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${isDark 
                  ? selectedKnowledge?.id === item.id 
                    ? 'bg-[#C02C38]/10 border-l-4 border-[#C02C38]' 
                    : 'bg-gray-800 hover:bg-gray-700' 
                  : selectedKnowledge?.id === item.id 
                    ? 'bg-[#C02C38]/10 border-l-4 border-[#C02C38]' 
                    : 'bg-gray-50 hover:bg-gray-100'}`}
                whileHover={{ x: 4 }}
              >
                <h5 className="text-sm font-medium">{item.title}</h5>
                <p className="text-xs opacity-70 mt-1 line-clamp-2">{item.content}</p>
              </motion.div>
            ))}
            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-xs opacity-50">
                <i className="fas fa-book-open text-2xl mb-2 block"></i>
                暂无相关知识
              </div>
            )}
          </div>
        </div>

        {/* 知识详情 */}
        <div className={`flex-1 overflow-y-auto rounded-lg border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} p-3`}>
          <h4 className="text-sm font-medium mb-2">详细信息</h4>
          {selectedKnowledge ? (
            <div className="space-y-3">
              <h5 className="text-base font-semibold">{selectedKnowledge.title}</h5>
              <div className="flex items-center text-xs opacity-70 space-x-2 mb-2">
                <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800">{selectedKnowledge.category}</span>
                <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800">{selectedKnowledge.subcategory}</span>
              </div>
              {selectedKnowledge.imageUrl && (
                <div className="w-full rounded-lg overflow-hidden mb-3">
                  <img
                    src={selectedKnowledge.imageUrl}
                    alt={selectedKnowledge.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}
              <div className="text-sm leading-relaxed whitespace-pre-line">{selectedKnowledge.content}</div>
              {selectedKnowledge.relatedItems && selectedKnowledge.relatedItems.length > 0 && (
                <div className="mt-3">
                  <h6 className="text-xs font-medium mb-2">相关内容</h6>
                  <div className="flex flex-wrap gap-2">
                    {selectedKnowledge.relatedItems.map((relatedId) => {
                      const relatedItem = tianjinCultureService.getKnowledgeById(relatedId);
                      return relatedItem ? (
                        <motion.button
                          key={relatedId}
                          onClick={() => handleKnowledgeSelect(relatedItem)}
                          className={`px-2 py-1 text-xs rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                          whileTap={{ scale: 0.95 }}
                        >
                          {relatedItem.title}
                        </motion.button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-xs opacity-50">
              <i className="fas fa-info-circle text-2xl mb-2 block"></i>
              选择一个文化知识项查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CulturalTracePanel;