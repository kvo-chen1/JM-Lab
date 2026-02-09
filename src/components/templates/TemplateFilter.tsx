import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

export type SortOption = 'popular' | 'newest' | 'mostUsed' | 'name';
export type ViewMode = 'grid' | 'list';

interface TemplateFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
  filteredCount: number;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'popular', label: '最受欢迎' },
  { value: 'newest', label: '最新发布' },
  { value: 'mostUsed', label: '使用最多' },
  { value: 'name', label: '名称排序' },
];

export const TemplateFilter: React.FC<TemplateFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  totalCount,
  filteredCount,
}) => {
  const { isDark } = useTheme();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);
  
  const clearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);
  
  return (
    <div className={`p-4 rounded-2xl mb-6 ${isDark ? 'bg-gray-800/50' : 'bg-white'} shadow-sm`}>
      {/* 顶部搜索和统计 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        {/* 搜索框 */}
        <div className="relative flex-1 max-w-md">
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
            isSearchFocused ? 'text-red-500' : isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="搜索模板..."
            className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm transition-all duration-200 ${
              isDark 
                ? 'bg-gray-700 text-white placeholder-gray-500 border-gray-600 focus:border-red-500' 
                : 'bg-gray-100 text-gray-900 placeholder-gray-400 border-transparent focus:border-red-500'
            } border-2 focus:outline-none focus:ring-0`}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* 统计和视图切换 */}
        <div className="flex items-center gap-4">
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            共 <span className="font-semibold text-red-500">{filteredCount}</span> 个模板
            {filteredCount !== totalCount && (
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}> / {totalCount}</span>
            )}
          </span>
          
          {/* 视图切换 */}
          <div className={`flex items-center p-1 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-red-500'
                  : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="网格视图"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-red-500'
                  : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="列表视图"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* 分类筛选 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-sm mr-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>分类：</span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCategoryChange('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === 'all'
                ? 'bg-red-500 text-white shadow-md'
                : isDark 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => onCategoryChange(category)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-red-500 text-white shadow-md'
                  : isDark 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>
        
        {/* 排序下拉框 */}
        <div className="ml-auto">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 appearance-none cursor-pointer ${
              isDark 
                ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
            } border-2 focus:outline-none focus:border-red-500`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${isDark ? '%239CA3AF' : '%236B7280'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1rem',
              paddingRight: '2.5rem',
            }}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default TemplateFilter;
