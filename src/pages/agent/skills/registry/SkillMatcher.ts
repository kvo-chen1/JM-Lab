/**
 * Skill 匹配器
 * 根据用户意图匹配最合适的 Skill
 */

import {
  ISkill,
  UserIntent,
  SkillMatchResult,
  SkillCategory,
  ExecutionContext,
  AgentType
} from '../../types/skill';
import { SkillRegistry } from './SkillRegistry';

// 匹配权重配置
interface MatchWeights {
  intentType: number;
  keywords: number;
  entities: number;
  category: number;
  agentCompatibility: number;
  historicalSuccess: number;
}

// 默认权重
const DEFAULT_WEIGHTS: MatchWeights = {
  intentType: 0.3,
  keywords: 0.25,
  entities: 0.2,
  category: 0.1,
  agentCompatibility: 0.1,
  historicalSuccess: 0.05
};

// 关键词映射表
const KEYWORD_MAP: Record<string, string[]> = {
  'image-generation': ['画', '生成', '图像', '图片', '绘制', '创作', '设计', '插画'],
  'video-generation': ['视频', '动画', '动效', '短片', '影片'],
  'text-generation': ['文案', '文字', '写作', '创作', '生成'],
  'intent-recognition': ['意图', '理解', '分析', '识别'],
  'requirement-analysis': ['需求', '分析', '调研', '了解'],
  'memory': ['记忆', '记住', '历史', '偏好'],
  'orchestration': ['编排', '调度', '分配', '协调'],
  'rag': ['检索', '搜索', '知识', '案例']
};

// 意图类型到 Skill 的映射
const INTENT_SKILL_MAP: Record<string, string[]> = {
  'image-generation': ['image-generation', 'design', 'illustration'],
  'video-generation': ['video-generation', 'animation'],
  'text-generation': ['text-generation', 'copywriting'],
  'design-request': ['design', 'image-generation', 'illustration'],
  'requirement-collection': ['requirement-analysis', 'intent-recognition'],
  'style-inquiry': ['style-recommendation', 'design'],
  'modification': ['image-modification', 'design-optimization']
};

export class SkillMatcher {
  private registry: SkillRegistry;
  private weights: MatchWeights;

  constructor(registry: SkillRegistry, weights: Partial<MatchWeights> = {}) {
    this.registry = registry;
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
  }

