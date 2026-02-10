import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { CollectionStatsProps } from '../types/collection';
import {
  Bookmark,
  Heart,
  Image,
  MessageSquare,
  Calendar,
  Layers,
  TrendingUp,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface ExtendedCollectionStatsProps extends CollectionStatsProps {
  activeTab?: 'bookmarks' | 'likes';
}

export function CollectionStats({ stats, isLoading, activeTab = 'bookmarks' }: ExtendedCollectionStatsProps) {
  const { isDark } = useTheme();

  const isLikesTab = activeTab === 'likes';

  const statItems = isLikesTab
    ? [
        {
          label: '广场作品',
          value: stats.totalLikes,
          icon: Image,
          color: '#ef4444',
          bgColor: 'bg-red-500',
        },
        {
          label: '社区帖子',
          value: 0,
          icon: MessageSquare,
          color: '#8b5cf6',
          bgColor: 'bg-purple-500',
        },
        {
          label: '活动',
          value: 0,
          icon: Calendar,
          color: '#f59e0b',
          bgColor: 'bg-amber-500',
        },
        {
          label: '作品模板',
          value: 0,
          icon: Layers,
          color: '#10b981',
          bgColor: 'bg-emerald-500',
        },
      ]
    : [
        {
          label: '广场作品',
          value: stats.squareWork,
          icon: Image,
          color: '#ef4444',
          bgColor: 'bg-red-500',
        },
        {
          label: '社区帖子',
          value: stats.communityPost,
          icon: MessageSquare,
          color: '#8b5cf6',
          bgColor: 'bg-purple-500',
        },
        {
          label: '活动',
          value: stats.activity,
          icon: Calendar,
          color: '#f59e0b',
          bgColor: 'bg-amber-500',
        },
        {
          label: '作品模板',
          value: stats.template,
          icon: Layers,
          color: '#10b981',
          bgColor: 'bg-emerald-500',
        },
      ];

  if (isLoading) {
    return (
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm`}>
        <div className="animate-pulse space-y-4">
          <div className={`h-4 w-24 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-20 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm`}
    >
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {isLikesTab ? '点赞统计' : '收藏统计'}
        </h3>
      </div>

      {/* 总数 */}
      <motion.div
        variants={itemVariants}
        className={`mb-5 p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isLikesTab
                ? (isDark ? 'bg-pink-500/20' : 'bg-pink-100')
                : (isDark ? 'bg-blue-500/20' : 'bg-blue-100')
            }`}>
              {isLikesTab ? (
                <Heart className={`w-5 h-5 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
              ) : (
                <Bookmark className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              )}
            </div>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {isLikesTab ? '总点赞数' : '总收藏数'}
            </span>
          </div>
          <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {isLikesTab ? stats.totalLikes : stats.total}
          </span>
        </div>
      </motion.div>

      {/* 分类统计 */}
      <div className="grid grid-cols-2 gap-3">
        {statItems.map((item) => (
          <motion.div
            key={item.label}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            className={`p-3 rounded-xl transition-colors ${
              isDark ? 'bg-gray-700/30 hover:bg-gray-700/50' : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${item.color}20` }}
              >
                <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
              </div>
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </div>
            <span className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {item.value}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
