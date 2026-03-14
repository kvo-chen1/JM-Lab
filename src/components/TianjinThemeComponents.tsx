/**
 * 天津文化主题组件库
 * 津脉智坊平台专用
 * 
 * 包含：
 * - 天津文化特色卡片
 * - 天津文化特色按钮
 * - 天津文化特色徽章
 * - 天津文化装饰元素
 * - 天津文化动效组件
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Award, 
  MapPin, 
  Crown,
  Star
} from 'lucide-react';

// ========================================
// 类型定义
// ========================================

export interface TianjinCardProps {
  children: React.ReactNode;
  variant?: 'haihe' | 'brick' | 'nianhua' | 'clay' | 'kite' | 'golden';
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export interface TianjinButtonProps {
  children: React.ReactNode;
  variant?: 'haihe' | 'nirenzhang' | 'yangliuqing' | 'guifaxiang';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export interface TianjinBadgeProps {
  children: React.ReactNode;
  variant?: 'laozihao' | 'feiyi' | 'jinmen' | 'vip-gold';
  className?: string;
  icon?: React.ReactNode;
}

export interface TianjinDividerProps {
  variant?: 'haihe' | 'brick' | 'nianhua';
  className?: string;
}

export interface TianjinIconProps {
  name: 'haihe' | 'tianjin-eye' | 'nirenzhang' | 'yangliuqing' | 'fengzheng' | 'guifaxiang' | 'goubuli';
  size?: number;
  className?: string;
  animated?: boolean;
}

// ========================================
// 天津文化特色卡片组件
// ========================================

export const TianjinCard: React.FC<TianjinCardProps> = ({
  children,
  variant = 'haihe',
  className = '',
  onClick,
  hoverable = true,
}) => {
  const baseClasses = 'relative overflow-hidden transition-all duration-300';
  const variantClasses = {
    haihe: 'card-haihe',
    brick: 'card-brick',
    nianhua: 'card-nianhua',
    clay: 'card-clay',
    kite: 'card-kite',
    golden: 'card-golden',
  };

  const hoverClasses = hoverable ? 'cursor-pointer' : '';

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}
      onClick={onClick}
      whileHover={hoverable ? { y: -4 } : undefined}
      whileTap={hoverable ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
};

// ========================================
// 天津文化特色按钮组件
// ========================================

export const TianjinButton: React.FC<TianjinButtonProps> = ({
  children,
  variant = 'haihe',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  loading = false,
  icon,
}) => {
  const baseClasses = 'relative overflow-hidden font-semibold transition-all duration-300 flex items-center justify-center gap-2';
  
  const variantClasses = {
    haihe: 'btn-haihe',
    nirenzhang: 'btn-nirenzhang',
    yangliuqing: 'btn-yangliuqing',
    guifaxiang: 'btn-guifaxiang',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl',
  };

  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <motion.button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { y: -2 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2 }}
    >
      {loading && (
        <motion.div
          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {!loading && icon}
      {children}
    </motion.button>
  );
};

// ========================================
// 天津文化特色徽章组件
// ========================================

export const TianjinBadge: React.FC<TianjinBadgeProps> = ({
  children,
  variant = 'jinmen',
  className = '',
  icon,
}) => {
  const baseClasses = 'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full';
  
  const variantClasses = {
    laozihao: 'badge-laozihao',
    feiyi: 'badge-feiyi',
    jinmen: 'badge-jinmen',
    'vip-gold': 'badge-vip-gold',
  };

  const defaultIcons = {
    laozihao: <Award className="w-3 h-3" />,
    feiyi: <Sparkles className="w-3 h-3" />,
    jinmen: <MapPin className="w-3 h-3" />,
    'vip-gold': <Crown className="w-3 h-3" />,
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {icon || defaultIcons[variant]}
      {children}
    </span>
  );
};

// ========================================
// 天津文化分隔线组件
// ========================================

export const TianjinDivider: React.FC<TianjinDividerProps> = ({
  variant = 'haihe',
  className = '',
}) => {
  const variantClasses = {
    haihe: 'divider-haihe',
    brick: 'border-b-2 border-brick-300',
    nianhua: 'border-b-2 border-double border-yangliuqing-400',
  };

  return (
    <div className={`my-6 ${variantClasses[variant]} ${className}`} />
  );
};

// ========================================
// 天津文化图标组件
// ========================================

export const TianjinIcon: React.FC<TianjinIconProps> = ({
  name,
  size = 24,
  className = '',
  animated = false,
}) => {
  const iconConfigs = {
    haihe: {
      color: '#1E5F8E',
      icon: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0 4 2 6 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M2 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0 4 2 6 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      ),
    },
    'tianjin-eye': {
      color: '#1E5F8E',
      icon: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
    nirenzhang: {
      color: '#C21807',
      icon: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M4 20c0-4 4-6 8-6s8 2 8 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    yangliuqing: {
      color: '#228B22',
      icon: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
    fengzheng: {
      color: '#87CEEB',
      icon: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M12 2l8 6-8 14-8-14 8-6z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M12 8v12" stroke="currentColor" strokeWidth="2" />
          <path d="M8 12l4-4 4 4" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
    guifaxiang: {
      color: '#C68E17',
      icon: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M12 2c-2 3-6 5-6 9s4 9 6 11c2-2 6-5 6-11s-4-6-6-9z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M12 6c-1 1.5-3 2.5-3 5s2 5 3 6c1-1 3-3 3-6s-2-3.5-3-5z"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    goubuli: {
      color: '#8B4513',
      icon: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path
            d="M8 12c0-2 2-3 4-3s4 1 4 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="9" cy="10" r="1" fill="currentColor" />
          <circle cx="15" cy="10" r="1" fill="currentColor" />
        </svg>
      ),
    },
  };

  const config = iconConfigs[name];

  if (animated) {
    return (
      <motion.div
        style={{ color: config.color }}
        animate={
          name === 'tianjin-eye'
            ? { rotate: 360 }
            : name === 'fengzheng'
            ? { y: [-5, 5, -5], rotate: [-2, 2, -2] }
            : {}
        }
        transition={
          name === 'tianjin-eye'
            ? { duration: 20, repeat: Infinity, ease: 'linear' }
            : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {config.icon}
      </motion.div>
    );
  }

  return <div style={{ color: config.color }}>{config.icon}</div>;
};

// ========================================
// 海河波浪背景组件
// ========================================

export const HaiheWaveBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32 opacity-10"
        style={{
          background: 'var(--pattern-wave)',
          backgroundSize: '40px 20px',
        }}
        animate={{
          backgroundPositionX: ['0px', '40px'],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute bottom-4 left-0 right-0 h-24 opacity-5"
        style={{
          background: 'var(--pattern-wave)',
          backgroundSize: '40px 20px',
        }}
        animate={{
          backgroundPositionX: ['40px', '0px'],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

// ========================================
// 天津之眼装饰组件
// ========================================

export const TianjinEyeDecoration: React.FC<{ size?: number; className?: string }> = ({
  size = 200,
  className = '',
}) => {
  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
    >
      {/* 外圈 */}
      <div
        className="absolute inset-0 rounded-full border-4 border-haihe-300"
        style={{ borderStyle: 'dashed' }}
      />
      {/* 内圈 */}
      <div className="absolute inset-4 rounded-full border-2 border-haihe-400" />
      {/* 中心 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-haihe-500" />
      </div>
      {/* 辐条 */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 w-1/2 h-0.5 bg-haihe-300 origin-left"
          style={{ transform: `rotate(${i * 45}deg)` }}
        />
      ))}
    </motion.div>
  );
};

