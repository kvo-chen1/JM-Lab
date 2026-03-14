/**
 * AI上下文管理器
 * 增强上下文感知与多轮对话连贯性
 * 实现智能上下文压缩、主题追踪、意图理解
 */

import { Message } from './llmService';

// 上下文片段类型
export interface ContextSegment {
  id: string;
  type: 'topic' | 'task' | 'question' | 'answer' | 'action';
  content: string;
  importance: number;
  timestamp: number;
  relatedSegments: string[];
  metadata?: Record<string, any>;
}

// 对话状态
export interface DialogueState {
  currentTopic: string;
  topicStack: string[];
  pendingQuestions: string[];
  userIntent: UserIntent;
  contextSegments: ContextSegment[];
  lastAction?: string;
  sessionStartTime: number;
  lastInteractionTime: number;
}

// 用户意图
export interface UserIntent {
  primary: string;
  secondary: string[];
  confidence: number;
  entities: Entity[];
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high';
}

// 实体
export interface Entity {
  type: string;
  value: string;
  start: number;
  end: number;
  confidence: number;
}

// 上下文压缩配置
export interface CompressionConfig {
  maxTokens: number;
  preserveRecent: number;
  preserveImportant: boolean;
  summarizationStrategy: 'extractive' | 'abstractive' | 'hybrid';
}

class AIContextManager {
  private dialogueStates: Map<string, DialogueState> = new Map();
  private contextSegments: Map<string, ContextSegment[]> = new Map();
  
  // 意图识别模式
  private intentPatterns = {
    navigation: /^(导航|跳转|打开|前往|去|到).*/i,
    creation: /^(创建|生成|制作|设计|画|写).*/i,
    inquiry: /^(什么是|怎么|如何|为什么|请问|查询).*/i,
    modification: /^(修改|调整|优化|改进|更改).*/i,
    comparison: /^(比较|对比|区别|差异|哪个更好).*/i,
    confirmation: /^(确认|是的|没错|对|正确).*/i,
    negation: /^(不|否|不对|错误|取消).*/i,
    clarification: /^(澄清|说明|解释一下|详细说).*/i,
    followUp: /^(然后呢|接下来|还有|另外|继续).*/i,
  };

  /**
   * 获取或创建对话状态
   */
  getDialogueState(sessionId: string): DialogueState {
    if (!this.dialogueStates.has(sessionId)) {
      this.dialogueStates.set(sessionId, {
        currentTopic: '',
        topicStack: [],
        pendingQuestions: [],
        userIntent: {
          primary: '',
          secondary: [],
          confidence: 0,
          entities: [],
          sentiment: 'neutral',
          urgency: 'low'
        },
        contextSegments: [],
        sessionStartTime: Date.now(),
        lastInteractionTime: Date.now()
      });
    }
    return this.dialogueStates.get(sessionId)!;
  }

  /**
   * 分析用户意图
   */
  analyzeIntent(message: string, sessionId: string): UserIntent {
    const intent: UserIntent = {
      primary: 'general',
      secondary: [],
      confidence: 0.5,
      entities: this.extractEntities(message),
      sentiment: this.analyzeSentiment(message),
      urgency: this.analyzeUrgency(message)
    };

    // 识别主要意图
    for (const [type, pattern] of Object.entries(this.intentPatterns)) {
      if (pattern.test(message)) {
        intent.primary = type;
        intent.confidence = 0.8;
        break;
      }
    }

    // 检测多意图
    const multiIntentPatterns = [
      { pattern: /(并且|同时|另外|还有|然后)/, types: ['compound'] },
      { pattern: /(先.*再|首先.*然后|第一步.*第二步)/, types: ['sequential'] },
      { pattern: /(或者|还是|要么.*要么)/, types: ['alternative'] }
    ];

    for (const { pattern, types } of multiIntentPatterns) {
      if (pattern.test(message)) {
        intent.secondary.push(...types);
        intent.confidence = Math.min(intent.confidence + 0.1, 1);
      }
    }

    // 更新对话状态
    const state = this.getDialogueState(sessionId);
    state.userIntent = intent;
    state.lastInteractionTime = Date.now();

    return intent;
  }

  /**
   * 提取实体
   */
  private extractEntities(message: string): Entity[] {
    const entities: Entity[] = [];
    
    // 文化元素实体
    const culturalPatterns = [
      { type: 'cultural_element', pattern: /(杨柳青年画|泥人张|风筝魏|狗不理|十八街麻花|五大道|古文化街)/g },
      { type: 'color', pattern: /(红色|蓝色|绿色|黄色|紫色|橙色|青色|粉色|灰色|黑色|白色)/g },
      { type: 'style', pattern: /(国潮|传统|现代|简约|复古|时尚|古典|创新)/g },
      { type: 'product_type', pattern: /(海报|logo|插画|包装|名片|画册|文创|周边)/g },
      { type: 'action', pattern: /(生成|创建|设计|修改|优化|分析|比较|推荐)/g }
    ];

    for (const { type, pattern } of culturalPatterns) {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        entities.push({
          type,
          value: match[1],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.9
        });
      }
    }

