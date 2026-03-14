/**
 * 用户行为分析服务
 * 使用千问(Qwen)API分析用户创作行为，生成个性化画像和建议
 */

import { supabaseAdmin } from '@/lib/supabase';
import { llmService } from './llmService';

// 行为类型定义
export type BehaviorType =
  // 脉络创作行为
  | 'mindmap_create'
  | 'mindmap_edit'
  | 'mindmap_delete'
  | 'node_create'
  | 'node_edit'
  | 'node_delete'
  | 'ai_suggestion_request'
  | 'ai_suggestion_apply'
  | 'story_generate'
  | 'brand_inspiration_use'
  | 'layout_change'
  | 'theme_change'
  | 'export'
  | 'import'
  // 作品行为
  | 'work_publish'
  | 'work_save'
  | 'work_share'
  | 'work_view'
  | 'work_download'
  // 社交互动行为
  | 'post_like'
  | 'post_unlike'
  | 'post_favorite'
  | 'post_unfavorite'
  | 'post_comment'
  | 'post_comment_delete'
  | 'post_share'
  | 'post_view'
  | 'user_follow'
  | 'user_unfollow'
  | 'work_like'
  | 'work_unlike'
  | 'work_favorite'
  | 'work_unfavorite'
  // 搜索行为
  | 'search'
  | 'search_click_result'
  | 'search_filter'
  // 浏览行为
  | 'page_view'
  | 'content_scroll'
  | 'content_click'
  // 创作行为
  | 'creation_start'
  | 'creation_complete'
  | 'creation_abandon'
  | 'ai_generation_request'
  | 'ai_generation_complete'
  // 活动参与行为
  | 'event_view'
  | 'event_participate'
  | 'event_submit_work'
  // 反馈行为
  | 'feedback_submit'
  | 'report_submit'
  | 'help_request'
  // 认证行为
  | 'user_login'
  | 'user_logout'
  | 'user_register'
  | 'profile_update'
  | 'password_change'
  // 签到行为
  | 'checkin'
  | 'checkin_streak'
  // 积分行为
  | 'points_earn'
  | 'points_redeem'
  // 模板行为
  | 'template_view'
  | 'template_use'
  | 'template_favorite'
  | 'template_unfavorite'
  // 游戏/活动行为
  | 'game_start'
  | 'game_complete'
  | 'game_score'
  // 聊天行为
  | 'chat_start'
  | 'chat_message_send'
  | 'chat_message_receive'
  // 通知行为
  | 'notification_receive'
  | 'notification_click'
  | 'notification_dismiss'
  // 分享行为
  | 'share_copy_link'
  | 'share_wechat'
  | 'share_weibo'
  | 'share_qq'
  // 设置行为
  | 'settings_update'
  | 'privacy_update'
  // 支付行为
  | 'payment_start'
  | 'payment_complete'
  | 'payment_cancel'
  // 会员行为
  | 'membership_view'
  | 'membership_upgrade'
  // 收藏夹行为
  | 'collection_create'
  | 'collection_delete'
  | 'collection_item_add'
  | 'collection_item_remove';

// 目标类型
export type TargetType =
  | 'mindmap'
  | 'node'
  | 'brand'
  | 'work'
  | 'story'
  | 'post'
  | 'user'
  | 'comment'
  | 'search_query'
  | 'page'
  | 'event'
  | 'template'
  | 'challenge'
  | 'cultural_element'
  | 'ai_feature';

// 行为日志数据
export interface BehaviorLogData {
  userId: string;
  behaviorType: BehaviorType;
  targetType?: TargetType;
  targetId?: string;
  targetTitle?: string;
  metadata?: Record<string, any>;
  sessionId?: string;
}

// AI分析结果
export interface AIAnalysisResult {
  tags: string[];
  insights: string;
  creativeStyle: string;
  preferences: {
    categories: string[];
    themes: string[];
    brands: string[];
  };
  suggestions: string[];
}

// 用户创作画像
export interface UserCreativeProfile {
  userId: string;
  preferredCategories: string[];
  preferredBrands: string[];
  preferredThemes: string[];
  totalMindmaps: number;
  totalNodes: number;
  totalAiSuggestions: number;
  totalStories: number;
  totalPublishedWorks: number;
  creativeStyleTags: string[];
  creativeStrengths: string[];
  creativeImprovements: string[];
  mostActiveHour?: number;
  mostActiveDay?: string;
  lastAnalyzedAt?: string;
}

