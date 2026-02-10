import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import type { ParticipationStatus } from '@/services/eventParticipationService';

interface ActivitySidebarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  stats: {
    total: number;
    registered: number;
    submitted: number;
    reviewing: number;
    completed: number;
    awarded: number;
  };
}

interface FilterItem {
  id: string;
  label: string;
  icon: string;
  count?: number;
  color: string;
}

export const ActivitySidebar: React.FC<ActivitySidebarProps> = ({
  activeFilter,
  onFilterChange,
  stats,
}) => {
  const { isDark } = useTheme();

  const filters: FilterItem[] = [
    { id: 'all', label: '全部活动', icon: 'fa-th-large', count: stats.total, color: 'bg-gray-500' },
    { id: 'registered', label: '已报名', icon: 'fa-user-check', count: stats.registered, color: 'bg-blue-500' },
    { id: 'submitted', label: '已提交', icon: 'fa-upload', count: stats.submitted, color: 'bg-purple-500' },
    { id: 'reviewing', label: '评审中', icon: 'fa-search', count: stats.reviewing, color: 'bg-indigo-500' },
    { id: 'completed', label: '已结束', icon: 'fa-check-circle', count: stats.completed, color: 'bg-gray-400' },
    { id: 'awarded', label: '获奖记录', icon: 'fa-trophy', count: stats.awarded, color: 'bg-yellow-500' },
  ];

  const quickActions = [
    { id: 'discover', label: '发现活动', icon: 'fa-compass', href: '/events' },
    { id: 'create', label: '创建活动', icon: 'fa-plus-circle', href: '/create/activity' },
    { id: 'manage', label: '活动管理', icon: 'fa-cog', href: '/activities' },
  ];

  return (
    <div className="space-y-6">
      {/* 状态筛选 */}
      <div className={`rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className="font-semibold text-sm">活动状态</h3>
        </div>
        <nav className="p-2">
          {filters.map((filter) => (
            <motion.button
              key={filter.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onFilterChange(filter.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                activeFilter === filter.id
                  ? isDark
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-red-50 text-red-600'
                  : isDark
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${filter.color}`}></div>
                <i className={`fas ${filter.icon} w-4 text-center ${activeFilter === filter.id ? 'text-red-500' : ''}`}></i>
                <span>{filter.label}</span>
              </div>
              {filter.count !== undefined && filter.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeFilter === filter.id
                    ? isDark ? 'bg-red-500/30' : 'bg-red-100'
                    : isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  {filter.count}
                </span>
              )}
            </motion.button>
          ))}
        </nav>
      </div>

      {/* 快捷操作 */}
      <div className={`rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className="font-semibold text-sm">快捷操作</h3>
        </div>
        <div className="p-2">
          {quickActions.map((action) => (
            <motion.a
              key={action.id}
              href={action.href}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isDark
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <i className={`fas ${action.icon} w-4 text-center`}></i>
              <span>{action.label}</span>
            </motion.a>
          ))}
        </div>
      </div>

      {/* 参与进度概览 */}
      <div className={`rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className="font-semibold text-sm">参与概览</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* 进度条 */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>总体进度</span>
              <span className="font-medium">
                {stats.total > 0
                  ? Math.round(
                      ((stats.submitted + stats.reviewing + stats.completed + stats.awarded) /
                        stats.total) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    stats.total > 0
                      ? ((stats.submitted + stats.reviewing + stats.completed + stats.awarded) /
                          stats.total) *
                        100
                      : 0
                  }%`,
                }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
              />
            </div>
          </div>

          {/* 统计数字 */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className="text-2xl font-bold text-blue-500">{stats.registered}</div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>待提交</div>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className="text-2xl font-bold text-yellow-500">{stats.awarded}</div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>获奖数</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivitySidebar;
