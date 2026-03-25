/**
 * 意图分析器
 * 智能识别用户意图，支持多层级分析和上下文感知
 */

import { AgentType } from '../types/agent';

export interface IntentAnalysis {
  primaryIntent: 'generate' | 'consult' | 'modify' | 'compare' | 'confirm' | 'greeting' | 'unknown';
  secondaryIntent?: string;
  designType?: 'ip-character' | 'brand' | 'packaging' | 'poster' | 'illustration' | 'animation' | 'logo' | 'other';
  urgency: 'high' | 'medium' | 'low';
  complexity: 'simple' | 'moderate' | 'complex';
  userMood: 'excited' | 'curious' | 'frustrated' | 'neutral' | 'satisfied';
  confidence: number;
  suggestedAgent?: AgentType;
  shouldSkipSteps: boolean;
  requiredInfo: string[];
  suggestedActions: string[];
}

export interface ConversationContext {
  history: { role: string; content: string; timestamp: number }[];
  currentAgent: AgentType;
  selectedStyle?: string;
  userPreferences?: UserPreferences;
  lastDesignType?: string;
}

export interface UserPreferences {
  preferredStyles: string[];
  preferredColors: string[];
  preferredAgents: AgentType[];
  commonDesignTypes: string[];
}

export class IntentAnalyzer {
  private context: ConversationContext | null = null;

  setContext(context: ConversationContext) {
    this.context = context;
  }

  /**
   * 分析用户消息意图
   */
  analyze(message: string): IntentAnalysis {
    const lowerMsg = message.toLowerCase().trim();
    
    // 基础意图识别
    const primaryIntent = this.detectPrimaryIntent(lowerMsg);
    
    // 设计类型识别
    const designType = this.detectDesignType(lowerMsg);
    
    // 复杂度评估
    const complexity = this.assessComplexity(lowerMsg);
    
    // 紧急程度评估
    const urgency = this.assessUrgency(lowerMsg);
    
    // 情绪分析
    const userMood = this.analyzeMood(lowerMsg);
    
    // 置信度计算
    const confidence = this.calculateConfidence(lowerMsg, primaryIntent, designType);
    
    // 推荐 Agent
    const suggestedAgent = this.suggestAgent(primaryIntent, designType);
    
    // 判断是否需要跳过步骤
    const shouldSkipSteps = this.shouldSkipSteps(lowerMsg, complexity);
    
    // 识别还需要的信息
    const requiredInfo = this.identifyRequiredInfo(primaryIntent, designType, lowerMsg);
    
    // 建议的行动
    const suggestedActions = this.suggestActions(primaryIntent, designType, complexity);

    return {
      primaryIntent,
      secondaryIntent: this.detectSecondaryIntent(lowerMsg),
      designType,
      urgency,
      complexity,
      userMood,
      confidence,
      suggestedAgent,
      shouldSkipSteps,
      requiredInfo,
      suggestedActions
    };
  }

  /**
   * 检测主要意图
   */
  private detectPrimaryIntent(message: string): IntentAnalysis['primaryIntent'] {
    // 问候意图
    if (/^(你好|您好|hello|hi|hey|在吗|在不在)/.test(message)) {
      return 'greeting';
    }

    // 生成意图
    if (/(生成|画|设计|创建|制作|绘制|创作|来张|来个|给我|帮我).*(图|画|logo|海报|形象|角色|包装|品牌)/.test(message) ||
        /^(画|生成|设计|创建).*(一个|个|张|幅|下)/.test(message)) {
      return 'generate';
    }

    // 修改意图
    if (/(修改|调整|改|换|变|优化|完善|改进|美化|精致|好看|不对|不太|差点)/.test(message)) {
      return 'modify';
    }

    // 咨询意图
    if (/(建议|推荐|咨询|问问|了解|介绍|说明|解释|怎么|如何|什么|哪些|能否|可以|吗？)/.test(message) ||
        /^(你|你们).*(能|可以|会|有)/.test(message)) {
      return 'consult';
    }

    // 比较意图
    if (/(比较|对比|哪个|区别|差异|选择|选|还是)/.test(message)) {
      return 'compare';
    }

    // 确认意图
    if (/^(确认|确定|是的|对|没错|好|好的|ok|yes|可以|行|开始|生成吧|画吧)/.test(message) ||
        /^(就|那就).*(这样|这个|这款)/.test(message)) {
      return 'confirm';
    }

    return 'unknown';
  }

