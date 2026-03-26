/**
 * Agent 服务索引
 * 集中导出所有服务
 */

// ==================== 模型调用服务 ====================
export {
  callCurrentModel,
  getCurrentModelId as getCurrentModel,
  getCurrentModelFromStorage,
  setCurrentModelInStorage as setCurrentModel
} from './modelCaller';

// ==================== 核心服务 ====================

// RAG 服务
export {
  RAGService,
  getRAGService,
  resetRAGService
} from './ragService';
export type { DesignCase } from './ragService';

// 向量存储
export {
  VectorStore,
  getVectorStore,
  resetVectorStore
} from './vectorStore';
export type { VectorItem, SearchResult } from './vectorStore';

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
  resetWorkflowEngine
} from './workflowEngine';
export type { WorkflowTemplate, WorkflowNode, Workflow } from './workflowEngine';

// 建议引擎
export {
  SuggestionEngine,
  getSuggestionEngine,
  resetSuggestionEngine
} from './suggestionEngine';
export type { Suggestion } from './suggestionEngine';

// 图像理解
export {
  ImageUnderstandingService as ImageUnderstanding,
  getImageUnderstandingService as getImageUnderstanding,
  resetImageUnderstandingService as resetImageUnderstanding
} from './imageUnderstanding';
export type { ImageAnalysisResult } from './imageUnderstanding';

// 错误处理
export {
  ErrorHandler,
  errorHandler,
  handleErrors,
  safeExecute,
  createErrorBoundary
} from './errorHandler';
export type { ErrorContext, RecoveryStrategy, ErrorHandlerCallback, ErrorHandleResult } from './errorHandler';

// 上传服务
export {
  uploadImage,
  uploadImages,
  deleteUpload
} from './uploadService';
export type { UploadResult, UploadProgressCallback } from './uploadService';

// ==================== 兼容层（旧服务）====================

// 意图识别（兼容层）
export * from './intentRecognition';

// 记忆服务（兼容层）
export * from './memoryService';

// 上下文管理（兼容层）
export * from './contextManager';

// Agent 服务（兼容层）
export * from './agentService';

// 编排器
export {
  AgentOrchestrator,
  agentOrchestrator,
  processWithOrchestrator
} from './agentOrchestrator';
export type { ConversationContextV2, OrchestratorResponseV2 } from './agentOrchestrator';

// 需求分析服务
export {
  RequirementAnalysisService,
  requirementAnalysisService,
  analyzeRequirements,
  quickAnalyzeRequirements
} from './requirementAnalysisService';
export type { 
  RequirementAnalysis, 
  ProjectType, 
  ComplexityLevel,
  AnalysisOptions 
} from './requirementAnalysisService';

// 决策引擎
export {
  DecisionEngine,
  decisionEngine,
  makeDecision,
  evaluateAgentMatch,
  recommendAgentTeam
} from './decisionEngine';
export type { 
  DecisionContext, 
  DecisionResult 
} from './decisionEngine';

// 智能引导服务
export {
  GuidanceService,
  guidanceService,
  getGuidance,
  getQuickActions,
  getNextSteps
} from './guidanceService';
export type { 
  GuidanceSuggestion, 
  QuickAction,
  ConversationContext as GuidanceContext
} from './guidanceService';

// Prompt 构建器（兼容层）
export * from './promptBuilder';

// 调度器（兼容层）
export * from './agentScheduler';
