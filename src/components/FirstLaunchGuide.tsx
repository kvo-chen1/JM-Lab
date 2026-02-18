import React, { useEffect, useState, useCallback } from 'react';

// 步骤类型定义
interface GuideStep {
  title: string;
  content: string;
  image: string;
}

const FirstLaunchGuide: React.FC = () => {
  const [showGuide, setShowGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 使用useCallback优化事件处理函数
  const handleFinish = useCallback(() => {
    setShowGuide(false);
    localStorage.setItem('firstLaunch', 'false');
    localStorage.setItem('hasSeenGuide', 'true');
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setIsTransitioning(true);
      // 添加过渡动画延迟
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsTransitioning(false);
      }, 300);
    } else {
      handleFinish();
    }
  }, [currentStep, handleFinish]);

  const handleSkip = useCallback(() => {
    handleFinish();
  }, [handleFinish]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsTransitioning(false);
      }, 300);
    }
  }, [currentStep]);

  // 键盘导航支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showGuide) return;
      
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          handlePrevious();
          break;
        case 'Escape':
          e.preventDefault();
          handleSkip();
          break;
        case 'Enter':
          e.preventDefault();
          handleNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGuide, handleNext, handlePrevious, handleSkip]);

  useEffect(() => {
    // 禁用首次启动引导，因为注册登录后已有更好的引导
    // 保留组件结构以便后续可能的复用
    setShowGuide(false);
  }, []);

  const steps: GuideStep[] = [
    {
      title: '欢迎使用津脉智坊',
      content: '感谢您安装津脉智坊应用！这是一个专注于津门老字号传承与创新的共创平台。',
      image: '/icons/icon-192x192.svg'
    },
    {
      title: '探索优质内容',
      content: '浏览津门老字号的精彩作品，发现传统文化的现代魅力。',
      image: 'https://via.placeholder.com/150/2563eb/ffffff?text=探索'
    },
    {
      title: '参与共创',
      content: '发挥您的创意，参与到津门老字号的创新发展中来。',
      image: 'https://via.placeholder.com/150/2563eb/ffffff?text=共创'
    },
    {
      title: '离线使用',
      content: '应用支持离线使用，即使没有网络也能浏览已缓存的内容。',
      image: 'https://via.placeholder.com/150/2563eb/ffffff?text=离线'
    }
  ];

  if (!showGuide) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300"
      style={{ opacity: showGuide ? 1 : 0 }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-all duration-500 transform"
        style={{
          opacity: showGuide ? 1 : 0,
          transform: showGuide ? 'scale(1)' : 'scale(0.9)'
        }}
      >
        {/* 引导内容 */}
        <div className="p-6">
          {/* 步骤指示器 */}
          <div className="flex justify-center mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-1 mx-0.5 rounded-full transition-all duration-300 ease-in-out ${index === currentStep ? 'bg-blue-600 scale-y-125' : 'bg-gray-300 dark:bg-gray-600'}`}
                aria-current={index === currentStep ? 'step' : undefined}
                role="progressbar"
                aria-label={`步骤 ${index + 1} / ${steps.length}`}
              ></div>
            ))}
          </div>

          {/* 步骤内容 - 添加过渡动画 */}
          <div 
            className="text-center mb-8 transition-all duration-500 ease-in-out transform"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? 'translateX(20px)' : 'translateX(0)',
              transitionDelay: isTransitioning ? '0s' : '0.1s'
            }}
          >
            <div className="flex justify-center mb-6">
              <img
                src={steps[currentStep].image}
                alt={steps[currentStep].title}
                className="w-32 h-32 object-contain transition-transform duration-500 ease-in-out"
                style={{ transform: isTransitioning ? 'scale(0.9)' : 'scale(1)' }}
                loading="lazy"
              />
            </div>
            <h2 
              className="text-2xl font-bold text-gray-900 dark:text-white mb-3 transition-all duration-500"
              style={{ opacity: isTransitioning ? 0 : 1 }}
            >
              {steps[currentStep].title}
            </h2>
            <p 
              className="text-gray-600 dark:text-gray-400 transition-all duration-500"
              style={{ opacity: isTransitioning ? 0 : 1, transitionDelay: '0.2s' }}
            >
              {steps[currentStep].content}
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-between items-center">
            {/* 上一步按钮 */}
            {currentStep > 0 ? (
              <button
                onClick={handlePrevious}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors duration-300"
                aria-label="上一步"
              >
                上一步
              </button>
            ) : (
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors duration-300"
                aria-label="跳过"
              >
                跳过
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={currentStep === steps.length - 1 ? '完成' : '下一步'}
            >
              {currentStep === steps.length - 1 ? '完成' : '下一步'}
            </button>
          </div>
        </div>
        
        {/* 进度指示器文本 */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-500 pb-4">
          步骤 {currentStep + 1} / {steps.length}
        </div>
      </div>
    </div>
  );
};

// 使用React.memo减少不必要的重新渲染
export default React.memo(FirstLaunchGuide);
