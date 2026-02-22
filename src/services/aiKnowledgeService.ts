/**
 * AI平台知识库服务
 * 提供平台功能导航、操作指导等知识查询
 */

import { supabase } from '@/lib/supabase';

// 知识库条目类型
export interface KnowledgeItem {
  id: string;
  category: 'navigation' | 'operation' | 'feature' | 'guide' | 'faq';
  question: string;
  answer: string;
  related_pages: string[];
  keywords: string[];
  steps: KnowledgeStep[];
  priority: number;
  similarity?: number;
}

// 操作步骤类型
export interface KnowledgeStep {
  step: number;
  action: string;
  detail: string;
}

// 导航目标类型
export interface NavigationTarget {
  path: string;
  name: string;
  description?: string;
  params?: Record<string, any>;
}

// 扩展的页面导航映射
const PAGE_NAVIGATION_MAP: Record<string, NavigationTarget> = {
  // 主要页面
  '首页': { path: '/', name: '首页', description: '平台首页，展示推荐内容和热门作品' },
  'home': { path: '/', name: '首页', description: '平台首页，展示推荐内容和热门作品' },
  
  '创作中心': { path: '/create', name: '创作中心', description: '开始您的创作之旅' },
  '创作': { path: '/create', name: '创作中心', description: '开始您的创作之旅' },
  'create': { path: '/create', name: '创作中心', description: '开始您的创作之旅' },
  
  '创作工坊': { path: '/creation-workshop', name: '创作工坊', description: '使用各种创作工具和模板' },
  'workshop': { path: '/creation-workshop', name: '创作工坊', description: '使用各种创作工具和模板' },
  
  '津脉广场': { path: '/square', name: '津脉广场', description: '发现热门作品和创作者' },
  '广场': { path: '/square', name: '津脉广场', description: '发现热门作品和创作者' },
  'square': { path: '/square', name: '津脉广场', description: '发现热门作品和创作者' },
  '社区': { path: '/square', name: '津脉广场', description: '发现热门作品和创作者' },
  
  '文化知识': { path: '/cultural-knowledge', name: '文化知识', description: '探索传统文化和非遗知识' },
  '知识': { path: '/cultural-knowledge', name: '文化知识', description: '探索传统文化和非遗知识' },
  'knowledge': { path: '/cultural-knowledge', name: '文化知识', description: '探索传统文化和非遗知识' },
  
  '文创市集': { path: '/marketplace', name: '文创市集', description: '购买和销售文创产品' },
  '市集': { path: '/marketplace', name: '文创市集', description: '购买和销售文创产品' },
  'market': { path: '/marketplace', name: '文创市集', description: '购买和销售文创产品' },
  '商城': { path: '/marketplace', name: '文创市集', description: '购买和销售文创产品' },
  
  '我的作品': { path: '/my-works', name: '我的作品', description: '管理和查看您的创作' },
  '作品': { path: '/my-works', name: '我的作品', description: '管理和查看您的创作' },
  'works': { path: '/my-works', name: '我的作品', description: '管理和查看您的创作' },
  
  '灵感引擎': { path: '/neo', name: '灵感引擎', description: 'AI驱动的创意辅助工具' },
  '灵感': { path: '/neo', name: '灵感引擎', description: 'AI驱动的创意辅助工具' },
  'neo': { path: '/neo', name: '灵感引擎', description: 'AI驱动的创意辅助工具' },
  
  '仪表盘': { path: '/dashboard', name: '仪表盘', description: '查看创作数据和统计' },
  '数据': { path: '/dashboard', name: '仪表盘', description: '查看创作数据和统计' },
  '统计': { path: '/dashboard', name: '仪表盘', description: '查看创作数据和统计' },
  'dashboard': { path: '/dashboard', name: '仪表盘', description: '查看创作数据和统计' },
  
  '设置': { path: '/settings', name: '设置', description: '管理账户和偏好设置' },
  '个人设置': { path: '/settings', name: '设置', description: '管理账户和偏好设置' },
  'settings': { path: '/settings', name: '设置', description: '管理账户和偏好设置' },
  
  '个人中心': { path: '/profile', name: '个人中心', description: '查看和编辑个人资料' },
  '个人资料': { path: '/profile', name: '个人中心', description: '查看和编辑个人资料' },
  'profile': { path: '/profile', name: '个人中心', description: '查看和编辑个人资料' },
  
  '探索': { path: '/explore', name: '探索', description: '发现更多有趣内容' },
  '发现': { path: '/explore', name: '探索', description: '发现更多有趣内容' },
  'explore': { path: '/explore', name: '探索', description: '发现更多有趣内容' },
  
  '活动': { path: '/cultural-events', name: '文化活动', description: '参与平台活动' },
  '文化活动': { path: '/cultural-events', name: '文化活动', description: '参与平台活动' },
  'events': { path: '/cultural-events', name: '文化活动', description: '参与平台活动' },
  
  '消息': { path: '/notifications', name: '消息通知', description: '查看系统消息和通知' },
  '通知': { path: '/notifications', name: '消息通知', description: '查看系统消息和通知' },
  'notifications': { path: '/notifications', name: '消息通知', description: '查看系统消息和通知' },
  
  '帮助': { path: '/help', name: '帮助中心', description: '获取使用帮助' },
  '帮助中心': { path: '/help', name: '帮助中心', description: '获取使用帮助' },
  'help': { path: '/help', name: '帮助中心', description: '获取使用帮助' },
  
  '关于': { path: '/about', name: '关于我们', description: '了解平台和团队' },
  '关于我们': { path: '/about', name: '关于我们', description: '了解平台和团队' },
  'about': { path: '/about', name: '关于我们', description: '了解平台和团队' },
  
  // 特色页面
  '天津': { path: '/tianjin', name: '天津特色', description: '探索天津本地文化' },
  '天津特色': { path: '/tianjin', name: '天津特色', description: '探索天津本地文化' },
  'tianjin': { path: '/tianjin', name: '天津特色', description: '探索天津本地文化' },
  
  '排行榜': { path: '/leaderboard', name: '排行榜', description: '查看热门创作者和作品' },
  '榜单': { path: '/leaderboard', name: '排行榜', description: '查看热门创作者和作品' },
  'leaderboard': { path: '/leaderboard', name: '排行榜', description: '查看热门创作者和作品' },
  
  '新闻': { path: '/news', name: '新闻资讯', description: '了解平台动态和行业资讯' },
  '资讯': { path: '/news', name: '新闻资讯', description: '了解平台动态和行业资讯' },
  'news': { path: '/news', name: '新闻资讯', description: '了解平台动态和行业资讯' },
  
  '共创向导': { path: '/wizard', name: '共创向导', description: '引导式创作体验' },
  '向导': { path: '/wizard', name: '共创向导', description: '引导式创作体验' },
  'wizard': { path: '/wizard', name: '共创向导', description: '引导式创作体验' },
};

