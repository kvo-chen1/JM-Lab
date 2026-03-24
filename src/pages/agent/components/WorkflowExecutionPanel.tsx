/**
 * WorkflowExecutionPanel - 工作流执行面板
 * 显示多步骤任务的执行进度和状态
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { TaskStep } from '../services/intentRecognition';
import { 
  CheckCircle2, 
  Circle, 
  Play, 
  Pause, 
  Clock,
  ChevronRight,
  Sparkles,
  Palette,
  PenTool,
  Type,
  Video,
  Search,
  User
} from 'lucide-react';

// Agent 图标映射
const agentIconMap: Record<string, React.ReactNode> = {
  director: <Sparkles className="w-4 h-4" />,
  designer: <Palette className="w-4 h-4" />,
  illustrator: <PenTool className="w-4 h-4" />,
  copywriter: <Type className="w-4 h-4" />,
  animator: <Video className="w-4 h-4" />,
  researcher: <Search className="w-4 h-4" />,
  user: <User className="w-4 h-4" />
};

// Agent 颜色映射
const agentColorMap: Record<string, string> = {
  director: 'bg-amber-500',
  designer: 'bg-cyan-500',
  illustrator: 'bg-pink-500',
  copywriter: 'bg-emerald-500',
  animator: 'bg-violet-500',
  researcher: 'bg-slate-500',
  user: 'bg-gray-500'
};

// Agent 名称映射
const agentNameMap: Record<string, string> = {
  director: '设计总监',
  designer: '品牌设计师',
  illustrator: '插画师',
  copywriter: '文案策划',
  animator: '动画师',
  researcher: '研究员',
  user: '用户'
};

// 步骤状态
export type StepStatus = 'pending' | 'running' | 'completed' | 'paused' | 'skipped';

// 工作流步骤（扩展）
export interface WorkflowStep extends TaskStep {
  status: StepStatus;
  startTime?: number;
  endTime?: number;
  output?: string;
}

// 工作流执行面板属性
interface WorkflowExecutionPanelProps {
  workflowName: string;
  steps: WorkflowStep[];
  currentStepIndex: number;
  estimatedDuration: string;
  isExecuting: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onConfirmStep: () => void;
  onCancel: () => void;
}

export const WorkflowExecutionPanel: React.FC<WorkflowExecutionPanelProps> = ({
  workflowName,
  steps,
  currentStepIndex,
  estimatedDuration,
  isExecuting,
  onStart,
  onPause,
  onResume,
  onSkip,
  onConfirmStep,
  onCancel
}) => {
  const { isDark } = useTheme();

  // 计算进度
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  // 获取当前步骤
  const currentStep = steps[currentStepIndex];

  return (
    <div className={`rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}>
      {/* 头部信息 */}
      <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <Clock className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {workflowName}
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                预计耗时 {estimatedDuration} · 共 {steps.length} 个步骤
              </p>
            </div>
          </div>
          
          {/* 控制按钮 */}
          <div className="flex items-center gap-2">
            {!isExecuting ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStart}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  isDark 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>开始执行</span>
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onPause}
                  className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                >
                  <Pause className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCancel}
                  className={`px-2 py-1 rounded-lg text-xs ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}
                >
                  取消
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* 进度条 */}
        <div className="mt-3">
          <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              进度: {Math.round(progress)}%
            </span>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {completedSteps}/{steps.length} 步骤完成
            </span>
          </div>
        </div>
      </div>

      {/* 步骤列表 */}
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {steps.map((step, index) => {
          const isCurrent = index === currentStepIndex;
          const isCompleted = step.status === 'completed';
          const isPending = step.status === 'pending';
          const isRunning = step.status === 'running';

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative flex items-start gap-3 p-3 rounded-lg border transition-all ${
                isCurrent
                  ? isDark
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-blue-50 border-blue-200'
                  : isCompleted
                  ? isDark
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-green-50 border-green-200'
                  : isDark
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* 步骤状态图标 */}
              <div className="flex-shrink-0 mt-0.5">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : isRunning ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Circle className="w-5 h-5 text-blue-500" />
                  </motion.div>
                ) : (
                  <Circle className={`w-5 h-5 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                )}
              </div>

              {/* 步骤内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    isCurrent
                      ? isDark ? 'text-blue-400' : 'text-blue-700'
                      : isCompleted
                      ? isDark ? 'text-green-400' : 'text-green-700'
                      : isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    步骤 {index + 1}: {step.name}
                  </span>
                  
                  {/* Agent 标签 */}
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                    isDark ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <span className={agentColorMap[step.agent] || 'bg-gray-500'}>
                      {agentIconMap[step.agent] || <User className="w-3 h-3" />}
                    </span>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                      {agentNameMap[step.agent] || step.agent}
                    </span>
                  </div>
                </div>
                
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {step.description}
                </p>

                {/* 当前步骤的操作按钮 */}
                {isCurrent && isRunning && (
                  <div className="flex items-center gap-2 mt-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onConfirmStep}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                        isDark
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>完成此步骤</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onSkip}
                      className={`px-3 py-1.5 rounded-lg text-xs ${
                        isDark
                          ? 'text-gray-400 hover:bg-gray-700'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      跳过
                    </motion.button>
                  </div>
                )}
              </div>

              {/* 步骤序号 */}
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isCurrent
                  ? 'bg-blue-500 text-white'
                  : isDark
                  ? 'bg-gray-700 text-gray-500'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {index + 1}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 底部提示 */}
      {currentStep && isExecuting && (
        <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${agentColorMap[currentStep.agent] || 'bg-blue-500'}`} />
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              当前正在执行: <span className="font-medium">{currentStep.name}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowExecutionPanel;
