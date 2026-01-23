import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { motion } from 'framer-motion';
import { themeOrder } from '@/config/themeConfig';

interface NeoLeftSidebarProps {
  activeTab: 'create' | 'results' | 'history';
  onTabChange: (tab: 'create' | 'results' | 'history') => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  rightSidebarVisible?: boolean;
  onToggleRightSidebar?: () => void;
}

const NeoLeftSidebar: React.FC<NeoLeftSidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed = false,
  onToggleCollapse,
  rightSidebarVisible = false,
  onToggleRightSidebar
}) => {
  const { theme, isDark, setTheme } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);

  // 导航项配置
  const navItems = [
    { id: 'create', label: '灵感创作', icon: 'lightbulb', path: '#create' },
    { id: 'results', label: '生成结果', icon: 'image', path: '#results' },
    { id: 'history', label: '历史记录', icon: 'clock-rotate-left', path: '#history' }
  ];

  // 功能入口配置
  const featureItems = [
    { id: 'presets', label: '预设管理', icon: 'sliders', path: '#presets' },
    { id: 'tools', label: '快捷工具', icon: 'tools', path: '#tools' },
    { id: 'stats', label: '创作统计', icon: 'chart-line', path: '#stats' }
  ];

  return (
    <aside 
      className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r transition-all duration-300 h-full overflow-y-auto shadow-lg ${collapsed ? 'w-20' : 'w-72'} overflow-hidden`}
    >
      {/* 顶部品牌区域 */}
      <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {!collapsed && (
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-amber-600">
                津门灵感引擎
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI创作助手</p>
            </div>
          )}
        </motion.div>
        <button 
          onClick={onToggleCollapse}
          className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
          aria-label={collapsed ? '展开侧边栏' : '折叠侧边栏'}
        >
          <i className={`fas ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
        </button>
      </div>

      {/* 用户信息卡片 */}
      {!collapsed && (
        <motion.div 
          className={`p-4 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-lg mx-4 my-3`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${isDark ? 'bg-blue-600' : 'bg-orange-500'}`}>
              {user?.username?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.username || '访客'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isAuthenticated ? '已登录' : '未登录'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 导航菜单 */}
      <nav className="mt-6 px-3 space-y-1">
        <h2 className={`text-xs font-semibold uppercase tracking-wide mb-3 px-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {!collapsed && '主导航'}
        </h2>
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => onTabChange(item.id as 'create' | 'results' | 'history')}
            className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 w-full text-left
              ${activeTab === item.id 
                ? `${isDark ? 'bg-gradient-to-r from-red-900/30 to-transparent text-white border-l-2 border-red-500' : 'bg-gradient-to-r from-red-50 to-red-100 text-red-600 border-l-2 border-red-600'}
                  font-medium shadow-sm` 
                : `${isDark ? 'text-gray-300 hover:bg-gray-800/50' : 'text-gray-700 hover:bg-gray-100'}`
              }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <i className={`fas fa-${item.icon} ${collapsed ? 'mr-0' : 'mr-3'} transition-all duration-300`}></i>
            {!collapsed && (
              <span className="transition-all duration-300 ease-in-out opacity-100">
                {item.label}
              </span>
            )}
          </motion.button>
        ))}
      </nav>

      {/* 功能入口 */}
      <nav className="mt-8 px-3 space-y-1">
        <h2 className={`text-xs font-semibold uppercase tracking-wide mb-3 px-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {!collapsed && '功能入口'}
        </h2>
        {featureItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => console.log('Feature clicked:', item.id)}
            className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 w-full text-left
              ${isDark ? 'text-gray-300 hover:bg-gray-800/50' : 'text-gray-700 hover:bg-gray-100'}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <i className={`fas fa-${item.icon} ${collapsed ? 'mr-0' : 'mr-3'} transition-all duration-300`}></i>
            {!collapsed && (
              <span className="transition-all duration-300 ease-in-out opacity-100">
                {item.label}
              </span>
            )}
          </motion.button>
        ))}
        
        {/* 主题切换开关 */}
        <motion.button
          onClick={() => {
            // 直接切换主题
            const currentIndex = themeOrder.indexOf(theme as typeof themeOrder[number]);
            const nextIndex = (currentIndex + 1) % themeOrder.length;
            setTheme(themeOrder[nextIndex]);
          }}
          className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 w-full text-left
            ${isDark ? 'text-gray-300 hover:bg-gray-800/50' : theme === 'blue' ? 'text-blue-700 hover:bg-blue-50' : theme === 'green' ? 'text-green-700 hover:bg-green-50' : 'text-gray-700 hover:bg-gray-100'}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <i className={`fas ${theme === 'dark' ? 'fa-sun' : theme === 'light' ? 'fa-moon' : theme === 'blue' ? 'fa-water' : theme === 'green' ? 'fa-leaf' : 'fa-circle-half-stroke'} ${collapsed ? 'mr-0' : 'mr-3'} transition-all duration-300`}></i>
          {!collapsed && (
            <span className="transition-all duration-300 ease-in-out opacity-100">
              主题切换
            </span>
          )}
        </motion.button>
        
        {/* 右侧边栏控制开关 */}
        <motion.button
          onClick={onToggleRightSidebar}
          className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 w-full text-left mt-4
            ${isDark ? (rightSidebarVisible ? 'text-blue-400 bg-blue-900/20' : 'text-gray-300 hover:bg-gray-800/50') : (rightSidebarVisible ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-100')}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <i className={`fas ${rightSidebarVisible ? 'fa-eye-slash' : 'fa-eye'} ${collapsed ? 'mr-0' : 'mr-3'} transition-all duration-300`}></i>
          {!collapsed && (
            <span className="transition-all duration-300 ease-in-out opacity-100">
              {rightSidebarVisible ? '隐藏辅助面板' : '显示辅助面板'}
            </span>
          )}
        </motion.button>
      </nav>

      {/* 折叠按钮 */}
      {!collapsed && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <motion.button
            onClick={onToggleCollapse}
            className={`p-2 rounded-full shadow-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} border ${isDark ? 'border-gray-700' : 'border-gray-300'} transition-all duration-300`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <i className="fas fa-angle-left"></i>
          </motion.button>
        </div>
      )}
      

    </aside>
  );
};

export default NeoLeftSidebar;