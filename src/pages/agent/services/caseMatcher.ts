// 案例匹配服务 - 为用户推荐相似的成功案例

import { Suggestion, SuggestionType } from '../types/suggestion';
import { supabase } from '@/lib/supabase';

// 案例信息
export interface DesignCase {
  id: string;
  title: string;
  description: string;
  prompt: string;
  style: string;
  tags: string[];
  thumbnail?: string;
  author?: string;
  likes: number;
  views: number;
  createdAt: number;
  similarity?: number; // 相似度分数
}

// 匹配结果
export interface MatchResult {
  cases: DesignCase[];
  matchReason: string;
  confidence: number;
}

// 热门案例库（本地缓存）
const POPULAR_CASES: DesignCase[] = [
  {
    id: 'case-001',
    title: '治愈系森林精灵',
    description: '温馨可爱的森林精灵形象，适合儿童品牌',
    prompt: 'A cute forest elf character, warm and healing style, soft pastel colors, big sparkling eyes, wearing flower crown, surrounded by butterflies and fireflies, magical atmosphere, children book illustration style',
    style: '温馨彩绘',
    tags: ['角色', '治愈', '森林', '精灵', '可爱', '儿童'],
    likes: 1280,
    views: 5600,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
  },
  {
    id: 'case-002',
    title: '赛博朋克城市夜景',
    description: '未来感十足的霓虹城市，科技感强烈',
    prompt: 'Cyberpunk cityscape at night, neon lights reflecting on wet streets, towering skyscrapers with holographic ads, flying vehicles, purple and cyan color scheme, cinematic lighting, ultra detailed, 8k resolution',
    style: '科幻未来',
    tags: ['场景', '赛博朋克', '城市', '夜景', '科技'],
    likes: 2156,
    views: 8900,
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000
  },
  {
    id: 'case-003',
    title: '国潮风龙年IP',
    description: '传统与现代结合的龙年形象，喜庆大气',
    prompt: 'Chinese dragon character for Year of Dragon, traditional Chinese art style mixed with modern design, red and gold color scheme, auspicious clouds background, majestic pose, cultural heritage, festive atmosphere',
    style: '国潮风尚',
    tags: ['IP', '龙年', '国潮', '传统', '喜庆', '生肖'],
    likes: 3420,
    views: 12000,
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000
  },
  {
    id: 'case-004',
    title: '极简咖啡品牌',
    description: '简约优雅的咖啡品牌视觉，高端商务感',
    prompt: 'Minimalist coffee brand visual, elegant and sophisticated, clean lines, earth tone colors, coffee beans and cup composition, premium quality feel, modern design, white background',
    style: '极简主义',
    tags: ['品牌', '咖啡', '极简', '商务', '高端'],
    likes: 890,
    views: 3400,
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000
  },
  {
    id: 'case-005',
    title: '萌宠猫咪表情包',
    description: '可爱猫咪的各种表情，适合社交传播',
    prompt: 'Cute cat character with various expressions, kawaii style, big round eyes, fluffy fur, pink cheeks, multiple poses and emotions, sticker set design, white background, adorable and funny',
    style: '童趣蜡笔插画',
    tags: ['表情包', '猫咪', '可爱', '萌宠', '社交'],
    likes: 4560,
    views: 18000,
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000
  },
  {
    id: 'case-006',
    title: '水彩花卉插画',
    description: '柔和水彩风格的花卉图案，适合文创产品',
    prompt: 'Watercolor flower illustration, soft and dreamy, pastel colors, roses and peonies, delicate brush strokes, artistic and elegant, botanical art style, high quality print ready',
    style: '彩铅素描插画',
    tags: ['花卉', '水彩', '文创', '插画', '艺术'],
    likes: 1670,
    views: 6200,
    createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000
  },
  {
    id: 'case-007',
    title: '科技感机器人',
    description: '友好的服务型机器人形象，未来感设计',
    prompt: 'Friendly service robot character, futuristic design, sleek white body with blue LED accents, rounded shapes, approachable expression, sci-fi but warm, product design style, clean background',
    style: '科幻未来',
    tags: ['机器人', '科技', '服务', '未来', '产品'],
    likes: 980,
    views: 4100,
    createdAt: Date.now() - 35 * 24 * 60 * 60 * 1000
  },
  {
    id: 'case-008',
    title: '复古胶片风格',
    description: '怀旧胶片质感的人物肖像，文艺气息',
    prompt: 'Vintage film style portrait, nostalgic atmosphere, warm sepia tones, grain texture, soft focus, 1970s aesthetic, film photography look, artistic and emotional',
    style: '复古怀旧',
    tags: ['复古', '胶片', '肖像', '文艺', '怀旧'],
    likes: 1120,
    views: 4800,
    createdAt: Date.now() - 40 * 24 * 60 * 60 * 1000
  }
];

