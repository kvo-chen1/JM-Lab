/**
 * 画布生成策略服务
 * 定义何时、如何将内容自动添加到画布的策略规则
 */

import { AgentMessage, GeneratedOutput, AgentType } from '../types/agent';
import { ContentAnalysisResult, ContentType, analyzeContent } from './contentAnalyzer';

export interface CanvasGenerationStrategy {
  id: string;
  name: string;
  description: string;
  // 判断是否应该应用此策略
  shouldApply: (message: AgentMessage, analysis: ContentAnalysisResult) => boolean;
  // 生成画布内容
  generateOutput: (message: AgentMessage, analysis: ContentAnalysisResult) => GeneratedOutput | null;
  // 优先级（数字越小优先级越高）
  priority: number;
  // 是否启用
  enabled: boolean;
}

// 策略配置选项
export interface StrategyOptions {
  minConfidence: number;      // 最小置信度阈值
  autoAddHighConfidence: boolean;  // 高置信度时自动添加
  silentAddMediumConfidence: boolean; // 中等置信度时静默添加
  showNotification: boolean;  // 是否显示通知
}

// 默认策略配置
export const defaultStrategyOptions: StrategyOptions = {
  minConfidence: 0.7,
  autoAddHighConfidence: true,
  silentAddMediumConfidence: true,
  showNotification: true
};

/**
 * 概念图生成策略
 * 当消息包含概念图图片时自动添加到画布
 */
const conceptArtStrategy: CanvasGenerationStrategy = {
  id: 'concept-art',
  name: '概念图自动添加',
  description: '自动将角色概念图添加到画布',
  priority: 1,
  enabled: true,
  
  shouldApply: (message, analysis) => {
    return analysis.contentType === 'concept_art' && 
           analysis.confidence >= 0.8 &&
           analysis.extractedData.hasVisualContent;
  },
  
  generateOutput: (message, analysis) => {
    const images = analysis.extractedData.images || [];
    if (images.length === 0) return null;
    
    const characterName = analysis.extractedData.characterName || '角色';
    const style = analysis.extractedData.style || '';
    
    return {
      id: `output_${Date.now()}`,
      type: 'image',
      url: images[0],
      thumbnail: images[0],
      title: `${characterName} - 概念图`,
      description: style ? `${style}风格的概念图` : '角色概念图',
      agentType: message.role as AgentType,
      cardType: 'concept_art',
      createdAt: Date.now(),
      metadata: {
        source: 'auto-generated',
        contentType: analysis.contentType,
        confidence: analysis.confidence,
        reason: analysis.reason
      }
    };
  }
};

/**
 * 三视图生成策略
 * 当消息包含三视图时自动添加到画布
 */
const threeViewStrategy: CanvasGenerationStrategy = {
  id: 'three-view',
  name: '三视图自动添加',
  description: '自动将角色三视图添加到画布',
  priority: 1,
  enabled: true,
  
  shouldApply: (message, analysis) => {
    return analysis.contentType === 'three_view' && 
           analysis.confidence >= 0.85;
  },
  
  generateOutput: (message, analysis) => {
    const images = analysis.extractedData.images || [];
    if (images.length === 0) return null;
    
    const characterName = analysis.extractedData.characterName || '角色';
    
    return {
      id: `output_${Date.now()}`,
      type: 'image',
      url: images[0],
      thumbnail: images[0],
      title: `${characterName} - 三视图`,
      description: '角色三视图设计规范',
      agentType: message.role as AgentType,
      cardType: 'three_view',
      createdAt: Date.now(),
      metadata: {
        source: 'auto-generated',
        contentType: analysis.contentType,
        confidence: analysis.confidence,
        reason: analysis.reason
      }
    };
  }
};

/**
 * 海报生成策略
 * 当消息包含海报设计时自动添加到画布
 */
const posterStrategy: CanvasGenerationStrategy = {
  id: 'poster',
  name: '海报自动添加',
  description: '自动将海报设计添加到画布',
  priority: 2,
  enabled: true,
  
  shouldApply: (message, analysis) => {
    return analysis.contentType === 'poster' && 
           analysis.confidence >= 0.8;
  },
  
  generateOutput: (message, analysis) => {
    const images = analysis.extractedData.images || [];
    if (images.length === 0) return null;
    
    return {
      id: `output_${Date.now()}`,
      type: 'image',
      url: images[0],
      thumbnail: images[0],
      title: '宣传海报',
      description: 'IP形象宣传海报设计',
      agentType: message.role as AgentType,
      cardType: 'poster',
      createdAt: Date.now(),
      metadata: {
        source: 'auto-generated',
        contentType: analysis.contentType,
        confidence: analysis.confidence,
        reason: analysis.reason
      }
    };
  }
};

/**
 * 角色设定策略
 * 当消息包含详细角色设定时添加到画布
 */
