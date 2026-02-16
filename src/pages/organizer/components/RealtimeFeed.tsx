import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Activity } from '@/services/organizerAnalyticsService';
import organizerAnalyticsService from '@/services/organizerAnalyticsService';
import {
  Upload,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Star,
  CheckCircle,
  User,
} from 'lucide-react';

interface RealtimeFeedProps {
  activities: Activity[];
  loading?: boolean;
}

const actionConfig = {
  submission: {
    icon: Upload,
    label: '提交了作品',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  view: {
    icon: Eye,
    label: '浏览了',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  like: {
    icon: Heart,
    label: '点赞了',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
  },
  comment: {
    icon: MessageCircle,
    label: '评论了',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  share: {
    icon: Share2,
    label: '分享了',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  score: {
    icon: Star,
    label: '评分',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  publish: {
    icon: CheckCircle,
    label: '发布了',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
};

export function RealtimeFeed({ activities, loading = false }: RealtimeFeedProps) {
  const { isDark } = useTheme();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl animate-pulse"
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          暂无活动记录
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
      <AnimatePresence mode="popLayout">
        {activities.map((activity, index) => {
          const config = actionConfig[activity.action_type as keyof typeof actionConfig] || actionConfig.view;
          const Icon = config.icon;

          return (
            <motion.div
              key={activity.activity_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className={`
                flex items-center gap-3 p-3 rounded-xl
                hover:bg-gray-50 dark:hover:bg-gray-800/50
                transition-colors cursor-pointer
              `}
            >
              {/* 用户头像 */}
              <div className="relative flex-shrink-0">
                {activity.user_avatar ? (
                  <img
                    src={activity.user_avatar}
                    alt={activity.user_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                    {activity.user_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                {/* 动作图标 */}
                <div
                  className={`
                    absolute -bottom-1 -right-1 w-5 h-5 rounded-full
                    ${config.bgColor} ${config.color}
                    flex items-center justify-center
                    border-2 ${isDark ? 'border-gray-800' : 'border-white'}
                  `}
                >
                  <Icon className="w-3 h-3" />
                </div>
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">{activity.user_name}</span>
                  <span className="text-gray-500 dark:text-gray-400 mx-1">
                    {config.label}
                  </span>
                  <span className="font-medium truncate">
                    {activity.target_title}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {organizerAnalyticsService.getRelativeTime(activity.created_at)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
