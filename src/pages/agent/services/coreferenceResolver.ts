/**
 * 指代消解服务
 * 解析代词指代和跨句子的实体关联
 */

import { AgentMessage } from '../types/agent';
import { Entity, EntityType, getEntityExtractor } from './entityExtractor';

// 指代类型
export enum ReferenceType {
  PRONOUN = 'PRONOUN',           // 代词指代（那个、它、这个）
  DEFINITE = 'DEFINITE',         // 定指（那个风格）
  DEMONSTRATIVE = 'DEMONSTRATIVE', // 指示词（这个、那个）
  IMPLICIT = 'IMPLICIT'          // 隐式指代
}

// 指代项
export interface Coreference {
  id: string;
  text: string;
  type: ReferenceType;
  position: number;
  resolvedEntity?: Entity;
  confidence: number;
  candidates: Entity[];
}

// 指代消解结果
export interface CoreferenceResolutionResult {
  originalText: string;
  resolvedText: string;
  coreferences: Coreference[];
  unresolved: Coreference[];
  needsConfirmation: boolean;
}

// 指代词词典
const PRONOUN_PATTERNS = {
  [EntityType.DESIGN_TYPE]: ['它', '这个设计', '那个设计', '这个作品', '那个作品'],
  [EntityType.STYLE]: ['那个风格', '这个风格', '那种风格', '这种风格', '它'],
  [EntityType.COLOR]: ['那个颜色', '这个颜色', '那种颜色', '这种颜色'],
  [EntityType.ELEMENT]: ['那个元素', '这个元素', '那个图案', '这个图案'],
  [EntityType.AUDIENCE]: ['他们', '她们', '它们', '那些人', '这些人']
};

// 指示词
const DEMONSTRATIVES = ['这个', '那个', '这种', '那种', '这边', '那边', '这里', '那里'];

// 代词
const PRONOUNS = ['它', '他', '她', '它们', '他们', '她们', '这', '那'];

/**
 * 指代消解器类
 */
export class CoreferenceResolver {
  private entityExtractor = getEntityExtractor();
  private entityHistory: Entity[] = [];
  private recentEntities: Map<EntityType, Entity> = new Map();

  /**
   * 解析文本中的指代
   */
  async resolve(
    text: string,
    contextMessages: AgentMessage[] = []
  ): Promise<CoreferenceResolutionResult> {
    // 1. 提取当前文本的实体
    const currentEntities = await this.entityExtractor.extractByRules(text);
    
    // 2. 从历史消息中提取实体
    await this.extractEntitiesFromHistory(contextMessages);
    
    // 3. 识别指代词
    const coreferences = this.identifyCoreferences(text);
    
    // 4. 解析指代
    const resolved: Coreference[] = [];
    const unresolved: Coreference[] = [];
    
    for (const coref of coreferences) {
      const resolution = await this.resolveCoreference(coref, currentEntities);
      if (resolution.resolvedEntity) {
        resolved.push(resolution);
      } else {
        unresolved.push(resolution);
      }
    }
    
    // 5. 生成解析后的文本
    const resolvedText = this.generateResolvedText(text, resolved);
    
    // 6. 检查是否需要确认
    const needsConfirmation = unresolved.length > 0 || 
      resolved.some(r => r.confidence < 0.7);

    return {
      originalText: text,
      resolvedText,
      coreferences: resolved,
      unresolved,
      needsConfirmation
    };
  }

  /**
   * 从历史消息中提取实体
   */
  private async extractEntitiesFromHistory(messages: AgentMessage[]): Promise<void> {
    // 只处理最近10条消息
    const recentMessages = messages.slice(-10);
    
    for (const message of recentMessages) {
      if (message.role === 'user') {
        const entities = await this.entityExtractor.extractByRules(message.content);
        
        for (const entity of entities) {
          this.entityHistory.push(entity);
          
          // 更新最近实体（按类型）
          const existing = this.recentEntities.get(entity.type);
          if (!existing || entity.confidence > existing.confidence) {
            this.recentEntities.set(entity.type, entity);
          }
        }
      }
    }
    
    // 限制历史长度
    if (this.entityHistory.length > 50) {
      this.entityHistory = this.entityHistory.slice(-50);
    }
  }

  /**
   * 识别文本中的指代词
   */
  private identifyCoreferences(text: string): Coreference[] {
    const coreferences: Coreference[] = [];
    
    // 检查指示词
    for (const demo of DEMONSTRATIVES) {
      const regex = new RegExp(demo + '(.{1,6})', 'g');
      let match;
      while ((match = regex.exec(text)) !== null) {
        coreferences.push({
          id: `coref_${match.index}`,
          text: match[0],
          type: ReferenceType.DEMONSTRATIVE,
          position: match.index,
          confidence: 0.5,
          candidates: []
        });
      }
    }
    
    // 检查代词
    for (const pronoun of PRONOUNS) {
      const regex = new RegExp(pronoun, 'g');
      let match;
      while ((match = regex.exec(text)) !== null) {
        // 检查是否已经被识别为指示词的一部分
        const exists = coreferences.some(c => 
          match!.index >= c.position && match!.index < c.position + c.text.length
        );
        
        if (!exists) {
          coreferences.push({
            id: `coref_${match.index}`,
            text: match[0],
            type: ReferenceType.PRONOUN,
            position: match.index,
            confidence: 0.5,
            candidates: []
          });
        }
      }
    }
    
    // 按位置排序
    return coreferences.sort((a, b) => a.position - b.position);
  }

