/**
 * 大语言模型服务模块
 * 提供与各类大语言模型交互的接口
 */

// 导入知识库服务

import { aiTaskQueueService, AITask, TaskPriority } from './aiTaskQueueService';
import apiClient from '@/lib/apiClient';
import { handleSseStreamingResponse } from './llm/streaming';
import { callKimiChat, callQwenChat, callDeepseekChat } from './llm/chatProviders';

// 模型类型定义
export interface LLMModel {
  id: string;
  name: string;
  description: string;
  strengths: string[];
  isDefault: boolean;
  apiKey?: string;
}

// 对话历史类型定义
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isError?: boolean;
}

// 对话会话类型定义
export interface ConversationSession {
  id: string;
  name: string;
  modelId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
  // 主题追踪相关字段
  currentTopic?: string; // 当前对话主题
  topicHistory?: string[]; // 主题历史记录
  contextSummary?: string; // 对话上下文摘要，用于长对话
  lastMessageTimestamp?: number; // 最后消息时间戳
}

// 性能监控数据类型定义
export interface ModelPerformance {
  modelId: string;
  requestCount: number;
  successCount: number;
  failureCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  lastRequestTime: number;
  lastSuccessTime: number;
  lastFailureTime: number;
}

// 性能监控记录类型定义
export interface PerformanceRecord {
  modelId: string;
  startTime: number;
  endTime: number;
  responseTime: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

// 模型角色类型定义
export interface ModelRole {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  temperature: number;
  top_p: number;
  presence_penalty: number;
  frequency_penalty: number;
  is_default: boolean;
  created_at: number;
  updated_at: number;
  tags?: string[];
  preferredModel?: string; // 角色偏好的模型
}

// 助手性格类型定义
export type AssistantPersonality = 
  | 'friendly'     // 友好
  | 'professional' // 专业
  | 'creative'     // 创意
  | 'humorous'     // 幽默
  | 'concise'      // 简洁
  // 新增更多性格选项
  | 'warm'         // 温暖
  | 'enthusiastic' // 热情
  | 'calm'         // 冷静
  | 'witty'        // 机智
  | 'scholarly'    // 博学
  | 'casual'       // 随意
  | 'strict'       // 严格
  | 'empathetic';  // 富有同理心

// 主题类型定义
export type AssistantTheme = 
  | 'light'     // 浅色主题
  | 'dark'      // 深色主题
  | 'auto'      // 自动主题（跟随系统）
  | 'custom';   // 自定义主题

// 缓存相关类型定义
export interface CacheItem {
  response: string;
  timestamp: number;
  conversationId?: string;
  topic?: string;
  // 缓存优先级：高优先级缓存更不容易被清除
  priority: 'high' | 'medium' | 'low';
}

// 自定义主题配置类型
export interface CustomThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  hoverColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
}

// 模型配置类型定义
export interface ModelConfig {
  temperature: number;
  top_p: number;
  max_tokens: number;
  timeout: number;
  system_prompt: string;
  max_history: number;
  stream: boolean;
  kimi_model: string;
  kimi_base_url: string;
  kimi_api_key?: string;
  retry: number;
  backoff_ms: number;
  deepseek_model?: string;
  deepseek_base_url?: string;
  deepseek_api_key?: string;
  // 新增通用高级参数
  presence_penalty: number;
  frequency_penalty: number;
  stop: string[];
  // 新增通义千问模型配置
  qwen_model: string;
  qwen_base_url: string;
  qwen_api_key?: string;
  // 新增对话相关配置
  enable_memory: boolean;
  memory_window: number;
  context_window: number;
  // 新增多模态配置
  enable_multimodal: boolean;
  image_resolution: string;
  // 新增安全配置
  enable_safety_check: boolean;
  safety_level: 'low' | 'medium' | 'high';
  // 新增角色配置
  current_role_id?: string;
  // 新增个性化设置
  personality: AssistantPersonality; // 助手性格
  theme: AssistantTheme; // 主题偏好
  customThemeConfig?: CustomThemeConfig; // 自定义主题配置
  show_preset_questions: boolean; // 是否显示预设问题
  enable_typing_effect: boolean; // 是否启用打字效果
  auto_scroll: boolean; // 是否自动滚动
  shortcut_key: string; // 快捷键
  enable_notifications: boolean; // 是否启用通知
}

// 通用图片生成参数类型
export type GenerateImageParams = {
  prompt: string
  size?: string
  n?: number
  seed?: number
  guidance_scale?: number
  response_format?: 'url' | 'b64_json'
  watermark?: boolean
  model?: string
  // 新增高级配置参数
  steps?: number
  style?: string
  negative_prompt?: string
  aspect_ratio?: string
  quality?: 'standard' | 'hd' | 'uhd'
  enable_style_optimization?: boolean
  reference_image?: string
  reference_strength?: number
  color_palette?: string[]
  composition_guidance?: string
  detail_level?: 'low' | 'medium' | 'high'
}

// 通用图片生成响应类型
export type GenerateImageResponse = {
  ok: boolean
  data?: any
  error?: string
}

// 可用的模型列表
export const AVAILABLE_MODELS: LLMModel[] = [
  {
    id: 'kimi',
    name: 'Kimi',
    description: 'Kimi（Moonshot AI），擅长中文长文创作与协作',
    strengths: ['中文对话', '长上下文写作', '检索增强'],
    isDefault: false
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek深度求索，擅长代码生成与逻辑推理，兼具优秀的中文创作能力',
    strengths: ['代码生成', '逻辑推理', '中文创作', '数学计算'],
    isDefault: false
  },
  {
    id: 'qwen',
    name: '通义千问',
    description: '阿里云DashScope，中文对话与综合任务表现优秀，支持图像生成',
    strengths: ['中文对话', '综合任务', '工具调用', '图像生成', '语音合成'],
    isDefault: true
  }
];


// 默认角色列表
export const DEFAULT_ROLES: ModelRole[] = [
  { id: 'default',
    name: '津小脉',
    description: '津脉智坊平台专属AI助手，专注于传统文化创作与设计，提供全面的平台服务与文化知识支持',
    system_prompt: '你是津小脉，津脉智坊平台的专属AI助手，由Kimi模型驱动，专注于传统文化创作与设计。请严格按照以下定义为用户提供服务：\n\n1. 角色定位：\n   - 你是津脉智坊平台的官方AI助手，代表平台形象，服务于所有平台用户\n   - 你的核心使命是连接传统文化与青年创意，推动文化传承与创新\n   - 你是创作者的全能助手，提供设计构思、文化融合、平台使用等全方位支持\n   - 你是天津传统文化的传播者，熟悉天津本地老字号、非遗技艺和地域文化\n\n2. 核心能力：\n   - 平台功能导航与使用指导\n   - AI内容创作辅助（文本、设计方案生成）\n   - 传统文化元素融合建议\n   - 天津本地文化知识普及\n   - 创作流程优化建议\n   - 作品展示与推广策略\n   - 账户设置与数据分析解读\n\n3. 语音语调：\n   - 友好热情，体现平台亲和力\n   - 专业严谨，提供准确可靠的信息\n   - 清晰易懂，避免使用过于技术化的术语\n   - 富有创意，鼓励用户创新表达\n   - 亲切自然，如同专业顾问般交流\n\n4. 操作边界：\n   - 严格遵循平台规则和政策\n   - 不提供违反法律法规的内容\n   - 不泄露用户隐私信息\n   - 不进行商业推广或广告宣传\n   - 对于超出能力范围的问题，诚实告知用户并引导至相关资源\n   - 保持客观中立，不参与敏感话题讨论\n\n5. 平台特定知识：\n   - 津脉智坊是津门老字号共创平台，传承与创新的桥梁\n   - 平台支持AI生成设计方案，可选择国潮风格、非遗元素、天津地域素材等参数\n   - 平台包含创作中心、文创市集、社区、文化知识等核心模块\n   - 平台整合了天津地区的传统文化元素，如杨柳青年画、泥人张彩塑、风筝魏等\n   - 平台支持作品展示、点赞、评论、分享和协作编辑功能\n\n6. 用户交互指南：\n   - 当用户首次访问平台或特定页面时，主动介绍该页面的主要功能\n   - 当用户遇到问题时，提供清晰的步骤指导和解决方案\n   - 当用户进行创作时，提供文化元素融合建议和创新思路\n   - 当用户询问平台规则时，准确引用平台政策进行解答\n   - 当用户需要天津文化知识时，提供详细的本地文化信息\n\n7. 响应格式要求：\n   - 回答结构清晰，使用分段和列表形式增强可读性\n   - 提供具体实例和操作步骤，方便用户理解和执行\n   - 对于复杂问题，采用分步骤解答方式\n   - 保持回答简洁明了，避免冗长和不必要的信息\n   - 当提供链接或资源时，确保其与平台相关且可用\n\n请始终以"津小脉"的身份回答问题，保持一致的角色形象，为用户提供持续、符合语境的协助，契合平台的目标与用户期望。',
    temperature: 0.7,
    top_p: 0.9,
    presence_penalty: 0,
    frequency_penalty: 0,
    is_default: true,
    preferredModel: 'qwen', // 津小脉默认使用通义千问
    created_at: Date.now(),
    updated_at: Date.now(),
    tags: ['默认', '创意', '帮助']
  },
  {
    id: 'designer',
    name: '设计专家',
    description: '专注于设计领域的专家，提供专业的设计建议和创意',
    system_prompt: '你是一位资深的设计专家，专注于视觉设计、UI/UX设计、创意设计、文化融合设计和传统元素创新应用。请提供专业、详细、实用的设计建议和创意构思，包括色彩搭配、排版设计、元素运用、风格定位等方面。你的回答应该具体、可操作，并且结合最新的设计趋势和传统美学。',
    temperature: 0.8,
    top_p: 0.95,
    presence_penalty: 0.1,
    frequency_penalty: 0.1,
    is_default: false,
    created_at: Date.now(),
    updated_at: Date.now(),
    tags: ['设计', '创意', '文化']
  },
  {
    id: 'coder',
    name: '代码助手',
    description: '帮助编写和优化代码的助手',
    system_prompt: '你是一位资深的软件开发工程师，擅长多种编程语言和技术栈。请提供准确、高效、安全的代码解决方案和优化建议。你的回答应该包括完整的代码示例、详细的解释和最佳实践。对于问题，要先理解需求，然后提供清晰、可运行的代码，并解释代码的工作原理和优化点。',
    temperature: 0.3,
    top_p: 0.8,
    presence_penalty: 0,
    frequency_penalty: 0,
    is_default: false,
    created_at: Date.now(),
    updated_at: Date.now(),
    tags: ['编程', '技术', '代码']
  },
  {
    id: 'writer',
    name: '文案专家',
    description: '专注于文案创作的专家，提供吸引人的文案建议',
    system_prompt: '你是一位资深的文案专家，擅长创作各种类型的文案，包括广告文案、营销文案、社交媒体文案、产品描述、品牌故事等。请提供吸引人、有创意、符合品牌调性的文案内容。你的回答应该结合目标受众、传播渠道和营销目标，提供具体、可直接使用的文案示例，并解释文案的创作思路和效果预期。',
    temperature: 0.9,
    top_p: 0.95,
    presence_penalty: 0.2,
    frequency_penalty: 0.1,
    is_default: false,
    created_at: Date.now(),
    updated_at: Date.now(),
    tags: ['文案', '创作', '营销']
  },
  {
    id: 'teacher',
    name: '教育导师',
    description: '提供详细解释和指导的教育导师',
    system_prompt: '你是一位耐心、详细的教育导师，擅长将复杂的概念简单化，帮助学习者理解各种知识。请提供清晰、详细、循序渐进的解释和指导。你的回答应该包括基本概念、核心原理、实际应用和练习建议，使用通俗易懂的语言和生动的例子，帮助学习者建立完整的知识体系。',
    temperature: 0.6,
    top_p: 0.85,
    presence_penalty: 0,
    frequency_penalty: 0,
    is_default: false,
    created_at: Date.now(),
    updated_at: Date.now(),
    tags: ['教育', '学习', '指导']
  }
];

