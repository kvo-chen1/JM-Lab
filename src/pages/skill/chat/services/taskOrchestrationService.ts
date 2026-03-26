/**
 * 任务编排服务 - 管理复杂多步骤任务
 */

import type { IntentType } from './intentService';

// 任务子步骤定义
export interface TaskSubStep {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  startTime?: number;
  endTime?: number;
}

// 不同技能类型的子步骤配置
export const TASK_SUB_STEPS_CONFIG: Record<string, string[]> = {
  'logo-design': ['分析品牌需求', '构思创意方向', '绘制图形草图', '优化细节设计', '生成最终Logo'],
  'poster-design': ['分析主题内容', '构思视觉布局', '设计核心元素', '调整配色排版', '完善细节效果'],
  'color-scheme': ['提取品牌基因', '生成配色方案', '验证色彩对比', '应用方案设计', '输出配色规范'],
  'image-generation': ['解析画面需求', '构建视觉场景', '绘制图像内容', '优化光影效果', '生成最终图片'],
  'brand-copy': ['理解品牌定位', '提炼核心卖点', '构思文案角度', '撰写文案内容', '润色优化表达'],
  'video-script': ['明确视频目标', '设计叙事结构', '撰写分镜脚本', '优化节奏时长', '完善细节描述'],
  'social-copy': ['分析平台特点', '把握用户心理', '撰写吸睛标题', '编写正文内容', '添加互动引导'],
  'marketing-copy': ['分析产品卖点', '定位目标人群', '构思营销角度', '撰写推广文案', '优化转化引导'],
  'text-generation': ['理解写作需求', '梳理内容框架', '撰写核心内容', '优化语言表达', '完善细节格式'],
  'ui-design': ['分析功能需求', '设计信息架构', '绘制界面布局', '优化交互细节', '完善视觉规范'],
  'illustration': ['理解创作需求', '构思画面构图', '绘制线稿草图', '上色细化处理', '完善最终效果'],
  'default': ['分析需求', '构思方案', '执行创作', '优化调整', '完成生成'],
};

/**
 * 获取技能类型的子步骤
 */
export const getSubStepsForSkill = (skill: IntentType): string[] => {
  return TASK_SUB_STEPS_CONFIG[skill] || TASK_SUB_STEPS_CONFIG['default'];
};

/**
 * 创建子步骤列表
 */
export const createSubSteps = (skill: IntentType): TaskSubStep[] => {
  const stepNames = getSubStepsForSkill(skill);
  return stepNames.map((name, index) => ({
    id: `substep_${index}`,
    name,
    status: 'pending',
    progress: 0,
  }));
};

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

// 常见物料类型映射
const MATERIAL_KEYWORDS: Record<string, { name: string; skill: IntentType; type: 'image' | 'text' | 'design' }> = {
  'logo': { name: 'Logo设计', skill: 'logo-design', type: 'design' },
  '标志': { name: 'Logo设计', skill: 'logo-design', type: 'design' },
  '标识': { name: 'Logo设计', skill: 'logo-design', type: 'design' },
  '商标': { name: 'Logo设计', skill: 'logo-design', type: 'design' },
  '海报': { name: '海报设计', skill: 'poster-design', type: 'design' },
  '宣传海报': { name: '海报设计', skill: 'poster-design', type: 'design' },
  '主视觉': { name: '主视觉设计', skill: 'poster-design', type: 'design' },
  'kv': { name: '主视觉设计', skill: 'poster-design', type: 'design' },
  '名片': { name: '名片设计', skill: 'poster-design', type: 'design' },
  '宣传册': { name: '宣传册设计', skill: 'poster-design', type: 'design' },
  '手册': { name: '手册设计', skill: 'poster-design', type: 'design' },
  '包装': { name: '包装设计', skill: 'poster-design', type: 'design' },
  '包装盒': { name: '包装设计', skill: 'poster-design', type: 'design' },
  '手提袋': { name: '手提袋设计', skill: 'poster-design', type: 'design' },
  '工牌': { name: '工牌设计', skill: 'poster-design', type: 'design' },
  '胸牌': { name: '胸牌设计', skill: 'poster-design', type: 'design' },
  '信纸': { name: '信纸设计', skill: 'poster-design', type: 'design' },
  '信封': { name: '信封设计', skill: 'poster-design', type: 'design' },
  'ppt': { name: 'PPT模板', skill: 'poster-design', type: 'design' },
  'ppt模板': { name: 'PPT模板', skill: 'poster-design', type: 'design' },
  '社交媒体': { name: '社交媒体配图', skill: 'social-media-design', type: 'design' },
  '配图': { name: '社交媒体配图', skill: 'social-media-design', type: 'design' },
  '头图': { name: '头图设计', skill: 'poster-design', type: 'design' },
  'banner': { name: 'Banner设计', skill: 'poster-design', type: 'design' },
  '文案': { name: '品牌文案', skill: 'brand-copy', type: 'text' },
  '品牌文案': { name: '品牌文案', skill: 'brand-copy', type: 'text' },
  '品牌故事': { name: '品牌故事', skill: 'brand-copy', type: 'text' },
  '故事': { name: '品牌故事', skill: 'brand-copy', type: 'text' },
  '介绍': { name: '品牌介绍', skill: 'brand-copy', type: 'text' },
  '简介': { name: '品牌简介', skill: 'brand-copy', type: 'text' },
  '广告语': { name: '广告语', skill: 'brand-copy', type: 'text' },
  'slogan': { name: 'Slogan', skill: 'brand-copy', type: 'text' },
  '宣传语': { name: '宣传语', skill: 'brand-copy', type: 'text' },
  '主持稿': { name: '主持稿', skill: 'brand-copy', type: 'text' },
  '演讲稿': { name: '演讲稿', skill: 'brand-copy', type: 'text' },
  '邀请函': { name: '邀请函文案', skill: 'brand-copy', type: 'text' },
  '邀请': { name: '邀请函文案', skill: 'brand-copy', type: 'text' },
  '朋友圈': { name: '朋友圈文案', skill: 'social-copy', type: 'text' },
  '小红书': { name: '小红书文案', skill: 'social-copy', type: 'text' },
  '微博': { name: '微博文案', skill: 'social-copy', type: 'text' },
  '抖音': { name: '抖音文案', skill: 'social-copy', type: 'text' },
  '社交媒体': { name: '社交媒体文案', skill: 'social-copy', type: 'text' },
  '营销': { name: '营销文案', skill: 'marketing-copy', type: 'text' },
  '推广': { name: '推广文案', skill: 'marketing-copy', type: 'text' },
  '策略': { name: '营销策略', skill: 'marketing-copy', type: 'text' },
  '方案': { name: '营销方案', skill: 'marketing-copy', type: 'text' },
  '视频脚本': { name: '视频脚本', skill: 'video-script', type: 'text' },
  '脚本': { name: '视频脚本', skill: 'video-script', type: 'text' },
  '分镜': { name: '分镜脚本', skill: 'video-script', type: 'text' },
  '短视频': { name: '短视频脚本', skill: 'video-script', type: 'text' },
  '直播': { name: '直播脚本', skill: 'video-script', type: 'text' },
  '插画': { name: '插画设计', skill: 'illustration', type: 'image' },
  '插图': { name: '插画设计', skill: 'illustration', type: 'image' },
  '吉祥物': { name: '吉祥物设计', skill: 'illustration', type: 'image' },
  'ip': { name: 'IP形象', skill: 'illustration', type: 'image' },
  '配色': { name: '配色方案', skill: 'color-scheme', type: 'design' },
  '色彩': { name: '配色方案', skill: 'color-scheme', type: 'design' },
  '字体': { name: '字体设计', skill: 'logo-design', type: 'design' },
  '图标': { name: '图标设计', skill: 'logo-design', type: 'design' },
  'icon': { name: '图标设计', skill: 'logo-design', type: 'design' },
};

