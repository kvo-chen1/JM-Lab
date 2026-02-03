// src/config/animationConfig.ts

// 动画持续时间配置（毫秒）
export const ANIMATION_DURATIONS = {
  // 快速动画
  FAST: 100,
  // 标准动画
  NORMAL: 140,
  // 慢速动画
  SLOW: 210,
  // 页面过渡动画
  PAGE_TRANSITION: 245,
  // 加载动画
  LOADING: 560,
  // 滚动触发动画
  SCROLL_TRIGGERED: 420,
};

// 动画缓动函数配置
export const ANIMATION_EASINGS = {
  // 入场动画
  ENTER: 'ease-out',
  // 退场动画
  EXIT: 'ease-in',
  // 弹性动画
  SPRING: 'ease-in-out',
  // 线性动画
  LINEAR: 'linear',
  // 缓入缓出
  IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // 快速入场动画（适合短动画）
  FAST_ENTER: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  // 快速退场动画（适合短动画）
  FAST_EXIT: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
};

// 响应式动画配置
export const RESPONSIVE_ANIMATION = {
  // 移动端动画速度因子
  MOBILE_SPEED_FACTOR: 0.6,
  // 平板端动画速度因子
  TABLET_SPEED_FACTOR: 0.8,
  // 最小动画持续时间
  MIN_DURATION: 60,
  // 最大动画持续时间
  MAX_DURATION: 560,
};

// 常用动画变量
export const ANIMATION_VARIANTS = {
  // 淡入动画
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: ANIMATION_DURATIONS.NORMAL, ease: ANIMATION_EASINGS.FAST_ENTER } },
  },
  // 淡入缩放动画
  fadeInScale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: ANIMATION_DURATIONS.NORMAL, ease: ANIMATION_EASINGS.FAST_ENTER } },
  },
  // 淡入滑入动画
  fadeInSlide: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: ANIMATION_DURATIONS.NORMAL, ease: ANIMATION_EASINGS.FAST_ENTER } },
  },
  // 从下方滑入
  slideUp: {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: ANIMATION_DURATIONS.NORMAL, ease: ANIMATION_EASINGS.FAST_ENTER } },
  },
  // 从上方滑入
  slideDown: {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: ANIMATION_DURATIONS.NORMAL, ease: ANIMATION_EASINGS.FAST_ENTER } },
  },
  // 从左侧滑入
  slideLeft: {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: ANIMATION_DURATIONS.NORMAL, ease: ANIMATION_EASINGS.FAST_ENTER } },
  },
  // 从右侧滑入
  slideRight: {
    hidden: { x: 20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: ANIMATION_DURATIONS.NORMAL, ease: ANIMATION_EASINGS.FAST_ENTER } },
  },
  // 缩放动画
  scaleIn: {
    hidden: { scale: 0.95, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: ANIMATION_DURATIONS.NORMAL, ease: ANIMATION_EASINGS.FAST_ENTER } },
  },
  // 弹跳动画
  bounceIn: {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: ANIMATION_DURATIONS.SLOW,
        ease: ANIMATION_EASINGS.SPRING,
      },
    },
  },
  // 旋转进入动画
  rotateIn: {
    hidden: { rotate: -10, opacity: 0 },
    visible: {
      rotate: 0,
      opacity: 1,
      transition: {
        duration: ANIMATION_DURATIONS.SLOW,
        ease: ANIMATION_EASINGS.FAST_ENTER,
      },
    },
  },
  // 弹性进入动画
  elasticIn: {
    hidden: { scale: 0.3, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: ANIMATION_DURATIONS.SLOW,
        ease: 'spring(1, 100, 10, 40)',
      },
    },
  },
  // 拉伸进入动画
  stretchIn: {
    hidden: { scaleX: 0.8, scaleY: 1.1, opacity: 0 },
    visible: {
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      transition: {
        duration: ANIMATION_DURATIONS.SLOW,
        ease: ANIMATION_EASINGS.SPRING,
      },
    },
  },
  // 脉冲动画
  pulse: {
    hidden: { scale: 1 },
    visible: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 0.7,
        repeat: Infinity,
        ease: ANIMATION_EASINGS.ENTER,
      },
    },
  },
  // 波浪动画
  wave: {
    hidden: { y: 0 },
    visible: {
      y: [0, -5, 0, 5, 0],
      transition: {
        duration: 1.4,
        repeat: Infinity,
        ease: ANIMATION_EASINGS.LINEAR,
      },
    },
  },
  // 页面过渡动画
  pageTransition: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: ANIMATION_DURATIONS.PAGE_TRANSITION,
        ease: ANIMATION_EASINGS.FAST_ENTER,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: ANIMATION_DURATIONS.PAGE_TRANSITION * 0.7,
        ease: ANIMATION_EASINGS.FAST_EXIT,
      },
    },
  },
  // 模态框动画
  modal: {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: ANIMATION_DURATIONS.SLOW,
        ease: ANIMATION_EASINGS.FAST_ENTER,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: ANIMATION_DURATIONS.NORMAL,
        ease: ANIMATION_EASINGS.FAST_EXIT,
      },
    },
  },
  // 菜单滑入动画
  menuSlide: {
    hidden: {
      x: '100%',
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: ANIMATION_DURATIONS.SLOW,
        ease: ANIMATION_EASINGS.FAST_ENTER,
      },
    },
    exit: {
      x: '100%',
      opacity: 0,
      transition: {
        duration: ANIMATION_DURATIONS.NORMAL,
        ease: ANIMATION_EASINGS.FAST_EXIT,
      },
    },
  },
  // 工具提示动画
  tooltip: {
    hidden: {
      opacity: 0,
      y: 10,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: ANIMATION_DURATIONS.FAST,
        ease: ANIMATION_EASINGS.FAST_ENTER,
      },
    },
    exit: {
      opacity: 0,
      y: 10,
      scale: 0.9,
      transition: {
        duration: ANIMATION_DURATIONS.FAST,
        ease: ANIMATION_EASINGS.FAST_EXIT,
      },
    },
  },
  // 加载动画
  loading: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: ANIMATION_DURATIONS.LOADING,
        repeat: Infinity,
        ease: ANIMATION_EASINGS.LINEAR,
      },
    },
  },
};

