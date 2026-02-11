/**
 * 缩略图组件
 * 显示思维导图的整体缩略图，支持视口导航
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { MindNode, NodePosition } from './types';

interface Viewport {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
}

interface MiniMapProps {
  nodes: MindNode[];
  nodePositions: NodePosition[];
  viewport: Viewport;
  theme?: 'tianjin' | 'modern' | 'minimal';
  isDark?: boolean;
  onViewportChange?: (x: number, y: number) => void;
}

export default function MiniMap({
  nodes = [],
  nodePositions = [],
  viewport,
  theme = 'tianjin',
  isDark = false,
  onViewportChange,
}: MiniMapProps) {
  const mapWidth = 200;
  const mapHeight = 150;
  
  // 计算所有节点的边界
  const calculateBounds = () => {
    if (nodePositions.length === 0) {
      return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    }
    
    const xs = nodePositions.map(p => p.x);
    const ys = nodePositions.map(p => p.y);
    
    return {
      minX: Math.min(...xs) - 100,
      maxX: Math.max(...xs) + 100,
      minY: Math.min(...ys) - 100,
      maxY: Math.max(...ys) + 100,
    };
  };
  
  const bounds = calculateBounds();
  const contentWidth = bounds.maxX - bounds.minX;
  const contentHeight = bounds.maxY - bounds.minY;
  
  // 计算缩放比例
  const scaleX = mapWidth / contentWidth;
  const scaleY = mapHeight / contentHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9;
  
  // 坐标转换函数
  const transformX = (x: number) => (x - bounds.minX) * scale + (mapWidth - contentWidth * scale) / 2;
  const transformY = (y: number) => (y - bounds.minY) * scale + (mapHeight - contentHeight * scale) / 2;
  
  // 视口在缩略图中的位置和大小
  const viewportX = transformX(-viewport.x / viewport.scale);
  const viewportY = transformY(-viewport.y / viewport.scale);
  const viewportWidth = (viewport.width / viewport.scale) * scale;
  const viewportHeight = (viewport.height / viewport.scale) * scale;
  
  // 处理点击事件
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // 将点击位置转换回画布坐标
    const canvasX = -(clickX - (mapWidth - contentWidth * scale) / 2) / scale * viewport.scale + bounds.minX * viewport.scale;
    const canvasY = -(clickY - (mapHeight - contentHeight * scale) / 2) / scale * viewport.scale + bounds.minY * viewport.scale;
    
    onViewportChange?.(canvasX, canvasY);
  };
  
  // 获取节点颜色
  const getNodeColor = (node: MindNode) => {
    if (theme === 'tianjin') {
      return isDark ? 'rgba(212, 165, 116, 0.8)' : 'rgba(212, 165, 116, 1)';
    }
    return '#4ECDC4';
  };
  
  // 获取节点位置
  const getNodePosition = (nodeId: string): NodePosition | undefined => {
    return nodePositions.find(p => p.nodeId === nodeId);
  };
  
  return (
    <motion.div
      className={`
        relative rounded-lg overflow-hidden shadow-lg cursor-pointer
        ${isDark ? 'bg-gray-800' : 'bg-white'}
      `}
      style={{ width: mapWidth, height: mapHeight }}
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 背景 */}
      <div 
        className={`absolute inset-0 ${isDark ? 'bg-gray-900/50' : 'bg-gray-50/50'}`}
      />
      
      {/* 节点 */}
      <svg className="absolute inset-0 w-full h-full">
        {/* 连接线 */}
        {nodes.map(node => {
          if (!node.parentId) return null;
          const parentPosition = getNodePosition(node.parentId);
          const nodePosition = getNodePosition(node.id);
          if (!parentPosition || !nodePosition) return null;
          
          return (
            <line
              key={`minimap-line-${node.id}`}
              x1={transformX(parentPosition.x)}
              y1={transformY(parentPosition.y)}
              x2={transformX(nodePosition.x)}
              y2={transformY(nodePosition.y)}
              stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
              strokeWidth={1}
            />
          );
        })}
        
        {/* 节点点 */}
        {nodes.map(node => {
          const position = getNodePosition(node.id);
          if (!position) return null;
          
          return (
            <circle
              key={`minimap-node-${node.id}`}
              cx={transformX(position.x)}
              cy={transformY(position.y)}
              r={4}
              fill={getNodeColor(node)}
              opacity={0.8}
            />
          );
        })}
      </svg>
      
      {/* 视口指示器 */}
      <div
        className={`
          absolute border-2 rounded
          ${theme === 'tianjin' 
            ? (isDark ? 'border-amber-500/50' : 'border-amber-600/50')
            : (isDark ? 'border-blue-400/50' : 'border-blue-500/50')
          }
        `}
        style={{
          left: viewportX,
          top: viewportY,
          width: Math.min(viewportWidth, mapWidth - viewportX),
          height: Math.min(viewportHeight, mapHeight - viewportY),
          backgroundColor: theme === 'tianjin'
            ? (isDark ? 'rgba(212, 165, 116, 0.1)' : 'rgba(212, 165, 116, 0.15)')
            : (isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)'),
        }}
      />
      
      {/* 标题 */}
      <div className={`
        absolute top-1 left-2 text-[10px] font-medium
        ${isDark ? 'text-gray-400' : 'text-gray-500'}
      `}>
        缩略图
      </div>
    </motion.div>
  );
}
