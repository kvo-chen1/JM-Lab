import React, { useContext, useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { motion, AnimatePresence } from 'framer-motion';
import { themeOrder, themeConfig } from '@/config/themeConfig';

interface NeoLeftSidebarProps {
  activeTab: 'create' | 'design' | 'results' | 'history';
  onTabChange: (tab: 'create' | 'design' | 'results' | 'history') => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  rightSidebarVisible?: boolean;
  onToggleRightSidebar?: () => void;
  onFeatureClick?: (featureId: string) => void;
}

const NeoLeftSidebar: React.FC<NeoLeftSidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed = false,
  onToggleCollapse,
  rightSidebarVisible = false,
  onToggleRightSidebar,
  onFeatureClick
}) => {
  const { theme, isDark, setTheme } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const [showThemeDropdown, setShowThemeDropdown] = useState<boolean>(false);

  // 点击外部关闭主题下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const themeButton = document.querySelector('.neo-theme-dropdown-button');
      const themeDropdown = document.querySelector('.neo-theme-dropdown-menu');
      
      if (themeButton && themeDropdown && !themeButton.contains(event.target as Node) && !themeDropdown.contains(event.target as Node)) {
        setShowThemeDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 导航项配置
  const navItems = [
    { id: 'create', label: '灵感创作', icon: 'lightbulb', path: '#create' },
    { id: 'design', label: '一键设计', icon: 'magic', path: '#design' },
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
      className={`h-full flex flex-col border-r z-10 transition-colors duration-300
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
              className={`mb-6 p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg
                ${isDark 
                  ? 'bg-slate-900/80 border-slate-800 hover:bg-slate-900 hover:border-slate-700' 
                  : 'bg-white/90 border-slate-200 hover:bg-white hover:border-slate-300'}
                backdrop-blur-sm
              `}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <div className="flex items-center gap-4">
                <motion.div 
                  className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg
                    ${isDark 
                      ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600' 
                      : 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-500'}
                    relative overflow-hidden
                  `}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                >
                  <span className="relative z-10">{user?.username?.charAt(0).toUpperCase() || 'U'}</span>
                  <div className="absolute inset-0 bg-white/10 rounded-full"></div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white/20 rounded-full"></div>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <motion.p 
                    className={`text-sm font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {user?.username || '访客用户'}
                  </motion.p>
                  <div className="flex items-center gap-2 mt-1">
                    <motion.span 
                      className={`w-2.5 h-2.5 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-slate-400'}`}
                      animate={{ 
                        scale: isAuthenticated ? [1, 1.2, 1] : 1 
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: isAuthenticated ? Infinity : 0, 
                        repeatType: 'reverse' 
                      }}
                    ></motion.span>
                    <motion.p 
                      className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {isAuthenticated ? '已连接' : '未登录'}
                    </motion.p>
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
                  onClick={() => onFeatureClick?.(item.id)}
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
          <div className="relative">
            <button
              className={`neo-theme-dropdown-button group flex items-center w-full p-3 rounded-xl transition-all duration-200
                ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              title="切换主题"
              onClick={() => setShowThemeDropdown(v => !v)}
            >
              <i className={`fas ${theme === 'dark' ? 'fa-sun' : theme === 'light' ? 'fa-moon' : theme === 'blue' ? 'fa-water' : theme === 'green' ? 'fa-leaf' : 'fa-dungeon'} w-6 text-center text-lg ${collapsed ? 'mx-auto' : 'mr-3'}`}></i>
              {!collapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">切换主题</span>
                  <i className={`fas fa-chevron-down transition-transform duration-200 ${showThemeDropdown ? 'rotate-180' : ''}`}></i>
                </div>
              )}
              {collapsed && (
                <i className={`fas fa-chevron-down transition-transform duration-200 ${showThemeDropdown ? 'rotate-180' : ''} absolute right-3`}></i>
              )}
            </button>
            {showThemeDropdown && (
              <div className={`neo-theme-dropdown-menu absolute left-0 right-0 mt-2 rounded-xl shadow-lg ring-1 ${isDark ? 'bg-slate-800 ring-slate-700' : 'bg-white ring-slate-200'}`} role="menu" aria-label="切换主题">
                <ul className="py-1">
                  {themeConfig.map(themeOption => (
                    <li key={themeOption.value}>
                      <button
                        className={`w-full text-left px-4 py-2 flex items-center space-x-2 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} ${theme === themeOption.value ? (isDark ? 'bg-slate-700 text-white' : 'bg-slate-100 font-semibold') : ''}`}
                        onClick={() => {
                          setTheme(themeOption.value);
                          setShowThemeDropdown(false);
                        }}
                        role="menuitem"
                      >
                        <i className={themeOption.icon}></i>
                        <span>{themeOption.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

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
