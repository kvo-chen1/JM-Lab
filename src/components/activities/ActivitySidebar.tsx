import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import type { ParticipationStatus } from '@/services/eventParticipationService';

interface ActivitySidebarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  stats: {
    total: number;
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
  ];

  const quickActions = [
    { id: 'discover', label: '发现活动', icon: 'fa-compass', href: '/events' },
    { id: 'create', label: '创建活动', icon: 'fa-plus-circle', href: '/organizer' },
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

      {/* 参与统计 */}
      <div className={`rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className="font-semibold text-sm">参与统计</h3>
        </div>
        <div className="p-4">
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} text-center`}>
            <div className="text-3xl font-bold text-blue-500">{stats.total}</div>
            <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>参与活动</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivitySidebar;
