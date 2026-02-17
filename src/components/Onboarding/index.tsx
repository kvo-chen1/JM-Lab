import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useGuide } from '@/contexts/GuideContext';
import { onboardingConfig } from './config';
import { WelcomeScreen } from './WelcomeScreen';
import { Spotlight } from './Spotlight';
import { Tooltip } from './Tooltip';

const Onboarding: React.FC = () => {
  const { isDark, theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, currentStep, isCompleted, nextStep, prevStep, skipGuide, finishGuide } = useGuide();
  
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const steps = onboardingConfig.steps;
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  
  // 根据主题获取强调色
  const getAccentColor = () => {
    const colors: Record<string, string> = {
      light: '#3b82f6',
      dark: '#3b82f6',
      blue: '#3b82f6',
      green: '#22c55e',
      pixel: '#9333ea',
      tianjin: '#1E5F8E'
    };
    return colors[theme] || colors.light;
  };

  const accentColor = getAccentColor();

  // 查找目标元素
  const findTargetElement = useCallback((targetId: string | null | undefined): DOMRect | null => {
    if (!targetId) return null;
    const element = document.getElementById(targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return rect;
      }
    }
    return null;
  }, []);

  // 当步骤变化时，跳转到对应页面并定位目标元素
  useEffect(() => {
    if (!isOpen || isCompleted || !currentStepData) return;

    const targetPath = currentStepData.targetPath;
    const targetId = currentStepData.targetId;

    // 如果当前不在目标页面，先跳转
    if (location.pathname !== targetPath) {
      setIsLoading(true);
      navigate(targetPath);
      return; // 等待页面加载完成后再定位
    }

    // 在目标页面上定位元素
    setIsLoading(true);
    let attempts = 0;
    const maxAttempts = 20;
    
    const interval = setInterval(() => {
      attempts++;
      const rect = findTargetElement(targetId);
      
      if (rect) {
        setTargetRect(rect);
        setIsLoading(false);
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        setTargetRect(null);
        setIsLoading(false);
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [currentStep, isOpen, isCompleted, location.pathname, navigate, currentStepData, findTargetElement]);

  // 窗口大小改变时重新计算位置
  useEffect(() => {
    const handleResize = () => {
      if (currentStepData?.targetId) {
        const rect = findTargetElement(currentStepData.targetId);
        if (rect) setTargetRect(rect);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [currentStepData, findTargetElement]);

  // 键盘导航
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (!isFirstStep) prevStep();
          break;
        case 'Escape':
          e.preventDefault();
          handleSkip();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFirstStep]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      nextStep();
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      prevStep();
    }
  };

  const handleSkip = () => {
    skipGuide();
    toast.info('已跳过新手引导，您可以在设置中重新开启');
  };

  const handleComplete = () => {
    finishGuide();
    toast.success(
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
          <i className="fas fa-trophy text-white text-lg" />
        </div>
        <div>
          <div className="font-bold text-base">恭喜完成新手引导！</div>
          <div className="text-sm opacity-80">
            获得 {onboardingConfig.completionReward?.points || 100} 积分奖励
          </div>
        </div>
      </div>,
      { duration: 5000 }
    );
  };

  if (!isOpen || isCompleted) return null;
  if (!currentStepData) return null;

  // 全屏步骤（欢迎和完成页面）
  if (currentStepData.placement === 'fullscreen') {
    return (
      <WelcomeScreen
        isDark={isDark}
        accentColor={accentColor}
        step={currentStepData}
        currentStep={currentStep}
        totalSteps={steps.length}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
      />
    );
  }

  // 普通步骤（带高亮和提示）
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <AnimatePresence>
        {/* 遮罩和高亮 - 聚光灯效果 */}
        <Spotlight
          targetRect={targetRect}
          isDark={isDark}
          accentColor={accentColor}
          showPulse={currentStepData.showPulse}
        />

        {/* 提示卡片 */}
        <Tooltip
          step={currentStepData}
          currentStep={currentStep}
          totalSteps={steps.length}
          isDark={isDark}
          accentColor={accentColor}
          targetRect={targetRect}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
        />

        {/* 跳过按钮 */}
        <motion.button
          onClick={handleSkip}
          className={`fixed bottom-6 left-6 px-4 py-2 rounded-full text-sm font-medium pointer-events-auto transition-all ${
            isDark
              ? 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700/80'
              : 'bg-white/80 text-gray-600 hover:text-gray-900 hover:bg-white'
          } backdrop-blur-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <i className="fas fa-fast-forward mr-2" />
          跳过引导
        </motion.button>

        {/* 键盘提示 */}
        <motion.div
          className={`fixed bottom-6 right-6 hidden md:flex items-center gap-4 text-xs pointer-events-auto ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.4 }}
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
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;