    return entities;
  }

  /**
   * 分析情感
   */
  private analyzeSentiment(message: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = /(好|棒|优秀|喜欢|满意|感谢|不错|完美|赞|爱)/;
    const negativeWords = /(差|糟|讨厌|不满意|错误|问题|不好|失望|烦|难)/;
    
    const positiveCount = (message.match(positiveWords) || []).length;
    const negativeCount = (message.match(negativeWords) || []).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * 分析紧急程度
   */
  private analyzeUrgency(message: string): 'low' | 'medium' | 'high' {
    const urgentWords = /(紧急|急|马上|立刻|现在|尽快|快| hurry|urgent|asap)/i;
    const mediumWords = /(今天|明天|近期|需要|想要|希望)/;
    
    if (urgentWords.test(message)) return 'high';
    if (mediumWords.test(message)) return 'medium';
    return 'low';
  }

  /**
   * 追踪主题变化
   */
  trackTopic(message: string, sessionId: string): string {
    const state = this.getDialogueState(sessionId);
    
    // 提取主题关键词
    const topicKeywords = this.extractTopicKeywords(message);
    const newTopic = topicKeywords.join('、');
    
    if (newTopic && newTopic !== state.currentTopic) {
      // 主题切换
      if (state.currentTopic) {
        state.topicStack.push(state.currentTopic);
      }
      state.currentTopic = newTopic;
      
      // 限制主题栈大小
      if (state.topicStack.length > 5) {
        state.topicStack.shift();
      }
    }
    
    return state.currentTopic;
  }

  /**
   * 提取主题关键词
   */
  private extractTopicKeywords(message: string): string[] {
    // 使用简单的关键词提取
    const keywords: string[] = [];
    const patterns = [
      /关于(.+?)[的，。]/,
      /(.+?)方面/,
      /(.+?)问题/,
      /(.+?)相关/
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1].length > 1 && match[1].length < 20) {
        keywords.push(match[1]);
      }
    }
    
    return keywords.length > 0 ? keywords : ['一般对话'];
  }

  /**
   * 智能上下文压缩
   */
  compressContext(
    messages: Message[],
    config: CompressionConfig = {
      maxTokens: 4000,
      preserveRecent: 6,
      preserveImportant: true,
      summarizationStrategy: 'hybrid'
    }
  ): Message[] {
    if (messages.length <= config.preserveRecent) {
      return messages;
    }

    const recentMessages = messages.slice(-config.preserveRecent);
    const olderMessages = messages.slice(0, -config.preserveRecent);

    // 识别重要消息
    const importantMessages = config.preserveImportant
      ? olderMessages.filter(msg => this.isImportantMessage(msg))
      : [];

    // 压缩旧消息
    const compressedOld = this.summarizeMessages(
      olderMessages.filter(msg => !importantMessages.includes(msg)),
      config.summarizationStrategy
    );

    return [
      ...compressedOld,
      ...importantMessages,
      ...recentMessages
    ];
  }

  /**
   * 判断消息重要性
   */
  private isImportantMessage(message: Message): boolean {
    // 系统消息和包含关键信息的消息被认为是重要的
    if (message.role === 'system') return true;
    
    const importantPatterns = [
      /(必须|重要|关键|注意|记住|保存)/,
      /(决定|选择|确认|同意)/,
      /(错误|失败|异常|警告)/
    ];
    
    return importantPatterns.some(pattern => pattern.test(message.content));
  }

  /**
   * 消息摘要
   */
  private summarizeMessages(
    messages: Message[],
    strategy: 'extractive' | 'abstractive' | 'hybrid'
  ): Message[] {
    if (messages.length === 0) return [];

    // 提取式摘要：选择关键消息
    if (strategy === 'extractive' || strategy === 'hybrid') {
      const keyMessages = messages.filter((msg, index) => {
        // 保留第一条和包含问题的消息
        if (index === 0) return true;
        if (msg.content.includes('?') || msg.content.includes('？')) return true;
        return false;
      });

      if (strategy === 'extractive') return keyMessages;
      
      // 混合策略：提取关键消息 + 生成摘要
      const summary = this.generateSummary(messages);
      return [
        {
          role: 'system',
          content: `[前文摘要] ${summary}`,
          timestamp: messages[0].timestamp
        },
        ...keyMessages
      ];
    }

    // 生成式摘要
    const summary = this.generateSummary(messages);
    return [{
      role: 'system',
      content: `[对话摘要] ${summary}`,
      timestamp: messages[0].timestamp
    }];
  }

  /**
   * 生成摘要
   */
  private generateSummary(messages: Message[]): string {
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
    const assistantMessages = messages.filter(m => m.role === 'assistant').map(m => m.content);

    const topics = [...new Set(userMessages.map(m => this.extractTopicKeywords(m)).flat())];
    
    return `主题涉及：${topics.slice(0, 3).join('、')}。` +
           `用户提问${userMessages.length}次，助手回复${assistantMessages.length}次。`;
  }

  /**
   * 构建增强提示
   */
  buildEnhancedPrompt(
    messages: Message[],
    sessionId: string,
    systemPrompt: string
  ): { messages: Message[]; contextInfo: string } {
    const state = this.getDialogueState(sessionId);
    
    // 压缩上下文
    const compressedMessages = this.compressContext(messages);
    
    // 构建上下文信息
    const contextInfo = this.buildContextInfo(state);
    
    // 添加系统提示和上下文
    const enhancedMessages: Message[] = [
      {
        role: 'system',
        content: `${systemPrompt}\n\n[上下文信息]\n${contextInfo}`,
        timestamp: Date.now()
      },
      ...compressedMessages
    ];

    return { messages: enhancedMessages, contextInfo };
  }

  /**
   * 构建上下文信息
   */
  private buildContextInfo(state: DialogueState): string {
    const parts: string[] = [];
    
    if (state.currentTopic) {
      parts.push(`当前主题：${state.currentTopic}`);
    }
    
    if (state.topicStack.length > 0) {
      parts.push(`相关主题：${state.topicStack.slice(-3).join('、')}`);
    }
    
    if (state.userIntent.primary) {
      parts.push(`用户意图：${state.userIntent.primary}`);
    }
    
    if (state.pendingQuestions.length > 0) {
      parts.push(`待确认：${state.pendingQuestions.join('、')}`);
    }
    
    // 计算对话时长
    const duration = Math.floor((Date.now() - state.sessionStartTime) / 60000);
    if (duration > 0) {
      parts.push(`对话时长：${duration}分钟`);
    }
    
    return parts.join('\n');
  }

  /**
   * 检测对话连贯性
   */
  checkCoherence(currentMessage: string, sessionId: string): {
    isCoherent: boolean;
    coherenceScore: number;
    suggestions: string[];
  } {
    const state = this.getDialogueState(sessionId);
    const suggestions: string[] = [];
    
    // 检查是否是追问
    const isFollowUp = this.intentPatterns.followUp.test(currentMessage);
    const refersToPrevious = state.currentTopic && 
      currentMessage.includes(state.currentTopic);
    
    // 检查话题跳跃
    const newTopics = this.extractTopicKeywords(currentMessage);
    const topicJump = newTopics.length > 0 && 
      !newTopics.some(t => state.topicStack.includes(t) || t === state.currentTopic);
    
    let coherenceScore = 0.5;
    
    if (isFollowUp) coherenceScore += 0.3;
    if (refersToPrevious) coherenceScore += 0.2;
    if (topicJump) coherenceScore -= 0.3;
    
    coherenceScore = Math.max(0, Math.min(1, coherenceScore));
    
    if (topicJump && !isFollowUp) {
      suggestions.push('检测到话题切换，建议确认用户意图');
    }
    
    if (state.pendingQuestions.length > 0 && !isFollowUp) {
      suggestions.push('有待确认的问题，建议先处理');
    }
    
    return {
      isCoherent: coherenceScore > 0.5,
      coherenceScore,
      suggestions
    };
  }

  /**
   * 更新上下文片段
   */
  updateContextSegment(segment: ContextSegment, sessionId: string): void {
    const segments = this.contextSegments.get(sessionId) || [];
    
    // 查找是否已存在相似片段
    const existingIndex = segments.findIndex(s => 
      s.type === segment.type && 
      this.calculateSimilarity(s.content, segment.content) > 0.8
    );
    
    if (existingIndex >= 0) {
      // 更新现有片段
      segments[existingIndex] = {
        ...segments[existingIndex],
        content: segment.content,
        importance: Math.max(segments[existingIndex].importance, segment.importance),
        timestamp: Date.now()
      };
    } else {
      // 添加新片段
      segments.push({
        ...segment,
        timestamp: Date.now()
      });
    }
    
    // 限制片段数量
    if (segments.length > 20) {
      segments.sort((a, b) => b.importance - a.importance);
      segments.splice(20);
    }
    
    this.contextSegments.set(sessionId, segments);
    
    // 更新对话状态
    const state = this.getDialogueState(sessionId);
    state.contextSegments = segments;
  }

  /**
   * 计算文本相似度（简单实现）
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * 清空对话状态
   */
  clearSession(sessionId: string): void {
    this.dialogueStates.delete(sessionId);
    this.contextSegments.delete(sessionId);
  }

  /**
   * 获取所有活跃会话
   */
  getActiveSessions(): string[] {
    const now = Date.now();
    const activeSessions: string[] = [];
    
    for (const [sessionId, state] of this.dialogueStates) {
      // 30分钟内有过交互的会话认为是活跃的
      if (now - state.lastInteractionTime < 30 * 60 * 1000) {
        activeSessions.push(sessionId);
      }
    }
    
    return activeSessions;
  }
}

export const aiContextManager = new AIContextManager();
export default AIContextManager;
