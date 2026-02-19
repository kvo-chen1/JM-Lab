/**
 * AI智能响应生成引擎
 * 提供智能、全面且引人入胜的响应生成能力
 */

import { Message } from './llmService';
import { aiContextManager, UserIntent } from './aiContextManager';

// 响应风格类型
export type ResponseStyle = 
  | 'comprehensive'    // 全面详尽
  | 'concise'          // 简洁明了
  | 'conversational'   // 对话式
  | 'educational'      // 教育式
  | 'professional'     // 专业正式
  | 'creative'         // 创意启发
  | 'empathetic'       // 共情理解
  | 'enthusiastic';    // 热情积极

// 响应结构
export interface ResponseStructure {
  greeting?: string;
  acknowledgment: string;
  mainContent: string;
  examples?: string;
  actionItems?: string[];
  followUpQuestions?: string[];
  closing?: string;
}

// 内容块
export interface ContentBlock {
  type: 'text' | 'list' | 'example' | 'comparison' | 'step' | 'quote' | 'highlight';
  content: string;
  metadata?: Record<string, any>;
}

// 响应模板
export interface ResponseTemplate {
  id: string;
  style: ResponseStyle;
  structure: ResponseStructure;
  blocks: ContentBlock[];
  tone: string;
  formality: 'low' | 'medium' | 'high';
}

// 用户画像
export interface UserProfile {
  expertise: 'beginner' | 'intermediate' | 'expert';
  preferences: string[];
  interactionHistory: string[];
  commonTopics: string[];
  responseStyle: ResponseStyle;
}

// 响应质量指标
export interface ResponseQuality {
  relevance: number;
  completeness: number;
  clarity: number;
  engagement: number;
  actionability: number;
  overall: number;
}

class AIResponseEngine {
  private templates: Map<string, ResponseTemplate> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * 初始化响应模板
   */
  private initializeTemplates(): void {
    // 全面详尽风格
    this.templates.set('comprehensive', {
      id: 'comprehensive',
      style: 'comprehensive',
      structure: {
        acknowledgment: '我理解您的需求，让我为您详细解答',
        mainContent: '',
        examples: '以下是一些具体示例',
        actionItems: [],
        followUpQuestions: [],
        closing: '希望这些信息对您有帮助，如有其他问题请随时询问'
      },
      blocks: [
        { type: 'highlight', content: '核心要点' },
        { type: 'text', content: '详细解释' },
        { type: 'example', content: '实际案例' },
        { type: 'list', content: '关键步骤' }
      ],
      tone: '专业、详尽、有条理',
      formality: 'medium'
    });

    // 对话式风格
    this.templates.set('conversational', {
      id: 'conversational',
      style: 'conversational',
      structure: {
        greeting: '您好！很高兴为您服务',
        acknowledgment: '这是个很好的问题',
        mainContent: '',
        examples: '让我举个例子',
        actionItems: [],
        followUpQuestions: ['您还想了解什么吗？'],
        closing: '期待您的回复！'
      },
      blocks: [
        { type: 'text', content: '自然对话' },
        { type: 'example', content: '生活化例子' },
        { type: 'highlight', content: '关键提醒' }
      ],
      tone: '友好、自然、亲切',
      formality: 'low'
    });

    // 教育式风格
    this.templates.set('educational', {
      id: 'educational',
      style: 'educational',
      structure: {
        acknowledgment: '这是一个值得深入理解的问题',
        mainContent: '',
        examples: '让我们通过实例来理解',
        actionItems: ['建议您尝试练习'],
        followUpQuestions: ['您理解了吗？'],
        closing: '继续加油学习！'
      },
      blocks: [
        { type: 'text', content: '概念解释' },
        { type: 'step', content: '分步说明' },
        { type: 'example', content: '教学案例' },
        { type: 'comparison', content: '对比分析' }
      ],
      tone: '耐心、启发、引导',
      formality: 'medium'
    });

    // 创意启发风格
    this.templates.set('creative', {
      id: 'creative',
      style: 'creative',
      structure: {
        greeting: '哇，这个想法很有创意！',
        acknowledgment: '让我为您提供一些灵感',
        mainContent: '',
        examples: '想象一下...',
        actionItems: ['尝试不同的组合'],
        followUpQuestions: ['您觉得哪个方向最吸引您？'],
        closing: '期待看到您的创意作品！'
      },
      blocks: [
        { type: 'highlight', content: '创意火花' },
        { type: 'text', content: '灵感激发' },
        { type: 'example', content: '创意案例' },
        { type: 'list', content: '可能性探索' }
      ],
      tone: '热情、启发、开放',
      formality: 'low'
    });

    // 专业正式风格
    this.templates.set('professional', {
      id: 'professional',
      style: 'professional',
      structure: {
        acknowledgment: '收到您的咨询',
        mainContent: '',
        examples: '参考案例如下',
        actionItems: [],
        followUpQuestions: [],
        closing: '如有进一步需求，请随时联系'
      },
      blocks: [
        { type: 'text', content: '专业分析' },
        { type: 'list', content: '要点罗列' },
        { type: 'comparison', content: '方案对比' }
      ],
      tone: '严谨、专业、客观',
      formality: 'high'
    });
  }

