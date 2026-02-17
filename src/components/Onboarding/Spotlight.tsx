import React from 'react';
import { motion } from 'framer-motion';

interface SpotlightProps {
  targetRect: DOMRect | null;
  isDark: boolean;
  accentColor: string;
  showPulse?: boolean;
}

export const Spotlight: React.FC<SpotlightProps> = ({
  targetRect,
  isDark,
  accentColor,
  showPulse = false
}) => {
  if (!targetRect) {
    // 如果没有目标元素，显示全屏遮罩
    return (
      <motion.div
        className="fixed inset-0 pointer-events-none z-[9998]"
        style={{
          background: isDark 
            ? 'rgba(0, 0, 0, 0.7)' 
            : 'rgba(0, 0, 0, 0.5)'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      />
    );
  }

  const padding = 16;
  const radius = 16;
  
  // 计算高亮区域的位置和大小
  const highlightTop = targetRect.top - padding;
  const highlightLeft = targetRect.left - padding;
  const highlightWidth = targetRect.width + padding * 2;
  const highlightHeight = targetRect.height + padding * 2;

  // 创建四个遮罩区域（上、下、左、右）
  const overlayColor = isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.6)';

  return (
    <>
      {/* 顶部遮罩 */}
      <motion.div
        className="fixed left-0 right-0 pointer-events-none z-[9998]"
        style={{
          top: 0,
          height: highlightTop,
          background: overlayColor,
          backdropFilter: 'blur(2px)'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* 底部遮罩 */}
      <motion.div
        className="fixed left-0 right-0 pointer-events-none z-[9998]"
        style={{
          top: highlightTop + highlightHeight,
          bottom: 0,
          background: overlayColor,
          backdropFilter: 'blur(2px)'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* 左侧遮罩 */}
      <motion.div
        className="fixed pointer-events-none z-[9998]"
        style={{
          top: highlightTop,
          left: 0,
          width: highlightLeft,
          height: highlightHeight,
          background: overlayColor,
          backdropFilter: 'blur(2px)'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* 右侧遮罩 */}
      <motion.div
        className="fixed pointer-events-none z-[9998]"
        style={{
          top: highlightTop,
          left: highlightLeft + highlightWidth,
          right: 0,
          height: highlightHeight,
          background: overlayColor,
          backdropFilter: 'blur(2px)'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* 高亮边框 */}
      <motion.div
        className="fixed pointer-events-none z-[9999]"
        style={{
          top: highlightTop,
          left: highlightLeft,
          width: highlightWidth,
          height: highlightHeight,
          borderRadius: radius,
          border: `3px solid ${accentColor}`,
          boxShadow: `
            0 0 0 4px ${accentColor}20,
            0 0 20px ${accentColor}40,
            0 0 40px ${accentColor}20,
            inset 0 0 20px ${accentColor}10
          `
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />

      {/* 角落装饰 */}
      <>
        {/* 左上角 */}
        <motion.div
          className="fixed pointer-events-none z-[9999]"
          style={{
            top: highlightTop - 4,
            left: highlightLeft - 4,
            width: 20,
            height: 20,
            borderTop: `4px solid ${accentColor}`,
            borderLeft: `4px solid ${accentColor}`,
            borderTopLeftRadius: radius
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        />
        {/* 右上角 */}
        <motion.div
          className="fixed pointer-events-none z-[9999]"
          style={{
            top: highlightTop - 4,
            left: highlightLeft + highlightWidth - 16,
            width: 20,
            height: 20,
            borderTop: `4px solid ${accentColor}`,
            borderRight: `4px solid ${accentColor}`,
            borderTopRightRadius: radius
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        />
        {/* 左下角 */}
        <motion.div
          className="fixed pointer-events-none z-[9999]"
          style={{
            top: highlightTop + highlightHeight - 16,
            left: highlightLeft - 4,
            width: 20,
            height: 20,
            borderBottom: `4px solid ${accentColor}`,
            borderLeft: `4px solid ${accentColor}`,
            borderBottomLeftRadius: radius
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        />
        {/* 右下角 */}
        <motion.div
          className="fixed pointer-events-none z-[9999]"
          style={{
            top: highlightTop + highlightHeight - 16,
            left: highlightLeft + highlightWidth - 16,
            width: 20,
            height: 20,
            borderBottom: `4px solid ${accentColor}`,
            borderRight: `4px solid ${accentColor}`,
            borderBottomRightRadius: radius
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        />
      </>

      {/* 脉冲动画效果 */}
      {showPulse && (
        <motion.div
          className="fixed pointer-events-none z-[9999]"
          style={{
            top: highlightTop,
            left: highlightLeft,
            width: highlightWidth,
            height: highlightHeight,
            borderRadius: radius,
            border: `2px solid ${accentColor}`,
          }}
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ 
            opacity: [0.6, 0, 0.6],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
    </>
  );
};

export default Spotlight;
