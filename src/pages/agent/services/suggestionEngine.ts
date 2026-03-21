// 主动建议引擎 - 基于上下文主动提供建议

import { getPredictionService, BehaviorType } from './predictionService';
import { getRAGService } from './ragService';
import { getMemoryService } from './memoryService';
import { getIntentRecognitionService } from './intentRecognition';
import { AgentType, PRESET_STYLES, AGENT_CONFIG } from '../types/agent';

// 建议类型
export enum SuggestionType {
  STYLE = 'style',
  AGENT = 'agent',
  TASK = 'task',
  ACTION = 'action',
  CONTENT = 'content',
  SHORTCUT = 'shortcut'
}

// 建议项
export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  icon?: string;
  action: {
    type: 'message' | 'switch_agent' | 'generate' | 'navigate';
    payload: any;
  };
  priority: number; // 0-100
  reason: string;
  confidence: number;
  timestamp: number;
  expiresAt?: number;
}

// 建议上下文
export interface SuggestionContext {
  currentAgent: AgentType;
  conversationStage: 'initial' | 'collecting' | 'confirming' | 'executing' | 'reviewing';
  recentMessages: { role: string; content: string }[];
  currentTask?: {
    type?: string;
    requirements?: Record<string, any>;
  };
  userPreferences?: {
    preferredStyles?: string[];
    frequentTasks?: string[];
  };
}

// 建议配置
interface SuggestionConfig {
  maxSuggestions: number;
  minConfidence: number;
  refreshInterval: number;
  enabledTypes: SuggestionType[];
}

// 默认配置
const DEFAULT_CONFIG: SuggestionConfig = {
  maxSuggestions: 5,
  minConfidence: 0.5,
  refreshInterval: 30000, // 30秒
  enabledTypes: Object.values(SuggestionType)
};

/**
 * 主动建议引擎
 */
export class SuggestionEngine {
  private predictionService = getPredictionService();
  private ragService = getRAGService();
  private memoryService = getMemoryService();
  private intentService = getIntentRecognitionService();
  private config: SuggestionConfig = DEFAULT_CONFIG;
  private currentSuggestions: Suggestion[] = [];
  private lastUpdateTime = 0;

