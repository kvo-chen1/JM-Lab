import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

interface IPMascotVideoLoaderProps {
  /** 是否显示 */
  isVisible: boolean;
  /** 提示文字 */
  message?: string;
  /** 进度值 0-100 */
  progress?: number;
  /** 是否显示进度条 */
  showProgress?: boolean;
  /** 视频路径 */
  videoSrc?: string;
}

export const IPMascotVideoLoader: React.FC<IPMascotVideoLoaderProps> = ({
  isVisible,
  message = 'AI正在创作中...',
  progress = 0,
  showProgress = true,
  videoSrc = '/ip创作加载.mp4'
}) => {
  const { isDark } = useTheme();
  const [videoError, setVideoError] = useState(false);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex flex-col items-center justify-center py-8 px-6 rounded-2xl ${
        isDark 
          ? 'bg-[#1E1E2E]/90 border border-[#2A2A3E]' 
          : 'bg-white/90 border border-gray-200'
      }`}
    >
      {/* 视频容器 */}
      <div className="relative w-80 h-80 mb-4 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: isDark 
              ? 'radial-gradient(circle, rgba(192,44,56,0.2) 0%, transparent 70%)' 
              : 'radial-gradient(circle, rgba(192,44,56,0.1) 0%, transparent 70%)'
          }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* 视频或备用动画 */}
        <div className="relative w-72 h-72 rounded-full overflow-hidden bg-gray-800">
          {!videoError ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              onLoadedData={() => console.log('视频加载成功:', videoSrc)}
              onError={(e) => {
                console.error('视频加载失败:', videoSrc, e);
                setVideoError(true);
              }}
            >
              <source src={videoSrc} type="video/mp4" />
              <source src="/IP动画.mp4" type="video/mp4" />
            </video>
          ) : (
            // 视频加载失败时显示IP形象静态图 + 动画效果
            <div className="w-full h-full flex items-center justify-center relative">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #C02C38 0%, #E85D75 50%, #FFB6C1 100%)'
                }}
                animate={{ 
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
              />
              <div className="absolute inset-2 rounded-full bg-gray-800 flex items-center justify-center">
                <span className="text-4xl">🎨</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 提示文字 */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`text-sm font-medium mb-3 ${
          isDark ? 'text-gray-200' : 'text-gray-700'
        }`}
      >
        {message}
      </motion.p>

      {/* 进度条 */}
      {showProgress && (
        <div className="w-full max-w-xs">
          <div className={`h-1.5 rounded-full overflow-hidden ${
            isDark ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #C02C38 0%, #E85D75 50%, #C02C38 100%)',
                backgroundSize: '200% 100%'
              }}
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.min(progress, 100)}%`,
                backgroundPosition: ['0% 0%', '100% 0%']
              }}
              transition={{ 
                width: { duration: 0.5, ease: 'easeOut' },
                backgroundPosition: { duration: 1, repeat: Infinity, ease: 'linear' }
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              生成中
            </span>
            <span className={`text-xs font-medium ${isDark ? 'text-[#E85D75]' : 'text-[#C02C38]'}`}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      )}

      {/* 装饰元素 */}
      <div className="flex items-center gap-1 mt-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: isDark ? '#E85D75' : '#C02C38' }}
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 0.8, 
              repeat: Infinity, 
              delay: i * 0.2,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default IPMascotVideoLoader;
