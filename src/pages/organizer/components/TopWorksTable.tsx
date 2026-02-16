import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { TopWorkDetail } from '@/services/organizerAnalyticsService';
import organizerAnalyticsService from '@/services/organizerAnalyticsService';
import {
  Eye,
  Heart,
  MessageCircle,
  Star,
  TrendingUp,
  ChevronRight,
  Trophy,
} from 'lucide-react';

interface TopWorksTableProps {
  works: TopWorkDetail[];
  loading?: boolean;
  onWorkClick?: (workId: string) => void;
}

export function TopWorksTable({ works, loading = false, onWorkClick }: TopWorksTableProps) {
  const { isDark } = useTheme();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-xl animate-pulse"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (works.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          暂无作品数据
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {works.map((work, index) => (
        <motion.div
          key={work.work_id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ x: 4 }}
          onClick={() => onWorkClick?.(work.work_id)}
          className={`
            flex items-center gap-4 p-4 rounded-xl cursor-pointer
            ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}
            transition-colors group
          `}
        >
          {/* 排名 */}
          <div
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
              ${index < 3
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              }
            `}
          >
            {index + 1}
          </div>

          {/* 作品信息 */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {work.title}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {work.creator_name}
            </p>
          </div>

          {/* 统计数据 */}
          <div className="flex items-center gap-4 text-sm">
            {/* 浏览量 */}
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Eye className="w-4 h-4" />
              <span>{organizerAnalyticsService.formatNumber(work.views)}</span>
            </div>

            {/* 点赞数 */}
            <div className="flex items-center gap-1 text-pink-500">
              <Heart className="w-4 h-4" />
              <span>{work.likes || 0}</span>
            </div>

            {/* 评论数 */}
            <div className="flex items-center gap-1 text-purple-500">
              <MessageCircle className="w-4 h-4" />
              <span>{work.comments || 0}</span>
            </div>

            {/* 评分 */}
            {(work.score || 0) > 0 && (
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-medium">{(work.score || 0).toFixed(1)}</span>
              </div>
            )}

            {/* 互动率 */}
            <div className="flex items-center gap-1 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
              <span>{(work.engagement_rate || 0).toFixed(1)}%</span>
            </div>
          </div>

          {/* 箭头 */}
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
        </motion.div>
      ))}
    </div>
  );
}
