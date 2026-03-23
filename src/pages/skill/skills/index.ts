/**
 * Skill 初始化模块
 * 注册所有可用的 Skill
 */

import { getSkillRegistry, SkillRegistry } from './registry/SkillRegistry';
import { ImageGenerationSkill } from './creation/ImageGenerationSkill';
import { SecondaryCreationSkill } from './creation/SecondaryCreationSkill';
import { ImageRecognitionSkill } from './recognition/ImageRecognitionSkill';
import { IntentRecognitionSkill } from './analysis/IntentRecognitionSkill';

let initialized = false;

/**
 * 初始化 Skill 注册表
 */
export function initializeSkills(): SkillRegistry {
  if (initialized) {
    console.log('[initializeSkills] Skills already initialized');
    return getSkillRegistry();
  }

  console.log('[initializeSkills] Initializing skills...');

  const registry = getSkillRegistry();

  // 注册创作类 Skill
  registry.register(new ImageGenerationSkill(), 90, {
    enabled: true,
    category: 'creation'
  });

  registry.register(new SecondaryCreationSkill(), 85, {
    enabled: true,
    category: 'creation'
  });

  // 注册识别类 Skill
  registry.register(new ImageRecognitionSkill(), 88, {
    enabled: true,
    category: 'recognition'
  });

  // 注册分析类 Skill
  registry.register(new IntentRecognitionSkill(), 95, {
    enabled: true,
    category: 'analysis'
  });

  initialized = true;

  const stats = registry.getRegistryStats();
  console.log('[initializeSkills] Skills initialized:', {
    total: stats.totalSkills,
    enabled: stats.enabledSkills,
    byCategory: stats.byCategory
  });

  return registry;
}

/**
 * 获取已初始化的 Skill 注册表
 */
export function getInitializedSkills(): SkillRegistry {
  if (!initialized) {
    throw new Error('Skills not initialized. Call initializeSkills() first.');
  }
  return getSkillRegistry();
}

/**
 * 重置 Skill 注册表（用于测试）
 */
export function resetSkills(): void {
  const { resetSkillRegistry } = require('./registry/SkillRegistry');
  resetSkillRegistry();
  initialized = false;
}
