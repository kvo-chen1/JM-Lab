/**
 * 用户行为分析服务
 * 使用千问(Qwen)API分析用户创作行为，生成个性化画像和建议
 */

import { supabase, supabaseAdmin } from '@/lib/supabase';
import { llmService } from './llmService';

// 行为类型定义
export type BehaviorType =
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
  | 'work_publish'
  | 'work_save'
  | 'work_share'
  | 'layout_change'
  | 'theme_change'
  | 'export'
  | 'import';

// 目标类型
export type TargetType = 'mindmap' | 'node' | 'brand' | 'work' | 'story';

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

// 导出服务实例
export const behaviorAnalysisService = {
  recordBehavior,
  recordBehaviors,
  analyzeUserBehavior,
  getUserCreativeProfile,
  getPersonalizedSuggestions,
  getUserBehaviorStats,
};

export default behaviorAnalysisService;
