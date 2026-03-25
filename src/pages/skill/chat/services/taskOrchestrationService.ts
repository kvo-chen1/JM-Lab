/**
 * 任务编排服务 - 管理复杂多步骤任务
 */

import type { IntentType } from './intentService';

// 任务阶段状态
export type TaskStageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// 单个任务阶段
export interface TaskStage {
  id: string;
  name: string;
  description?: string;
  skill: IntentType;
  input: {
    prompt: string;
    imageUrl?: string;
    style?: string;
    colors?: string[];
    referenceFromPrevious?: boolean;
    [key: string]: any;
  };
  output?: {
    content?: string;
    imageUrl?: string;
    attachments?: Array<{
      type: 'image' | 'text';
      url?: string;
      content?: string;
    }>;
  };
  status: TaskStageStatus;
  progress?: number; // 0-100
  error?: string;
  dependsOn?: string[]; // 依赖的前置任务ID
  startTime?: number;
  endTime?: number;
}

// 任务流状态
export type TaskFlowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// 任务流
export interface TaskFlow {
  id: string;
  name: string;
  description?: string;
  stages: TaskStage[];
  currentStageIndex: number;
  status: TaskFlowStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  totalProgress?: number; // 计算得出的总进度
}

// 任务进度更新回调
export type TaskProgressCallback = (progress: TaskProgress) => void;

// 任务进度更新
export interface TaskProgress {
  flowId: string;
  stageId: string;
  stageName: string;
  stageIndex: number;
  totalStages: number;
  progress: number; // 0-100
  status: TaskStageStatus;
  output?: TaskStage['output'];
  isComplete: boolean;
  message: string;
}

// 全局任务流管理器
class TaskFlowManager {
  private flows: Map<string, TaskFlow> = new Map();
  private progressCallbacks: Map<string, TaskProgressCallback[]> = new Map();
  private cancelFlags: Map<string, boolean> = new Map();

  // 创建新的任务流
  createFlow(name: string, description?: string): TaskFlow {
    const flow: TaskFlow = {
      id: `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      stages: [],
      currentStageIndex: 0,
      status: 'pending',
      createdAt: Date.now(),
    };
    this.flows.set(flow.id, flow);
    return flow;
  }

  // 添加任务阶段
  addStage(flowId: string, stage: Omit<TaskStage, 'id' | 'status'>): TaskStage | null {
    const flow = this.flows.get(flowId);
    if (!flow) return null;

    const newStage: TaskStage = {
      ...stage,
      id: `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
    };

    flow.stages.push(newStage);
    return newStage;
  }

  // 订阅进度更新
  subscribe(flowId: string, callback: TaskProgressCallback): () => void {
    const callbacks = this.progressCallbacks.get(flowId) || [];
    callbacks.push(callback);
    this.progressCallbacks.set(flowId, callbacks);

    // 返回取消订阅函数
    return () => {
      const cbs = this.progressCallbacks.get(flowId) || [];
      this.progressCallbacks.set(flowId, cbs.filter(cb => cb !== callback));
    };
  }

  // 通知进度更新
  private notifyProgress(progress: TaskProgress): void {
    const callbacks = this.progressCallbacks.get(progress.flowId) || [];
    callbacks.forEach(cb => cb(progress));
  }

  // 标记任务流开始
  startFlow(flowId: string): boolean {
    const flow = this.flows.get(flowId);
    if (!flow || flow.status !== 'pending') return false;

    flow.status = 'running';
    flow.startedAt = Date.now();
    return true;
  }

  // 更新阶段状态
  updateStage(
    flowId: string,
    stageId: string,
    update: Partial<TaskStage>
  ): TaskProgress | null {
    const flow = this.flows.get(flowId);
    if (!flow) return null;

    const stageIndex = flow.stages.findIndex(s => s.id === stageId);
    if (stageIndex === -1) return null;

    const stage = flow.stages[stageIndex];
    Object.assign(stage, update);

    // 计算总进度
    const completedStages = flow.stages.filter(s => s.status === 'completed').length;
    const currentProgress = stage.status === 'completed' ? 100 : (stage.progress || 0);
    flow.totalProgress = Math.round(
      ((completedStages + currentProgress / 100) / flow.stages.length) * 100
    );

    // 构建进度更新
    const progress: TaskProgress = {
      flowId,
      stageId,
      stageName: stage.name,
      stageIndex,
      totalStages: flow.stages.length,
      progress: stage.progress || (stage.status === 'completed' ? 100 : 0),
      status: stage.status,
      output: stage.output,
      isComplete: stage.status === 'completed' || stage.status === 'failed',
      message: this.buildProgressMessage(stage, stageIndex, flow.stages.length),
    };

    this.notifyProgress(progress);

    // 检查是否全部完成
    if (flow.stages.every(s => s.status === 'completed' || s.status === 'failed')) {
      flow.status = flow.stages.some(s => s.status === 'failed') ? 'failed' : 'completed';
      flow.completedAt = Date.now();
    }

    return progress;
  }

