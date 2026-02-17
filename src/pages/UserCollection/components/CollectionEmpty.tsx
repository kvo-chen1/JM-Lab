import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { CollectionEmptyProps, CollectionType } from '../types/collection';
import {
  Bookmark,
  Heart,
  Image,
  MessageSquare,
  Calendar,
  Layers,
  Compass,
  ArrowRight,
} from 'lucide-react';

// 根据筛选类型获取对应的浏览路径
const getBrowsePath = (filter: CollectionType | 'all'): string => {
  switch (filter) {
    case CollectionType.SQUARE_WORK:
      return '/square';
    case CollectionType.COMMUNITY_POST:
      return '/community';
    case CollectionType.ACTIVITY:
      return '/events';
    case CollectionType.TEMPLATE:
      return '/tianjin';
    default:
      return '/square';
  }
};

// 根据筛选类型获取主操作按钮配置
const getPrimaryAction = (filter: CollectionType | 'all') => {
  switch (filter) {
    case CollectionType.SQUARE_WORK:
      return { label: '去广场', path: '/square', icon: Image };
    case CollectionType.COMMUNITY_POST:
      return { label: '去社区', path: '/community', icon: MessageSquare };
    case CollectionType.ACTIVITY:
      return { label: '去活动', path: '/events', icon: Calendar };
    case CollectionType.TEMPLATE:
      return { label: '去模板', path: '/tianjin', icon: Layers };
    default:
      return { label: '去浏览', path: '/square', icon: Compass };
  }
};

const emptyConfig = {
  bookmarks: {
    icon: Bookmark,
    title: '暂无收藏',
    description: '您还没有收藏任何内容，去浏览并收藏感兴趣的作品吧',
  },
  likes: {
    icon: Heart,
    title: '暂无点赞',
    description: '您还没有点赞任何内容，去发现并支持喜欢的作品吧',
  },
};

const filterConfig = {
  all: { label: '全部', icon: null },
  [CollectionType.SQUARE_WORK]: { label: '广场作品', icon: Image },
  [CollectionType.COMMUNITY_POST]: { label: '社区帖子', icon: MessageSquare },
  [CollectionType.ACTIVITY]: { label: '活动', icon: Calendar },
  [CollectionType.TEMPLATE]: { label: '作品模板', icon: Layers },
};

export function CollectionEmpty({ type, activeFilter }: CollectionEmptyProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const config = emptyConfig[type];
  const Icon = config.icon;
  const filterInfo = filterConfig[activeFilter];
  const primaryAction = getPrimaryAction(activeFilter);
  const secondaryPath = activeFilter === CollectionType.COMMUNITY_POST ? '/square' : '/community';
  const secondaryLabel = activeFilter === CollectionType.COMMUNITY_POST ? '去广场' : '去社区';
  const SecondaryIcon = activeFilter === CollectionType.COMMUNITY_POST ? Image : MessageSquare;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center py-20 px-4 ${
        isDark ? 'bg-gray-800/50' : 'bg-white/50'
      } backdrop-blur-sm rounded-3xl`}
    >
      {/* 图标 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
          isDark ? 'bg-gray-700' : 'bg-gray-100'
        }`}
      >
        <Icon
          className={`w-12 h-12 ${
            type === 'bookmarks'
              ? isDark
                ? 'text-blue-400'
                : 'text-blue-500'
              : isDark
                ? 'text-pink-400'
                : 'text-pink-500'
          }`}
        />
      </motion.div>

      {/* 标题 */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
      >
        {activeFilter === 'all' ? config.title : `${filterInfo.label} - ${config.title}`}
      </motion.h2>

      {/* 描述 */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`text-center max-w-md mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
      >
        {config.description}
      </motion.p>

      {/* 操作按钮 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap justify-center gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(primaryAction.path)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
            type === 'bookmarks'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-pink-600 hover:bg-pink-700 text-white'
          }`}
        >
          <primaryAction.icon className="w-5 h-5" />
          {primaryAction.label}
          <ArrowRight className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(secondaryPath)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
            isDark
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <SecondaryIcon className="w-5 h-5" />
          {secondaryLabel}
        </motion.button>
      </motion.div>

      {/* 提示 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className={`mt-8 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
      >
        提示：浏览时点击
        <Bookmark className="inline w-3 h-3 mx-1" />
        收藏，点击
        <Heart className="inline w-3 h-3 mx-1" />
        点赞
      </motion.p>
    </motion.div>
  );
}
