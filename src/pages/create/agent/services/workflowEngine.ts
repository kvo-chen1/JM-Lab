// 智能工作流引擎 - 自动化任务分解与执行

import { AgentType, DesignTask } from '../types/agent';
import { getPredictionService, BehaviorType } from './predictionService';
import { getRAGService } from './ragService';

// 工作流节点类型
export enum WorkflowNodeType {
  START = 'start',
  ANALYSIS = 'analysis',
  DESIGN = 'design',
  REVIEW = 'review',
  REVISE = 'revise',
  APPROVE = 'approve',
  END = 'end'
}

// 工作流节点
export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  agent: AgentType;
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
  estimatedTime: number; // 预估时间（毫秒）
  dependencies: string[]; // 依赖的节点ID
  autoExecute: boolean; // 是否自动执行
}

// 工作流定义
export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  startNodeId: string;
  endNodeId: string;
}

// 工作流实例
export interface WorkflowInstance {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  currentNodeId: string;
  completedNodes: string[];
  data: Record<string, any>;
  startTime: number;
  endTime?: number;
  progress: number; // 0-100
}

// 质量检查结果
export interface QualityCheckResult {
  passed: boolean;
  score: number; // 0-100
  issues: {
    type: 'error' | 'warning' | 'info';
    message: string;
    suggestion: string;
  }[];
  improvements: string[];
}

