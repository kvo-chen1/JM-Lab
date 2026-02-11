import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

export interface TemplateCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  count?: number;
  color?: string;
}

interface TemplateSidebarProps {
  categories: TemplateCategory[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  totalCount?: number;
}

// 分类图标映射
const categoryIcons: Record<string, React.ReactNode> = {
  'business': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  'marketing': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  'social': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
    </svg>
  ),
  'product': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  'news': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
  'sales': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  'ecommerce': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  'hr': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  'event': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  'education': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  'brand': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  'crowdfunding': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// 默认分类数据
export const defaultCategories: TemplateCategory[] = [
  { id: 'all', name: '全部模板', icon: categoryIcons['business'], count: 16 },
  { id: 'business', name: '商业文档', icon: categoryIcons['business'], count: 3, color: '#3b82f6' },
  { id: 'marketing', name: '营销推广', icon: categoryIcons['marketing'], count: 2, color: '#f59e0b' },
  { id: 'social', name: '社交媒体', icon: categoryIcons['social'], count: 2, color: '#8b5cf6' },
  { id: 'product', name: '产品文档', icon: categoryIcons['product'], count: 2, color: '#10b981' },
  { id: 'news', name: '新闻媒体', icon: categoryIcons['news'], count: 1, color: '#6366f1' },
  { id: 'sales', name: '销售话术', icon: categoryIcons['sales'], count: 1, color: '#ec4899' },
  { id: 'ecommerce', name: '电商运营', icon: categoryIcons['ecommerce'], count: 1, color: '#f97316' },
  { id: 'hr', name: '人力资源', icon: categoryIcons['hr'], count: 1, color: '#14b8a6' },
  { id: 'event', name: '活动策划', icon: categoryIcons['event'], count: 1, color: '#ef4444' },
  { id: 'education', name: '培训教育', icon: categoryIcons['education'], count: 1, color: '#06b6d4' },
  { id: 'brand', name: '品牌建设', icon: categoryIcons['brand'], count: 1, color: '#84cc16' },
  { id: 'crowdfunding', name: '众筹融资', icon: categoryIcons['crowdfunding'], count: 1, color: '#a855f7' },
];

export const TemplateSidebar: React.FC<TemplateSidebarProps> = ({
  categories = defaultCategories,
  activeCategory,
  onCategoryChange,
  totalCount,
}) => {
  const { isDark } = useTheme();
  const [favoritesOpen, setFavoritesOpen] = useState(false);

  const displayCount = totalCount || categories.find(c => c.id === 'all')?.count || 0;

  return (
    <div className="h-full flex flex-col">
      {/* 顶部标题区 */}
      <div className={`px-6 py-5 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              模板分类
            </h2>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              共 <span className="font-medium text-blue-600">{displayCount}</span> 个模板
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 分类列表 */}
      <div className="flex-1 overflow-y-auto py-3 px-3">
        <nav className="space-y-1">
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            const hasColor = category.color && category.id !== 'all';

            return (
              <motion.button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                  isActive
                    ? hasColor
                      ? 'text-white shadow-md'
                      : isDark
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : isDark
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: isActive && hasColor ? category.color : undefined,
                }}
              >
                {/* 图标 */}
                <span
                  className={`flex-shrink-0 transition-colors duration-200 ${
                    isActive ? 'text-white' : hasColor ? '' : isDark ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                  style={{ color: !isActive && hasColor ? category.color : undefined }}
                >
                  {category.icon}
                </span>

                {/* 名称 */}
                <span className="flex-1 font-medium text-sm truncate">{category.name}</span>

                {/* 数量 */}
                {category.count !== undefined && (
                  <span
                    className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full transition-colors duration-200 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isDark
                        ? 'bg-gray-800 text-gray-500'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {category.count}
                  </span>
                )}

                {/* 选中指示器 */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* 底部快捷操作 */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        {/* 我的收藏 */}
        <button
          onClick={() => setFavoritesOpen(!favoritesOpen)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
            isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-50 text-gray-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-medium text-sm">我的收藏</span>
          </div>
          <motion.svg
            animate={{ rotate: favoritesOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>

        <AnimatePresence>
          {favoritesOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className={`pt-2 px-3 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                暂无收藏的模板
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 历史记录 */}
        <button
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mt-1 transition-all duration-200 ${
            isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-50 text-gray-600'
          }`}
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-sm">历史记录</span>
        </button>
      </div>
    </div>
  );
};

export default TemplateSidebar;