  /**
   * 解析单个指代
   */
  private async resolveCoreference(
    coref: Coreference,
    currentEntities: Entity[]
  ): Promise<Coreference> {
    const candidates: Entity[] = [];
    
    // 1. 从最近的实体中查找候选
    for (const [type, entity] of this.recentEntities) {
      // 检查指代词是否匹配该类型
      if (this.matchesType(coref.text, type)) {
        candidates.push(entity);
      }
    }
    
    // 2. 从历史实体中查找
    for (let i = this.entityHistory.length - 1; i >= 0; i--) {
      const entity = this.entityHistory[i];
      if (this.matchesType(coref.text, entity.type)) {
        // 避免重复
        if (!candidates.some(c => c.value === entity.value)) {
          candidates.push(entity);
        }
      }
    }
    
    // 3. 评分并选择最佳候选
    if (candidates.length > 0) {
      const bestCandidate = this.selectBestCandidate(coref, candidates);
      
      return {
        ...coref,
        resolvedEntity: bestCandidate,
        confidence: this.calculateConfidence(coref, bestCandidate, candidates.length),
        candidates: candidates.slice(0, 3) // 只保留前3个候选
      };
    }
    
    return {
      ...coref,
      candidates
    };
  }

  /**
   * 检查指代词是否匹配实体类型
   */
  private matchesType(corefText: string, entityType: EntityType): boolean {
    const patterns = PRONOUN_PATTERNS[entityType];
    if (!patterns) return false;
    
    // 检查指代词是否包含类型特征
    for (const pattern of patterns) {
      if (corefText.includes(pattern) || pattern.includes(corefText)) {
        return true;
      }
    }
    
    // 通用代词可以匹配任何类型
    if (['它', '这', '那'].some(p => corefText.includes(p))) {
      return true;
    }
    
    return false;
  }

  /**
   * 选择最佳候选
   */
  private selectBestCandidate(coref: Coreference, candidates: Entity[]): Entity {
    // 简单的选择策略：选择最近提及的（列表最后一个）
    // 可以扩展为更复杂的策略，如基于语义相似度
    return candidates[candidates.length - 1];
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(
    coref: Coreference,
    resolved: Entity,
    candidateCount: number
  ): number {
    let confidence = 0.5;
    
    // 候选越少，置信度越高
    confidence += Math.max(0, (5 - candidateCount) * 0.05);
    
    // 实体置信度影响
    confidence += resolved.confidence * 0.3;
    
    // 指示词比代词置信度高
    if (coref.type === ReferenceType.DEMONSTRATIVE) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1);
  }

  /**
   * 生成解析后的文本
   */
  private generateResolvedText(text: string, resolved: Coreference[]): string {
    let resolvedText = text;
    
    // 按位置倒序替换（避免位置偏移）
    const sorted = [...resolved].sort((a, b) => b.position - a.position);
    
    for (const coref of sorted) {
      if (coref.resolvedEntity) {
        const before = resolvedText.substring(0, coref.position);
        const after = resolvedText.substring(coref.position + coref.text.length);
        const replacement = `${coref.text}(${coref.resolvedEntity.value})`;
        resolvedText = before + replacement + after;
      }
    }
    
    return resolvedText;
  }

  /**
   * 获取确认问题
   * 当指代消解不确定时，询问用户
   */
  getConfirmationQuestion(coref: Coreference): string {
    if (coref.candidates.length === 0) {
      return `您提到的"${coref.text}"是指什么呢？`;
    }
    
    if (coref.candidates.length === 1) {
      return `您提到的"${coref.text}"是指"${coref.candidates[0].value}"吗？`;
    }
    
    const options = coref.candidates
      .slice(0, 3)
      .map((c, i) => `${i + 1}. ${c.value}`)
      .join('\n');
    
    return `您提到的"${coref.text}"是指以下哪一个？\n${options}`;
  }

  /**
   * 添加显式实体映射
   */
  addExplicitMapping(corefText: string, entity: Entity): void {
    this.recentEntities.set(entity.type, entity);
    this.entityHistory.push(entity);
  }

  /**
   * 清空历史
   */
  clearHistory(): void {
    this.entityHistory = [];
    this.recentEntities.clear();
  }

  /**
   * 获取当前实体历史
   */
  getEntityHistory(): Entity[] {
    return [...this.entityHistory];
  }

  /**
   * 获取最近实体
   */
  getRecentEntities(): Map<EntityType, Entity> {
    return new Map(this.recentEntities);
  }
}

// 导出单例
let resolverInstance: CoreferenceResolver | null = null;

export function getCoreferenceResolver(): CoreferenceResolver {
  if (!resolverInstance) {
    resolverInstance = new CoreferenceResolver();
  }
  return resolverInstance;
}

export function resetCoreferenceResolver(): void {
  resolverInstance = null;
}