// 默认模型配置
export const DEFAULT_CONFIG: ModelConfig = {
  temperature: 0.7,
  top_p: 0.9,
  max_tokens: 2000,
  timeout: 30000,
  system_prompt: '你是津小脉，津脉智坊平台的专属AI助手，由Kimi模型驱动，专注于传统文化创作与设计。请严格按照以下定义为用户提供服务：\n\n1. 角色定位：\n   - 你是津脉智坊平台的官方AI助手，代表平台形象，服务于所有平台用户\n   - 你的核心使命是连接传统文化与青年创意，推动文化传承与创新\n   - 你是创作者的全能助手，提供设计构思、文化融合、平台使用等全方位支持\n   - 你是天津传统文化的传播者，熟悉天津本地老字号、非遗技艺和地域文化\n\n2. 核心能力：\n   - 平台功能导航与使用指导\n   - AI内容创作辅助（文本、设计方案生成）\n   - 传统文化元素融合建议\n   - 天津本地文化知识普及\n   - 创作流程优化建议\n   - 作品展示与推广策略\n   - 账户设置与数据分析解读\n\n3. 语音语调：\n   - 友好热情，体现平台亲和力\n   - 专业严谨，提供准确可靠的信息\n   - 清晰易懂，避免使用过于技术化的术语\n   - 富有创意，鼓励用户创新表达\n   - 亲切自然，如同专业顾问般交流\n\n4. 操作边界：\n   - 严格遵循平台规则和政策\n   - 不提供违反法律法规的内容\n   - 不泄露用户隐私信息\n   - 不进行商业推广或广告宣传\n   - 对于超出能力范围的问题，诚实告知用户并引导至相关资源\n   - 保持客观中立，不参与敏感话题讨论\n\n5. 平台特定知识：\n   - 津脉智坊是津门老字号共创平台，传承与创新的桥梁\n   - 平台支持AI生成设计方案，可选择国潮风格、非遗元素、天津地域素材等参数\n   - 平台包含创作中心、文创市集、社区、文化知识等核心模块\n   - 平台整合了天津地区的传统文化元素，如杨柳青年画、泥人张彩塑、风筝魏等\n   - 平台支持作品展示、点赞、评论、分享和协作编辑功能\n\n6. 用户交互指南：\n   - 当用户首次访问平台或特定页面时，主动介绍该页面的主要功能\n   - 当用户遇到问题时，提供清晰的步骤指导和解决方案\n   - 当用户进行创作时，提供文化元素融合建议和创新思路\n   - 当用户询问平台规则时，准确引用平台政策进行解答\n   - 当用户需要天津文化知识时，提供详细的本地文化信息\n\n7. 响应格式要求：\n   - 回答结构清晰，使用分段和列表形式增强可读性\n   - 提供具体实例和操作步骤，方便用户理解和执行\n   - 对于复杂问题，采用分步骤解答方式\n   - 保持回答简洁明了，避免冗长和不必要的信息\n   - 当提供链接或资源时，确保其与平台相关且可用\n\n请始终以"津小脉"的身份回答问题，保持一致的角色形象，为用户提供持续、符合语境的协助，契合平台的目标与用户期望。',
  max_history: 10,
  stream: false,
  kimi_model: 'moonshot-v1-32k',
  kimi_base_url: 'https://api.moonshot.cn/v1',
  retry: 2,
  backoff_ms: 800,
  deepseek_model: 'deepseek-chat',
  deepseek_base_url: 'https://api.deepseek.com',
  // 新增通用高级参数默认值
  presence_penalty: 0,
  frequency_penalty: 0,
  stop: [],
  // 新增通义千问模型配置默认值
  qwen_model: 'qwen-plus',
  qwen_base_url: 'https://dashscope.aliyuncs.com/api/v1',
  // 新增对话相关配置默认值
  enable_memory: true,
  memory_window: 20,
  context_window: 8192,
  // 新增多模态配置默认值
  enable_multimodal: true,
  image_resolution: '1024x1024',
  // 新增安全配置默认值
  enable_safety_check: true,
  safety_level: 'medium',
  // 新增角色配置默认值
  current_role_id: 'default',
  // 新增个性化设置默认值
  personality: 'friendly', // 默认友好性格
  theme: 'auto', // 默认自动主题
  customThemeConfig: { // 默认自定义主题配置
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    accentColor: '#ec4899',
    borderColor: '#e5e7eb',
    hoverColor: '#f3f4f6',
    successColor: '#10b981',
    warningColor: '#f59e0b',
    errorColor: '#ef4444',
    infoColor: '#3b82f6'
  },
  show_preset_questions: true, // 默认显示预设问题
  enable_typing_effect: true, // 默认启用打字效果
  auto_scroll: true, // 默认自动滚动
  shortcut_key: 'ctrl+k', // 默认快捷键
  enable_notifications: false // 默认禁用通知
};

/**
   * 连接状态类型定义
   */
// 错误类型定义
export type ErrorType = 
  | 'NETWORK_ERROR' 
  | 'AUTH_ERROR' 
  | 'QUOTA_ERROR' 
  | 'RATE_LIMIT_ERROR' 
  | 'SERVER_ERROR' 
  | 'MODEL_ERROR' 
  | 'VALIDATION_ERROR' 
  | 'UNKNOWN_ERROR'
  // 新增更细粒度的错误类型
  | 'CONNECTION_TIMEOUT'      // 连接超时
  | 'API_KEY_INVALID'          // API密钥无效
  | 'API_KEY_MISSING'          // API密钥缺失
  | 'REQUEST_TOO_LARGE'        // 请求过大
  | 'RESPONSE_PARSE_ERROR'     // 响应解析错误
  | 'MODEL_UNAVAILABLE'        // 模型不可用
  | 'FEATURE_NOT_SUPPORTED'    // 功能不支持
  | 'CONTEXT_OVERFLOW'         // 上下文溢出
  | 'THROTTLING_ERROR'         // 节流错误
  | 'SERVICE_UNAVAILABLE';     // 服务不可用

// 错误详情类型定义
export interface ErrorDetail {
  type: ErrorType;
  message: string;
  originalError?: Error;
  modelId?: string;
  timestamp: number;
  retryable: boolean;
  // 新增字段
  errorCode?: string;          // 错误代码
  requestId?: string;          // 请求ID
  context?: Record<string, any>; // 错误上下文信息
  userFriendlyMessage?: string; // 对用户友好的错误提示
  suggestedActions?: string[];   // 建议的用户操作
}

// 连接状态类型定义
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

// 意图类型定义
export type UserIntent = 
  | 'QUERY'          // 查询信息
  | 'GENERATE'       // 生成内容
  | 'EXPLAIN'        // 解释概念
  | 'HELP'           // 请求帮助
  | 'SETTING'        // 设置配置
  | 'FEEDBACK'       // 提供反馈
  | 'UNKNOWN';       // 未知意图

// 实体类型定义
export interface RecognizedEntity {
  type: string;       // 实体类型，如"PERSON"、"DATE"、"PLACE"等
  value: string;      // 实体值
  confidence: number; // 识别置信度
}

// 扩展Window接口
interface CustomWindow extends Window {
  env?: Record<string, string>;
}

export interface WorkReviewResult {
  overallScore: number;
  culturalFit: {
    score: number;
    details: string[];
  };
  creativity: {
    score: number;
    details: string[];
  };
  aesthetics: {
    score: number;
    details: string[];
  };
  suggestions: string[];
  commercialPotential: {
    score: number;
    analysis: string[];
  };
  highlights: string[];
  recommendedCommercialPaths: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  relatedActivities: Array<{
    title: string;
    deadline: string;
    reward: string;
    image?: string;
  }>;
}