/**
 * 记录用户行为
 */
export async function recordBehavior(data: BehaviorLogData): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('user_behavior_logs').insert({
      user_id: data.userId,
      behavior_type: data.behaviorType,
      target_type: data.targetType,
      target_id: data.targetId,
      target_title: data.targetTitle,
      metadata: data.metadata || {},
      session_id: data.sessionId || generateSessionId(),
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('记录行为失败:', error);
    }
  } catch (err) {
    console.error('记录行为异常:', err);
  }
}

/**
 * 批量记录用户行为
 */
export async function recordBehaviors(dataList: BehaviorLogData[]): Promise<void> {
  try {
    const records = dataList.map((data) => ({
      user_id: data.userId,
      behavior_type: data.behaviorType,
      target_type: data.targetType,
      target_id: data.targetId,
      target_title: data.targetTitle,
      metadata: data.metadata || {},
      session_id: data.sessionId || generateSessionId(),
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin.from('user_behavior_logs').insert(records);

    if (error) {
      console.error('批量记录行为失败:', error);
    }
  } catch (err) {
    console.error('批量记录行为异常:', err);
  }
}

/**
 * 使用千问API分析用户行为
 */
export async function analyzeUserBehavior(userId: string): Promise<AIAnalysisResult | null> {
  try {
    // 1. 获取用户最近的行为记录
    const { data: behaviors, error } = await supabaseAdmin
      .from('user_behavior_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !behaviors || behaviors.length === 0) {
      console.log('没有足够的行为数据进行分析');
      return null;
    }

    // 2. 获取用户创作数据
    const { data: mindmaps } = await supabaseAdmin
      .from('inspiration_mindmaps')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: nodes } = await supabaseAdmin
      .from('inspiration_nodes')
      .select('*')
      .in(
        'map_id',
        mindmaps?.map((m) => m.id) || []
      )
      .limit(50);

    // 3. 构建分析提示词
    const prompt = buildAnalysisPrompt(behaviors, mindmaps || [], nodes || []);

    // 4. 调用千问API进行分析
    const analysis = await callQwenForAnalysis(prompt);

    // 5. 保存分析结果
    await saveAnalysisResult(userId, analysis);

    return analysis;
  } catch (err) {
    console.error('分析用户行为失败:', err);
    return null;
  }
}

/**
 * 获取用户创作画像
 */
export async function getUserCreativeProfile(userId: string): Promise<UserCreativeProfile | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_creative_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 没有记录，创建默认画像
        return createDefaultProfile(userId);
      }
      console.error('获取用户画像失败:', error);
      return null;
    }

    return {
      userId: data.user_id,
      preferredCategories: data.preferred_categories || [],
      preferredBrands: data.preferred_brands || [],
      preferredThemes: data.preferred_themes || [],
      totalMindmaps: data.total_mindmaps || 0,
      totalNodes: data.total_nodes || 0,
      totalAiSuggestions: data.total_ai_suggestions || 0,
      totalStories: data.total_stories || 0,
      totalPublishedWorks: data.total_published_works || 0,
      creativeStyleTags: data.creative_style_tags || [],
      creativeStrengths: data.creative_strengths || [],
      creativeImprovements: data.creative_improvements || [],
      mostActiveHour: data.most_active_hour,
      mostActiveDay: data.most_active_day,
      lastAnalyzedAt: data.last_analyzed_at,
    };
  } catch (err) {
    console.error('获取用户画像异常:', err);
    return null;
  }
}

/**
 * 获取个性化创作建议
 */