// 预定义工作流模板
const WORKFLOW_TEMPLATES: Record<string, Workflow> = {
  'ip-design': {
    id: 'ip-design',
    name: 'IP形象设计工作流',
    description: '完整的IP形象设计流程',
    nodes: [
      {
        id: 'start',
        type: WorkflowNodeType.START,
        agent: 'director',
        name: '需求收集',
        description: '收集IP设计需求',
        inputs: [],
        outputs: ['requirements'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: [],
        autoExecute: false
      },
      {
        id: 'analysis',
        type: WorkflowNodeType.ANALYSIS,
        agent: 'researcher',
        name: '市场分析',
        description: '分析目标市场和竞品',
        inputs: ['requirements'],
        outputs: ['analysisReport'],
        estimatedTime: 3 * 60 * 1000,
        dependencies: ['start'],
        autoExecute: true
      },
      {
        id: 'concept',
        type: WorkflowNodeType.DESIGN,
        agent: 'illustrator',
        name: '概念设计',
        description: '设计IP形象概念',
        inputs: ['requirements', 'analysisReport'],
        outputs: ['conceptDesigns'],
        estimatedTime: 10 * 60 * 1000,
        dependencies: ['analysis'],
        autoExecute: true
      },
      {
        id: 'review',
        type: WorkflowNodeType.REVIEW,
        agent: 'director',
        name: '设计评审',
        description: '评审设计方案',
        inputs: ['conceptDesigns'],
        outputs: ['reviewFeedback'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: ['concept'],
        autoExecute: false
      },
      {
        id: 'refine',
        type: WorkflowNodeType.REVISE,
        agent: 'illustrator',
        name: '优化调整',
        description: '根据反馈优化设计',
        inputs: ['conceptDesigns', 'reviewFeedback'],
        outputs: ['finalDesign'],
        estimatedTime: 8 * 60 * 1000,
        dependencies: ['review'],
        autoExecute: true
      },
      {
        id: 'approve',
        type: WorkflowNodeType.APPROVE,
        agent: 'director',
        name: '最终确认',
        description: '确认最终设计',
        inputs: ['finalDesign'],
        outputs: ['approvedDesign'],
        estimatedTime: 2 * 60 * 1000,
        dependencies: ['refine'],
        autoExecute: false
      },
      {
        id: 'end',
        type: WorkflowNodeType.END,
        agent: 'director',
        name: '完成',
        description: '工作流完成',
        inputs: ['approvedDesign'],
        outputs: [],
        estimatedTime: 0,
        dependencies: ['approve'],
        autoExecute: true
      }
    ],
    startNodeId: 'start',
    endNodeId: 'end'
  },

  'brand-design': {
    id: 'brand-design',
    name: '品牌设计工作流',
    description: '完整的品牌设计流程',
    nodes: [
      {
        id: 'start',
        type: WorkflowNodeType.START,
        agent: 'director',
        name: '需求收集',
        description: '收集品牌设计需求',
        inputs: [],
        outputs: ['requirements'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: [],
        autoExecute: false
      },
      {
        id: 'strategy',
        type: WorkflowNodeType.ANALYSIS,
        agent: 'copywriter',
        name: '品牌策略',
        description: '制定品牌策略和定位',
        inputs: ['requirements'],
        outputs: ['brandStrategy'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: ['start'],
        autoExecute: true
      },
      {
        id: 'logo',
        type: WorkflowNodeType.DESIGN,
        agent: 'designer',
        name: 'Logo设计',
        description: '设计品牌Logo',
        inputs: ['brandStrategy'],
        outputs: ['logoDesigns'],
        estimatedTime: 10 * 60 * 1000,
        dependencies: ['strategy'],
        autoExecute: true
      },
      {
        id: 'vi',
        type: WorkflowNodeType.DESIGN,
        agent: 'designer',
        name: 'VI设计',
        description: '设计视觉识别系统',
        inputs: ['logoDesigns'],
        outputs: ['viSystem'],
        estimatedTime: 15 * 60 * 1000,
        dependencies: ['logo'],
        autoExecute: true
      },
      {
        id: 'review',
        type: WorkflowNodeType.REVIEW,
        agent: 'director',
        name: '整体评审',
        description: '评审品牌设计方案',
        inputs: ['viSystem'],
        outputs: ['reviewFeedback'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: ['vi'],
        autoExecute: false
      },
      {
        id: 'end',
        type: WorkflowNodeType.END,
        agent: 'director',
        name: '完成',
        description: '工作流完成',
        inputs: ['reviewFeedback'],
        outputs: [],
        estimatedTime: 0,
        dependencies: ['review'],
        autoExecute: true
      }
    ],
    startNodeId: 'start',
    endNodeId: 'end'
  }
};

/**
 * 智能工作流引擎
 */
export class WorkflowEngine {
  private predictionService = getPredictionService();
  private ragService = getRAGService();
  private activeWorkflows: Map<string, WorkflowInstance> = new Map();

  /**
   * 创建工作流
   */
  createWorkflow(
    templateId: string,
    initialData: Record<string, any> = {}
  ): WorkflowInstance | null {
    const template = WORKFLOW_TEMPLATES[templateId];
    if (!template) {
      console.error(`[WorkflowEngine] Template not found: ${templateId}`);
      return null;
    }

    const instance: WorkflowInstance = {
      id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId: templateId,
      status: 'pending',
      currentNodeId: template.startNodeId,
      completedNodes: [],
      data: initialData,
      startTime: Date.now(),
      progress: 0
    };

    this.activeWorkflows.set(instance.id, instance);
    console.log(`[WorkflowEngine] Created workflow: ${instance.id}`);

    return instance;
  }

  /**
   * 启动工作流
   */
  async startWorkflow(instanceId: string): Promise<boolean> {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance) return false;

    instance.status = 'running';
    console.log(`[WorkflowEngine] Started workflow: ${instanceId}`);

    // 开始执行第一个节点
    await this.executeCurrentNode(instanceId);

    return true;
  }

  /**
   * 执行当前节点
   */
  async executeCurrentNode(instanceId: string): Promise<void> {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance || instance.status !== 'running') return;

    const workflow = WORKFLOW_TEMPLATES[instance.workflowId];
    const currentNode = workflow.nodes.find(n => n.id === instance.currentNodeId);

    if (!currentNode) {
      console.error(`[WorkflowEngine] Node not found: ${instance.currentNodeId}`);
      return;
    }

    console.log(`[WorkflowEngine] Executing node: ${currentNode.name}`);

    // 记录行为
    this.predictionService.recordBehavior(BehaviorType.TASK_CREATE, {
      taskType: currentNode.type,
      agent: currentNode.agent
    });

    // 如果是自动执行节点，继续执行
    if (currentNode.autoExecute) {
      // 模拟执行时间
      await new Promise(resolve => setTimeout(resolve, Math.min(currentNode.estimatedTime, 2000)));

      // 完成当前节点
      await this.completeNode(instanceId, currentNode.id, {
        result: `Auto-completed ${currentNode.name}`
      });
    }
  }

  /**
   * 完成节点
   */
  async completeNode(
    instanceId: string,
    nodeId: string,
    outputData: Record<string, any>
  ): Promise<void> {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance) return;

    // 更新数据
    instance.data = { ...instance.data, ...outputData };
    instance.completedNodes.push(nodeId);

    // 更新进度
    const workflow = WORKFLOW_TEMPLATES[instance.workflowId];
    instance.progress = Math.floor(
      (instance.completedNodes.length / workflow.nodes.length) * 100
    );

    console.log(`[WorkflowEngine] Completed node: ${nodeId}, Progress: ${instance.progress}%`);

    // 找到下一个节点
    const nextNode = workflow.nodes.find(n =>
      n.dependencies.includes(nodeId) &&
      !instance.completedNodes.includes(n.id)
    );

    if (nextNode) {
      instance.currentNodeId = nextNode.id;

      // 检查是否是结束节点
      if (nextNode.type === WorkflowNodeType.END) {
        await this.completeWorkflow(instanceId);
      } else {
        // 继续执行下一个节点
        await this.executeCurrentNode(instanceId);
      }
    } else {
      // 没有下一个节点，完成工作流
      await this.completeWorkflow(instanceId);
    }
  }

  /**
   * 完成工作流
   */
  async completeWorkflow(instanceId: string): Promise<void> {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance) return;

    instance.status = 'completed';
    instance.endTime = Date.now();
    instance.progress = 100;

    console.log(`[WorkflowEngine] Completed workflow: ${instanceId}`);
  }

  /**
   * 暂停工作流
   */
  pauseWorkflow(instanceId: string): boolean {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance || instance.status !== 'running') return false;

    instance.status = 'paused';
    console.log(`[WorkflowEngine] Paused workflow: ${instanceId}`);
    return true;
  }

  /**
   * 恢复工作流
   */
  resumeWorkflow(instanceId: string): boolean {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance || instance.status !== 'paused') return false;

    instance.status = 'running';
    console.log(`[WorkflowEngine] Resumed workflow: ${instanceId}`);
    this.executeCurrentNode(instanceId);
    return true;
  }

  /**
   * 取消工作流
   */
  cancelWorkflow(instanceId: string): boolean {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance) return false;

    instance.status = 'failed';
    instance.endTime = Date.now();
    console.log(`[WorkflowEngine] Cancelled workflow: ${instanceId}`);
    return true;
  }

  /**
   * 质量检查
   */
  async qualityCheck(content: string, type: 'design' | 'text' | 'video'): Promise<QualityCheckResult> {
    const issues: QualityCheckResult['issues'] = [];
    const improvements: string[] = [];
    let score = 100;

    // 基础检查
    if (content.length < 10) {
      issues.push({
        type: 'error',
        message: '内容过于简短',
        suggestion: '增加更多细节描述'
      });
      score -= 20;
    }

    // 设计相关检查
    if (type === 'design') {
      if (!content.includes('色彩') && !content.includes('颜色')) {
        issues.push({
          type: 'warning',
          message: '缺少色彩描述',
          suggestion: '添加色彩方案说明'
        });
        score -= 10;
      }

      if (!content.includes('风格')) {
        improvements.push('可以补充风格说明');
        score -= 5;
      }
    }

    // 文本相关检查
    if (type === 'text') {
      if (content.length > 500) {
        issues.push({
          type: 'info',
          message: '内容较长',
          suggestion: '考虑分段或精简'
        });
        score -= 5;
      }
    }

    return {
      passed: score >= 70,
      score: Math.max(0, score),
      issues,
      improvements
    };
  }

  /**
   * 自动优化
   */
  async autoOptimize(content: string, feedback: string): Promise<string> {
    // 基于反馈自动优化内容
    let optimized = content;

    if (feedback.includes('颜色') || feedback.includes('色彩')) {
      optimized += '\n\n【优化】增加了色彩方案说明';
    }

    if (feedback.includes('细节') || feedback.includes('详细')) {
      optimized += '\n\n【优化】补充了更多细节描述';
    }

    if (feedback.includes('风格')) {
      optimized += '\n\n【优化】强化了风格特征';
    }

    return optimized;
  }

  /**
   * 获取工作流实例
   */
  getWorkflowInstance(instanceId: string): WorkflowInstance | undefined {
    return this.activeWorkflows.get(instanceId);
  }

  /**
   * 获取所有活跃工作流
   */
  getActiveWorkflows(): WorkflowInstance[] {
    return Array.from(this.activeWorkflows.values()).filter(
      w => w.status === 'running' || w.status === 'paused'
    );
  }

  /**
   * 获取工作流模板
   */
  getWorkflowTemplates(): Workflow[] {
    return Object.values(WORKFLOW_TEMPLATES);
  }

  /**
   * 获取工作流统计
   */
  getStats(): {
    totalWorkflows: number;
    activeWorkflows: number;
    completedWorkflows: number;
    failedWorkflows: number;
  } {
    const workflows = Array.from(this.activeWorkflows.values());
    return {
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(w => w.status === 'running').length,
      completedWorkflows: workflows.filter(w => w.status === 'completed').length,
      failedWorkflows: workflows.filter(w => w.status === 'failed').length
    };
  }
}

// 导出单例
let workflowEngineInstance: WorkflowEngine | null = null;

export function getWorkflowEngine(): WorkflowEngine {
  if (!workflowEngineInstance) {
    workflowEngineInstance = new WorkflowEngine();
  }
  return workflowEngineInstance;
}

export function resetWorkflowEngine(): void {
  workflowEngineInstance = null;
}