// 交互反馈动画
export const INTERACTION_VARIANTS = {
  // 悬停效果
  hover: {
    scale: 1.03,
    transition: { duration: ANIMATION_DURATIONS.FAST, ease: ANIMATION_EASINGS.FAST_ENTER },
  },
  // 增强悬停效果
  hoverEnhanced: {
    scale: 1.05,
    y: -3,
    boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.2), 0 10px 10px -5px rgba(59, 130, 246, 0.1)',
    transition: { duration: ANIMATION_DURATIONS.NORMAL, ease: ANIMATION_EASINGS.FAST_ENTER },
  },
  // 微妙悬停效果
  hoverSubtle: {
    scale: 1.02,
    y: -1,
    transition: { duration: ANIMATION_DURATIONS.FAST, ease: ANIMATION_EASINGS.FAST_ENTER },
  },
  // 点击效果
  tap: {
    scale: 0.97,
    transition: { duration: ANIMATION_DURATIONS.FAST, ease: ANIMATION_EASINGS.FAST_EXIT },
  },
  // 激活效果
  active: {
    scale: 1.05,
    transition: { duration: ANIMATION_DURATIONS.FAST, ease: ANIMATION_EASINGS.FAST_ENTER },
  },
  // 按钮悬停效果
  buttonHover: {
    scale: 1.02,
    y: -2,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    transition: { duration: ANIMATION_DURATIONS.FAST, ease: ANIMATION_EASINGS.FAST_ENTER },
  },
  // 按钮点击效果
  buttonTap: {
    scale: 0.98,
    y: 0,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    transition: { duration: ANIMATION_DURATIONS.FAST, ease: ANIMATION_EASINGS.FAST_EXIT },
  },
  // 卡片悬停效果
  cardHover: {
    scale: 1.03,
    y: -6,
    boxShadow: '0 25px 35px -5px rgba(0, 0, 0, 0.1), 0 15px 15px -5px rgba(0, 0, 0, 0.04)',
    transition: { duration: ANIMATION_DURATIONS.NORMAL, ease: ANIMATION_EASINGS.FAST_ENTER },
  },
  // 增强卡片悬停效果
  cardHoverEnhanced: {
    scale: 1.04,
    y: -8,
    rotate: 0.5,
    boxShadow: '0 30px 40px -5px rgba(59, 130, 246, 0.15), 0 20px 20px -5px rgba(59, 130, 246, 0.1)',
    transition: { duration: ANIMATION_DURATIONS.SLOW, ease: ANIMATION_EASINGS.FAST_ENTER },
  },
  // 输入框聚焦效果
  inputFocus: {
    scale: 1.01,
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)',
    transition: { duration: ANIMATION_DURATIONS.FAST, ease: ANIMATION_EASINGS.FAST_ENTER },
  },
  // 链接悬停效果
  linkHover: {
    scale: 1.05,
    color: '#2563eb',
    transition: { duration: ANIMATION_DURATIONS.FAST, ease: ANIMATION_EASINGS.FAST_ENTER },
  },
  // 标签悬停效果
  tagHover: {
    scale: 1.05,
    rotate: 2,
    transition: { duration: ANIMATION_DURATIONS.FAST, ease: ANIMATION_EASINGS.FAST_ENTER },
  },
  // 滑块悬停效果
  sliderHover: {
    scale: 1.1,
    transition: { duration: ANIMATION_DURATIONS.FAST, ease: ANIMATION_EASINGS.FAST_ENTER },
  },
  // 下拉菜单展开效果
  dropdownOpen: {
    opacity: 1,
    y: 0,
    transition: { duration: ANIMATION_DURATIONS.NORMAL, ease: ANIMATION_EASINGS.FAST_ENTER },
  },
  // 下拉菜单收起效果
  dropdownClose: {
    opacity: 0,
    y: -10,
    transition: { duration: ANIMATION_DURATIONS.FAST, ease: ANIMATION_EASINGS.FAST_EXIT },
  },
};