export async function getPersonalizedSuggestions(userId: string): Promise<string[]> {
  try {
    const profile = await getUserCreativeProfile(userId);
    if (!profile) {
      return getDefaultSuggestions();
    }

    // 基于用户画像生成建议
    const suggestions: string[] = [];

    // 根据创作数量给出建议
    if (profile.totalMindmaps < 3) {
      suggestions.push('💡 尝试创建更多创作脉络，探索不同的主题和风格');
    }

    if (profile.totalNodes < 10) {
      suggestions.push('📝 在每个脉络中添加更多节点，丰富创作内容');
    }

    // 根据偏好类别给出建议
    if (profile.preferredCategories.length > 0) {
      const category = profile.preferredCategories[0];
      suggestions.push(`🎯 你擅长${category}类创作，可以尝试结合天津文化元素深化内容`);
    }

    // 根据使用AI的情况给出建议
    if (profile.totalAiSuggestions < 5) {
      suggestions.push('🤖 多使用AI创作助手，获取更多灵感和优化建议');
    }

    // 根据使用老字号的情况给出建议
    if (profile.preferredBrands.length === 0) {
      suggestions.push('🏮 尝试从天津老字号灵感库中提取元素，融入你的创作');
    }

    // 根据创作风格给出建议
    if (profile.creativeStyleTags.length > 0) {
      suggestions.push(`✨ 你的创作风格：${profile.creativeStyleTags.join('、')}，保持这种独特性`);
    }

    return suggestions.length > 0 ? suggestions : getDefaultSuggestions();
  } catch (err) {
    console.error('获取个性化建议失败:', err);
    return getDefaultSuggestions();
  }
}

/**
 * 获取用户行为统计
 */
export async function getUserBehaviorStats(userId: string, days: number = 7): Promise<{
  totalBehaviors: number;
  behaviorBreakdown: Record<string, number>;
  mostActiveDay: string;
  dailyAverage: number;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabaseAdmin
      .from('user_behavior_logs')
      .select('behavior_type, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error || !data) {
      return {
        totalBehaviors: 0,
        behaviorBreakdown: {},
        mostActiveDay: '-',
        dailyAverage: 0,
      };
    }

    // 统计行为类型
    const breakdown: Record<string, number> = {};
    const dailyCount: Record<string, number> = {};

    data.forEach((record) => {
      // 行为类型统计
      breakdown[record.behavior_type] = (breakdown[record.behavior_type] || 0) + 1;

      // 每日统计
      const date = new Date(record.created_at).toISOString().split('T')[0];
      dailyCount[date] = (dailyCount[date] || 0) + 1;
    });

    // 找出最活跃的一天
    let mostActiveDay = '-';
    let maxCount = 0;
    Object.entries(dailyCount).forEach(([date, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostActiveDay = date;
      }
    });

    return {
      totalBehaviors: data.length,
      behaviorBreakdown: breakdown,
      mostActiveDay,
      dailyAverage: Math.round((data.length / days) * 10) / 10,
    };
  } catch (err) {
    console.error('获取行为统计失败:', err);
    return {
      totalBehaviors: 0,
      behaviorBreakdown: {},
      mostActiveDay: '-',
      dailyAverage: 0,
    };
  }
}

// ============ 私有辅助函数 ============

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function buildAnalysisPrompt(
  behaviors: any[],
  mindmaps: any[],
  nodes: any[]
): string {
  const behaviorSummary = behaviors
    .map((b) => `- ${b.behavior_type}: ${b.target_title || '无标题'}`)
    .join('\n');

  const categoryStats: Record<string, number> = {};
  nodes.forEach((node) => {
    const cat = node.category || 'unknown';
    categoryStats[cat] = (categoryStats[cat] || 0) + 1;
  });

  return `请分析以下用户的创作行为数据，生成用户创作画像：

【行为记录】
${behaviorSummary}

【脉络统计】
- 脉络数量: ${mindmaps.length}
- 节点数量: ${nodes.length}
- 节点类别分布: ${JSON.stringify(categoryStats)}

请分析并返回JSON格式结果：
{
  "tags": ["标签1", "标签2", ...],
  "insights": "对用户创作行为的整体洞察",
  "creativeStyle": "创作风格描述",
  "preferences": {
    "categories": ["偏好的节点类别"],
    "themes": ["偏好的主题"],
    "brands": ["偏好的品牌"]
  },
  "suggestions": ["建议1", "建议2", ...]
}`;
}

