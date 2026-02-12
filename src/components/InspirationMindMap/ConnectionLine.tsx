/**
 * 连接线组件 - 升级版
 * 渲染思维导图中节点之间的连接线，支持流畅的动画效果
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { NodePosition } from './types';

interface ConnectionLineProps {
  from: NodePosition;
  to: NodePosition;
  theme?: 'tianjin' | 'modern' | 'minimal';
  isDark?: boolean;
  animated?: boolean;
  isHighlighted?: boolean;
}

export default function ConnectionLine({
  from,
  to,
  theme = 'tianjin',
  isDark = false,
  animated = true,
  isHighlighted = false,
}: ConnectionLineProps) {
  // 计算路径 - 使用更优雅的贝塞尔曲线
  const calculatePath = () => {
    const startX = from.x;
    const startY = from.y + 40; // 从父节点底部开始
    const endX = to.x;
    const endY = to.y - 40; // 到子节点顶部结束
    
    // 控制点，用于贝塞尔曲线
    const deltaY = Math.abs(endY - startY);
    const controlY1 = startY + deltaY * 0.5;
    const controlY2 = endY - deltaY * 0.5;
    
    // 天津风格：使用更优雅的曲线
    if (theme === 'tianjin') {
      return `M ${startX} ${startY} 
              C ${startX} ${controlY1}, 
                ${endX} ${controlY2}, 
                ${endX} ${endY}`;
    }
    
    // 现代风格：直线
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  };
  
  // 获取线条颜色
  const getStrokeColor = () => {
    if (isHighlighted) {
      return isDark ? 'rgba(212, 165, 116, 1)' : 'rgba(212, 165, 116, 1)';
    }
    if (theme === 'tianjin') {
      return isDark ? 'rgba(212, 165, 116, 0.5)' : 'rgba(212, 165, 116, 0.7)';
    }
    return isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)';
  };
  
  // 获取线条宽度
  const getStrokeWidth = () => {
    if (isHighlighted) return 4;
    if (theme === 'tianjin') return 2.5;
    return 2;
  };
  
  const path = calculatePath();
  const strokeColor = getStrokeColor();
  const strokeWidth = getStrokeWidth();
  
  return (
    <g className="connection-line">
      {/* 背景线（用于增加可点击区域） */}
      <motion.path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={strokeWidth + 15}
        className="cursor-pointer"
      />
      
      {/* 阴影线 - 增加深度感 */}
      <motion.path
        d={path}
        fill="none"
        stroke={isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}
        strokeWidth={strokeWidth + 2}
        strokeLinecap="round"
        style={{ 
          filter: 'blur(2px)',
          transform: 'translateY(2px)',
        }}
        initial={animated ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration: 0.6, ease: "easeInOut" },
          opacity: { duration: 0.3 },
        }}
      />
      
      {/* 主线条 */}
      <motion.path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={animated ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration: 0.5, ease: "easeInOut" },
          opacity: { duration: 0.3 },
        }}
      />
      
      {/* 流动动画效果 - 能量流动 */}
      {animated && (
        <motion.path
          d={path}
          fill="none"
          stroke={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.8)'}
          strokeWidth={strokeWidth * 0.6}
          strokeLinecap="round"
          strokeDasharray="8 24"
          initial={{ strokeDashoffset: 0, opacity: 0 }}
          animate={{ 
            strokeDashoffset: -32, 
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            strokeDashoffset: {
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            },
            opacity: {
              duration: 1.5,
              repeat: Infinity,
              times: [0, 0.1, 0.9, 1],
            },
          }}
        />
      )}
      
      {/* 高亮时的脉冲效果 */}
      {isHighlighted && animated && (
        <motion.path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
          initial={{ opacity: 0.8, pathLength: 0 }}
          animate={{ opacity: 0, pathLength: 1 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      )}
      
      {/* 连接点 */}
      <>
        {/* 起点 */}
        <motion.circle
          cx={from.x}
          cy={from.y + 40}
          r={isHighlighted ? 5 : 3}
          fill={isDark ? '#1a1a2e' : '#ffffff'}
          stroke={strokeColor}
          strokeWidth={2}
          initial={animated ? { scale: 0, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.2 }}
        />
        
        {/* 起点光晕 */}
        <motion.circle
          cx={from.x}
          cy={from.y + 40}
          r={isHighlighted ? 10 : 6}
          fill={strokeColor}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* 终点 */}
        <motion.circle
          cx={to.x}
          cy={to.y - 40}
          r={isHighlighted ? 5 : 3}
          fill={strokeColor}
          initial={animated ? { scale: 0, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.2 }}
        />
        
        {/* 终点光晕 */}
        <motion.circle
          cx={to.x}
          cy={to.y - 40}
          r={isHighlighted ? 10 : 6}
          fill={strokeColor}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
      </>
    </g>
  );
}
