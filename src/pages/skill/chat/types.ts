import type { SkillMetadata } from '../types/skill';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  skillCall?: SkillCallInfo;
  attachments?: Attachment[];
}

// 需求收集阶段
export type RequirementPhase = 
  | 'analyzing'      // 分析需求中
  | 'collecting'     // 收集信息中
  | 'confirming'     // 确认信息
  | 'executing'      // 执行中
  | 'completed'      // 已完成
  | 'error';         // 出错

// 周边产品分类
export interface MerchandiseCategory {
  id: string;
  name: string;
  icon: string;
  items: string[];
}

export interface RequirementField {
  key: string;
  label: string;
  description: string;
  required: boolean;
  type: 'text' | 'select' | 'multiselect' | 'textarea';
  options?: string[];
  placeholder?: string;
  categories?: MerchandiseCategory[];
}

// 思考步骤类型
export type ThinkingStepType =
  | 'intent-recognition'
  | 'requirement-analysis'
  | 'info-collection'
  | 'skill-execution'
  | 'completed';

export type ThinkingStepStatus = 'pending' | 'processing' | 'completed' | 'error';

// 思考步骤
export interface ThinkingStep {
  id: string;
  type: ThinkingStepType;
  status: ThinkingStepStatus;
  title: string;
  content: string;
  timestamp?: number;
  duration?: number;
  details?: Record<string, unknown>;
}

// 分析详情 - 信息的来源和推理
export interface AnalysisDetail {
  field: string;
  label: string;
  value?: string;
  source: 'explicit' | 'inferred' | 'imported';
  confidence?: number;
  reasoning?: string;
}

export interface SkillCallInfo {
  skillId: string;
  skillName: string;
  intent: string;
  confidence: number;
  status: 'thinking' | 'recognizing' | 'calling' | 'executing' | 'completed' | 'error' | 'waiting';
  phase?: RequirementPhase;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: string;

  // 需求收集相关
  collectedInfo?: Record<string, string>;
  missingFields?: RequirementField[];
  currentQuestion?: string;
  suggestions?: string[];
  summary?: string;
  progress?: {
    current: number;
    total: number;
  };

  // 周边类型选择
  merchandiseSelection?: {
    categories: MerchandiseCategory[];
    selectedIds: string[];
  };

  // 思考过程相关
  thinkingSteps?: ThinkingStep[];
  reasoning?: string;
  analysisDetails?: AnalysisDetail[];
}

export interface Attachment {
  id?: string;
  type: 'image' | 'text' | 'code';
  url?: string;
  thumbnailUrl?: string;
  content?: string;
  title?: string;
  status?: 'completed' | 'error' | 'generating';
  metadata?: {
    width?: number;
    height?: number;
    size?: number;
    format?: string;
    [key: string]: any;
  };
}

export interface ChatState {
  messages: ChatMessage[];
  isProcessing: boolean;
  currentSkillCall: SkillCallInfo | null;
}

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  message: string;
  icon: string;
}

// ============ 历史会话类型 ============

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  // 可选：关联的作品
  workIds?: string[];
}

export interface ChatSessionsState {
  sessions: ChatSession[];
  currentSessionId: string | null;
}
