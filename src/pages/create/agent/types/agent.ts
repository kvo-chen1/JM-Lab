// Agent类型定义

// LLM 模型类型
export type LLMModelType = 'qwen' | 'kimi';

export interface LLMModelConfig {
  id: LLMModelType;
  name: string;
  icon: string;
  description: string;
  color: string;
}

// 扩展后的 Agent 类型
export type AgentType =
  | 'director'      // 设计总监 - 统筹全局、需求分析、任务分配
  | 'designer'      // 品牌设计师 - 视觉设计、图像生成
  | 'illustrator'   // 插画师 - 手绘风格、角色设计
  | 'copywriter'    // 文案策划 - 品牌文案、标语创作
  | 'animator'      // 动画师 - 动效设计、视频制作
  | 'researcher'    // 研究员 - 市场调研、竞品分析
  | 'system'
  | 'user';

// 为了向后兼容，保留 AgentRole
export type AgentRole = AgentType;

export type MessageType = 'text' | 'image' | 'style-options' | 'satisfaction-check' | 'derivative-options' | 'thinking' | 'delegation' | 'collaboration' | 'error' | 'character-workflow' | 'chain-progress' | 'design-type-options';
export type TaskType = 'ip-character' | 'brand-packaging' | 'poster' | 'custom';
export type TaskStage = 'requirement' | 'design' | 'review' | 'derivative' | 'completed';

// Agent 决策动作类型
export type AgentAction = 'respond' | 'delegate' | 'collaborate' | 'handoff' | 'chain';

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: number;
  type: MessageType;
  metadata?: {
    images?: string[];
    styles?: StyleOption[];
    brands?: string[];  // 引用的品牌名列表
    works?: string[];   // 引用的作品ID列表（向后兼容）
    mentionedWorks?: MentionedWork[]; // 引用的作品详细信息
    thinking?: string;
    toolCalls?: ToolCall[];
    derivativeOptions?: DerivativeOption[];
    delegationInfo?: DelegationInfo;
    collaborationInfo?: CollaborationInfo;
    // Error display
    error?: {
      type: string;
      message: string;
      retryable?: boolean;
      level?: 'critical' | 'error' | 'warning' | 'info';
    };
    onRetry?: () => void;
    onDismiss?: () => void;
    showDetails?: boolean;
    // Chain progress
    taskQueue?: any;
    progress?: {
      current: number;
      total: number;
      percentage: number;
    };
    // Image generation
    prompt?: string;
    // Upload
    imageUrl?: string;
    imageName?: string;
  };
}

// 委派信息
export interface DelegationInfo {
  fromAgent: AgentType;
  toAgent: AgentType;
  taskDescription: string;
  reasoning: string;
}

// 协作信息
export interface CollaborationInfo {
  participatingAgents: AgentType[];
  taskDescription: string;
  progress: number;
}

export interface StyleOption {
  id: string;
  name: string;
  thumbnail: string;
  description?: string;
  prompt?: string;
  category?: string[]; // 风格分类
  tags?: string[];    // 搜索标签
  isCustom?: boolean; // 是否自定义风格
}

export interface ToolCall {
  id: string;
  tool: 'search' | 'generate-image' | 'generate-video' | 'analyze' | 'research' | 'write-copy';
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
}

export interface DerivativeOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'video' | 'short-film' | 'merchandise' | 'poster' | 'animation';
}

// 委派任务记录
export interface DelegationTask {
  id: string;
  fromAgent: AgentType;
  toAgent: AgentType;
  taskDescription: string;
  context: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: number;
  completedAt?: number;
  result?: string;
}

// Agent 决策结果
export interface AgentDecision {
  action: AgentAction;
  targetAgent?: AgentType;
  targetAgents?: AgentType[];  // 用于 collaborate 动作
  reasoning: string;
  taskContext?: {
    taskType: string;
    requirements: string;
    priority: 'low' | 'medium' | 'high';
  };
  requiresUserConfirmation?: boolean;
  message?: string;  // 给用户的说明消息
}

// 需求收集状态
export type RequirementStage = 'initial' | 'collecting' | 'confirming' | 'completed';

// 收集到的需求信息
export interface CollectedRequirementInfo {
  projectType?: string;        // 项目类型
  targetAudience?: string;     // 目标受众
  stylePreference?: string;    // 风格偏好
  usageScenario?: string;      // 使用场景
  timeline?: string;           // 时间要求
  budget?: string;             // 预算范围
  references?: string[];       // 参考案例
  brandTone?: string;          // 品牌调性
  additionalInfo?: string;     // 其他信息
}

// 需求收集状态管理
export interface RequirementCollection {
  stage: RequirementStage;                    // 当前阶段
  collectedInfo: CollectedRequirementInfo;    // 已收集的信息
  pendingQuestions: string[];                 // 待澄清的问题
  confirmed: boolean;                         // 用户是否已确认
  summaryShown: boolean;                      // 是否已展示总结
  assignmentShown: boolean;                   // 是否已展示分配
  questionCount: number;                      // 已提问次数（限制追问）
  lastSummaryAt: number;                      // 上次总结时的提问次数
}

