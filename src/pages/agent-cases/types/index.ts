// Agent案例模块类型定义

/**
 * 案例作者信息
 */
export interface CaseAuthor {
  id: string;
  name: string;
  avatar: string;
}

/**
 * 案例图片
 */
export interface CaseImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  prompt?: string;
  order: number;
}

/**
 * 对话消息
 */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image' | 'analysis' | 'thinking' | 'style-options' | 'design-type-options' | 'satisfaction-check' | 'derivative-options' | 'delegation' | 'collaboration' | 'workflow';
  timestamp: string;
  metadata?: {
    // 图片相关
    imageUrl?: string;
    images?: string[];
    // 分析内容
    analysis?: string;
    // 思考过程
    thinking?: string;
    // Agent 类型
    agentType?: string;
    designType?: string;
    // 风格选项
    styles?: Array<{
      id: string;
      name: string;
      thumbnail?: string;
      description?: string;
    }>;
    // 设计类型选项
    designTypeOptions?: Array<{
      id: string;
      label: string;
      description?: string;
      icon?: string;
    }>;
    // 满意度检查
    showSatisfactionCheck?: boolean;
    // 衍生选项
    derivativeOptions?: Array<{
      id: string;
      title: string;
      description?: string;
      icon?: string;
      type?: string;
    }>;
    // 快速操作
    quickActions?: Array<{
      label: string;
      action: string;
      description?: string;
    }>;
    // 委派信息
    delegationInfo?: {
      fromAgent: string;
      toAgent: string;
      taskDescription: string;
      reasoning?: string;
    };
    // 协作信息
    collaborationInfo?: {
      participatingAgents: string[];
      taskDescription: string;
      progress: number;
    };
    // 工作流
    workflow?: {
      id: string;
      name: string;
      steps: any[];
      estimatedDuration?: string;
      currentStepIndex?: number;
    };
    // 其他
    prompt?: string;
    showDesignTypeSelector?: boolean;
    showThinkingProcess?: boolean;
    isGenerating?: boolean;
  };
}

/**
 * Agent案例基础信息
 */
export interface AgentCase {
  id: string;
  title: string;
  description?: string;
  coverImage: string;
  images: CaseImage[];
  author: CaseAuthor;
  createdAt: string;
  updatedAt: string;
  likes: number;
  views: number;
  tags: string[];
  conversationId: string;
  isLiked?: boolean;
  source?: 'agent' | 'skill'; // 案例来源：agent 或 skill
}

/**
 * 案例详情
 */
export interface CaseDetail extends AgentCase {
  conversation: ConversationMessage[];
  relatedCases?: AgentCase[];
}

/**
 * 案例筛选条件
 */
export interface CaseFilter {
  sort: 'newest' | 'popular';
  tag?: string;
  search?: string;
}

/**
 * 案例列表查询参数
 */
export interface GetCasesParams {
  page: number;
  limit: number;
  sort?: 'newest' | 'popular';
  tag?: string;
  search?: string;
  source?: 'agent' | 'skill';
}

/**
 * 案例列表响应
 */
export interface GetCasesResponse {
  cases: AgentCase[];
  total: number;
  hasMore: boolean;
}

/**
 * 发布案例请求
 */
export interface PublishCaseRequest {
  title: string;
  description?: string;
  coverImage: string;
  images: string[];
  conversationId: string;
  tags: string[];
  conversation?: ConversationMessage[]; // 可选的对话历史
  source?: 'agent' | 'skill'; // 案例来源
}

/**
 * 创建同款响应
 */
export interface CreateSimilarResponse {
  redirectUrl: string;
  prefillData: {
    prompt: string;
    style?: string;
    referenceImages?: string[];
    originalCaseId: string;
  };
}

/**
 * Tab类型
 */
export type CasesTab = 'all' | 'agent' | 'skill';
