import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

interface ActivityStatsProps {
  stats: {
    total: number;
    totalVotes: number;
    totalLikes: number;
  };
}

// 格式化数字
const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null) {
    return '0';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

export const ActivityStats: React.FC<ActivityStatsProps> = ({ stats }) => {
  const { isDark } = useTheme();

  const statItems = [
    {
      label: '累计参与',
      value: stats.total,
      icon: 'fa-flag',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      description: '您参与的活动总数',
    },
    {
      label: '投票数',
      value: stats.totalVotes,
      icon: 'fa-heart',
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      description: '您的作品总投票数',
    },
    {
      label: '点赞数',
      value: stats.totalLikes,
      icon: 'fa-thumbs-up',
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      description: '您的作品总点赞数',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, idx) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className={`p-5 rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'} transition-shadow hover:shadow-md`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {item.label}
              </p>
              <p className="text-3xl font-bold mt-1">{formatNumber(item.value)}</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {item.description}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.bgColor}`}>
              <i className={`fas ${item.icon} ${item.color} text-xl`}></i>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ActivityStats;