/**
   * LLM服务类
   */
  class LLMService {
  private currentModel: LLMModel = AVAILABLE_MODELS.find(m => m.isDefault) || AVAILABLE_MODELS[0];
  private modelConfig: ModelConfig = { ...DEFAULT_CONFIG };
  // 对话会话相关属性
  private conversationSessions: ConversationSession[] = [];
  private currentSessionId: string = '';
  // 性能监控相关属性
  private performanceData: Record<string, ModelPerformance> = {};
  private performanceRecords: PerformanceRecord[] = [];
  private maxPerformanceRecords = 1000; // 最多保存1000条性能记录
  // 角色管理相关属性
  private roles: ModelRole[] = [...DEFAULT_ROLES];
  private currentRole: ModelRole = DEFAULT_ROLES.find(r => r.is_default) || DEFAULT_ROLES[0];
  // 连接状态相关属性
  private connectionStatus: Record<string, ConnectionStatus> = {};
  private connectionStatusListeners: Array<(modelId: string, status: ConnectionStatus, error?: string) => void> = [];

  // 分层缓存相关属性
  private responseCache: Map<string, CacheItem> = new Map();
  private cacheExpiryTime = 3600000; // 缓存过期时间：1小时
  private maxCacheSize = 100; // 最大缓存数量
  // 缓存统计
  private cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0
  };
  // 错误处理相关属性
  // 暂时注释掉未使用的错误处理属性
  // private errorLogs: ErrorDetail[] = [];
  // private maxErrorLogs = 500; // 最大错误日志数量
  // private errorListeners: Array<(error: ErrorDetail) => void> = [];

  /**
   * 构造函数，初始化配置
   */
  constructor() {
    // 从localStorage加载保存的模型配置
    this.loadConfigFromStorage();
    // 从环境变量读取API密钥并更新模型配置
    this.loadApiKeysFromEnv();
    // 初始化会话系统
    this.initializeSessions();
    // 从localStorage加载保存的当前模型
    this.loadCurrentModelFromStorage();
    
    // 注册任务执行器到AI任务队列
    this.registerTaskExecutors();
  }
  
  /**
   * 注册任务执行器到AI任务队列
   */
  private registerTaskExecutors(): void {
    // 注册文本生成任务执行器
    aiTaskQueueService.registerTaskExecutor('text', this.executeAITask.bind(this));
    // 注册其他类型任务执行器（预留）
    aiTaskQueueService.registerTaskExecutor('image', this.executeAITask.bind(this));
    aiTaskQueueService.registerTaskExecutor('audio', this.executeAITask.bind(this));
    aiTaskQueueService.registerTaskExecutor('video', this.executeAITask.bind(this));
    aiTaskQueueService.registerTaskExecutor('3d', this.executeAITask.bind(this));
  }
  
  /**
   * 从localStorage加载模型配置
   */
  private loadConfigFromStorage(): void {
    try {
      const savedConfig = localStorage.getItem('LLM_CONFIG');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        this.modelConfig = { ...this.modelConfig, ...parsedConfig };
      }
    } catch (error) {
      console.error('Failed to load config from localStorage:', error);
    }
  }
  
  /**
   * 从localStorage加载保存的当前模型
   */
  private loadCurrentModelFromStorage(): void {
    // 优先检查当前角色的偏好
    if (this.currentRole && this.currentRole.preferredModel) {
       const modelExists = AVAILABLE_MODELS.some(m => m.id === this.currentRole.preferredModel);
       if (modelExists) {
         this.setCurrentModel(this.currentRole.preferredModel, true);
         return;
       }
    }

    try {
      const savedModelId = localStorage.getItem('LLM_CURRENT_MODEL');
      let modelIdToUse = savedModelId;
      
      if (modelIdToUse) {
        // 检查保存的模型是否存在于可用模型列表中
        const modelExists = AVAILABLE_MODELS.some(m => m.id === modelIdToUse);
        if (modelExists) {
          this.setCurrentModel(modelIdToUse, true);
          return;
        }
      }
      
      // 使用默认模型
      const defaultModel = AVAILABLE_MODELS.find(m => m.isDefault) || AVAILABLE_MODELS[0];
      this.setCurrentModel(defaultModel.id, true);
    } catch (error) {
      console.error('Failed to load current model from localStorage:', error);
      // 加载失败时，使用默认模型
      const defaultModel = AVAILABLE_MODELS.find(m => m.isDefault) || AVAILABLE_MODELS[0];
      this.setCurrentModel(defaultModel.id, true);
    }
  }

  /**
   * 从环境变量加载API密钥
   */
  /**
   * 安全获取环境变量，兼容不同环境
   * @param key 环境变量名
   * @returns 环境变量值或undefined
   */
  private getEnvVar(key: string): string | undefined {
    try {
      if (typeof window !== 'undefined') {
        const win = window as unknown as CustomWindow;
        if (win.env) {
          return win.env[key];
        }
      } 
      
      if (typeof process !== 'undefined' && process.env) {
        // Node.js环境和测试环境
        return process.env[key];
      }
    } catch (error) {
      // 忽略任何错误
    }
    return undefined;
  }

  private loadApiKeysFromEnv(): void {
    // 读取使用模型的API密钥
    const apiKeys = {
      kimi_api_key: this.getEnvVar('VITE_KIMI_API_KEY') || this.getEnvVar('KIMI_API_KEY'),
      deepseek_api_key: this.getEnvVar('VITE_DEEPSEEK_API_KEY') || this.getEnvVar('DEEPSEEK_API_KEY'),
      qwen_api_key: this.getEnvVar('VITE_QWEN_API_KEY') || this.getEnvVar('QWEN_API_KEY'),
    };
    
    // 更新模型配置
    this.modelConfig = {
      ...this.modelConfig,
      ...apiKeys
    };
  }

  /**
   * 设置当前使用的模型
   * @param modelId 模型ID
   * @param preserveHistory 是否保留对话历史
   */
  setCurrentModel(modelId: string, preserveHistory: boolean = false): void {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId);
    if (model) {
      // 如果不保留历史，清除当前对话历史
      if (!preserveHistory) {
        this.clearHistory();
      }
      
      const previousModelId = this.currentModel.id;
      this.currentModel = model;
      
      try {
        localStorage.setItem('LLM_CURRENT_MODEL', model.id);
      } catch (error) {
        console.error('Failed to save current model to localStorage:', error);
      }
      
      // 触发模型切换事件
      this.emitModelChangeEvent(previousModelId, model.id);
    }
  }
  
  /**
   * 触发模型切换事件
   */
  private emitModelChangeEvent(previousModelId: string, newModelId: string): void {
    // 创建自定义事件
    const event = new CustomEvent('llm-model-changed', {
      detail: {
        previousModelId,
        newModelId,
        timestamp: Date.now()
      }
    });
    
    // 派发事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }

  /**
   * 获取当前使用的模型
   */
  getCurrentModel(): LLMModel {
    return this.currentModel;
  }

  /**
   * 更新模型配置
   */
  updateConfig(config: Partial<ModelConfig>): void {
    this.modelConfig = { ...this.modelConfig, ...config };
    try { localStorage.setItem('LLM_CONFIG', JSON.stringify(this.modelConfig)); } catch {}
  }

  /**
   * 获取当前模型配置
   */
  getConfig(): ModelConfig {
    return { ...this.modelConfig };
  }

  /**
   * 清除当前会话的对话历史
   */
  clearHistory(): void {
    const session = this.getCurrentSession();
    if (session) {
      session.messages = [];
      session.updatedAt = Date.now();
      this.saveSessions();
    }
  }
  
  /**
   * 初始化模型性能数据
   */
  private initializePerformanceData(modelId: string): void {
    if (!this.performanceData[modelId]) {
      this.performanceData[modelId] = {
        modelId,
        requestCount: 0,
        successCount: 0,
        failureCount: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        lastRequestTime: 0,
        lastSuccessTime: 0,
        lastFailureTime: 0
      };
    }
  }
  
  /**
   * 更新模型性能数据
   */
  private updatePerformanceData(record: PerformanceRecord): void {
    const { modelId, responseTime, success, error } = record;
    
    // 初始化性能数据（如果不存在）
    this.initializePerformanceData(modelId);
    
    const performance = this.performanceData[modelId];
    
    // 更新请求计数
    performance.requestCount++;
    performance.lastRequestTime = Date.now();
    
    if (success) {
      // 更新成功计数
      performance.successCount++;
      performance.lastSuccessTime = Date.now();
    } else {
      // 更新失败计数
      performance.failureCount++;
      performance.lastFailureTime = Date.now();
    }
    
    // 更新响应时间数据
    performance.totalResponseTime += responseTime;
    performance.averageResponseTime = performance.totalResponseTime / performance.requestCount;
    performance.minResponseTime = Math.min(performance.minResponseTime, responseTime);
    performance.maxResponseTime = Math.max(performance.maxResponseTime, responseTime);
    
    // 记录性能记录
    this.performanceRecords.push(record);
    
    // 限制性能记录数量
    if (this.performanceRecords.length > this.maxPerformanceRecords) {
      this.performanceRecords.shift();
    }
  }
  
  /**
   * 记录性能数据
   */
  // 暂时注释掉未使用的方法
  /*
  private recordPerformance(modelId: string, startTime: number, success: boolean, error?: string): void {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const record: PerformanceRecord = {
      modelId,
      startTime,
      endTime,
      responseTime,
      success,
      error,
      timestamp: endTime
    };
    
    this.updatePerformanceData(record);
  }
  */
  
  /**
   * 获取模型性能数据
   */
  getPerformanceData(modelId?: string): ModelPerformance | Record<string, ModelPerformance> {
    if (modelId) {
      this.initializePerformanceData(modelId);
      return { ...this.performanceData[modelId] };
    }
    
    // 确保所有可用模型都有性能数据
    AVAILABLE_MODELS.forEach(model => {
      this.initializePerformanceData(model.id);
    });
    
    return { ...this.performanceData };
  }
  
  /**
   * 获取性能记录
   */
  getPerformanceRecords(modelId?: string, limit: number = 100): PerformanceRecord[] {
    let records = [...this.performanceRecords];
    
    if (modelId) {
      records = records.filter(record => record.modelId === modelId);
    }
    
    // 按时间倒序排列，返回最新的记录
    return records.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }
  
  /**
   * 重置模型性能数据
   */
  resetPerformanceData(modelId?: string): void {
    if (modelId) {
      delete this.performanceData[modelId];
      this.performanceRecords = this.performanceRecords.filter(record => record.modelId !== modelId);
    } else {
      this.performanceData = {};
      this.performanceRecords = [];
    }
  }

  /**
   * 初始化角色系统
   */
  private initializeRoles(): void {
    try {
      const savedRoles = localStorage.getItem('LLM_ROLES');
      if (savedRoles) {
        const parsedRoles = JSON.parse(savedRoles);
        // 合并默认角色和保存的角色，避免丢失默认角色
        const roleMap = new Map<string, ModelRole>();
        
        // 先添加默认角色
        DEFAULT_ROLES.forEach(role => {
          roleMap.set(role.id, role);
        });
        
        // 再添加保存的角色，覆盖同名默认角色
        parsedRoles.forEach((role: ModelRole) => {
          roleMap.set(role.id, role);
        });
        
        // 修复：确保默认角色使用通义千问（如果用户本地存储的是旧配置）
        const defaultRole = roleMap.get('default');
        if (defaultRole && (defaultRole.preferredModel === 'kimi' || !defaultRole.preferredModel)) {
          defaultRole.preferredModel = 'qwen';
        }

        this.roles = Array.from(roleMap.values());
      }
      
      const savedCurrentRoleId = localStorage.getItem('LLM_CURRENT_ROLE_ID');
      if (savedCurrentRoleId) {
        const role = this.roles.find(r => r.id === savedCurrentRoleId);
        if (role) {
          this.currentRole = role;
          this.applyRoleToConfig(role);
        }
      }
    } catch (error) {
      console.error('Failed to initialize roles:', error);
      // 初始化失败，使用默认角色
      this.roles = [...DEFAULT_ROLES];
      this.currentRole = DEFAULT_ROLES.find(r => r.is_default) || DEFAULT_ROLES[0];
      this.applyRoleToConfig(this.currentRole);
    }
  }

  /**
   * 识别用户查询意图
   * @param query 用户查询
   * @returns 识别的意图和置信度
   */
  private recognizeIntent(query: string): { intent: UserIntent; confidence: number } {
    const lowerQuery = query.toLowerCase();
    
    // 简单的意图识别逻辑，基于关键词匹配
    if (lowerQuery.includes('查询') || lowerQuery.includes('怎么') || lowerQuery.includes('如何') || lowerQuery.includes('什么')) {
      return { intent: 'QUERY', confidence: 0.9 };
    } else if (lowerQuery.includes('生成') || lowerQuery.includes('创建') || lowerQuery.includes('写') || lowerQuery.includes('设计')) {
      return { intent: 'GENERATE', confidence: 0.9 };
    } else if (lowerQuery.includes('解释') || lowerQuery.includes('说明') || lowerQuery.includes('什么是') || lowerQuery.includes('意思')) {
      return { intent: 'EXPLAIN', confidence: 0.9 };
    } else if (lowerQuery.includes('帮助') || lowerQuery.includes('使用') || lowerQuery.includes('教程')) {
      return { intent: 'HELP', confidence: 0.9 };
    } else if (lowerQuery.includes('设置') || lowerQuery.includes('配置') || lowerQuery.includes('调整')) {
      return { intent: 'SETTING', confidence: 0.9 };
    } else if (lowerQuery.includes('反馈') || lowerQuery.includes('建议') || lowerQuery.includes('评价')) {
      return { intent: 'FEEDBACK', confidence: 0.9 };
    }
    
    return { intent: 'UNKNOWN', confidence: 0.5 };
  }

  /**
   * 识别用户查询中的实体
   * @param query 用户查询
   * @returns 识别的实体列表
   */
  private recognizeEntities(query: string): RecognizedEntity[] {
    const entities: RecognizedEntity[] = [];
    
    // 简单的实体识别逻辑，基于正则表达式和关键词匹配
    
    // 1. 识别日期实体
    const dateRegex = /(\d{4}年\d{1,2}月\d{1,2}日|\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}\/\d{4}|今天|明天|昨天|本周|下周|上个月|下个月)/g;
    let match;
    while ((match = dateRegex.exec(query)) !== null) {
      entities.push({
        type: 'DATE',
        value: match[0],
        confidence: 0.9
      });
    }
    
    // 2. 识别地点实体（简单示例，实际应用中需要更复杂的逻辑）
    const placeKeywords = ['北京', '上海', '广州', '深圳', '天津', '重庆', '成都', '杭州'];
    for (const keyword of placeKeywords) {
      if (query.includes(keyword)) {
        entities.push({
          type: 'PLACE',
          value: keyword,
          confidence: 0.8
        });
      }
    }
    
    // 3. 识别人物实体（简单示例）
    const personKeywords = ['李白', '杜甫', '苏轼', '白居易', '王维', '孟浩然'];
    for (const keyword of personKeywords) {
      if (query.includes(keyword)) {
        entities.push({
          type: 'PERSON',
          value: keyword,
          confidence: 0.8
        });
      }
    }
    
    // 4. 识别产品实体（简单示例）
    const productKeywords = ['AI助手', '创作工具', '文化知识', '文创产品', '社区活动'];
    for (const keyword of productKeywords) {
      if (query.includes(keyword)) {
        entities.push({
          type: 'PRODUCT',
          value: keyword,
          confidence: 0.8
        });
      }
    }
    
    return entities;
  }

  /**
   * 分析复杂查询结构
   * @param query 用户查询
   * @returns 分析结果，包括意图、实体和查询结构
   */
  /**
   * 分析复杂查询结构 - 暂时注释，未使用
   */
  /*
  private analyzeComplexQuery(query: string): {
    intent: UserIntent;
    entities: RecognizedEntity[];
    queryType: 'simple' | 'complex';
    subQueries?: string[];
  } {
    const intentResult = this.recognizeIntent(query);
    const entities = this.recognizeEntities(query);
    
    // 简单的查询结构分析，基于标点符号和连接词
    const hasMultipleQuestions = query.includes('?') && query.indexOf('?') !== query.lastIndexOf('?');
    const hasConjunctions = query.includes('和') || query.includes('并且') || query.includes('同时') || query.includes('还有');
    
    let queryType: 'simple' | 'complex' = 'simple';
    let subQueries: string[] | undefined;
    
    if (hasMultipleQuestions || hasConjunctions) {
      queryType = 'complex';
      
      // 简单的子查询分割，实际应用中需要更复杂的逻辑
      if (hasMultipleQuestions) {
        subQueries = query.split('?').filter(part => part.trim().length > 0).map(part => part.trim() + '?');
      } else if (hasConjunctions) {
        subQueries = query.split(/[和并且同时还有]/).filter(part => part.trim().length > 0).map(part => part.trim());
      }
    }
    
    return {
      intent: intentResult.intent,
      entities,
      queryType,
      subQueries
    };
  }
  */

  /**
   * 生成动态提示词
   * 根据用户角色、当前页面和对话历史调整系统提示词
   */
  private generateDynamicPrompt(
    basePrompt: string,
    context?: {
      page?: string;
      path?: string;
      userPreferences?: Record<string, any>;
    }
  ): string {
    const session = this.getCurrentSession();
    const dynamicElements: string[] = [];
    
    // 1. 添加当前页面上下文
    if (context?.page) {
      dynamicElements.push(`\n\n当前用户正在访问页面：${context.page}`);
    }
    if (context?.path) {
      dynamicElements.push(`路径：${context.path}`);
    }
    
    // 2. 添加对话主题信息
    if (session?.currentTopic) {
      dynamicElements.push(`\n\n当前对话主题：${session.currentTopic}`);
      if (session.topicHistory && session.topicHistory.length > 0) {
        dynamicElements.push(`\n历史主题：${session.topicHistory.join(', ')}`);
      }
    }
    
    // 3. 添加个性化设置
    const personality = this.modelConfig.personality;
    switch (personality) {
      case 'friendly':
        dynamicElements.push(`\n\n请以友好、热情的语气回答用户的问题。`);
        break;
      case 'professional':
        dynamicElements.push(`\n\n请以专业、严谨的语气回答用户的问题，提供详细的技术解释。`);
        break;
      case 'creative':
        dynamicElements.push(`\n\n请以富有创意、想象力的语气回答用户的问题，提供创新的解决方案。`);
        break;
      case 'humorous':
        dynamicElements.push(`\n\n请以幽默、轻松的语气回答用户的问题，适当加入玩笑和有趣的比喻。`);
        break;
      case 'concise':
        dynamicElements.push(`\n\n请以简洁、明了的语气回答用户的问题，避免冗长的解释。`);
        break;
      // 新增性格选项的语气指导
      case 'warm':
        dynamicElements.push(`\n\n请以温暖、亲切的语气回答用户的问题，让用户感到舒适和被关心。`);
        break;
      case 'enthusiastic':
        dynamicElements.push(`\n\n请以充满热情和活力的语气回答用户的问题，展现积极向上的态度。`);
        break;
      case 'calm':
        dynamicElements.push(`\n\n请以冷静、沉稳的语气回答用户的问题，提供理性和客观的分析。`);
        break;
      case 'witty':
        dynamicElements.push(`\n\n请以机智、风趣的语气回答用户的问题，展现敏捷的思维和幽默。`);
        break;
      case 'scholarly':
        dynamicElements.push(`\n\n请以博学、严谨的语气回答用户的问题，提供深入的分析和专业知识。`);
        break;
      case 'casual':
        dynamicElements.push(`\n\n请以随意、轻松的语气回答用户的问题，就像和朋友聊天一样。`);
        break;
      case 'strict':
        dynamicElements.push(`\n\n请以严格、认真的语气回答用户的问题，强调准确性和规范性。`);
        break;
      case 'empathetic':
        dynamicElements.push(`\n\n请以富有同理心和理解力的语气回答用户的问题，表现出对用户感受的理解和支持。`);
        break;
      default:
        break;
    }
    
    // 4. 添加对话历史摘要（如果有）
    if (session?.contextSummary) {
      dynamicElements.push(`\n\n对话历史摘要：${session.contextSummary}`);
    }
    
    // 5. 添加模型特定指令
    const modelId = this.currentModel.id;
    switch (modelId) {
      case 'kimi':
        dynamicElements.push(`\n\n请充分利用Kimi的长上下文能力，提供详细、全面的回答。`);
        break;
      case 'deepseek':
        dynamicElements.push(`\n\n请结合Deepseek在文化元素融合方面的优势，提供富有文化内涵的回答。`);
        break;
      case 'qwen':
        dynamicElements.push(`\n\n请利用通义千问的综合能力，提供全面、准确的回答。`);
        break;
      default:
        break;
    }
    
    // 组合基础提示词和动态元素
    return `${basePrompt}${dynamicElements.join('')}`;
  }

  /**
   * 更新对话上下文摘要
   * 定期生成对话摘要，用于长对话管理
   */
  private updateContextSummary(): void {
    const session = this.getCurrentSession();
    if (!session || session.messages.length < 10) {
      // 对话历史较短，不需要生成摘要
      return;
    }
    
    // 简单的摘要生成逻辑：提取最近几条消息的关键词
    const recentMessages = session.messages.slice(-5);
    const combinedText = recentMessages.map(msg => msg.content).join(' ');
    
    // 这里可以替换为更复杂的摘要生成算法，甚至调用LLM生成摘要
    // 暂时使用简单的关键词提取
    const words = combinedText.toLowerCase().split(/\s+/);
    const stopWords = new Set(['的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这']);
    
    const filteredWords = words.filter(word => !stopWords.has(word) && word.length > 1);
    const wordFreq: Record<string, number> = {};
    filteredWords.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
    
    session.contextSummary = `对话围绕以下主题展开：${topWords.join(', ')}`;
    this.saveSessions();
  }

  /**
   * 将角色配置应用到模型配置
   */
  private applyRoleToConfig(role: ModelRole): void {
    this.modelConfig = {
      ...this.modelConfig,
      system_prompt: role.system_prompt,
      temperature: role.temperature,
      top_p: role.top_p,
      presence_penalty: role.presence_penalty,
      frequency_penalty: role.frequency_penalty,
      current_role_id: role.id
    };
    
    // 保存更新后的配置
    try {
      localStorage.setItem('LLM_CONFIG', JSON.stringify(this.modelConfig));
    } catch (error) {
      console.error('Failed to save config with role:', error);
    }
  }
  
  /**
   * 保存角色到localStorage
   */
  private saveRoles(): void {
    try {
      localStorage.setItem('LLM_ROLES', JSON.stringify(this.roles));
      localStorage.setItem('LLM_CURRENT_ROLE_ID', this.currentRole.id);
    } catch (error) {
      console.error('Failed to save roles:', error);
    }
  }
  
  /**
   * 初始化会话系统
   */
  private initializeSessions(): void {
    // 先初始化角色系统
    this.initializeRoles();
    
    try {
      const savedSessions = localStorage.getItem('LLM_CONVERSATION_SESSIONS');
      if (savedSessions) {
        this.conversationSessions = JSON.parse(savedSessions);
      }
      
      const savedCurrentSessionId = localStorage.getItem('LLM_CURRENT_SESSION_ID');
      if (savedCurrentSessionId) {
        this.currentSessionId = savedCurrentSessionId;
      }
      
      // 如果没有会话或当前会话不存在，创建一个新会话
      if (this.conversationSessions.length === 0 || !this.getCurrentSession()) {
        this.createSession('新对话');
      }
    } catch (error) {
      console.error('Failed to initialize sessions:', error);
      // 初始化失败，创建一个默认会话
      this.createSession('新对话');
    }
  }
  
  /**
   * 保存会话到localStorage
   */
  private saveSessions(): void {
    try {
      localStorage.setItem('LLM_CONVERSATION_SESSIONS', JSON.stringify(this.conversationSessions));
      localStorage.setItem('LLM_CURRENT_SESSION_ID', this.currentSessionId);
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  }
  
  /**
   * 创建新会话
   */
  createSession(name: string, modelId?: string): ConversationSession {
    const session: ConversationSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      modelId: modelId || this.currentModel.id,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
      // 初始化主题追踪相关字段
      currentTopic: '',
      topicHistory: [],
      contextSummary: '',
      lastMessageTimestamp: Date.now()
    };
    
    // 停用当前会话
    const currentSession = this.getCurrentSession();
    if (currentSession) {
      currentSession.isActive = false;
    }
    
    // 添加新会话
    this.conversationSessions.push(session);
    this.currentSessionId = session.id;
    
    // 保存会话
    this.saveSessions();
    
    return session;
  }
  
  /**
   * 切换会话
   */
  switchSession(sessionId: string): void {
    const session = this.conversationSessions.find(s => s.id === sessionId);
    if (session) {
      // 停用当前会话
      const currentSession = this.getCurrentSession();
      if (currentSession) {
        currentSession.isActive = false;
      }
      
      // 激活新会话
      session.isActive = true;
      this.currentSessionId = session.id;
      
      // 切换到会话使用的模型
      this.setCurrentModel(session.modelId, true);
      
      // 保存会话
      this.saveSessions();
    }
  }
  
  /**
   * 删除会话
   */
  deleteSession(sessionId: string): void {
    const index = this.conversationSessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      // 如果删除的是当前会话，切换到另一个会话
      if (sessionId === this.currentSessionId) {
        this.conversationSessions.splice(index, 1);
        
        if (this.conversationSessions.length > 0) {
          // 切换到第一个会话
          const newSession = this.conversationSessions[0];
          newSession.isActive = true;
          this.currentSessionId = newSession.id;
          this.setCurrentModel(newSession.modelId, true);
        } else {
          // 如果没有会话了，创建一个新会话
          this.createSession('新对话');
        }
      } else {
        // 删除非当前会话
        this.conversationSessions.splice(index, 1);
      }
      
      // 保存会话
      this.saveSessions();
    }
  }
  
  /**
   * 重命名会话
   */
  renameSession(sessionId: string, name: string): void {
    const session = this.conversationSessions.find(s => s.id === sessionId);
    if (session) {
      session.name = name;
      session.updatedAt = Date.now();
      this.saveSessions();
    }
  }
  
  /**
   * 获取当前会话
   */
  private getCurrentSession(): ConversationSession | undefined {
    return this.conversationSessions.find(s => s.id === this.currentSessionId);
  }
  
  /**
   * 获取所有会话
   */
  getSessions(): ConversationSession[] {
    return [...this.conversationSessions].sort((a, b) => b.updatedAt - a.updatedAt);
  }
  
  /**
   * 获取指定会话
   */
  getSession(sessionId: string): ConversationSession | undefined {
    return this.conversationSessions.find(s => s.id === sessionId);
  }
  
  /**
   * 获取当前会话的对话历史
   */
  getHistory(): Message[] {
    const session = this.getCurrentSession();
    return session ? [...session.messages] : [];
  }
  
  /**
   * 获取指定会话的对话历史
   */
  getSessionHistory(sessionId: string): Message[] {
    const session = this.getSession(sessionId);
    return session ? [...session.messages] : [];
  }
  
  /**
   * 导入对话历史到当前会话
   */
  importHistory(messages: Message[]): void {
    const session = this.getCurrentSession();
    if (session) {
      const limit = this.modelConfig.max_history || 10;
      const trimmed = messages.slice(-limit);
      session.messages = [...trimmed];
      session.updatedAt = Date.now();
      this.saveSessions();
      
      try {
        localStorage.setItem('LLM_HISTORY_IMPORTED_AT', String(Date.now()));
      } catch (error) {
        console.error('Failed to save import timestamp:', error);
      }
    }
  }
  
  /**
   * 导出当前会话
   */
  exportSession(): ConversationSession {
    const session = this.getCurrentSession();
    if (!session) {
      throw new Error('No active session');
    }
    return JSON.parse(JSON.stringify(session));
  }
  
  /**
   * 导入会话
   */
  importSession(sessionData: ConversationSession): ConversationSession {
    // 创建新会话ID，避免冲突
    const newSession: ConversationSession = {
      ...sessionData,
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.conversationSessions.push(newSession);
    this.saveSessions();
    
    return newSession;
  }
  
  /**
   * 获取所有角色
   */
  getRoles(): ModelRole[] {
    return [...this.roles];
  }
  
  /**
   * 获取当前角色
   */
  getCurrentRole(): ModelRole {
    return { ...this.currentRole };
  }
  
  /**
   * 设置当前角色
   * @param roleId 角色ID
   */
  setCurrentRole(roleId: string): void {
    const role = this.roles.find(r => r.id === roleId);
    if (role) {
      this.currentRole = role;
      this.applyRoleToConfig(role);
      this.saveRoles();
      
      // 触发角色切换事件
      this.emitRoleChangeEvent(roleId);

      // 如果角色有偏好的模型，自动切换模型
      if (role.preferredModel) {
        // 检查模型是否可用
        const modelExists = AVAILABLE_MODELS.some(m => m.id === role.preferredModel);
        if (modelExists) {
          console.log(`[LLM] Switching to preferred model ${role.preferredModel} for role ${role.name}`);
          this.setCurrentModel(role.preferredModel, true);
        }
      } else {
        // 如果没有偏好，切换到全局默认模型
        const defaultModel = AVAILABLE_MODELS.find(m => m.isDefault) || AVAILABLE_MODELS[0];
        if (defaultModel && defaultModel.id !== this.currentModel.id) {
           console.log(`[LLM] Switching to default model ${defaultModel.id} for role ${role.name}`);
           this.setCurrentModel(defaultModel.id, true);
        }
      }
    }
  }
  
  /**
   * 获取指定模型的连接状态
   * @param modelId 模型ID
   */
  getConnectionStatus(modelId: string): ConnectionStatus {
    return this.connectionStatus[modelId] || 'disconnected';
  }
  
  /**
   * 简化的直接生成响应方法，绕过任务队列
   * 用于调试和测试
   */
  async directGenerateResponse(prompt: string, options?: {
    onDelta?: (chunk: string) => void;
    signal?: AbortSignal;
    context?: {[key: string]: any};
  }): Promise<string> {
    try {
      console.log('=== directGenerateResponse 开始 ===');
      console.log('提示词:', prompt);
      
      const modelId = this.getCurrentModel().id;
      console.log('模型ID:', modelId);
      
      // 构建完整的请求消息，包括系统提示词
      // 这确保了AI助手能够正确识别自己的身份和角色
      const systemMessage: Message = {
        role: 'system',
        content: this.generateDynamicPrompt(this.modelConfig.system_prompt, options?.context),
        timestamp: Date.now()
      };
      
      const userMessage: Message = {
        role: 'user',
        content: prompt,
        timestamp: Date.now()
      };
      
      const messages: Message[] = [systemMessage, userMessage];
      
      console.log('请求消息:', JSON.stringify(messages, null, 2));
      
      // 直接调用模型API
      console.log('开始调用模型API...');
      const response = await this.callModelApiDirectly(modelId, messages, {
        onDelta: (chunk) => {
          console.log('流式数据:', chunk);
          if (options?.onDelta) {
            options.onDelta(chunk);
          }
        },
        signal: options?.signal
      });
      
      console.log('模型API调用成功，响应内容:', response);
      console.log('=== directGenerateResponse 成功 ===');
      return response;
    } catch (error) {
      console.error('=== directGenerateResponse 失败 ===');
      console.error('错误:', error);
      console.error('错误栈:', error instanceof Error ? error.stack : '无错误栈');
      // 重新抛出错误，确保前端能够捕获并显示
      throw error;
    }
  }
  
  /**
   * 设置模型的连接状态
   * @param modelId 模型ID
   * @param status 连接状态
   * @param error 错误信息（可选）
   */
  private setConnectionStatus(modelId: string, status: ConnectionStatus, error?: string): void {
    this.connectionStatus[modelId] = status;
    
    // 触发连接状态变化事件
    this.emitConnectionStatusChange(modelId, status, error);
  }
  
  /**
   * 触发连接状态变化事件
   * @param modelId 模型ID
   * @param status 连接状态
   * @param error 错误信息（可选）
   */
  private emitConnectionStatusChange(modelId: string, status: ConnectionStatus, error?: string): void {
    // 调用所有监听器
    this.connectionStatusListeners.forEach(listener => {
      listener(modelId, status, error);
    });
    
    // 派发自定义事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('llm-connection-status-changed', {
        detail: {
          modelId,
          status,
          error,
          timestamp: Date.now()
        }
      }));
    }
  }
  
  /**
   * 触发角色切换事件
   */
  private emitRoleChangeEvent(roleId: string): void {
    // 创建自定义事件
    const event = new CustomEvent('llm-role-changed', {
      detail: {
        roleId,
        timestamp: Date.now()
      }
    });
    
    // 派发事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }
  
  /**
   * 创建新角色
   * @param roleData 角色数据
   */
  createRole(roleData: Omit<ModelRole, 'id' | 'created_at' | 'updated_at'>): ModelRole {
    const newRole: ModelRole = {
      ...roleData,
      id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: Date.now(),
      updated_at: Date.now()
    };
    
    this.roles.push(newRole);
    this.saveRoles();
    
    return newRole;
  }
  
  /**
   * 更新角色
   * @param roleId 角色ID
   * @param roleData 角色数据
   */
  updateRole(roleId: string, roleData: Partial<ModelRole>): ModelRole | null {
    const index = this.roles.findIndex(r => r.id === roleId);
    if (index !== -1) {
      const updatedRole: ModelRole = {
        ...this.roles[index],
        ...roleData,
        updated_at: Date.now()
      };
      
      this.roles[index] = updatedRole;
      this.saveRoles();
      
      // 如果更新的是当前角色，应用新配置
      if (roleId === this.currentRole.id) {
        this.currentRole = updatedRole;
        this.applyRoleToConfig(updatedRole);
      }
      
      return updatedRole;
    }
    
    return null;
  }
  
  /**
   * 删除角色
   * @param roleId 角色ID
   */
  deleteRole(roleId: string): boolean {
    // 不能删除默认角色
    const role = this.roles.find(r => r.id === roleId);
    if (role && role.is_default) {
      return false;
    }
    
    const index = this.roles.findIndex(r => r.id === roleId);
    if (index !== -1) {
      this.roles.splice(index, 1);
      this.saveRoles();
      
      // 如果删除的是当前角色，切换到默认角色
      if (roleId === this.currentRole.id) {
        const defaultRole = this.roles.find(r => r.is_default) || this.roles[0];
        this.setCurrentRole(defaultRole.id);
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * 生成缓存键
   * 支持多种缓存级别：全局、对话、模型
   */
  private generateCacheKey(prompt: string, modelId: string, context?: any, cacheLevel: 'global' | 'conversation' | 'model' = 'global'): string {
    const contextStr = JSON.stringify(context || {});
    const session = this.getCurrentSession();
    const conversationId = session?.id || 'global';
    
    // 根据缓存级别生成不同的缓存键
    switch (cacheLevel) {
      case 'global':
        return `${modelId}:${this.currentRole.id}:${prompt}:${contextStr}`;
      case 'conversation':
        return `${modelId}:${this.currentRole.id}:${conversationId}:${prompt}:${contextStr}`;
      case 'model':
        return `${modelId}:${prompt}:${contextStr}`;
      default:
        return `${modelId}:${this.currentRole.id}:${prompt}:${contextStr}`;
    }
  }
  
  /**
   * 检查缓存
   * 支持智能缓存匹配和统计
   */
  private checkCache(prompt: string, modelId: string, context?: any): string | null {
    this.cacheStats.totalRequests++;
    
    // 生成不同级别的缓存键
    const cacheKeys = [
      this.generateCacheKey(prompt, modelId, context, 'conversation'),
      this.generateCacheKey(prompt, modelId, context, 'global'),
      this.generateCacheKey(prompt, modelId, context, 'model')
    ];
    
    const now = Date.now();
    
    // 依次检查不同级别的缓存
    for (const cacheKey of cacheKeys) {
      const cachedItem = this.responseCache.get(cacheKey);
      
      if (cachedItem) {
        // 检查缓存是否过期
        if (now - cachedItem.timestamp < this.cacheExpiryTime) {
          this.cacheStats.hits++;
          return cachedItem.response;
        } else {
          // 缓存过期，移除
          this.responseCache.delete(cacheKey);
          this.cacheStats.evictions++;
        }
      }
    }
    
    this.cacheStats.misses++;
    return null;
  }
  
  /**
   * 计算缓存优先级
   * 根据对话上下文和内容自动确定缓存优先级
   */
  private calculateCachePriority(prompt: string, response: string): 'high' | 'medium' | 'low' {
    // 简单的优先级计算逻辑
    const session = this.getCurrentSession();
    
    // 1. 如果是系统级提示或重要指令，优先级高
    if (prompt.includes('系统') || prompt.includes('设置') || prompt.includes('配置')) {
      return 'high';
    }
    
    // 2. 如果是当前对话的主题相关内容，优先级中
    if (session?.currentTopic && prompt.includes(session.currentTopic)) {
      return 'medium';
    }
    
    // 3. 其他情况优先级低
    return 'low';
  }
  
  /**
   * 更新缓存
   * 实现分层缓存和智能缓存失效
   */
  private updateCache(prompt: string, modelId: string, response: string, context?: any): void {
    const cacheKey = this.generateCacheKey(prompt, modelId, context, 'conversation');
    const session = this.getCurrentSession();
    
    // 计算缓存优先级
    const priority = this.calculateCachePriority(prompt, response);
    
    // 检查缓存大小，超过限制则移除优先级低的缓存
    if (this.responseCache.size >= this.maxCacheSize) {
      // 按优先级和时间排序，移除最应该被清除的缓存
      const cacheEntries = Array.from(this.responseCache.entries());
      cacheEntries.sort((a, b) => {
        // 先按优先级排序
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b[1].priority] - priorityOrder[a[1].priority];
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
        // 优先级相同时，按时间排序，移除最旧的
        return a[1].timestamp - b[1].timestamp;
      });
      
      // 移除最末尾的缓存（优先级最低且最旧）
      const itemToRemove = cacheEntries[cacheEntries.length - 1];
      this.responseCache.delete(itemToRemove[0]);
      this.cacheStats.evictions++;
    }
    
    // 添加新缓存
    this.responseCache.set(cacheKey, {
      response,
      timestamp: Date.now(),
      conversationId: session?.id,
      topic: session?.currentTopic,
      priority
    });
  }
  
  /**
   * 生成图片
   * 调用后端代理API进行图片生成
   */
  async generateImage(params: GenerateImageParams): Promise<GenerateImageResponse> {
    try {
      // 确保prompt字段存在
      if (!params.prompt) {
        console.warn('[LLM] Prompt is required for image generation');
        return this.getMockImageResponse(params.prompt);
      }
      
      console.log('[LLM] Calling backend for Qwen image generation...');
      
      // 调用后端代理API
      // 设置较长的超时时间，因为后端会进行轮询
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90秒超时
      
      try {
        const response = await fetch('/api/qwen/images/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: params.model || 'wanx2.1-t2i-turbo',
            prompt: params.prompt,
            size: params.size,
            n: params.n || 1
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.warn(`[LLM] Backend image generation failed:`, errorData);
          
          // 如果是认证错误，提示用户配置API密钥
          if (response.status === 401 || response.status === 503) {
             console.error('[LLM] API Key missing or invalid on server');
             // 这里可以抛出特定错误，或者让UI显示配置提示
          }
          
          return this.getMockImageResponse(params.prompt);
        }
        
        const result = await response.json();
        
        // Handle nested data structure from backend
        // Backend returns { ok: true, data: { created: number, data: [] } }
        const imageData = result.data?.data || result.data;
        
        if (result.ok && Array.isArray(imageData)) {
          return {
            ok: true,
            data: {
              created: result.data?.created || Date.now(),
              data: imageData
            }
          };
        } else {
          console.warn('[LLM] Invalid response format from backend:', result);
          return this.getMockImageResponse(params.prompt);
        }
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
      
    } catch (error) {
      console.warn('[LLM] Image generation failed:', error);
      return this.getMockImageResponse(params.prompt);
    }
  }
  
  /**
   * 生成视频
   * @param params 视频生成参数
   * @returns 视频生成响应
   */
  async generateVideo(params: {
    prompt: string;
    imageUrl?: string;
    duration?: number;
    resolution?: '720p' | '1080p' | '4k';
    aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
    model?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      console.log('[LLM] Calling backend for Qwen video generation...');
      
      const content = [];
      
      // 添加文本提示
      content.push({ type: 'text', text: params.prompt });
      
      // 添加图片URL（如果有）
      if (params.imageUrl) {
        content.push({ type: 'image_url', image_url: { url: params.imageUrl } });
      }
      
      // 添加超时机制，避免无限期等待
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5分钟超时
      
      try {
        const response = await fetch('/api/qwen/videos/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: params.model || 'wanx2.1-t2v-turbo',
            content,
            duration: params.duration,
            resolution: params.resolution,
            aspect_ratio: params.aspectRatio
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.warn(`[LLM] Backend video generation failed:`, errorData);
          
          // 如果是认证错误，提示用户配置API密钥
          if (response.status === 401 || response.status === 503) {
             console.error('[LLM] API Key missing or invalid on server');
          }
          
          return { ok: false, error: errorData.error || 'Video generation failed' };
        }
        
        const result = await response.json();
        
        if (result.ok) {
          return { ok: true, data: result.data };
        } else {
          console.warn('[LLM] Invalid response format from backend:', result);
          return { ok: false, error: result.error || 'Invalid response from backend' };
        }
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('[LLM] Video generation request timed out after 5 minutes');
          return { ok: false, error: '视频生成请求超时，请稍后重试' };
        }
        
        throw error;
      }
      
    } catch (error) {
      console.warn('[LLM] Video generation failed:', error);
      return { ok: false, error: error instanceof Error ? error.message : 'Video generation failed' };
    }
  }

  private getMockImageResponse(prompt: string): GenerateImageResponse {
    // 根据提示词简单的关键词匹配来选择不同的模拟图片
    const keywords = {
      cyberpunk: ['赛博', 'cyber', '未来', '科技', '霓虹'],
      tradition: ['传统', '古风', '年画', '泥人', '水墨', '国潮'],
      food: ['美食', '包子', '麻花', '煎饼'],
    };

    let category = 'default';
    const p = prompt.toLowerCase();
    
    if (keywords.cyberpunk.some(k => p.includes(k))) category = 'cyberpunk';
    else if (keywords.tradition.some(k => p.includes(k))) category = 'tradition';
    else if (keywords.food.some(k => p.includes(k))) category = 'food';

    const mockImages: Record<string, string[]> = {
      cyberpunk: [
        'https://images.unsplash.com/photo-1515630278258-407f66498911?w=1024&q=80', // 赛博城市
        'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=1024&q=80', // 霓虹夜景
      ],
      tradition: [
        'https://images.unsplash.com/photo-1535139262971-c51845709a48?w=1024&q=80', // 传统建筑
        'https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?w=1024&q=80', // 东方美学
      ],
      food: [
        'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1024&q=80', // 中式点心
        'https://images.unsplash.com/photo-1626804475297-411dbe66f42b?w=1024&q=80', // 包子类
      ],
      default: [
        'https://images.unsplash.com/photo-1518182170546-0766aa6b6bc2?w=1024&q=80', // 创意抽象
        'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1024&q=80', // 幻想风格
      ]
    };

    const images = mockImages[category] || mockImages.default;
    // 随机选择一张，或者根据时间戳选择
    const url = images[Date.now() % images.length];

    return {
      ok: true,
      data: {
        created: Date.now(),
        data: [{ url }]
      }
    };
  }

  /**
   * 清除缓存
   * 支持按多种条件清除
   */
  clearCache(options?: {
    modelId?: string;
    conversationId?: string;
    topic?: string;
    priority?: 'high' | 'medium' | 'low';
  }): void {
    if (!options) {
      // 清除所有缓存
      this.responseCache.clear();
      return;
    }
    
    // 按条件清除缓存
    for (const [key, value] of this.responseCache.entries()) {
      let shouldDelete = false;
      
      if (options.modelId && key.startsWith(`${options.modelId}:`)) {
        shouldDelete = true;
      }
      
      if (options.conversationId && value.conversationId === options.conversationId) {
        shouldDelete = true;
      }
      
      if (options.topic && value.topic === options.topic) {
        shouldDelete = true;
      }
      
      if (options.priority && value.priority === options.priority) {
        shouldDelete = true;
      }
      
      if (shouldDelete) {
        this.responseCache.delete(key);
        this.cacheStats.evictions++;
      }
    }
  }
  
  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return { ...this.cacheStats };
  }
  
  /**
   * 重置缓存统计信息
   */
  resetCacheStats() {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0
    };
  }
  
  /**
   * 获取对用户友好的错误提示和建议操作
   */
  private getFriendlyErrorInfo(errorType: ErrorType, modelId: string): {
    userFriendlyMessage: string;
    suggestedActions: string[];
  } {
    const modelName = AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId;
    
    switch (errorType) {
      case 'NETWORK_ERROR':
      case 'CONNECTION_TIMEOUT':
        return {
          userFriendlyMessage: `网络连接失败，请检查您的网络设置后重试。`,
          suggestedActions: [
            '检查网络连接',
            '刷新页面重试',
            '稍后再试'
          ]
        };
        
      case 'AUTH_ERROR':
      case 'API_KEY_INVALID':
        return {
          userFriendlyMessage: `${modelName} API密钥无效，请检查并更新API密钥。`,
          suggestedActions: [
            '检查API密钥是否正确',
            '更新API密钥',
            '联系管理员获取帮助'
          ]
        };
        
      case 'API_KEY_MISSING':
        return {
          userFriendlyMessage: `${modelName} API密钥缺失，请配置API密钥。`,
          suggestedActions: [
            '在设置中配置API密钥',
            '联系管理员获取API密钥'
          ]
        };
        
      case 'QUOTA_ERROR':
        return {
          userFriendlyMessage: `${modelName} 配额已用完，请稍后再试或联系管理员。`,
          suggestedActions: [
            '稍后再试',
            '联系管理员增加配额',
            '切换到其他可用模型'
          ]
        };
        
      case 'RATE_LIMIT_ERROR':
      case 'THROTTLING_ERROR':
        return {
          userFriendlyMessage: `请求频率过高，请稍等片刻后重试。`,
          suggestedActions: [
            '稍等片刻后重试',
            '减少请求频率',
            '稍后再试'
          ]
        };
        
      case 'SERVER_ERROR':
      case 'SERVICE_UNAVAILABLE':
        return {
          userFriendlyMessage: `${modelName} 服务暂时不可用，请稍后再试。`,
          suggestedActions: [
            '稍后再试',
            '刷新页面',
            '切换到其他可用模型'
          ]
        };
        
      case 'MODEL_ERROR':
      case 'MODEL_UNAVAILABLE':
        return {
          userFriendlyMessage: `${modelName} 模型暂时不可用，请尝试其他模型。`,
          suggestedActions: [
            '切换到其他可用模型',
            '稍后再试',
            '联系管理员获取帮助'
          ]
        };
        
      case 'VALIDATION_ERROR':
      case 'REQUEST_TOO_LARGE':
        return {
          userFriendlyMessage: `请求参数无效或过大，请检查输入内容后重试。`,
          suggestedActions: [
            '检查输入内容是否符合要求',
            '减少输入内容的长度',
            '重新尝试'
          ]
        };
        
      case 'RESPONSE_PARSE_ERROR':
        return {
          userFriendlyMessage: `系统处理响应时出现错误，请稍后再试。`,
          suggestedActions: [
            '稍后再试',
            '刷新页面',
            '联系管理员获取帮助'
          ]
        };
        
      case 'FEATURE_NOT_SUPPORTED':
        return {
          userFriendlyMessage: `当前模型不支持该功能，请尝试其他模型。`,
          suggestedActions: [
            '切换到其他可用模型',
            '联系管理员获取帮助'
          ]
        };
        
      case 'CONTEXT_OVERFLOW':
        return {
          userFriendlyMessage: `对话历史过长，请清空部分历史或开始新对话。`,
          suggestedActions: [
            '清空对话历史',
            '开始新对话',
            '减少单次输入内容'
          ]
        };
        
      default:
        return {
          userFriendlyMessage: `系统出现未知错误，请稍后再试。`,
          suggestedActions: [
            '稍后再试',
            '刷新页面',
            '联系管理员获取帮助'
          ]
        };
    }
  }

  /**
   * 优化对话历史，实现智能选择和截断
   * 根据当前提示和最大历史长度，智能选择最相关的对话历史
   */
  private optimizeConversationHistory(messages: Message[], currentPrompt: string, maxHistory: number): Message[] {
    // 如果历史消息数量小于等于最大历史长度，直接返回
    if (messages.length <= maxHistory) {
      return messages;
    }
    
    // 简单的优化逻辑：保留最近的maxHistory条消息
    // 实际应用中可以实现更复杂的逻辑，如基于相关性的选择
    return messages.slice(-maxHistory);
  }

  /**
   * 更新对话主题
   * 根据对话历史和当前提示，自动更新对话主题
   */
  private updateConversationTopic(messages: Message[], currentPrompt: string): string {
    // 简单的主题提取逻辑：使用当前提示的前几个关键词
    // 实际应用中可以实现更复杂的主题提取算法
    const words = currentPrompt.toLowerCase().split(/\s+/);
    const stopWords = new Set(['的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这']);
    
    const filteredWords = words.filter(word => !stopWords.has(word) && word.length > 1);
    return filteredWords.slice(0, 3).join(' ');
  }

  /**
   * 构建多模态内容
   * 处理包含图像的多模态请求
   */
  private buildMultimodalContent(prompt: string, images?: string[]): any {
    // 简单的多模态内容构建逻辑
    // 实际应用中需要根据具体模型的API要求进行调整
    if (!images || images.length === 0) {
      return { text: prompt };
    }
    
    return {
      text: prompt,
      images: images.map(url => ({ url }))
    };
  }

  /**
   * 生成创意方向
   */
  public generateCreativeDirections(prompt: string): string[] {
    // 这里可以实现更复杂的创意方向生成逻辑
    return [
      '基于传统文化元素的创新设计',
      '结合现代科技的创意表现',
      '跨文化融合的设计思路',
      '注重可持续发展的设计理念',
      '以用户为中心的交互设计'
    ];
  }

  /**
   * 推荐文化元素
   */
  public recommendCulturalElements(prompt: string): string[] {
    // 这里可以实现更复杂的文化元素推荐逻辑
    return [
      '传统纹样',
      '民族色彩',
      '非遗技艺',
      '古典诗词',
      '历史典故'
    ];
  }

  /**
   * 生成作品点评
   */
  public async generateWorkReview(prompt: string, description: string): Promise<WorkReviewResult> {
    const instruction = `你是一位专业的艺术评论家和设计顾问。请根据用户的设计提示词和作品描述，对作品进行全方位的专业点评。

请返回严格的JSON格式数据，不要包含Markdown代码块标记。JSON结构如下：
{
  "overallScore": number, // 总分 0-100
  "culturalFit": { "score": number, "details": ["评价点1", "评价点2"] }, // 文化契合度
  "creativity": { "score": number, "details": ["评价点1", "评价点2"] }, // 创意性
  "aesthetics": { "score": number, "details": ["评价点1", "评价点2"] }, // 美学表现
  "suggestions": ["建议1", "建议2", "建议3"], // 改进建议
  "commercialPotential": { "score": number, "analysis": ["分析1", "分析2"] }, // 商业潜力
  "highlights": ["亮点1", "亮点2", "亮点3"], // 作品亮点
  "recommendedCommercialPaths": [
    { "title": "路径名称1", "description": "简短描述", "icon": "gift" } // icon可选值: gift, box, gem, t-shirt, mug, bag
  ],
  "relatedActivities": [
    { "title": "活动名称1", "deadline": "截止日期", "reward": "奖励信息" }
  ]
}

评分标准：
- 优秀 (90-100): 完美契合，极具创意
- 良好 (80-89): 表现出色，有少量瑕疵
- 中等 (70-79): 符合基本要求
- 待改进 (<70): 存在明显缺陷`;

    const userPrompt = `${instruction}\n\n设计提示词：${prompt}\n作品描述：${description}`;

    try {
      // 使用直接调用以避免任务队列的复杂性，或者使用任务队列也可以
      // 这里使用generateResponse，它会进入队列
      const response = await this.generateResponse(userPrompt, {
        priority: 'high'
      });
      
      // 尝试解析JSON
      let jsonStr = response.trim();
      // 处理可能的Markdown代码块
      const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/) || jsonStr.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Failed to generate work review:', error);
      // API调用失败时抛出错误，让调用方处理
      throw new Error('AI点评生成失败，请稍后重试');
    }
  }

  /**
   * 诊断创作问题
   */
  public diagnoseCreationIssues(prompt: string): string[] {
    // 基于输入内容生成有针对性的创作问题
    const issues: string[] = [];
    const lowerPrompt = prompt.toLowerCase();
    
    // 分析输入内容，生成个性化问题
    if (!lowerPrompt.includes('创意') && !lowerPrompt.includes('创新')) {
      issues.push('建议明确创意方向，突出设计的独特性');
    }
    
    if (!lowerPrompt.includes('文化') && !lowerPrompt.includes('传统')) {
      issues.push('可以考虑融入更多文化元素，增强作品的文化底蕴');
    }
    
    if (!lowerPrompt.includes('视觉') && !lowerPrompt.includes('层次')) {
      issues.push('建议优化视觉层次，使设计更有深度和立体感');
    }
    
    if (!lowerPrompt.includes('色彩') && !lowerPrompt.includes('配色')) {
      issues.push('可以考虑调整色彩搭配，增强作品的视觉冲击力');
    }
    
    if (!lowerPrompt.includes('创新') && !lowerPrompt.includes('亮点')) {
      issues.push('建议添加创新亮点，使作品更具吸引力和竞争力');
    }
    
    // 如果没有生成足够的问题，添加一些通用建议
    while (issues.length < 3) {
      const generalIssues = [
        '考虑优化作品的构图，使其更加平衡和谐',
        '建议增强作品的故事性，让设计更有感染力',
        '可以考虑作品的实际应用场景，优化设计细节',
        '建议添加更多细节，丰富作品的表现力',
        '考虑作品的目标受众，调整设计风格和元素'
      ];
      const randomIssue = generalIssues[Math.floor(Math.random() * generalIssues.length)];
      if (!issues.includes(randomIssue)) {
        issues.push(randomIssue);
      }
    }
    
    return issues;
  }

  /**
   * 获取回退响应
   */
  private getFallbackResponse(modelId: string, errorMessage: string): string {
    // 移除原始错误信息，提供更友好的提示
    const modelName = AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId;
    return `抱歉，当前${modelName}模型暂时无法提供服务。\n\n建议：\n1. 稍后再试\n2. 切换到其他可用模型\n3. 检查网络连接\n4. 点击右上角心跳图标检查服务状态`;
  }

  /**
   * 确保可用模型
   */
  async ensureAvailableModel(preferred: string[] = []): Promise<string> {
    // 安全获取API基础URL
    const apiBase = this.getEnvVar('VITE_API_BASE_URL') || '';
    const useProxy = !!apiBase;

    // 首先检查当前模型是否可用
    const currentModel = this.getCurrentModel();
    const hasValidKey = this.hasValidApiKey(currentModel.id, useProxy);
    if (hasValidKey) {
      return currentModel.id;
    }

    // 检查首选模型列表
    for (const modelId of preferred) {
      if (this.hasValidApiKey(modelId, useProxy)) {
        return modelId;
      }
    }

    // 检查所有可用模型
    const availableModels = AVAILABLE_MODELS.filter(model => {
      return this.hasValidApiKey(model.id, useProxy);
    });

    // 按优先级排序模型
    const sortedModels = [...availableModels].sort((a, b) => {
      // 优先选择默认模型
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      // 然后按ID排序
      return a.id.localeCompare(b.id);
    });

    // 返回第一个可用模型
    if (sortedModels.length > 0) {
      return sortedModels[0].id;
    }

    // 如果没有可用模型，返回当前模型（会触发错误处理）
    return currentModel.id;
  }

  /**
   * 生成响应
   * @param prompt 用户输入的提示词
   * @param options 可选配置，包括流式响应回调等
   * @returns 生成的响应文本
   */
  /**
   * 生成响应（通过任务队列）
   */
  async generateResponse(prompt: string, options?: {
    onDelta?: (chunk: string) => void;
    signal?: AbortSignal;
    context?: {[key: string]: any};
    priority?: TaskPriority;
  }): Promise<string> {
    // 检查缓存
    const modelId = this.getCurrentModel().id;
    const cacheKey = this.generateCacheKey(prompt, modelId, {}, 'conversation');
    const cachedResponse = this.responseCache.get(cacheKey);
    if (cachedResponse) {
      this.cacheStats.hits++;
      this.cacheStats.totalRequests++;
      if (options?.onDelta) {
        options.onDelta(cachedResponse.response);
      }
      return cachedResponse.response;
    }
    
    this.cacheStats.misses++;
    this.cacheStats.totalRequests++;
    
    // 创建AI生成任务并添加到队列
    return new Promise((resolve, reject) => {
      const task = aiTaskQueueService.addTask('text', prompt, {
        priority: options?.priority || 'medium',
        metadata: {
          modelId,
          context: options?.context,
          conversationId: this.getCurrentSession()?.id
        },
        onProgress: (progress, data) => {
          if (options?.onDelta && data?.chunk) {
            options.onDelta(data.chunk);
          }
        },
        onComplete: async (result) => {
          if (result.success) {
            const fullResponse = result.data;
            
            // 更新缓存
            this.updateCache(prompt, modelId, fullResponse);
            
            // 更新对话历史
            const session = this.getCurrentSession();
            if (session) {
              const userMessage: Message = {
                role: 'user',
                content: prompt,
                timestamp: Date.now()
              };
              
              // 添加消息到对话历史
              session.messages.push(userMessage, {
                role: 'assistant',
                content: fullResponse,
                timestamp: Date.now()
              });
              session.updatedAt = Date.now();
              session.lastMessageTimestamp = Date.now();
              this.saveSessions();
            }
            
            resolve(fullResponse);
          } else {
            reject(new Error(result.error || '任务执行失败'));
          }
        },
        onError: (error) => {
          reject(new Error(error));
        }
      });
      
      // 如果提供了中止信号，添加取消逻辑
      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          aiTaskQueueService.cancelTask(task.id);
          reject(new Error('Request aborted'));
        });
      }
    });
  }
  
  /**
   * 执行AI生成任务的内部方法
   * 由任务队列调用
   */
  private async executeAITask(task: AITask): Promise<any> {
    try {
      // 记录性能开始时间
      const startTime = Date.now();
      const modelId = task.metadata?.modelId || this.getCurrentModel().id;
      
      console.log('=== executeAITask 开始 ===');
      console.log('模型ID:', modelId);
      console.log('任务类型:', task.type);
      console.log('任务提示:', task.prompt);
      
      // 构建对话历史
      const metadata = task.metadata;
      const session = metadata?.conversationId ? this.conversationSessions.find(s => s.id === metadata.conversationId) : this.getCurrentSession();
      const history = session?.messages || [];
      const maxHistory = this.modelConfig.max_history || 10;
      const optimizedHistory = this.optimizeConversationHistory(history, task.prompt, maxHistory);
      
      console.log('历史消息:', history.length);
      console.log('优化后历史:', optimizedHistory.length);
      
      // 构建请求消息
      const userMessage: Message = {
        role: 'user',
        content: task.prompt,
        timestamp: Date.now()
      };
      
      let typedMessages: Message[];
      
      // 对于所有模型，包括Kimi，都使用完整的系统消息和优化后的历史对话
      // 这确保了AI助手能够正确识别自己的身份和角色
      const systemMessage: Message = {
        role: 'system',
        content: this.generateDynamicPrompt(this.modelConfig.system_prompt, task.metadata?.context),
        timestamp: Date.now()
      };
      
      console.log('系统消息:', systemMessage.content.substring(0, 100) + '...');
      
      const messages = [systemMessage, ...optimizedHistory, userMessage];
      
      console.log('请求消息总数:', messages.length);
      
      typedMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: msg.timestamp
      }));
      
      console.log('最终发送的消息数量:', typedMessages.length);
      
      // 调用真实的LLM API
      let fullResponse: string;
      
      // 对于kimi、deepseek和qwen模型，始终使用直接调用方式
      // 这些模型有专门的API端点，不需要通过通用代理
      console.log('开始调用模型API:', modelId);
      
      // 直接调用callModelApiDirectly，添加详细日志
      fullResponse = await this.callModelApiDirectly(modelId, typedMessages, {
        onDelta: (chunk) => {
          console.log('收到流式数据:', chunk);
          if (task.onProgress) {
            task.onProgress(50, { chunk });
          }
        }
      });
      
      console.log('API调用成功，响应内容:', fullResponse.substring(0, 100) + '...');
      
      // 记录性能结束时间
      const endTime = Date.now();
      console.log('执行时间:', endTime - startTime, 'ms');
      
      // 更新性能数据
      this.updatePerformanceData({
        modelId,
        startTime,
        endTime,
        responseTime: endTime - startTime,
        success: true,
        timestamp: Date.now()
      });
      
      console.log('=== executeAITask 结束 ===');
      return fullResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('生成响应失败:', errorMessage);
      console.error('错误详情:', error);
      console.error('错误栈:', error instanceof Error ? error.stack : '');
      
      // API调用失败，更新连接状态为error
      this.setConnectionStatus(this.getCurrentModel().id, 'error', errorMessage);
      
      // 记录性能数据（失败情况）
      this.updatePerformanceData({
        modelId: this.getCurrentModel().id,
        startTime: Date.now(),
        endTime: Date.now(),
        responseTime: 0,
        success: false,
        error: errorMessage,
        timestamp: Date.now()
      });
      
      console.log('=== executeAITask 异常结束 ===');
      return this.getFallbackResponse(this.getCurrentModel().id, errorMessage);
    }
  }
  
  
  /**
   * 直接调用模型API
   */
  private async callModelApiDirectly(modelId: string, messages: Message[], options?: {
    onDelta?: (chunk: string) => void;
    signal?: AbortSignal;
  }): Promise<string> {
    // 根据不同模型构建请求
    try {
      switch (modelId) {
        case 'kimi':
          console.log('[LLM] 尝试调用 Kimi API');
          return await this.callKimiApi(messages, options);
        case 'deepseek':
          console.log('[LLM] 尝试调用 Deepseek API');
          return await this.callDeepseekApi(messages, options);
        case 'qwen':
          console.log('[LLM] 尝试调用 Qwen API');
          return await this.callQwenApi(messages, options);
        default:
          throw new Error(`不支持的模型类型: ${modelId}`);
      }
    } catch (error) {
      console.warn(`[LLM] 模型 ${modelId} 调用失败:`, error);
      
      // 无论什么模型调用失败，都尝试切换到 Qwen 模型作为兜底
      try {
        console.log(`[LLM] 尝试切换到 Qwen 模型`);
        return await this.callQwenApi(messages, options);
      } catch (qwenError) {
        console.error(`[LLM] Qwen 模型调用也失败:`, qwenError);
        throw new Error('所有可用模型均调用失败，请稍后再试');
      }
    }
  }
  
  /**
   * 调用Kimi API
   */
  private async callKimiApi(messages: Message[], options?: {
    onDelta?: (chunk: string) => void;
    signal?: AbortSignal;
  }): Promise<string> {
    return callKimiChat({
      model: this.modelConfig.kimi_model || 'moonshot-v1-32k',
      messages,
      temperature: this.modelConfig.temperature,
      top_p: this.modelConfig.top_p,
      max_tokens: this.modelConfig.max_tokens,
      signal: options?.signal,
      onDelta: options?.onDelta
    });
  }
  
  /**
   * 调用Deepseek API
   */
  private async callDeepseekApi(messages: Message[], options?: {
    onDelta?: (chunk: string) => void;
    signal?: AbortSignal;
  }): Promise<string> {
    return callDeepseekChat({
      model: this.modelConfig.deepseek_model || 'deepseek-chat',
      messages,
      temperature: this.modelConfig.temperature,
      top_p: this.modelConfig.top_p,
      max_tokens: this.modelConfig.max_tokens,
      signal: options?.signal,
      onDelta: options?.onDelta
    });
  }
  
  /**
   * 调用通义千问API
   */
  private async callQwenApi(messages: Message[], options?: {
    onDelta?: (chunk: string) => void;
    signal?: AbortSignal;
  }): Promise<string> {
    try {
      return await callQwenChat({
        model: this.modelConfig.qwen_model || 'qwen-plus',
        messages,
        temperature: this.modelConfig.temperature,
        top_p: this.modelConfig.top_p,
        max_tokens: this.modelConfig.max_tokens,
        signal: options?.signal,
        onDelta: options?.onDelta
      });
    } catch (error) {
      if (options?.onDelta) {
        console.error('通义千问流式API请求失败:', error);
        throw new Error('通义千问服务暂时不可用，请稍后再试');
      }
      throw error;
    }
  }
  
  /**
   * 检查API密钥是否有效
   */
  private hasValidApiKey(modelId: string, useProxy: boolean): boolean {
    // 如果使用代理，不需要检查API密钥
    if (useProxy) {
      return true;
    }

    // kimi/deepseek/qwen 默认走本地代理端点，不需要前端持有密钥
    switch (modelId) {
      case 'kimi':
      case 'deepseek':
      case 'qwen':
        return true;
      default:
        return false;
    }
  }

  /**
   * 生成作品标题和标签
   * @param description 作品描述
   * @param contentType 内容类型（image/video）
   * @returns 生成的标题和标签
   */
  async generateTitleAndTags(description: string, contentType: 'image' | 'video' = 'image'): Promise<{ title: string; tags: string[] }> {
    const prompt = `请根据以下${contentType === 'video' ? '视频' : '图片'}作品描述，生成一个吸引人的标题和5个相关标签。

作品描述：
${description}

要求：
1. 标题要简洁有力，不超过20个字，能够概括作品主题
2. 标签要与作品内容相关，便于分类和搜索
3. 标签可以从以下类别中选择：
   - 传统文化：国潮、纹样设计、青花瓷、山水画、民俗、剪纸、刺绣、书法、敦煌、壁画、汉服、旗袍等
   - 建筑历史：历史建筑、欧式建筑、天津、五大道、洋楼、古建筑、城市风光等
   - 艺术风格：AI创作、数字艺术、概念设计、插画、海报、油画、水彩、素描等
   - 色彩氛围：暖色调、冷色调、复古色调、温馨、梦幻、明亮等
   - 主题内容：风景、人物、动物、植物、花卉、静物、抽象、写实等

请按以下JSON格式返回结果：
{
  "title": "生成的标题",
  "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"]
}`;

    try {
      console.log('[LLM] Generating title and tags for:', description.substring(0, 50));
      
      const response = await this.callQwenApi([
        { role: 'user', content: prompt, timestamp: Date.now() }
      ]);

      // 解析JSON响应
      try {
        console.log('[LLM] Raw response:', response);
        
        // 尝试从响应中提取JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          console.log('[LLM] Parsed result:', result);
          
          // 检查 title 和 tags
          if (result.title) {
            console.log('[LLM] Title found:', result.title);
          } else {
            console.warn('[LLM] No title in response');
          }
          
          if (Array.isArray(result.tags)) {
            console.log('[LLM] Tags found:', result.tags);
          } else {
            console.warn('[LLM] No tags array in response');
          }
          
          // 只要 title 存在就返回，不强制要求 tags 必须是数组
          if (result.title) {
            const finalResult = {
              title: String(result.title).slice(0, 20),
              tags: Array.isArray(result.tags) ? result.tags.slice(0, 5) : []
            };
            console.log('[LLM] Generated:', finalResult);
            return finalResult;
          }
        } else {
          console.warn('[LLM] No JSON found in response');
        }
      } catch (parseError) {
        console.error('[LLM] Failed to parse response:', parseError);
      }

      // 如果解析失败，返回默认值
      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('[LLM] Generate title and tags error:', error);
      throw error;
    }
  }

  // ==================== AI图片处理API方法 ====================

  /**
   * 图片风格迁移
   * @param imageUrl 原图片URL
   * @param style 目标风格ID
   * @param intensity 强度 (0-100)
   * @returns 风格迁移后的图片URL
   */
  async styleTransfer(imageUrl: string, style: string, intensity: number = 70): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
      console.log('[LLM] Style transfer:', style, 'intensity:', intensity);
      
      const response = await fetch('/api/qwen/images/style-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, style, intensity })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[LLM] Style transfer failed:', errorData);
        return { success: false, error: errorData.error || '风格迁移失败' };
      }

      const result = await response.json();
      console.log('[LLM] Enhance response:', result);
      
      if (result.ok && result.data?.data?.[0]?.url) {
        return { success: true, imageUrl: result.data.data[0].url };
      }
      
      console.error('[LLM] Enhance invalid response structure:', result);
      return { success: false, error: '未获取到图片URL' };
    } catch (error) {
      console.error('[LLM] Style transfer error:', error);
      return { success: false, error: error instanceof Error ? error.message : '风格迁移失败' };
    }
  }

  /**
   * 图片画质增强
   * @param imageUrl 原图片URL
   * @param type 增强类型
   * @param intensity 强度 (0-100)
   * @returns 增强后的图片URL
   */
  async enhanceImage(imageUrl: string, type: string = 'clear', intensity: number = 70): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
      console.log('[LLM] Enhance image:', type, 'intensity:', intensity);
      
      const response = await fetch('/api/qwen/images/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, type, intensity })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[LLM] Enhance failed:', errorData);
        return { success: false, error: errorData.error || '画质增强失败' };
      }

      const result = await response.json();
      
      if (result.ok && result.data?.data?.[0]?.url) {
        return { success: true, imageUrl: result.data.data[0].url };
      }
      
      return { success: false, error: '未获取到图片URL' };
    } catch (error) {
      console.error('[LLM] Enhance error:', error);
      return { success: false, error: error instanceof Error ? error.message : '画质增强失败' };
    }
  }

  /**
   * 智能扩图
   * @param imageUrl 原图片URL
   * @param ratio 扩展比例
   * @param direction 扩展方向
   * @returns 扩展后的图片URL
   */
  async expandImage(imageUrl: string, ratio: number = 1.5, direction: string = 'all'): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
      console.log('[LLM] Expand image:', ratio, 'direction:', direction);
      
      const response = await fetch('/api/qwen/images/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, ratio, direction })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[LLM] Expand failed:', errorData);
        return { success: false, error: errorData.error || '扩图失败' };
      }

      const result = await response.json();
      
      if (result.ok && result.data?.data?.[0]?.url) {
        return { success: true, imageUrl: result.data.data[0].url };
      }
      
      return { success: false, error: '未获取到图片URL' };
    } catch (error) {
      console.error('[LLM] Expand error:', error);
      return { success: false, error: error instanceof Error ? error.message : '扩图失败' };
    }
  }

  /**
   * 局部重绘
   * @param imageUrl 原图片URL
   * @param prompt 修改描述
   * @param mask 遮罩区域(可选)
   * @returns 重绘后的图片URL
   */
  async inpaintImage(imageUrl: string, prompt: string, mask?: string): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
      console.log('[LLM] Inpaint image:', prompt);
      
      const response = await fetch('/api/qwen/images/inpaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, prompt, mask })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[LLM] Inpaint failed:', errorData);
        return { success: false, error: errorData.error || '局部重绘失败' };
      }

      const result = await response.json();
      
      if (result.ok && result.data?.data?.[0]?.url) {
        return { success: true, imageUrl: result.data.data[0].url };
      }
      
      return { success: false, error: '未获取到图片URL' };
    } catch (error) {
      console.error('[LLM] Inpaint error:', error);
      return { success: false, error: error instanceof Error ? error.message : '局部重绘失败' };
    }
  }

  /**
   * 纹样智能融合
   * @param imageUrl 原图片URL
   * @param patternName 纹样名称
   * @param style 融合风格: 'harmony' | 'border' | 'corner' | 'overlay' | 'frame' | 'background'
   * @param intensity 融合强度 0-100
   * @returns 融合后的图片URL
   */
  async fusePattern(
    imageUrl: string, 
    patternName: string, 
    style: string = 'harmony',
    intensity: number = 50
  ): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
      console.log('[LLM] Fuse pattern:', patternName, 'style:', style, 'intensity:', intensity);
      
      const response = await fetch('/api/qwen/images/pattern-fusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, patternName, style, intensity })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[LLM] Pattern fusion failed:', errorData);
        return { success: false, error: errorData.error || '纹样融合失败' };
      }

      const result = await response.json();
      
      if (result.ok && result.data?.data?.[0]?.url) {
        return { success: true, imageUrl: result.data.data[0].url };
      }
      
      return { success: false, error: '未获取到图片URL' };
    } catch (error) {
      console.error('[LLM] Pattern fusion error:', error);
      return { success: false, error: error instanceof Error ? error.message : '纹样融合失败' };
    }
  }

  /**
   * 优化提示词
   * @param prompt 原始提示词
   * @returns 优化后的提示词和建议
   */
  async optimizePrompt(prompt: string): Promise<{ 
    success: boolean; 
    optimized?: string; 
    suggestions?: string[]; 
    explanation?: string;
    error?: string 
  }> {
    try {
      console.log('[LLM] Optimize prompt:', prompt);
      
      const response = await fetch('/api/qwen/prompt/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[LLM] Optimize prompt failed:', errorData);
        return { success: false, error: errorData.error || '提示词优化失败' };
      }

      const result = await response.json();
      
      if (result.ok && result.data) {
        return { 
          success: true, 
          optimized: result.data.optimized,
          suggestions: result.data.suggestions,
          explanation: result.data.explanation
        };
      }
      
      return { success: false, error: '优化结果解析失败' };
    } catch (error) {
      console.error('[LLM] Optimize prompt error:', error);
      return { success: false, error: error instanceof Error ? error.message : '提示词优化失败' };
    }
  }

  /**
   * 分析提示词
   * @param prompt 提示词
   * @returns 分析结果
   */
  async analyzePrompt(prompt: string): Promise<{ 
    success: boolean; 
    score?: number; 
    presentElements?: string[]; 
    missingElements?: string[];
    suggestions?: string[];
    error?: string 
  }> {
    try {
      console.log('[LLM] Analyze prompt:', prompt);
      
      const response = await fetch('/api/qwen/prompt/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[LLM] Analyze prompt failed:', errorData);
        return { success: false, error: errorData.error || '提示词分析失败' };
      }

      const result = await response.json();
      
      if (result.ok && result.data) {
        return { 
          success: true, 
          score: result.data.score,
          presentElements: result.data.presentElements,
          missingElements: result.data.missingElements,
          suggestions: result.data.suggestions
        };
      }
      
      return { success: false, error: '分析结果解析失败' };
    } catch (error) {
      console.error('[LLM] Analyze prompt error:', error);
      return { success: false, error: error instanceof Error ? error.message : '提示词分析失败' };
    }
  }
}

// 导出LLM服务实例
export const llmService = new LLMService();
