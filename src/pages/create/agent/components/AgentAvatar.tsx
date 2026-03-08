import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Palette, User, Bot } from 'lucide-react';
import { AGENT_CONFIG } from '../types/agent';

interface AgentAvatarProps {
  role: 'user' | 'director' | 'designer' | 'system';
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
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

export default function AgentAvatar({ role, size = 'md', showName = false }: AgentAvatarProps) {
  const renderAvatar = () => {
    switch (role) {
      case 'user':
        return (
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
      case 'user':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      >
        {renderAvatar()}
      </motion.div>
      {showName && (
        <span className={`text-xs font-medium ${getColor()}`}>
          {getName()}
        </span>
      )}
    </div>
  );
}
