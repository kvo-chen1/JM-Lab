import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  CollectionType,
  CategoryFilter,
  CollectionSidebarProps,
} from '../types/collection';
import {
  LayoutGrid,
  Image,
  MessageSquare,
  Calendar,
  Layers,
  Bookmark,
  Heart,
} from 'lucide-react';

const bookmarkCategories: Omit<CategoryFilter, 'count'>[] = [
  { id: 'all', label: '全部收藏', icon: 'LayoutGrid', color: '#3b82f6' },
  { id: CollectionType.SQUARE_WORK, label: '广场作品', icon: 'Image', color: '#ef4444' },
  { id: CollectionType.COMMUNITY_POST, label: '社区帖子', icon: 'MessageSquare', color: '#8b5cf6' },
  { id: CollectionType.ACTIVITY, label: '活动', icon: 'Calendar', color: '#f59e0b' },
  { id: CollectionType.TEMPLATE, label: '作品模板', icon: 'Layers', color: '#10b981' },
];

const likeCategories: Omit<CategoryFilter, 'count'>[] = [
  { id: 'all', label: '全部点赞', icon: 'LayoutGrid', color: '#3b82f6' },
  { id: CollectionType.SQUARE_WORK, label: '广场作品', icon: 'Image', color: '#ef4444' },
  { id: CollectionType.COMMUNITY_POST, label: '社区帖子', icon: 'MessageSquare', color: '#8b5cf6' },
  { id: CollectionType.ACTIVITY, label: '活动', icon: 'Calendar', color: '#f59e0b' },
  { id: CollectionType.TEMPLATE, label: '作品模板', icon: 'Layers', color: '#10b981' },
];

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'LayoutGrid': return LayoutGrid;
    case 'Image': return Image;
    case 'MessageSquare': return MessageSquare;
    case 'Calendar': return Calendar;
    case 'Layers': return Layers;
    default: return LayoutGrid;
  }
};

interface ExtendedCollectionSidebarProps extends CollectionSidebarProps {
  activeTab?: 'bookmarks' | 'likes';
}

export function CollectionSidebar({
  activeFilter,
  onFilterChange,
  stats,
  categories: categoryCounts,
  activeTab = 'bookmarks',
}: ExtendedCollectionSidebarProps) {
  const { isDark } = useTheme();

  const isLikesTab = activeTab === 'likes';
  const categories = isLikesTab ? likeCategories : bookmarkCategories;

  // 合并分类数据和统计
  const categoriesWithCount = categories.map(cat => {
    const countData = categoryCounts.find(c => c.id === cat.id);
    // 在点赞标签页下，显示点赞数量（目前只有广场作品有数据）
    let count = countData?.count || 0;
    if (isLikesTab && cat.id === 'all') {
      count = stats.totalLikes;
    } else if (isLikesTab && cat.id === CollectionType.SQUARE_WORK) {
      count = stats.totalLikes; // 目前点赞都归类为广场作品
    } else if (isLikesTab) {
      count = 0; // 其他类型暂时没有点赞数据
    }
    return {
      ...cat,
      count,
    };
  });

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className={`w-64 flex-shrink-0 ${isDark ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm rounded-2xl p-4`}
    >
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-6 px-2">
        {isLikesTab ? (
          <Heart className={`w-5 h-5 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
        ) : (
          <Bookmark className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        )}
        <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {isLikesTab ? '点赞分类' : '收藏分类'}
        </h2>
      </div>

      {/* 分类列表 */}
      <nav className="space-y-1">
        {categoriesWithCount.map((category) => {
          const Icon = getIcon(category.icon);
          const isActive = activeFilter === category.id;

          return (
            <motion.button
              key={category.id}
              onClick={() => onFilterChange(category.id as CollectionType | 'all')}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? isDark
                    ? isLikesTab
                      ? 'bg-pink-600/20 text-pink-300'
                      : 'bg-blue-600/20 text-blue-300'
                    : isLikesTab
                      ? 'bg-pink-50 text-pink-700'
                      : 'bg-blue-50 text-blue-700'
                  : isDark
                    ? 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-opacity-20'
                      : isDark
                        ? 'bg-gray-700'
                        : 'bg-gray-100'
                  }`}
                  style={{
                    backgroundColor: isActive ? `${category.color}20` : undefined,
                  }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: category.color }}
                  />
                </div>
                <span className="font-medium text-sm">{category.label}</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive
                    ? isDark
                      ? isLikesTab
                        ? 'bg-pink-500/30 text-pink-200'
                        : 'bg-blue-500/30 text-blue-200'
                      : isLikesTab
                        ? 'bg-pink-100 text-pink-700'
                        : 'bg-blue-100 text-blue-700'
                    : isDark
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {category.count}
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* 统计概览 - 显示相反类型的统计 */}
      <div className={`mt-8 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-4 px-2">
          {isLikesTab ? (
            <Bookmark className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
          ) : (
            <Heart className={`w-4 h-4 ${isDark ? 'text-pink-400' : 'text-pink-500'}`} />
          )}
          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {isLikesTab ? '我的收藏' : '我的点赞'}
          </span>
        </div>
        <div className={`px-3 py-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {isLikesTab ? '总收藏数' : '总点赞数'}
            </span>
            <span className={`text-lg font-bold ${isLikesTab ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-pink-400' : 'text-pink-600')}`}>
              {isLikesTab ? stats.total : stats.totalLikes}
            </span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
