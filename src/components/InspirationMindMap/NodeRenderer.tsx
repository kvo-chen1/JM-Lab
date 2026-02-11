/**
 * 节点渲染组件
 * 渲染思维导图中的单个节点，支持不同类型和样式
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Palette, 
  Lightbulb, 
  Edit3, 
  BookOpen, 
  CheckCircle2,
  Plus,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import type { MindNode, NodePosition, NodeStyle } from './types';

interface NodeRendererProps {
  node: MindNode;
  position: NodePosition;
  isSelected: boolean;
  isDark: boolean;
  theme: 'tianjin' | 'modern' | 'minimal';
  readonly?: boolean;
  onClick?: () => void;
  animationDelay?: number;
}

// 节点类别图标
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  inspiration: Lightbulb,
  culture: BookOpen,
  ai_generate: Sparkles,
  manual_edit: Edit3,
  reference: BookOpen,
  final: CheckCircle2,
};

// 节点类别颜色
const categoryColors: Record<string, { bg: string; border: string }> = {
  inspiration: { bg: '#FF6B6B', border: '#EE5A5A' },
  culture: { bg: '#4ECDC4', border: '#3DBDB4' },
  ai_generate: { bg: '#95E1D3', border: '#7FD1C3' },
  manual_edit: { bg: '#F38181', border: '#E07070' },
  reference: { bg: '#AA96DA', border: '#9985C9' },
  final: { bg: '#FCBAD3', border: '#EBA9C2' },
};

export default function NodeRenderer({
  node,
  position,
  isSelected,
  isDark,
  theme,
  readonly = false,
  onClick,
  animationDelay = 0,
}: NodeRendererProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const Icon = categoryIcons[node.category] || Lightbulb;
  const colors = categoryColors[node.category] || categoryColors.inspiration;
  
  // 天津风格特殊处理
  const getTianjinStyle = () => {
    if (theme !== 'tianjin') return {};
    
    const baseColor = isDark ? 'rgba(212, 165, 116, 0.9)' : 'rgba(212, 165, 116, 1)';
    const bgColor = isDark ? 'rgba(26, 26, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    
    return {
      borderColor: baseColor,
      backgroundColor: bgColor,
      boxShadow: isSelected
        ? `0 0 0 4px ${baseColor}40, 0 8px 30px ${baseColor}30`
        : `0 4px 20px ${baseColor}20`,
    };
  };
  
  const tianjinStyle = getTianjinStyle();
  
  return (
    <motion.div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        x: '-50%',
        y: '-50%',
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: animationDelay,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 节点主体 */}
      <motion.div
        className={`
          relative cursor-pointer select-none
          rounded-xl transition-all duration-200
          ${isSelected ? 'ring-2 ring-offset-2' : ''}
        `}
        style={{
          width: 180,
          padding: '12px 16px',
          borderColor: theme === 'tianjin' ? tianjinStyle.borderColor : colors.border,
          backgroundColor: theme === 'tianjin' ? tianjinStyle.backgroundColor : colors.bg,
          boxShadow: theme === 'tianjin' ? tianjinStyle.boxShadow : undefined,
        }}
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* 类别图标 */}
        <div 
          className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: colors.bg }}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
        
        {/* 节点标题 */}
        <h3 className={`
          font-semibold text-sm mb-1 truncate
          ${isDark ? 'text-gray-100' : 'text-gray-800'}
        `}>
          {node.title}
        </h3>
        
        {/* 节点描述 */}
        {node.description && (
          <p className={`
            text-xs line-clamp-2
            ${isDark ? 'text-gray-400' : 'text-gray-600'}
          `}>
            {node.description}
          </p>
        )}
        
        {/* AI生成标记 */}
        {node.category === 'ai_generate' && (
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
        )}
        
        {/* 文化元素标记 */}
        {node.category === 'culture' && (
          <div className="absolute -top-1 -right-1">
            <BookOpen className="w-4 h-4 text-teal-500" />
          </div>
        )}
        
        {/* 标签 */}
        {node.tags && node.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {node.tags.slice(0, 2).map((tag, index) => (
              <span 
                key={index}
                className={`
                  text-[10px] px-1.5 py-0.5 rounded-full
                  ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}
                `}
              >
                {tag}
              </span>
            ))}
            {node.tags.length > 2 && (
              <span className={`
                text-[10px] px-1.5 py-0.5 rounded-full
                ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}
              `}>
                +{node.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