// 滚动触发动画配置
export const SCROLL_TRIGGER_CONFIG = {
  // 视口配置
  viewport: {
    once: true,
    margin: '-100px',
    amount: 0.1,
  },
  // 过渡配置
  transition: {
    duration: ANIMATION_DURATIONS.SCROLL_TRIGGERED,
    ease: ANIMATION_EASINGS.ENTER,
  },
};

// 工具函数：根据设备类型获取动画持续时间
export const getResponsiveDuration = (duration: number, isMobile: boolean, isTablet: boolean): number => {
  if (isMobile) {
    return Math.max(RESPONSIVE_ANIMATION.MIN_DURATION, duration * RESPONSIVE_ANIMATION.MOBILE_SPEED_FACTOR);
  }
  if (isTablet) {
    return Math.max(RESPONSIVE_ANIMATION.MIN_DURATION, duration * RESPONSIVE_ANIMATION.TABLET_SPEED_FACTOR);
  }
  return Math.min(RESPONSIVE_ANIMATION.MAX_DURATION, duration);
};

// 工具函数：根据设备类型获取动画延迟
export const getResponsiveDelay = (delay: number, isMobile: boolean, isTablet: boolean): number => {
  if (isMobile) {
    return delay * RESPONSIVE_ANIMATION.MOBILE_SPEED_FACTOR;
  }
  if (isTablet) {
    return delay * RESPONSIVE_ANIMATION.TABLET_SPEED_FACTOR;
  }
  return delay;
};

// 工具函数：创建序列动画配置
export const createSequenceAnimation = (itemsCount: number, baseDelay: number = 0.1) => {
  return Array.from({ length: itemsCount }, (_, index) => ({
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: ANIMATION_DURATIONS.NORMAL,
        delay: index * baseDelay,
        ease: ANIMATION_EASINGS.ENTER,
      },
    },
  }));
};

// 导出默认配置
export default {
  durations: ANIMATION_DURATIONS,
  easings: ANIMATION_EASINGS,
  variants: ANIMATION_VARIANTS,
  interaction: INTERACTION_VARIANTS,
  scrollTrigger: SCROLL_TRIGGER_CONFIG,
  getResponsiveDuration,
  getResponsiveDelay,
  createSequenceAnimation,
};
