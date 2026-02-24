import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Flame,
  DollarSign,
  Lightbulb,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  Upload
} from 'lucide-react';
import { CreatorTab } from '../index';
import { Link } from 'react-router-dom';

interface CreatorSidebarProps {
  activeTab: CreatorTab;
  onTabChange: (tab: CreatorTab) => void;
  isCollapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  isDark: boolean;
  isMobile: boolean;
}

interface NavItem {
  id: CreatorTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: 'overview', label: '首页概览', icon: LayoutDashboard },
  { id: 'promotion', label: '必火推广', icon: Flame, badge: '热' },
  { id: 'monetization', label: '变现中心', icon: DollarSign },
  { id: 'inspiration', label: '创作灵感', icon: Lightbulb },
  { id: 'analytics', label: '数据中心', icon: BarChart3 },
];

const CreatorSidebar: React.FC<CreatorSidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onCollapse,
  isDark,
  isMobile,
}) => {
  if (isMobile && isCollapsed) return null;

  return (
    <>
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => onCollapse(true)}
        />
      )}

      <aside
        className={`sticky top-0 h-screen transition-all duration-300 flex-shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r`}
      >
        <div className="flex flex-col h-full pt-4">
          <div className="flex-1 py-4 px-3">
            <div className={`mb-6 ${isCollapsed ? 'px-2' : 'px-3'}`}>
              <Link to="/create">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow ${
                    isCollapsed ? 'px-2' : 'px-4'
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  {!isCollapsed && <span>发布作品</span>}
                </motion.button>
              </Link>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onTabChange(item.id);
                      if (isMobile) onCollapse(true);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? isDark
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'bg-blue-50 text-blue-600 border border-blue-200'
                        : isDark
                        ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-current' : ''}`} />
                    {!isCollapsed && (
                      <>
                        <span className="font-medium flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {isCollapsed && item.badge && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </motion.button>
                );
              })}
            </nav>

            <div className={`mt-8 pt-6 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              {!isCollapsed && (
                <h3 className={`px-3 mb-3 text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  快捷操作
                </h3>
              )}
              <div className="space-y-1">
                <motion.button
                  whileHover={{ x: 2 }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isDark
                      ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <Settings className="w-5 h-5" />
                  {!isCollapsed && <span className="font-medium">设置</span>}
                </motion.button>
                <motion.button
                  whileHover={{ x: 2 }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isDark
                      ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <HelpCircle className="w-5 h-5" />
                  {!isCollapsed && <span className="font-medium">帮助中心</span>}
                </motion.button>
              </div>
            </div>
          </div>

          {!isMobile && (
            <div className={`p-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCollapse(!isCollapsed)}
                className={`w-full flex items-center justify-center p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-gray-800 text-gray-400'
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <div className="flex items-center gap-2">
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-sm">收起菜单</span>
                  </div>
                )}
              </motion.button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default CreatorSidebar;
