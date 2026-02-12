/**
 * 思维导图画布组件
 * 提供可缩放、可拖拽的画布，用于展示和编辑创作脉络
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize, Grid3X3, Minimize } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import NodeRenderer from './NodeRenderer';
import ConnectionLine from './ConnectionLine';
import MiniMap from './MiniMap';
import EmptyStateGuide from './EmptyStateGuide';
import type { MindNode, NodePosition } from './types';

interface MindMapCanvasProps {
  nodes: MindNode[];
  nodePositions: NodePosition[];
  selectedNodeId: string | null;
  onNodeClick?: (nodeId: string) => void;
  onCanvasClick?: () => void;
  onNodePositionChange?: (nodeId: string, position: { x: number; y: number }) => void;
  onAddNode?: (category: 'inspiration' | 'culture' | 'ai_generate') => void;
  onOpenBrandPanel?: () => void;
  readonly?: boolean;
  theme?: 'tianjin' | 'modern' | 'minimal';
  className?: string;
}

// 画布背景样式
const backgroundPatterns = {
  tianjin: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A574' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  modern: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)`,
  minimal: 'none',
};

export default function MindMapCanvas({
  nodes = [],
  nodePositions = [],
  selectedNodeId,
  onNodeClick,
  onCanvasClick,
  onNodePositionChange,
  onAddNode,
  onOpenBrandPanel,
  readonly = false,
  theme = 'tianjin',
  className = '',
}: MindMapCanvasProps) {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 画布状态
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  
  // 缩放控制
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.2, 3));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev / 1.2, 0.3));
  }, []);
  
  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);
  
  // 画布拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-background')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [position]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.max(0.3, Math.min(3, prev * delta)));
    }
  }, []);
  
  // 获取节点位置
  const getNodePosition = useCallback((nodeId: string): NodePosition | undefined => {
    return nodePositions.find(p => p.nodeId === nodeId);
  }, [nodePositions]);
  
  // 渲染连接线
  const renderConnections = () => {
    return nodes.map(node => {
      if (!node.parentId) return null;
      
      const parentPosition = getNodePosition(node.parentId);
      const nodePosition = getNodePosition(node.id);
      
      if (!parentPosition || !nodePosition) return null;
      
      return (
        <ConnectionLine
          key={`connection-${node.id}`}
          from={parentPosition}
          to={nodePosition}
          theme={theme}
          isDark={isDark}
        />
      );
    });
  };
  
  // 渲染节点
  const renderNodes = () => {
    return nodes.map((node, index) => {
      const position = getNodePosition(node.id);
      if (!position) return null;
      
      return (
        <NodeRenderer
          key={node.id}
          node={node}
          position={position}
          isSelected={selectedNodeId === node.id}
          isDark={isDark}
          theme={theme}
          readonly={readonly}
          onClick={() => onNodeClick?.(node.id)}
          animationDelay={index * 0.05}
        />
      );
    });
  };
  
  // 计算画布中心点
  const getCanvasCenter = () => {
    if (nodePositions.length === 0) return { x: 0, y: 0 };
    
    const minX = Math.min(...nodePositions.map(p => p.x));
    const maxX = Math.max(...nodePositions.map(p => p.x));
    const minY = Math.min(...nodePositions.map(p => p.y));
    const maxY = Math.max(...nodePositions.map(p => p.y));
    
    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    };
  };
  
  const center = getCanvasCenter();
  
  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* 画布背景 */}
      <div
        ref={canvasRef}
        className="canvas-background absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{
          backgroundImage: showGrid ? backgroundPatterns[theme] : 'none',
          backgroundColor: isDark ? '#1a1a2e' : '#f8f9fa',
          backgroundSize: theme === 'modern' ? '20px 20px' : 'auto',
        }}
        onClick={onCanvasClick}
      />
      
      {/* 可缩放画布内容 */}
      <motion.div
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          x: position.x - center.x * scale,
          y: position.y - center.y * scale,
          scale,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* 连接线层 */}
        <svg
          className="absolute pointer-events-none"
          style={{
            width: '5000px',
            height: '5000px',
            left: '-2500px',
            top: '-2500px',
          }}
        >
          {renderConnections()}
        </svg>
        
        {/* 节点层 */}
        <div className="relative">
          {renderNodes()}
        </div>
      </motion.div>
      
      {/* 工具栏 */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          className="h-8 w-8 p-0"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <span className="text-sm font-medium min-w-[60px] text-center">
          {Math.round(scale * 100)}%
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          className="h-8 w-8 p-0"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetZoom}
          className="h-8 w-8 p-0"
          title="重置视图"
        >
          <Maximize className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
          className={`h-8 w-8 p-0 ${showGrid ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          title="切换网格"
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMiniMap(!showMiniMap)}
          className={`h-8 w-8 p-0 ${showMiniMap ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          title="切换缩略图"
        >
          <Minimize className="h-4 w-4" />
        </Button>
      </div>
      
      {/* 缩略图 */}
      {showMiniMap && (
        <div className="absolute bottom-4 right-4">
          <MiniMap
            nodes={nodes}
            nodePositions={nodePositions}
            viewport={{
              x: position.x,
              y: position.y,
              scale,
              width: containerRef.current?.clientWidth || 800,
              height: containerRef.current?.clientHeight || 600,
            }}
            theme={theme}
            isDark={isDark}
            onViewportChange={(x, y) => setPosition({ x, y })}
          />
        </div>
      )}
      
      {/* 信息提示 */}
      <div className="absolute top-4 left-4 px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {nodes.length} 个节点
        </p>
      </div>

      {/* 空状态引导 */}
      {nodes.length === 0 && onAddNode && onOpenBrandPanel && (
        <EmptyStateGuide
          onAddNode={onAddNode}
          onOpenBrandPanel={onOpenBrandPanel}
        />
      )}
    </div>
  );
}
