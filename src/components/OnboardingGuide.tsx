import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useGuide } from '@/contexts/GuideContext';

// 步骤配置 - 保持原有的10步结构
const STEPS = [
  { 
    title: '欢迎加入 AI 共创平台', 
    desc: '我们将带你快速了解平台核心功能，开启你的创作之旅。', 
    icon: 'rocket',
    targetPath: '/dashboard',
    primaryText: '开始探索',
    targetId: null
  },
  { 
    title: '一键开始创作', 
    desc: '点击这里的"开始创作"按钮，即可进入创作工坊，使用强大的 AI 工具生成您的专属作品。', 
    icon: 'magic',
    targetPath: '/dashboard',
    primaryText: '去试试',
    targetId: 'guide-step-dashboard-create',
    placement: 'bottom'
  },
  { 
    title: '丰富的创作工具', 
    desc: '在这里切换不同的创作模式：设计工坊、作品之心、品牌向导等，满足各种创作需求。', 
    icon: 'palette',
    targetPath: '/create',
    primaryText: '下一步',
    targetId: 'guide-step-create-nav',
    placement: 'bottom'
  },
  { 
    title: '强大的工具箱', 
    desc: '左侧工具栏提供了各种专业设计工具，点击即可切换，助您高效创作。', 
    icon: 'tools',
    targetPath: '/create',
    primaryText: '下一步',
    targetId: 'guide-step-create-sidebar',
    placement: 'right'
  },
  { 
    title: '创意画布', 
    desc: '这是您的主要工作区域，您的所有创意都将在这里实时呈现。', 
    icon: 'paint-brush',
    targetPath: '/create',
    primaryText: '下一步',
    targetId: 'guide-step-create-canvas',
    placement: 'center'
  },
  { 
    title: '参数配置', 
    desc: '在右侧属性面板，您可以调整当前工具的各项参数，精细化打磨您的设计。', 
    icon: 'sliders-h',
    targetPath: '/create',
    primaryText: '去探索',
    targetId: 'guide-step-create-properties',
    placement: 'left'
  },
  { 
    title: '发现灵感', 
    desc: '在津脉广场，您可以搜索感兴趣的内容，或从热门标签中寻找创作灵感。', 
    icon: 'search',
    targetPath: '/square',
    primaryText: '下一步',
    targetId: 'guide-step-explore-search',
    placement: 'bottom'
  },
  { 
    title: '热门标签', 
    desc: '点击热门标签，快速筛选出特定风格的优秀作品，发现更多精彩。', 
    icon: 'tags',
    targetPath: '/square',
    primaryText: '看报表',
    targetId: 'guide-step-explore-tags',
    placement: 'bottom'
  },
  { 
    title: '数据洞察', 
    desc: '这里展示了您的核心数据图表。您可以直观地看到作品的浏览量、点赞趋势等，助您优化创作方向。', 
    icon: 'chart-line',
    targetPath: '/analytics',
    primaryText: '看报表',
    targetId: 'guide-step-analytics-chart',
    placement: 'top'
  },
  { 
    title: '个性化设置', 
    desc: '在这里可以切换主题颜色、开启深色模式，打造您最舒适的创作环境。', 
    icon: 'cog',
    targetPath: '/settings',
    primaryText: '完成',
    targetId: 'guide-step-settings-theme',
    placement: 'right'
  },
];