  // 构建进度消息
  private buildProgressMessage(stage: TaskStage, index: number, total: number): string {
    const statusEmoji = {
      pending: '⏳',
      running: '🔄',
      completed: '✅',
      failed: '❌',
      cancelled: '🚫',
    }[stage.status];

    let message = `${statusEmoji} **${stage.name}** (${index + 1}/${total})`;

    if (stage.status === 'running' && stage.progress !== undefined) {
      message += `\n📊 进度: ${stage.progress}%`;
    }

    if (stage.error) {
      message += `\n❗ 错误: ${stage.error}`;
    }

    return message;
  }

  // 取消任务流
  cancelFlow(flowId: string): boolean {
    const flow = this.flows.get(flowId);
    if (!flow || flow.status === 'completed' || flow.status === 'failed') return false;

    this.cancelFlags.set(flowId, true);

    // 标记所有未完成的阶段为 cancelled
    flow.stages.forEach(stage => {
      if (stage.status === 'pending' || stage.status === 'running') {
        stage.status = 'cancelled';
      }
    });

    flow.status = 'cancelled';
    flow.completedAt = Date.now();

    return true;
  }

  // 检查是否已取消
  isCancelled(flowId: string): boolean {
    return this.cancelFlags.get(flowId) || false;
  }

  // 获取任务流
  getFlow(flowId: string): TaskFlow | undefined {
    return this.flows.get(flowId);
  }

  // 获取所有任务流
  getAllFlows(): TaskFlow[] {
    return Array.from(this.flows.values());
  }

  // 清理旧的任务流（保留最近1小时的）
  cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.flows.forEach((flow, id) => {
      if (flow.createdAt < oneHourAgo) {
        this.flows.delete(id);
        this.progressCallbacks.delete(id);
        this.cancelFlags.delete(id);
      }
    });
  }
}

// 导出单例
export const taskFlowManager = new TaskFlowManager();

// ==================== 复杂任务解析 ====================

interface BatchTask {
  name: string;
  prompt: string;
  type: 'image' | 'text' | 'design';
  skill: IntentType;
  dependencies?: string[];
}

interface ParsedComplexTask {
  isComplex: boolean;
  isBatch: boolean;
  tasks: BatchTask[];
  flow?: {
    name: string;
    stages: Array<{
      name: string;
      skill: IntentType;
      description: string;
    }>;
  };
}

// 复杂任务模式
const COMPLEX_PATTERNS = [
  /从.*到.*/,
  /一整套/,
  /全套/,
  /完整.*方案/,
  /先.*再.*最后.*/,
  /品牌设计/,
  /VI系统/,
];

// 批量任务关键词
const BATCH_PATTERNS = [
  /一套/,
  /一组/,
  /多个/,
  /几个/,
  /一系列/,
  /全套/,
  /所有的/,
];

// 平台列表（用于多渠道适配）
const PLATFORMS = [
  '朋友圈', '微博', '小红书', '抖音', 'B站', '知乎', '微信',
  '公众号', '视频号', '快手', '淘宝', '京东', '天猫', '拼多多',
];

// VI 物料列表
const VI_ITEMS = [
  '名片', '信纸', '信封', '文件夹', '工牌', '胸牌', '马克杯',
  '笔记本', '帆布袋', 'T恤', '帽子', '包装盒', '手提袋', '贴纸', '标签',
  '宣传册', '海报', 'PPT模板', '邮件签名', '社交媒体头像',
];

// 设计流程阶段
const DESIGN_FLOW_STAGES = {
  logo: { name: 'Logo设计', skill: 'logo-design' as IntentType },
  color: { name: '配色方案', skill: 'color-scheme' as IntentType },
  poster: { name: '海报设计', skill: 'poster-design' as IntentType },
  packaging: { name: '包装设计', skill: 'poster-design' as IntentType },
  video: { name: '视频脚本', skill: 'video-script' as IntentType },
  copy: { name: '品牌文案', skill: 'brand-copy' as IntentType },
};

/**
 * 解析复杂任务
 */