const characterProfileStrategy: CanvasGenerationStrategy = {
  id: 'character-profile',
  name: '角色设定自动添加',
  description: '自动将角色设定信息添加到画布',
  priority: 3,
  enabled: true,
  
  shouldApply: (message, analysis) => {
    return analysis.contentType === 'character_profile' && 
           analysis.confidence >= 0.75 &&
           message.content.length > 200;
  },
  
  generateOutput: (message, analysis) => {
    const characterName = analysis.extractedData.characterName || '角色';
    
    return {
      id: `output_${Date.now()}`,
      type: 'text',
      url: '', // 文本类型没有URL
      title: `${characterName} - 角色设定`,
      description: message.content.slice(0, 100) + '...',
      agentType: message.role as AgentType,
      cardType: 'character_profile',
      createdAt: Date.now(),
      metadata: {
        source: 'auto-generated',
        contentType: analysis.contentType,
        confidence: analysis.confidence,
        reason: analysis.reason,
        fullContent: message.content
      }
    };
  }
};

/**
 * 通用图片策略
 * 当消息包含图片但不符合特定类型时
 */
const genericImageStrategy: CanvasGenerationStrategy = {
  id: 'generic-image',
  name: '通用图片自动添加',
  description: '自动将设计相关图片添加到画布',
  priority: 10,
  enabled: true,
  
  shouldApply: (message, analysis) => {
    const images = analysis.extractedData.images || [];
    return images.length > 0 && 
           analysis.extractedData.hasVisualContent &&
           analysis.confidence >= 0.7 &&
           !['concept_art', 'three_view', 'poster'].includes(analysis.contentType);
  },
  
  generateOutput: (message, analysis) => {
    const images = analysis.extractedData.images || [];
    if (images.length === 0) return null;
    
    return {
      id: `output_${Date.now()}`,
      type: 'image',
      url: images[0],
      thumbnail: images[0],
      title: '设计图片',
      description: analysis.reason,
      agentType: message.role as AgentType,
      cardType: 'default',
      createdAt: Date.now(),
      metadata: {
        source: 'auto-generated',
        contentType: analysis.contentType,
        confidence: analysis.confidence,
        reason: analysis.reason
      }
    };
  }
};

// 所有策略列表（按优先级排序）
const allStrategies: CanvasGenerationStrategy[] = [
  conceptArtStrategy,
  threeViewStrategy,
  posterStrategy,
  characterProfileStrategy,
  genericImageStrategy
];

/**
 * 获取启用的策略（按优先级排序）
 */
export function getEnabledStrategies(): CanvasGenerationStrategy[] {
  return allStrategies
    .filter(s => s.enabled)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * 执行画布生成策略
 * @returns 生成的输出和应用的策略
 */
export function executeStrategies(
  message: AgentMessage,
  options: Partial<StrategyOptions> = {}
): { output: GeneratedOutput | null; strategy: CanvasGenerationStrategy | null } {
  const opts = { ...defaultStrategyOptions, ...options };
  
  // 分析内容
  const analysis = analyzeContent(message);
  
  // 检查置信度阈值
  if (analysis.confidence < opts.minConfidence) {
    return { output: null, strategy: null };
  }
  
  // 遍历策略，找到第一个适用的
  const strategies = getEnabledStrategies();
  
  for (const strategy of strategies) {
    if (strategy.shouldApply(message, analysis)) {
      const output = strategy.generateOutput(message, analysis);
      if (output) {
        return { output, strategy };
      }
    }
  }
  
  return { output: null, strategy: null };
}

/**
 * 检查是否应该自动添加到画布
 */
export function shouldAutoAddToCanvas(
  message: AgentMessage,
  options: Partial<StrategyOptions> = {}
): { shouldAdd: boolean; confidence: number; reason: string } {
  const opts = { ...defaultStrategyOptions, ...options };
  const analysis = analyzeContent(message);
  
  // 高置信度 - 自动添加
  if (opts.autoAddHighConfidence && analysis.confidence >= 0.8) {
    return {
      shouldAdd: analysis.shouldGenerateToCanvas,
      confidence: analysis.confidence,
      reason: analysis.reason
    };
  }
  
  // 中等置信度 - 根据配置决定是否添加
  if (analysis.confidence >= opts.minConfidence) {
    return {
      shouldAdd: analysis.shouldGenerateToCanvas,
      confidence: analysis.confidence,
      reason: analysis.reason
    };
  }
  
  // 低置信度 - 不添加
  return {
    shouldAdd: false,
    confidence: analysis.confidence,
    reason: '置信度太低'
  };
}

/**
 * 批量处理消息
 */
export function processMessages(
  messages: AgentMessage[],
  options: Partial<StrategyOptions> = {}
): Array<{
  message: AgentMessage;
  output: GeneratedOutput | null;
  strategy: CanvasGenerationStrategy | null;
  analysis: ContentAnalysisResult;
}> {
  return messages.map(message => {
    const analysis = analyzeContent(message);
    const { output, strategy } = executeStrategies(message, options);
    
    return {
      message,
      output,
      strategy,
      analysis
    };
  });
}

/**
 * 获取策略统计信息
 */
export function getStrategyStats(): Array<{
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
}> {
  return allStrategies.map(s => ({
    id: s.id,
    name: s.name,
    enabled: s.enabled,
    priority: s.priority
  }));
}

/**
 * 启用/禁用策略
 */
export function toggleStrategy(strategyId: string, enabled: boolean): boolean {
  const strategy = allStrategies.find(s => s.id === strategyId);
  if (strategy) {
    strategy.enabled = enabled;
    return true;
  }
  return false;
}
