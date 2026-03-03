/**
 * 动态页面左侧边栏组件
 * 包含用户信息、导航菜单
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import type { FeedFilterType } from '@/types/feed';
import type { User } from '@/types/index';
import {
  Home,
  Compass,
  Video,
  Image,
  FileText,
  Calendar,
  Building2,
  Users,
  Settings,
  HelpCircle,
} from 'lucide-react';

interface UserStats {
  worksCount: number;
  followersCount: number;
  followingCount: number;
}

interface LeftSidebarProps {
  activeFilter: FeedFilterType;
  onFilterChange: (filter: FeedFilterType) => void;
  user?: User | null;
  userStats?: UserStats;
}

const menuItems = [
  { id: 'all' as FeedFilterType, label: '全部动态', icon: Home },
  { id: 'community' as FeedFilterType, label: '社群', icon: Users },
  { id: 'works' as FeedFilterType, label: '作品', icon: Image },
  { id: 'article' as FeedFilterType, label: '专栏', icon: FileText },
  { id: 'activity' as FeedFilterType, label: '活动', icon: Calendar },
];

export function LeftSidebar({ activeFilter, onFilterChange, user, userStats }: LeftSidebarProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* 用户信息卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-5 ${
          isDark 
            ? 'bg-gray-900 border border-gray-800' 
            : 'bg-white border border-gray-100 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
              alt={user?.username || '用户'}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-offset-2 ring-blue-500"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {user?.username || '访客用户'}
            </h3>
            <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {user?.bio || '暂无简介'}
            </p>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="text-center">
            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {userStats?.followingCount ?? user?.followingCount ?? 0}
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>关注</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {userStats?.followersCount ?? user?.followersCount ?? 0}
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>粉丝</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {userStats?.worksCount ?? user?.worksCount ?? 0}
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>动态</p>
          </div>
        </div>
      </motion.div>

      {/* 导航菜单 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl overflow-hidden ${
          isDark 
            ? 'bg-gray-900 border border-gray-800' 
            : 'bg-white border border-gray-100 shadow-sm'
        }`}
      >
        <nav className="p-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeFilter === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  console.log('[LeftSidebar] Filter clicked:', item.id);
                  onFilterChange(item.id);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? isDark
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'bg-blue-50 text-blue-600'
                    : isDark
                    ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-current' : ''}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebarActiveIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-current"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </motion.div>

      {/* 快捷链接 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-2xl p-4 ${
          isDark 
            ? 'bg-gray-900 border border-gray-800' 
            : 'bg-white border border-gray-100 shadow-sm'
        }`}
      >
        <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          快捷链接
        </h4>
        <div className="space-y-1">
          <button
            onClick={() => navigate('/settings')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              isDark
                ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            设置
          </button>
          <button
            onClick={() => navigate('/help')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              isDark
                ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            帮助中心
          </button>
        </div>
      </motion.div>

      {/* 版权信息 */}
      <div className={`text-xs text-center ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
        <p>© 2024 津脉智坊</p>
        <p className="mt-1">津ICP备XXXXXXXX号</p>
      </div>
    </div>
  );
}
