/**
 * Skill 模块统一导出
 */

// ==================== 类型 ====================
export * from '../types/skill';

// ==================== 注册中心 ====================
export {
  SkillRegistry,
  getSkillRegistry,
  resetSkillRegistry,
  createSkillRegistry
} from './registry/SkillRegistry';

export {
  SkillMatcher,
  getSkillMatcher,
  resetSkillMatcher,
  createSkillMatcher
} from './registry/SkillMatcher';

// ==================== 基类 ====================
export {
  BaseSkill,
  BaseSkillConfig,
  CreationSkill,
  AnalysisSkill,
  CognitionSkill,
  OrchestrationSkill,
  EnhancementSkill
} from './base/BaseSkill';

// ==================== 创作类 Skill ====================
export { ImageGenerationSkill } from './creation/ImageGenerationSkill';
export { VideoGenerationSkill } from './creation/VideoGenerationSkill';
export { TextGenerationSkill } from './creation/TextGenerationSkill';

// ==================== 分析类 Skill ====================
export { IntentRecognitionSkill } from './analysis/IntentRecognitionSkill';
export { RequirementAnalysisSkill } from './analysis/RequirementAnalysisSkill';

// ==================== 认知类 Skill ====================
export { MemorySkill } from './cognition/MemorySkill';
export { LearningSkill } from './cognition/LearningSkill';

// ==================== 编排类 Skill ====================
export { OrchestrationSkill as OrchestrationSkillImpl } from './orchestration/OrchestrationSkill';

// ==================== 增强类 Skill ====================
export { RAGSkill } from './enhancement/RAGSkill';
export { ContextSkill } from './enhancement/ContextSkill';
