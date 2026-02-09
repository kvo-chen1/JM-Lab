import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContext } from './authContext';
import { useNavigate, useLocation } from 'react-router-dom';
import eventBus from '@/lib/eventBus';

export interface GuideStep {
  title: string;
  content: string;
  targetPath: string;
  selector?: string;
}

interface GuideContextType {
  isOpen: boolean;
  currentStep: number;
  isCompleted: boolean;
  startGuide: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipGuide: () => void;
  finishGuide: () => void;
}

const GuideContext = createContext<GuideContextType | undefined>(undefined);

export const GuideProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // 初始化加载完成状态
  useEffect(() => {
    if (user?.id) {
      const key = `guide_completed_${user.id}`;
      const completed = localStorage.getItem(key) === 'true';
      setIsCompleted(completed);
    }
  }, [user]);

  const startGuide = () => {
    setCurrentStep(0);
    setIsOpen(true);
    setIsCompleted(false);
  };

  // 监听注册成功和登录成功事件
  useEffect(() => {
    // 监听注册成功事件
    const registerListenerId = eventBus.subscribe('auth:register', () => {
      console.log('Detected new user registration, starting guide...');
      setTimeout(() => {
        startGuide();
      }, 500);
    });

    // 监听登录成功事件，检查是否需要重新触发新手引导
    const loginListenerId = eventBus.subscribe('auth:login', (data: any) => {
      console.log('Detected user login, checking guide status...', data);
      
      // 检查是否需要显示新手引导：
      // 1. 是新用户 (isNewUser = true)
      // 2. 或者 localStorage 中没有完成标记
      if (user?.id) {
        const key = `guide_completed_${user.id}`;
        const completedInStorage = localStorage.getItem(key) === 'true';
        const isNewUser = data?.user?.isNewUser || false;
        
        // 如果是新用户且未完成引导，显示引导
        if (isNewUser && !completedInStorage) {
          console.log('New user detected and guide not completed, starting guide...');
          setTimeout(() => {
            startGuide();
          }, 1000); // 延迟1秒，确保页面完全加载
        } else if (!completedInStorage) {
          console.log('Guide not completed, but user is not new. Skipping auto-start.');
        } else {
          console.log('Guide already completed.');
        }
      }
    });

    return () => {
      eventBus.unsubscribe('auth:register', registerListenerId);
      eventBus.unsubscribe('auth:login', loginListenerId);
    };
  }, [user]);

  const nextStep = () => {
     setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const skipGuide = () => {
    setIsOpen(false);
    if (user?.id) {
      localStorage.setItem(`guide_completed_${user.id}`, 'true');
    }
    setIsCompleted(true);
  };

  const finishGuide = () => {
    setIsOpen(false);
    if (user?.id) {
      localStorage.setItem(`guide_completed_${user.id}`, 'true');
    }
    setIsCompleted(true);
  };

  return (
    <GuideContext.Provider value={{
      isOpen,
      currentStep,
      isCompleted,
      startGuide,
      nextStep,
      prevStep,
      skipGuide,
      finishGuide
    }}>
      {children}
    </GuideContext.Provider>
  );
};

export const useGuide = () => {
  const context = useContext(GuideContext);
  if (!context) {
    throw new Error('useGuide must be used within a GuideProvider');
  }
  return context;
};