export const parseComplexTask = (
  message: string,
  context?: {
    previousIntent?: IntentType;
    previousImageUrl?: string;
    brandName?: string;
    designStyle?: string;
    colors?: string[];
  }
): ParsedComplexTask => {
  const normalizedMessage = message.toLowerCase();

  // 检测是否是批量任务
  const isBatch = BATCH_PATTERNS.some(p => p.test(message));

  // 检测是否是复杂多步骤任务
  const isComplex = COMPLEX_PATTERNS.some(p => p.test(message));

  // 检测是否包含多平台
  const mentionedPlatforms = PLATFORMS.filter(p => message.includes(p));

  // 检测VI物料
  const mentionedVIItems = VI_ITEMS.filter(item => message.includes(item));

  // 检测设计流程关键词
  const hasLogoKeyword = /logo|标志|标识|商标/.test(normalizedMessage);
  const hasColorKeyword = /颜色|配色|色彩/.test(normalizedMessage);
  const hasPosterKeyword = /海报|宣传|主视觉/.test(normalizedMessage);
  const hasPackagingKeyword = /包装|盒子|袋子/.test(normalizedMessage);
  const hasCopyKeyword = /文案|介绍|品牌故事|简介/.test(normalizedMessage);

  // 构建任务列表
  const tasks: BatchTask[] = [];

  // 1. 处理VI系统批量生成
  if (isBatch && (message.includes('VI') || message.includes('vi'))) {
    const items = mentionedVIItems.length > 0 ? mentionedVIItems : ['名片', '信纸', '工牌'];

    items.forEach((item, index) => {
      const prevTaskName = index > 0 ? tasks[index - 1].name : undefined;
      tasks.push({
        name: item,
        prompt: `基于提供的Logo设计${item}，保持品牌风格一致`,
        type: 'design',
        skill: 'poster-design',
        dependencies: prevTaskName ? [prevTaskName] : undefined,
      });
    });

    return {
      isComplex: false,
      isBatch: true,
      tasks,
    };
  }

  // 2. 处理多平台文案适配
  if (mentionedPlatforms.length > 1 && (message.includes('文案') || message.includes('适配'))) {
    mentionedPlatforms.forEach(platform => {
      tasks.push({
        name: `${platform}文案`,
        prompt: `为${platform}平台优化文案内容，保持核心信息一致但调整风格和长度`,
        type: 'text',
        skill: 'social-copy',
      });
    });

    return {
      isComplex: false,
      isBatch: true,
      tasks,
    };
  }

  // 3. 处理多步骤设计流程
  if (isComplex && (hasLogoKeyword || hasColorKeyword || hasPosterKeyword)) {
    const stages: ParsedComplexTask['flow'] = {
      name: '品牌设计流程',
      stages: [],
    };

    if (hasLogoKeyword) {
      stages.stages.push({
        name: DESIGN_FLOW_STAGES.logo.name,
        skill: DESIGN_FLOW_STAGES.logo.skill,
        description: '设计品牌Logo',
      });
    }

    if (hasColorKeyword) {
      stages.stages.push({
        name: DESIGN_FLOW_STAGES.color.name,
        skill: DESIGN_FLOW_STAGES.color.skill,
        description: '确定品牌配色',
      });
    }

    if (hasPosterKeyword) {
      stages.stages.push({
        name: DESIGN_FLOW_STAGES.poster.name,
        skill: DESIGN_FLOW_STAGES.poster.skill,
        description: '设计宣传海报',
      });
    }

    if (hasPackagingKeyword) {
      stages.stages.push({
        name: DESIGN_FLOW_STAGES.packaging.name,
        skill: DESIGN_FLOW_STAGES.packaging.skill,
        description: '设计产品包装',
      });
    }

    if (hasCopyKeyword) {
      stages.stages.push({
        name: DESIGN_FLOW_STAGES.copy.name,
        skill: DESIGN_FLOW_STAGES.copy.skill,
        description: '撰写品牌文案',
      });
    }

    return {
      isComplex: true,
      isBatch: false,
      tasks: [],
      flow: stages,
    };
  }

  // 4. 简单的批量生成（罗列物品）
  if (isBatch && mentionedVIItems.length > 1) {
    mentionedVIItems.forEach(item => {
      tasks.push({
        name: item,
        prompt: `设计${item}，保持与品牌风格一致`,
        type: 'design',
        skill: 'poster-design',
      });
    });

    return {
      isComplex: false,
      isBatch: true,
      tasks,
    };
  }

  // 不是复杂任务，返回空
  return {
    isComplex: false,
    isBatch: false,
    tasks: [],
  };
};

/**
 * 创建任务流
 */
export const createDesignTaskFlow = (
  name: string,
  stages: Array<{
    name: string;
    skill: IntentType;
    input: TaskStage['input'];
  }>
): TaskFlow => {
  const flow = taskFlowManager.createFlow(name);

  stages.forEach(stage => {
    taskFlowManager.addStage(flow.id, {
      name: stage.name,
      skill: stage.skill,
      input: stage.input,
    });
  });

  return flow;
};

/**
 * 从消息中提取品牌名称
 */
export const extractBrandNameFromMessage = (message: string): string | undefined => {
  // 常见模式：品牌叫XXX、公司叫XXX、名字叫XXX
  const patterns = [
    /品牌[名叫叫](\w+)/,
    /公司[名叫叫](\w+)/,
    /名字[名叫叫](\w+)/,
    /叫(\w+)[的公司]*/,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return undefined;
};

// 定期清理旧任务流
setInterval(() => {
  taskFlowManager.cleanup();
}, 10 * 60 * 1000); // 每10分钟清理一次
