// RAG (Retrieval-Augmented Generation) 服务
// 实现检索增强生成功能，将相关案例自动注入到Prompt中

import { getVectorStore, SimilarityResult } from './vectorStore';
import { PRESET_STYLES } from '../types/agent';

// RAG配置
const RAG_CONFIG = {
  defaultLimit: 3,
  defaultThreshold: 0.6,
  maxContextLength: 2000,
  relevanceBoost: 1.2 // 相关性提升系数
};

// 设计案例模板
export interface DesignCase {
  id: string;
  title: string;
  description: string;
  style: string;
  tags: string[];
  useCase: string;
  outcome: string;
  createdAt: number;
}

// RAG上下文
export interface RAGContext {
  query: string;
  retrievedCases: DesignCase[];
  totalScore: number;
  contextText: string;
}

// 检索结果增强
export interface EnhancedRetrieval {
  cases: DesignCase[];
  styleRecommendations: string[];
  insights: string[];
}

/**
 * RAG服务
 * 实现基于向量检索的增强生成
 */
export class RAGService {
  private vectorStore = getVectorStore();

  /**
   * 初始化设计案例库
   * 添加预设的设计案例到向量存储
   */
  async initializeCaseLibrary(): Promise<void> {
    const existingCases = this.vectorStore.getVectorsByType('design-case');
    if (existingCases.length > 0) {
      console.log(`[RAG] Case library already initialized with ${existingCases.length} cases`);
      return;
    }

    // 预设设计案例
    const defaultCases: Omit<DesignCase, 'id' | 'createdAt'>[] = [
      {
        title: '温馨治愈系IP形象设计',
        description: '为儿童教育品牌设计的可爱IP形象，采用圆润的线条和温暖的色彩，传达友好、可信赖的品牌形象。',
        style: 'warm-color',
        tags: ['IP设计', '儿童', '温馨', '教育', '可爱'],
        useCase: '适用于儿童教育APP、绘本、教具包装',
        outcome: '品牌认知度提升40%，用户喜爱度达95%'
      },
      {
        title: '科技品牌视觉识别系统',
        description: '为SaaS企业设计的现代简约VI系统，使用几何图形和冷色调，体现专业、高效的科技感。',
        style: 'color-pencil',
        tags: ['品牌设计', 'VI系统', '科技', '简约', 'B2B'],
        useCase: '适用于企业官网、产品界面、宣传物料',
        outcome: '品牌专业度认知提升60%'
      },
      {
        title: '文创产品包装设计',
        description: '为博物馆文创产品设计的包装系列，融合传统文化元素与现代设计语言。',
        style: 'fantasy-picture-book',
        tags: ['包装设计', '文创', '传统', '博物馆', '礼品'],
        useCase: '适用于文创产品、礼品包装、纪念品',
        outcome: '产品销量提升35%，收藏率提升50%'
      },
      {
        title: '餐饮品牌插画风格设计',
        description: '为连锁餐饮品牌设计的手绘风格视觉系统，营造温馨、亲切的就餐氛围。',
        style: 'crayon-cute',
        tags: ['插画', '餐饮', '手绘', '品牌', '温馨'],
        useCase: '适用于餐厅装修、菜单、外卖包装',
        outcome: '品牌辨识度提升45%，顾客满意度提升'
      },
      {
        title: '运动品牌动态海报',
        description: '为运动品牌设计的活力海报系列，使用大胆的色彩和动感的构图。',
        style: 'adventure-comic',
        tags: ['海报', '运动', '活力', '年轻', '动感'],
        useCase: '适用于社交媒体、户外广告、门店展示',
        outcome: '社交媒体互动率提升80%'
      },
      {
        title: '美妆品牌梦幻风格设计',
        description: '为美妆品牌设计的梦幻唯美视觉风格，使用柔和渐变和精致细节。',
        style: 'dreamy-pastel',
        tags: ['美妆', '梦幻', '唯美', '女性', '精致'],
        useCase: '适用于产品包装、广告、社交媒体',
        outcome: '品牌好感度提升55%，购买转化率提升25%'
      },
      {
        title: '复古风格咖啡品牌设计',
        description: '为精品咖啡店设计的复古工业风格品牌视觉，营造独特的空间体验。',
        style: 'grainy-cute',
        tags: ['咖啡', '复古', '工业风', '文艺', '空间'],
        useCase: '适用于店面设计、包装、品牌物料',
        outcome: '成为网红打卡点，客流量提升120%'
      },
      {
        title: '森系自然风格插画',
        description: '为环保品牌设计的自然风格插画，使用植物元素和大地色调。',
        style: 'mori-girl',
        tags: ['环保', '自然', '植物', '插画', '有机'],
        useCase: '适用于环保产品、有机品牌、公益宣传',
        outcome: '品牌环保形象认知度提升70%'
      }
    ];

    // 添加到向量存储
    for (const caseData of defaultCases) {
      const content = `${caseData.title}。${caseData.description}。适用场景：${caseData.useCase}。效果：${caseData.outcome}`;
      await this.vectorStore.addVector(content, {
        type: 'design-case',
        tags: caseData.tags,
        style: caseData.style,
        title: caseData.title,
        useCase: caseData.useCase,
        outcome: caseData.outcome,
        createdAt: Date.now()
      });
    }

    console.log(`[RAG] Initialized case library with ${defaultCases.length} cases`);
  }

