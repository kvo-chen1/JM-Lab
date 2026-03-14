import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

// 动态导入 html2canvas
let html2canvas: typeof import('html2canvas') | null = null;
const getHtml2canvas = async () => {
  if (!html2canvas) {
    html2canvas = await import('html2canvas');
  }
  return html2canvas;
};

// 截图组件属性
interface GameScreenshotProps {
  children: React.ReactNode;
  onScreenshotGenerated?: (dataUrl: string) => void;
  className?: string;
}

/**
 * 游戏截图组件，用于生成游戏成绩的截图
 */
const GameScreenshot: React.FC<GameScreenshotProps> = ({
  children,
  onScreenshotGenerated,
  className = ''
}) => {
  const { isDark } = useTheme();
  const screenshotRef = useRef<HTMLDivElement>(null);

  // 生成截图
  const generateScreenshot = async () => {
    if (!screenshotRef.current) return;

    try {
      // 动态导入并使用 html2canvas
      const html2canvasModule = await getHtml2canvas();
      if (!html2canvasModule) {
        console.error('html2canvas 加载失败');
        return null;
      }
      const html2canvasFn = html2canvasModule.default || html2canvasModule;
      
      // 使用html2canvas生成截图
      const canvas = await html2canvasFn(screenshotRef.current, {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        scale: 2, // 提高分辨率
        logging: false,
        useCORS: true // 允许跨域图片
      });

      // 转换为data URL
      const dataUrl = canvas.toDataURL('image/png');
      onScreenshotGenerated?.(dataUrl);
      return dataUrl;
    } catch (error) {
      console.error('生成截图失败:', error);
      return null;
    }
  };

  // 下载截图
  const downloadScreenshot = async () => {
    const dataUrl = await generateScreenshot();
    if (!dataUrl) return;

    // 创建下载链接
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `game-screenshot-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* 可截图内容 */}
      <div ref={screenshotRef} className={className}>
        {children}
      </div>

      {/* 生成截图按钮 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={downloadScreenshot}
        className={`mt-4 px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${
          isDark 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        <i className="fas fa-camera"></i>
        <span>下载截图</span>
      </motion.button>
    </>
  );
};

export default GameScreenshot;