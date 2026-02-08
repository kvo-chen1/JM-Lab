import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Plus, 
  Link as LinkIcon, 
  MoreHorizontal,
  User,
  FileText,
  Shield
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'join' | 'post' | 'announcement' | 'role_change';
  user: string;
  content: string;
  time: string;
}

interface OnlineMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'member';
}

interface RightSidebarProps {
  isDark: boolean;
  communityName: string;
  communityCover?: string;
  memberCount: number;
  onlineCount?: number;
  activities?: Activity[];
  onlineMembers?: OnlineMember[];
  onAddMember?: () => void;
  onGenerateInvite?: () => void;
  onQuickAction?: (action: string) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  isDark,
  communityName,
  communityCover,
  memberCount,
  onlineCount = 0,
  activities = [],
  onlineMembers = [],
  onAddMember,
  onGenerateInvite,
  onQuickAction
}) => {
  // 获取活动图标
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'join':
        return <User size={14} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />;
      case 'post':
        return <FileText size={14} className={isDark ? 'text-blue-400' : 'text-blue-600'} />;
      case 'announcement':
        return <TrendingUp size={14} className={isDark ? 'text-amber-400' : 'text-amber-600'} />;
      case 'role_change':
        return <Shield size={14} className={isDark ? 'text-violet-400' : 'text-violet-600'} />;
      default:
        return <Clock size={14} className={isDark ? 'text-slate-400' : 'text-gray-500'} />;
    }
  };

  // 获取角色颜色
  const getRoleColor = (role: OnlineMember['role']) => {
    switch (role) {
      case 'admin':
        return isDark ? 'bg-rose-500' : 'bg-rose-500';
      case 'editor':
        return isDark ? 'bg-emerald-500' : 'bg-emerald-500';
      default:
        return isDark ? 'bg-slate-500' : 'bg-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 社群信息卡片 */}
      <div className={`p-6 ${isDark ? 'border-b border-slate-700/50' : 'border-b border-gray-200'}`}>
        <div className={`
          rounded-2xl overflow-hidden
          ${isDark ? 'bg-slate-700/30' : 'bg-gray-100'}
        `}>
          {/* 封面图 */}
          <div className={`
            h-24 w-full
            ${communityCover 
              ? '' 
              : (isDark ? 'bg-gradient-to-br from-indigo-500/30 to-violet-500/30' : 'bg-gradient-to-br from-indigo-100 to-violet-100')
            }
          `}>
            {communityCover && (
              <img src={communityCover} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          
          {/* 信息 */}
          <div className="p-4">
            <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {communityName || '未命名社群'}
            </h3>
            <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              <div className="flex items-center gap-1.5">
                <Users size={14} />
                <span>{memberCount} 成员</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                <span>{onlineCount} 在线</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className={`p-6 ${isDark ? 'border-b border-slate-700/50' : 'border-b border-gray-200'}`}>
        <h4 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
          快捷操作
        </h4>
        <div className="space-y-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddMember}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              font-medium text-sm
              transition-all duration-200
              ${isDark 
                ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30' 
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }
            `}
          >
            <Plus size={18} />
            <span>添加成员</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGenerateInvite}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              font-medium text-sm
              transition-all duration-200
              ${isDark 
                ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <LinkIcon size={18} />
            <span>生成邀请链接</span>
          </motion.button>
        </div>
      </div>

      {/* 在线成员 */}
      <div className={`p-6 ${isDark ? 'border-b border-slate-700/50' : 'border-b border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h4 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
            在线成员
          </h4>
          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
            {onlineMembers.length} 人
          </span>
        </div>
        
        {onlineMembers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {onlineMembers.slice(0, 8).map((member) => (
              <div 
                key={member.id}
                className="relative group"
                title={`${member.name} (${member.role === 'admin' ? '管理员' : member.role === 'editor' ? '编辑' : '成员'})`}
              >
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  text-sm font-medium
                  ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700'}
                `}>
                  {member.avatar ? (
                    <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    member.name.charAt(0).toUpperCase()
                  )}
                </div>
                {/* 角色指示点 */}
                <div className={`
                  absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2
                  ${isDark ? 'border-slate-800' : 'border-white'}
                  ${getRoleColor(member.role)}
                `} />
                
                {/* 悬浮提示 */}
                <div className={`
                  absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg text-xs
                  whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity
                  pointer-events-none z-10
                  ${isDark ? 'bg-slate-700 text-white' : 'bg-gray-900 text-white'}
                `}>
                  {member.name}
                </div>
              </div>
            ))}
            {onlineMembers.length > 8 && (
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                text-xs font-medium
                ${isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-gray-200 text-gray-500'}
              `}>
                +{onlineMembers.length - 8}
              </div>
            )}
          </div>
        ) : (
          <div className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
            暂无在线成员
          </div>
        )}
      </div>

      {/* 最近活动 */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h4 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
            最近活动
          </h4>
          <button className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
            <MoreHorizontal size={16} className={isDark ? 'text-slate-500' : 'text-gray-500'} />
          </button>
        </div>
        
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-3"
              >
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'}
                `}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    <span className="font-medium">{activity.user}</span>
                    {' '}{activity.content}
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
            flex flex-col items-center justify-center py-8
            ${isDark ? 'text-slate-500' : 'text-gray-500'}
          `}>
            <Clock size={32} className="mb-2 opacity-50" />
            <p className="text-sm">暂无活动记录</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RightSidebar;
