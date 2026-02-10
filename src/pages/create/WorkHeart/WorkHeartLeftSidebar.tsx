import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { 
  useActiveTab, 
  useLeftSidebarCollapsed,
  useWorkHeartStore 
} from './hooks/useWorkHeartStore';

const navItems = [
  { id: 'create', label: '灵感创作', icon: 'lightbulb', description: '开始新的创作' },
  { id: 'design', label: '一键设计', icon: 'magic', description: '快速生成设计' },
  { id: 'results', label: '生成结果', icon: 'images', description: '查看生成历史' },
  { id: 'history', label: '历史记录', icon: 'clock-rotate-left', description: '完整创作历史' },
  { id: 'vein', label: '灵感脉络', icon: 'project-diagram', description: '创意演化追踪' }
];

const toolItems = [
  { id: 'presets', label: '预设管理', icon: 'sliders' },
  { id: 'tools', label: '快捷工具', icon: 'toolbox' },
  { id: 'stats', label: '创作统计', icon: 'chart-pie' }
];

export default function WorkHeartLeftSidebar() {
  const { isDark } = useTheme();
  const { user, isAuthenticated } = useContext(AuthContext);
  const activeTab = useActiveTab();
  const collapsed = useLeftSidebarCollapsed();
  const { setActiveTab, toggleLeftSidebar } = useWorkHeartStore();

  return (
    <motion.aside
      className={`h-full flex flex-col border-r z-20 transition-colors duration-300 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* 顶部品牌区域 */}
      <div className={`flex items-center justify-between p-4 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white shadow-lg">
                <i className="fas fa-palette"></i>
              </div>
              <div>
                <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  津门灵感
                </h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  文化创意助手
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={toggleLeftSidebar}
          className={`p-2 rounded-lg transition-colors ${
            isDark 
              ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          aria-label={collapsed ? '展开侧边栏' : '折叠侧边栏'}
        >
          <i className={`fas ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
        </button>
      </div>

      {/* 用户卡片 */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mx-4 mt-4 p-4 rounded-xl border ${
              isDark 
                ? 'bg-slate-800/50 border-slate-700' 
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                isDark 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                  : 'bg-gradient-to-br from-orange-500 to-red-500'
              }`}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {user?.username || '访客用户'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isAuthenticated ? '已登录' : '未登录'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 导航菜单 */}
      <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
        {/* 主导航 */}
        <div className="space-y-1">
          {!collapsed && (
            <h3 className={`px-3 text-xs font-bold uppercase tracking-wider mb-2 ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}>
              主导航
            </h3>
          )}
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`group relative flex items-center w-full p-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? isDark 
                      ? 'bg-red-500/10 text-red-400' 
                      : 'bg-red-50 text-red-600'
                    : isDark 
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={`absolute left-0 w-1 h-6 rounded-r-full ${
                      isDark ? 'bg-red-500' : 'bg-red-600'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
                <i className={`fas fa-${item.icon} w-6 text-center text-lg ${collapsed ? '' : 'mr-3'} ${
                  isActive ? '' : 'opacity-70 group-hover:opacity-100'
                }`}></i>
                {!collapsed && (
                  <div className="flex-1 text-left">
                    <span className="font-medium">{item.label}</span>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {item.description}
                    </p>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* 分隔线 */}
        <div className={`my-4 mx-3 h-px ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

        {/* 工具箱 */}
        <div className="space-y-1">
          {!collapsed && (
            <h3 className={`px-3 text-xs font-bold uppercase tracking-wider mb-2 ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}>
              工具箱
            </h3>
          )}
          {toolItems.map((item) => (
            <motion.button
              key={item.id}
              className={`group flex items-center w-full p-3 rounded-xl transition-all duration-200 ${
                isDark 
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title={collapsed ? item.label : undefined}
            >
              <i className={`fas fa-${item.icon} w-6 text-center text-lg ${collapsed ? '' : 'mr-3'} opacity-70 group-hover:opacity-100`}></i>
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 底部 */}
      <div className={`p-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <motion.button
          className={`group flex items-center w-full p-3 rounded-xl transition-all duration-200 ${
            isDark 
              ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' 
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = '/create'}
        >
          <i className={`fas fa-arrow-left w-6 text-center text-lg ${collapsed ? '' : 'mr-3'} opacity-70 group-hover:opacity-100`}></i>
          {!collapsed && <span className="font-medium">返回设计工坊</span>}
        </motion.button>
      </div>
    </motion.aside>
  );
}
