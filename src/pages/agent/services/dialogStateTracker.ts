/**
 * 对话状态追踪器 (Dialog State Tracker)
 * 维护对话状态机，追踪需求收集进度
 */

import { AgentMessage } from '../types/agent';
import { EntityType, Entity, getEntityExtractor } from './entityExtractor';

// 对话状态
export enum DialogState {
  INITIAL = 'INITIAL',           // 初始状态
  GREETING = 'GREETING',         // 问候阶段
  COLLECTING = 'COLLECTING',     // 信息收集中
  CLARIFYING = 'CLARIFYING',     // 澄清疑问
  CONFIRMING = 'CONFIRMING',     // 确认需求
  EXECUTING = 'EXECUTING',       // 执行设计
  REVIEWING = 'REVIEWING',       // 审核结果
  MODIFYING = 'MODIFYING',       // 修改调整
  COMPLETED = 'COMPLETED',       // 完成
  CANCELLED = 'CANCELLED'        // 取消
}

// 需求信息槽位
export interface RequirementSlot {
  type: EntityType;
  value: string | null;
  confidence: number;
  source: 'user' | 'inferred' | 'default';
  timestamp: number;
  confirmed: boolean;
}

// 对话上下文
export interface DialogContext {
  state: DialogState;
  stateHistory: DialogState[];
  collectedSlots: Map<EntityType, RequirementSlot>;
  pendingSlots: EntityType[];
  currentTopic: string | null;
  turnCount: number;
  lastUserIntent: string | null;
  lastAgentAction: string | null;
  sessionId: string;
  createdAt: number;
  updatedAt: number;
}

// 状态转换规则
interface StateTransition {
  from: DialogState;
  to: DialogState;
  condition: (context: DialogContext, message: AgentMessage) => boolean;
  priority: number;
}

// 关键信息槽位定义
const REQUIRED_SLOTS: EntityType[] = [
  EntityType.DESIGN_TYPE,
  EntityType.STYLE,
  EntityType.AUDIENCE,
  EntityType.USAGE_SCENARIO
];

const OPTIONAL_SLOTS: EntityType[] = [
  EntityType.COLOR,
  EntityType.ELEMENT,
  EntityType.EMOTION,
  EntityType.THEME,
  EntityType.SIZE,
  EntityType.TIME,
  EntityType.BUDGET,
  EntityType.REFERENCE
];

/**
 * 对话状态追踪器类
 */
export class DialogStateTracker {
  private context: DialogContext;
  private entityExtractor = getEntityExtractor();

  constructor(sessionId?: string) {
    this.context = this.createInitialContext(sessionId);
  }

