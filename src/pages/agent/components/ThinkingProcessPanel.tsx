/**
 * 思考过程展示面板
 * 实时展示Agent的思考过程和决策步骤
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Search, 
  Target, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ThinkingStep, StepType, StepStatus } from '../types/thinking';

interface ThinkingProcessPanelProps {
  steps: ThinkingStep[];
  isVisible: boolean;
  onClose?: () => void;
  className?: string;
}

// 步骤类型配置
const STEP_CONFIG: Record<StepType, {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
}> = {
  intent: {
    icon: <Target className="w-4 h-4" />,
    label: '意图识别',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  analysis: {
    icon: <Search className="w-4 h-4" />,
    label: '需求分析',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  decision: {
    icon: <Brain className="w-4 h-4" />,
    label: '调度决策',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  },
  execution: {
    icon: <Sparkles className="w-4 h-4" />,
    label: '执行决策',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  delegation: {
    icon: <Users className="w-4 h-4" />,
    label: '任务委派',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  }
};

// 状态图标
const StatusIcon: React.FC<{ status: StepStatus }> = ({ status }) => {
  switch (status) {
    case 'running':
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    default:
      return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
  }
};

// 单个步骤组件
const ThinkingStepItem: React.FC<{ 
  step: ThinkingStep; 
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ step, isExpanded, onToggle }) => {
  const config = STEP_CONFIG[step.type];
  const duration = step.endTime && step.startTime 
    ? ((step.endTime - step.startTime) / 1000).toFixed(2)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-gray-100 last:border-b-0"
    >
      <div 
        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {/* 状态图标 */}
          <StatusIcon status={step.status} />
          
          {/* 步骤类型图标 */}
          <div className={`p-1.5 rounded-lg ${config.bgColor} ${config.color}`}>
            {config.icon}
          </div>
          
          {/* 步骤信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-gray-900">
                {config.label}
              </span>
              {duration && (
                <span className="text-xs text-gray-400">
                  {duration}s
                </span>
              )}
            </div>
            {step.summary && (
              <p className="text-xs text-gray-600 mt-0.5 truncate">
                {step.summary}
              </p>
            )}
          </div>
          
          {/* 展开/收起图标 */}
          {step.details && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </motion.div>
          )}
        </div>
      </div>

      {/* 展开详情 */}
      <AnimatePresence>
        {isExpanded && step.details && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pl-12">
              <div className="bg-gray-50 rounded-lg p-3 text-xs">
                <pre className="whitespace-pre-wrap break-all text-gray-700 font-mono">
                  {JSON.stringify(step.details, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// 主组件
export const ThinkingProcessPanel: React.FC<ThinkingProcessPanelProps> = ({
  steps,
  isVisible,
  onClose,
  className = ''
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [isMinimized, setIsMinimized] = useState(false);

  // 自动展开最新的步骤
  useEffect(() => {
    if (steps.length > 0) {
      const latestStep = steps[steps.length - 1];
      if (latestStep.status === 'completed' && latestStep.details) {
        setExpandedSteps(prev => new Set([...prev, latestStep.id]));
      }
    }
  }, [steps]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  // 检查是否所有步骤都已完成
  const allCompleted = steps.length > 0 && steps.every(s => s.status === 'completed');
  const hasError = steps.some(s => s.status === 'error');

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}
      style={{ width: isMinimized ? 'auto' : '320px' }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-sm text-gray-900">
            {isMinimized ? '' : '思考过程'}
          </span>
          {allCompleted && (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
          {hasError && (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/50 rounded transition-colors"
          >
            {isMinimized ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/50 rounded transition-colors"
            >
              <span className="text-gray-400 hover:text-gray-600">×</span>
            </button>
          )}
        </div>
      </div>

      {/* 步骤列表 */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="max-h-80 overflow-y-auto"
          >
            {steps.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">正在思考...</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {steps.map((step) => (
                  <ThinkingStepItem
                    key={step.id}
                    step={step}
                    isExpanded={expandedSteps.has(step.id)}
                    onToggle={() => toggleStep(step.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部状态 */}
      {!isMinimized && steps.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
          {allCompleted ? (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              思考完成
            </span>
          ) : hasError ? (
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-red-500" />
              遇到错误
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              思考中...
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

// 简化的思考状态指示器（用于消息气泡）
export const ThinkingIndicator: React.FC<{
  status: 'thinking' | 'completed' | 'error';
  steps?: ThinkingStep[];
}> = ({ status, steps = [] }) => {
  const currentStep = steps.find(s => s.status === 'running');
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 text-xs text-gray-500"
    >
      {status === 'thinking' && (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>
            {currentStep 
              ? `${STEP_CONFIG[currentStep.type]?.label || '思考中'}...`
              : '思考中...'
            }
          </span>
        </>
      )}
      {status === 'completed' && (
        <>
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          <span className="text-green-600">思考完成</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="w-3 h-3 text-red-500" />
          <span className="text-red-600">思考出错</span>
        </>
      )}
    </motion.div>
  );
};

// 内联思考过程（用于消息内部展示）
export const InlineThinkingProcess: React.FC<{
  steps: ThinkingStep[];
}> = ({ steps }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (steps.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Brain className="w-3 h-3" />
        <span>思考过程 ({steps.length}步)</span>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 space-y-1"
          >
            {steps.map((step) => {
              const config = STEP_CONFIG[step.type];
              return (
                <div 
                  key={step.id}
                  className="flex items-center gap-2 text-xs"
                >
                  <StatusIcon status={step.status} />
                  <span className={config.color}>{config.label}</span>
                  {step.summary && (
                    <span className="text-gray-500 truncate">
                      - {step.summary}
                    </span>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThinkingProcessPanel;
