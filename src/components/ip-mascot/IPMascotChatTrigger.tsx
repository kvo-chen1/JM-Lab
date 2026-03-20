import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import AIChatBot from '@/components/AIChatBot';

interface IPMascotChatTriggerProps {
  /** 视频路径 */
  videoSrc?: string;
  /** 是否默认显示 */
  defaultVisible?: boolean;
  /** 位置 */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
}

export const IPMascotChatTrigger: React.FC<IPMascotChatTriggerProps> = ({
  videoSrc = '/AI IP.mp4',
  defaultVisible = true,
  position = 'bottom-right',
  size = 'md'
}) => {
  const { isDark } = useTheme();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 尺寸配置
  const sizeConfig = {
    sm: { container: 80, video: 72 },
    md: { container: 120, video: 110 },
    lg: { container: 160, video: 150 }
  };

  const { container, video } = sizeConfig[size];

  // 位置配置
  const positionConfig = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  // 点击打开聊天
  const handleClick = () => {
    setIsChatOpen(true);
  };

  // 关闭聊天
  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  // 当聊天打开时暂停视频
  useEffect(() => {
    if (videoRef.current) {
      if (isChatOpen) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {
          // 自动播放被阻止，忽略错误
        });
      }
    }
  }, [isChatOpen]);

  if (!defaultVisible) return null;

  return (
    <>
      {/* IP动画触发器 */}
      <AnimatePresence>
        {!isChatOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`fixed ${positionConfig[position]} z-50`}
          >
            {/* 悬浮提示 */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shadow-lg ${
                    isDark 
                      ? 'bg-slate-800 text-white border border-slate-700' 
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  点击与AI助手对话
                  {/* 小三角 */}
                  <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${
                    isDark ? 'bg-slate-800 border-r border-b border-slate-700' : 'bg-white border-r border-b border-gray-200'
                  }`} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 光晕背景 */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: isDark 
                  ? 'radial-gradient(circle, rgba(192,44,56,0.3) 0%, transparent 70%)' 
                  : 'radial-gradient(circle, rgba(192,44,56,0.2) 0%, transparent 70%)'
              }}
              animate={{ 
                scale: isHovered ? [1, 1.2, 1] : [1, 1.1, 1],
                opacity: isHovered ? 0.8 : 0.6
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* 点击区域 */}
            <motion.button
              onClick={handleClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative rounded-full overflow-hidden shadow-2xl cursor-pointer transition-all ${
                isDark 
                  ? 'shadow-pink-500/20 hover:shadow-pink-500/40' 
                  : 'shadow-pink-500/30 hover:shadow-pink-500/50'
              }`}
              style={{ width: container, height: container }}
            >
              {/* 边框光效 */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(45deg, #C02C38, #E85D75, #FFB6C1, #C02C38)',
                  backgroundSize: '400% 400%'
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />

              {/* 视频容器 */}
              <div 
                className="absolute inset-1 rounded-full overflow-hidden bg-gradient-to-br from-[#C02C38] via-[#E85D75] to-[#FFB6C1]"
                style={{ width: container - 8, height: container - 8 }}
              >
                {!videoError ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    onError={() => setVideoError(true)}
                  >
                    <source src={videoSrc} type="video/mp4" />
                  </video>
                ) : (
                  // 视频加载失败时的备用显示
                  <div className="w-full h-full flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="text-white text-2xl"
                    >
                      ✨
                    </motion.div>
                  </div>
                )}
              </div>

              {/* 悬停时的点击指示 */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/20 flex items-center justify-center"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-white text-2xl"
                    >
                      💬
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* 呼吸灯效果 */}
            <motion.div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#C02C38]"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI聊天窗口 */}
      <AIChatBot 
        initialOpen={isChatOpen} 
        onClose={handleCloseChat}
      />
    </>
  );
};

export default IPMascotChatTrigger;
