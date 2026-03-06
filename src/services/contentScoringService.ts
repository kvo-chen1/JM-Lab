/**
 * 内容评分服务 - 用于计算和更新作品的真实性、AI风险、垃圾内容评分
 */

import { supabase, supabaseAdmin } from '@/lib/supabase';

export interface ContentScores {
  authenticity_score: number;
  ai_risk_score: number;
  spam_score: number;
  cultural_elements: string[];
}

export interface ScoringResult {
  success: boolean;
  scores?: ContentScores;
  error?: string;
}

class ContentScoringService {
  /**
   * 计算内容评分（前端算法版本）
   * 用于实时预览评分，不保存到数据库
   */
  calculateScores(content: string, title?: string, description?: string): ContentScores {
    const fullText = `${title || ''} ${description || ''} ${content || ''}`.trim();
    
    return {
      authenticity_score: this.calculateAuthenticityScore(fullText),
      ai_risk_score: this.calculateAIRiskScore(fullText),
      spam_score: this.calculateSpamScore(fullText),
      cultural_elements: this.detectCulturalElements(fullText)
    };
  }

  /**
   * 计算真实性评分
   */
  private calculateAuthenticityScore(text: string): number {
    let score = 0;
    const lowerText = text.toLowerCase();
    
    // 传统文化关键词 (+25)
    const traditionalArts = ['京剧', '昆曲', '书法', '国画', '剪纸', '刺绣', '陶瓷', '丝绸', '茶道', '中医', '武术', '太极', '春节', '中秋', '端午', '清明'];
    if (traditionalArts.some(word => lowerText.includes(word))) {
      score += 25;
    }
    
    // 历史文化关键词 (+25)
    const historicalSites = ['故宫', '长城', '兵马俑', '敦煌', '丝绸之路', '大运河', '颐和园', '天坛', '孔庙'];
    if (historicalSites.some(word => lowerText.includes(word))) {
      score += 25;
    }
    
    // 民俗文化关键词 (+20)
    const folkCulture = ['龙舟', '舞狮', '舞龙', '花灯', '庙会', '年画', '皮影', '木偶戏', '杂技'];
    if (folkCulture.some(word => lowerText.includes(word))) {
      score += 20;
    }
    
    // 地方特色关键词 (+15)
    const localCulture = ['天津', '北京', '上海', '广州', '成都', '西安', '杭州', '苏州', '南京'];
    if (localCulture.some(word => lowerText.includes(word))) {
      score += 15;
    }
    
    // 手工艺关键词 (+15)
    const craftsmanship = ['手工', '工艺', '匠心', '传承', '非遗', '民间艺术', '传统技艺'];
    if (craftsmanship.some(word => lowerText.includes(word))) {
      score += 15;
    }
    
    // 内容长度加分 (+10)
    if (text.length > 200) {
      score += 10;
    }
    
    // 有作品描述加分 (+10)
    const workKeywords = ['图', '图片', '视频', '作品', '设计', '创作'];
    if (workKeywords.some(word => lowerText.includes(word))) {
      score += 10;
    }
    
    return Math.min(score, 100);
  }

  /**
   * 计算 AI 生成风险评分
   */
  private calculateAIRiskScore(text: string): number {
    let score = 0;
    
    // 检查过于完美的格式
    const hasPerfectStructure = /^[\u4e00-\u9fa5]+[，。！？]/.test(text) && 
                                (text.match(/[，。！？]/g) || []).length > text.length / 20;
    if (hasPerfectStructure) score += 20;
    
    // 检查重复模式
    const sentences = text.split(/[。！？]/).filter(s => s.trim());
    const uniqueSentences = new Set(sentences);
    if (sentences.length > 3 && uniqueSentences.size / sentences.length < 0.7) {
      score += 25;
    }
    
    // 检查过于通用的表达
    const genericPatterns = ['众所周知', '不言而喻', '总而言之', '综上所述', '首先', '其次', '最后'];
    genericPatterns.forEach(pattern => {
      if (text.includes(pattern)) score += 5;
    });
    
    // 检查情感词汇密度（AI生成内容往往情感词汇较少）
    const emotionalWords = ['喜欢', '讨厌', '开心', '难过', '激动', '失望', '热爱', '痛恨'];
    const emotionalCount = emotionalWords.reduce((count, word) => 
      count + (text.includes(word) ? 1 : 0), 0);
    if (emotionalCount < 2 && text.length > 100) score += 15;
    
    return Math.min(score, 100);
  }

