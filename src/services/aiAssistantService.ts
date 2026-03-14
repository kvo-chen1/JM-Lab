/**
 * AI助手增强服务
 * 整合知识库、记忆、文化专家和LLM服务，提供完整的AI助手功能
 */

import { aiKnowledgeService, NavigationTarget, KnowledgeItem } from './aiKnowledgeService';
import { aiMemoryService, Conversation } from './aiMemoryService';
import { culturalExpertService, CulturalElement } from './culturalExpertService';
import { personalizationService } from './personalizationService';
import { llmService } from './llmService';
import { supabase } from '@/lib/supabase';

export interface AIResponse {
  type: 'navigation' | 'guide' | 'chat' | 'error' | 'cultural' | 'review';
  content: string;
  target?: NavigationTarget;
  knowledge?: KnowledgeItem;
  culturalElement?: CulturalElement;
  shouldNavigate?: boolean;
  interactive?: boolean;
  actions?: AIAction[];
}

export interface AIAction {
  id: string;
  label: string;
  type: 'button' | 'link' | 'suggestion';
  action: string;
  data?: any;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isError?: boolean;
  metadata?: Record<string, any>;
}

// 文化相关意图模式
const CULTURAL_INTENT_PATTERNS = [
  { pattern: /杨柳青|年画|泥人张|风筝魏|煎饼果子|十八街|五大道/i, type: 'specific_element' },
  { pattern: /天津.*文化|天津.*特色|天津.*传统/i, type: 'culture_overview' },
  { pattern: /非遗|非物质文化遗产/i, type: 'intangible_heritage' },
  { pattern: /老字号|传统品牌/i, type: 'time_honored_brand' },
  { pattern: /怎么用.*文化|怎么融合.*元素|文化.*设计/i, type: 'usage_guide' },
  { pattern: /文化.*合规|文化.*禁忌|能不能用/i, type: 'compliance_check' },
  { pattern: /推荐.*文化|适合.*元素|用什么文化/i, type: 'recommendation' },
];

// 作品点评意图模式
const REVIEW_INTENT_PATTERNS = [
  { pattern: /点评.*作品|评价.*设计|分析.*作品/i, type: 'work_review' },
  { pattern: /这个.*怎么样|帮我.*看看|给.*建议/i, type: 'general_feedback' },
  { pattern: /优化.*建议|怎么改进|哪里.*不好/i, type: 'improvement' },
];

// 个性化推荐意图模式
const PERSONALIZATION_INTENT_PATTERNS = [
  { pattern: /推荐|建议|适合我|个性化/i, type: 'recommendation' },
  { pattern: /今日灵感|每日推荐|今天.*创作/i, type: 'daily_inspiration' },
  { pattern: /我的.*趋势|创作.*统计|数据分析/i, type: 'trend_analysis' },
  { pattern: /创作.*建议|怎么.*更好|提升.*技巧/i, type: 'creative_suggestion' },
];

class AIAssistantService {
  private currentConversationId: string | null = null;
  private isInitialized: boolean = false;

  /**
   * 初始化服务
   */
  async initialize(user?: User | null): Promise<void> {
    if (this.isInitialized && !user) return;

    // 获取当前用户（如果未传入）
    let currentUser = user;
    if (!currentUser) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      currentUser = authUser;
    }
    console.log('[aiAssistantService.initialize] 获取到的用户:', currentUser?.id || 'null');
    
    // 设置记忆服务的当前用户
    aiMemoryService.setCurrentUser(currentUser);
    console.log('[aiAssistantService.initialize] 已设置用户到 aiMemoryService');

    // 获取或创建活跃对话
    const conversation = await aiMemoryService.getActiveConversation();
    if (conversation) {
      this.currentConversationId = conversation.id;
    }

