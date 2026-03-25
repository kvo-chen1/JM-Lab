/**
 * 工作流进度指示器组件
 * 显示当前 IP 形象设计流程的进度和阶段
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { CheckCircle, Circle, Sparkles, Palette, User, Heart } from 'lucide-react';

// 工作流步骤类型
export type WorkflowStep = 
  | 'collecting_basic'
  | 'collecting_appearance'
  | 'collecting_clothing'
  | 'collecting_background'
  | 'generating_profile'
  | 'showing_profile'
  | 'selecting_style'
  | 'generating_concept'
  | 'showing_concept'
  | 'satisfaction_check'
  | 'derivative_selection';

// 步骤配置
const STEP_CONFIG: Record<WorkflowStep, {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = {
  collecting_basic: {
    title: '基本信息',
    description: '设定角色的基本属性',
    icon: <User className="w-4 h-4" />,
    color: 'from-blue-500 to-cyan-500'
  },
  collecting_appearance: {
    title: '外貌特征',
    description: '设计角色的外貌细节',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'from-purple-500 to-pink-500'
  },
  collecting_clothing: {
    title: '服装风格',
    description: '选择角色的服装搭配',
    icon: <Palette className="w-4 h-4" />,
    color: 'from-orange-500 to-red-500'
  },
  collecting_background: {
    title: '背景故事',
    description: '丰富角色的背景设定',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'from-green-500 to-teal-500'
  },
  generating_profile: {
    title: '生成设定',
    description: '整合角色信息',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'from-indigo-500 to-purple-500'
  },
  showing_profile: {
    title: '展示设定',
    description: '查看角色设定',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'from-pink-500 to-rose-500'
  },
  selecting_style: {
    title: '选择风格',
    description: '选择艺术风格',
    icon: <Palette className="w-4 h-4" />,
    color: 'from-yellow-500 to-orange-500'
  },
  generating_concept: {
    title: '生成概念图',
    description: '绘制角色概念图',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'from-red-500 to-pink-500'
  },
  showing_concept: {
    title: '展示概念图',
    description: '查看概念图效果',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'from-cyan-500 to-blue-500'
  },
  satisfaction_check: {
    title: '满意度确认',
    description: '确认设计是否满意',
    icon: <Heart className="w-4 h-4" />,
    color: 'from-rose-500 to-red-500'
  },
  derivative_selection: {
    title: '延伸创作',
    description: '选择衍生内容',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'from-violet-500 to-purple-500'
  }
};

interface WorkflowProgressProps {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  onStepClick?: (step: WorkflowStep) => void;
  compact?: boolean; // 紧凑模式
}

export default function WorkflowProgress({ 
  currentStep, 
  completedSteps, 
  onStepClick,
  compact = false 
}: WorkflowProgressProps) {
  const { isDark } = useTheme();
  
  // 将步骤按逻辑顺序分组
  const stepGroups = [
    {
      name: '角色设定',
      steps: ['collecting_basic', 'collecting_appearance', 'collecting_clothing', 'collecting_background', 'generating_profile', 'showing_profile'] as WorkflowStep[]
    },
    {
      name: '风格选择',
      steps: ['selecting_style'] as WorkflowStep[]
    },
    {
      name: '概念图生成',
      steps: ['generating_concept', 'showing_concept', 'satisfaction_check'] as WorkflowStep[]
    },
    {
      name: '延伸创作',
      steps: ['derivative_selection'] as WorkflowStep[]
    }
  ];

  const getStepStatus = (step: WorkflowStep) => {
    if (completedSteps.includes(step)) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  if (compact) {
    // 紧凑模式：只显示当前阶段
    const currentConfig = STEP_CONFIG[currentStep];
    
    return (
      <div className={`w-full px-4 py-3 ${isDark ? 'bg-[#14141F]/50' : 'bg-gray-50/50'} rounded-xl border ${isDark ? 'border-[#2A2A3E]' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentConfig.color} flex items-center justify-center text-white`}>
            {currentConfig.icon}
          </div>
          <div className="flex-1">
            <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {currentConfig.title}
            </div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {currentConfig.description}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 完整模式：显示所有阶段
  return (
    <div className={`w-full px-4 py-4 ${isDark ? 'bg-[#14141F]/50' : 'bg-gray-50/50'} rounded-xl border ${isDark ? 'border-[#2A2A3E]' : 'border-gray-200'}`}>
      <div className="space-y-4">
        {stepGroups.map((group, groupIndex) => (
          <div key={group.name} className="relative">
            {/* 组标题 */}
            <div className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {group.name}
            </div>
            
            {/* 步骤列表 */}
            <div className="flex items-center gap-2">
              {group.steps.map((step, stepIndex) => {
                const status = getStepStatus(step);
                const config = STEP_CONFIG[step];
                const isLastStep = stepIndex === group.steps.length - 1;
                
                return (
                  <React.Fragment key={step}>
                    {/* 步骤节点 */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center"
                    >
                      <button
                        onClick={() => onStepClick?.(step)}
                        disabled={status === 'pending'}
                        className={`
                          w-10 h-10 rounded-xl flex items-center justify-center
                          transition-all duration-300
                          ${status === 'completed' 
                            ? `bg-gradient-to-br ${config.color} text-white shadow-lg` 
                            : status === 'current'
                              ? `bg-gradient-to-br ${config.color} text-white shadow-lg ring-2 ring-offset-2 ${isDark ? 'ring-[#8B5CF6] ring-offset-[#0A0A0F]' : 'ring-[#C02C38] ring-offset-gray-100'}`
                              : isDark
                                ? 'bg-[#1E1E2E] text-gray-500'
                                : 'bg-gray-200 text-gray-400'
                          }
                          ${status !== 'pending' && onStepClick ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                          ${status === 'pending' ? 'cursor-not-allowed' : ''}
                        `}
                        title={config.description}
                      >
                        {status === 'completed' ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          config.icon
                        )}
                      </button>
                      
                      {/* 步骤名称（仅在非紧凑模式显示） */}
                      <span className={`text-xs mt-1.5 font-medium ${
                        status === 'current'
                          ? isDark ? 'text-white' : 'text-gray-900'
                          : isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {config.title}
                      </span>
                    </motion.div>
                    
                    {/* 连接线 */}
                    {!isLastStep && (
                      <div className={`flex-1 h-0.5 mx-1 ${
                        status === 'completed'
                          ? `bg-gradient-to-r ${config.color}`
                          : isDark ? 'bg-[#2A2A3E]' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            
            {/* 组间分隔 */}
            {groupIndex < stepGroups.length - 1 && (
              <div className={`mt-4 h-px ${isDark ? 'bg-[#2A2A3E]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      
      {/* 当前步骤说明 */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-[#1E1E2E]' : 'bg-white'} border ${isDark ? 'border-[#2A2A3E]' : 'border-gray-200'}`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${STEP_CONFIG[currentStep].color} flex items-center justify-center text-white flex-shrink-0`}>
            {STEP_CONFIG[currentStep].icon}
          </div>
          <div className="flex-1">
            <div className={`text-sm font-semibold mb-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {STEP_CONFIG[currentStep].title}
            </div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {STEP_CONFIG[currentStep].description}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
