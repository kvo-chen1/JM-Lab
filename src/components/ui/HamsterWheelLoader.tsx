import { clsx } from 'clsx';
import { useState, useRef, useEffect } from 'react';

// 加载器大小类型
export type HamsterSize = 'small' | 'medium' | 'large' | 'xlarge';

// 加载器属性接口
interface HamsterWheelLoaderProps {
  size?: HamsterSize;
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

// 大小样式映射 - 容器固定尺寸，视频自适应填满容器
const sizeClasses = {
  small: 'w-16 h-16',
  medium: 'w-24 h-24',
  large: 'w-32 h-32',
  xlarge: 'w-48 h-48'
};

const VIDEO_SRC = '/hamster-loader.mp4';

/**
 * 仓鼠跑轮加载动画组件
 * 使用视频播放的仓鼠跑轮动画，视频自适应填满容器
 */
export function HamsterWheelLoader({
  size = 'medium',
  text = '加载中...',
  fullScreen = false,
  overlay = false,
  className
}: HamsterWheelLoaderProps) {
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        setVideoError(true);
      });
    }
  }, []);

  const VideoLoader = (
    <div
      className={clsx(
        'relative flex items-center justify-center overflow-hidden',
        // 设置与视频背景一致的米白色背景，让白边隐形
        'bg-[#FFF8F0]',
        sizeClasses[size],
        className
      )}
    >
      {!videoError ? (
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          onError={() => setVideoError(true)}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <div className="w-8 h-8 border-2 border-[#C02C38] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );

  // 全屏加载器
  if (fullScreen) {
    return (
      <div className={clsx(
        'fixed inset-0 flex flex-col items-center justify-center z-[70]',
        overlay ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'
      )}>
        <div className="flex flex-col items-center gap-4">
          {VideoLoader}
          {text && (
            <p className={clsx(
              'font-medium animate-pulse',
              overlay ? 'text-white' : 'text-gray-600 dark:text-gray-400'
            )}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  // 内联加载器
  return (
    <div className="flex flex-col items-center gap-3">
      {VideoLoader}
      {text && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
      )}
    </div>
  );
}

export default HamsterWheelLoader;
