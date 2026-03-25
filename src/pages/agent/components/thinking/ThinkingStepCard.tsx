/**
 * 思考步骤卡片组件
 * 展示单个思考步骤的详细信息
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Brain, GitBranch, Settings, Zap, MessageSquare, Clock } from 'lucide-react';
import { ThinkingStep, STEP_TYPE_CONFIG } from '../../types/thinking';
import StepStatusBadge from './StepStatusBadge';

interface ThinkingStepCardProps {
  /** 步骤数据 */
  step: ThinkingStep;
  /** 是否展开 */
  isExpanded: boolean;
  /** 展开/折叠回调 */
  onToggle: () => void;
  /** 主题 */
  isDark?: boolean;
  /** 是否是当前步骤 */
  isCurrent?: boolean;
  /** 自定义类名 */
  className?: string;
}

/** 图标映射 */
const iconMap = {
  Brain,
  GitBranch,
  Settings,
  Zap,
  MessageSquare
};

export const ThinkingStepCard: React.FC<ThinkingStepCardProps> = ({
  step,
  isExpanded,
  onToggle,
  isDark = false,
  isCurrent = false,
  className = ''
}) => {
  const typeConfig = STEP_TYPE_CONFIG[step.type];
  const Icon = iconMap[typeConfig.icon as keyof typeof iconMap] || Brain;
  const colors = isDark ? typeConfig.colors.dark : typeConfig.colors.light;
  const textColor = isDark ? typeConfig.colors.dark.text : typeConfig.colors.light.text;

  /** 格式化执行时间 */
  const formatExecutionTime = (ms?: number): string => {
    if (!ms) return '';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        rounded-xl border-2 overflow-hidden transition-all duration-300
        ${colors.bg} ${colors.border}
        ${isCurrent ? 'ring-2 ring-offset-2 ' + colors.border.replace('border-', 'ring-') : ''}
        ${className}
      `}
    >
      {/* 头部 - 可点击展开/折叠 */}
      <button
        onClick={onToggle}
        className={`
          w-full px-4 py-3 flex items-center justify-between
          transition-colors duration-200
          ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}
        `}
      >
        <div className="flex items-center gap-3">
          {/* 图标 */}
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            ${isDark ? 'bg-white/10' : 'bg-black/5'}
          `}>
            <Icon className={`w-4 h-4 ${textColor}`} />
          </div>

          {/* 标题和类型 */}
          <div className="text-left">
            <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {step.title}
            </div>
            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {typeConfig.name}
            </div>
          </div>
        </div>

        {/* 右侧：状态和执行时间 */}
        <div className="flex items-center gap-3">
          {/* 执行时间 */}
          {step.executionTime && (
            <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Clock className="w-3 h-3" />
              <span>{formatExecutionTime(step.executionTime)}</span>
            </div>
          )}

          {/* 状态徽章 */}
          <StepStatusBadge status={step.status} size="sm" />

          {/* 展开/折叠箭头 */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </motion.div>
        </div>
      </button>

      {/* 摘要（折叠时显示） */}
      {!isExpanded && (
        <div className={`px-4 pb-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {step.summary}
        </div>
      )}

      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={`px-4 pb-4 space-y-3 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'} pt-3`}>
              {/* 摘要 */}
              <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {step.summary}
              </div>

              {/* 详细信息 */}
              {step.details.reasoning && (
                <div className="space-y-1">
                  <div className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    推理过程
                  </div>
                  <div className={`text-sm pl-3 border-l-2 ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
                    {step.details.reasoning}
                  </div>
                </div>
              )}

              {/* 输入参数 */}
              {step.details.input && Object.keys(step.details.input).length > 0 && (
                <div className="space-y-1">
                  <div className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    输入参数
                  </div>
                  <pre className={`
                    text-xs p-2 rounded overflow-x-auto
                    ${isDark ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {JSON.stringify(step.details.input, null, 2)}
                  </pre>
                </div>
              )}

              {/* 输出结果 */}
              {step.details.output && Object.keys(step.details.output).length > 0 && (
                <div className="space-y-1">
                  <div className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    输出结果
                  </div>
                  <pre className={`
                    text-xs p-2 rounded overflow-x-auto
                    ${isDark ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {JSON.stringify(step.details.output, null, 2)}
                  </pre>
                </div>
              )}

              {/* 进度条（仅 skill 类型） */}
              {step.type === 'skill' && step.progress !== undefined && (
                <div className="space-y-2">
                  <div className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    执行进度
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${step.progress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={`h-full rounded-full ${textColor.replace('text-', 'bg-')}`}
                    />
                  </div>
                  <div className={`text-xs text-right ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {step.progress}%
                  </div>
                </div>
              )}

              {/* 错误信息 */}
              {step.details.error && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-red-500">
                    错误信息
                  </div>
                  <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    {step.details.error}
                  </div>
                </div>
              )}

              {/* 执行时间详情 */}
              {step.executionTime && (
                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} text-right`}>
                  执行耗时: {formatExecutionTime(step.executionTime)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ThinkingStepCard;
