/**
 * 视频播放器组件
 * 自动播放视频，支持播放控制
 */

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  thumbnailUrl?: string;
  duration?: number;
  className?: string;
}

export function VideoPlayer({ src, thumbnailUrl, duration, className = '' }: VideoPlayerProps) {
  const { isDark } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // 组件挂载后自动播放
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // 自动播放被阻止，保持静音状态等待用户交互
        setIsPlaying(false);
      });
    }
  }, []);

  // 切换播放/暂停
  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  // 切换静音
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // 全屏
  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  // 更新进度
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // 点击进度条跳转
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newProgress = (clickX / rect.width) * 100;
      videoRef.current.currentTime = (newProgress / 100) * videoRef.current.duration;
    }
  };

  // 视频加载完成
  const handleLoadedData = () => {
    setIsLoaded(true);
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-black ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* 视频元素 - 自动播放 */}
      <video
        ref={videoRef}
        src={src}
        poster={thumbnailUrl}
        className="w-full h-full object-cover"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onLoadedData={handleLoadedData}
        muted={isMuted}
        playsInline
        autoPlay
        loop
        preload="auto"
      />

      {/* 加载中占位 */}
      {!isLoaded && thumbnailUrl && (
        <div className="absolute inset-0">
          <img
            src={thumbnailUrl}
            alt="视频封面"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* 暂停时显示播放按钮 */}
      {!isPlaying && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all hover:scale-110"
          >
            <Play className="w-8 h-8 text-gray-900 ml-1" />
          </button>
        </div>
      )}

      {/* 控制栏 */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* 进度条 */}
        <div
          className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-2"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-[#00aeec] rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 播放/暂停 */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-[#00aeec] transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>

            {/* 音量 */}
            <button
              onClick={toggleMute}
              className="text-white hover:text-[#00aeec] transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            {/* 时间显示 */}
            <span className="text-white text-xs">
              {formatTime(currentTime)} / {formatTime(videoRef.current?.duration || duration || 0)}
            </span>
          </div>

          {/* 全屏 */}
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-[#00aeec] transition-colors"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 静音提示（自动播放时显示） */}
      {isPlaying && isMuted && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs flex items-center gap-1">
          <VolumeX className="w-3 h-3" />
          静音播放
        </div>
      )}
    </div>
  );
}
