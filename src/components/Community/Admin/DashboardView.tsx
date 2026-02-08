import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Crown, 
  Edit3, 
  UserCheck,
  TrendingUp,
  FileText,
  Shield,
  Clock,
  ArrowRight
} from 'lucide-react';
import StatCard from '../StatCard';

interface DashboardViewProps {
  isDark: boolean;
  memberCount: number;
  adminCount: number;
  editorCount: number;
  regularMemberCount: number;
  pendingCount: number;
  announcementCount: number;
  onNavigate: (tab: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  isDark,
  memberCount,
  adminCount,
  editorCount,
  regularMemberCount,
  pendingCount,
  announcementCount,
  onNavigate
}) => {
  // 快捷入口配置
  const quickActions = [
    {
      id: 'members',
      title: '成员管理',
      description: '管理社群成员和权限',
      icon: Users,
      color: 'primary' as const,
      count: memberCount
    },
    {
      id: 'announcement',
      title: '发布公告',
      description: '向全体成员发送通知',
      icon: FileText,
      color: 'success' as const,
      count: announcementCount
    },
    {
      id: 'moderation',
      title: '审核管理',
      description: '审核待处理的内容',
      icon: Shield,
      color: 'warning' as const,
      count: pendingCount,
      highlight: pendingCount > 0
    },
    {
      id: 'settings',
      title: '社群设置',
      description: '配置社群基本信息',
      icon: TrendingUp,
      color: 'purple' as const
    }
  ];

  // 最近动态模拟数据
  const recentActivities = [
    { id: '1', user: '张三', action: '加入了社群', time: '2分钟前', type: 'join' },
    { id: '2', user: '李四', action: '发布了新公告', time: '1小时前', type: 'announcement' },
    { id: '3', user: '王五', action: '被设为编辑', time: '3小时前', type: 'role' },
  ];

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div>
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          概览
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}
        >
          欢迎回来，查看社群的最新动态和数据
        </motion.p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Users} 
          value={memberCount} 
          label="总成员" 
          isDark={isDark} 
          color="primary"
          delay={0}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard 
          icon={Crown} 
          value={adminCount} 
          label="管理员" 
          isDark={isDark} 
          color="purple"
          delay={1}
        />
        <StatCard 
          icon={Edit3} 
          value={editorCount} 
          label="编辑" 
          isDark={isDark} 
          color="success"
          delay={2}
        />
        <StatCard 
          icon={UserCheck} 
          value={regularMemberCount} 
          label="普通成员" 
          isDark={isDark} 
          color="orange"
          delay={3}
        />
      </div>

      {/* 快捷入口 */}
      <div>
        <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          快捷入口
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                onClick={() => onNavigate(action.id)}
                className={`
                  group relative p-5 rounded-2xl border text-left
                  transition-all duration-300
                  ${isDark 
                    ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600' 
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className={`
                    p-3 rounded-xl
                    ${action.color === 'primary' ? (isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600') : ''}
                    ${action.color === 'success' ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : ''}
                    ${action.color === 'warning' ? (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600') : ''}
                    ${action.color === 'purple' ? (isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-50 text-violet-600') : ''}
                  `}>
                    <Icon size={24} />
                  </div>
                  {action.highlight && (
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'}
                    `}>
                      待处理
                    </span>
                  )}
                </div>
                
                <div className="mt-4">
                  <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {action.title}
                  </h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {action.description}
                  </p>
                </div>

                <div className={`
                  mt-4 flex items-center gap-1 text-sm font-medium
                  ${isDark ? 'text-indigo-400' : 'text-indigo-600'}
                  opacity-0 group-hover:opacity-100 transition-opacity
                `}>
                  <span>进入管理</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 最近动态 */}
      <div>
        <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          最近动态
        </h2>
        <div className={`
          rounded-2xl border overflow-hidden
          ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}
        `}>
          {recentActivities.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`
                    p-4 flex items-center gap-4
                    ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}
                    transition-colors
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'}
                  `}>
                    {activity.user.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      <span className="font-medium">{activity.user}</span>
                      {' '}{activity.action}
                    </p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                      {activity.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={`
              flex flex-col items-center justify-center py-12
              ${isDark ? 'text-slate-500' : 'text-gray-500'}
            `}>
              <Clock size={32} className="mb-2 opacity-50" />
              <p>暂无动态</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
