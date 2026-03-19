import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'entryAnimationShown';
const LANDING_KEY = 'hasVisitedLanding';
const VIDEO_PATH = '/IP动画.mp4';

interface EntryAnimationProps {
  onComplete?: () => void;
}

const EntryAnimation: React.FC<EntryAnimationProps> = ({ onComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkShouldPlay = useCallback((): boolean => {
    try {
      const hasShown = localStorage.getItem(STORAGE_KEY);
      
      const hasVisitedLanding = sessionStorage.getItem(LANDING_KEY);
      const fromLanding = new URLSearchParams(window.location.search).get('from_landing');
      
      if (hasVisitedLanding === 'true' || fromLanding === 'true') {
        sessionStorage.removeItem(LANDING_KEY);
        return true;
      }
      
      if (hasShown === 'true') {
        return false;
      }
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
    return true;
  }, []);

  const markAsShown = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      console.warn('Failed to save entry animation state:', e);
    }
  }, []);

  const handleExit = useCallback(() => {
    if (isExiting) return;

    setIsExiting(true);
    markAsShown();

    setTimeout(() => {
      setIsPlaying(false);
      setIsExiting(false);
      onComplete?.();
    }, 600);
  }, [isExiting, markAsShown, onComplete]);

  const handleVideoEnd = useCallback(() => {
    handleExit();
  }, [handleExit]);

  const handleVideoError = useCallback(() => {
    console.warn('Entry animation video failed to load');
    setHasError(true);
    handleExit();
  }, [handleExit]);

  const handleVideoCanPlay = useCallback(() => {
    setIsVideoLoaded(true);
  }, []);

  const handleSkip = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    handleExit();
  }, [handleExit]);

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
        handleExit();
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
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
        initial={{ opacity: 1 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <video
          ref={videoRef}
          src={VIDEO_PATH}
          className="w-full h-full max-w-[90vw] max-h-[90vh] object-contain"
          autoPlay
          playsInline
          onEnded={handleVideoEnd}
          onError={handleVideoError}
          onCanPlay={handleVideoCanPlay}
        />
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: isVideoLoaded && !isExiting ? 1 : 0 }}
          transition={{ delay: 1, duration: 0.3 }}
          onClick={handleSkip}
          className="absolute bottom-8 right-8 z-10 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white font-medium border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105"
          style={{ pointerEvents: isVideoLoaded && !isExiting ? 'auto' : 'none' }}
        >
          <span className="flex items-center gap-2">
            <span>跳过</span>
            <i className="fas fa-forward text-sm" />
          </span>
        </motion.button>

        <motion.div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isVideoLoaded && !isExiting ? 1 : 0, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <i className="fas fa-spinner fa-spin" />
            <span>视频加载中...</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EntryAnimation;