// 关键词到案例的映射
const KEYWORD_CASE_MAP: Record<string, string[]> = {
  '角色': ['case-001', 'case-005', 'case-007'],
  'IP': ['case-001', 'case-003', 'case-005', 'case-007'],
  '精灵': ['case-001'],
  '动物': ['case-005'],
  '猫咪': ['case-005'],
  '宠物': ['case-005'],
  '龙': ['case-003'],
  '生肖': ['case-003'],
  '国潮': ['case-003'],
  '传统': ['case-003'],
  '城市': ['case-002'],
  '场景': ['case-002'],
  '赛博朋克': ['case-002'],
  '科幻': ['case-002', 'case-007'],
  '未来': ['case-002', 'case-007'],
  '品牌': ['case-004'],
  'logo': ['case-004'],
  '极简': ['case-004'],
  '表情包': ['case-005'],
  '花卉': ['case-006'],
  '植物': ['case-006'],
  '水彩': ['case-006'],
  '机器人': ['case-007'],
  '科技': ['case-002', 'case-007'],
  '复古': ['case-008'],
  '胶片': ['case-008'],
  '治愈': ['case-001'],
  '可爱': ['case-001', 'case-005'],
  '温馨': ['case-001']
};

/**
 * 案例匹配器
 */
export class CaseMatcher {
  private caseLibrary = POPULAR_CASES;

  /**
   * 分析用户需求并匹配案例
   */
  async matchCases(
    userPrompt: string,
    options?: {
      limit?: number;
      minSimilarity?: number;
    }
  ): Promise<MatchResult> {
    const limit = options?.limit || 3;
    const minSimilarity = options?.minSimilarity || 0.3;

    // 提取关键词
    const keywords = this.extractKeywords(userPrompt);
    
    // 计算每个案例的匹配分数
    const scoredCases = this.caseLibrary.map(caseItem => {
      const similarity = this.calculateSimilarity(keywords, caseItem);
      return { ...caseItem, similarity };
    });

    // 过滤并排序
    const matchedCases = scoredCases
      .filter(c => (c.similarity || 0) >= minSimilarity)
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, limit);

    // 生成匹配原因
    const matchReason = this.generateMatchReason(keywords, matchedCases[0]);