  /**
   * 生成智能响应
   */
  async generateResponse(
    query: string,
    messages: Message[],
    sessionId: string,
    options?: {
      style?: ResponseStyle;
      includeExamples?: boolean;
      includeActionItems?: boolean;
      maxLength?: number;
    }
  ): Promise<{
    content: string;
    structure: ResponseStructure;
    quality: ResponseQuality;
    suggestions: string[];
  }> {
    const startTime = Date.now();

    // 1. 分析用户意图和上下文
    const intent = aiContextManager.analyzeIntent(query, sessionId);
    const context = aiContextManager.getDialogueState(sessionId);

    // 2. 确定响应风格
    const style = options?.style || this.determineResponseStyle(intent, context);

    // 3. 获取用户画像
    const userProfile = this.getUserProfile(sessionId);

    // 4. 构建响应结构
    const structure = this.buildResponseStructure(style, intent, userProfile);

    // 5. 生成内容块
    const blocks = await this.generateContentBlocks(query, intent, style, userProfile);

    // 6. 组装响应
    const content = this.assembleResponse(structure, blocks, options);

    // 7. 评估质量
    const quality = this.evaluateQuality(content, query, intent);

    // 8. 生成改进建议
    const suggestions = this.generateSuggestions(quality, content);

    return {
      content,
      structure,
      quality,
      suggestions
    };
  }

  /**
   * 确定响应风格
   */
  private determineResponseStyle(
    intent: UserIntent,
    context: any
  ): ResponseStyle {
    // 根据意图类型选择风格
    switch (intent.primary) {
      case 'inquiry':
        return intent.entities.length > 2 ? 'comprehensive' : 'conversational';
      case 'creation':
        return 'creative';
      case 'comparison':
        return 'comprehensive';
      case 'navigation':
        return 'concise';
      default:
        // 根据对话长度调整
        const messageCount = context.contextSegments?.length || 0;
        if (messageCount > 10) {
          return 'conversational';
        }
        return 'comprehensive';
    }
  }

  /**
   * 获取用户画像
   */
  private getUserProfile(sessionId: string): UserProfile {
    if (!this.userProfiles.has(sessionId)) {
      this.userProfiles.set(sessionId, {
        expertise: 'intermediate',
        preferences: [],
        interactionHistory: [],
        commonTopics: [],
        responseStyle: 'comprehensive'
      });
    }
    return this.userProfiles.get(sessionId)!;
  }

  /**
   * 构建响应结构
   */
  private buildResponseStructure(
    style: ResponseStyle,
    intent: UserIntent,
    userProfile: UserProfile
  ): ResponseStructure {
    const template = this.templates.get(style) || this.templates.get('comprehensive')!;
    const structure = { ...template.structure };

    // 根据用户专业水平调整
    if (userProfile.expertise === 'beginner') {
      structure.acknowledgment = '没问题，让我用简单的方式为您解释';
    } else if (userProfile.expertise === 'expert') {
      structure.acknowledgment = '这是一个专业的问题，让我深入分析';
    }

    // 根据意图添加特定的跟进问题
    structure.followUpQuestions = this.generateFollowUpQuestions(intent, userProfile);

    return structure;
  }

