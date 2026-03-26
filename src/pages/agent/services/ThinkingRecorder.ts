/**
 * 思考过程记录器
 * 记录 Agent 的思考与决策过程
 */

import { 
  ThinkingSession, 
  ThinkingStep, 
  StepStatus, 
  StepType,
  StepDetail,
  ThinkingRecorderConfig 
} from '../types/thinking';

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 思考过程记录器类
 */
export class ThinkingRecorder {
  private currentSession: ThinkingSession | null = null;
  private config: ThinkingRecorderConfig;

  constructor(config: Partial<ThinkingRecorderConfig> = {}) {
    this.config = {
      enabled: true,
      maxSteps: 50,
      recordDetails: true,
      ...config
    };
  }

  /**
   * 开始一个新的思考会话
   */
  startSession(): ThinkingSession {
    if (!this.config.enabled) {
      return null as any;
    }

    this.currentSession = {
      id: generateId(),
      startTime: Date.now(),
      steps: [],
      currentStepIndex: -1,
      status: 'running'
    };

    return this.currentSession;
  }

  /**
   * 开始一个新的步骤
   */
  startStep(type: StepType, title: string): ThinkingStep {
    if (!this.config.enabled || !this.currentSession) {
      return null as any;
    }

    // 检查最大步骤数
    if (this.currentSession.steps.length >= (this.config.maxSteps || 50)) {
      console.warn('[ThinkingRecorder] 已达到最大步骤数限制');
      return null as any;
    }

    const step: ThinkingStep = {
      id: generateId(),
      type,
      title,
      status: 'processing',
      summary: `${title}中...`,
      details: {},
      startTime: Date.now()
    };

    this.currentSession.steps.push(step);
    this.currentSession.currentStepIndex = this.currentSession.steps.length - 1;

    // 触发回调
    if (this.config.onStepStart) {
      this.config.onStepStart(step);
    }

    return step;
  }

  /**
   * 更新当前步骤
   */
  updateStep(updates: Partial<ThinkingStep>): ThinkingStep | null {
    if (!this.config.enabled || !this.currentSession) {
      return null;
    }

    const currentStep = this.getCurrentStep();
    if (!currentStep) {
      return null;
    }

    Object.assign(currentStep, updates);
    return currentStep;
  }

  /**
   * 更新步骤进度（主要用于 skill 执行步骤）
   */
  updateProgress(progress: number): void {
    if (!this.config.enabled || !this.currentSession) {
      return;
    }

    const currentStep = this.getCurrentStep();
    if (currentStep && currentStep.type === 'skill') {
      currentStep.progress = Math.min(100, Math.max(0, progress));
    }
  }

  /**
   * 结束当前步骤
   */
  endStep(details: Partial<StepDetail> & { summary?: string }): ThinkingStep | null {
    if (!this.config.enabled || !this.currentSession) {
      return null;
    }

    const currentStep = this.getCurrentStep();
    if (!currentStep) {
      return null;
    }

    currentStep.endTime = Date.now();
    currentStep.executionTime = currentStep.endTime - (currentStep.startTime || currentStep.endTime);
    currentStep.status = details.error ? 'error' : 'completed';
    
    if (details.summary) {
      currentStep.summary = details.summary;
    }

    if (this.config.recordDetails) {
      currentStep.details = {
        ...currentStep.details,
        ...details
      };
    }

    // 触发回调
    if (this.config.onStepEnd) {
      this.config.onStepEnd(currentStep);
    }

    return currentStep;
  }

  /**
   * 标记步骤为错误状态
   */
  markStepError(error: string): ThinkingStep | null {
    return this.endStep({ error, summary: `执行失败: ${error}` });
  }

  /**
   * 获取当前步骤
   */
  getCurrentStep(): ThinkingStep | null {
    if (!this.currentSession || this.currentSession.currentStepIndex < 0) {
      return null;
    }
    return this.currentSession.steps[this.currentSession.currentStepIndex];
  }

  /**
   * 获取当前会话
   */
  getSession(): ThinkingSession | null {
    return this.currentSession;
  }

  /**
   * 完成当前会话
   */
  completeSession(): ThinkingSession | null {
    if (!this.currentSession) {
      return null;
    }

    this.currentSession.endTime = Date.now();
    this.currentSession.totalExecutionTime = this.currentSession.endTime - this.currentSession.startTime;
    this.currentSession.status = this.currentSession.steps.some(s => s.status === 'error') ? 'error' : 'completed';

    const session = { ...this.currentSession };

    // 触发回调
    if (this.config.onSessionComplete) {
      this.config.onSessionComplete(session);
    }

    return session;
  }

  /**
   * 取消当前会话
   */
  cancelSession(reason?: string): ThinkingSession | null {
    if (!this.currentSession) {
      return null;
    }

    this.currentSession.endTime = Date.now();
    this.currentSession.status = 'error';

    // 将未完成的步骤标记为错误
    this.currentSession.steps.forEach(step => {
      if (step.status === 'processing') {
        step.status = 'error';
        step.endTime = Date.now();
        step.details.error = reason || '会话被取消';
      }
    });

    const session = { ...this.currentSession };

    // 触发回调
    if (this.config.onSessionComplete) {
      this.config.onSessionComplete(session);
    }

    return session;
  }

  /**
   * 重置记录器
   */
  reset(): void {
    this.currentSession = null;
  }

  /**
   * 是否启用
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * 设置启用状态
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
}

/**
 * 全局 ThinkingRecorder 实例
 */
let globalRecorder: ThinkingRecorder | null = null;

/**
 * 获取全局 ThinkingRecorder 实例
 */
export function getThinkingRecorder(config?: Partial<ThinkingRecorderConfig>): ThinkingRecorder {
  if (!globalRecorder) {
    globalRecorder = new ThinkingRecorder(config);
  }
  return globalRecorder;
}

/**
 * 重置全局 ThinkingRecorder 实例
 */
export function resetThinkingRecorder(): void {
  globalRecorder = null;
}

// 导出单例实例
export const thinkingRecorder = getThinkingRecorder();

export default ThinkingRecorder;
