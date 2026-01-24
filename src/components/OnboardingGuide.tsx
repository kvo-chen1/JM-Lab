import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useGuide } from '@/contexts/GuideContext';

// 步骤配置
const STEPS = [
  { 
    title: '欢迎加入 AI 共创平台', 
    desc: '我们将带你快速了解平台核心功能，开启你的创作之旅。', 
    icon: 'rocket',
    targetPath: '/dashboard',
    primaryText: '开始探索',
    targetId: null // 第一步通常是欢迎页，居中显示
  },
  { 
    title: '一键开始创作', 
    desc: '点击这里的“开始创作”按钮，即可进入创作工坊，使用强大的 AI 工具生成您的专属作品。', 
    icon: 'magic',
    targetPath: '/dashboard',
    primaryText: '去试试',
    targetId: 'guide-step-dashboard-create',
    placement: 'bottom'
  },
  { 
    title: '丰富的创作工具', 
    desc: '在这里切换不同的创作模式：设计工坊、灵感探索、品牌向导等，满足各种创作需求。', 
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
    desc: '在探索页面，您可以搜索感兴趣的内容，或从热门标签中寻找创作灵感。', 
    icon: 'search',
    targetPath: '/explore',
    primaryText: '下一步',
    targetId: 'guide-step-explore-search',
    placement: 'bottom'
  },
  { 
    title: '热门标签', 
    desc: '点击热门标签，快速筛选出特定风格的优秀作品，发现更多精彩。', 
    icon: 'tags',
    targetPath: '/explore',
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
  const { isDark } = useTheme();
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

  // 监听步骤变化，自动跳转路由并定位元素
  useEffect(() => {
    if (isOpen && !isCompleted) {
      const stepConfig = STEPS[currentStep];
      
      // 1. 处理路由跳转
      if (stepConfig && location.pathname !== stepConfig.targetPath) {
        navigate(stepConfig.targetPath);
        // 路由跳转后，需要等待页面渲染
        setIsLocating(true);
        
        // 路由跳转后延迟定位，确保页面完全渲染
        const timer = setTimeout(() => {
          const findTarget = () => {
            if (!stepConfig.targetId) {
              setTargetRect(null); // 居中模式
              setIsLocating(false);
              return true;
            }

            const element = document.getElementById(stepConfig.targetId);
            if (element) {
              const rect = element.getBoundingClientRect();
              // 检查元素是否可见且有大小
              if (rect.width > 0 && rect.height > 0) {
                setTargetRect(rect);
                setIsLocating(false);
                // 滚动到元素位置 (留出一点边距)
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
                // 如果最终没找到，降级为居中显示，但也取消定位状态
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
          setTargetRect(null); // 居中模式
          setIsLocating(false);
          return true;
        }

        const element = document.getElementById(stepConfig.targetId);
        if (element) {
          const rect = element.getBoundingClientRect();
          // 检查元素是否可见且有大小
          if (rect.width > 0 && rect.height > 0) {
            setTargetRect(rect);
            setIsLocating(false);
            // 滚动到元素位置 (留出一点边距)
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return true;
          }
        }
        return false;
      };

      // 尝试寻找元素（带有重试机制，应对动态加载）
      setIsLocating(true);
      let attempts = 0;
      const maxAttempts = 15;
      const interval = setInterval(() => {
        attempts++;
        if (findTarget() || attempts >= maxAttempts) {
          clearInterval(interval);
          if (attempts >= maxAttempts && stepConfig.targetId) {
            // 如果最终没找到，降级为居中显示，但也取消定位状态
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
    window.addEventListener('scroll', handleResize, true); // 捕获滚动事件

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
      // 居中显示
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed' as const,
        maxWidth: '600px',
        width: '90%'
      };
    }

    const placement = currentStepData.placement || 'bottom';
    const gap = 12;
    const popoverWidth = Math.min(400, window.innerWidth * 0.8); // 自适应宽度
    const popoverHeight = 250; // 预估高度

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = targetRect.top - gap - popoverHeight;
        left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
        // 如果上方空间不足，转到底部
        if (top < 10) {
          top = targetRect.bottom + gap;
        }
        break;
        
      case 'bottom':
        top = targetRect.bottom + gap;
        left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
        // 如果下方空间不足，转到顶部
        if (top + popoverHeight > window.innerHeight) {
          top = targetRect.top - gap - popoverHeight;
        }
        break;
        
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (popoverHeight / 2); // 垂直居中
        left = targetRect.left - gap - popoverWidth;
        // 如果左侧空间不足，转到右侧
        if (left < 10) {
          left = targetRect.right + gap;
        }
        break;
        
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (popoverHeight / 2); // 垂直居中
        left = targetRect.right + gap;
        // 如果右侧空间不足，转到左侧
        if (left + popoverWidth > window.innerWidth) {
          left = targetRect.left - gap - popoverWidth;
        }
        break;

      case 'center':
        top = targetRect.top + (targetRect.height / 2) - (popoverHeight / 2);
        left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
        break;
        
      default: // bottom
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
        {/* SVG 遮罩层 - 使用 SVG 路径实现"挖孔"效果 */}
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
                  x={targetRect.left - 4}
                  y={targetRect.top - 4}
                  width={targetRect.width + 8}
                  height={targetRect.height + 8}
                  rx="8"
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
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#guide-mask)"
          />
          
          {/* 高亮框边框动画 */}
          {targetRect && (
            <motion.rect
              x={targetRect.left - 4}
              y={targetRect.top - 4}
              width={targetRect.width + 8}
              height={targetRect.height + 8}
              rx="8"
              fill="transparent"
              stroke="#ef4444" // red-500
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          )}
        </motion.svg>

        {/* 引导卡片 (Popover) */}
        <motion.div
          className={`pointer-events-auto absolute flex flex-col p-6 rounded-2xl shadow-2xl ${
            isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900'
          }`}
          style={popoverStyle as any}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* 装饰性箭头 (仅当有目标元素时显示) */}
          {targetRect && (
            <div 
              className={`absolute w-4 h-4 transform rotate-45 ${
                isDark ? 'bg-gray-800 border-l border-t border-gray-700' : 'bg-white'
              }`}
              style={(() => {
                const placement = currentStepData.placement || 'bottom';
                switch (placement) {
                  case 'top':
                    return { bottom: '-8px', left: '50%', transform: 'translateX(-50%) rotate-45' };
                  case 'bottom':
                    return { top: '-8px', left: '50%', transform: 'translateX(-50%) rotate-45' };
                  case 'left':
                    return { right: '-8px', top: '50%', transform: 'translateY(-50%) rotate-45' };
                  case 'right':
                    return { left: '-8px', top: '50%', transform: 'translateY(-50%) rotate-45' };
                  default:
                    return { top: '-8px', left: '50%', transform: 'translateX(-50%) rotate-45' };
                }
              })()}
            />
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold text-sm">
                <i className={`fas fa-${currentStepData.icon}`}></i>
              </span>
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                步骤 {currentStep + 1}/{STEPS.length}
              </span>
            </div>
            <button
              onClick={skipGuide}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              跳过
            </button>
          </div>

          <h3 className="text-xl font-bold mb-2">{currentStepData.title}</h3>
          <p className={`text-sm mb-6 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {currentStepData.desc}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
             <div className="flex space-x-1">
               {STEPS.map((_, idx) => (
                 <div 
                   key={idx} 
                   className={`h-1.5 rounded-full transition-all duration-300 ${
                     idx === currentStep 
                       ? 'w-6 bg-red-500' 
                       : idx < currentStep 
                         ? 'w-1.5 bg-red-200' 
                         : 'w-1.5 bg-gray-200 dark:bg-gray-700'
                   }`} 
                 />
               ))}
             </div>
             
             <div className="flex space-x-3">
               {currentStep > 0 && (
                 <button
                   onClick={prevStep}
                   className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                     isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                   }`}
                 >
                   上一步
                 </button>
               )}
               <button
                 onClick={handleNext}
                 className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95"
               >
                 {currentStepData.primaryText}
               </button>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
