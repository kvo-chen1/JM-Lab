import React from 'react';
import { Crown, Edit3, UserCheck } from 'lucide-react';

export type CommunityRole = 'admin' | 'editor' | 'member';

export interface RoleBadgeProps {
  role: CommunityRole;
  isDark: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  isCreator?: boolean;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ 
  role, 
  isDark, 
  size = 'md',
  showIcon = true,
  isCreator = false
}) => {
  const roleConfig = {
    admin: {
      label: isCreator ? '群主' : '管理员',
      icon: Crown,
      colors: {
        bg: isDark 
          ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10' 
          : 'bg-gradient-to-r from-amber-100 to-amber-50',
        text: isDark ? 'text-amber-300' : 'text-amber-700',
        border: isDark ? 'border-amber-500/30' : 'border-amber-200',
        iconColor: isDark ? 'text-amber-400' : 'text-amber-600'
      }
    },
    editor: {
      label: '编辑',
      icon: Edit3,
      colors: {
        bg: isDark 
          ? 'bg-gradient-to-r from-sky-500/20 to-sky-600/10' 
          : 'bg-gradient-to-r from-sky-100 to-sky-50',
        text: isDark ? 'text-sky-300' : 'text-sky-700',
        border: isDark ? 'border-sky-500/30' : 'border-sky-200',
        iconColor: isDark ? 'text-sky-400' : 'text-sky-600'
      }
    },
    member: {
      label: '成员',
      icon: UserCheck,
      colors: {
        bg: isDark 
          ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10' 
          : 'bg-gradient-to-r from-emerald-100 to-emerald-50',
        text: isDark ? 'text-emerald-300' : 'text-emerald-700',
        border: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
        iconColor: isDark ? 'text-emerald-400' : 'text-emerald-600'
      }
    }
  };

  const config = roleConfig[role];
  const Icon = config.icon;

  const sizeClasses = {
    sm: {
      container: 'px-2 py-0.5 text-xs gap-1',
      icon: 10
    },
    md: {
      container: 'px-3 py-1 text-xs gap-1.5',
      icon: 12
    },
    lg: {
      container: 'px-4 py-1.5 text-sm gap-2',
      icon: 14
    }
  };

  const sizeConfig = sizeClasses[size];

  return (
    <span 
      className={`
        inline-flex items-center font-semibold rounded-full border shadow-sm
        ${config.colors.bg}
        ${config.colors.text}
        ${config.colors.border}
        ${sizeConfig.container}
        transition-all duration-200
        hover:shadow-md
      `}
    >
      {showIcon && (
        <Icon 
          size={sizeConfig.icon} 
          className={config.colors.iconColor}
        />
      )}
      {config.label}
    </span>
  );
};

export default RoleBadge;
