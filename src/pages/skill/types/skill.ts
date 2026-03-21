/**
 * Skill 类型定义
 * 定义 Skill 架构的核心类型和接口
 */

// ==================== Skill 分类 ====================

export enum SkillCategory {
  CREATION = 'creation',
  ANALYSIS = 'analysis',
  COGNITION = 'cognition',
  ORCHESTRATION = 'orchestration',
  ENHANCEMENT = 'enhancement'
}

export const SkillCategoryNames: Record<SkillCategory, string> = {
  [SkillCategory.CREATION]: '创作类',
  [SkillCategory.ANALYSIS]: '分析类',
  [SkillCategory.COGNITION]: '认知类',
  [SkillCategory.ORCHESTRATION]: '编排类',
  [SkillCategory.ENHANCEMENT]: '增强类'
};

// ==================== 能力定义 ====================

export interface Capability {
  id: string;
  name: string;
  description: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  parameters?: Parameter[];
}

export interface Parameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  defaultValue?: any;
}

// ==================== 用户意图 ====================

export interface UserIntent {
  type: string;
  confidence: number;
  keywords: string[];
  entities: Record<string, any>;
  rawMessage: string;
  clarificationNeeded?: boolean;
  suggestedResponse?: string;
}

// ==================== 执行上下文 ====================

export interface ExecutionContext {
  userId: string;
  sessionId: string;
  message: string;
  history: any[];
  currentAgent?: string;
  parameters?: Record<string, any>;
  memory?: MemorySnapshot;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface MemorySnapshot {
  userPreferences?: Record<string, any>;
  conversationHistory?: any[];
  learnedPatterns?: Record<string, any>;
  recentTopics?: string[];
}

// ==================== Skill 执行结果 ====================

export type SkillResultType = 'text' | 'image' | 'video' | 'audio' | 'structured' | 'delegation' | 'workflow';

export interface SkillResult {
  success: boolean;
  content: string;
  type: SkillResultType;
  metadata?: Record<string, any>;
  followUpSkills?: string[];
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

// ==================== Skill 元数据 ====================

export interface SkillMetadata {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  version: string;
  capabilities: Capability[];
  supportedAgents: string[];
  requiredSkills?: string[];
  configSchema?: Record<string, any>;
}

// ==================== Skill 接口 ====================

export interface ISkill {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: SkillCategory;
  readonly capabilities: Capability[];
  readonly version: string;

  canHandle(intent: UserIntent): boolean;
  execute(context: ExecutionContext): Promise<SkillResult>;
  getMetadata(): SkillMetadata;

  initialize?(config?: Record<string, any>): Promise<void>;
  destroy?(): Promise<void>;
  validateInput?(input: Record<string, any>): boolean;
}

// ==================== Skill 注册信息 ====================

export interface SkillRegistration {
  skill: ISkill;
  priority: number;
  enabled: boolean;
  config?: Record<string, any>;
  registeredAt: number;
}

// ==================== Skill 匹配结果 ====================

export interface SkillMatchResult {
  skill: ISkill;
  score: number;
  confidence: number;
  matchedCapabilities: string[];
}

// ==================== Skill 统计 ====================

export interface SkillStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecutedAt?: number;
}

// ==================== Skill 事件 ====================

export type SkillEventType =
  | 'skill:registered'
  | 'skill:unregistered'
  | 'skill:executed'
  | 'skill:failed'
  | 'skill:matched';

export interface SkillEvent {
  type: SkillEventType;
  skillId: string;
  timestamp: number;
  data?: Record<string, any>;
}

export type SkillEventHandler = (event: SkillEvent) => void;

// ==================== Skill 配置 ====================

export interface SkillConfig {
  id: string;
  enabled: boolean;
  priority: number;
  parameters?: Record<string, any>;
  constraints?: {
    maxExecutionTime?: number;
    maxRetries?: number;
    allowedAgents?: string[];
  };
}

// ==================== Skill 过滤器 ====================

export interface SkillFilter {
  category?: SkillCategory;
  agent?: string;
  capability?: string;
  enabled?: boolean;
}

// ==================== 辅助类型 ====================

export type SkillId = string;
export type CapabilityId = string;
export type SkillFactory = (config?: Record<string, any>) => ISkill;

export interface SkillRegistryConfig {
  autoRegister?: boolean;
  defaultPriority?: number;
  enableCache?: boolean;
  maxCacheSize?: number;
}
