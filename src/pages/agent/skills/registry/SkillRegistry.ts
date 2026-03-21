/**
 * Skill 注册中心
 * 管理所有 Skill 的注册、查询和生命周期
 */

import {
  ISkill,
  SkillRegistration,
  SkillFilter,
  SkillConfig,
  SkillEvent,
  SkillEventType,
  SkillEventHandler,
  SkillStats,
  SkillId,
  SkillRegistryConfig,
  SkillCategory,
  AgentType
} from '../../types/skill';

// 默认配置
const DEFAULT_CONFIG: SkillRegistryConfig = {
  autoRegister: true,
  defaultPriority: 100,
  enableCache: true,
  maxCacheSize: 100
};

export class SkillRegistry {
  private skills: Map<SkillId, SkillRegistration> = new Map();
  private eventHandlers: Map<SkillEventType, Set<SkillEventHandler>> = new Map();
  private stats: Map<SkillId, SkillStats> = new Map();
  private config: SkillRegistryConfig;

  constructor(config: SkillRegistryConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==================== Skill 注册管理 ====================

  /**
   * 注册 Skill
   */
  register(
    skill: ISkill,
    priority: number = this.config.defaultPriority!,
    config?: Record<string, any>
  ): boolean {
    if (this.skills.has(skill.id)) {
      console.warn(`[SkillRegistry] Skill ${skill.id} already registered, updating...`);
      this.unregister(skill.id);
    }

    const registration: SkillRegistration = {
      skill,
      priority,
      enabled: true,
      config,
      registeredAt: Date.now()
    };

    this.skills.set(skill.id, registration);
    this.stats.set(skill.id, {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0
    });

    // 触发注册事件
    this.emitEvent({
      type: 'skill:registered',
      skillId: skill.id,
      timestamp: Date.now(),
      data: { priority, config }
    });

    console.log(`[SkillRegistry] Registered skill: ${skill.id} (${skill.name})`);
    return true;
  }

  /**
   * 批量注册 Skill
   */
  registerBatch(skills: Array<{ skill: ISkill; priority?: number; config?: Record<string, any> }>): void {
    for (const { skill, priority, config } of skills) {
      this.register(skill, priority, config);
    }
  }

  /**
   * 注销 Skill
   */
  unregister(skillId: SkillId): boolean {
    const registration = this.skills.get(skillId);
    if (!registration) return false;

    // 调用 Skill 的销毁方法
    if (registration.skill.destroy) {
      registration.skill.destroy().catch(err => {
        console.error(`[SkillRegistry] Error destroying skill ${skillId}:`, err);
      });
    }

    this.skills.delete(skillId);
    this.stats.delete(skillId);

    // 触发注销事件
    this.emitEvent({
      type: 'skill:unregistered',
      skillId,
      timestamp: Date.now()
    });

    console.log(`[SkillRegistry] Unregistered skill: ${skillId}`);
    return true;
  }

  /**
   * 获取已注册的 Skill
   */
  getSkill(skillId: SkillId): ISkill | undefined {
    const registration = this.skills.get(skillId);
    return registration?.enabled ? registration.skill : undefined;
  }

  /**
   * 获取 Skill 注册信息
   */
  getRegistration(skillId: SkillId): SkillRegistration | undefined {
    return this.skills.get(skillId);
  }

  /**
   * 获取所有已注册的 Skill
   */
  getAllSkills(): ISkill[] {
    return Array.from(this.skills.values())
      .filter(r => r.enabled)
      .map(r => r.skill);
  }

  /**
   * 获取所有 Skill ID
   */
  getAllSkillIds(): SkillId[] {
    return Array.from(this.skills.keys());
  }

  // ==================== Skill 查询与过滤 ====================

  /**
   * 根据过滤器获取 Skill
   */
  filterSkills(filter: SkillFilter): ISkill[] {
    return Array.from(this.skills.values())
      .filter(registration => {
        const { skill, enabled } = registration;

        // 检查是否启用
        if (filter.enabled !== undefined && enabled !== filter.enabled) {
          return false;
        }

        // 检查分类
        if (filter.category && skill.category !== filter.category) {
          return false;
        }

        // 检查支持的 Agent
        if (filter.agent) {
          const metadata = skill.getMetadata();
          if (!metadata.supportedAgents.includes(filter.agent)) {
            return false;
          }
        }

        // 检查能力
        if (filter.capability) {
          const hasCapability = skill.capabilities.some(
            cap => cap.id === filter.capability
          );
          if (!hasCapability) return false;
        }

        return true;
      })
      .sort((a, b) => b.priority - a.priority)
      .map(r => r.skill);
  }

  /**
   * 根据分类获取 Skill
   */
  getSkillsByCategory(category: SkillCategory): ISkill[] {
    return this.filterSkills({ category });
  }

  /**
   * 根据 Agent 获取支持的 Skill
   */
  getSkillsByAgent(agent: AgentType): ISkill[] {
    return this.filterSkills({ agent });
  }

  /**
   * 根据能力获取 Skill
   */
  getSkillsByCapability(capabilityId: string): ISkill[] {
    return this.filterSkills({ capability: capabilityId });
  }

  // ==================== Skill 状态管理 ====================

  /**
   * 启用 Skill
   */
  enableSkill(skillId: SkillId): boolean {
    const registration = this.skills.get(skillId);
    if (!registration) return false;

    registration.enabled = true;
    console.log(`[SkillRegistry] Enabled skill: ${skillId}`);
    return true;
  }

  /**
   * 禁用 Skill
   */
  disableSkill(skillId: SkillId): boolean {
    const registration = this.skills.get(skillId);
    if (!registration) return false;

    registration.enabled = false;
    console.log(`[SkillRegistry] Disabled skill: ${skillId}`);
    return true;
  }

  /**
   * 检查 Skill 是否已启用
   */
  isEnabled(skillId: SkillId): boolean {
    const registration = this.skills.get(skillId);
    return registration?.enabled ?? false;
  }

  /**
   * 设置 Skill 优先级
   */
  setPriority(skillId: SkillId, priority: number): boolean {
    const registration = this.skills.get(skillId);
    if (!registration) return false;

    registration.priority = priority;
    return true;
  }

  /**
   * 更新 Skill 配置
   */
  updateConfig(skillId: SkillId, config: Record<string, any>): boolean {
    const registration = this.skills.get(skillId);
    if (!registration) return false;

    registration.config = { ...registration.config, ...config };
    return true;
  }

  // ==================== Skill 统计 ====================

  /**
   * 记录 Skill 执行
   */
  recordExecution(
    skillId: SkillId,
    success: boolean,
    executionTime: number
  ): void {
    const stats = this.stats.get(skillId);
    if (!stats) return;

    stats.totalExecutions++;
    if (success) {
      stats.successfulExecutions++;
    } else {
      stats.failedExecutions++;
    }

    // 更新平均执行时间
    stats.averageExecutionTime =
      (stats.averageExecutionTime * (stats.totalExecutions - 1) + executionTime) /
      stats.totalExecutions;

    stats.lastExecutedAt = Date.now();

    // 触发事件
    this.emitEvent({
      type: success ? 'skill:executed' : 'skill:failed',
      skillId,
      timestamp: Date.now(),
      data: { executionTime, success }
    });
  }

  /**
   * 获取 Skill 统计信息
   */
  getStats(skillId: SkillId): SkillStats | undefined {
    return this.stats.get(skillId);
  }

  /**
   * 获取所有 Skill 的统计信息
   */
  getAllStats(): Map<SkillId, SkillStats> {
    return new Map(this.stats);
  }

  // ==================== 事件系统 ====================

  /**
   * 订阅事件
   */
  on(eventType: SkillEventType, handler: SkillEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }

    this.eventHandlers.get(eventType)!.add(handler);

    // 返回取消订阅函数
    return () => {
      this.eventHandlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * 触发事件
   */
  private emitEvent(event: SkillEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (err) {
          console.error(`[SkillRegistry] Error in event handler:`, err);
        }
      });
    }
  }

  // ==================== 全局统计 ====================

  /**
   * 获取注册中心统计信息
   */
  getRegistryStats(): {
    totalSkills: number;
    enabledSkills: number;
    disabledSkills: number;
    byCategory: Record<SkillCategory, number>;
  } {
    const byCategory: Record<SkillCategory, number> = {
      [SkillCategory.CREATION]: 0,
      [SkillCategory.ANALYSIS]: 0,
      [SkillCategory.COGNITION]: 0,
      [SkillCategory.ORCHESTRATION]: 0,
      [SkillCategory.ENHANCEMENT]: 0
    };

    let enabledCount = 0;

    for (const { skill, enabled } of this.skills.values()) {
      byCategory[skill.category]++;
      if (enabled) enabledCount++;
    }

    return {
      totalSkills: this.skills.size,
      enabledSkills: enabledCount,
      disabledSkills: this.skills.size - enabledCount,
      byCategory
    };
  }

  // ==================== 清理 ====================

  /**
   * 清空所有 Skill
   */
  clear(): void {
    // 调用所有 Skill 的销毁方法
    for (const [skillId, registration] of this.skills) {
      if (registration.skill.destroy) {
        registration.skill.destroy().catch(err => {
          console.error(`[SkillRegistry] Error destroying skill ${skillId}:`, err);
        });
      }
    }

    this.skills.clear();
    this.stats.clear();
    this.eventHandlers.clear();

    console.log('[SkillRegistry] Cleared all skills');
  }

  /**
   * 检查 Skill 是否存在
   */
  hasSkill(skillId: SkillId): boolean {
    return this.skills.has(skillId);
  }
}

// ==================== 单例导出 ====================

let registryInstance: SkillRegistry | null = null;

export function getSkillRegistry(config?: SkillRegistryConfig): SkillRegistry {
  if (!registryInstance) {
    registryInstance = new SkillRegistry(config);
  }
  return registryInstance;
}

export function resetSkillRegistry(): void {
  if (registryInstance) {
    registryInstance.clear();
    registryInstance = null;
  }
}

export function createSkillRegistry(config?: SkillRegistryConfig): SkillRegistry {
  return new SkillRegistry(config);
}