  /**
   * 配置引擎
   */
  configure(config: Partial<SuggestionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 生成建议
   */
  async generateSuggestions(context: SuggestionContext): Promise<Suggestion[]> {
    const now = Date.now();
    
    // 检查是否需要刷新
    if (now - this.lastUpdateTime < this.config.refreshInterval && this.currentSuggestions.length > 0) {
      return this.currentSuggestions;
    }

    const suggestions: Suggestion[] = [];

    // 1. 基于行为预测生成建议
    if (this.config.enabledTypes.includes(SuggestionType.ACTION)) {
      const behaviorSuggestions = await this.generateBehaviorBasedSuggestions(context);
      suggestions.push(...behaviorSuggestions);
    }

    // 2. 基于RAG生成建议
    if (this.config.enabledTypes.includes(SuggestionType.CONTENT)) {
      const ragSuggestions = await this.generateRAGBasedSuggestions(context);
      suggestions.push(...ragSuggestions);
    }

    // 3. 基于记忆生成建议
    if (this.config.enabledTypes.includes(SuggestionType.STYLE)) {
      const memorySuggestions = this.generateMemoryBasedSuggestions(context);
      suggestions.push(...memorySuggestions);
    }

    // 4. 基于当前阶段生成建议
    const stageSuggestions = this.generateStageBasedSuggestions(context);
    suggestions.push(...stageSuggestions);

    // 5. 添加快捷操作建议
    if (this.config.enabledTypes.includes(SuggestionType.SHORTCUT)) {
      const shortcutSuggestions = this.generateShortcutSuggestions(context);
      suggestions.push(...shortcutSuggestions);
    }

    // 过滤和排序
    const filteredSuggestions = this.filterAndSortSuggestions(suggestions);
    
    this.currentSuggestions = filteredSuggestions;
    this.lastUpdateTime = now;

    return filteredSuggestions;
  }

  /**
   * 基于行为预测生成建议
   */
  private async generateBehaviorBasedSuggestions(
    context: SuggestionContext
  ): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    // 获取行为预测
    const prediction = this.predictionService.predictNextBehavior({
      agent: context.currentAgent,
      taskType: context.currentTask?.type,
      stage: context.conversationStage
    });

    // 根据预测生成建议
    if (prediction.confidence >= this.config.minConfidence) {
      for (const suggestion of prediction.suggestions) {
        const newSuggestion: Suggestion = {
          id: `sugg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: suggestion.type as SuggestionType,
          title: this.getSuggestionTitle(suggestion.type, suggestion.value),
          description: suggestion.reason,
          action: this.buildAction(suggestion.type, suggestion.value),
          priority: Math.floor(suggestion.confidence * 80),
          reason: suggestion.reason,
          confidence: suggestion.confidence,
          timestamp: Date.now()
        };
        suggestions.push(newSuggestion);
      }
    }

    return suggestions;
  }

  /**
   * 基于RAG生成建议
   */
  private async generateRAGBasedSuggestions(
    context: SuggestionContext
  ): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    // 获取最近的用户消息
    const recentUserMessage = context.recentMessages
      .filter(m => m.role === 'user')
      .pop()?.content;

    if (!recentUserMessage) return suggestions;

    // 分析用户需求
    const analysis = await this.ragService.analyzeAndRecommend(recentUserMessage);

    // 生成风格建议
    if (analysis.styleRecommendations.length > 0 && this.config.enabledTypes.includes(SuggestionType.STYLE)) {
      const topStyle = analysis.styleRecommendations[0];
      const styleInfo = PRESET_STYLES.find(s => s.id === topStyle);
      
      if (styleInfo) {
        suggestions.push({
          id: `sugg-rag-style-${Date.now()}`,
          type: SuggestionType.STYLE,
          title: `推荐风格：${styleInfo.name}`,
          description: styleInfo.description,
          icon: styleInfo.icon,
          action: {
            type: 'message',
            payload: `我想使用"${styleInfo.name}"风格`
          },
          priority: 75,
          reason: analysis.insights.find(i => i.includes('风格')) || '基于您的需求推荐',
          confidence: 0.75,
          timestamp: Date.now()
        });
      }
    }

    // 生成案例参考建议
    if (analysis.cases.length > 0) {
      const topCase = analysis.cases[0];
      suggestions.push({
        id: `sugg-rag-case-${Date.now()}`,
        type: SuggestionType.CONTENT,
        title: `参考案例：${topCase.title}`,
        description: topCase.description.substring(0, 100) + '...',
        action: {
          type: 'message',
          payload: `可以参考"${topCase.title}"这个案例`
        },
        priority: 60,
        reason: '相似项目参考',
        confidence: 0.7,
        timestamp: Date.now()
      });
    }

    return suggestions;
  }

  /**
   * 基于记忆生成建议
   */
  private generateMemoryBasedSuggestions(context: SuggestionContext): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // 获取用户偏好
    const preferredStyles = this.memoryService.getRecommendedStyles(3);

    // 如果当前是需求收集阶段，推荐用户喜欢的风格
    if (context.conversationStage === 'collecting' && preferredStyles.length > 0) {
      const topStyle = preferredStyles[0];
      const styleInfo = PRESET_STYLES.find(s => s.id === topStyle);

      if (styleInfo) {
        suggestions.push({
          id: `sugg-mem-style-${Date.now()}`,
          type: SuggestionType.STYLE,
          title: `您喜欢的风格：${styleInfo.name}`,
          description: '基于您的历史选择推荐',
          icon: styleInfo.icon,
          action: {
            type: 'message',
            payload: `使用我喜欢的"${styleInfo.name}"风格`
          },
          priority: 85,
          reason: '这是您之前喜欢的风格',
          confidence: 0.85,
          timestamp: Date.now()
        });
      }
    }

    // 获取常用任务类型
    const frequentTasks = this.memoryService.getFrequentTaskTypes(3);
    if (frequentTasks.length > 0 && context.conversationStage === 'initial') {
      suggestions.push({
        id: `sugg-mem-task-${Date.now()}`,
        type: SuggestionType.TASK,
        title: `快速开始：${frequentTasks[0]}`,
        description: '基于您的常用需求',
        action: {
          type: 'message',
          payload: `我要做${frequentTasks[0]}`
        },
        priority: 80,
        reason: '这是您经常创建的任务类型',
        confidence: 0.8,
        timestamp: Date.now()
      });
    }

    return suggestions;
  }

  /**
   * 基于当前阶段生成建议
   */
  private generateStageBasedSuggestions(context: SuggestionContext): Suggestion[] {
    const suggestions: Suggestion[] = [];

    switch (context.conversationStage) {
      case 'initial':
        // 初始阶段：推荐快速开始选项
        suggestions.push({
          id: `sugg-stage-initial-${Date.now()}`,
          type: SuggestionType.ACTION,
          title: '🎨 设计一个IP形象',
          description: '创建独特的品牌角色',
          action: {
            type: 'message',
            payload: '我想设计一个IP形象'
          },
          priority: 70,
          reason: '热门设计需求',
          confidence: 0.7,
          timestamp: Date.now()
        });
        break;

      case 'collecting':
        // 需求收集阶段：提供需求模板
        suggestions.push({
          id: `sugg-stage-collecting-${Date.now()}`,
          type: SuggestionType.CONTENT,
          title: '📝 使用需求模板',
          description: '快速填写设计需求',
          action: {
            type: 'message',
            payload: '帮我生成一个完整的需求描述'
          },
          priority: 65,
          reason: '加速需求收集',
          confidence: 0.65,
          timestamp: Date.now()
        });
        break;

      case 'confirming':
        // 确认阶段：提供确认快捷操作
        suggestions.push({
          id: `sugg-stage-confirm-${Date.now()}`,
          type: SuggestionType.ACTION,
          title: '✅ 确认并开始',
          description: '确认需求，开始设计',
          action: {
            type: 'message',
            payload: '确认，开始设计'
          },
          priority: 90,
          reason: '确认需求，进入设计阶段',
          confidence: 0.9,
          timestamp: Date.now()
        });
        break;

      case 'executing':
        // 执行阶段：提供相关操作
        if (context.currentAgent !== 'designer') {
          suggestions.push({
            id: `sugg-stage-exec-${Date.now()}`,
            type: SuggestionType.AGENT,
            title: '🎨 切换到设计师',
            description: '让设计师开始创作',
            action: {
              type: 'switch_agent',
              payload: 'designer'
            },
            priority: 75,
            reason: '设计阶段推荐',
            confidence: 0.75,
            timestamp: Date.now()
          });
        }
        break;
    }

    return suggestions;
  }

  /**
   * 生成快捷操作建议
   */
  private generateShortcutSuggestions(context: SuggestionContext): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // 常用快捷操作
    const shortcuts = [
      {
        title: '🔄 重新开始',
        description: '清空当前对话，重新开始',
        message: '我想重新开始',
        priority: 40
      },
      {
        title: '💡 获取灵感',
        description: '查看设计灵感提示',
        message: '给我一些设计灵感',
        priority: 50
      },
      {
        title: '📋 查看历史',
        description: '查看之前的对话',
        message: '查看我们的对话历史',
        priority: 35
      }
    ];

    for (const shortcut of shortcuts) {
      suggestions.push({
        id: `sugg-shortcut-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: SuggestionType.SHORTCUT,
        title: shortcut.title,
        description: shortcut.description,
        action: {
          type: 'message',
          payload: shortcut.message
        },
        priority: shortcut.priority,
        reason: '快捷操作',
        confidence: 0.6,
        timestamp: Date.now()
      });
    }

    return suggestions;
  }