export interface DesignTask {
  id: string;
  type: TaskType;
  title: string;
  requirements: {
    description: string;
    style?: string;
    targetAudience?: string;
    usage?: string;
    brandInfo?: string;
    preferences?: string[];
  };
  status: TaskStage;
  outputs: GeneratedOutput[];
  createdAt: number;
  updatedAt: number;
}

export interface GeneratedOutput {
  id: string;
  type: 'image' | 'video' | 'text';
  url: string;
  thumbnail?: string;
  prompt?: string;
  style?: string;
  createdAt: number;
  metadata?: Record<string, any>;
  agentType?: AgentType;  // 记录是哪个 Agent 生成的
  // 新增字段
  title?: string;         // 作品标题
  description?: string;   // 作品描述（AI生成，可编辑）
  isFavorite?: boolean;   // 是否收藏
  status?: 'generating' | 'completed' | 'error';  // 生成状态
}

// 引用的作品信息（用于@作品引用功能）
export interface MentionedWork {
  id: string;
  name: string;
  title?: string;
  imageUrl?: string;
  thumbnail?: string;
  description?: string;
  prompt?: string;
  style?: string;
  type?: 'image' | 'video' | 'text';
}

export interface AgentState {
  // 对话状态
  messages: AgentMessage[];
  currentAgent: AgentType;
  isTyping: boolean;

  // LLM 模型状态
  currentModel: LLMModelType;           // 当前使用的 LLM 模型

  // 设计任务状态
  currentTask: DesignTask | null;
  taskStage: TaskStage;

  // 生成内容
  generatedOutputs: GeneratedOutput[];
  selectedOutput: string | null;
  selectedStyle: string | null;

  // 画布状态
  canvasZoom: number;
  canvasPosition: { x: number; y: number };
  selectedTool: 'select' | 'move' | 'hand';

  // UI状态
  showStyleSelector: boolean;
  showSatisfactionModal: boolean;
  showThinkingProcess: boolean;
  isChatCollapsed: boolean;

  // 工具调用状态
  activeToolCalls: ToolCall[];

  // Agent 编排相关状态
  agentQueue: AgentType[];              // Agent 执行队列
  delegationHistory: DelegationTask[];  // 委派历史
  isCollaborating: boolean;             // 是否协作中
  collaborationAgents: AgentType[];     // 当前协作的 Agents
  currentDelegation: DelegationTask | null; // 当前正在进行的委派

  // 需求收集状态
  requirementCollection: RequirementCollection;

  // 待处理的引用（从作品库或生成作品引用到输入框）
  pendingMention: { type: 'work' | 'brand' | 'style'; name: string; id?: string } | null;
}

// Agent 配置项
export interface AgentConfigItem {
  name: string;
  avatar: string;
  color: string;
  description: string;
  capabilities: string[];
  tools: string[];
}

export interface AgentConfig {
  director: AgentConfigItem;
  designer: AgentConfigItem;
  illustrator: AgentConfigItem;
  copywriter: AgentConfigItem;
  animator: AgentConfigItem;
  researcher: AgentConfigItem;
}

// 预设风格选项
export const PRESET_STYLES: StyleOption[] = [
  {
    id: 'color-pencil',
    name: '彩铅素描插画',
    thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&h=200&fit=crop',
    description: '柔和细腻的彩铅风格',
    prompt: 'colored pencil sketch style, soft textures, artistic illustration'
  },
  {
    id: 'fantasy-picture-book',
    name: '诡萌幻想绘本',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&h=200&fit=crop',
    description: '奇幻可爱的绘本风格',
    prompt: 'whimsical fantasy picture book style, cute and mysterious, storybook illustration'
  },
  {
    id: 'mori-girl',
    name: '辛逝季-芙莉',
    thumbnail: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=200&h=200&fit=crop',
    description: '森系少女风格',
    prompt: 'mori girl style, nature inspired, soft and ethereal, floral elements'
  },
  {
    id: 'warm-color',
    name: '温馨彩绘',
    thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200&h=200&fit=crop',
    description: '温暖治愈的彩绘风格',
    prompt: 'warm color painting style, cozy and healing, soft color palette'
  },
  {
    id: 'adventure-comic',
    name: '治愈冒险漫画',
    thumbnail: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=200&h=200&fit=crop',
    description: '温馨冒险的漫画风格',
    prompt: 'healing adventure comic style, warm storytelling, manga inspired'
  },
  {
    id: 'grainy-cute',
    name: '颗粒粉彩童话',
    thumbnail: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=200&h=200&fit=crop',
    description: '复古颗粒感的粉彩风格',
    prompt: 'grainy pastel fairy tale style, retro texture, dreamy atmosphere'
  },
  {
    id: 'dreamy-pastel',
    name: '虹彩梦幻治愈',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
    description: '彩虹色调梦幻风格',
    prompt: 'rainbow dreamy pastel style, iridescent colors, healing atmosphere'
  },
  {
    id: 'crayon-cute',
    name: '童趣蜡笔插画',
    thumbnail: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop',
    description: '童真可爱的蜡笔画风',
    prompt: 'childlike crayon illustration style, playful and cute, naive art'
  }
];