/**
 * 解析编号任务列表 (1. xxx, 2. xxx 格式)
 * 支持格式：
 * - 1. Logo设计 2. 海报设计
 * - 1、Logo设计 2、海报设计
 * - 1) Logo设计 2) 海报设计
 */
export const parseNumberedTasks = (message: string): Array<{ name: string; rawText: string }> => {
  const tasks: Array<{ name: string; rawText: string }> = [];

  // 匹配编号模式：1. xxx, 1、xxx, 1) xxx, (1) xxx
  const numberedPattern = /(?:^|\n)\s*(?:\(?)(\d+)[\.、\)\s]+([^\n]+?)(?=\s*(?:\n|$|\(?\d+[\.、\)\s]))/g;

  let match;
  while ((match = numberedPattern.exec(message)) !== null) {
    const rawText = match[2].trim();
    // 提取任务名称（去除详细描述）
    const name = rawText.split(/[，,。；;]/)[0].trim();
    if (name) {
      tasks.push({ name, rawText });
    }
  }

  // 如果没有匹配到标准编号格式，尝试其他常见格式
  if (tasks.length === 0) {
    // 尝试匹配 "第一步 xxx"、"第1步 xxx" 格式
    const stepPattern = /第\s*(\d+)\s*步[：:]?\s*([^\n]+?)(?=\s*(?:\n|$|第\s*\d+\s*步))/g;
    while ((match = stepPattern.exec(message)) !== null) {
      const rawText = match[2].trim();
      const name = rawText.split(/[，,。；;]/)[0].trim();
      if (name) {
        tasks.push({ name, rawText });
      }
    }
  }

  return tasks;
};

/**
 * 从任务描述中识别物料类型
 */
export const recognizeMaterialType = (taskText: string): { name: string; skill: IntentType; type: 'image' | 'text' | 'design' } | null => {
  const normalizedText = taskText.toLowerCase();

  // 按关键词长度降序排序，优先匹配更具体的词
  const sortedKeywords = Object.entries(MATERIAL_KEYWORDS).sort((a, b) => b[0].length - a[0].length);

  for (const [keyword, config] of sortedKeywords) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      return config;
    }
  }

  return null;
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

  // ===== 新增：优先处理编号任务列表 =====
  const numberedTasks = parseNumberedTasks(message);
  if (numberedTasks.length >= 2) {
    // 检测到编号列表，为每个编号创建任务
    numberedTasks.forEach((task, index) => {
      const materialType = recognizeMaterialType(task.rawText);

      if (materialType) {
        tasks.push({
          name: materialType.name,
          prompt: task.rawText,
          type: materialType.type,
          skill: materialType.skill,
          dependencies: index > 0 ? [tasks[index - 1].name] : undefined,
        });
      } else {
        // 无法识别具体类型时，根据内容推测
        const isTextTask = /文案|脚本|故事|介绍|简介|文字|内容/.test(task.rawText);
        tasks.push({
          name: task.name,
          prompt: task.rawText,
          type: isTextTask ? 'text' : 'design',
          skill: isTextTask ? 'brand-copy' : 'poster-design',
          dependencies: index > 0 ? [tasks[index - 1].name] : undefined,
        });
      }
    });

    return {
      isComplex: true,
      isBatch: true,
      tasks,
    };
  }

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
