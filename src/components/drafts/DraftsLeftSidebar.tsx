import { motion } from 'framer-motion';
import {
  Layers,
  LayoutGrid,
  Search,
  Box,
  Grid3X3,
  FileText,
  Star,
  Clock,
  Calendar,
  Filter,
  ChevronRight,
  Bookmark,
  Hash,
  Trophy,
  Wand2
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  count: number;
  color: string;
  gradient: string;
}

interface DraftsLeftSidebarProps {
  isDark: boolean;
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  activeTimeFilter: string;
  onTimeFilterChange: (filter: string) => void;
  draftCounts: {
    all: number;
    layout: number;
    trace: number;
    mockup: number;
    tile: number;
    aiWriter: number;
    brandWizard?: number;
    eventSubmission?: number;
    favorites: number;
  };
  popularTags: string[];
  onTagClick?: (tag: string) => void;
}

export default function DraftsLeftSidebar({
  isDark,
  activeCategory,
  onCategoryChange,
  activeTimeFilter,
  onTimeFilterChange,
  draftCounts,
  popularTags,
  onTagClick
}: DraftsLeftSidebarProps) {
  const categories: Category[] = [
    {
      id: 'all',
      name: '全部草稿',
      icon: Layers,
      count: draftCounts.all,
      color: 'from-gray-500 to-gray-600',
      gradient: 'bg-gradient-to-r from-gray-500 to-gray-600'
    },
    {
      id: 'favorites',
      name: '我的收藏',
      icon: Star,
      count: draftCounts.favorites,
      color: 'from-yellow-400 to-orange-500',
      gradient: 'bg-gradient-to-r from-yellow-400 to-orange-500'
    },
    {
      id: 'layout',
      name: '版式设计',
      icon: LayoutGrid,
      count: draftCounts.layout,
      color: 'from-blue-500 to-blue-600',
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      id: 'trace',
      name: '文化溯源',
      icon: Search,
      count: draftCounts.trace,
      color: 'from-purple-500 to-purple-600',
      gradient: 'bg-gradient-to-r from-purple-500 to-purple-600'
    },
    {
      id: 'mockup',
      name: '模型预览',
      icon: Box,
      count: draftCounts.mockup,
      color: 'from-cyan-500 to-cyan-600',
      gradient: 'bg-gradient-to-r from-cyan-500 to-cyan-600'
    },
    {
      id: 'tile',
      name: '图案平铺',
      icon: Grid3X3,
      count: draftCounts.tile,
      color: 'from-pink-500 to-pink-600',
      gradient: 'bg-gradient-to-r from-pink-500 to-pink-600'
    },
    {
      id: 'aiWriter',
      name: 'AI写作',
      icon: FileText,
      count: draftCounts.aiWriter,
      color: 'from-emerald-500 to-emerald-600',
      gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600'
    },
    {
      id: 'brandWizard',
      name: '品牌向导',
      icon: Wand2,
      count: draftCounts.brandWizard || 0,
      color: 'from-indigo-500 to-indigo-600',
      gradient: 'bg-gradient-to-r from-indigo-500 to-indigo-600'
    },
    {
      id: 'eventSubmission',
      name: '活动作品',
      icon: Trophy,
      count: draftCounts.eventSubmission || 0,
      color: 'from-red-500 to-orange-500',
      gradient: 'bg-gradient-to-r from-red-500 to-orange-500'
    }
  ];

  const timeFilters = [
    { id: 'all', name: '全部时间', icon: Calendar },
    { id: 'today', name: '今天', icon: Clock },
    { id: 'week', name: '本周', icon: Calendar },
    { id: 'month', name: '本月', icon: Calendar }
  ];

  return (
    <div className="space-y-6">
      {/* Logo/标题区域 */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
          <Bookmark className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">草稿箱</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">管理您的创作</p>
        </div>
      </div>

      {/* 草稿分类 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary-500" />
          草稿分类
        </h3>
        <div className="space-y-1">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <motion.button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? `${category.gradient} text-white shadow-lg shadow-${category.color.split('-')[1]}-500/25`
                    : `${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'} text-gray-700 dark:text-gray-300`
                }`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">{category.name}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {category.count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 时间筛选 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary-500" />
          时间筛选
        </h3>
        <div className="space-y-1">
          {timeFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeTimeFilter === filter.id;
            return (
              <motion.button
                key={filter.id}
                onClick={() => onTimeFilterChange(filter.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : `${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'} text-gray-600 dark:text-gray-400`
                }`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{filter.name}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 热门标签 */}
      {popularTags.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Hash className="w-4 h-4 text-primary-500" />
            热门标签
          </h3>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag, index) => (
              <motion.button
                key={tag}
                onClick={() => onTagClick?.(tag)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                  isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                #{tag}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
