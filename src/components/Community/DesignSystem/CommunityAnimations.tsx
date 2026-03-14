// 津脉社区动画组件库
// 提供统一的动画效果和过渡组件

import React, { ReactNode } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// 页面过渡动画
interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 淡入动画
interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export const FadeIn: React.FC<FadeInProps> = ({ 
  children, 
  delay = 0, 
  duration = 0.5,
  className = '',
  direction = 'up'
}) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: 20 };
      case 'down': return { y: -20 };
      case 'left': return { x: 20 };
      case 'right': return { x: -20 };
      default: return {};
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...getInitialPosition() }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ 
        duration,
        delay,
        ease: [0.4, 0, 0.2, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 缩放进入动画
interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const ScaleIn: React.FC<ScaleInProps> = ({ 
  children, 
  delay = 0, 
  duration = 0.3,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration,
        delay,
        ease: [0.175, 0.885, 0.32, 1.275] // spring easing
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 列表项动画
interface ListItemProps {
  children: ReactNode;
  index?: number;
  className?: string;
}

export const ListItem: React.FC<ListItemProps> = ({ 
  children, 
  index = 0,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 卡片悬停动画
interface HoverCardProps {
  children: ReactNode;
  className?: string;
  scale?: number;
  y?: number;
}

export const HoverCard: React.FC<HoverCardProps> = ({ 
  children, 
  className = '',
  scale = 1.02,
  y = -4
}) => {
  return (
    <motion.div
      whileHover={{ 
        scale,
        y,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 按钮点击动画
interface AnimatedButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  children, 
  className = '',
  onClick,
  disabled = false,
  type = 'button'
}) => {
  return (
    <motion.button
      type={type}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </motion.button>
  );
};

// 骨架屏动画
interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem'
}) => {
  return (
    <motion.div
      className={`bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      style={{ width, height }}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  );
};

// 脉冲动画
interface PulseProps {
  children: ReactNode;
  className?: string;
}

export const Pulse: React.FC<PulseProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 滑动面板动画
interface SlidePanelProps {
  children: ReactNode;
  isOpen: boolean;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export const SlidePanel: React.FC<SlidePanelProps> = ({ 
  children, 
  isOpen,
  direction = 'right',
  className = ''
}) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left': return { x: '-100%' };
      case 'right': return { x: '100%' };
      case 'top': return { y: '-100%' };
      case 'bottom': return { y: '100%' };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={getInitialPosition()}
          animate={{ x: 0, y: 0 }}
          exit={getInitialPosition()}
          transition={{ 
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1]
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 模态框动画
interface ModalOverlayProps {
  children: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
}

export const ModalOverlay: React.FC<ModalOverlayProps> = ({ 
  children, 
  isOpen,
  onClose,
  className = ''
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              duration: 0.2,
              ease: [0.175, 0.885, 0.32, 1.275]
            }}
            className={`fixed z-50 ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// 交错动画容器
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({ 
  children, 
  className = '',
  staggerDelay = 0.05
}) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 交错动画子项
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({ 
  children, 
  className = ''
}) => {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
};

// 无限滚动加载动画
interface InfiniteScrollLoaderProps {
  isLoading: boolean;
  hasMore: boolean;
  className?: string;
}

export const InfiniteScrollLoader: React.FC<InfiniteScrollLoaderProps> = ({ 
  isLoading,
  hasMore,
  className = ''
}) => {
  if (!isLoading && !hasMore) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="h-px w-16 bg-gray-300 dark:bg-gray-700"></div>
        <span className="mx-4 text-xs font-medium text-gray-400">已经到底啦</span>
        <div className="h-px w-16 bg-gray-300 dark:bg-gray-700"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <motion.div
          className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return null;
};

// 空状态动画
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center justify-center py-20 ${className}`}
    >
      {icon && (
        <motion.div
          initial={{ y: 10 }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-6"
        >
          {icon}
        </motion.div>
      )}
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-8 text-center max-w-xs">{description}</p>}
      {action}
    </motion.div>
  );
};

// 错误状态动画
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  message,
  onRetry,
  className = ''
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col items-center justify-center py-12 ${className}`}
    >
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
      >
        <i className="fas fa-exclamation-circle text-2xl text-red-500"></i>
      </motion.div>
      <p className="mb-4 text-base font-medium">{message}</p>
      {onRetry && (
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="px-6 py-2 rounded-full text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
        >
          重新加载
        </motion.button>
      )}
    </motion.div>
  );
};

// 导出所有动画组件
export default {
  PageTransition,
  FadeIn,
  ScaleIn,
  ListItem,
  HoverCard,
  AnimatedButton,
  Skeleton,
  Pulse,
  SlidePanel,
  ModalOverlay,
  StaggerContainer,
  StaggerItem,
  InfiniteScrollLoader,
  EmptyState,
  ErrorState,
};