  /**
   * 生成跟进问题
   */
  private generateFollowUpQuestions(
    intent: UserIntent,
    userProfile: UserProfile
  ): string[] {
    const questions: string[] = [];

    // 基于意图类型
    switch (intent.primary) {
      case 'creation':
        questions.push('您希望达到什么样的效果？');
        questions.push('有什么特定的风格偏好吗？');
        break;
      case 'inquiry':
        questions.push('这个解释清楚吗？');
        questions.push('您还想了解哪方面的内容？');
        break;
      case 'comparison':
        questions.push('您更看重哪个方面？');
        questions.push('有什么特定的使用场景吗？');
        break;
    }

    // 基于用户历史
    if (userProfile.commonTopics.length > 0) {
      const recentTopic = userProfile.commonTopics[userProfile.commonTopics.length - 1];
      questions.push(`您之前关注的${recentTopic}，还需要更多信息吗？`);
    }

    return questions.slice(0, 2);
  }

  /**
   * 生成内容块
   */
  private async generateContentBlocks(
    query: string,
    intent: UserIntent,
    style: ResponseStyle,
    userProfile: UserProfile
  ): Promise<ContentBlock[]> {
    const blocks: ContentBlock[] = [];

    // 1. 核心回答块
    blocks.push({
      type: 'text',
      content: await this.generateCoreAnswer(query, intent, userProfile)
    });

    // 2. 示例块（如果需要）
    if (this.shouldIncludeExamples(intent)) {
      blocks.push({
        type: 'example',
        content: await this.generateExamples(query, intent)
      });
    }

    // 3. 步骤块（如果是操作类问题）
    if (intent.primary === 'creation' || query.includes('如何') || query.includes('怎么')) {
      blocks.push({
        type: 'step',
        content: await this.generateSteps(query)
      });
    }

    // 4. 对比块（如果是比较类问题）
    if (intent.primary === 'comparison') {
      blocks.push({
        type: 'comparison',
        content: await this.generateComparison(query)
      });
    }

    // 5. 要点块
    blocks.push({
      type: 'highlight',
      content: await this.generateKeyPoints(query, intent)
    });

    return blocks;
  }

  /**
   * 生成核心回答
   */
  private async generateCoreAnswer(
    query: string,
    intent: UserIntent,
    userProfile: UserProfile
  ): Promise<string> {
    // 根据用户专业水平调整复杂度
    let complexity = '适中';
    if (userProfile.expertise === 'beginner') {
      complexity = '简单易懂';
    } else if (userProfile.expertise === 'expert') {
      complexity = '专业深入';
    }

    return `基于您的需求，我为您提供${complexity}的解答...`;
  }

  /**
   * 生成示例
   */
  private async generateExamples(query: string, intent: UserIntent): Promise<string> {
    const examples: Record<string, string[]> = {
      'cultural': [
        '杨柳青年画：以娃娃题材著称，色彩鲜艳，寓意吉祥',
        '泥人张彩塑：形神兼备，色彩明快，具有浓厚的生活气息',
        '风筝魏：造型优美，飞行稳定，是天津传统工艺的瑰宝'
      ],
      'design': [
        '国潮风格：将传统元素与现代设计融合，如用年画娃娃做IP形象',
        '极简风格：提取非遗元素的核心特征，用简约线条表现',
        '复古风格：还原传统工艺的原始美感，营造怀旧氛围'
      ],
      'default': [
        '例如，在设计文创产品时，可以提取杨柳青年画的娃娃形象',
        '再比如，将泥人张的彩塑技法应用到现代插画创作中'
      ]
    };

    const category = intent.entities.find(e => e.type === 'cultural_element') ? 'cultural' :
                    intent.primary === 'creation' ? 'design' : 'default';
    
    return examples[category].join('\n');
  }

  /**
   * 生成步骤
   */
  private async generateSteps(query: string): Promise<string> {
    return `
1. **明确目标**：确定您想要达成的效果
2. **收集素材**：搜集相关的文化元素和设计参考
3. **构思创意**：结合传统与现代，形成独特创意
4. **初步设计**：绘制草图或制作原型
5. **优化完善**：根据反馈不断调整改进
6. **最终呈现**：完成作品并进行展示
    `.trim();
  }

