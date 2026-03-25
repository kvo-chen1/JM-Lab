/**
 * 思考与决策过程类型定义
 * 定义思考过程记录和展示的核心类型
 */

// ==================== 步骤状态 ====================

export type StepStatus = 'pending' | 'processing' | 'completed' | 'error';

export type StepType = 'intent' | 'decision' | 'parameter' | 'skill' | 'wrap';

// ==================== 步骤详情 ====================

export interface StepDetail {
  /** 输入参数 */
  input?: Record<string, any>;
  /** 输出结果 */
  output?: Record<string, any>;
  /** 推理过程说明 */
  reasoning?: string;
  /** 中间结果 */
  intermediateResults?: any[];
  /** 错误信息 */
  error?: string;
}

// ==================== 思考步骤 ====================

export interface ThinkingStep {
  /** 步骤唯一ID */
  id: string;
  /** 步骤标题 */
  title: string;
  /** 步骤类型 */
  type: StepType;
  /** 步骤状态 */
  status: StepStatus;
  /** 摘要信息（折叠时显示） */
  summary: string;
  /** 详细信息（展开后显示） */
  details: StepDetail;
  /** 开始时间 */
  startTime?: number;
  /** 结束时间 */
  endTime?: number;
  /** 执行时间（毫秒） */
  executionTime?: number;
  /** 进度（0-100，用于 skill 执行步骤） */
  progress?: number;
}

// ==================== 思考会话 ====================

export interface ThinkingSession {
  /** 会话ID */
  id: string;
  /** 会话开始时间 */
  startTime: number;
  /** 会话结束时间 */
  endTime?: number;
  /** 思考步骤列表 */
  steps: ThinkingStep[];
  /** 当前执行的步骤索引 */
  currentStepIndex: number;
  /** 会话状态 */
  status: 'running' | 'completed' | 'error';
  /** 总执行时间（毫秒） */
  totalExecutionTime?: number;
}

// ==================== 步骤类型配置 ====================

export interface StepTypeConfig {
  /** 类型名称 */
  name: string;
  /** 类型描述 */
  description: string;
  /** 图标 */
  icon: string;
  /** 颜色配置 */
  colors: {
    light: {
      bg: string;
      border: string;
      text: string;
    };
    dark: {
      bg: string;
      border: string;
      text: string;
    };
  };
}

/** 步骤类型配置映射 */
export const STEP_TYPE_CONFIG: Record<StepType, StepTypeConfig> = {
  intent: {
    name: '意图识别',
    description: '分析用户输入，识别用户意图',
    icon: 'Brain',
    colors: {
      light: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600'
      },
      dark: {
        bg: 'bg-blue-900/20',
        border: 'border-blue-700',
        text: 'text-blue-400'
      }
    }
  },
  decision: {
    name: '决策分析',
    description: '基于意图做出处理决策',
    icon: 'GitBranch',
    colors: {
      light: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-600'
      },
      dark: {
        bg: 'bg-purple-900/20',
        border: 'border-purple-700',
        text: 'text-purple-400'
      }
    }
  },
  parameter: {
    name: '参数准备',
    description: '准备执行所需的参数',
    icon: 'Settings',
    colors: {
      light: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-600'
      },
      dark: {
        bg: 'bg-green-900/20',
        border: 'border-green-700',
        text: 'text-green-400'
      }
    }
  },
  skill: {
    name: 'Skill 执行',
    description: '调用 Skill 执行具体任务',
    icon: 'Zap',
    colors: {
      light: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-600'
      },
      dark: {
        bg: 'bg-orange-900/20',
        border: 'border-orange-700',
        text: 'text-orange-400'
      }
    }
  },
  wrap: {
    name: '结果包装',
    description: '用 Agent 角色包装回复',
    icon: 'MessageSquare',
    colors: {
      light: {
        bg: 'bg-pink-50',
        border: 'border-pink-200',
        text: 'text-pink-600'
      },
      dark: {
        bg: 'bg-pink-900/20',
        border: 'border-pink-700',
        text: 'text-pink-400'
      }
    }
  }
};

// ==================== 状态配置 ====================

export interface StatusConfig {
  /** 状态名称 */
  name: string;
  /** 图标 */
  icon: string;
  /** 颜色 */
  color: string;
  /** 是否动画 */
  animate?: boolean;
}

/** 状态配置映射 */
export const STATUS_CONFIG: Record<StepStatus, StatusConfig> = {
  pending: {
    name: '等待',
    icon: 'Circle',
    color: 'text-gray-400',
    animate: false
  },
  processing: {
    name: '进行中',
    icon: 'Loader2',
    color: 'text-blue-500',
    animate: true
  },
  completed: {
    name: '完成',
    icon: 'CheckCircle2',
    color: 'text-green-500',
    animate: false
  },
  error: {
    name: '错误',
    icon: 'XCircle',
    color: 'text-red-500',
    animate: false
  }
};

// ==================== 组件 Props ====================

export interface ThinkingDecisionPanelProps {
  /** 思考步骤列表 */
  steps: ThinkingStep[];
  /** 当前执行的步骤索引 */
  currentStepIndex: number;
  /** 是否展开 */
  isExpanded?: boolean;
  /** 展开/折叠回调 */
  onToggle?: () => void;
  /** 主题 */
  isDark?: boolean;
  /** 是否显示全部展开/折叠按钮 */
  showExpandAll?: boolean;
  /** 自定义类名 */
  className?: string;
}

export interface ThinkingStepCardProps {
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

export interface StepStatusBadgeProps {
  /** 状态 */
  status: StepStatus;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否显示文字 */
  showText?: boolean;
  /** 自定义类名 */
  className?: string;
}

// ==================== Recorder 配置 ====================

export interface ThinkingRecorderConfig {
  /** 是否启用 */
  enabled: boolean;
  /** 最大步骤数 */
  maxSteps?: number;
  /** 是否记录详细输入输出 */
  recordDetails?: boolean;
  /** 回调函数 */
  onStepStart?: (step: ThinkingStep) => void;
  onStepEnd?: (step: ThinkingStep) => void;
  onSessionComplete?: (session: ThinkingSession) => void;
}
