import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2, 
  UserPlus, 
  Award,
  Clock,
  FileText,
  CheckCircle
} from 'lucide-react';

export interface Activity {
  id: string;
  type: 'like' | 'comment' | 'bookmark' | 'share' | 'post' | 'follow' | 'achievement' | 'checkin' | 'task';
  title: string;
  description?: string;
  timestamp: Date;
  target?: {
    id: string;
    title: string;
    thumbnail?: string;
  };
  metadata?: Record<string, any>;
}

interface ActivityTimelineProps {
  activities: Activity[];
  maxItems?: number;
}

const activityConfig = {
  like: {
    icon: Heart,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-200 dark:border-red-800',
    label: '点赞',
  },
  comment: {
    icon: MessageCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: '评论',
  },
  bookmark: {
    icon: Bookmark,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    label: '收藏',
  },
  share: {
    icon: Share2,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-800',
    label: '分享',
  },
  post: {
    icon: FileText,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    label: '发布',
  },
  follow: {
    icon: UserPlus,
    color: 'text-pink-500',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    borderColor: 'border-pink-200 dark:border-pink-800',
    label: '关注',
  },
  achievement: {
    icon: Award,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: '成就',
  },
  checkin: {
    icon: CheckCircle,
    color: 'text-teal-500',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    borderColor: 'border-teal-200 dark:border-teal-800',
    label: '签到',
  },
  task: {
    icon: Clock,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    label: '任务',
  },
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function formatFullTime(date: Date): string {
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ActivityTimeline({ activities, maxItems = 10 }: ActivityTimelineProps) {
  const { isDark } = useTheme();
  const displayActivities = activities.slice(0, maxItems);

  if (activities.length === 0) {
    return (
      <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>暂无活动记录</p>
        <p className="text-sm mt-1 opacity-70">开始创作和互动，记录将显示在这里</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayActivities.map((activity, index) => {
        const config = activityConfig[activity.type];
        const Icon = config.icon;

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group"
          >
            <div className="flex items-start gap-4">
              {/* 时间线 */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full ${config.bgColor} ${config.borderColor} border-2 flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                {index < displayActivities.length - 1 && (
                  <div className={`w-0.5 h-full min-h-[40px] mt-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                )}
              </div>

              {/* 内容 */}
              <div className="flex-1 pb-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} transition-all duration-300 group-hover:shadow-md`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                          {config.label}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`} title={formatFullTime(activity.timestamp)}>
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{activity.title}</h4>
                      {activity.description && (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {activity.description}
                        </p>
                      )}
                    </div>

                    {/* 目标内容缩略图 */}
                    {activity.target?.thumbnail && (
                      <div className="flex-shrink-0">
                        <img
                          src={activity.target.thumbnail}
                          alt={activity.target.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}

      {activities.length > maxItems && (
        <div className="text-center pt-4">
          <button className={`text-sm font-medium ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
            查看更多活动
          </button>
        </div>
      )}
    </div>
  );
}