  /**
   * 过滤和排序建议
   */
  private filterAndSortSuggestions(suggestions: Suggestion[]): Suggestion[] {
    // 去重（基于标题）
    const seen = new Set<string>();
    const unique = suggestions.filter(s => {
      if (seen.has(s.title)) return false;
      seen.add(s.title);
      return true;
    });

    // 过滤低置信度
    const filtered = unique.filter(s => s.confidence >= this.config.minConfidence);

    // 按优先级排序
    const sorted = filtered.sort((a, b) => b.priority - a.priority);

    // 限制数量
    return sorted.slice(0, this.config.maxSuggestions);
  }

  /**
   * 获取建议标题
   */
  private getSuggestionTitle(type: string, value: string): string {
    switch (type) {
      case 'style':
        const style = PRESET_STYLES.find(s => s.id === value);
        return style ? `推荐风格：${style.name}` : `风格：${value}`;
      case 'agent':
        const agent = AGENT_CONFIG[value as AgentType];
        return agent ? `切换到${agent.name}` : `切换Agent`;
      case 'task':
        return `创建：${value}`;
      default:
        return `建议：${value}`;
    }
  }

  /**
   * 构建操作
   */
  private buildAction(type: string, value: string): Suggestion['action'] {
    switch (type) {
      case 'style':
        return {
          type: 'message',
          payload: `选择"${value}"风格`
        };
      case 'agent':
        return {
          type: 'switch_agent',
          payload: value
        };
      case 'task':
        return {
          type: 'message',
          payload: `我要做${value}`
        };
      default:
        return {
          type: 'message',
          payload: value
        };
    }
  }

  /**
   * 应用建议
   */
  applySuggestion(suggestion: Suggestion): void {
    // 记录行为
    this.predictionService.recordBehavior(BehaviorType.MESSAGE_SEND, {
      content: suggestion.action.payload,
      suggestionId: suggestion.id
    });

    console.log('[SuggestionEngine] Applied suggestion:', suggestion.title);
  }

  /**
   * 获取当前建议
   */
  getCurrentSuggestions(): Suggestion[] {
    return this.currentSuggestions;
  }

  /**
   * 清除建议
   */
  clearSuggestions(): void {
    this.currentSuggestions = [];
    this.lastUpdateTime = 0;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalSuggestions: number;
    lastUpdateTime: number;
    config: SuggestionConfig;
  } {
    return {
      totalSuggestions: this.currentSuggestions.length,
      lastUpdateTime: this.lastUpdateTime,
      config: this.config
    };
  }
}

// 导出单例
let suggestionEngineInstance: SuggestionEngine | null = null;

export function getSuggestionEngine(): SuggestionEngine {
  if (!suggestionEngineInstance) {
    suggestionEngineInstance = new SuggestionEngine();
  }
  return suggestionEngineInstance;
}

export function resetSuggestionEngine(): void {
  suggestionEngineInstance = null;
}
