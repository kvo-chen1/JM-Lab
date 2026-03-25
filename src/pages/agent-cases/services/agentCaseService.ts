// Agent案例API服务

import { supabase } from '@/lib/supabaseClient';
import {
  AgentCase,
  CaseDetail,
  GetCasesParams,
  GetCasesResponse,
  PublishCaseRequest,
  CreateSimilarResponse,
  ConversationMessage,
} from '../types';

/**
 * 获取案例列表
 */
export async function getAgentCases(params: GetCasesParams): Promise<GetCasesResponse> {
  const { page, limit, sort = 'newest', tag, search, source } = params;

  let query = supabase
    .from('agent_cases')
    .select('*', { count: 'exact' });

  // 筛选来源（agent 或 skill）
  if (source) {
    query = query.eq('source', source);
  }

  // 筛选标签
  if (tag) {
    query = query.contains('tags', [tag]);
  }

  // 搜索标题
  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  // 排序
  if (sort === 'popular') {
    query = query.order('likes', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // 分页
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('获取案例列表失败:', error);
    throw new Error('获取案例列表失败');
  }

  // 转换数据格式
  const cases: AgentCase[] = (data || []).map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    coverImage: item.cover_image,
    images: item.images || [],
    author: item.author,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    likes: item.likes || 0,
    views: item.views || 0,
    tags: item.tags || [],
    conversationId: item.conversation_id,
    isLiked: item.is_liked || false,
    source: item.source || 'agent',
  }));

  return {
    cases,
    total: count || 0,
    hasMore: (page * limit) < (count || 0),
  };
}

/**
 * 获取案例详情
 */
export async function getCaseDetail(id: string): Promise<CaseDetail> {
  // 获取案例基本信息
  const { data: caseData, error: caseError } = await supabase
    .from('agent_cases')
    .select('*')
    .eq('id', id)
    .single();

  if (caseError || !caseData) {
    console.error('获取案例详情失败:', caseError);
    throw new Error('获取案例详情失败');
  }

  // 获取对话历史
  const { data: conversationData, error: conversationError } = await supabase
    .from('case_conversations')
    .select('*')
    .eq('case_id', id)
    .order('timestamp', { ascending: true });

  if (conversationError) {
    console.error('获取对话历史失败:', conversationError);
  }

  // 增加浏览量
  await supabase
    .from('agent_cases')
    .update({ views: (caseData.views || 0) + 1 })
    .eq('id', id);

  return {
    id: caseData.id,
    title: caseData.title,
    description: caseData.description,
    coverImage: caseData.cover_image,
    images: caseData.images || [],
    author: caseData.author,
    createdAt: caseData.created_at,
    updatedAt: caseData.updated_at,
    likes: caseData.likes || 0,
    views: (caseData.views || 0) + 1,
    tags: caseData.tags || [],
    conversationId: caseData.conversation_id,
    isLiked: caseData.is_liked || false,
    conversation: (conversationData || []).map((msg: any): ConversationMessage => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      type: msg.type || 'text',
      timestamp: msg.timestamp,
      metadata: msg.metadata || {},
    })),
  };
}

/**
 * 从 localStorage 获取当前用户
 */
function getCurrentUserFromStorage(): { id: string; name: string; avatar: string } | null {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        id: user.id || '',
        name: user.username || user.name || '匿名用户',
        avatar: user.avatar_url || user.avatar || '',
      };
    }
  } catch (e) {
    console.error('解析用户信息失败:', e);
  }
  return null;
}

/**
 * 发布案例
 */