// 模糊匹配关键词
const FUZZY_MATCH_PATTERNS: Record<string, string[]> = {
  '创作中心': ['创作', '新建', '开始创作', '我要创作', '写文章', '做设计', '生成'],
  '津脉广场': ['广场', '社区', '看看', '逛逛', '热门', '大家都在看', '发现'],
  '文创市集': ['买东西', '购物', '商品', '产品', '买', '卖', '商店'],
  '我的作品': ['我的', '作品', '我发布的', '我创建的', '管理'],
  '灵感引擎': ['灵感', '创意', '帮我写', '帮我生成', 'AI', '智能'],
  '文化知识': ['文化', '知识', '学习', '了解', '非遗', '传统'],
  '设置': ['设置', '配置', '修改', '换头像', '改密码', '偏好'],
};

class AIKnowledgeService {
  private cache: Map<string, { data: KnowledgeItem[]; timestamp: number }> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 从数据库搜索知识库
   */
  async searchKnowledge(query: string, category?: string, limit: number = 5): Promise<KnowledgeItem[]> {
    try {
      // 检查缓存
      const cacheKey = `${query}_${category}_${limit}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }

      const { data, error } = await supabase
        .rpc('search_platform_knowledge', {
          p_query: query,
          p_category: category || null,
          p_limit: limit
        });

      if (error) {
        console.error('搜索知识库失败:', error);
        return [];
      }

      const results = (data || []).map(item => ({
        ...item,
        steps: item.steps || []
      })) as KnowledgeItem[];

      // 更新缓存
      this.cache.set(cacheKey, { data: results, timestamp: Date.now() });

      return results;
    } catch (error) {
      console.error('搜索知识库异常:', error);
      return [];
    }
  }

  /**
   * 智能识别导航意图
   */
  recognizeNavigationIntent(message: string): NavigationTarget | null {
    const lowerMessage = message.toLowerCase();
    
    // 1. 精确匹配
    for (const [keyword, target] of Object.entries(PAGE_NAVIGATION_MAP)) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return target;
      }
    }

    // 2. 模糊匹配
    for (const [page, patterns] of Object.entries(FUZZY_MATCH_PATTERNS)) {
      for (const pattern of patterns) {
        if (lowerMessage.includes(pattern.toLowerCase())) {
          const target = PAGE_NAVIGATION_MAP[page];
          if (target) return target;
        }
      }
    }

    // 3. 意图识别关键词
    const navigationPatterns = [
      { pattern: /去.*?(?:页面|地方)/, extract: (m: string) => this.extractPageFromMessage(m) },
      { pattern: /到.*?(?:页面|地方)/, extract: (m: string) => this.extractPageFromMessage(m) },
      { pattern: /打开.*?页面/, extract: (m: string) => this.extractPageFromMessage(m) },
      { pattern: /跳转到/, extract: (m: string) => this.extractPageFromMessage(m) },
      { pattern: /(?:怎么|如何).*?(?:去|到|进入)/, extract: (m: string) => this.extractPageFromMessage(m) },
      { pattern: /(?:我想|我要).*?(?:看|找|去)/, extract: (m: string) => this.extractPageFromMessage(m) },
    ];

    for (const { pattern, extract } of navigationPatterns) {
      if (pattern.test(lowerMessage)) {
        const extracted = extract(message);
        if (extracted) return extracted;
      }
    }

    return null;
  }

  /**
   * 从消息中提取页面
   */
  private extractPageFromMessage(message: string): NavigationTarget | null {
    const lowerMessage = message.toLowerCase();
    
    for (const [keyword, target] of Object.entries(PAGE_NAVIGATION_MAP)) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return target;
      }
    }
    
    return null;
  }

  /**
   * 获取操作指导
   */
  async getOperationGuide(operation: string): Promise<KnowledgeItem | null> {
    const results = await this.searchKnowledge(operation, 'operation', 1);
    return results[0] || null;
  }

  /**
   * 获取功能介绍
   */
  async getFeatureGuide(feature: string): Promise<KnowledgeItem | null> {
    const results = await this.searchKnowledge(feature, 'feature', 1);
    return results[0] || null;
  }

  /**
   * 获取新手指南
   */
  async getBeginnerGuide(): Promise<KnowledgeItem[]> {
    return this.searchKnowledge('新手', 'guide', 3);
  }

  /**
   * 获取FAQ
   */
  async getFAQ(question: string): Promise<KnowledgeItem | null> {
    const results = await this.searchKnowledge(question, 'faq', 1);
    return results[0] || null;
  }

  /**
   * 格式化知识为回复文本
   */
  formatKnowledgeResponse(knowledge: KnowledgeItem): string {
    let response = `${knowledge.answer}\n\n`;

    // 添加步骤
    if (knowledge.steps && knowledge.steps.length > 0) {
      response += '**操作步骤：**\n';
      knowledge.steps.forEach((step, index) => {
        response += `${index + 1}. **${step.action}**\n   ${step.detail}\n`;
      });
      response += '\n';
    }

    // 添加相关页面链接提示
    if (knowledge.related_pages && knowledge.related_pages.length > 0) {
      const pageNames = knowledge.related_pages.map(path => {
        const target = Object.values(PAGE_NAVIGATION_MAP).find(t => t.path === path);
        return target ? target.name : path;
      });
      response += `📍 相关页面：${pageNames.join('、')}\n`;
    }

    return response.trim();
  }

  /**
   * 生成导航回复
   */
  generateNavigationResponse(target: NavigationTarget): string {
    let response = `正在为您跳转到「${target.name}」`;
    
    if (target.description) {
      response += ` - ${target.description}`;
    }
    
    response += '...';
    return response;
  }

  /**
   * 检测是否是创作/生成相关的询问
   */
  private isCreationQuery(message: string): boolean {
    const creationPatterns = [
      '如何创作', '怎么创作', '如何生成', '怎么生成',
      '如何画图', '怎么画图', '如何画画', '怎么画画',
      '怎么使用', '如何使用', '怎么用', '怎么用ai',
      '怎么生成图片', '如何生成图片', '怎么生成图',
      '想创作', '想生成', '想画图', '想画画'
    ];
    const lowerMessage = message.toLowerCase();
    return creationPatterns.some(pattern => lowerMessage.includes(pattern));
  }

  /**
   * 生成移动端直接创作指导回复
   */
  private generateMobileCreationGuide(): string {
    return `**🎨 您可以直接在这里生成图片！**

只需要告诉我您想要什么，例如：
• "生成一张天津海河夜景图"
• "画一幅杨柳青年画风格的福字"
• "生成国潮风格的天津美食海报"
• "帮我生成一张五大道建筑插画"

**💡 提示技巧：**
1. 描述越详细，效果越好
2. 可以指定风格（国潮、水墨、油画等）
3. 可以融入天津文化元素（杨柳青年画、泥人张、风筝魏等）

请直接告诉我您想生成什么图片，我马上为您创作！`;
  }

  /**
   * 智能回复生成
   * 根据用户消息生成合适的回复，包括导航、指导等
   */
  async generateSmartResponse(message: string, currentPath: string): Promise<{
    type: 'navigation' | 'guide' | 'general' | 'unknown';
    content: string;
    target?: NavigationTarget;
    knowledge?: KnowledgeItem;
  }> {
    // 检查是否是移动端AI助手页面
    const isMobileAIAssistant = currentPath === '/ai-assistant-mobile' || currentPath === '/ai-assistant';

    // 1. 检查是否是导航意图
    const navTarget = this.recognizeNavigationIntent(message);
    if (navTarget) {
      // 如果已经在目标页面
      if (currentPath === navTarget.path) {
        return {
          type: 'guide',
          content: `您当前已经在「${navTarget.name}」页面了。${navTarget.description ? '\n\n' + navTarget.description : ''}\n\n有什么我可以帮您的吗？`
        };
      }

      // 移动端AI助手页面：如果是创作相关的询问，不跳转，直接提供指导
      if (isMobileAIAssistant && navTarget.path === '/create' && this.isCreationQuery(message)) {
        return {
          type: 'guide',
          content: this.generateMobileCreationGuide()
        };
      }

      return {
        type: 'navigation',
        content: this.generateNavigationResponse(navTarget),
        target: navTarget
      };
    }

    // 移动端AI助手页面：如果是创作相关的询问但没有匹配到导航，也提供指导
    if (isMobileAIAssistant && this.isCreationQuery(message)) {
      return {
        type: 'guide',
        content: this.generateMobileCreationGuide()
      };
    }

    // 2. 搜索知识库
    const knowledge = await this.searchKnowledge(message, undefined, 1);
    if (knowledge.length > 0 && knowledge[0].similarity && knowledge[0].similarity > 0.6) {
      return {
        type: 'guide',
        content: this.formatKnowledgeResponse(knowledge[0]),
        knowledge: knowledge[0]
      };
    }

    // 3. 无法识别意图
    return {
      type: 'unknown',
      content: '抱歉，我不太理解您的需求。您可以问我：\n- 如何进入创作中心\n- 津脉广场在哪里\n- 如何发布作品\n- 或者任何关于平台功能的问题'
    };
  }

  /**
   * 获取页面上下文相关的预设问题
   */
  async getContextualQuestions(currentPath: string): Promise<string[]> {
    const questions: string[] = [];

    // 根据当前页面获取相关问题
    switch (currentPath) {
      case '/':
        questions.push('如何开始创作？', '津脉广场在哪里？', '如何参与文化活动？');
        break;
      case '/create':
      case '/creation-workshop':
        questions.push('如何使用AI生成？', '如何保存草稿？', '如何发布作品？');
        break;
      case '/square':
        questions.push('如何关注创作者？', '如何点赞作品？', '如何提高我的作品曝光？');
        break;
      case '/marketplace':
        questions.push('如何购买商品？', '如何成为卖家？', '如何查看订单？');
        break;
      case '/my-works':
        questions.push('如何编辑作品？', '如何删除作品？', '如何查看作品数据？');
        break;
      case '/cultural-knowledge':
        questions.push('有哪些文化分类？', '如何收藏知识？', '如何分享文化内容？');
        break;
      case '/neo':
        questions.push('如何获得灵感？', 'AI能帮我做什么？', '如何保存灵感？');
        break;
      case '/settings':
        questions.push('如何修改密码？', '如何绑定手机？', '如何设置隐私？');
        break;
      default:
        questions.push('这个平台有什么功能？', '如何快速上手？', '如何联系客服？');
    }

    // 添加通用问题
    questions.push('如何获得积分？', '忘记密码怎么办？');

    return questions.slice(0, 5);
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// 导出单例实例
export const aiKnowledgeService = new AIKnowledgeService();
