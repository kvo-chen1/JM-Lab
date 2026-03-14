/**
 * Agent UI 动画系统
 * 定义全局动画变体和过渡效果
 */

import { Variants, Transition } from 'framer-motion';
import { easings } from './theme';

// 基础过渡配置
export const defaultTransition: Transition = {
  duration: 0.25,
  ease: easings.default,
};

export const fastTransition: Transition = {
  duration: 0.15,
  ease: easings.default,
};

export const slowTransition: Transition = {
  duration: 0.35,
  ease: easings.default,
};

export const bounceTransition: Transition = {
  duration: 0.4,
  ease: easings.bounce,
};

// 淡入动画
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    transition: fastTransition,
  },
};

// 淡入+上滑动画
export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: fastTransition,
  },
};

// 淡入+下滑动画
export const fadeInDown: Variants = {
  hidden: { 
    opacity: 0, 
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: fastTransition,
  },
};

// 淡入+左滑动画
export const fadeInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: fastTransition,
  },
};

// 淡入+右滑动画
export const fadeInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: fastTransition,
  },
};

// 缩放淡入动画
export const scaleFadeIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: fastTransition,
  },
};

// 弹入动画
export const popIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: bounceTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: fastTransition,
  },
};

// 列表项交错动画
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

// 列表项动画
export const listItem: Variants = {
  hidden: { 
    opacity: 0, 
    y: 15,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: easings.default,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: fastTransition,
  },
};

// 消息气泡动画
export const messageBubble: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: easings.out,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: fastTransition,
  },
};

// 侧边栏动画
export const sidebar: Variants = {
  hidden: { 
    x: '-100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: easings.default,
      when: 'beforeChildren',
      staggerChildren: 0.05,
    },
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: {
      duration: 0.25,
      ease: easings.in,
      when: 'afterChildren',
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

// 卡片悬停动画
export const cardHover = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    transition: fastTransition,
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.16)',
    transition: defaultTransition,
  },
  tap: {
    scale: 0.98,
    transition: fastTransition,
  },
};

// 按钮悬停动画
export const buttonHover = {
  rest: {
    scale: 1,
    transition: fastTransition,
  },
  hover: {
    scale: 1.05,
    transition: defaultTransition,
  },
  tap: {
    scale: 0.95,
    transition: fastTransition,
  },
};

// 脉冲动画（用于通知、在线状态等）
export const pulse: Variants = {
  initial: {
    scale: 1,
    opacity: 1,
  },
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.7, 1],
    transition: {
      duration: 2,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

// 闪烁动画（用于加载状态）
export const shimmer: Variants = {
  initial: {
    backgroundPosition: '-200% 0',
  },
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 1.5,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

// 旋转动画
export const spin: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

// 输入框聚焦动画
export const inputFocus = {
  rest: {
    boxShadow: '0 0 0 0 rgba(192, 44, 56, 0)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    transition: fastTransition,
  },
  focus: {
    boxShadow: '0 0 0 3px rgba(192, 44, 56, 0.2)',
    borderColor: 'rgba(192, 44, 56, 0.5)',
    transition: defaultTransition,
  },
};

// 渐变边框动画
export const gradientBorder: Variants = {
  initial: {
    backgroundPosition: '0% 50%',
  },
  animate: {
    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
    transition: {
      duration: 3,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

// 页面过渡动画
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easings.default,
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: easings.in,
    },
  },
};

// 模态框动画
export const modal: Variants = {
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
      duration: 0.3,
      ease: easings.out,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.2,
      ease: easings.in,
    },
  },
};

// 遮罩层动画
export const overlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// 工具提示动画
export const tooltip: Variants = {
  hidden: {
    opacity: 0,
    y: 5,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: easings.out,
    },
  },
  exit: {
    opacity: 0,
    y: 5,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: easings.in,
    },
  },
};

// 头像光环动画
export const avatarGlow: Variants = {
  initial: {
    boxShadow: '0 0 0 0 rgba(192, 44, 56, 0.4)',
  },
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(192, 44, 56, 0.4)',
      '0 0 0 8px rgba(192, 44, 56, 0)',
    ],
    transition: {
      duration: 1.5,
      ease: 'easeOut',
      repeat: Infinity,
    },
  },
};

// 打字指示器动画
export const typingIndicator: Variants = {
  animate: {
    y: [0, -6, 0],
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

// 导出所有动画
export const animations = {
  // 过渡配置
  defaultTransition,
  fastTransition,
  slowTransition,
  bounceTransition,
  
  // 基础动画
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleFadeIn,
  popIn,
  
  // 列表动画
  staggerContainer,
  listItem,
  
  // 组件动画
  messageBubble,
  sidebar,
  cardHover,
  buttonHover,
  inputFocus,
  
  // 特效动画
  pulse,
  shimmer,
  spin,
  gradientBorder,
  avatarGlow,
  typingIndicator,
  
  // 页面/模态框动画
  pageTransition,
  modal,
  overlay,
  tooltip,
};

export default animations;
