import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Bell, 
  Shield, 
  Settings, 
  BarChart3, 
  ChevronLeft,
  Crown
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  count?: number;
  badge?: number;
}

interface AdminSidebarProps {
  isDark: boolean;
  communityName: string;
  communityCover?: string;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  pendingCount?: number;
  memberCount?: number;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isDark,
  communityName,
  communityCover,
  activeTab,
  onTabChange,
  pendingCount = 0,
  memberCount = 0
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: '概览', icon: LayoutDashboard },
    { id: 'members', label: '成员管理', icon: Users, count: memberCount },
    { id: 'announcement', label: '公告发布', icon: Bell },
    { id: 'moderation', label: '审核管理', icon: Shield, badge: pendingCount },
    { id: 'settings', label: '社群设置', icon: Settings },
    { id: 'analytics', label: '数据分析', icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 社群信息头部 */}
      <div className={`p-6 ${isDark ? 'border-b border-slate-700/50' : 'border-b border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
            ${isDark ? 'bg-gradient-to-br from-indigo-500/20 to-violet-500/20' : 'bg-gradient-to-br from-indigo-50 to-violet-50'}
            ${isDark ? 'border border-indigo-500/20' : 'border border-indigo-200'}
          `}>
            {communityCover ? (
              <img src={communityCover} alt="" className="w-full h-full rounded-xl object-cover" />
            ) : (
              <Crown size={24} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
            )}
          </div>
          <div className="min-w-0">
            <h2 className={`font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {communityName || '社群管理'}
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              管理后台
            </p>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          // 安全处理：如果 Icon 未定义，使用空组件
          const SafeIcon = Icon || (() => null);
          
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                font-medium text-sm
                transition-all duration-200
                relative overflow-hidden
                ${isActive
                  ? isDark 
                    ? 'bg-indigo-500/20 text-indigo-300' 
                    : 'bg-indigo-50 text-indigo-700'
                  : isDark 
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50' 
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
              
              <SafeIcon size={20} className={isActive ? (isDark ? 'text-indigo-400' : 'text-indigo-600') : ''} />
              
              <span className="flex-1 text-left">{item.label}</span>
              
              {/* 数量角标 */}
              {item.count !== undefined && item.count > 0 && (
                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-medium
                  ${isActive
                    ? isDark ? 'bg-indigo-500/30 text-indigo-300' : 'bg-indigo-200 text-indigo-800'
                    : isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {item.count > 999 ? '999+' : item.count}
                </span>
              )}
              
              {/* 红点提醒 */}
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-medium
                  ${isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'}
                `}>
                  {item.badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* 底部返回按钮 */}
      <div className={`p-4 ${isDark ? 'border-t border-slate-700/50' : 'border-t border-gray-200'}`}>
        <button
          onClick={() => window.history.back()}
          className={`
            w-full flex items-center justify-center gap-2 
            px-4 py-3 rounded-xl font-medium text-sm
            transition-all duration-200
            ${isDark 
              ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            }
          `}
        >
          <ChevronLeft size={18} />
          <span>返回社群</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
