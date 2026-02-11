/**
 * 连接线组件
 * 渲染思维导图中节点之间的连接线，支持天津风格动画
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
}

export default function ConnectionLine({
  from,
  to,
  theme = 'tianjin',
  isDark = false,
  animated = true,
}: ConnectionLineProps) {
  // 计算路径
  const calculatePath = () => {
    const startX = from.x;
    const startY = from.y + 40; // 从父节点底部开始
    const endX = to.x;
    const endY = to.y - 40; // 到子节点顶部结束
    
    // 控制点，用于贝塞尔曲线
    const controlY = (startY + endY) / 2;
    
    // 天津风格：使用更优雅的曲线
    if (theme === 'tianjin') {
      return `M ${startX} ${startY} 
              C ${startX} ${controlY}, 
                ${endX} ${controlY}, 
                ${endX} ${endY}`;
    }
    
    // 现代风格：直线
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  };
  
  // 获取线条颜色
  const getStrokeColor = () => {
    if (theme === 'tianjin') {
      return isDark ? 'rgba(212, 165, 116, 0.6)' : 'rgba(212, 165, 116, 0.8)';
    }
    return isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)';
  };
  
  // 获取线条宽度
  const getStrokeWidth = () => {
    if (theme === 'tianjin') return 3;
    return 2;
  };
  
  const path = calculatePath();
  const strokeColor = getStrokeColor();
  const strokeWidth = getStrokeWidth();
  
  return (
    <g>
      {/* 背景线（用于增加可点击区域） */}
      <motion.path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={strokeWidth + 10}
        className="cursor-pointer"
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
      
      {/* 天津风格：添加流动动画效果 */}
      {theme === 'tianjin' && animated && (
        <motion.path
          d={path}
          fill="none"
          stroke={isDark ? 'rgba(212, 165, 116, 0.4)' : 'rgba(212, 165, 116, 0.6)'}
          strokeWidth={strokeWidth - 1}
          strokeLinecap="round"
          strokeDasharray="10 20"
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: -30 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}
      
      {/* 连接点（天津风格） */}
      {theme === 'tianjin' && (
        <>
          {/* 起点 */}
          <motion.circle
            cx={from.x}
            cy={from.y + 40}
            r={4}
            fill={isDark ? '#1a1a2e' : '#ffffff'}
            stroke={strokeColor}
            strokeWidth={2}
            initial={animated ? { scale: 0 } : false}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.2 }}
          />
          
          {/* 终点 */}
          <motion.circle
            cx={to.x}
            cy={to.y - 40}
            r={4}
            fill={strokeColor}
            initial={animated ? { scale: 0 } : false}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 0.2 }}
          />
        </>
      )}
    </g>
  );
}