  /**
   * 根据意图匹配最佳 Skill
   */
  match(intent: UserIntent, context?: ExecutionContext): SkillMatchResult[] {
    const allSkills = this.registry.getAllSkills();
    const results: SkillMatchResult[] = [];

    for (const skill of allSkills) {
      const score = this.calculateMatchScore(skill, intent, context);
      if (score > 0) {
        results.push({
          skill,
          score,
          confidence: this.calculateConfidence(score),
          matchedCapabilities: this.getMatchedCapabilities(skill, intent)
        });
      }
    }

    // 按分数排序
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * 匹配单个最佳 Skill
   */
  matchBest(intent: UserIntent, context?: ExecutionContext): SkillMatchResult | null {
    const matches = this.match(intent, context);
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * 计算匹配分数
   */
  private calculateMatchScore(
    skill: ISkill,
    intent: UserIntent,
    context?: ExecutionContext
  ): number {
    let score = 0;

    // 1. 意图类型匹配
    score += this.calculateIntentTypeScore(skill, intent) * this.weights.intentType;

    // 2. 关键词匹配
    score += this.calculateKeywordScore(skill, intent) * this.weights.keywords;

    // 3. 实体匹配
    score += this.calculateEntityScore(skill, intent) * this.weights.entities;

    // 4. 分类匹配
    score += this.calculateCategoryScore(skill, intent) * this.weights.category;

    // 5. Agent 兼容性
    if (context?.currentAgent) {
      score += this.calculateAgentCompatibility(skill, context.currentAgent) * this.weights.agentCompatibility;
    }

    // 6. 历史成功率
    score += this.calculateHistoricalSuccessScore(skill) * this.weights.historicalSuccess;

    return Math.min(score, 1);
  }

  /**
   * 计算意图类型匹配分数
   */
  private calculateIntentTypeScore(skill: ISkill, intent: UserIntent): number {
    // 使用 Skill 的 canHandle 方法
    if (skill.canHandle(intent)) {
      return 1;
    }

    // 检查意图类型映射
    const mappedSkills = INTENT_SKILL_MAP[intent.type];
    if (mappedSkills?.includes(skill.id)) {
      return 0.8;
    }

    return 0;
  }

  /**
   * 计算关键词匹配分数
   */
  private calculateKeywordScore(skill: ISkill, intent: UserIntent): number {
    const skillKeywords = KEYWORD_MAP[skill.id] || [];
    if (skillKeywords.length === 0) return 0.5;

    const matchedKeywords = intent.keywords.filter(kw =>
      skillKeywords.some(sk => kw.toLowerCase().includes(sk.toLowerCase()))
    );

    return matchedKeywords.length / Math.max(skillKeywords.length, intent.keywords.length);
  }

  /**
   * 计算实体匹配分数
   */
  private calculateEntityScore(skill: ISkill, intent: UserIntent): number {
    const metadata = skill.getMetadata();
    const requiredEntities = metadata.requiredSkills || [];

    if (requiredEntities.length === 0) return 0.5;

    const matchedEntities = requiredEntities.filter(entity =>
      intent.entities[entity] !== undefined
    );

    return matchedEntities.length / requiredEntities.length;
  }

  /**
   * 计算分类匹配分数
   */
  private calculateCategoryScore(skill: ISkill, intent: UserIntent): number {
    // 根据意图类型推断分类
    const categoryMap: Record<string, SkillCategory> = {
      'image-generation': SkillCategory.CREATION,
      'video-generation': SkillCategory.CREATION,
      'text-generation': SkillCategory.CREATION,
      'design-request': SkillCategory.CREATION,
      'requirement-collection': SkillCategory.ANALYSIS,
      'style-inquiry': SkillCategory.ENHANCEMENT,
      'modification': SkillCategory.CREATION
    };

    const expectedCategory = categoryMap[intent.type];
    if (!expectedCategory) return 0.5;

    return skill.category === expectedCategory ? 1 : 0.3;
  }

  /**
   * 计算 Agent 兼容性分数
   */
  private calculateAgentCompatibility(skill: ISkill, agent: AgentType): number {
    const metadata = skill.getMetadata();

    if (metadata.supportedAgents.includes(agent)) {
      return 1;
    }

    if (metadata.supportedAgents.includes('system')) {
      return 0.5;
    }

    return 0;
  }

  /**
   * 计算历史成功率分数
   */
  private calculateHistoricalSuccessScore(skill: ISkill): number {
    const stats = this.registry.getStats(skill.id);
    if (!stats || stats.totalExecutions === 0) {
      return 0.5; // 默认中等分数
    }

    return stats.successfulExecutions / stats.totalExecutions;
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(score: number): number {
    if (score >= 0.8) return 0.95;
    if (score >= 0.6) return 0.75;
    if (score >= 0.4) return 0.5;
    return 0.25;
  }

  /**
   * 获取匹配的能力
   */
  private getMatchedCapabilities(skill: ISkill, intent: UserIntent): string[] {
    return skill.capabilities
      .filter(cap => {
        // 检查能力 ID 是否在意图关键词中
        return intent.keywords.some(kw =>
          cap.id.toLowerCase().includes(kw.toLowerCase()) ||
          cap.name.toLowerCase().includes(kw.toLowerCase())
        );
      })
      .map(cap => cap.id);
  }

  /**
   * 多 Skill 组合匹配
   */
  findSkillChain(intent: UserIntent, context?: ExecutionContext): ISkill[] | null {
    const matches = this.match(intent, context);

    // 如果最佳匹配的置信度足够高，直接返回
    if (matches.length > 0 && matches[0].confidence >= 0.8) {
      return [matches[0].skill];
    }

    // 否则，尝试组合多个 Skill
    const chain: ISkill[] = [];
    let remainingIntent = { ...intent };

    for (const match of matches.slice(0, 3)) {
      if (match.score > 0.3) {
        chain.push(match.skill);

        // 更新意图（假设已处理部分）
        remainingIntent = this.updateIntentAfterSkill(remainingIntent, match.skill);

        // 如果置信度足够，停止添加
        if (match.confidence >= 0.7) break;
      }
    }

    return chain.length > 0 ? chain : null;
  }

  /**
   * 更新意图（模拟 Skill 处理后的状态）
   */
  private updateIntentAfterSkill(intent: UserIntent, skill: ISkill): UserIntent {
    // 这里可以根据 Skill 类型调整意图
    // 简化处理：返回原意图
    return intent;
  }

  /**
   * 设置匹配权重
   */
  setWeights(weights: Partial<MatchWeights>): void {
    this.weights = { ...this.weights, ...weights };
  }

  /**
   * 获取当前权重
   */
  getWeights(): MatchWeights {
    return { ...this.weights };
  }

  /**
   * 添加关键词映射
   */
  addKeywordMapping(skillId: string, keywords: string[]): void {
    if (!KEYWORD_MAP[skillId]) {
      KEYWORD_MAP[skillId] = [];
    }
    KEYWORD_MAP[skillId].push(...keywords);
  }

  /**
   * 添加意图到 Skill 的映射
   */
  addIntentMapping(intentType: string, skillIds: string[]): void {
    if (!INTENT_SKILL_MAP[intentType]) {
      INTENT_SKILL_MAP[intentType] = [];
    }
    INTENT_SKILL_MAP[intentType].push(...skillIds);
  }
}

// ==================== 单例导出 ====================

let matcherInstance: SkillMatcher | null = null;

export function getSkillMatcher(registry?: SkillRegistry): SkillMatcher {
  if (!matcherInstance) {
    const reg = registry || new (require('./SkillRegistry').SkillRegistry)();
    matcherInstance = new SkillMatcher(reg);
  }
  return matcherInstance;
}

export function resetSkillMatcher(): void {
  matcherInstance = null;
}

export function createSkillMatcher(
  registry: SkillRegistry,
  weights?: Partial<MatchWeights>
): SkillMatcher {
  return new SkillMatcher(registry, weights);
}
