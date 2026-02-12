/**
 * 节点渲染组件 - 升级版
 * 采用玻璃拟态风格，更美观高级的节点设计
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
  MessageSquare,
  Wand2,
} from 'lucide-react';
import type { MindNode, NodePosition } from './types';

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

// 节点类别配置
const categoryConfig: Record<string, {
  icon: React.ElementType;
  label: string;
  gradient: string;
  shadow: string;
  borderColor: string;
}> = {
  inspiration: {
    icon: Lightbulb,
    label: '灵感',
    gradient: 'from-amber-400 via-orange-400 to-amber-500',
    shadow: 'shadow-amber-500/30',
    borderColor: 'border-amber-400/50',
  },
  culture: {
    icon: BookOpen,
    label: '文化',
    gradient: 'from-red-400 via-rose-400 to-red-500',
    shadow: 'shadow-red-500/30',
    borderColor: 'border-red-400/50',
  },
  ai_generate: {
    icon: Sparkles,
    label: 'AI生成',
    gradient: 'from-purple-400 via-violet-400 to-purple-500',
    shadow: 'shadow-purple-500/30',
    borderColor: 'border-purple-400/50',
  },
  manual_edit: {
    icon: Edit3,
    label: '手动编辑',
    gradient: 'from-blue-400 via-cyan-400 to-blue-500',
    shadow: 'shadow-blue-500/30',
    borderColor: 'border-blue-400/50',
  },
  reference: {
    icon: BookOpen,
    label: '参考',
    gradient: 'from-green-400 via-emerald-400 to-green-500',
    shadow: 'shadow-green-500/30',
    borderColor: 'border-green-400/50',
  },
  final: {
    icon: CheckCircle2,
    label: '成品',
    gradient: 'from-emerald-400 via-teal-400 to-emerald-500',
    shadow: 'shadow-emerald-500/30',
    borderColor: 'border-emerald-400/50',
  },
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

  const config = categoryConfig[node.category] || categoryConfig.inspiration;
  const Icon = config.icon;

  // 天津风格特殊处理
  const isTianjin = theme === 'tianjin';

  return (
    <motion.div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        x: '-50%',
        y: '-50%',
      }}
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: animationDelay,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 选中状态光晕 */}
      {isSelected && (
        <motion.div
          layoutId="selection-glow"
          className={`
            absolute -inset-3 rounded-2xl opacity-50 blur-xl
            bg-gradient-to-r ${config.gradient}
          `}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* 节点主体 - 玻璃拟态风格 */}
      <motion.div
        className={`
          relative cursor-pointer select-none
          w-[200px] rounded-2xl overflow-hidden
          transition-all duration-300 ease-out
          ${isSelected ? 'scale-105' : ''}
        `}
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        onClick={onClick}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* 边框渐变 */}
        <div className={`
          absolute inset-0 rounded-2xl p-[1.5px]
          bg-gradient-to-br ${config.gradient}
          opacity-60
          ${isSelected ? 'opacity-100' : ''}
          ${isHovered ? 'opacity-80' : ''}
        `}>
          <div className={`
            w-full h-full rounded-2xl
            ${isDark ? 'bg-gray-900/80' : 'bg-white/80'}
          `} />
        </div>

        {/* 内容区域 */}
        <div className={`
          relative p-4
          ${isDark ? 'bg-gray-900/40' : 'bg-white/60'}
        `}>
          {/* 顶部：图标和类别 */}
          <div className="flex items-center justify-between mb-3">
            {/* 类别图标 */}
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center
              bg-gradient-to-br ${config.gradient}
              shadow-lg ${config.shadow}
            `}>
              <Icon className="w-5 h-5 text-white" />
            </div>

            {/* 类别标签 */}
            <span className={`
              text-[10px] font-medium px-2 py-1 rounded-full
              ${isDark ? 'bg-white/10 text-gray-300' : 'bg-black/5 text-gray-600'}
            `}>
              {config.label}
            </span>
          </div>

          {/* 节点标题 */}
          <h3 className={`
            font-bold text-sm mb-2 line-clamp-2
            ${isDark ? 'text-gray-100' : 'text-gray-800'}
          `}>
            {node.title}
          </h3>

          {/* 节点描述 */}
          {node.description && (
            <p className={`
              text-xs line-clamp-2 mb-3
              ${isDark ? 'text-gray-400' : 'text-gray-500'}
            `}>
              {node.description}
            </p>
          )}

          {/* 底部信息栏 */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200/30 dark:border-gray-700/30">
            {/* 标签预览 */}
            <div className="flex items-center gap-1">
              {node.tags && node.tags.length > 0 ? (
                <>
                  <span className={`
                    text-[10px] px-1.5 py-0.5 rounded-full
                    ${isDark ? 'bg-white/10 text-gray-400' : 'bg-black/5 text-gray-500'}
                  `}>
                    {node.tags[0]}
                  </span>
                  {node.tags.length > 1 && (
                    <span className={`
                      text-[10px] text-gray-400
                    `}>
                      +{node.tags.length - 1}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[10px] text-gray-400">无标签</span>
              )}
            </div>

            {/* 状态指示器 */}
            <div className="flex items-center gap-1.5">
              {node.aiGeneratedContent && (
                <div className="flex items-center gap-0.5 text-[10px] text-purple-500">
                  <Wand2 className="w-3 h-3" />
                  <span>AI</span>
                </div>
              )}
              {node.userNote && (
                <div className="flex items-center gap-0.5 text-[10px] text-blue-500">
                  <MessageSquare className="w-3 h-3" />
                  <span>笔记</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 选中指示条 */}
        {isSelected && (
          <motion.div
            layoutId="selection-bar"
            className={`
              absolute bottom-0 left-0 right-0 h-1
              bg-gradient-to-r ${config.gradient}
            `}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>

      {/* 悬停提示 */}
      {isHovered && !isSelected && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            absolute -bottom-8 left-1/2 -translate-x-1/2
            px-2 py-1 rounded-lg text-[10px] whitespace-nowrap
            ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-900 text-white'}
          `}
        >
          点击查看详情
        </motion.div>
      )}
    </motion.div>
  );
}