  /**
   * 创建初始上下文
   */
  private createInitialContext(sessionId?: string): DialogContext {
    const now = Date.now();
    return {
      state: DialogState.INITIAL,
      stateHistory: [],
      collectedSlots: new Map(),
      pendingSlots: [...REQUIRED_SLOTS],
      currentTopic: null,
      turnCount: 0,
      lastUserIntent: null,
      lastAgentAction: null,
      sessionId: sessionId || `session_${now}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * 处理用户消息，更新状态
   */
  async processUserMessage(message: AgentMessage): Promise<{
    context: DialogContext;
    stateChanged: boolean;
    newEntities: Entity[];
    nextAction: string;
  }> {
    // 提取实体
    const extractionResult = await this.entityExtractor.extract(message.content);
    const newEntities = extractionResult.entities;

    // 更新槽位
    this.updateSlots(newEntities);

    // 更新话题
    if (newEntities.length > 0) {
      this.context.currentTopic = newEntities[0].value;
    }

    // 状态转换
    const previousState = this.context.state;
    await this.transitionState(message);
    const stateChanged = previousState !== this.context.state;

    // 更新统计
    this.context.turnCount++;
    this.context.updatedAt = Date.now();

    // 确定下一步动作
    const nextAction = this.determineNextAction();

    return {
      context: this.getContext(),
      stateChanged,
      newEntities,
      nextAction
    };
  }

  /**
   * 更新信息槽位
   */
  private updateSlots(entities: Entity[]): void {
    for (const entity of entities) {
      const existingSlot = this.context.collectedSlots.get(entity.type);
      
      // 只有当新实体置信度更高时才更新
      if (!existingSlot || entity.confidence > existingSlot.confidence) {
        this.context.collectedSlots.set(entity.type, {
          type: entity.type,
          value: entity.normalizedValue || entity.value,
          confidence: entity.confidence,
          source: 'user',
          timestamp: Date.now(),
          confirmed: false
        });

        // 从待收集列表中移除
        const pendingIndex = this.context.pendingSlots.indexOf(entity.type);
        if (pendingIndex !== -1) {
          this.context.pendingSlots.splice(pendingIndex, 1);
        }
      }
    }
  }

  /**
   * 状态转换
   */
  private async transitionState(message: AgentMessage): Promise<void> {
    const content = message.content.toLowerCase();
    const currentState = this.context.state;

    // 保存状态历史
    this.context.stateHistory.push(currentState);

    switch (currentState) {
      case DialogState.INITIAL:
        if (this.isGreeting(content)) {
          this.context.state = DialogState.GREETING;
        } else if (this.hasDesignIntent(content)) {
          this.context.state = DialogState.COLLECTING;
        }
        break;

      case DialogState.GREETING:
        if (this.hasDesignIntent(content)) {
          this.context.state = DialogState.COLLECTING;
        }
        break;

      case DialogState.COLLECTING:
        // 检查是否有足够信息进入确认阶段
        if (this.hasEnoughInfo()) {
          this.context.state = DialogState.CONFIRMING;
        } else if (this.needsClarification(content)) {
          this.context.state = DialogState.CLARIFYING;
        }
        break;

      case DialogState.CLARIFYING:
        if (this.hasEnoughInfo()) {
          this.context.state = DialogState.CONFIRMING;
        } else {
          this.context.state = DialogState.COLLECTING;
        }
        break;

      case DialogState.CONFIRMING:
        if (this.isConfirmed(content)) {
          this.context.state = DialogState.EXECUTING;
        } else if (this.isRejected(content)) {
          this.context.state = DialogState.COLLECTING;
        }
        break;

      case DialogState.EXECUTING:
        // 执行完成后进入审核
        this.context.state = DialogState.REVIEWING;
        break;

      case DialogState.REVIEWING:
        if (this.isModificationRequested(content)) {
          this.context.state = DialogState.MODIFYING;
        } else if (this.isConfirmed(content)) {
          this.context.state = DialogState.COMPLETED;
        }
        break;

      case DialogState.MODIFYING:
        if (this.isConfirmed(content)) {
          this.context.state = DialogState.REVIEWING;
        }
        break;
    }

    // 检查取消意图
    if (this.isCancelled(content)) {
      this.context.state = DialogState.CANCELLED;
    }
  }

  /**
   * 确定下一步动作
   */
  private determineNextAction(): string {
    const { state, collectedSlots, pendingSlots, turnCount } = this.context;

    switch (state) {
      case DialogState.INITIAL:
      case DialogState.GREETING:
        return 'GREET_AND_ASK_INTENT';

      case DialogState.COLLECTING:
        if (pendingSlots.length > 0) {
          // 优先询问最重要的未收集信息
          const nextSlot = pendingSlots[0];
          return `ASK_${nextSlot}`;
        }
        return 'SUMMARIZE_AND_CONFIRM';

      case DialogState.CLARIFYING:
        return 'CLARIFY_INFORMATION';

      case DialogState.CONFIRMING:
        return 'WAIT_CONFIRMATION';

      case DialogState.EXECUTING:
        return 'GENERATE_DESIGN';

      case DialogState.REVIEWING:
        return 'SHOW_RESULT_AND_ASK_FEEDBACK';

      case DialogState.MODIFYING:
        return 'APPLY_MODIFICATION';

      case DialogState.COMPLETED:
        return 'FINISH_AND_SAVE';

      case DialogState.CANCELLED:
        return 'CLEANUP_AND_EXIT';

      default:
        return 'CONTINUE';
    }
  }

  /**
   * 检查是否是问候
   */
  private isGreeting(content: string): boolean {
    const greetings = ['你好', '您好', '哈喽', '嗨', 'hello', 'hi', '在吗'];
    return greetings.some(g => content.includes(g));
  }

  /**
   * 检查是否有设计意图
   */
  private hasDesignIntent(content: string): boolean {
    const designKeywords = [
      '设计', 'logo', '标志', '海报', '包装', 'ip', '形象', 
      '插画', '动画', '品牌', '做', '画', '创作', '生成'
    ];
    return designKeywords.some(k => content.includes(k));
  }

  /**
   * 是否需要澄清
   */
  private needsClarification(content: string): boolean {
    const clarificationSignals = [
      '？', '?', '什么', '怎么', '为什么', '不太明白',
      '不清楚', '不懂', '什么意思'
    ];
    return clarificationSignals.some(s => content.includes(s));
  }

  /**
   * 是否有足够信息
   */
  private hasEnoughInfo(): boolean {
    const requiredCollected = REQUIRED_SLOTS.filter(
      slot => this.context.collectedSlots.has(slot)
    );
    // 至少收集3个关键信息
    return requiredCollected.length >= 3;
  }

  /**
   * 是否确认
   */
  private isConfirmed(content: string): boolean {
    const confirmWords = ['好', '可以', '确定', '没问题', '对的', '是的', '确认', 'ok'];
    return confirmWords.some(w => content.includes(w));
  }

  /**
   * 是否拒绝
   */
  private isRejected(content: string): boolean {
    const rejectWords = ['不', '不对', '错了', '重新', '改', '换'];
    return rejectWords.some(w => content.includes(w));
  }

  /**
   * 是否请求修改
   */
  private isModificationRequested(content: string): boolean {
    const modifyWords = ['改', '调整', '修改', '换', '优化', '完善', '不一样'];
    return modifyWords.some(w => content.includes(w));
  }

  /**
   * 是否取消
   */
  private isCancelled(content: string): boolean {
    const cancelWords = ['取消', '停止', '结束', '放弃', '不做了', '算了'];
    return cancelWords.some(w => content.includes(w));
  }

  /**
   * 获取当前上下文
   */
  getContext(): DialogContext {
    return {
      ...this.context,
      collectedSlots: new Map(this.context.collectedSlots)
    };
  }

  /**
   * 获取已收集的信息摘要
   */
  getCollectedInfoSummary(): string {
    const slots = Array.from(this.context.collectedSlots.values());
    if (slots.length === 0) {
      return '尚未收集到需求信息';
    }

    const parts: string[] = [];
    for (const slot of slots) {
      if (slot.value) {
        parts.push(`${this.getSlotDisplayName(slot.type)}: ${slot.value}`);
      }
    }

    return parts.join('，');
  }

  /**
   * 获取槽位显示名称
   */
  private getSlotDisplayName(type: EntityType): string {
    const names: Record<EntityType, string> = {
      [EntityType.DESIGN_TYPE]: '设计类型',
      [EntityType.STYLE]: '风格',
      [EntityType.COLOR]: '颜色',
      [EntityType.AUDIENCE]: '目标受众',
      [EntityType.USAGE_SCENARIO]: '使用场景',
      [EntityType.ELEMENT]: '设计元素',
      [EntityType.BRAND]: '品牌',
      [EntityType.SIZE]: '尺寸',
      [EntityType.TIME]: '时间',
      [EntityType.BUDGET]: '预算',
      [EntityType.REFERENCE]: '参考',
      [EntityType.EMOTION]: '情感氛围',
      [EntityType.MATERIAL]: '材质',
      [EntityType.TECHNIQUE]: '技法',
      [EntityType.THEME]: '主题'
    };
    return names[type] || type;
  }

  /**
   * 获取待收集的信息
   */
  getPendingSlots(): EntityType[] {
    return [...this.context.pendingSlots];
  }

  /**
   * 确认槽位
   */
  confirmSlot(type: EntityType): void {
    const slot = this.context.collectedSlots.get(type);
    if (slot) {
      slot.confirmed = true;
      slot.timestamp = Date.now();
    }
  }

  /**
   * 手动设置槽位
   */
  setSlot(type: EntityType, value: string, source: 'user' | 'inferred' | 'default' = 'user'): void {
    this.context.collectedSlots.set(type, {
      type,
      value,
      confidence: source === 'user' ? 1.0 : 0.7,
      source,
      timestamp: Date.now(),
      confirmed: false
    });

    // 从待收集列表中移除
    const pendingIndex = this.context.pendingSlots.indexOf(type);
    if (pendingIndex !== -1) {
      this.context.pendingSlots.splice(pendingIndex, 1);
    }
  }

  /**
   * 回退到上一个状态
   */
  goBack(): boolean {
    if (this.context.stateHistory.length > 0) {
      const previousState = this.context.stateHistory.pop();
      if (previousState) {
        this.context.state = previousState;
        return true;
      }
    }
    return false;
  }

  /**
   * 重置对话
   */
  reset(): void {
    this.context = this.createInitialContext(this.context.sessionId);
  }

  /**
   * 导出上下文（用于持久化）
   */
  exportContext(): string {
    return JSON.stringify({
      ...this.context,
      collectedSlots: Array.from(this.context.collectedSlots.entries())
    });
  }

  /**
   * 导入上下文
   */
  importContext(contextJson: string): void {
    try {
      const parsed = JSON.parse(contextJson);
      this.context = {
        ...parsed,
        collectedSlots: new Map(parsed.collectedSlots)
      };
    } catch (error) {
      console.error('[DialogStateTracker] Failed to import context:', error);
    }
  }

  /**
   * 获取对话统计
   */
  getStats(): {
    turnCount: number;
    collectedSlotCount: number;
    pendingSlotCount: number;
    completionPercentage: number;
  } {
    const totalSlots = REQUIRED_SLOTS.length;
    const collectedCount = REQUIRED_SLOTS.filter(
      slot => this.context.collectedSlots.has(slot)
    ).length;

    return {
      turnCount: this.context.turnCount,
      collectedSlotCount: collectedCount,
      pendingSlotCount: this.context.pendingSlots.length,
      completionPercentage: Math.round((collectedCount / totalSlots) * 100)
    };
  }
}

// 导出单例管理
const trackerMap = new Map<string, DialogStateTracker>();

export function getDialogStateTracker(sessionId: string): DialogStateTracker {
  if (!trackerMap.has(sessionId)) {
    trackerMap.set(sessionId, new DialogStateTracker(sessionId));
  }
  return trackerMap.get(sessionId)!;
}

export function createDialogStateTracker(sessionId?: string): DialogStateTracker {
  const tracker = new DialogStateTracker(sessionId);
  trackerMap.set(tracker.getContext().sessionId, tracker);
  return tracker;
}

export function removeDialogStateTracker(sessionId: string): void {
  trackerMap.delete(sessionId);
}