  /**
   * 检测次要意图
   */
  private detectSecondaryIntent(message: string): string | undefined {
    const intents: Record<string, RegExp> = {
      'urgent': /(急|紧急|尽快|马上|立刻|现在|今天|明天)/,
      'casual': /(随便|随意|看着办|你决定|你选)/,
      'specific': /(具体|详细|精确|准确|明确)/,
      'creative': /(创意|创新|独特|特别|与众不同|新颖)/,
      'simple': /(简单|简洁|简约|干净|清爽)/,
      'complex': /(复杂|丰富|详细|精致|华丽|炫酷)/
    };

    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(message)) {
        return intent;
      }
    }

    return undefined;
  }

  /**
   * 检测设计类型
   */
  private detectDesignType(message: string): IntentAnalysis['designType'] {
    if (/(ip|形象|角色|人物| mascot|吉祥物|卡通|动漫|二次元)/.test(message)) {
      return 'ip-character';
    }
    if (/(品牌|brand|vi|视觉识别|企业形象)/.test(message)) {
      return 'brand';
    }
    if (/(包装|礼盒|盒子|袋子|瓶|罐)/.test(message)) {
      return 'packaging';
    }
    if (/(海报|banner|宣传|广告|推广)/.test(message)) {
      return 'poster';
    }
    if (/(插画|插图|手绘|绘本|漫画)/.test(message)) {
      return 'illustration';
    }
    if (/(动画|视频|动效|gif|动态)/.test(message)) {
      return 'animation';
    }
    if (/(logo|标志|标识|商标|图标|icon)/.test(message)) {
      return 'logo';
    }
    return 'other';
  }

  /**
   * 评估复杂度
   */
  private assessComplexity(message: string): IntentAnalysis['complexity'] {
    const simplePatterns = [
      /^(画|生成|设计).*(一个|个|张|幅)/,
      /简单|简约|基础|普通|一般|随便|快速|草图/
    ];
    
    const complexPatterns = [
      /详细|完整|全套|系列|多|复杂|精致|专业|商业|高端|定制/,
      /和|与|及|还有|另外|同时|多个/
    ];

    if (simplePatterns.some(p => p.test(message)) && message.length < 20) {
      return 'simple';
    }

    if (complexPatterns.some(p => p.test(message)) || message.length > 100) {
      return 'complex';
    }

    return 'moderate';
  }

  /**
   * 评估紧急程度
   */
  private assessUrgency(message: string): IntentAnalysis['urgency'] {
    if (/(急|紧急|尽快|马上|立刻|现在|今天| hurry|urgent|asap)/.test(message)) {
      return 'high';
    }
    if (/(明天|后天|这周|近期|尽快|早点)/.test(message)) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * 分析用户情绪
   */
  private analyzeMood(message: string): IntentAnalysis['userMood'] {
    if (/(棒|赞|喜欢|满意|完美|好看|漂亮|优秀|感谢|谢谢|太好了)/.test(message)) {
      return 'satisfied';
    }
    if (/(期待|兴奋|激动|迫不及待|好想|好想看)/.test(message)) {
      return 'excited';
    }
    if (/(不太|不对|不好|失望|郁闷|烦|急|快点)/.test(message)) {
      return 'frustrated';
    }
    if (/(好奇|想知道|了解一下|看看|试试)/.test(message)) {
      return 'curious';
    }
    return 'neutral';
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(
    message: string,
    primaryIntent: IntentAnalysis['primaryIntent'],
    designType?: IntentAnalysis['designType']
  ): number {
    let confidence = 0.5;

    // 意图明确度
    if (primaryIntent !== 'unknown') {
      confidence += 0.2;
    }

    // 设计类型明确度
    if (designType && designType !== 'other') {
      confidence += 0.2;
    }

    // 描述详细度
    if (message.length > 20) {
      confidence += 0.1;
    }

    // 上下文匹配度
    if (this.context) {
      const lastUserMessage = this.context.history
        .filter(h => h.role === 'user')
        .pop();
      if (lastUserMessage) {
        // 如果与之前的话题相关，增加置信度
        confidence += 0.1;
      }
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * 推荐 Agent
   */
  private suggestAgent(
    primaryIntent: IntentAnalysis['primaryIntent'],
    designType?: IntentAnalysis['designType']
  ): AgentType | undefined {
    if (primaryIntent === 'consult') {
      return 'director';
    }

    if (primaryIntent === 'modify' && this.context?.currentAgent) {
      return this.context.currentAgent;
    }

    switch (designType) {
      case 'ip-character':
      case 'illustration':
        return 'illustrator';
      case 'brand':
      case 'packaging':
      case 'poster':
      case 'logo':
        return 'designer';
      case 'animation':
        return 'animator';
      default:
        return 'director';
    }
  }

  /**
   * 判断是否应该跳过步骤
   */
  private shouldSkipSteps(message: string, complexity: IntentAnalysis['complexity']): boolean {
    // 简单需求且描述明确，可以跳过部分步骤
    if (complexity === 'simple' && message.length > 10) {
      return true;
    }

    // 如果用户说"直接生成"等明确指令
    if (/(直接生成|立即生成|马上生成|现在就要|直接画)/.test(message)) {
      return true;
    }

    // 如果已有风格选择
    if (this.context?.selectedStyle) {
      return true;
    }

    return false;
  }

  /**
   * 识别还需要的信息
   */
  private identifyRequiredInfo(
    primaryIntent: IntentAnalysis['primaryIntent'],
    designType?: IntentAnalysis['designType'],
    message?: string
  ): string[] {
    const required: string[] = [];

    if (primaryIntent === 'generate') {
      if (!designType || designType === 'other') {
        required.push('design-type');
      }

      if (!this.context?.selectedStyle) {
        required.push('style');
      }

      if (!message?.match(/(颜色|色彩|配色|风格|调性)/)) {
        required.push('color-preference');
      }

      if (!message?.match(/(用途|场景|应用|使用)/)) {
        required.push('usage-scenario');
      }
    }

    return required;
  }

  /**
   * 建议的行动
   */
  private suggestActions(
    primaryIntent: IntentAnalysis['primaryIntent'],
    designType?: IntentAnalysis['designType'],
    complexity?: IntentAnalysis['complexity']
  ): string[] {
    const actions: string[] = [];

    switch (primaryIntent) {
      case 'generate':
        if (!designType) {
          actions.push('ask-design-type');
        }
        if (!this.context?.selectedStyle) {
          actions.push('show-style-selector');
        }
        if (complexity === 'complex') {
          actions.push('show-workflow');
        }
        actions.push('proceed-to-generation');
        break;

      case 'modify':
        actions.push('ask-modification-details');
        actions.push('show-options');
        break;

      case 'consult':
        actions.push('provide-suggestions');
        actions.push('show-examples');
        break;

      case 'confirm':
        if (!this.context?.selectedStyle) {
          actions.push('show-style-selector');
        } else {
          actions.push('proceed-to-generation');
        }
        break;

      default:
        actions.push('ask-clarification');
    }

    return actions;
  }

  /**
   * 获取下一步建议
   */
  getNextAction(analysis: IntentAnalysis): string {
    if (analysis.requiredInfo.length > 0) {
      const nextInfo = analysis.requiredInfo[0];
      switch (nextInfo) {
        case 'design-type':
          return '询问设计类型';
        case 'style':
          return '显示风格选择器';
        case 'color-preference':
          return '询问颜色偏好';
        case 'usage-scenario':
          return '询问使用场景';
        default:
          return '收集更多信息';
      }
    }

    if (analysis.suggestedActions.length > 0) {
      return analysis.suggestedActions[0];
    }

    return '继续对话';
  }
}

// 导出单例
export const intentAnalyzer = new IntentAnalyzer();