async function callQwenForAnalysis(prompt: string): Promise<AIAnalysisResult> {
  try {
    const response = await llmService.complete({
      messages: [
        {
          role: 'system',
          content:
            '你是一位专业的用户行为分析师，擅长分析创作类应用的用户行为数据。请基于数据给出客观、有价值的分析结果。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // 解析JSON响应
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        tags: result.tags || [],
        insights: result.insights || '',
        creativeStyle: result.creativeStyle || '',
        preferences: result.preferences || { categories: [], themes: [], brands: [] },
        suggestions: result.suggestions || [],
      };
    }

    throw new Error('无法解析AI分析结果');
  } catch (err) {
    console.error('调用千问API失败:', err);
    return getDefaultAnalysisResult();
  }
}

async function saveAnalysisResult(userId: string, analysis: AIAnalysisResult): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('user_creative_profiles').upsert(
      {
        user_id: userId,
        creative_style_tags: analysis.tags,
        creative_strengths: analysis.suggestions.slice(0, 3),
        creative_improvements: analysis.suggestions.slice(3, 6),
        preferred_categories: analysis.preferences.categories,
        preferred_themes: analysis.preferences.themes,
        preferred_brands: analysis.preferences.brands,
        last_analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

    if (error) {
      console.error('保存分析结果失败:', error);
    }
  } catch (err) {
    console.error('保存分析结果异常:', err);
  }
}

function createDefaultProfile(userId: string): UserCreativeProfile {
  return {
    userId,
    preferredCategories: [],
    preferredBrands: [],
    preferredThemes: [],
    totalMindmaps: 0,
    totalNodes: 0,
    totalAiSuggestions: 0,
    totalStories: 0,
    totalPublishedWorks: 0,
    creativeStyleTags: ['新手创作者'],
    creativeStrengths: ['充满好奇心', '愿意尝试新事物'],
    creativeImprovements: ['多进行创作练习', '探索不同主题'],
  };
}

function getDefaultSuggestions(): string[] {
  return [
    '💡 开始你的第一个创作脉络，记录你的灵感',
    '📝 尝试添加不同类型的节点，丰富创作内容',
    '🏮 从天津老字号灵感库中提取元素，融入创作',
    '🤖 使用AI创作助手，获取更多灵感',
    '🎯 定期回顾和整理你的创作脉络',
  ];
}

function getDefaultAnalysisResult(): AIAnalysisResult {
  return {
    tags: ['新手', '探索中'],
    insights: '用户刚开始使用创作功能，需要更多引导和建议',
    creativeStyle: '探索型',
    preferences: {
      categories: [],
      themes: [],
      brands: [],
    },
    suggestions: getDefaultSuggestions(),
  };
}

// ============ 便捷的行为记录函数 ============

/**
 * 记录社交互动行为
 */
export async function recordSocialBehavior(
  userId: string,
  behaviorType: 'post_like' | 'post_unlike' | 'post_favorite' | 'post_unfavorite' | 'post_comment' | 'post_share' | 'user_follow' | 'user_unfollow',
  targetId: string,
  targetTitle?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const targetType: TargetType = behaviorType.startsWith('user_') ? 'user' : 'post';
  await recordBehavior({
    userId,
    behaviorType,
    targetType,
    targetId,
    targetTitle,
    metadata: {
      ...metadata,
      recordedAt: new Date().toISOString(),
    },
  });
}

/**
 * 记录作品互动行为
 */
export async function recordWorkInteraction(
  userId: string,
  behaviorType: 'work_like' | 'work_unlike' | 'work_favorite' | 'work_unfavorite' | 'work_view' | 'work_download' | 'work_share',
  workId: string,
  workTitle?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await recordBehavior({
    userId,
    behaviorType,
    targetType: 'work',
    targetId: workId,
    targetTitle: workTitle,
    metadata: {
      ...metadata,
      recordedAt: new Date().toISOString(),
    },
  });
}

/**
 * 记录搜索行为
 */
export async function recordSearchBehavior(
  userId: string,
  query: string,
  resultCount?: number,
  filters?: Record<string, any>,
  clickedResult?: { type: string; id: string; title?: string }
): Promise<void> {
  await recordBehavior({
    userId,
    behaviorType: clickedResult ? 'search_click_result' : 'search',
    targetType: 'search_query',
    targetId: `search_${Date.now()}`,
    targetTitle: query,
    metadata: {
      query,
      resultCount,
      filters,
      clickedResult,
      searchedAt: new Date().toISOString(),
    },
  });
}

/**
 * 记录页面浏览行为
 */
export async function recordPageView(
  userId: string,
  pagePath: string,
  pageTitle?: string,
  referrer?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await recordBehavior({
    userId,
    behaviorType: 'page_view',
    targetType: 'page',
    targetId: pagePath,
    targetTitle: pageTitle,
    metadata: {
      referrer,
      ...metadata,
      viewedAt: new Date().toISOString(),
    },
  });
}

/**
 * 记录创作行为
 */
export async function recordCreationBehavior(
  userId: string,
  behaviorType: 'creation_start' | 'creation_complete' | 'creation_abandon' | 'ai_generation_request' | 'ai_generation_complete',
  creationType: string,
  creationId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await recordBehavior({
    userId,
    behaviorType,
    targetType: 'work',
    targetId: creationId || `creation_${Date.now()}`,
    targetTitle: `${creationType}_${behaviorType}`,
    metadata: {
      creationType,
      ...metadata,
      recordedAt: new Date().toISOString(),
    },
  });
}

/**
 * 记录活动参与行为
 */
export async function recordEventParticipation(
  userId: string,
  behaviorType: 'event_view' | 'event_participate' | 'event_submit_work',
  eventId: string,
  eventTitle?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await recordBehavior({
    userId,
    behaviorType,
    targetType: 'event',
    targetId: eventId,
    targetTitle: eventTitle,
    metadata: {
      ...metadata,
      recordedAt: new Date().toISOString(),
    },
  });
}

/**
 * 记录内容点击行为
 */
export async function recordContentClick(
  userId: string,
  contentType: TargetType,
  contentId: string,
  contentTitle?: string,
  clickContext?: Record<string, any>
): Promise<void> {
  await recordBehavior({
    userId,
    behaviorType: 'content_click',
    targetType: contentType,
    targetId: contentId,
    targetTitle: contentTitle,
    metadata: {
      clickContext,
      clickedAt: new Date().toISOString(),
    },
  });
}

/**
 * 记录用户认证行为
 */
export async function recordAuthBehavior(
  userId: string,
  behaviorType: 'user_login' | 'user_logout' | 'user_register' | 'profile_update' | 'password_change',
  metadata?: Record<string, any>
): Promise<void> {
  await recordBehavior({
    userId,
    behaviorType,
    targetType: 'user',
    targetId: userId,
    metadata: {
      ...metadata,
      recordedAt: new Date().toISOString(),
    },
  });
}

/**
 * 记录签到行为
 */
export async function recordCheckin(
  userId: string,
  streakDays?: number,
  pointsEarned?: number
): Promise<void> {
  await recordBehavior({
    userId,
    behaviorType: 'checkin',
    targetType: 'user',
    targetId: userId,
    metadata: {
      streakDays,
      pointsEarned,
      checkedInAt: new Date().toISOString(),
    },
  });
}

/**
 * 记录积分行为
 */
export async function recordPointsBehavior(
  userId: string,
  behaviorType: 'points_earn' | 'points_redeem',
  points: number,
  source?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await recordBehavior({
    userId,
    behaviorType,
    targetType: 'user',
    targetId: userId,
    metadata: {
      points,
      source,
      ...metadata,
      recordedAt: new Date().toISOString(),
    },
  });
}

/**
 * 记录模板行为
 */
export async function recordTemplateBehavior(
  userId: string,
  behaviorType: 'template_view' | 'template_use' | 'template_favorite' | 'template_unfavorite',
  templateId: string,
  templateName?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await recordBehavior({
    userId,
    behaviorType,
    targetType: 'template',
    targetId: templateId,
    targetTitle: templateName,
    metadata: {
      ...metadata,
      recordedAt: new Date().toISOString(),
    },
  });
}

/**
 * 记录游戏行为
 */
export async function recordGameBehavior(
  userId: string,
  behaviorType: 'game_start' | 'game_complete' | 'game_score',
  gameId: string,
  gameName?: string,
  score?: number,
  metadata?: Record<string, any>
): Promise<void> {
  await recordBehavior({
    userId,
    behaviorType,
    targetType: 'challenge',
    targetId: gameId,
    targetTitle: gameName,
    metadata: {
      score,
      ...metadata,
      recordedAt: new Date().toISOString(),
    },
  });
}

/**
 * 记录聊天行为
 */
export async function recordChatBehavior(
  userId: string,
  behaviorType: 'chat_start' | 'chat_message_send' | 'chat_message_receive',
  chatId: string,
  receiverId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await recordBehavior({
    userId,
    behaviorType,
    targetType: 'user',
    targetId: chatId,
    metadata: {
      receiverId,
      ...metadata,
      recordedAt: new Date().toISOString(),
    },
  });
}

/**
 * 记录通知行为
 */
export async function recordNotificationBehavior(
  userId: string,
  behaviorType: 'notification_receive' | 'notification_click' | 'notification_dismiss',
  notificationId: string,
  notificationType?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await recordBehavior({
    userId,
    behaviorType,
    targetType: 'user',
    targetId: notificationId,
    metadata: {
      notificationType,
      ...metadata,
      recordedAt: new Date().toISOString(),
    },
  });
}

/**
 * 记录分享行为
 */
export async function recordShareBehavior(
  userId: string,
  behaviorType: 'share_copy_link' | 'share_wechat' | 'share_weibo' | 'share_qq' | 'work_share' | 'post_share',
  contentId: string,
  contentType?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await recordBehavior({
    userId,
    behaviorType,
    targetType: contentType as TargetType || 'work',
    targetId: contentId,
    metadata: {
      ...metadata,
      recordedAt: new Date().toISOString(),
    },
  });
}

/**
 * 记录设置行为
 */
export async function recordSettingsBehavior(
  userId: string,
  behaviorType: 'settings_update' | 'privacy_update',
  settingsKey?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await recordBehavior({
    userId,
    behaviorType,
    targetType: 'user',
    targetId: userId,
    targetTitle: settingsKey,
    metadata: {
      ...metadata,
      recordedAt: new Date().toISOString(),
    },
  });
}

/**
 * 记录支付行为
 */
export async function recordPaymentBehavior(
  userId: string,
  behaviorType: 'payment_start' | 'payment_complete' | 'payment_cancel',
  orderId: string,
  amount?: number,
  metadata?: Record<string, any>
): Promise<void> {
  await recordBehavior({
    userId,
    behaviorType,
    targetType: 'user',
    targetId: orderId,
    metadata: {
      amount,
      ...metadata,
      recordedAt: new Date().toISOString(),
    },
  });
}

/**
 * 记录会员行为
 */
export async function recordMembershipBehavior(
  userId: string,
  behaviorType: 'membership_view' | 'membership_upgrade',
  membershipType?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await recordBehavior({
    userId,
    behaviorType,
    targetType: 'user',
    targetId: userId,
    targetTitle: membershipType,
    metadata: {
      ...metadata,
      recordedAt: new Date().toISOString(),
    },
  });
}

/**
 * 记录收藏夹行为
 */
export async function recordCollectionBehavior(
  userId: string,
  behaviorType: 'collection_create' | 'collection_delete' | 'collection_item_add' | 'collection_item_remove',
  collectionId: string,
  itemId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await recordBehavior({
    userId,
    behaviorType,
    targetType: 'user',
    targetId: collectionId,
    metadata: {
      itemId,
      ...metadata,
      recordedAt: new Date().toISOString(),
    },
  });
}

// 导出服务实例
export const behaviorAnalysisService = {
  recordBehavior,
  recordBehaviors,
  recordSocialBehavior,
  recordWorkInteraction,
  recordSearchBehavior,
  recordPageView,
  recordCreationBehavior,
  recordEventParticipation,
  recordContentClick,
  recordAuthBehavior,
  recordCheckin,
  recordPointsBehavior,
  recordTemplateBehavior,
  recordGameBehavior,
  recordChatBehavior,
  recordNotificationBehavior,
  recordShareBehavior,
  recordSettingsBehavior,
  recordPaymentBehavior,
  recordMembershipBehavior,
  recordCollectionBehavior,
  analyzeUserBehavior,
  getUserCreativeProfile,
  getPersonalizedSuggestions,
  getUserBehaviorStats,
};

export default behaviorAnalysisService;