  /**
   * 检索相关设计案例
   */
  async retrieveCases(
    query: string,
    options?: {
      limit?: number;
      threshold?: number;
      styleFilter?: string;
    }
  ): Promise<DesignCase[]> {
    const limit = options?.limit || RAG_CONFIG.defaultLimit;
    const threshold = options?.threshold || RAG_CONFIG.defaultThreshold;

    // 执行向量搜索
    const results = await this.vectorStore.searchSimilar(query, {
      limit: limit * 2, // 获取更多结果用于过滤
      threshold,
      filter: (item) => item.metadata.type === 'design-case'
    });

    // 转换为DesignCase格式
    let cases = results.map(result => this.convertToDesignCase(result));

    // 应用风格过滤
    if (options?.styleFilter) {
      cases = cases.filter(c => c.style === options.styleFilter);
    }

    // 限制数量并排序
    cases = cases.slice(0, limit);

    console.log(`[RAG] Retrieved ${cases.length} cases for query: "${query.substring(0, 50)}..."`);
    return cases;
  }

  /**
   * 将向量结果转换为设计案例
   */
  private convertToDesignCase(result: SimilarityResult): DesignCase {
    const item = result.item;
    return {
      id: item.id,
      title: item.metadata.title || '未命名案例',
      description: item.content,
      style: item.metadata.style || 'unknown',
      tags: item.metadata.tags || [],
      useCase: item.metadata.useCase || '',
      outcome: item.metadata.outcome || '',
      createdAt: item.metadata.createdAt
    };
  }

  /**
   * 构建RAG上下文
   */
  async buildRAGContext(
    query: string,
    options?: {
      limit?: number;
      includeInsights?: boolean;
    }
  ): Promise<RAGContext> {
    // 检索相关案例
    const cases = await this.retrieveCases(query, {
      limit: options?.limit || RAG_CONFIG.defaultLimit
    });

    if (cases.length === 0) {
      return {
        query,
        retrievedCases: [],
        totalScore: 0,
        contextText: ''
      };
    }

    // 生成上下文文本
    const contextText = this.generateContextText(cases, options?.includeInsights);

    // 计算总评分
    const totalScore = cases.reduce((sum, c) => sum + (c as any).score || 0, 0);

    return {
      query,
      retrievedCases: cases,
      totalScore,
      contextText
    };
  }

  /**
   * 生成上下文文本
   */
  private generateContextText(cases: DesignCase[], includeInsights?: boolean): string {
    let text = '## 相关设计案例参考\n\n';

    cases.forEach((caseItem, index) => {
      text += `### 案例${index + 1}: ${caseItem.title}\n`;
      text += `- **风格**: ${PRESET_STYLES.find(s => s.id === caseItem.style)?.name || caseItem.style}\n`;
      text += `- **描述**: ${caseItem.description}\n`;
      text += `- **适用场景**: ${caseItem.useCase}\n`;
      if (caseItem.outcome) {
        text += `- **效果**: ${caseItem.outcome}\n`;
      }
      text += '\n';
    });

    if (includeInsights) {
      text += '## 设计洞察\n';
      text += this.generateInsights(cases);
    }

    return text;
  }

  /**
   * 生成设计洞察
   */
  private generateInsights(cases: DesignCase[]): string {
    const insights: string[] = [];

    // 分析风格趋势
    const styleCount: Record<string, number> = {};
    cases.forEach(c => {
      styleCount[c.style] = (styleCount[c.style] || 0) + 1;
    });
    const topStyle = Object.entries(styleCount).sort((a, b) => b[1] - a[1])[0];
    if (topStyle) {
      insights.push(`- 相似项目中，${PRESET_STYLES.find(s => s.id === topStyle[0])?.name || topStyle[0]}风格较为常见`);
    }

    // 分析标签
    const allTags = cases.flatMap(c => c.tags);
    const tagCount: Record<string, number> = {};
    allTags.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);
    if (topTags.length > 0) {
      insights.push(`- 这类项目通常涉及：${topTags.join('、')}`);
    }

    // 通用建议
    insights.push('- 建议参考上述案例的成功经验，结合具体需求进行创新');

