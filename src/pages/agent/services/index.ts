/**
 * Agent 服务索引
 * 集中导出所有服务
 */

// ==================== 新 Skill 架构 ====================

// Skill 类型和基类
export {
  // 类型
  SkillCategory,
  SkillCategoryNames,
  UserIntent,
  ExecutionContext,
  SkillResult,
  SkillResultType,
  SkillMetadata,
  ISkill,
  SkillRegistration,
  SkillMatchResult,
  SkillFilter,
  SkillConfig,
  SkillEvent,
  SkillEventType,
  SkillEventHandler,
  SkillStats,
  Capability,
  Parameter,
  MemorySnapshot,
  SkillChain,
  SkillChainCondition,
  SkillId,
  SkillFactory,
  SkillRegistryConfig
} from '../types/skill';

// Skill 注册中心和匹配器
export {
  SkillRegistry,
  getSkillRegistry,
  resetSkillRegistry,
  createSkillRegistry
} from '../skills/registry/SkillRegistry';

export {
  SkillMatcher,
  getSkillMatcher,
  resetSkillMatcher,
  createSkillMatcher
} from '../skills/registry/SkillMatcher';

// Skill 基类
export {
  BaseSkill,
  BaseSkillConfig,
  CreationSkill,
  AnalysisSkill,
  CognitionSkill,
  OrchestrationSkill,
  EnhancementSkill
} from '../skills/base/BaseSkill';

// 创作类 Skill
export { ImageGenerationSkill, ImageGenerationConfig } from '../skills/creation/ImageGenerationSkill';
export { VideoGenerationSkill, VideoGenerationConfig } from '../skills/creation/VideoGenerationSkill';
export { TextGenerationSkill, TextGenerationConfig } from '../skills/creation/TextGenerationSkill';

// 分析类 Skill
export { IntentRecognitionSkill, IntentRecognitionConfig } from '../skills/analysis/IntentRecognitionSkill';
export { RequirementAnalysisSkill } from '../skills/analysis/RequirementAnalysisSkill';

// Agent - 类型和函数
export type { AgentConfig, AgentResponse, AgentInfo } from '../agents';
export {
  BaseAgent,
  DirectorAgent,
  DesignerAgent,
  createAgent,
  getAllAgentTypes,
  getAllAgentInfo
} from '../agents';

// ==================== 模型调用服务 ====================
export { callCurrentModel, getCurrentModel, setCurrentModel } from './modelCaller';

// ==================== 保留的核心服务（向后兼容）====================

// RAG 服务
export {
  RAGService,
  getRAGService,
  resetRAGService,
  DesignCase
} from './ragService';

// 向量存储
export {
  VectorStore,
  getVectorStore,
  resetVectorStore,
  VectorItem,
  SearchResult
} from './vectorStore';

// 嵌入服务
export {
  EmbeddingService,
  getEmbeddingService,
  resetEmbeddingService
} from './embeddingService';

// 工作流引擎
export {
  WorkflowEngine,
  getWorkflowEngine,
  resetWorkflowEngine,
  WorkflowTemplate,
  WorkflowNode,
  Workflow
} from './workflowEngine';

// 建议引擎
export {
  SuggestionEngine,
  getSuggestionEngine,
  resetSuggestionEngine,
  Suggestion
} from './suggestionEngine';

// 图像理解
export {
  ImageUnderstanding,
  getImageUnderstanding,
  resetImageUnderstanding,
  ImageAnalysisResult
} from './imageUnderstanding';

// 错误处理
export {
  ErrorHandler,
  getErrorHandler,
  resetErrorHandler,
  ErrorContext,
  RecoveryStrategy
} from './errorHandler';

// 上传服务
export { uploadService } from './uploadService';

// ==================== 兼容层（旧服务）====================

// 意图识别（兼容层）
export * from './intentRecognition';

// 记忆服务（兼容层）
export * from './memoryService';

// 上下文管理（兼容层）
export * from './contextManager';

// Agent 服务（兼容层）
export * from './agentService';

// 编排器（兼容层）
export * from './agentOrchestrator';

// Prompt 构建器（兼容层）
export * from './promptBuilder';

// 调度器（兼容层）
export * from './agentScheduler';

// Skill Agent 适配器
export {
  isQuickGenerationRequest,
  processWithAgentSkill,
  smartProcessMessage
} from './skillAgentAdapter';
