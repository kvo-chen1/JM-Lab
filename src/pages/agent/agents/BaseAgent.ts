/**
 * Agent 基类
 * 所有 Agent 的基类，提供与 Skill 的集成能力
 */

import { AgentType, AgentMessage } from '../types/agent';
import {
  ISkill,
  UserIntent,
  ExecutionContext,
  SkillResult,
  SkillMatchResult
} from '../types/skill';
import { SkillRegistry, getSkillRegistry } from '../skills/registry/SkillRegistry';
import { SkillMatcher, getSkillMatcher } from '../skills/registry/SkillMatcher';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  color?: string;
}

export interface AgentResponse {
  content: string;
  type: 'text' | 'image' | 'video' | 'structured';
  metadata?: Record<string, any>;
  suggestedSkills?: string[];
}

export abstract class BaseAgent {
  // Agent 基本信息
  abstract readonly type: AgentType;
  abstract readonly name: string;
  abstract readonly description: string;

  // Skill 相关
  protected skills: ISkill[] = [];
  protected skillRegistry: SkillRegistry;
  protected skillMatcher: SkillMatcher;

  // 配置
  protected config: AgentConfig;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      id: this.type,
      name: this.name,
      description: this.description,
      ...config
    } as AgentConfig;

    this.skillRegistry = getSkillRegistry();
    this.skillMatcher = getSkillMatcher(this.skillRegistry);
  }

  // ==================== 抽象方法 ====================

  /**
   * 处理用户消息
   */
  abstract handleMessage(
    message: string,
    context: ExecutionContext
  ): Promise<AgentResponse>;

  // ==================== Skill 管理 ====================

  /**
   * 注册 Skill
   */
  registerSkill(skill: ISkill, priority?: number): void {
    this.skills.push(skill);
    this.skillRegistry.register(skill, priority);
  }

  /**
   * 批量注册 Skill
   */
  registerSkills(skills: ISkill[]): void {
    for (const skill of skills) {
      this.registerSkill(skill);
    }
  }

  /**
   * 获取已注册的 Skill
   */
  getSkills(): ISkill[] {
    return this.skills;
  }

  /**
   * 查找匹配的 Skill
   */
  protected findMatchingSkills(intent: UserIntent): SkillMatchResult[] {
    // 优先从 Agent 自己的 Skill 中匹配
    const matches: SkillMatchResult[] = [];

    for (const skill of this.skills) {
      const score = this.calculateSkillMatchScore(skill, intent);
      if (score > 0) {
        matches.push({
          skill,
          score,
          confidence: score > 0.7 ? 0.9 : score > 0.4 ? 0.6 : 0.3,
          matchedCapabilities: []
        });
      }
    }

    // 如果没有找到合适的 Skill，从全局注册中心查找
    if (matches.length === 0) {
      return this.skillMatcher.match(intent);
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * 计算 Skill 匹配分数
   */
  private calculateSkillMatchScore(skill: ISkill, intent: UserIntent): number {
    if (skill.canHandle(intent)) {
      return 1;
    }

    // 关键词匹配
    const skillNameMatch = intent.keywords.some(kw =>
      skill.name.toLowerCase().includes(kw.toLowerCase())
    );

    return skillNameMatch ? 0.5 : 0;
  }

  /**
   * 执行 Skill
   */
  protected async executeSkill(
    skill: ISkill,
    context: ExecutionContext
  ): Promise<SkillResult> {
    const startTime = Date.now();

    try {
      const result = await skill.execute(context);

      // 记录执行统计
      const executionTime = Date.now() - startTime;
      this.skillRegistry.recordExecution(skill.id, result.success, executionTime);

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.skillRegistry.recordExecution(skill.id, false, executionTime);

      throw error;
    }
  }

  // ==================== 意图识别 ====================

  /**
   * 识别用户意图
   */
  protected async recognizeIntent(message: string): Promise<UserIntent> {
    // 使用意图识别 Skill
    const intentSkill = this.skillRegistry.getSkill('intent-recognition');

    if (intentSkill) {
      const result = await this.executeSkill(intentSkill, {
        userId: 'default',
        sessionId: 'default',
        message,
        history: []
      });

      if (result.success && result.metadata) {
        return {
          type: result.metadata.intent || 'unclear',
          confidence: result.metadata.confidence || 0,
          keywords: result.metadata.keywords || [],
          entities: result.metadata.entities || {},
          rawMessage: message,
          clarificationNeeded: result.metadata.clarificationNeeded,
          suggestedResponse: result.metadata.suggestedResponse
        };
      }
    }

    // 降级：基础意图识别
    return this.basicIntentRecognition(message);
  }

  /**
   * 基础意图识别（降级方案）
   */
  private basicIntentRecognition(message: string): UserIntent {
    const lowerMsg = message.toLowerCase();
    const keywords = message.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];

    // 简单的关键词匹配
    if (lowerMsg.includes('画') || lowerMsg.includes('生成') || lowerMsg.includes('图像')) {
      return {
        type: 'image-generation',
        confidence: 0.7,
        keywords,
        entities: {},
        rawMessage: message
      };
    }

    if (lowerMsg.includes('视频') || lowerMsg.includes('动画')) {
      return {
        type: 'video-generation',
        confidence: 0.7,
        keywords,
        entities: {},
        rawMessage: message
      };
    }

    if (lowerMsg.includes('文案') || lowerMsg.includes('标语')) {
      return {
        type: 'text-generation',
        confidence: 0.7,
        keywords,
        entities: {},
        rawMessage: message
      };
    }

    return {
      type: 'unclear',
      confidence: 0,
      keywords,
      entities: {},
      rawMessage: message,
      clarificationNeeded: true
    };
  }

  // ==================== 响应构建 ====================

  /**
   * 构建 Agent 响应
   */
  protected buildResponse(skillResult: SkillResult): AgentResponse {
    return {
      content: skillResult.content,
      type: skillResult.type as any,
      metadata: skillResult.metadata,
      suggestedSkills: skillResult.followUpSkills
    };
  }

  /**
   * 创建文本响应
   */
  protected createTextResponse(content: string, metadata?: Record<string, any>): AgentResponse {
    return {
      content,
      type: 'text',
      metadata
    };
  }

  /**
   * 创建错误响应
   */
  protected createErrorResponse(message: string): AgentResponse {
    return {
      content: `抱歉，遇到了问题：${message}`,
      type: 'text',
      metadata: { error: true }
    };
  }

  /**
   * 默认响应
   */
  protected defaultResponse(message: string): AgentResponse {
    return {
      content: `收到您的消息："${message}"。我正在处理中...`,
      type: 'text'
    };
  }

  // ==================== 工具方法 ====================

  /**
   * 提取关键词
   */
  protected extractKeywords(text: string): string[] {
    const words = text.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];
    return words.map(w => w.toLowerCase());
  }

  /**
   * 检查是否包含关键词
   */
  protected containsKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some(kw => lowerText.includes(kw.toLowerCase()));
  }

  // ==================== Getter ====================

  get agentType(): AgentType {
    return this.type;
  }

  get agentName(): string {
    return this.name;
  }

  get agentDescription(): string {
    return this.description;
  }
}
