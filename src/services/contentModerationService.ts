import { supabase, supabaseAdmin } from '@/lib/supabase';

// 审核结果类型
export interface ModerationResult {
  approved: boolean;
  action: 'approve' | 'reject' | 'flag';
  reason: string | null;
  matchedWords: string[];
  scores: {
    spam_score: number;
    ai_risk_score: number;
    authenticity_score: number;
    max_severity: number;
  };
}

// 审核规则类型
export interface ModerationRule {
  id: string;
  name: string;
  rule_type: 'sensitive_words' | 'spam_detection' | 'ai_generated' | 'cultural_authenticity';
  enabled: boolean;
  threshold: number;
  auto_action: 'none' | 'flag' | 'reject';
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// 违禁词类型
export interface ForbiddenWord {
  id: string;
  word: string;
  category: string;
  severity: number;
  is_regex: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 审核日志类型
export interface ModerationLog {
  id: string;
  content_id: string;
  content_type: 'work' | 'post' | 'comment' | 'activity';
  user_id: string | null;
  action: 'auto_approved' | 'auto_rejected' | 'manual_approved' | 'manual_rejected' | 'flagged';
  reason: string | null;
  scores: {
    spam_score: number;
    ai_risk_score: number;
    authenticity_score: number;
    max_severity: number;
  };
  matched_words: string[];
  created_at: string;
}

/**
 * 内容审核服务
 * 提供自动内容审核功能
 */
export const contentModerationService = {
  /**
   * 审核内容
   * @param contentId 内容ID
   * @param contentType 内容类型
   * @param title 标题
   * @param description 描述
   * @param userId 用户ID（可选）
   * @returns 审核结果
   */
  async moderateContent(
    contentId: string,
    contentType: 'work' | 'post' | 'comment' | 'activity',
    title: string,
    description?: string,
    userId?: string
  ): Promise<ModerationResult> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('moderate_content', {
          p_content_id: contentId,
          p_content_type: contentType,
          p_title: title,
          p_description: description || '',
          p_user_id: userId || null
        });

      if (error) {
        console.error('内容审核失败:', error);
        // 如果审核失败，默认允许发布（fail-safe）
        return {
          approved: true,
          action: 'approve',
          reason: null,
          matchedWords: [],
          scores: {
            spam_score: 0,
            ai_risk_score: 0,
            authenticity_score: 0,
            max_severity: 0
          }
        };
      }

      const result = data[0];
      return {
        approved: result.approved,
        action: result.action as 'approve' | 'reject' | 'flag',
        reason: result.reason,
        matchedWords: result.matched_words || [],
        scores: result.scores as ModerationResult['scores']
      };
    } catch (err) {
      console.error('内容审核异常:', err);
      // 异常时默认允许发布
      return {
        approved: true,
        action: 'approve',
        reason: null,
        matchedWords: [],
        scores: {
          spam_score: 0,
          ai_risk_score: 0,
          authenticity_score: 0,
          max_severity: 0
        }
      };
    }
  },

  /**
   * 快速检查内容是否包含违禁词（客户端预检）
   * @param text 要检查的文本
   * @returns 是否包含违禁词
   */
  async checkForbiddenWords(text: string): Promise<{ hasForbidden: boolean; words: string[] }> {
    try {
      const { data, error } = await supabase
        .from('forbidden_words')
        .select('word, is_regex')
        .eq('is_active', true);

      if (error || !data) {
        return { hasForbidden: false, words: [] };
      }

      const matchedWords: string[] = [];
      const lowerText = text.toLowerCase();

      for (const item of data) {
        if (item.is_regex) {
          try {
            const regex = new RegExp(item.word, 'i');
            if (regex.test(text)) {
              matchedWords.push(item.word);
            }
          } catch {
            // 正则表达式错误，忽略
          }
        } else {
          if (lowerText.includes(item.word.toLowerCase())) {
            matchedWords.push(item.word);
          }
        }
      }

      return {
        hasForbidden: matchedWords.length > 0,
        words: matchedWords
      };
    } catch (err) {
      console.error('违禁词检查失败:', err);
      return { hasForbidden: false, words: [] };
    }
  },

  /**
   * 获取审核规则列表
   */
  async getModerationRules(): Promise<ModerationRule[]> {
    const { data, error } = await supabase
      .from('moderation_rules')
      .select('*')
      .order('rule_type');

    if (error) {
      console.error('获取审核规则失败:', error);
      return [];
    }

    return data || [];
  },

  /**
   * 更新审核规则
   */
  async updateModerationRule(
    ruleId: string,
    updates: Partial<ModerationRule>
  ): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('moderation_rules')
      .update(updates)
      .eq('id', ruleId);

    if (error) {
      console.error('更新审核规则失败:', error);
      return false;
    }

    return true;
  },

  /**
   * 获取违禁词列表
   */
  async getForbiddenWords(category?: string): Promise<ForbiddenWord[]> {
    let query = supabase
      .from('forbidden_words')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('获取违禁词失败:', error);
      return [];
    }

    return data || [];
  },

  /**
   * 添加违禁词
   */
  async addForbiddenWord(word: Partial<ForbiddenWord>): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('forbidden_words')
      .insert(word);

    if (error) {
      console.error('添加违禁词失败:', error);
      return false;
    }

    return true;
  },

  /**
   * 删除违禁词
   */
  async deleteForbiddenWord(wordId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('forbidden_words')
      .delete()
      .eq('id', wordId);

    if (error) {
      console.error('删除违禁词失败:', error);
      return false;
    }

    return true;
  },

  /**
   * 获取审核日志
   */
  async getModerationLogs(options?: {
    contentType?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: ModerationLog[]; total: number }> {
    let query = supabaseAdmin
      .from('moderation_logs')
      .select('*', { count: 'exact' });

    if (options?.contentType) {
      query = query.eq('content_type', options.contentType);
    }

    if (options?.action) {
      query = query.eq('action', options.action);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(
        options?.offset || 0,
        (options?.offset || 0) + (options?.limit || 50) - 1
      );

    const { data, error, count } = await query;

    if (error) {
      console.error('获取审核日志失败:', error);
      return { logs: [], total: 0 };
    }

    return {
      logs: data || [],
      total: count || 0
    };
  },

  /**
   * 获取内容审核统计
   */
  async getModerationStats(): Promise<{
    total: number;
    autoApproved: number;
    autoRejected: number;
    flagged: number;
    today: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabaseAdmin
        .from('moderation_logs')
        .select('action, created_at');

      if (error || !data) {
        return {
          total: 0,
          autoApproved: 0,
          autoRejected: 0,
          flagged: 0,
          today: 0
        };
      }

      const stats = {
        total: data.length,
        autoApproved: data.filter(l => l.action === 'auto_approved').length,
        autoRejected: data.filter(l => l.action === 'auto_rejected').length,
        flagged: data.filter(l => l.action === 'flagged').length,
        today: data.filter(l => new Date(l.created_at) >= today).length
      };

      return stats;
    } catch (err) {
      console.error('获取审核统计失败:', err);
      return {
        total: 0,
        autoApproved: 0,
        autoRejected: 0,
        flagged: 0,
        today: 0
      };
    }
  }
};

export default contentModerationService;
