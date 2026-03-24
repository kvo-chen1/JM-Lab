/**
 * Skill Registry 模块统一导出
 */

export {
  SkillRegistry,
  getSkillRegistry,
  resetSkillRegistry,
  createSkillRegistry
} from './SkillRegistry';

export {
  SkillMatcher,
  getSkillMatcher,
  resetSkillMatcher,
  createSkillMatcher
} from './SkillMatcher';

// 导出 Agent-Skill 配置
export {
  AGENT_SKILL_CONFIG,
  SKILL_PRIORITY_CONFIG,
  AGENT_CAPABILITY_DESCRIPTIONS,
  getAgentSkills,
  isSkillSupportedByAgent,
  getAgentsBySkill,
  getSkillPriority
} from '../../config/agentSkillConfig';
