import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Palette, User, Bot, Paintbrush, PenTool, Video, Search } from 'lucide-react';
import { AgentType, AGENT_CONFIG } from '../types/agent';

interface AgentAvatarProps {
  role: AgentType;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  animate?: boolean;
  userAvatarUrl?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base'
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
};

export default function AgentAvatar({ role, size = 'md', showName = false, animate = true, userAvatarUrl }: AgentAvatarProps) {
  const renderAvatar = () => {
    switch (role) {
      case 'user':
        return userAvatarUrl ? (
          <img
            src={userAvatarUrl}
            alt="用户头像"
            className={`${sizeClasses[size]} rounded-full object-cover shadow-lg`}
          />
        ) : (
          <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg`}>
            <User className={`${iconSizes[size]} text-white`} />
          </div>
        );

      case 'director':
        return (
          <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg relative`}>
            <Crown className={`${iconSizes[size]} text-white`} />
            {/* 皇冠装饰 */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-[8px]">👑</span>
            </div>
          </div>
        );

      case 'designer':
        return (
          <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg`}>
            <Palette className={`${iconSizes[size]} text-white`} />
          </div>
        );

      case 'illustrator':
        return (
          <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg`}>
            <Paintbrush className={`${iconSizes[size]} text-white`} />
          </div>
        );

      case 'copywriter':
        return (
          <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg`}>
            <PenTool className={`${iconSizes[size]} text-white`} />
          </div>
        );

      case 'animator':
        return (
          <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg`}>
            <Video className={`${iconSizes[size]} text-white`} />
          </div>
        );

      case 'researcher':
        return (
          <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-lg`}>
            <Search className={`${iconSizes[size]} text-white`} />
          </div>
        );

      case 'system':
      default:
        return (
          <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-lg`}>
            <Bot className={`${iconSizes[size]} text-white`} />
          </div>
        );
    }
  };

  const getName = () => {
    switch (role) {
      case 'user':
        return '你';
      case 'director':
        return AGENT_CONFIG.director.name;
      case 'designer':
        return AGENT_CONFIG.designer.name;
      case 'illustrator':
        return AGENT_CONFIG.illustrator.name;
      case 'copywriter':
        return AGENT_CONFIG.copywriter.name;
      case 'animator':
        return AGENT_CONFIG.animator.name;
      case 'researcher':
        return AGENT_CONFIG.researcher.name;
      default:
        return '系统';
    }
  };

  const getColor = () => {
    switch (role) {
      case 'director':
        return 'text-amber-500';
      case 'designer':
        return 'text-cyan-500';
      case 'illustrator':
        return 'text-pink-500';
      case 'copywriter':
        return 'text-emerald-500';
      case 'animator':
        return 'text-violet-500';
      case 'researcher':
        return 'text-slate-500';
      case 'user':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const avatarContent = (
    <div className="flex items-center gap-2">
      {renderAvatar()}
      {showName && (
        <span className={`text-xs font-medium ${getColor()}`}>
          {getName()}
        </span>
      )}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      >
        {avatarContent}
      </motion.div>
    );
  }

  return avatarContent;
}
