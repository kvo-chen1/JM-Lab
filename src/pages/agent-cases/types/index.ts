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
  type: 'text' | 'image' | 'analysis' | 'thinking';
  timestamp: string;
  metadata?: {
    imageUrl?: string;
    analysis?: string;
    thinking?: string;
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
export type CasesTab = 'cases' | 'inspiration';