    return {
      cases: matchedCases,
      matchReason,
      confidence: matchedCases.length > 0 ? (matchedCases[0].similarity || 0) : 0
    };
  }

  /**
   * 提取关键词
   */
  private extractKeywords(prompt: string): string[] {
    const lowerPrompt = prompt.toLowerCase();
    const keywords: string[] = [];

    // 从关键词映射中提取
    for (const [keyword, caseIds] of Object.entries(KEYWORD_CASE_MAP)) {
      if (lowerPrompt.includes(keyword)) {
        keywords.push(keyword);
      }
    }

    // 提取风格关键词
    const styleKeywords = ['温馨', '治愈', '科幻', '复古', '极简', '国潮', '可爱', '赛博朋克'];
    for (const style of styleKeywords) {
      if (lowerPrompt.includes(style) && !keywords.includes(style)) {
        keywords.push(style);
      }
    }

    // 提取类型关键词
    const typeKeywords = ['角色', 'IP', '品牌', '表情包', '场景', '插画', '海报'];
    for (const type of typeKeywords) {
      if (lowerPrompt.includes(type) && !keywords.includes(type)) {
        keywords.push(type);
      }
    }

    return keywords;
  }

  /**
   * 计算相似度
   */
  private calculateSimilarity(
    keywords: string[],
    caseItem: DesignCase
  ): number {
    let score = 0;
    let maxScore = 0;

    // 关键词匹配
    for (const keyword of keywords) {
      const weight = 1;
      maxScore += weight;

      // 检查标签匹配
      if (caseItem.tags.some(tag => tag.includes(keyword) || keyword.includes(tag))) {
        score += weight * 0.8;
      }

      // 检查标题匹配
      if (caseItem.title.includes(keyword)) {
        score += weight * 0.6;
      }

      // 检查描述匹配
      if (caseItem.description.includes(keyword)) {
        score += weight * 0.4;
      }

      // 检查关键词映射
      const mappedCases = KEYWORD_CASE_MAP[keyword] || [];
      if (mappedCases.includes(caseItem.id)) {
        score += weight * 0.9;
      }
    }

    // 热度加成
    const popularityBonus = Math.min(caseItem.likes / 5000, 0.1);
    score += popularityBonus;

    return maxScore > 0 ? Math.min(score / maxScore, 1) : 0;
  }

  /**
   * 生成匹配原因
   */
  private generateMatchReason(
    keywords: string[],
    topCase?: DesignCase
  ): string {
    if (!topCase || keywords.length === 0) {
      return '为您推荐热门案例参考';
    }

    const matchedKeywords = keywords.filter(k => 
      topCase.tags.some(t => t.includes(k) || k.includes(t)) ||
      topCase.title.includes(k) ||
      topCase.description.includes(k)
    );

    if (matchedKeywords.length > 0) {
      return `根据您提到的"${matchedKeywords.slice(0, 2).join('、')}"推荐相似案例`;
    }

    return `该案例的${topCase.style}风格与您的需求匹配`;
  }

  /**
   * 生成案例推荐建议
   */
  async generateCaseSuggestion(
    userPrompt: string,
    context?: {
      currentAgent?: string;
      taskType?: string;
    }
  ): Promise<Suggestion | null> {
    const { cases, matchReason, confidence } = await this.matchCases(userPrompt, {
      limit: 1,
      minSimilarity: 0.2
    });

    if (cases.length === 0) {
      return null;
    }

    const topCase = cases[0];

    return {
      id: `sugg-case-${Date.now()}`,
      type: SuggestionType.REFERENCE_CASE,
      title: `参考案例：${topCase.title}`,
      description: topCase.description,
      action: {
        type: 'message',
        payload: `参考"${topCase.title}"的风格：${topCase.prompt.substring(0, 100)}...`
      },
      priority: Math.round(confidence * 70),
      reason: matchReason,
      confidence,
      timestamp: Date.now(),
      metadata: {
        case: topCase,
        prompt: topCase.prompt,
        style: topCase.style,
        likes: topCase.likes
      }
    } as Suggestion;
  }

  /**
   * 获取风格相似的案例
   */
  async getCasesByStyle(
    style: string,
    limit: number = 3
  ): Promise<DesignCase[]> {
    return this.caseLibrary
      .filter(c => c.style === style || c.tags.includes(style))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit);
  }

  /**
   * 获取热门案例
   */
  async getPopularCases(limit: number = 5): Promise<DesignCase[]> {
    return [...this.caseLibrary]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit);
  }

  /**
   * 获取最新案例
   */
  async getLatestCases(limit: number = 5): Promise<DesignCase[]> {
    return [...this.caseLibrary]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  /**
   * 从数据库获取案例（如果可用）
   */
  async fetchCasesFromDatabase(limit: number = 10): Promise<DesignCase[]> {
    try {
      const { data, error } = await supabase
        .from('works')
        .select('id, title, description, prompt, style, tags, thumbnail, likes_count, views_count, created_at')
        .order('likes_count', { ascending: false })
        .limit(limit);

      if (error || !data) {
        return this.caseLibrary.slice(0, limit);
      }

      return data.map(item => ({
        id: item.id,
        title: item.title || '未命名作品',
        description: item.description || '',
        prompt: item.prompt || '',
        style: item.style || '',
        tags: item.tags || [],
        thumbnail: item.thumbnail,
        likes: item.likes_count || 0,
        views: item.views_count || 0,
        createdAt: new Date(item.created_at).getTime()
      }));
    } catch (error) {
      console.error('[CaseMatcher] Failed to fetch from database:', error);
      return this.caseLibrary.slice(0, limit);
    }
  }

  /**
   * 获取案例组合建议（针对复杂需求）
   */
  async getCaseCombination(
    userPrompt: string
  ): Promise<{
    primaryCase: DesignCase;
    complementaryCases: DesignCase[];
    combinationTip: string;
  } | null> {
    const { cases } = await this.matchCases(userPrompt, { limit: 4 });
    
    if (cases.length < 2) {
      return null;
    }

    const primaryCase = cases[0];
    const complementaryCases = cases.slice(1, 3);

    return {
      primaryCase,
      complementaryCases,
      combinationTip: `参考"${primaryCase.title}"的主体设计，结合"${complementaryCases[0]?.title}"的风格表现`
    };
  }
}

// 导出单例
let caseMatcherInstance: CaseMatcher | null = null;

export function getCaseMatcher(): CaseMatcher {
  if (!caseMatcherInstance) {
    caseMatcherInstance = new CaseMatcher();
  }
  return caseMatcherInstance;
}

export function resetCaseMatcher(): void {
  caseMatcherInstance = null;
}