// ========================================
// 津门特色展示组件
// ========================================

export const JinmenShowcase: React.FC<{
  title: string;
  description: string;
  features: Array<{ icon: React.ReactNode; text: string }>;
  className?: string;
}> = ({ title, description, features, className = '' }) => {
  return (
    <TianjinCard variant="haihe" className={`p-8 ${className}`}>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <TianjinIcon name="haihe" size={32} animated />
          <h3 className="text-2xl font-bold text-haihe-700">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-2 p-3 rounded-lg bg-white/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-haihe-500">{feature.icon}</div>
              <span className="text-sm font-medium text-gray-700">{feature.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
      <HaiheWaveBackground />
    </TianjinCard>
  );
};

// ========================================
// 老字号展示组件
// ========================================

export const LaozihaoShowcase: React.FC<{
  name: string;
  category: string;
  description: string;
  founded: string;
  className?: string;
}> = ({ name, category, description, founded, className = '' }) => {
  const categoryIcons: Record<string, React.ReactNode> = {
    '泥人张': <TianjinIcon name="nirenzhang" size={48} />,
    '杨柳青': <TianjinIcon name="yangliuqing" size={48} />,
    '风筝魏': <TianjinIcon name="fengzheng" size={48} animated />,
    '桂发祥': <TianjinIcon name="guifaxiang" size={48} />,
    '狗不理': <TianjinIcon name="goubuli" size={48} />,
  };

  return (
    <TianjinCard variant="golden" className={`p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-guifaxiang-100 to-guifaxiang-50">
          {categoryIcons[category] || <Star className="w-12 h-12 text-guifaxiang-500" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-lg font-bold text-gray-800">{name}</h4>
            <TianjinBadge variant="laozihao">老字号</TianjinBadge>
          </div>
          <p className="text-sm text-guifaxiang-600 mb-2">{category} · 始创于{founded}</p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </TianjinCard>
  );
};

// ========================================
// 导出所有组件
// ========================================

export default {
  TianjinCard,
  TianjinButton,
  TianjinBadge,
  TianjinDivider,
  TianjinIcon,
  HaiheWaveBackground,
  TianjinEyeDecoration,
  JinmenShowcase,
  LaozihaoShowcase,
};
