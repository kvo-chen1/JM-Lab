/**
 * Agent智能优化服务索引
 * 集中导出所有优化后的服务
 */

// ==================== 阶段一：意图识别增强 ====================

export {
  SemanticIntentAnalyzer,
  getSemanticIntentAnalyzer,
  resetSemanticIntentAnalyzer
} from './semanticIntentAnalyzer';

export {
  EntityExtractor,
  EntityType,
  Entity,
  EntityExtractionResult,
  EntityRelation,
  getEntityExtractor,
  resetEntityExtractor
} from './entityExtractor';

export {
  EmbeddingService,
  getEmbeddingService,
  resetEmbeddingService
} from './embeddingService';

// ==================== 阶段二：上下文理解增强 ====================

export {
  DialogStateTracker,
  DialogState,
  DialogContext,
  RequirementSlot,
  getDialogStateTracker,
  createDialogStateTracker,
  removeDialogStateTracker
} from './dialogStateTracker';

export {
  SmartContextCompressor,
  getSmartContextCompressor,
  resetSmartContextCompressor
} from './smartContextCompressor';

export {
  CoreferenceResolver,
  ReferenceType,
  Coreference,
  CoreferenceResolutionResult,
  getCoreferenceResolver,
  resetCoreferenceResolver
} from './coreferenceResolver';

// ==================== 阶段三：记忆和学习 ====================

export {
  UserProfileService,
  UserProfile,
  PreferenceItem,
  UserSession,
  getUserProfileService,
  resetUserProfileService
} from './userProfileService';

export {
  LongTermMemory,
  Memory,
  MemoryType,
  MemorySearchOptions,
  MemoryStats,
  getLongTermMemory,
  resetLongTermMemory
} from './longTermMemory';

export {
  FeedbackLearning,
  Feedback,
  FeedbackType,
  FeedbackStats,
  LearningResult,
  getFeedbackLearning,
  resetFeedbackLearning
} from './feedbackLearning';

// ==================== 集成服务 ====================

export {
  callEnhancedAgent,
  collectUserFeedback,
  EnhancedAIResponse
} from './enhancedAgentIntegration';

// ==================== 兼容层服务（向后兼容）====================

export * from './intentRecognition';
export * from './contextManager';
export * from './memoryService';
export * from './feedbackLoop';

// ==================== 核心服务 ====================

export * from './agentService';
export * from './agentOrchestrator';
export * from './agentPrompts';
export * from './ragService';
export * from './vectorStore';
export * from './promptBuilder';
export * from './workflowEngine';
export * from './agentScheduler';
export * from './suggestionEngine';
export * from './imageUnderstanding';
export * from './voiceService';
export * from './monitoringService';
export * from './predictionService';
export * from './dynamicWorkflowGenerator';
export * from './enhancedTaskQueue';
export * from './resourceManager';
export * from './indexedDBStorage';
export * from './networkMonitor';
export * from './dataMigration';
export * from './abTesting';
export * from './uploadService';
export * from './taskQueueManager';
export * from './errorHandler';
export * from './errors';
