import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, X } from 'lucide-react';
import { OnboardingStep } from './types';
import { IconMapper } from './IconMapper';

interface TooltipProps {
  step: OnboardingStep;
  currentStep: number;
  totalSteps: number;
  isDark: boolean;
  accentColor: string;
  targetRect: DOMRect | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  step,
  currentStep,
  totalSteps,
  isDark,
  accentColor,
  targetRect,
  onNext,
  onPrev,
  onSkip,
  isFirstStep,
  isLastStep
}) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // 计算弹窗位置
  const getTooltipPosition = () => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const placement = step.placement || 'bottom';
    const gap = 28;
    const tooltipWidth = 420;
    const tooltipHeight = 300;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = targetRect.top - gap - tooltipHeight;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - gap - tooltipWidth;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + gap;
        break;
      case 'center':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      default:
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    }

    // 边界检查
    const padding = 24;
    if (left < padding) left = padding;
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipHeight > window.innerHeight - padding) {
      top = window.innerHeight - tooltipHeight - padding;
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
      transform: 'none'
    };
  };

  const position = getTooltipPosition();

  return (
    <motion.div
      className="fixed z-[10000] w-[420px] max-w-[90vw] pointer-events-auto"
      style={position}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
    >
      {/* 卡片内容 */}
      <div
        className={`relative rounded-3xl overflow-hidden ${
          isDark 
            ? 'bg-gray-900/95' 
            : 'bg-white/95'
        } shadow-2xl`}
        style={{
          boxShadow: `0 32px 64px -12px ${accentColor}30, 0 0 0 1px ${accentColor}15`
        }}
      >
        {/* 顶部渐变条 */}
        <div 
          className="h-1.5 w-full"
          style={{ 
            background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}cc 50%, ${accentColor}80 100%)` 
          }}
        />

        {/* 头部区域 */}
        <div className="p-6">
          <div className="flex items-start justify-between">
            {/* 左侧：图标和标题 */}
            <div className="flex items-center gap-4">
              {/* 图标容器 */}
              <motion.div
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}08 100%)`,
                }}
                whileHover={{ scale: 1.05, rotate: 3 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                {/* 光晕效果 */}
                <div 
                  className="absolute inset-0 opacity-60"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${accentColor}40 0%, transparent 70%)`
                  }}
                />
                <IconMapper 
                  iconName={step.icon} 
                  className="w-7 h-7 relative z-10" 
                  size={28} 
                  style={{ color: accentColor }}
                />
              </motion.div>
              
              {/* 标题区域 */}
              <div>
                {/* 步骤标签 */}
                <div 
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1.5"
                  style={{ 
                    background: `${accentColor}12`,
                    color: accentColor 
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
                  步骤 {currentStep + 1}/{totalSteps}
                </div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {step.title}
                </h3>
              </div>
            </div>

            {/* 关闭按钮 */}
            <motion.button
              onClick={onSkip}
              className={`p-2.5 rounded-xl transition-all ${
                isDark
                  ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* 副标题 */}
          {step.subtitle && (
            <motion.p 
              className={`mt-3 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {step.subtitle}
            </motion.p>
          )}
        </div>

        {/* 描述区域 */}
        <div className="px-6 pb-2">
          <div 
            className={`p-5 rounded-2xl ${isDark ? 'bg-gray-800/60' : 'bg-gray-50/80'}`}
          >
            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {step.description}
            </p>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className={`px-6 py-5 ${isDark ? 'bg-gray-800/30' : 'bg-gray-50/50'}`}>
          <div className="flex items-center justify-between">
            {/* 步骤指示器 */}
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(totalSteps, 8) }).map((_, idx) => {
                const isActive = idx === currentStep;
                const isCompleted = idx < currentStep;
                
                return (
                  <motion.div
                    key={idx}
                    className="relative h-1.5 rounded-full overflow-hidden"
                    style={{ width: isActive ? 24 : 6 }}
                    animate={{ width: isActive ? 24 : 6 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundColor: isActive || isCompleted ? accentColor : isDark ? '#374151' : '#e5e7eb',
                        opacity: isCompleted ? 0.5 : 1
                      }}
                    />
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ backgroundColor: accentColor }}
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                  </motion.div>
                );
              })}
              {totalSteps > 8 && (
                <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  +{totalSteps - 8}
                </span>
              )}
            </div>

            {/* 按钮组 */}
            <div className="flex items-center gap-3">
              {!isFirstStep && (
                <motion.button
                  onClick={onPrev}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isDark
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.02, x: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="whitespace-nowrap">上一步</span>
                </motion.button>
              )}

              <motion.button
                onClick={onNext}
                className="group flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white whitespace-nowrap transition-all"
                style={{
                  background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
                  boxShadow: `0 4px 16px ${accentColor}40, 0 0 0 1px ${accentColor}30`
                }}
                whileHover={{ 
                  scale: 1.03, 
                  boxShadow: `0 6px 24px ${accentColor}50, 0 0 0 1px ${accentColor}40` 
                }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="whitespace-nowrap">{step.primaryAction || (isLastStep ? '完成' : '下一步')}</span>
                {!isLastStep && (
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Tooltip;