  /**
   * 生成对比
   */
  private async generateComparison(query: string): Promise<string> {
    return `
| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 传统风格 | 文化底蕴深厚 | 可能显得老气 | 高端礼品 |
| 现代风格 | 简洁时尚 | 缺乏特色 | 年轻群体 |
| 国潮风格 | 兼具传统与现代 | 设计难度较高 | 大众市场 |
    `.trim();
  }

  /**
   * 生成关键要点
   */
  private async generateKeyPoints(query: string, intent: UserIntent): Promise<string> {
    return `
💡 **关键要点**：
- 深入理解文化元素的内涵
- 找到传统与现代的平衡点
- 注重用户体验和实用性
- 保持设计的原创性和创新性
    `.trim();
  }

  /**
   * 判断是否包含示例
   */
  private shouldIncludeExamples(intent: UserIntent): boolean {
    return ['inquiry', 'creation', 'comparison'].includes(intent.primary);
  }

  /**
   * 组装响应
   */
  private assembleResponse(
    structure: ResponseStructure,
    blocks: ContentBlock[],
    options?: { maxLength?: number }
  ): string {
    const parts: string[] = [];

    // 问候语
    if (structure.greeting) {
      parts.push(structure.greeting);
      parts.push('');
    }

    // 确认理解
    parts.push(structure.acknowledgment);
    parts.push('');

    // 主要内容
    blocks.forEach(block => {
      switch (block.type) {
        case 'text':
          parts.push(block.content);
          break;
        case 'example':
          parts.push('');
          parts.push('**示例**：');
          parts.push(block.content);
          break;
        case 'step':
          parts.push('');
          parts.push('**操作步骤**：');
          parts.push(block.content);
          break;
        case 'comparison':
          parts.push('');
          parts.push('**对比分析**：');
          parts.push(block.content);
          break;
        case 'highlight':
          parts.push('');
          parts.push(block.content);
          break;
      }
      parts.push('');
    });

    // 行动建议
    if (structure.actionItems && structure.actionItems.length > 0) {
      parts.push('**建议您**：');
      structure.actionItems.forEach(item => {
        parts.push(`- ${item}`);
      });
      parts.push('');
    }

    // 跟进问题
    if (structure.followUpQuestions && structure.followUpQuestions.length > 0) {
      parts.push(structure.followUpQuestions[0]);
      parts.push('');
    }

    // 结束语
    if (structure.closing) {
      parts.push(structure.closing);
    }

    let content = parts.join('\n');

    // 长度限制
    if (options?.maxLength && content.length > options.maxLength) {
      content = content.substring(0, options.maxLength) + '...';
    }

    return content;
  }

  /**
   * 评估响应质量
   */
  private evaluateQuality(
    content: string,
    query: string,
    intent: UserIntent
  ): ResponseQuality {
    // 相关性评分
    const relevance = this.calculateRelevance(content, query);

    // 完整性评分
    const completeness = this.calculateCompleteness(content, intent);

    // 清晰度评分
    const clarity = this.calculateClarity(content);

    // 吸引力评分
    const engagement = this.calculateEngagement(content);

    // 可操作性评分
    const actionability = this.calculateActionability(content);

    // 综合评分
    const overall = (relevance + completeness + clarity + engagement + actionability) / 5;

    return {
      relevance,
      completeness,
      clarity,
      engagement,
      actionability,
      overall
    };
  }

  /**
   * 计算相关性
   */
  private calculateRelevance(content: string, query: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    
    const matches = queryWords.filter(word => 
      contentWords.some(cw => cw.includes(word) || word.includes(cw))
    );
    
    return Math.min(1, matches.length / queryWords.length);
  }