    this.isInitialized = true;
  }

  /**
   * 处理用户消息
   */
  async processMessage(
    message: string,
    currentPath: string,
    onTyping?: (text: string) => void
  ): Promise<AIResponse> {
    // 确保已初始化
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 1. 首先尝试知识库匹配（导航、操作指导等）
    const knowledgeResponse = await aiKnowledgeService.generateSmartResponse(message, currentPath);
    
    if (knowledgeResponse.type === 'navigation' && knowledgeResponse.target) {
      // 保存用户消息
      await this.saveMessage('user', message);
      
      // 保存助手回复
      await this.saveMessage('assistant', knowledgeResponse.content);
      
      return {
        type: 'navigation',
        content: knowledgeResponse.content,
        target: knowledgeResponse.target,
        shouldNavigate: true
      };
    }

    if (knowledgeResponse.type === 'guide' && knowledgeResponse.knowledge) {
      // 保存用户消息
      await this.saveMessage('user', message);
      
      // 保存助手回复
      await this.saveMessage('assistant', knowledgeResponse.content);
      
      return {
        type: 'guide',
        content: knowledgeResponse.content,
        knowledge: knowledgeResponse.knowledge
      };
    }

    // 2. 检查是否是文化相关查询
    const culturalResponse = await this.handleCulturalQuery(message);
    if (culturalResponse) {
      await this.saveMessage('user', message);
      await this.saveMessage('assistant', culturalResponse.content);
      return culturalResponse;
    }

    // 3. 检查是否是作品点评请求
    const reviewResponse = await this.handleReviewRequest(message);
    if (reviewResponse) {
      await this.saveMessage('user', message);
      await this.saveMessage('assistant', reviewResponse.content);
      return reviewResponse;
    }

    // 4. 检查是否是个性化推荐请求
    const personalizationResponse = await this.handlePersonalizationQuery(message);
    if (personalizationResponse) {
      await this.saveMessage('user', message);
      await this.saveMessage('assistant', personalizationResponse.content);
      return personalizationResponse;
    }

    // 5. 使用LLM生成回复
    return this.generateLLMResponse(message, currentPath, onTyping);
  }

  /**
   * 处理文化相关查询
   */
  private async handleCulturalQuery(message: string): Promise<AIResponse | null> {
    // 检测文化意图
    const intent = this.detectCulturalIntent(message);
    if (!intent) return null;

    switch (intent.type) {
      case 'culture_overview':
        return {
          type: 'cultural',
          content: culturalExpertService.getTianjinCultureOverview(),
          interactive: true,
          actions: [
            { id: 'explore_intangible', label: '探索非遗技艺', type: 'button', action: 'explore_intangible' },
            { id: 'explore_brands', label: '了解老字号', type: 'button', action: 'explore_brands' },
            { id: 'explore_architecture', label: '建筑文化', type: 'button', action: 'explore_architecture' }
          ]
        };

      case 'specific_element':
        // 提取文化元素名称
        const elementName = this.extractCulturalElementName(message);
        if (elementName) {
          const elements = await culturalExpertService.searchCulturalElements(elementName);
          if (elements.length > 0) {
            const element = elements[0];
            return {
              type: 'cultural',
              content: this.formatCulturalElementResponse(element),
              culturalElement: element,
              interactive: true,
              actions: [
                { id: 'usage_guide', label: '使用建议', type: 'button', action: 'usage_guide', data: element.id },
                { id: 'related_elements', label: '相关元素', type: 'button', action: 'related_elements', data: element.id },
                { id: 'fusion_suggestion', label: '融合建议', type: 'button', action: 'fusion_suggestion', data: element.id }
              ]
            };
          }
        }
        break;

      case 'intangible_heritage':
        const heritageElements = culturalExpertService.getElementsByType('intangible_heritage');
        return {
          type: 'cultural',
          content: `## 天津非物质文化遗产\n\n天津拥有丰富的非物质文化遗产，以下是主要的非遗技艺：\n\n${heritageElements.map(e => `### ${e.name}\n${e.description}\n`).join('\n')}`,
          interactive: true,
          actions: heritageElements.map(e => ({
            id: e.id,
            label: e.name,
            type: 'button',
            action: 'show_element',
            data: e.id
          }))
        };

      case 'time_honored_brand':
        const brandElements = culturalExpertService.getElementsByType('time_honored_brand');
        return {
          type: 'cultural',
          content: `## 天津老字号品牌\n\n天津老字号承载着城市的历史记忆：\n\n${brandElements.map(e => `### ${e.name}\n${e.description}\n`).join('\n')}`,
          interactive: true,
          actions: brandElements.map(e => ({
            id: e.id,
            label: e.name,
            type: 'button',
            action: 'show_element',
            data: e.id
          }))
        };

      case 'usage_guide':
        const usageElementName = this.extractCulturalElementName(message);
        if (usageElementName) {
          const usageElements = await culturalExpertService.searchCulturalElements(usageElementName);
          if (usageElements.length > 0) {
            const usageGuide = culturalExpertService.generateCulturalAdvice(
              usageElements[0].id,
              '设计创作'
            );
            return {
              type: 'cultural',
              content: usageGuide,
              interactive: false
            };
          }
        }
        break;

      case 'recommendation':
        // 解析设计需求
        const designType = this.extractDesignType(message);
        const style = this.extractStyle(message);
        const recommendations = culturalExpertService.recommendCulturalElements(
          designType,
          style,
          'general',
          3
        );
        if (recommendations.length > 0) {
          return {
            type: 'cultural',
            content: `## 为您推荐的文化元素\n\n根据您的${designType}设计需求，推荐以下天津文化元素：\n\n${recommendations.map((e, i) => `${i + 1}. **${e.name}** - ${e.description}\n   - 适用场景：${e.application_suggestions.slice(0, 2).join('、')}`).join('\n\n')}`,
            interactive: true,
            actions: recommendations.map(e => ({
              id: e.id,
              label: `了解${e.name}`,
              type: 'button',
              action: 'show_element',
              data: e.id
            }))
          };
        }
        break;
    }

    return null;
  }

  /**
   * 检测文化意图
   */
  private detectCulturalIntent(message: string): { type: string } | null {
    for (const pattern of CULTURAL_INTENT_PATTERNS) {
      if (pattern.pattern.test(message)) {
        return { type: pattern.type };
      }
    }
    return null;
  }

  /**
   * 提取文化元素名称
   */
  private extractCulturalElementName(message: string): string | null {
    const elementNames = ['杨柳青年画', '泥人张', '风筝魏', '煎饼果子', '十八街麻花', '五大道', '年画'];
    for (const name of elementNames) {
      if (message.includes(name)) {
        return name;
      }
    }
    return null;
  }

  /**
   * 提取设计类型
   */
  private extractDesignType(message: string): string {
    if (message.includes('春节') || message.includes('喜庆')) return '春节喜庆';
    if (message.includes('美食') || message.includes('餐饮')) return '美食餐饮';
    if (message.includes('建筑') || message.includes('城市')) return '建筑城市';
    if (message.includes('文创') || message.includes('产品')) return '文创产品';
    return '综合设计';
  }

  /**
   * 提取风格
   */
  private extractStyle(message: string): string {
    if (message.includes('传统') || message.includes('国潮')) return '传统国潮';
    if (message.includes('现代') || message.includes('简约')) return '现代简约';
    if (message.includes('欧式') || message.includes('复古')) return '欧式复古';
    return '综合风格';
  }

  /**
   * 格式化文化元素响应
   */
  private formatCulturalElementResponse(element: CulturalElement): string {
    let response = `## ${element.name}\n\n`;
    response += `${element.description}\n\n`;
    response += `**历史背景：** ${element.history}\n\n`;
    response += `**文化意义：** ${element.cultural_significance}\n\n`;
    response += `**核心特征：**\n`;
    element.characteristics.forEach(char => {
      response += `- ${char}\n`;
    });
    response += `\n**推荐配色：** ${element.color_palette.join('、')}\n`;
    response += `**视觉元素：** ${element.visual_elements.join('、')}\n`;
    
    return response;
  }

  /**
   * 处理作品点评请求
   */
  private async handleReviewRequest(message: string): Promise<AIResponse | null> {
    // 检测点评意图
    const intent = this.detectReviewIntent(message);
    if (!intent) return null;

    // 目前返回引导信息，实际点评功能需要作品数据
    return {
      type: 'review',
      content: `我可以帮您点评作品！请提供以下信息：\n\n1. **作品图片** - 上传您的设计作品\n2. **设计说明** - 简述您的设计理念和创作思路\n3. **目标用途** - 作品将用于什么场景（如：文创产品、海报、包装等）\n\n我会从以下维度为您分析：\n- 🎨 **美学表现** - 色彩搭配、构图、视觉效果\n- 🏛️ **文化契合度** - 与天津文化的融合程度\n- 💡 **创意性** - 创新程度和独特性\n- 📈 **商业潜力** - 市场应用价值和商业化建议\n\n请上传您的作品，我开始为您点评！`,
      interactive: true,
      actions: [
        { id: 'upload_work', label: '上传作品', type: 'button', action: 'upload_work' },
        { id: 'review_example', label: '查看示例点评', type: 'button', action: 'review_example' }
      ]
    };
  }

  /**
   * 检测点评意图
   */
  private detectReviewIntent(message: string): { type: string } | null {
    for (const pattern of REVIEW_INTENT_PATTERNS) {
      if (pattern.pattern.test(message)) {
        return { type: pattern.type };
      }
    }
    return null;
  }

  /**
   * 处理个性化推荐查询
   */
  private async handlePersonalizationQuery(message: string): Promise<AIResponse | null> {
    // 检测个性化意图
    const intent = this.detectPersonalizationIntent(message);
    if (!intent) return null;

    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        type: 'chat',
        content: '请先登录以获取个性化推荐！'
      };
    }

    switch (intent.type) {
      case 'daily_inspiration':
        const inspiration = await personalizationService.generateDailyInspiration(user.id);
        return {
          type: 'chat',
          content: inspiration,
          interactive: true,
          actions: [
            { id: 'start_create', label: '开始创作', type: 'button', action: 'upload_work' },
            { id: 'more_inspiration', label: '更多灵感', type: 'button', action: 'more_inspiration' }
          ]
        };

      case 'recommendation':
        const recommendations = await personalizationService.generateRecommendations(user.id, 5);
        if (recommendations.length > 0) {
          let content = '## 为您推荐 🎯\n\n';
          recommendations.forEach((rec, index) => {
            content += `${index + 1}. **${rec.title}**\n`;
            content += `   ${rec.description}\n`;
            content += `   💡 ${rec.reason}\n\n`;
          });
          return {
            type: 'chat',
            content,
            interactive: true,
            actions: recommendations.slice(0, 3).map(rec => ({
              id: rec.id,
              label: rec.title,
              type: 'button',
              action: 'show_recommendation',
              data: rec
            }))
          };
        }
        break;

      case 'trend_analysis':
        const trends = await personalizationService.getCreativeTrends(user.id);
        let trendContent = '## 您的创作趋势分析 📊\n\n';
        trendContent += `**作品总数：** ${trends.totalWorks} 件\n\n`;
        if (trends.favoriteElements.length > 0) {
          trendContent += `**常用文化元素：** ${trends.favoriteElements.join('、')}\n\n`;
        }
        trendContent += `**创作建议：**\n`;
        trends.suggestions.forEach(suggestion => {
          trendContent += `- ${suggestion}\n`;
        });
        return {
          type: 'chat',
          content: trendContent,
          interactive: false
        };

      case 'creative_suggestion':
        const suggestions = await personalizationService.generateCreativeSuggestions(user.id, message);
        if (suggestions.length > 0) {
          let suggestionContent = '## 创作建议 💡\n\n';
          suggestions.forEach((suggestion, index) => {
            suggestionContent += `${index + 1}. **${suggestion.suggestion}**\n`;
            suggestionContent += `   理由：${suggestion.reason}\n`;
            suggestionContent += `   置信度：${Math.round(suggestion.confidence * 100)}%\n\n`;
          });
          return {
            type: 'chat',
            content: suggestionContent,
            interactive: false
          };
        }
        break;
    }

    return null;
  }

  /**
   * 检测个性化意图
   */
  private detectPersonalizationIntent(message: string): { type: string } | null {
    for (const pattern of PERSONALIZATION_INTENT_PATTERNS) {
      if (pattern.pattern.test(message)) {
        return { type: pattern.type };
      }
    }
    return null;
  }

  /**
   * 生成作品点评
   */
  async generateWorkReview(
    workDescription: string,
    designPrompt?: string,
    culturalElements?: string[]
  ): Promise<AIResponse> {
    try {
      // 构建点评提示词
      const reviewPrompt = this.buildReviewPrompt(workDescription, designPrompt, culturalElements);
      
      // 调用LLM生成点评
      const reviewResponse = await llmService.directGenerateResponse(reviewPrompt);
      
      return {
        type: 'review',
        content: reviewResponse,
        interactive: true,
        actions: [
          { id: 'improve_suggestions', label: '获取优化建议', type: 'button', action: 'improve_suggestions' },
          { id: 'cultural_fusion', label: '文化融合建议', type: 'button', action: 'cultural_fusion' },
          { id: 'commercial_analysis', label: '商业潜力分析', type: 'button', action: 'commercial_analysis' }
        ]
      };
    } catch (error) {
      console.error('作品点评生成失败:', error);
      return {
        type: 'error',
        content: '抱歉，作品点评生成失败，请稍后再试。'
      };
    }
  }

  /**
   * 构建点评提示词
   */
  private buildReviewPrompt(
    workDescription: string,
    designPrompt?: string,
    culturalElements?: string[]
  ): string {
    let prompt = `请作为专业的艺术评论家和设计顾问，对以下作品进行全方位点评。\n\n`;
    prompt += `**作品描述：** ${workDescription}\n\n`;
    
    if (designPrompt) {
      prompt += `**设计提示词：** ${designPrompt}\n\n`;
    }
    
    if (culturalElements && culturalElements.length > 0) {
      prompt += `**使用的文化元素：** ${culturalElements.join('、')}\n\n`;
    }

    prompt += `请从以下维度进行分析，并以Markdown格式返回：\n\n`;
    prompt += `## 总体评价\n（简要概括作品的整体印象）\n\n`;
    prompt += `## 详细评分（满分100分）\n`;
    prompt += `- **美学表现**（0-100分）：色彩搭配、构图、视觉效果\n`;
    prompt += `- **文化契合度**（0-100分）：文化元素的运用是否恰当\n`;
    prompt += `- **创意性**（0-100分）：创新程度和独特性\n`;
    prompt += `- **技术执行**（0-100分）：设计技巧和完成度\n`;
    prompt += `- **商业潜力**（0-100分）：市场应用价值\n\n`;
    prompt += `## 亮点分析\n（指出作品的优点和特色）\n\n`;
    prompt += `## 改进建议\n（提供具体的优化方向和建议）\n\n`;
    prompt += `## 应用场景推荐\n（建议适合的应用场景和用途）\n\n`;
    prompt += `请给出专业、客观、建设性的评价。`;

    return prompt;
  }

  /**
   * 使用LLM生成回复
   */
  private async generateLLMResponse(
    message: string,
    currentPath: string,
    onTyping?: (text: string) => void
  ): Promise<AIResponse> {
    try {
      // 保存用户消息到数据库
      await this.saveMessage('user', message);

      // 获取记忆上下文
      const memoryContext = await aiMemoryService.generateMemoryContext();

      // 构建增强的提示词
      const enhancedPrompt = this.buildEnhancedPrompt(message, currentPath, memoryContext);

      // 调用LLM，支持流式输出
      const response = await llmService.directGenerateResponse(enhancedPrompt, {
        context: {
          page: this.getPageName(currentPath),
          path: currentPath,
          hasMemory: memoryContext.length > 0
        },
        onDelta: onTyping
      });

      // 保存助手回复
      await this.saveMessage('assistant', response);

      // 提取记忆
      await this.extractMemoriesFromConversation();

      return {
        type: 'chat',
        content: response
      };
    } catch (error) {
      console.error('LLM响应生成失败:', error);
      
      const errorMessage = '抱歉，我暂时无法回答您的问题。请稍后再试或联系客服。';
      await this.saveMessage('assistant', errorMessage, true);
      
      return {
        type: 'error',
        content: errorMessage
      };
    }
  }

  /**
   * 构建增强的提示词
   */
  private buildEnhancedPrompt(message: string, currentPath: string, memoryContext: string): string {
    let prompt = message;

    // 添加页面上下文
    const pageName = this.getPageName(currentPath);
    if (pageName) {
      prompt += `\n\n[当前页面: ${pageName}]`;
    }

    // 添加记忆上下文
    if (memoryContext) {
      prompt += memoryContext;
    }

    // 添加文化专家角色提示和格式说明
    prompt += `\n\n[角色提示：你是津小脉，津脉智坊平台的AI助手，专注于天津传统文化创作与设计。你可以为用户提供文化知识、设计建议、作品点评等服务。]`;
    
    // 添加 Markdown 表格格式说明
    prompt += `\n\n[格式提示：如果需要使用表格，请使用标准的 Markdown 表格格式。表格使用 | 作为列分隔符，使用 |---| 作为表头分隔符。例如：
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |
| 数据4 | 数据5 | 数据6 |
不要使用 ||| 或其他非标准格式。]`;

    return prompt;
  }

  /**
   * 获取页面名称
   */
  private getPageName(path: string): string {
    const pageNames: Record<string, string> = {
      '/': '首页',
      '/create': '创作中心',
      '/creation-workshop': '创作工坊',
      '/square': '津脉广场',
      '/cultural-knowledge': '文化知识',
      '/marketplace': '文创市集',
      '/my-works': '我的作品',
      '/neo': '灵感引擎',
      '/dashboard': '仪表盘',
      '/settings': '设置',
      '/profile': '个人中心',
      '/explore': '探索',
      '/cultural-events': '文化活动',
      '/notifications': '消息通知',
      '/help': '帮助中心',
      '/about': '关于我们',
      '/tianjin': '天津特色',
      '/leaderboard': '排行榜',
      '/news': '新闻资讯',
      '/wizard': '共创向导',
    };

    return pageNames[path] || '未知页面';
  }

  /**
   * 保存消息
   */
  async saveMessage(
    role: 'user' | 'assistant' | 'system',
    content: string,
    isError: boolean = false,
    metadata?: Record<string, any>
  ): Promise<void> {
    console.log('[aiAssistantService.saveMessage] 开始保存消息:', { role, conversationId: this.currentConversationId });
    
    // 验证 currentConversationId 是否有效
    if (!this.currentConversationId || typeof this.currentConversationId !== 'string') {
      console.log('[aiAssistantService.saveMessage] 当前会话ID无效，尝试获取活跃对话');
      const conversation = await aiMemoryService.getActiveConversation();
      if (conversation?.id) {
        this.currentConversationId = conversation.id;
        console.log('[aiAssistantService.saveMessage] 获取到活跃对话:', conversation.id);
      } else {
        console.error('[aiAssistantService.saveMessage] 无法获取活跃对话，取消保存');
        return;
      }
    }

    // 再次验证 currentConversationId
    if (!this.currentConversationId || typeof this.currentConversationId !== 'string') {
      console.error('[aiAssistantService.saveMessage] 会话ID仍然无效，无法保存消息');
      return;
    }

    try {
      await aiMemoryService.saveMessage(this.currentConversationId, role, content, isError, metadata);
      console.log('[aiAssistantService.saveMessage] 消息保存成功');
    } catch (error) {
      console.error('[aiAssistantService.saveMessage] 保存消息失败:', error);
      throw error;
    }
  }

  /**
   * 从对话中提取记忆
   */
  private async extractMemoriesFromConversation(): Promise<void> {
    if (!this.currentConversationId || typeof this.currentConversationId !== 'string') {
      console.warn('[aiAssistantService.extractMemoriesFromConversation] 没有有效的对话ID');
      return;
    }

    const messages = await aiMemoryService.getConversationMessages(this.currentConversationId, 10);
    await aiMemoryService.extractAndSaveMemories(this.currentConversationId, messages);
  }

  /**
   * 获取对话历史
   */
  async getConversationHistory(): Promise<ChatMessage[]> {
    // 如果没有当前对话ID，尝试获取活跃对话
    if (!this.currentConversationId) {
      const conversation = await aiMemoryService.getActiveConversation();
      if (conversation?.id) {
        this.currentConversationId = conversation.id;
      } else {
        console.warn('[aiAssistantService.getConversationHistory] 没有可用的对话ID');
        return [];
      }
    }

    // 确保 currentConversationId 是有效的字符串
    if (typeof this.currentConversationId !== 'string' || this.currentConversationId.trim() === '') {
      console.warn('[aiAssistantService.getConversationHistory] 对话ID无效:', this.currentConversationId);
      return [];
    }

    const messages = await aiMemoryService.getConversationMessages(this.currentConversationId, 50);
    
    return messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp).getTime(),
      isError: m.is_error,
      metadata: m.metadata
    }));
  }

  /**
   * 获取预设问题
   */
  async getPresetQuestions(currentPath: string): Promise<string[]> {
    const baseQuestions = await aiKnowledgeService.getContextualQuestions(currentPath);
    
    // 添加文化相关问题
    const culturalQuestions = [
      '天津有哪些非遗文化？',
      '杨柳青年画怎么用？',
      '帮我推荐适合的文化元素',
      '点评一下我的作品'
    ];

    // 根据当前页面调整问题
    if (currentPath === '/create' || currentPath === '/creation-workshop') {
      return [
        '如何融合天津文化元素？',
        '推荐适合的文化素材',
        '这个设计用什么配色好？',
        ...baseQuestions.slice(0, 2)
      ];
    }

    if (currentPath === '/cultural-knowledge') {
      return [
        '天津有哪些老字号？',
        '非遗技艺有哪些？',
        '五大道有什么特色？',
        ...baseQuestions.slice(0, 2)
      ];
    }

    return [...baseQuestions.slice(0, 3), ...culturalQuestions.slice(0, 2)];
  }

  /**
   * 创建新对话
   */
  async createNewConversation(): Promise<void> {
    const conversation = await aiMemoryService.createConversation();
    if (conversation) {
      this.currentConversationId = conversation.id;
    }
  }

  /**
   * 切换对话
   */
  async switchConversation(conversationId: string): Promise<Conversation | null> {
    const conversation = await aiMemoryService.switchConversation(conversationId);
    if (conversation) {
      this.currentConversationId = conversation.id;
    }
    return conversation;
  }

  /**
   * 设置当前对话ID
   */
  setCurrentConversationId(conversationId: string | null): void {
    this.currentConversationId = conversationId;
  }

  /**
   * 获取所有对话
   */
  async getAllConversations(): Promise<Conversation[]> {
    return aiMemoryService.getConversations(20);
  }

  /**
   * 删除对话
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    return aiMemoryService.deleteConversation(conversationId);
  }

  /**
   * 重命名对话
   */
  async renameConversation(conversationId: string, newTitle: string): Promise<boolean> {
    return aiMemoryService.renameConversation(conversationId, newTitle);
  }

  /**
   * 清空当前对话
   */
  async clearCurrentConversation(): Promise<void> {
    if (!this.currentConversationId) return;
    
    // 删除当前对话
    await this.deleteConversation(this.currentConversationId);
    
    // 创建新对话
    await this.createNewConversation();
  }

  /**
   * 删除所有对话
   */
  async deleteAllConversations(): Promise<boolean> {
    const result = await aiMemoryService.deleteAllConversations();
    if (result) {
      this.currentConversationId = null;
    }
    return result;
  }

  /**
   * 更新消息反馈
   */
  async submitFeedback(messageId: string, rating: number, comment?: string): Promise<boolean> {
    return aiMemoryService.updateMessageFeedback(messageId, rating, comment);
  }

  /**
   * 获取用户画像
   */
  async getUserProfile() {
    return aiMemoryService.getUserProfile();
  }

  /**
   * 导出用户数据
   */
  async exportUserData() {
    return aiMemoryService.exportUserData();
  }

  /**
   * 识别导航意图
   */
  recognizeNavigation(message: string): NavigationTarget | null {
    return aiKnowledgeService.recognizeNavigationIntent(message);
  }

  /**
   * 获取文化元素详情
   */
  getCulturalElement(elementId: string) {
    return culturalExpertService.getCulturalElementById(elementId);
  }

  /**
   * 生成文化使用建议
   */
  generateCulturalAdvice(elementId: string, scenario: string): string {
    return culturalExpertService.generateCulturalAdvice(elementId, scenario);
  }

  /**
   * 推荐文化元素
   */
  recommendCulturalElements(designType: string, style: string, targetAudience: string = 'general', limit: number = 3) {
    return culturalExpertService.recommendCulturalElements(designType, style, targetAudience, limit);
  }
}

// 导出单例实例
export const aiAssistantService = new AIAssistantService();
