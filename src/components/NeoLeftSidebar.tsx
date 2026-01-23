import React, { useContext } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { motion, AnimatePresence } from 'framer-motion';
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

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 }
  };

  return (
    <motion.aside 
      className={`h-full flex flex-col border-r z-20 transition-colors duration-300
        ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
      initial={collapsed ? "collapsed" : "expanded"}
      animate={collapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* 顶部品牌区域 */}
      <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div 
              className="flex flex-col"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-orange-500 to-amber-500">
                津门灵感引擎
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">AI 驱动的文化创意助手</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={onToggleCollapse}
          className={`p-2 rounded-lg transition-colors
            ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
          aria-label={collapsed ? '展开侧边栏' : '折叠侧边栏'}
        >
          <i className={`fas ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-sm`}></i>
        </button>
      </div>

      {/* 滚动区域 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 custom-scrollbar">
        {/* 用户信息卡片 */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div 
              className={`mb-6 p-3 rounded-xl border shadow-sm transition-all
                ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shadow-md
                  ${isDark ? 'bg-gradient-to-br from-blue-600 to-indigo-600' : 'bg-gradient-to-br from-orange-500 to-red-500'}`}>
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {user?.username || '访客用户'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {isAuthenticated ? '已连接' : '未登录'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 导航菜单 */}
        <div className="space-y-6">
          {/* 主导航 */}
          <div>
            {!collapsed && (
              <h2 className={`px-3 text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                主导航
              </h2>
            )}
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id as 'create' | 'results' | 'history')}
                    className={`group relative flex items-center w-full p-3 rounded-xl transition-all duration-200
                      ${isActive 
                        ? (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600') 
                        : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                      }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className={`absolute left-0 w-1 h-6 rounded-r-full ${isDark ? 'bg-red-500' : 'bg-red-600'}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    <i className={`fas fa-${item.icon} w-6 text-center text-lg transition-colors ${collapsed ? 'mx-auto' : 'mr-3'} ${isActive ? '' : 'opacity-70 group-hover:opacity-100'}`}></i>
                    {!collapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 功能入口 */}
          <div>
            {!collapsed && (
              <h2 className={`px-3 text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                工具箱
              </h2>
            )}
            <div className="space-y-1">
              {featureItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => console.log('Feature clicked:', item.id)}
                  className={`group flex items-center w-full p-3 rounded-xl transition-all duration-200
                    ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  <i className={`fas fa-${item.icon} w-6 text-center text-lg transition-colors ${collapsed ? 'mx-auto' : 'mr-3'} opacity-70 group-hover:opacity-100`}></i>
                  {!collapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 底部设置区 */}
      <div className={`p-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="space-y-1">
          {/* 主题切换 */}
          <button
            onClick={() => {
              const currentIndex = themeOrder.indexOf(theme as typeof themeOrder[number]);
              const nextIndex = (currentIndex + 1) % themeOrder.length;
              setTheme(themeOrder[nextIndex]);
            }}
            className={`group flex items-center w-full p-3 rounded-xl transition-all duration-200
              ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
            title="切换主题"
          >
            <i className={`fas ${theme === 'dark' ? 'fa-sun' : theme === 'light' ? 'fa-moon' : theme === 'blue' ? 'fa-water' : 'fa-leaf'} w-6 text-center text-lg ${collapsed ? 'mx-auto' : 'mr-3'}`}></i>
            {!collapsed && <span className="font-medium">切换主题</span>}
          </button>

          {/* 辅助面板开关 */}
          <button
            onClick={onToggleRightSidebar}
            className={`group flex items-center w-full p-3 rounded-xl transition-all duration-200
              ${rightSidebarVisible 
                ? (isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600') 
                : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
              }`}
            title={rightSidebarVisible ? "隐藏辅助面板" : "显示辅助面板"}
          >
            <i className={`fas ${rightSidebarVisible ? 'fa-eye-slash' : 'fa-eye'} w-6 text-center text-lg ${collapsed ? 'mx-auto' : 'mr-3'}`}></i>
            {!collapsed && <span className="font-medium">{rightSidebarVisible ? '隐藏辅助面板' : '显示辅助面板'}</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  );
};

export default NeoLeftSidebar;