export async function publishCase(request: PublishCaseRequest): Promise<AgentCase> {
  // 方式1: 从 localStorage 获取用户（项目使用的方式）
  let currentUser = getCurrentUserFromStorage();
  console.log('[publishCase] User from localStorage:', currentUser?.id);
  
  // 方式2: 如果localStorage没有，尝试 Supabase 会话
  if (!currentUser?.id) {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (user) {
      currentUser = {
        id: user.id,
        name: user.user_metadata?.username || user.email?.split('@')[0] || '匿名用户',
        avatar: user.user_metadata?.avatar_url || '',
      };
    }
  }
  
  if (!currentUser?.id) {
    throw new Error('请先登录');
  }

  // 用户信息已从 localStorage 获取，无需再次查询

  const caseData = {
    title: request.title,
    description: request.description,
    cover_image: request.coverImage,
    images: request.images.map((url, index) => ({
      id: `${Date.now()}_${index}`,
      url,
      thumbnailUrl: url,
      order: index,
    })),
    author: {
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
    },
    conversation_id: request.conversationId,
    tags: request.tags,
    likes: 0,
    views: 0,
    is_liked: false,
    source: request.source || 'agent',
  };

  // 插入案例数据
  const { data, error } = await supabase
    .from('agent_cases')
    .insert(caseData)
    .select()
    .single();

  // 如果有对话历史，同时插入对话记录
  console.log('[publishCase] 对话历史数量:', request.conversation?.length);
  if (request.conversation && request.conversation.length > 0 && data) {
    const conversationData = request.conversation.map((msg) => ({
      case_id: data.id,
      role: msg.role,
      content: msg.content,
      type: msg.type,
      timestamp: msg.timestamp,
      metadata: msg.metadata || {},
    }));
    
    console.log('[publishCase] 准备插入对话:', conversationData.length, '条');

    const { error: convError } = await supabase
      .from('case_conversations')
      .insert(conversationData);

    if (convError) {
      console.error('插入对话历史失败:', convError);
    } else {
      console.log('[publishCase] 对话历史插入成功');
    }
  }

  if (error) {
    console.error('发布案例失败:', error);
    throw new Error('发布案例失败');
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    coverImage: data.cover_image,
    images: data.images || [],
    author: data.author,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    likes: data.likes || 0,
    views: data.views || 0,
    tags: data.tags || [],
    conversationId: data.conversation_id,
    isLiked: false,
  };
}

/**
 * 点赞/取消点赞案例
 */
export async function toggleLikeCase(id: string, isLiked: boolean): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('请先登录');
  }

  if (isLiked) {
    // 取消点赞
    await supabase
      .from('case_likes')
      .delete()
      .eq('case_id', id)
      .eq('user_id', userData.user.id);

    await supabase.rpc('decrement_case_likes', { case_id: id });
  } else {
    // 添加点赞
    await supabase
      .from('case_likes')
      .insert({
        case_id: id,
        user_id: userData.user.id,
      });

    await supabase.rpc('increment_case_likes', { case_id: id });
  }
}

/**
 * 创建同款
 */
export async function createSimilarCase(id: string): Promise<CreateSimilarResponse> {
  const { data: caseData, error } = await supabase
    .from('agent_cases')
    .select('title, description, images, conversation_id')
    .eq('id', id)
    .single();

  if (error || !caseData) {
    console.error('获取案例信息失败:', error);
    throw new Error('获取案例信息失败');
  }

  // 获取第一条用户消息作为提示词
  const { data: conversationData } = await supabase
    .from('case_conversations')
    .select('content')
    .eq('case_id', id)
    .eq('role', 'user')
    .order('timestamp', { ascending: true })
    .limit(1)
    .single();

  const prompt = conversationData?.content || caseData.description || caseData.title;

  return {
    redirectUrl: `/agent?case=${id}&mode=similar`,
    prefillData: {
      prompt: `参考以下设计，创作类似风格的作品：\n${prompt}`,
      referenceImages: caseData.images?.map((img: any) => img.url) || [],
      originalCaseId: id,
    },
  };
}

/**
 * 获取热门标签
 */
export async function getPopularTags(limit: number = 10): Promise<string[]> {
  const { data, error } = await supabase
    .rpc('get_popular_case_tags', { limit_count: limit });

  if (error) {
    console.error('获取热门标签失败:', error);
    return [];
  }

  // 数据格式为 {tag: string, count: number}[]，提取tag字段
  return (data || []).map((item: any) => item.tag);
}

/**
 * 检查用户是否点赞过案例
 */
export async function checkIsLiked(caseId: string): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    return false;
  }

  const { data } = await supabase
    .from('case_likes')
    .select('id')
    .eq('case_id', caseId)
    .eq('user_id', userData.user.id)
    .single();

  return !!data;
}
