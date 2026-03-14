import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Upload,
  Target,
  ChevronDown,
  Briefcase,
  Wallet,
  PlusCircle,
  Package
} from 'lucide-react';
import { CreatorTab } from '../index';
import { Link, useLocation } from 'react-router-dom';

// 扩展的 Tab 类型，包含带子菜单的导航分组
export type ExtendedCreatorTab = CreatorTab | 'order-monetization';

interface CreatorSidebarProps {
  activeTab: CreatorTab | ExtendedCreatorTab;
  onTabChange: (tab: CreatorTab) => void;
  isCollapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  isDark: boolean;
  isMobile: boolean;
}

interface NavItem {
  id: ExtendedCreatorTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
  children?: { id: string; label: string; icon: React.ElementType; path: string; badge?: string }[];
}

const navItems: NavItem[] = [
  { id: 'overview', label: '首页概览', icon: LayoutDashboard },
  { id: 'promotion', label: '必火推广', icon: Flame, badge: '热' },
  {
    id: 'monetization',
    label: '变现中心',
    icon: DollarSign,
    children: [
      { id: 'monetization-overview', label: '变现广场', icon: Wallet, path: '/creator-center/monetization' },
      { id: 'brand-tasks', label: '品牌任务', icon: Target, path: '/brand-tasks', badge: '新' },
    ]
  },
  {
    id: 'order-monetization',
    label: '商单变现',
    icon: Briefcase,
    children: [
      { id: 'orders', label: '商单广场', icon: Briefcase, path: '/order-square' },
      { id: 'publish-order', label: '发布商单', icon: PlusCircle, path: '/publish-order', badge: '新' },
      { id: 'brand-order-management', label: '商单管理', icon: Package, path: '/brand-order-management', badge: '新' },
      { id: 'order-center', label: '商单中心', icon: Package, path: '/order-center', badge: '新' },
    ]
  },
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
  const location = useLocation();
  const [expandedItem, setExpandedItem] = useState<string | null>('monetization');

  // 检查当前是否在变现中心相关页面
  const isInMonetization = location.pathname.includes('/brand-tasks') ||
    (location.pathname.includes('/creator-center/monetization'));

  // 检查当前是否在商单变现相关页面
  const isInOrderMonetization = location.pathname.includes('/order-square') ||
    location.pathname.includes('/publish-order') ||
    location.pathname.includes('/order-center');

  // 根据当前页面自动展开对应的菜单
  useEffect(() => {
    if (isInMonetization) {
      setExpandedItem('monetization');
    } else if (isInOrderMonetization) {
      setExpandedItem('order-monetization');
    }
  }, [location.pathname, isInMonetization, isInOrderMonetization]);

  if (isMobile && isCollapsed) return null;

  const toggleExpand = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

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
                const isExpanded = expandedItem === item.id;
                const hasChildren = item.children && item.children.length > 0;

                return (
                  <div key={item.id}>
                    <motion.button
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (hasChildren && !isCollapsed) {
                          toggleExpand(item.id);
                        } else if (item.id !== 'order-monetization') {
                          onTabChange(item.id as CreatorTab);
                          if (isMobile) onCollapse(true);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                        isActive || (item.id === 'monetization' && isInMonetization) || (item.id === 'order-monetization' && isInOrderMonetization)
                          ? isDark
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            : 'bg-blue-50 text-blue-600 border border-blue-200'
                          : isDark
                          ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <Icon className={`w-5 h-5 ${(isActive || (item.id === 'monetization' && isInMonetization) || (item.id === 'order-monetization' && isInOrderMonetization)) ? 'text-current' : ''}`} />
                      {!isCollapsed && (
                        <>
                          <span className="font-medium flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                              {item.badge}
                            </span>
                          )}
                          {hasChildren && (
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </motion.div>
                          )}
                        </>
                      )}
                      {isCollapsed && item.badge && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </motion.button>

                    {/* 子菜单 */}
                    <AnimatePresence>
                      {hasChildren && isExpanded && !isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className={`ml-4 pl-4 border-l-2 ${isDark ? 'border-gray-700' : 'border-gray-200'} mt-1 space-y-1`}>
                            {item.children?.map((child) => {
                              const ChildIcon = child.icon;
                              const isChildActive = location.pathname === child.path ||
                                (child.path.includes('?') && location.pathname + location.search === child.path) ||
                                (child.id === 'brand-tasks' && location.pathname === '/brand-tasks') ||
                                (child.id === 'monetization-overview' && location.pathname === '/creator-center/monetization') ||
                                (child.id === 'orders' && location.pathname === '/order-square') ||
                                (child.id === 'publish-order' && location.pathname === '/publish-order') ||
                                (child.id === 'order-center' && location.pathname === '/order-center');

                              return (
                                <Link key={child.id} to={child.path}>
                                  <motion.button
                                    whileHover={{ x: 2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                                      isChildActive
                                        ? isDark
                                          ? 'bg-violet-600/20 text-violet-400'
                                          : 'bg-violet-50 text-violet-600'
                                        : isDark
                                        ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                    }`}
                                  >
                                    <ChildIcon className="w-4 h-4" />
                                    <span className="text-sm font-medium flex-1 text-left">{child.label}</span>
                                    {child.badge && (
                                      <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${
                                        isChildActive
                                          ? 'bg-violet-500 text-white'
                                          : isDark 
                                            ? 'bg-violet-500/30 text-violet-300' 
                                            : 'bg-violet-100 text-violet-600'
                                      }`}>
                                        {child.badge}
                                      </span>
                                    )}
                                  </motion.button>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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