  /**
   * 计算垃圾内容评分
   */
  private calculateSpamScore(text: string): number {
    let score = 0;
    const lowerText = text.toLowerCase();
    
    // 检查敏感词
    const sensitiveWords = ['暴力', '色情', '赌博', '毒品', '诈骗', '反动', '违禁'];
    sensitiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 40;
    });
    
    // 检查重复字符
    if (/(.){4,}/.test(text)) score += 20;
    
    // 检查链接数量
    const linkCount = (text.match(/http/g) || []).length;
    if (linkCount > 3) score += 15;
    
    // 检查全大写比例
    const upperCaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (upperCaseRatio > 0.5) score += 10;
    
    // 检查内容长度（过短的内容可能是垃圾）
    if (text.length < 20) score += 25;
    
    // 检查特殊字符比例
    const specialCharRatio = (text.match(/[^\w\s\u4e00-\u9fa5]/g) || []).length / text.length;
    if (specialCharRatio > 0.3) score += 15;
    
    return Math.min(score, 100);
  }

  /**
   * 检测文化元素
   */
  private detectCulturalElements(text: string): string[] {
    const elements: string[] = [];
    const lowerText = text.toLowerCase();
    
    // 传统文化
    const traditionalArts = ['京剧', '昆曲', '书法', '国画', '剪纸', '刺绣', '陶瓷', '丝绸', '茶道', '中医', '武术', '太极', '春节', '中秋', '端午', '清明'];
    if (traditionalArts.some(word => lowerText.includes(word))) {
      elements.push('传统艺术');
    }
    
    // 历史文化
    const historicalSites = ['故宫', '长城', '兵马俑', '敦煌', '丝绸之路', '大运河', '颐和园', '天坛', '孔庙'];
    if (historicalSites.some(word => lowerText.includes(word))) {
      elements.push('历史遗迹');
    }
    
    // 民俗文化
    const folkCulture = ['龙舟', '舞狮', '舞龙', '花灯', '庙会', '年画', '皮影', '木偶戏', '杂技'];
    if (folkCulture.some(word => lowerText.includes(word))) {
      elements.push('民俗文化');
    }
    
    // 地方文化
    const localCulture = ['天津', '北京', '上海', '广州', '成都', '西安', '杭州', '苏州', '南京'];
    if (localCulture.some(word => lowerText.includes(word))) {
      elements.push('地方文化');
    }
    
    // 手工艺
    const craftsmanship = ['手工', '工艺', '匠心', '传承', '非遗', '民间艺术', '传统技艺'];
    if (craftsmanship.some(word => lowerText.includes(word))) {
      elements.push('手工艺');
    }
    
    return [...new Set(elements)]; // 去重
  }

  /**
   * 更新作品评分（调用数据库 RPC）
   * 这是主要的方法，用于保存评分到数据库
   */
  async updateWorkScores(workId: string): Promise<ScoringResult> {
    try {
      // 调用数据库 RPC 函数计算并更新评分
      const { data, error } = await supabaseAdmin
        .rpc('update_work_scores', { p_work_id: workId });

      if (error) {
        console.error('更新作品评分失败:', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: '作品不存在或更新失败' };
      }

      // 获取更新后的评分
      const { data: workData, error: fetchError } = await supabaseAdmin
        .from('works')
        .select('authenticity_score, ai_risk_score, spam_score, cultural_elements')
        .eq('id', workId)
        .single();

      if (fetchError) {
        return { success: true }; // 更新成功但获取数据失败
      }

      return {
        success: true,
        scores: {
          authenticity_score: workData.authenticity_score || 0,
          ai_risk_score: workData.ai_risk_score || 0,
          spam_score: workData.spam_score || 0,
          cultural_elements: workData.cultural_elements || []
        }
      };
    } catch (error) {
      console.error('更新作品评分异常:', error);
      return { success: false, error: '更新评分时发生错误' };
    }
  }

  /**
   * 批量更新多个作品的评分
   */
  async batchUpdateScores(workIds: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const workId of workIds) {
      const result = await this.updateWorkScores(workId);
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * 获取作品的评分
   */
  async getWorkScores(workId: string): Promise<ContentScores | null> {
    try {
      const { data, error } = await supabase
        .from('works')
        .select('authenticity_score, ai_risk_score, spam_score, cultural_elements')
        .eq('id', workId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        authenticity_score: data.authenticity_score || 0,
        ai_risk_score: data.ai_risk_score || 0,
        spam_score: data.spam_score || 0,
        cultural_elements: data.cultural_elements || []
      };
    } catch (error) {
      console.error('获取作品评分失败:', error);
      return null;
    }
  }

  /**
   * 重新计算所有作品的评分（用于后台管理）
   */
  async recalculateAllScores(): Promise<{ total: number; success: number; failed: number }> {
    try {
      // 获取所有作品ID
      const { data: works, error } = await supabaseAdmin
        .from('works')
        .select('id');

      if (error || !works) {
        return { total: 0, success: 0, failed: 0 };
      }

      const workIds = works.map(w => w.id);
      const result = await this.batchUpdateScores(workIds);

      return {
        total: workIds.length,
        success: result.success,
        failed: result.failed
      };
    } catch (error) {
      console.error('重新计算所有评分失败:', error);
      return { total: 0, success: 0, failed: 0 };
    }
  }
}

export const contentScoringService = new ContentScoringService();