export default function OnboardingGuide() {
  const { isDark, theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    isOpen, 
    currentStep, 
    isCompleted, 
    nextStep, 
    prevStep, 
    skipGuide, 
    finishGuide 
  } = useGuide();
  
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const guideRef = useRef<HTMLDivElement>(null);

  // 主题样式映射
  const themeStyles: Record<string, { accent: string; text: string; lightBg: string; border: string; shadow: string; stroke: string; progressBar: string; progressBg: string }> = {
    light: {
      accent: 'bg-blue-600 hover:bg-blue-700',
      text: 'text-blue-600',
      lightBg: 'bg-blue-100',
      border: 'border-blue-200',
      shadow: 'shadow-blue-500/30',
      stroke: '#3b82f6',
      progressBar: 'bg-blue-500',
      progressBg: 'bg-blue-200'
    },
    dark: {
      accent: 'bg-blue-600 hover:bg-blue-700',
      text: 'text-blue-400',
      lightBg: 'bg-blue-900/30',
      border: 'border-blue-800',
      shadow: 'shadow-blue-500/30',
      stroke: '#3b82f6',
      progressBar: 'bg-blue-500',
      progressBg: 'bg-blue-800'
    },
    blue: {
      accent: 'bg-blue-600 hover:bg-blue-700',
      text: 'text-blue-600',
      lightBg: 'bg-blue-100',
      border: 'border-blue-200',
      shadow: 'shadow-blue-500/30',
      stroke: '#3b82f6',
      progressBar: 'bg-blue-500',
      progressBg: 'bg-blue-200'
    },
    green: {
      accent: 'bg-green-600 hover:bg-green-700',
      text: 'text-green-600',
      lightBg: 'bg-green-100',
      border: 'border-green-200',
      shadow: 'shadow-green-500/30',
      stroke: '#22c55e',
      progressBar: 'bg-green-500',
      progressBg: 'bg-green-200'
    },
    pixel: {
      accent: 'bg-purple-600 hover:bg-purple-700',
      text: 'text-purple-600',
      lightBg: 'bg-purple-100',
      border: 'border-purple-200',
      shadow: 'shadow-purple-500/30',
      stroke: '#9333ea',
      progressBar: 'bg-purple-500',
      progressBg: 'bg-purple-200'
    },
    tianjin: {
      accent: 'bg-[#1E5F8E] hover:bg-[#164a6e]',
      text: 'text-[#1E5F8E]',
      lightBg: 'bg-[#1E5F8E]/10',
      border: 'border-[#1E5F8E]/20',
      shadow: 'shadow-[#1E5F8E]/30',
      stroke: '#1E5F8E',
      progressBar: 'bg-[#1E5F8E]',
      progressBg: 'bg-[#1E5F8E]/30'
    }
  };

  const currentStyle = themeStyles[theme as string] || themeStyles.light;

  // 监听步骤变化，自动跳转路由并定位元素
  useEffect(() => {
    if (isOpen && !isCompleted) {
      const stepConfig = STEPS[currentStep];
      
      // 1. 处理路由跳转
      if (stepConfig && location.pathname !== stepConfig.targetPath) {
        navigate(stepConfig.targetPath);
        setIsLocating(true);
        
        // 路由跳转后延迟定位，确保页面完全渲染
        const timer = setTimeout(() => {
          const findTarget = () => {
            if (!stepConfig.targetId) {
              setTargetRect(null);
              setIsLocating(false);
              return true;
            }

            const element = document.getElementById(stepConfig.targetId);
            if (element) {
              const rect = element.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                setTargetRect(rect);
                setIsLocating(false);
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return true;
              }
            }
            return false;
          };

          // 尝试寻找元素（带有重试机制，应对动态加载）
          let attempts = 0;
          const maxAttempts = 15;
          const interval = setInterval(() => {
            attempts++;
            if (findTarget() || attempts >= maxAttempts) {
              clearInterval(interval);
              if (attempts >= maxAttempts && stepConfig.targetId) {
                setTargetRect(null); 
                setIsLocating(false);
              }
            }
          }, 200);
        }, 500);

        return () => clearTimeout(timer);
      }

      // 2. 定位目标元素
      const findTarget = () => {
        if (!stepConfig.targetId) {
          setTargetRect(null);
          setIsLocating(false);
          return true;
        }

        const element = document.getElementById(stepConfig.targetId);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setTargetRect(rect);
            setIsLocating(false);
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return true;
          }
        }
        return false;
      };

      setIsLocating(true);
      let attempts = 0;
      const maxAttempts = 15;
      const interval = setInterval(() => {
        attempts++;
        if (findTarget() || attempts >= maxAttempts) {
          clearInterval(interval);
          if (attempts >= maxAttempts && stepConfig.targetId) {
            setTargetRect(null); 
            setIsLocating(false);
          }
        }
      }, 200);

      return () => clearInterval(interval);
    }
  }, [currentStep, isOpen, isCompleted, location.pathname, navigate]);

  // 窗口大小改变时重新计算位置
  useEffect(() => {
    const handleResize = () => {
      const stepConfig = STEPS[currentStep];
      if (stepConfig?.targetId) {
        const element = document.getElementById(stepConfig.targetId);
        if (element) {
          setTargetRect(element.getBoundingClientRect());
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      nextStep();
    } else {
      onComplete();
    }
  };

  const onComplete = () => {
    toast.success(
      <div className="flex items-center space-x-2">
        <i className="fas fa-trophy text-yellow-400 text-xl" />
        <div>
          <div className="font-bold">新手引导已完成！</div>
          <div className="text-sm opacity-80">获得 50 积分奖励</div>
        </div>
      </div>
    );
    finishGuide();
  };

  if (!isOpen) return null;

  const currentStepData = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  
  // 计算 Popover 位置
  const getPopoverStyle = () => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed' as const,
        maxWidth: '480px',
        width: '90%'
      };
    }

    const placement = currentStepData.placement || 'bottom';
    const gap = 16;
    const popoverWidth = Math.min(420, window.innerWidth * 0.9);
    const popoverHeight = 260;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = targetRect.top - gap - popoverHeight;
        left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
        if (top < 10) {
          top = targetRect.bottom + gap;
        }
        break;
        
      case 'bottom':
        top = targetRect.bottom + gap;
        left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
        if (top + popoverHeight > window.innerHeight) {
          top = targetRect.top - gap - popoverHeight;
        }
        break;
        
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (popoverHeight / 2);
        left = targetRect.left - gap - popoverWidth;
        if (left < 10) {
          left = targetRect.right + gap;
        }
        break;
        
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (popoverHeight / 2);
        left = targetRect.right + gap;
        if (left + popoverWidth > window.innerWidth) {
          left = targetRect.left - gap - popoverWidth;
        }
        break;

      case 'center':
        top = targetRect.top + (targetRect.height / 2) - (popoverHeight / 2);
        left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
        break;
        
      default:
        top = targetRect.bottom + gap;
        left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
    }

    // 屏幕边界修正
    if (left < 10) left = 10;
    if (left + popoverWidth > window.innerWidth - 10) left = window.innerWidth - popoverWidth - 10;
    if (top < 10) top = 10;
    if (top + popoverHeight > window.innerHeight - 10) top = window.innerHeight - popoverHeight - 10;

    return {
      top: `${top}px`,
      left: `${left}px`,
      position: 'fixed' as const,
      width: `${popoverWidth}px`,
      maxWidth: '90vw'
    };
  };

  const popoverStyle = getPopoverStyle();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* SVG 遮罩层 */}
        <motion.svg
          className="absolute inset-0 w-full h-full pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <defs>
            <mask id="guide-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 6}
                  y={targetRect.top - 6}
                  width={targetRect.width + 12}
                  height={targetRect.height + 12}
                  rx="10"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          {/* 半透明背景 */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#guide-mask)"
          />
          
          {/* 高亮框边框 */}
          {targetRect && (
            <motion.rect
              x={targetRect.left - 6}
              y={targetRect.top - 6}
              width={targetRect.width + 12}
              height={targetRect.height + 12}
              rx="10"
              fill="transparent"
              stroke={currentStyle.stroke}
              strokeWidth="3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          )}
        </motion.svg>

        {/* 引导卡片 */}
        <motion.div
          key={currentStep}
          className="pointer-events-auto absolute flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={popoverStyle as any}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* 卡片主体 - 使用毛玻璃效果 */}
          <div className={`relative flex flex-col rounded-2xl overflow-hidden ${
            isDark ? 'bg-gray-800/95' : 'bg-white/95'
          } backdrop-blur-md border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            
            {/* 顶部渐变条 */}
            <div className={`h-1 w-full ${currentStyle.progressBar}`} />

            {/* 装饰性箭头 */}
            {targetRect && (
              <div 
                className={`absolute w-3 h-3 transform rotate-45 ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                }`}
                style={(() => {
                  const placement = currentStepData.placement || 'bottom';
                  switch (placement) {
                    case 'top':
                      return { bottom: '-6px', left: '50%', transform: 'translateX(-50%) rotate-45' };
                    case 'bottom':
                      return { top: '-6px', left: '50%', transform: 'translateX(-50%) rotate-45' };
                    case 'left':
                      return { right: '-6px', top: '50%', transform: 'translateY(-50%) rotate-45' };
                    case 'right':
                      return { left: '-6px', top: '50%', transform: 'translateY(-50%) rotate-45' };
                    default:
                      return { top: '-6px', left: '50%', transform: 'translateX(-50%) rotate-45' };
                  }
                })()}
              />
            )}

            {/* 头部区域 */}
            <div className="flex items-center justify-between p-5 pb-3">
              <div className="flex items-center space-x-3">
                <span className={`flex items-center justify-center w-10 h-10 rounded-xl ${currentStyle.lightBg} ${currentStyle.text} font-bold text-lg shadow-sm`}>
                  <i className={`fas fa-${currentStepData.icon}`}></i>
                </span>
                <div>
                  <span className={`text-xs font-semibold ${currentStyle.text} uppercase tracking-wider`}>
                    步骤 {currentStep + 1}/{STEPS.length}
                  </span>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {currentStepData.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={skipGuide}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <i className="fas fa-times" />
              </button>
            </div>

            {/* 内容区域 */}
            <div className="px-5 pb-5">
              <p className={`text-sm leading-relaxed mb-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {currentStepData.desc}
              </p>

              {/* 进度条 */}
              <div className="mb-5">
                <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                  <motion.div 
                    className={`h-full ${currentStyle.progressBar} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    进度 {Math.round(progress)}%
                  </span>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {STEPS.length - currentStep - 1} 步剩余
                  </span>
                </div>
              </div>

              {/* 按钮区域 */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  {STEPS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {}}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentStep 
                          ? `w-6 ${currentStyle.progressBar}` 
                          : idx < currentStep 
                            ? `w-1.5 ${currentStyle.progressBg}` 
                            : `w-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`
                      }`}
                    />
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  {currentStep > 0 && (
                    <motion.button
                      onClick={prevStep}
                      className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                        isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <i className="fas fa-arrow-left mr-1" />
                      上一步
                    </motion.button>
                  )}
                  <motion.button
                    onClick={handleNext}
                    className={`px-5 py-2 text-sm font-medium text-white ${currentStyle.accent} rounded-xl shadow-lg ${currentStyle.shadow} transition-all`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {currentStepData.primaryText}
                    <i className={`fas fa-${currentStep === STEPS.length - 1 ? 'check' : 'arrow-right'} ml-1`} />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 跳过引导按钮 */}
        <motion.button
          onClick={skipGuide}
          className={`fixed bottom-6 left-6 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            isDark 
              ? 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700/80' 
              : 'bg-white/80 text-gray-600 hover:text-gray-900 hover:bg-white'
          } backdrop-blur-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <i className="fas fa-fast-forward mr-2" />
          跳过引导
        </motion.button>

        {/* 键盘提示 */}
        <motion.div
          className={`fixed bottom-6 right-6 hidden md:flex items-center gap-4 text-xs ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <span className="flex items-center gap-1">
            <kbd className={`px-2 py-1 rounded font-mono text-xs ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>←</kbd>
            <kbd className={`px-2 py-1 rounded font-mono text-xs ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>→</kbd>
            导航
          </span>
          <span className="flex items-center gap-1">
            <kbd className={`px-2 py-1 rounded font-mono text-xs ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>ESC</kbd>
            跳过
          </span>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
