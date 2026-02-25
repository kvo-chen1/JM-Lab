import React from 'react';
import { motion } from 'framer-motion';
import {
  User,
  CreditCard,
  Gift,
  FileText,
  HelpCircle,
  Crown,
  Star,
  UserCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { User as UserType } from '@/contexts/authContext';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  description?: string;
}

interface LeftSidebarProps {
  isDark: boolean;
  user: UserType | null;
  membershipLevel?: string;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isDark,
  user,
  membershipLevel,
  activeTab,
  onTabChange,
  isCollapsed = false,
  onToggleCollapse
}) => {
  // 优先使用传入的会员等级，否则使用 user 对象中的
  const currentLevel = membershipLevel || user?.membershipLevel || 'free';
  const navItems: NavItem[] = [
    { id: 'overview', label: '会员概览', icon: User, description: '查看会员状态和权益' },
    { id: 'subscription', label: '订阅管理', icon: CreditCard, description: '管理您的订阅计划' },
    { id: 'benefits', label: '权益中心', icon: Gift, description: '探索所有会员权益' },
    { id: 'orders', label: '订单记录', icon: FileText, description: '查看历史订单' },
    { id: 'support', label: '帮助支持', icon: HelpCircle, description: '获取帮助和反馈' },
  ];

  const getMembershipIcon = (level?: string) => {
    switch (level) {
      case 'vip':
        return <Crown size={20} className="text-purple-500" />;
      case 'premium':
        return <Star size={20} className="text-blue-500" />;
      default:
        return <UserCircle size={20} className="text-gray-500" />;
    }
  };

  const getMembershipColor = (level?: string) => {
    switch (level) {
      case 'vip':
        return 'from-purple-500/20 to-violet-500/20 border-purple-500/30';
      case 'premium':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      default:
        return 'from-gray-500/20 to-slate-500/20 border-gray-500/30';
    }
  };

  const getMembershipText = (level?: string) => {
    switch (level) {
      case 'vip':
        return 'VIP会员';
      case 'premium':
        return '高级会员';
      default:
        return '免费会员';
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-slate-900/50' : 'bg-white'} transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      {/* 用户信息卡片 */}
      <div className={`p-5 ${isDark ? 'border-b border-slate-700/50' : 'border-b border-gray-100'}`}>
        <div className={`
          relative overflow-hidden rounded-2xl p-4
          bg-gradient-to-br ${getMembershipColor(currentLevel)}
          border backdrop-blur-sm
          ${isDark ? 'border-slate-700/50' : 'border-gray-200'}
        `}>
          {/* 装饰性背景 */}
          <div className="absolute top-0 right-0 w-20 h-20 opacity-20">
            <Sparkles className="w-full h-full" />
          </div>

          <div className="relative flex items-center gap-3">
            {/* 头像 */}
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
              ${isDark ? 'bg-slate-800' : 'bg-white'}
              shadow-lg
            `}>
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                <span className="text-lg font-bold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user?.username || '用户'}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {getMembershipIcon(currentLevel)}
                  <span className={`text-xs font-medium ${
                    currentLevel === 'vip' ? 'text-purple-500' :
                    currentLevel === 'premium' ? 'text-blue-500' : 'text-gray-500'
                  }`}>
                    {getMembershipText(currentLevel)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                font-medium text-sm transition-all duration-200
                relative overflow-hidden group
                ${isActive
                  ? isDark
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'bg-indigo-50 text-indigo-700'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              {/* 激活指示器 */}
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className={`
                    absolute left-0 top-1/2 -translate-y-1/2
                    w-1 h-6 rounded-full
                    ${isDark ? 'bg-indigo-400' : 'bg-indigo-600'}
                  `}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              <Icon
                size={20}
                className={`
                  flex-shrink-0 transition-transform duration-200
                  ${isActive ? 'scale-110' : 'group-hover:scale-110'}
                  ${isActive ? (isDark ? 'text-indigo-400' : 'text-indigo-600') : ''}
                `}
              />

              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight
                    size={16}
                    className={`
                      opacity-0 -translate-x-2 transition-all duration-200
                      ${isActive ? 'opacity-100 translate-x-0' : 'group-hover:opacity-50 group-hover:translate-x-0'}
                    `}
                  />
                </>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className={`
                  absolute left-full ml-2 px-3 py-1.5 rounded-lg text-xs
                  whitespace-nowrap opacity-0 group-hover:opacity-100
                  transition-opacity pointer-events-none z-50
                  ${isDark ? 'bg-slate-800 text-white' : 'bg-gray-900 text-white'}
                `}>
                  {item.label}
                </div>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* 底部收起按钮 */}
      <div className={`p-4 ${isDark ? 'border-t border-slate-700/50' : 'border-t border-gray-100'}`}>
        <button
          onClick={onToggleCollapse}
          className={`
            w-full flex items-center justify-center gap-2
            px-4 py-2.5 rounded-xl font-medium text-sm
            transition-all duration-200
            ${isDark
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            }
          `}
        >
          {isCollapsed ? (
            <ChevronRight size={18} className="rotate-180" />
          ) : (
            <>
              <ChevronRight size={18} />
              <span>收起菜单</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LeftSidebar;
