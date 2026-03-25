/**
 * 思考与决策过程面板组件
 * 展示 AI 的完整思考流程
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import { ThinkingDecisionPanelProps } from '../../types/thinking';
import ThinkingStepCard from './ThinkingStepCard';

export const ThinkingDecisionPanel: React.FC<ThinkingDecisionPanelProps> = ({
  steps,
  currentStepIndex,
  isExpanded: controlledIsExpanded,
  onToggle,
  isDark = false,
  showExpandAll = true,
  className = ''
}) => {
  // 内部状态（非受控模式）
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  // 支持受控和非受控模式
  const isExpanded = controlledIsExpanded !== undefined ? controlledIsExpanded : internalIsExpanded;
  const handleToggle = onToggle || (() => setInternalIsExpanded(!internalIsExpanded));

  /** 切换单个步骤的展开状态 */
  const toggleStep = useCallback((stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  }, []);

  /** 展开所有步骤 */
  const expandAll = useCallback(() => {
    setExpandedSteps(new Set(steps.map(s => s.id)));
  }, [steps]);

  /** 折叠所有步骤 */
  const collapseAll = useCallback(() => {
    setExpandedSteps(new Set());
  }, []);

  /** 格式化总执行时间 */
  const formatTotalTime = (ms?: number): string => {
    if (!ms) return '';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  /** 计算总执行时间 */
  const totalExecutionTime = steps.reduce((total, step) => total + (step.executionTime || 0), 0);

  /** 获取完成步骤数 */
  const completedSteps = steps.filter(s => s.status === 'completed').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`
        rounded-2xl overflow-hidden border-2
        ${isDark 
          ? 'bg-gray-800/80 border-gray-700' 
          : 'bg-white border-gray-200 shadow-lg'
        }
        ${className}
      `}
    >
      {/* 头部 */}
      <button
        onClick={handleToggle}
        className={`
          w-full px-5 py-4 flex items-center justify-between
          transition-colors duration-200
          ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}
        `}
      >
        <div className="flex items-center gap-3">
          {/* 图标 */}
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}
          `}>
            <Brain className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>

          {/* 标题和统计 */}
          <div className="text-left">
            <div className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              思考与决策过程
            </div>
            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {completedSteps}/{steps.length} 步骤完成
              {totalExecutionTime > 0 && ` · 总耗时 ${formatTotalTime(totalExecutionTime)}`}
            </div>
          </div>
        </div>

        {/* 右侧：展开/折叠图标 */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        </motion.div>
      </button>

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
            <div className={`px-4 pb-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              {/* 工具栏 */}
              {showExpandAll && steps.length > 1 && (
                <div className="flex items-center justify-end gap-2 py-3">
                  <button
                    onClick={expandAll}
                    className={`
                      flex items-center gap-1 px-2 py-1 rounded text-xs
                      transition-colors
                      ${isDark 
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                    `}
                  >
                    <Maximize2 className="w-3 h-3" />
                    展开全部
                  </button>
                  <button
                    onClick={collapseAll}
                    className={`
                      flex items-center gap-1 px-2 py-1 rounded text-xs
                      transition-colors
                      ${isDark 
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                    `}
                  >
                    <Minimize2 className="w-3 h-3" />
                    折叠全部
                  </button>
                </div>
              )}

              {/* 步骤列表 */}
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <ThinkingStepCard
                    key={step.id}
                    step={step}
                    isExpanded={expandedSteps.has(step.id)}
                    onToggle={() => toggleStep(step.id)}
                    isDark={isDark}
                    isCurrent={index === currentStepIndex}
                  />
                ))}
              </div>

              {/* 底部统计 */}
              <div className={`mt-4 pt-3 border-t text-xs text-center ${isDark ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                共 {steps.length} 个步骤 · {completedSteps} 个完成
                {totalExecutionTime > 0 && ` · 总耗时 ${formatTotalTime(totalExecutionTime)}`}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ThinkingDecisionPanel;
