import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthContext } from './authContext';
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

  const startGuide = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
    setIsCompleted(false);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const skipGuide = useCallback(() => {
    setIsOpen(false);
    if (user?.id) {
      localStorage.setItem(`guide_completed_${user.id}`, 'true');
    }
    setIsCompleted(true);
  }, [user]);

  const finishGuide = useCallback(() => {
    setIsOpen(false);
    if (user?.id) {
      localStorage.setItem(`guide_completed_${user.id}`, 'true');
    }
    setIsCompleted(true);
  }, [user]);

  // 键盘导航支持
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevStep();
          break;
        case 'Escape':
          e.preventDefault();
          skipGuide();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextStep, prevStep, skipGuide]);

  // 监听注册成功和登录成功事件
  useEffect(() => {
    const registerListenerId = eventBus.on('auth:register', () => {
      console.log('Detected new user registration, starting guide...');
      setTimeout(() => {
        startGuide();
      }, 500);
    });

    const loginListenerId = eventBus.on('auth:login', (data: any) => {
      console.log('Detected user login, checking guide status...', data);
      
      if (user?.id) {
        const key = `guide_completed_${user.id}`;
        const completedInStorage = localStorage.getItem(key) === 'true';
        const isNewUser = data?.user?.isNewUser || false;
        
        if (isNewUser && !completedInStorage) {
          console.log('New user detected and guide not completed, starting guide...');
          setTimeout(() => {
            startGuide();
          }, 1000);
        }
      }
    });

    return () => {
      eventBus.off('auth:register', registerListenerId);
      eventBus.off('auth:login', loginListenerId);
    };
  }, [user, startGuide]);

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

export default GuideContext;