// 衍生内容选项
export const DERIVATIVE_OPTIONS: DerivativeOption[] = [
  {
    id: 'short-video',
    title: '快速生成视频',
    description: '5秒以下的短视频，适合社交媒体传播',
    icon: 'video',
    type: 'video'
  },
  {
    id: 'short-film',
    title: '制作剧情故事短片',
    description: '有情节的动画短片，讲述品牌故事',
    icon: 'film',
    type: 'short-film'
  },
  {
    id: 'merchandise',
    title: '制作衍生品',
    description: '文创周边、产品包装等实物设计',
    icon: 'gift',
    type: 'merchandise'
  },
  {
    id: 'poster',
    title: '生成宣传海报',
    description: '多尺寸宣传海报设计',
    icon: 'image',
    type: 'poster'
  },
  {
    id: 'animation',
    title: '制作动态表情包',
    description: '可爱的动态表情，增强品牌互动',
    icon: 'smile',
    type: 'animation'
  }
];

// Agent配置
export const AGENT_CONFIG: AgentConfig = {
  director: {
    name: '津脉设计总监',
    avatar: '总',
    color: 'from-amber-500 to-orange-600',
    description: '统领全局，理解需求，协调资源',
    capabilities: ['需求分析', '任务分配', '项目管理', '质量把控'],
    tools: ['delegate', 'review', 'coordinate']
  },
  designer: {
    name: '津脉品牌设计师',
    avatar: '设',
    color: 'from-cyan-500 to-blue-600',
    description: '专注设计执行，调用AI工具创作',
    capabilities: ['视觉设计', '图像生成', '品牌设计', '包装设计'],
    tools: ['generate-image', 'style-analysis', 'design-review']
  },
  illustrator: {
    name: '津脉插画师',
    avatar: '绘',
    color: 'from-pink-500 to-rose-600',
    description: '擅长手绘风格，角色设计与插画创作',
    capabilities: ['角色设计', '插画绘制', '手绘风格', '概念设计'],
    tools: ['sketch', 'illustrate', 'character-design']
  },
  copywriter: {
    name: '津脉文案策划',
    avatar: '文',
    color: 'from-emerald-500 to-teal-600',
    description: '品牌文案、标语创作与故事编写',
    capabilities: ['品牌文案', '标语创作', '故事编写', '内容策划'],
    tools: ['write-copy', 'create-slogan', 'brand-story']
  },
  animator: {
    name: '津脉动画师',
    avatar: '动',
    color: 'from-violet-500 to-purple-600',
    description: '动效设计与视频制作专家',
    capabilities: ['动画制作', '视频编辑', '动效设计', '表情包制作'],
    tools: ['create-animation', 'edit-video', 'motion-design']
  },
  researcher: {
    name: '津脉研究员',
    avatar: '研',
    color: 'from-slate-500 to-gray-600',
    description: '市场调研、竞品分析与趋势研究',
    capabilities: ['市场调研', '竞品分析', '趋势研究', '数据分析'],
    tools: ['market-research', 'competitor-analysis', 'trend-study']
  }
};

// LLM 模型配置
export const LLM_MODELS: LLMModelConfig[] = [
  {
    id: 'qwen',
    name: '通义千问',
    icon: '千',
    description: '阿里云大模型，擅长中文理解与创作',
    color: 'from-orange-500 to-red-600'
  },
  {
    id: 'kimi',
    name: 'Kimi',
    icon: 'K',
    description: 'Moonshot AI，长文本处理能力强',
    color: 'from-blue-500 to-cyan-600'
  }
];

// 辅助函数：获取 Agent 配置
export function getAgentConfig(agentType: AgentType): AgentConfigItem | null {
  if (agentType === 'system' || agentType === 'user') return null;
  return AGENT_CONFIG[agentType] || null;
}

// 辅助函数：获取 LLM 模型配置
export function getLLMModelConfig(modelId: LLMModelType): LLMModelConfig | null {
  return LLM_MODELS.find(m => m.id === modelId) || null;
}

// 辅助函数：检查是否为有效的专业 Agent
export function isProfessionalAgent(agentType: AgentType): boolean {
  return ['director', 'designer', 'illustrator', 'copywriter', 'animator', 'researcher'].includes(agentType);
}

// ============ 会话记录相关类型 ============

export interface ConversationSession {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  // 会话状态快照
  stateSnapshot: AgentStateSnapshot;
}

// 会话状态快照（用于保存和恢复会话）
export interface AgentStateSnapshot {
  messages: AgentMessage[];
  currentAgent: AgentType;
  currentTask: DesignTask | null;
  taskStage: TaskStage;
  generatedOutputs: GeneratedOutput[];
  selectedOutput: string | null;
  selectedStyle: string | null;
  delegationHistory: DelegationTask[];
}

// 会话列表状态
export interface ConversationState {
  sessions: ConversationSession[];
  currentSessionId: string | null;
}
