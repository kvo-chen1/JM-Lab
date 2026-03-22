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

export interface SkillCallInfo {
  skillId: string;
  skillName: string;
  intent: string;
  confidence: number;
  status: 'thinking' | 'recognizing' | 'calling' | 'executing' | 'completed' | 'error';
  phase?: RequirementPhase;              // 当前阶段
  params?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  
  // 需求收集相关
  collectedInfo?: Record<string, string>;  // 已收集的信息
  missingFields?: RequirementField[];      // 缺失的字段
  currentQuestion?: string;                // 当前问题
  suggestions?: string[];                  // 建议回复
  summary?: string;                        // 需求摘要
  progress?: {                             // 收集进度
    current: number;
    total: number;
  };
  
  // 周边类型选择
  merchandiseSelection?: {
    categories: MerchandiseCategory[];
    selectedIds: string[];
  };
}

export interface Attachment {
  id?: string;
  type: 'image' | 'text' | 'code';
  url?: string;
  thumbnailUrl?: string;
  content?: string;
  title?: string;
  status?: 'completed' | 'error' | 'generating';
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
