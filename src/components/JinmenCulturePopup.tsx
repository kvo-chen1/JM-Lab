import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Calendar, Heart, Eye, Info, Clock, Minimize2, Maximize2 } from 'lucide-react';
import { jinmenKnowledgeData, CulturalKnowledge } from '@/data/jinmenCultureData';
import { useTheme } from '@/hooks/useTheme';
import { Link, useLocation } from 'react-router-dom';

// 生成可靠的随机图片URL作为后备
const getFallbackImage = (id: string) => {
  // 使用 Picsum Photos 生成确定性的随机图片 (基于ID)
  // 尺寸设置为 400x200 以匹配弹窗比例
  return `https://picsum.photos/seed/${id}/400/200`;
};

export default function JinmenCulturePopup() {
  const { isDark } = useTheme();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [data, setData] = useState<CulturalKnowledge | null>(null);
  const [isVisible, setIsVisible] = useState(true); // For "Don't show again today" logic
  const [imageSrc, setImageSrc] = useState<string>(''); // 图片源状态
  const [isMobile, setIsMobile] = useState(false); // 移动端检测状态
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const AUTO_CLOSE_DURATION = 5000; // 5 seconds - 加快自动关闭时间

  // 检测是否为移动端
  const checkIsMobile = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const isMobileDevice = mobileRegex.test(userAgent);
    const screenWidth = window.innerWidth;
    const isSmallScreen = screenWidth < 768; // 768px 作为平板和手机的分界
    return isMobileDevice || isSmallScreen;
  };

  useEffect(() => {
    // 检测是否为移动端
    const mobileStatus = checkIsMobile();
    setIsMobile(mobileStatus);
    
    // 如果是移动端，直接返回，不显示弹窗
    if (mobileStatus) {
      return;
    }
    
    // 路由检查：只在非公开页面显示
    // 排除登录、注册、着陆页、忘记密码等页面
    const publicPaths = ['/login', '/register', '/landing', '/forgot-password', '/'];
    if (publicPaths.includes(location.pathname) && location.pathname !== '/') {
        // 如果不是根路径但包含在publicPaths中，直接返回
        return;
    }
    
    // 如果是根路径，还需要检查是否已登录（通常根路径在App.tsx中会有重定向逻辑，这里简单处理）
    // 假设未登录用户访问根路径会被重定向到登录页，所以这里主要防范直接访问 /login 的情况

    // Check if we should show the popup
    const checkShowStatus = () => {
      // 正常逻辑开始
      const lastShown = localStorage.getItem('jinmen_popup_last_shown');
      const dontShowToday = localStorage.getItem('jinmen_popup_dont_show_today');
      
      if (dontShowToday) {
        const today = new Date().toDateString();
        if (dontShowToday === today) {
          setIsVisible(false);
          return;
        } else {
          // New day, reset
          localStorage.removeItem('jinmen_popup_dont_show_today');
        }
      }

      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      if (lastShown && (now - parseInt(lastShown) < oneHour)) {
        return; // Less than one hour, don't show
      }
      // 正常逻辑结束

      // Pick random data
      const randomIndex = Math.floor(Math.random() * jinmenKnowledgeData.length);
      const selectedData = jinmenKnowledgeData[randomIndex];
      setData(selectedData);
      // 初始化图片源：尝试使用 AI 图片，如果为空则直接用备用图
      setImageSrc(selectedData.imageUrl || getFallbackImage(selectedData.id));
      
      // Show after 3 seconds delay
      const showTime = Date.now();
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem('jinmen_popup_last_shown', showTime.toString());
      }, 3000);
      
      return () => clearTimeout(timer);
    };

    checkShowStatus();
  }, [location.pathname]); // 添加 location.pathname 作为依赖，路由变化时重新检查

  // 监听窗口大小变化，重新检测移动端状态
  useEffect(() => {
    const handleResize = () => {
      const mobileStatus = checkIsMobile();
      if (mobileStatus !== isMobile) {
        setIsMobile(mobileStatus);
        // 如果从桌面端变为移动端，关闭弹窗
        if (mobileStatus && isOpen) {
          setIsOpen(false);
          clearAutoCloseTimer();
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, isOpen]);

  // Auto-close effect
  useEffect(() => {
    if (isOpen && !isMinimized) {
      startAutoCloseTimer();
    } else {
      clearAutoCloseTimer();
    }

    return () => clearAutoCloseTimer();
  }, [isOpen, isMinimized]);

  const startAutoCloseTimer = () => {
    clearAutoCloseTimer();
    autoCloseTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, AUTO_CLOSE_DURATION);
  };

  const clearAutoCloseTimer = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearAutoCloseTimer();
  };

  const handleMouseLeave = () => {
    if (isOpen && !isMinimized) {
      startAutoCloseTimer();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    clearAutoCloseTimer();
  };

  const handleDontShowToday = () => {
    const today = new Date().toDateString();
    localStorage.setItem('jinmen_popup_dont_show_today', today);
    setIsOpen(false);
    setIsVisible(false);
    clearAutoCloseTimer();
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // 图片加载失败时的处理
  const handleImageError = () => {
    if (data && imageSrc !== getFallbackImage(data.id)) {
      // 如果当前不是备用图，则切换到备用图
      setImageSrc(getFallbackImage(data.id));
    }
  };

  if (!isVisible || !data) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed z-[9999] ${isMinimized ? 'bottom-3 right-3' : 'bottom-6 right-6'} w-full max-w-xs sm:max-w-sm`}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 500, duration: 0.2 }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className={`relative overflow-hidden rounded-xl shadow-2xl backdrop-blur-md border 
            ${isDark 
              ? 'bg-gray-900/90 border-gray-700 text-white' 
              : 'bg-white/95 border-gray-200 text-gray-800'
            } transition-all duration-300`}
          >
            {/* Header / Top Bar */}
            <div className={`flex items-center justify-between p-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  津门老字号
                </span>
                <span className="text-sm font-medium truncate max-w-[150px]">
                  {isMinimized ? data.title : '每日文化一刻'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={toggleMinimize}
                  className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                  title={isMinimized ? "展开" : "最小化"}
                >
                  {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
                <button 
                  onClick={handleClose}
                  className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                  title="关闭"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Content Body */}
            {!isMinimized && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                {/* Image Area */}
                <div className="relative h-32 sm:h-40 w-full bg-gray-100 dark:bg-gray-800 overflow-hidden group">
                  <img 
                    src={imageSrc} 
                    alt={data.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={handleImageError}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <h3 className="text-white text-lg font-bold drop-shadow-md">{data.title}</h3>
                  </div>
                  {/* Progress Bar for Auto Close */}
                  <motion.div 
                    className="absolute bottom-0 left-0 h-1 bg-red-600 z-10"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: AUTO_CLOSE_DURATION / 1000, ease: "linear" }}
                  />
                </div>

                {/* Text Content */}
                <div className="p-4 space-y-3">
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'} line-clamp-3`}>
                    {data.content}
                  </p>
                  
                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2">
                    <div className="flex gap-3">
                      <span className="flex items-center gap-1">
                        <Eye size={12} /> {data.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={12} /> {data.likes}
                      </span>
                    </div>
                    {data.source && (
                      <span className="flex items-center gap-1">
                        <Info size={12} /> {data.source}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100 dark:border-gray-800">
                    <button 
                      onClick={handleDontShowToday}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      今日不再显示
                    </button>
                    <Link 
                      to="/knowledge" 
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      了解详情 <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