    return insights.join('\n') + '\n';
  }

  /**
   * 增强Prompt with RAG
   */
  async enhancePromptWithRAG(
    basePrompt: string,
    userQuery: string,
    options?: {
      position?: 'start' | 'end';
      maxLength?: number;
    }
  ): Promise<string> {
    const context = await this.buildRAGContext(userQuery, {
      includeInsights: true
    });

    if (!context.contextText) {
      return basePrompt;
    }

    const position = options?.position || 'start';
    const maxLength = options?.maxLength || RAG_CONFIG.maxContextLength;

    // 截断上下文以控制长度
    let contextText = context.contextText;
    if (contextText.length > maxLength) {
      contextText = contextText.substring(0, maxLength) + '\n...（内容已截断）';
    }

    // 根据位置插入上下文
    if (position === 'start') {
      return `${contextText}\n\n---\n\n${basePrompt}`;
    } else {
      return `${basePrompt}\n\n---\n\n${contextText}`;
    }
  }

  /**
   * 获取风格推荐
   */
  async getStyleRecommendations(query: string): Promise<string[]> {
    const cases = await this.retrieveCases(query, { limit: 5 });

    // 统计风格频率
    const styleCount: Record<string, number> = {};
    cases.forEach(c => {
      styleCount[c.style] = (styleCount[c.style] || 0) + 1;
    });

    // 按频率排序并返回风格ID
    return Object.entries(styleCount)
      .sort((a, b) => b[1] - a[1])
      .map(([style]) => style);
  }

  /**
   * 添加自定义案例
   */
  async addCustomCase(
    caseData: Omit<DesignCase, 'id' | 'createdAt'>
  ): Promise<string> {
    const content = `${caseData.title}。${caseData.description}。适用场景：${caseData.useCase}。效果：${caseData.outcome}`;

    const id = await this.vectorStore.addVector(content, {
      type: 'design-case',
      tags: caseData.tags,
      style: caseData.style,
      title: caseData.title,
      useCase: caseData.useCase,
      outcome: caseData.outcome,
      createdAt: Date.now()
    });

    console.log(`[RAG] Added custom case: ${caseData.title}`);
    return id;
  }

  /**
   * 分析用户需求并推荐
   */
  async analyzeAndRecommend(query: string): Promise<EnhancedRetrieval> {
    // 检索相关案例
    const cases = await this.retrieveCases(query, { limit: 5 });

    // 获取风格推荐
    const styleRecommendations = await this.getStyleRecommendations(query);

    // 生成洞察
    const insights: string[] = [];

    if (cases.length > 0) {
      insights.push(`找到 ${cases.length} 个相关设计案例可供参考`);

      // 风格建议
      if (styleRecommendations.length > 0) {
        const topStyle = PRESET_STYLES.find(s => s.id === styleRecommendations[0]);
        if (topStyle) {
          insights.push(`建议考虑"${topStyle.name}"风格，在类似项目中表现良好`);
        }
      }

      // 应用场景建议
      const useCases = cases.map(c => c.useCase).filter(Boolean);
      if (useCases.length > 0) {
        insights.push(`参考案例的应用场景：${useCases.slice(0, 3).join('、')}`);
      }
    } else {
      insights.push('未找到完全匹配的案例，建议提供更多细节以便精准推荐');
    }

    return {
      cases,
      styleRecommendations,
      insights
    };
  }

  /**
   * 生成带RAG的设计建议
   */
  async generateDesignAdvice(
    userRequirement: string,
    options?: {
      includeCases?: boolean;
      includeStyles?: boolean;
    }
  ): Promise<string> {
    const analysis = await this.analyzeAndRecommend(userRequirement);

    let advice = '';

    // 添加洞察
    if (analysis.insights.length > 0) {
      advice += '## 💡 设计建议\n\n';
      analysis.insights.forEach(insight => {
        advice += `- ${insight}\n`;
      });
      advice += '\n';
    }

    // 添加风格推荐
    if (options?.includeStyles !== false && analysis.styleRecommendations.length > 0) {
      advice += '## 🎨 推荐风格\n\n';
      analysis.styleRecommendations.slice(0, 3).forEach((styleId, index) => {
        const style = PRESET_STYLES.find(s => s.id === styleId);
        if (style) {
          advice += `${index + 1}. **${style.name}** - ${style.description}\n`;
        }
      });
      advice += '\n';
    }

    // 添加参考案例
    if (options?.includeCases !== false && analysis.cases.length > 0) {
      advice += '## 📚 参考案例\n\n';
      analysis.cases.slice(0, 3).forEach((c, index) => {
        advice += `${index + 1}. **${c.title}**\n`;
        advice += `   ${c.description.substring(0, 100)}...\n`;
      });
    }

    return advice;
  }

  /**
   * 获取RAG统计信息
   */
  getStats(): {
    totalCases: number;
    vectorStats: ReturnType<typeof this.vectorStore.getStats>;
  } {
    return {
      totalCases: this.vectorStore.getVectorsByType('design-case').length,
      vectorStats: this.vectorStore.getStats()
    };
  }

  /**
   * 清空案例库
   */
  clearCaseLibrary(): void {
    const cases = this.vectorStore.getVectorsByType('design-case');
    cases.forEach(c => this.vectorStore.deleteVector(c.id));
    console.log('[RAG] Cleared case library');
  }
}

// 导出单例实例
let ragServiceInstance: RAGService | null = null;

export function getRAGService(): RAGService {
  if (!ragServiceInstance) {
    ragServiceInstance = new RAGService();
  }
  return ragServiceInstance;
}

export function resetRAGService(): void {
  ragServiceInstance = null;
}
