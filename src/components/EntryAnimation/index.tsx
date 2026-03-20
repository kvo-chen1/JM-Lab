import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, Users, Calendar, ArrowRight, HelpCircle } from 'lucide-react';

const STORAGE_KEY = 'entryAnimationShown';
const LANDING_KEY = 'hasVisitedLanding';
const VIDEO_PATH = '/IP动画.mp4';

interface EntryAnimationProps {
  onComplete?: (choice: 'guide' | 'skip') => void;
}

// 花瓣粒子组件
const PetalParticles: React.FC = () => {
  const petals = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: 5 + Math.random() * 5,
    size: 10 + Math.random() * 15,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute text-pink-300/60"
          style={{
            left: petal.left,
            fontSize: petal.size,
          }}
          initial={{ y: -50, opacity: 0, rotate: 0 }}
          animate={{
            y: ['0vh', '100vh'],
            opacity: [0, 1, 1, 0],
            rotate: [0, 360],
            x: [0, Math.sin(petal.id) * 50, 0],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          🌸
        </motion.div>
      ))}
    </div>
  );
};

// 对话气泡组件
const SpeechBubble: React.FC<{ text: string; isVisible: boolean; position?: 'left' | 'right' }> = ({
  text,
  isVisible,
  position = 'right',
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`absolute ${position === 'right' ? 'left-full ml-4' : 'right-full mr-4'} top-0 whitespace-nowrap`}
        >
          <div className="relative bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg border border-pink-200">
            <p className="text-gray-800 text-lg font-medium">{text}</p>
            {/* 小三角 */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white/90 border-pink-200 ${
                position === 'right'
                  ? '-left-1.5 border-l border-b -rotate-45'
                  : '-right-1.5 border-r border-t -rotate-45'
              }`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 功能图标组件
const FeatureIcon: React.FC<{
  icon: React.ReactNode;
  label: string;
  delay: number;
  angle: number;
  isVisible: boolean;
}> = ({ icon, label, delay, angle, isVisible }) => {
  const radius = 180;
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{ opacity: 1, scale: 1, x, y }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.6, delay, ease: 'easeOut' }}
          className="absolute flex flex-col items-center gap-2"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white shadow-lg">
            {icon}
          </div>
          <span className="text-white text-sm font-medium bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
            {label}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const EntryAnimation: React.FC<EntryAnimationProps> = ({ onComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkShouldPlay = useCallback((): boolean => {
    try {
      // 优先检查 sessionStorage - 用于标记本次会话是否已经播放过
      const hasPlayedInSession = sessionStorage.getItem('entryAnimationPlayed');
      if (hasPlayedInSession === 'true') {
        return false;
      }

      // 检查是否从 landing 页面过来
      const hasVisitedLanding = sessionStorage.getItem(LANDING_KEY);
      const fromLanding = new URLSearchParams(window.location.search).get('from_landing');

      if (hasVisitedLanding === 'true' || fromLanding === 'true') {
        // 标记本次会话已播放，防止刷新重复触发
        sessionStorage.setItem('entryAnimationPlayed', 'true');
        // 清除 landing 标记
        sessionStorage.removeItem(LANDING_KEY);
        return true;
      }

      // 检查是否永久标记过（不再显示）
      const hasShown = localStorage.getItem(STORAGE_KEY);
      if (hasShown === 'true') {
        return false;
      }
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
    return false;
  }, []);

  const markAsShown = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      console.warn('Failed to save entry animation state:', e);
    }
  }, []);

  const handleExit = useCallback((choice: 'guide' | 'skip' = 'skip') => {
    if (isExiting) return;

    setIsExiting(true);
    markAsShown();

    setTimeout(() => {
      setIsPlaying(false);
      setIsExiting(false);
      onComplete?.(choice);
    }, 600);
  }, [isExiting, markAsShown, onComplete]);

  const handleSkip = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    handleExit('skip');
  }, [handleExit]);

  const handleVideoCanPlay = useCallback(() => {
    setIsVideoLoaded(true);
  }, []);

  const handleVideoError = useCallback(() => {
    console.warn('Entry animation video failed to load');
    setHasError(true);
  }, []);

  // 步骤控制
  useEffect(() => {
    if (!isVideoLoaded) return;

    const steps = [
      { time: 0, step: 0 },      // 开场
      { time: 2000, step: 1 },   // 自我介绍
      { time: 5000, step: 2 },   // 平台介绍
      { time: 8000, step: 3 },   // 进入按钮
    ];

    const timeouts = steps.map(({ time, step }) =>
      setTimeout(() => setCurrentStep(step), time)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [isVideoLoaded]);

  useEffect(() => {
    const shouldPlay = checkShouldPlay();
    if (shouldPlay) {
      setIsPlaying(true);
    }

    return () => {
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
      }
    };
  }, [checkShouldPlay]);

  useEffect(() => {
    if (!isPlaying || hasError) return;

    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn('Auto-play prevented or video failed:', err);
      });
    }

    skipTimeoutRef.current = setTimeout(() => {
      if (!isVideoLoaded) {
        console.warn('Video load timeout, exiting...');
        handleExit();
      }
    }, 10000);

    return () => {
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
      }
    };
  }, [isPlaying, isVideoLoaded, hasError, handleExit]);

  if (!isPlaying) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{
          opacity: isExiting ? 0 : 1,
          background: isExiting
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
            : currentStep >= 1
            ? 'linear-gradient(135deg, #fef3f2 0%, #fce7f3 50%, #f3e8ff 100%)'
            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      >
        {/* 花瓣粒子效果 */}
        {currentStep >= 1 && <PetalParticles />}

        {/* 主要内容区域 */}
        <div className="relative flex flex-col items-center justify-center">
          {/* IP形象视频 */}
          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="relative w-72 h-72 md:w-96 md:h-96">
              {/* 光晕背景 */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(192,44,56,0.3) 0%, transparent 70%)',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* 视频 */}
              <video
                ref={videoRef}
                src={VIDEO_PATH}
                className="w-full h-full object-contain rounded-full"
                autoPlay
                loop
                muted
                playsInline
                onCanPlay={handleVideoCanPlay}
                onError={handleVideoError}
              />

              {/* 对话气泡 */}
              <SpeechBubble
                text="你好呀！我是津小脉~"
                isVisible={currentStep === 1}
                position="right"
              />
              <SpeechBubble
                text="让我带你探索津脉智坊的奇妙世界吧！"
                isVisible={currentStep === 2}
                position="right"
              />
            </div>
          </motion.div>

          {/* 功能图标环绕 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <FeatureIcon
              icon={<Wand2 size={24} />}
              label="AI创作"
              delay={0}
              angle={0}
              isVisible={currentStep === 2}
            />
            <FeatureIcon
              icon={<Users size={24} />}
              label="社区互动"
              delay={0.1}
              angle={72}
              isVisible={currentStep === 2}
            />
            <FeatureIcon
              icon={<Calendar size={24} />}
              label="精彩活动"
              delay={0.2}
              angle={144}
              isVisible={currentStep === 2}
            />
            <FeatureIcon
              icon={<Sparkles size={24} />}
              label="灵感无限"
              delay={0.3}
              angle={216}
              isVisible={currentStep === 2}
            />
            <FeatureIcon
              icon={<ArrowRight size={24} />}
              label="立即开始"
              delay={0.4}
              angle={288}
              isVisible={currentStep === 2}
            />
          </div>

          {/* 用户选择按钮 */}
          <AnimatePresence>
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="mt-8 flex flex-col items-center gap-4"
              >
                <p className="text-gray-600 text-lg mb-2">需要我带你了解一下平台功能吗？</p>
                <div className="flex gap-4">
                  {/* 开始引导按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleExit('guide')}
                    className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                  >
                    <HelpCircle size={20} />
                    <span>开始引导</span>
                  </motion.button>
                  {/* 直接进入按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleExit('skip')}
                    className="px-8 py-3 bg-white text-gray-700 font-bold rounded-full shadow-lg hover:shadow-xl border border-gray-200 hover:bg-gray-50 transition-all duration-300 flex items-center gap-2"
                  >
                    <span>直接进入</span>
                    <ArrowRight size={20} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 品牌文字 */}
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: currentStep >= 1 ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
              津脉智坊
            </h1>
            <p className="mt-2 text-gray-600 text-lg">灵感无限，创作无界</p>
          </motion.div>
        </div>

        {/* 跳过按钮 */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: isVideoLoaded && !isExiting ? 1 : 0 }}
          transition={{ delay: 1, duration: 0.3 }}
          onClick={handleSkip}
          className="absolute bottom-8 right-8 z-10 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-gray-700 font-medium border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105"
          style={{ pointerEvents: isVideoLoaded && !isExiting ? 'auto' : 'none' }}
        >
          <span className="flex items-center gap-2">
            <span>跳过</span>
            <ArrowRight size={16} />
          </span>
        </motion.button>

        {/* 加载提示 */}
        {!isVideoLoaded && !hasError && (
          <motion.div
            className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2 translate-y-32"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="flex items-center gap-3 text-gray-500">
              <div className="w-5 h-5 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-lg">加载中...</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default EntryAnimation;
