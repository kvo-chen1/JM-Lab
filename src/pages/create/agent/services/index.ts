// Agent服务统一导出

// 原有服务
export * from './agentService';
export * from './agentOrchestrator';
export * from './agentPrompts';
export * from './taskQueueManager';
export * from './errorHandler';
export * from './errors';
export * from './uploadService';

// 阶段一：语义理解与RAG
export * from './vectorStore';
export * from './ragService';
export * from './intentRecognition';
export * from './promptBuilder';
export * from './memoryService';

// 阶段二：主动智能
export * from './predictionService';
export * from './suggestionEngine';
export * from './workflowEngine';

// 阶段三：多模态交互
export * from './voiceService';
export * from './imageUnderstanding';

// 阶段四：持续学习
export * from './feedbackLoop';

// 阶段五：系统优化与扩展
export * from './indexedDBStorage';
export * from './dataMigration';
export * from './monitoringService';
export * from './dynamicWorkflowGenerator';
export * from './abTesting';

// 便捷导出单例获取函数
export { getVectorStore, resetVectorStore } from './vectorStore';
export { getRAGService, resetRAGService } from './ragService';
export { getIntentRecognitionService, resetIntentRecognitionService, IntentType } from './intentRecognition';
export { getPromptBuilder, resetPromptBuilder } from './promptBuilder';
export { getMemoryService, resetMemoryService } from './memoryService';

// 阶段二导出
export { getPredictionService, resetPredictionService, BehaviorType } from './predictionService';
export { getSuggestionEngine, resetSuggestionEngine, SuggestionType } from './suggestionEngine';
export { getWorkflowEngine, resetWorkflowEngine, WorkflowNodeType } from './workflowEngine';

// 阶段三导出
export { getVoiceService, resetVoiceService } from './voiceService';
export { getImageUnderstandingService, resetImageUnderstandingService } from './imageUnderstanding';

// 阶段四导出
export { getFeedbackLoopService, resetFeedbackLoopService, FeedbackType } from './feedbackLoop';

// 阶段五导出
export { indexedDBStorage, StoreName } from './indexedDBStorage';
export { dataMigrationService, migrateAllData } from './dataMigration';
export { monitoringService, trackEvent, trackError, trackApiCall, trackAiService } from './monitoringService';
export { 
  dynamicWorkflowGenerator, 
  generateWorkflow, 
  executeWorkflow,
  type Workflow,
  type WorkflowStep,
  type WorkflowExecutionResult 
} from './dynamicWorkflowGenerator';
export { 
  abTestingFramework, 
  createExperiment, 
  assignVariant, 
  trackConversion, 
  generateReport,
  type Experiment,
  type Variant,
  type ExperimentReport 
} from './abTesting';
