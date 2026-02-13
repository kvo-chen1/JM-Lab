import { useState, useEffect, useCallback, useRef } from 'react';

export interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  targetPath: string;
  targetId?: string | null;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'fullscreen';
  action?: string;
  tips?: string[];
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '欢迎来到 AI 共创平台',
    subtitle: '开启您的创意之旅',
    description: '在这里，AI 将成为您的创作伙伴。无论是设计、写作还是灵感探索，我们都为您提供强大的工具和活跃的社区。',
    icon: 'Sparkles',
    targetPath: '/dashboard',
    placement: 'fullscreen',
    action: '开始探索',
    tips: ['AI 辅助创作', '社区灵感共享', '数据驱动成长']
  },
  {
    id: 'create',
    title: '一键开始创作',
    subtitle: '释放无限创意',
    description: '点击"开始创作"进入创作工坊，使用 AI 工具生成专属作品。支持图文、设计、品牌等多种创作模式。',
    icon: 'Wand2',
    targetPath: '/dashboard',
    targetId: 'guide-create-btn',
    placement: 'bottom',
    action: '去试试',
    tips: ['多种创作模式', 'AI 智能生成', '实时预览效果']
  },
  {
    id: 'square',
    title: '发现灵感',
    subtitle: '津脉广场',
    description: '浏览社区精选作品，关注热门标签，与创作者互动交流。在这里找到属于您的创作灵感。',
    icon: 'Compass',
    targetPath: '/square',
    targetId: 'guide-square-search',
    placement: 'bottom',
    action: '探索更多',
    tips: ['热门作品推荐', '标签筛选', '关注创作者']
  },
  {
    id: 'community',
    title: '加入社区',
    subtitle: '连接创作者',
    description: '参与话题讨论，分享创作心得，结识志同道合的朋友。社区是您成长的加速器。',
    icon: 'Users',
    targetPath: '/community',
    targetId: 'guide-community-feed',
    placement: 'center',
    action: '下一步',
    tips: ['话题讨论', '作品点评', '活动参与']
  },
  {
    id: 'analytics',
    title: '数据洞察',
    subtitle: '了解您的成长',
    description: '查看作品数据、互动统计和成就徽章。数据帮助您更好地了解受众，优化创作方向。',
    icon: 'BarChart3',
    targetPath: '/analytics',
    targetId: 'guide-analytics-chart',
    placement: 'top',
    action: '查看数据',
    tips: ['作品数据分析', '互动趋势', '成就系统']
  },
  {
    id: 'complete',
    title: '个性化设置',
    subtitle: '打造专属空间',
    description: '设置主题、管理账户、自定义偏好。让平台成为您最舒适的创作环境。',
    icon: 'Settings',
    targetPath: '/settings',
    targetId: 'guide-settings-theme',
    placement: 'right',
    action: '完成引导',
    tips: ['主题切换', '账户管理', '通知设置']
  }
];

interface UseOnboardingOptions {
  userId?: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function useOnboarding(options: UseOnboardingOptions = {}) {
  const { userId, onComplete, onSkip } = options;
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const steps = ONBOARDING_STEPS;
  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // 检查是否已完成引导
  useEffect(() => {
    if (userId) {
      const key = `onboarding_completed_${userId}`;
      const completed = localStorage.getItem(key) === 'true';
      setIsCompleted(completed);
    }
  }, [userId]);

  const startOnboarding = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
    setIsCompleted(false);
    setDirection('next');
  }, []);

  const closeOnboarding = useCallback(() => {
    setIsOpen(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setDirection('next');
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setDirection('prev');
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipOnboarding = useCallback(() => {
    closeOnboarding();
    if (userId) {
      localStorage.setItem(`onboarding_completed_${userId}`, 'true');
    }
    setIsCompleted(true);
    onSkip?.();
  }, [closeOnboarding, userId, onSkip]);

  const completeOnboarding = useCallback(() => {
    closeOnboarding();
    if (userId) {
      localStorage.setItem(`onboarding_completed_${userId}`, 'true');
    }
    setIsCompleted(true);
    onComplete?.();
  }, [closeOnboarding, userId, onComplete]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setDirection(stepIndex > currentStep ? 'next' : 'prev');
      setCurrentStep(stepIndex);
    }
  }, [currentStep, steps.length]);

  const resetOnboarding = useCallback(() => {
    if (userId) {
      localStorage.removeItem(`onboarding_completed_${userId}`);
    }
    setIsCompleted(false);
    setCurrentStep(0);
  }, [userId]);

  // 定位目标元素
  const locateTarget = useCallback((targetId?: string | null) => {
    if (!targetId) {
      setTargetRect(null);
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    let attempts = 0;
    const maxAttempts = 20;

    const findTarget = () => {
      const element = document.getElementById(targetId);
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

    // 立即尝试一次
    if (findTarget()) return;

    // 使用 interval 重试
    intervalRef.current = setInterval(() => {
      attempts++;
      if (findTarget() || attempts >= maxAttempts) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (attempts >= maxAttempts) {
          setTargetRect(null);
          setIsLocating(false);
        }
      }
    }, 200);
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isOpen,
    currentStep,
    currentStepData,
    isCompleted,
    isFirstStep,
    isLastStep,
    progress,
    targetRect,
    isLocating,
    direction,
    steps,
    startOnboarding,
    closeOnboarding,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
    goToStep,
    resetOnboarding,
    locateTarget,
    setTargetRect
  };
}

export default useOnboarding;
