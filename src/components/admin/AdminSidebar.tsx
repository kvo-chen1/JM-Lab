import React from 'react';
import { motion } from 'framer-motion';
import NavNotificationBadge from '@/components/NavNotificationBadge';
import type { NavItemType } from '@/hooks/useNavNotifications';
import type { NavNotificationsMap } from '@/hooks/useNavNotifications';

export interface AdminNavItem {
  id: NavItemType | string;
  name: string;
  icon: string;
  badge?: number;
  showNotification?: boolean;
}

interface AdminSidebarProps {
  isDark: boolean;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  user?: {
    username?: string;
    avatar?: string;
  } | null;
  onLogout?: () => void;
  notifications?: NavNotificationsMap;
  onMarkAsViewed?: (navItem: NavItemType) => void;
  totalUnreadCount?: number;
}

const navItems: AdminNavItem[] = [
  { id: 'dashboard', name: '控制台', icon: 'tachometer-alt' },
  { id: 'campaigns', name: '活动管理', icon: 'calendar-alt', showNotification: true },
  { id: 'eventAudit', name: '活动审核', icon: 'clipboard-check', showNotification: true },
  { id: 'communities', name: '社群管理', icon: 'users-cog', showNotification: true },
  { id: 'contentManagement', name: '内容管理', icon: 'newspaper' },
  { id: 'knowledgeBase', name: '知识库管理', icon: 'book' },
  { id: 'templates', name: '作品模板管理', icon: 'layer-group' },
  { id: 'achievements', name: '成就管理', icon: 'trophy' },
  { id: 'aiFeedback', name: 'AI反馈管理', icon: 'robot', showNotification: true },
  { id: 'contentAudit', name: '内容审核', icon: 'file-alt', showNotification: true },
  { id: 'analytics', name: '数据分析', icon: 'chart-bar' },
  { id: 'adoption', name: '品牌管理', icon: 'star' },
  { id: 'users', name: '用户管理', icon: 'users', showNotification: true },
  { id: 'userAudit', name: '用户审计', icon: 'user-shield', showNotification: true },
  { id: 'creators', name: '创作者管理', icon: 'trophy' },
  { id: 'productManagement', name: '商品管理', icon: 'box' },
  { id: 'orders', name: '订单管理', icon: 'shopping-cart', showNotification: true },
  { id: 'feedback', name: '反馈管理', icon: 'comments', showNotification: true },
  { id: 'permissions', name: '权限管理', icon: 'user-lock' },
  { id: 'auditLog', name: '审计日志', icon: 'history' },
  { id: 'notificationManagement', name: '消息通知', icon: 'bell' },
  { id: 'systemMonitor', name: '系统监控', icon: 'server' },
  { id: 'settings', name: '系统设置', icon: 'cog' },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isDark,
  activeTab,
  onTabChange,
  user,
  onLogout,
  notifications,
  onMarkAsViewed,
  totalUnreadCount = 0,
}) => {
  const handleTabChange = (tabId: string) => {
    // 标记为已查看
    if (onMarkAsViewed && notifications?.[tabId as NavItemType]) {
      onMarkAsViewed(tabId as NavItemType);
    }
    onTabChange(tabId);
  };

  return (
    <aside
      className={`
        w-64 h-screen fixed top-0 left-0 z-30 flex flex-col
        ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        border-r
        transition-colors duration-300
      `}
    >
      {/* Logo 区域 */}
      <div className="p-6 flex-shrink-0">
        <div className="flex items-center space-x-1 mb-6">
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold text-red-600"
          >
            AI
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            共创
          </motion.span>
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full relative"
          >
            管理端
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </motion.span>
        </div>
      </div>

      {/* 导航菜单 - 可滚动区域 */}
      <nav className="flex-1 overflow-y-auto px-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent min-h-0">
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            const isActive = activeTab === item.id;
            const notificationState = notifications?.[item.id as NavItemType];
            const hasNotification = notificationState && notificationState.count > 0;
            const showNotification = item.showNotification && hasNotification;

            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <button
                  onClick={() => handleTabChange(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-xl
                    transition-all duration-200 group relative
                    ${isActive
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : isDark
                        ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  {/* 左侧内容 */}
                  <div className="flex items-center min-w-0 flex-1">
                    <i
                      className={`
                        fas fa-${item.icon} mr-3 w-4 text-center text-sm
                        transition-transform duration-200
                        ${isActive ? 'scale-110' : 'group-hover:scale-105'}
                      `}
                    />
                    <span className="text-sm font-medium truncate">{item.name}</span>
                  </div>

                  {/* 通知标记 */}
                  {showNotification && (
                    <div className="ml-2 flex-shrink-0">
                      <NavNotificationBadge
                        count={notificationState.count}
                        size="sm"
                        variant={notificationState.hasNew ? 'error' : 'default'}
                        pulse={notificationState.hasNew}
                      />
                    </div>
                  )}

                  {/* 活跃指示器 */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* 用户信息 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`
          flex-shrink-0 p-4 border-t
          ${isDark ? 'border-gray-700' : 'border-gray-200'}
        `}
      >
        <div className="flex items-center">
          <div className="relative">
            <img
              src={user?.avatar || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Admin%20avatar'}
              alt={user?.username || '管理员'}
              className="h-10 w-10 rounded-full mr-3 object-cover border-2 border-transparent hover:border-red-500 transition-colors"
            />
            <span className="absolute bottom-0 right-3 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {user?.username || '管理员'}
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              超级管理员
            </p>
          </div>
          <button
            onClick={onLogout}
            className="
              p-2 rounded-lg
              text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20
              transition-colors
              group
            "
            aria-label="退出登录"
            title="退出登录"
          >
            <i className="fas fa-sign-out-alt group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </motion.div>
    </aside>
  );
};

export default AdminSidebar;