  /**
   * 计算完整性
   */
  private calculateCompleteness(content: string, intent: UserIntent): number {
    let score = 0.5;

    // 检查是否包含关键元素
    if (content.includes('示例') || content.includes('例子')) score += 0.1;
    if (content.includes('步骤') || content.includes('方法')) score += 0.1;
    if (content.includes('注意') || content.includes('提醒')) score += 0.1;
    if (content.length > 200) score += 0.1;
    if (content.length > 500) score += 0.1;

    return Math.min(1, score);
  }

  /**
   * 计算清晰度
   */
  private calculateClarity(content: string): number {
    // 检查结构清晰度
    const hasStructure = /#{1,3}\s|【|】|\*\*|\d+\./.test(content);
    const hasParagraphs = content.split('\n\n').length > 2;
    const avgSentenceLength = content.length / (content.split(/[。！？.!?]/).length || 1);

    let score = 0.5;
    if (hasStructure) score += 0.2;
    if (hasParagraphs) score += 0.15;
    if (avgSentenceLength < 50) score += 0.15;

    return Math.min(1, score);
  }

  /**
   * 计算吸引力
   */
  private calculateEngagement(content: string): number {
    // 检查吸引力元素
    const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(content);
    const hasQuestions = /\?|？/.test(content);
    const hasExamples = /示例|例子|比如|例如/.test(content);
    const hasPersonalization = /您|你/.test(content);

    let score = 0.4;
    if (hasEmoji) score += 0.15;
    if (hasQuestions) score += 0.15;
    if (hasExamples) score += 0.15;
    if (hasPersonalization) score += 0.15;

    return Math.min(1, score);
  }

  /**
   * 计算可操作性
   */
  private calculateActionability(content: string): number {
    // 检查可操作性
    const hasSteps = /\d+\.|步骤|方法/.test(content);
    const hasActions = /建议|可以|尝试|使用/.test(content);
    const hasSpecifics = /具体|详细|明确/.test(content);

    let score = 0.4;
    if (hasSteps) score += 0.2;
    if (hasActions) score += 0.2;
    if (hasSpecifics) score += 0.2;

    return Math.min(1, score);
  }

  /**
   * 生成改进建议
   */
  private generateSuggestions(quality: ResponseQuality, content: string): string[] {
    const suggestions: string[] = [];

    if (quality.relevance < 0.7) {
      suggestions.push('建议更紧密地围绕用户问题展开');
    }

    if (quality.completeness < 0.7) {
      suggestions.push('可以补充更多细节和背景信息');
    }

    if (quality.clarity < 0.7) {
      suggestions.push('建议使用更清晰的结构和分段');
    }

    if (quality.engagement < 0.7) {
      suggestions.push('可以增加互动性元素，如提问或示例');
    }

    if (quality.actionability < 0.7) {
      suggestions.push('建议提供更具体的行动建议');
    }

    if (suggestions.length === 0) {
      suggestions.push('响应质量良好');
    }

    return suggestions;
  }

  /**
   * 优化响应
   */
  async optimizeResponse(
    originalResponse: string,
    query: string,
    targetQuality: Partial<ResponseQuality>
  ): Promise<string> {
    // 分析当前质量
    const currentQuality = this.evaluateQuality(originalResponse, query, {
      primary: 'general',
      secondary: [],
      confidence: 0.5,
      entities: [],
      sentiment: 'neutral',
      urgency: 'low'
    });

    // 确定需要改进的方面
    const improvements: string[] = [];
    
    if ((targetQuality.relevance || 0) > currentQuality.relevance) {
      improvements.push('增强相关性');
    }
    if ((targetQuality.completeness || 0) > currentQuality.completeness) {
      improvements.push('补充完整性');
    }
    if ((targetQuality.clarity || 0) > currentQuality.clarity) {
      improvements.push('提升清晰度');
    }
    if ((targetQuality.engagement || 0) > currentQuality.engagement) {
      improvements.push('增加吸引力');
    }
    if ((targetQuality.actionability || 0) > currentQuality.actionability) {
      improvements.push('强化可操作性');
    }

    if (improvements.length === 0) {
      return originalResponse;
    }

    // 返回优化后的响应（简化实现）
    return `${originalResponse}\n\n---\n💡 **优化建议**：${improvements.join('、')}`;
  }
}

export const aiResponseEngine = new AIResponseEngine();
export default AIResponseEngine;
