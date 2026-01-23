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

  // 监听注册成功事件
  useEffect(() => {
    const listenerId = eventBus.subscribe('auth:register', () => {
      console.log('Detected new user registration, starting guide...');
      setTimeout(() => {
        startGuide();
      }, 500);
    });

    return () => {
      eventBus.unsubscribe('auth:register', listenerId);
    };
  }, []);

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
