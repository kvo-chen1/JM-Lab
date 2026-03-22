// Prompt 优化服务 - 分析用户输入并提供优化建议

import { Suggestion, SuggestionType } from '../types/suggestion';
import { llmService } from '@/services/llmService';

// Prompt 分析结果
export interface PromptAnalysis {
  clarity: number; // 清晰度 0-100
  completeness: number; // 完整度 0-100
  specificity: number; // 具体度 0-100
  missingElements: string[]; // 缺失的元素
  suggestions: string[]; // 改进建议
  optimizedPrompt?: string; // 优化后的Prompt
}

// 设计元素检查清单
const DESIGN_ELEMENTS = {
  subject: ['主体', '角色', '人物', 'IP', '形象', '产品', '物体'],
  style: ['风格', '画风', '样式', '质感', '效果'],
  color: ['颜色', '色彩', '色调', '配色', '色温', '饱和度'],
  mood: ['氛围', '情绪', '感觉', '意境', '调性'],
  composition: ['构图', '布局', '视角', '角度', '景深'],
  lighting: ['光线', '光影', '照明', '光源', '阴影'],
  background: ['背景', '环境', '场景', '上下文'],
  detail: ['细节', '精细度', '复杂度', '纹理'],
  target: ['受众', '用户', '人群', '年龄', '性别'],
  usage: ['用途', '场景', '应用', '使用']
};

/**
 * Prompt 优化器
 */
export class PromptOptimizer {
  /**
   * 分析用户输入的 Prompt
   */
  async analyzePrompt(prompt: string): Promise<PromptAnalysis> {
    const analysis: PromptAnalysis = {
      clarity: 50,
      completeness: 50,
      specificity: 50,
      missingElements: [],
      suggestions: []
    };

    // 基础分析
    const lowerPrompt = prompt.toLowerCase();
    
    // 检查包含的设计元素
    const foundElements = new Set<string>();
    for (const [category, keywords] of Object.entries(DESIGN_ELEMENTS)) {
      for (const keyword of keywords) {
        if (lowerPrompt.includes(keyword)) {
          foundElements.add(category);
          break;
        }
      }
    }

    // 计算完整度
    const totalElements = Object.keys(DESIGN_ELEMENTS).length;
    analysis.completeness = Math.round((foundElements.size / totalElements) * 100);

    // 识别缺失的关键元素
    if (!foundElements.has('subject')) {
      analysis.missingElements.push('主体描述');
      analysis.suggestions.push('添加清晰的主体描述，如"一只可爱的猫咪"或"一个科技感机器人"');
    }
    if (!foundElements.has('style')) {
      analysis.missingElements.push('风格定义');
      analysis.suggestions.push('指定艺术风格，如"赛博朋克"、"水彩画"或"3D渲染"');
    }
    if (!foundElements.has('color')) {
      analysis.missingElements.push('色彩方案');
      analysis.suggestions.push('描述想要的色彩，如"暖色调"、"蓝紫色渐变"或"黑白对比"');
    }
    if (!foundElements.has('mood')) {
      analysis.missingElements.push('氛围情绪');
      analysis.suggestions.push('添加氛围描述，如"温馨治愈"、"神秘梦幻"或"活力四射"');
    }

    // 评估清晰度（基于长度和结构）
    const wordCount = prompt.length;
    if (wordCount < 10) {
      analysis.clarity = 30;
      analysis.suggestions.push('描述过于简短，建议提供更多细节');
    } else if (wordCount < 30) {
      analysis.clarity = 60;
    } else if (wordCount < 100) {
      analysis.clarity = 80;
    } else {
      analysis.clarity = 90;
    }

    // 评估具体度
    const vagueWords = ['好看', '漂亮', '不错', '可以', '随便', '简单', '复杂'];
    const vagueCount = vagueWords.filter(w => lowerPrompt.includes(w)).length;
    analysis.specificity = Math.max(20, 100 - vagueCount * 20);

    if (vagueCount > 0) {
      analysis.suggestions.push('避免使用模糊的形容词，用具体的描述替代"好看"、"漂亮"等');
    }

    // 如果Prompt质量较低，尝试生成优化版本
    if (analysis.completeness < 60 || analysis.clarity < 60) {
      analysis.optimizedPrompt = await this.generateOptimizedPrompt(prompt, analysis);
    }

    return analysis;
  }

  /**
   * 生成优化后的 Prompt
   */
  private async generateOptimizedPrompt(
    originalPrompt: string,
    analysis: PromptAnalysis
  ): Promise<string> {
    try {
      const systemPrompt = `你是一位专业的AI绘画Prompt工程师。请基于用户的原始描述，生成一个更完整、更具体的Prompt。

要求：
1. 保持用户的核心意图
2. 补充缺失的设计元素（主体、风格、色彩、氛围等）
3. 使用英文关键词（AI绘画模型对英文理解更好）
4. 添加专业术语提升质量
5. 保持简洁，不要过度堆砌

请直接返回优化后的Prompt文本，不要添加解释。`;

      const response = await llmService.generateResponse(
        `原始描述：${originalPrompt}\n\n缺失元素：${analysis.missingElements.join('、')}\n\n请生成优化后的Prompt：`,
        { systemPrompt, priority: 'normal' }
      );

      return response.trim();
    } catch (error) {
      console.error('[PromptOptimizer] Failed to generate optimized prompt:', error);
      return this.generateSimpleOptimization(originalPrompt, analysis);
    }
  }

  /**
   * 生成简单的优化版本（降级方案）
   */
  private generateSimpleOptimization(
    originalPrompt: string,
    analysis: PromptAnalysis
  ): string {
    let optimized = originalPrompt;

    // 添加缺失的元素模板
    if (!analysis.missingElements.includes('主体描述')) {
      optimized += ', detailed subject';
    }
    if (!analysis.missingElements.includes('风格定义')) {
      optimized += ', artistic style';
    }
    if (!analysis.missingElements.includes('色彩方案')) {
      optimized += ', harmonious colors';
    }
    if (!analysis.missingElements.includes('氛围情绪')) {
      optimized += ', atmospheric lighting';
    }

    optimized += ', high quality, masterpiece';
    return optimized;
  }

  /**
   * 生成 Prompt 优化建议
   */
  async generateOptimizationSuggestion(
    userPrompt: string,
    context?: {
      currentAgent?: string;
      taskType?: string;
    }
  ): Promise<Suggestion | null> {
    const analysis = await this.analyzePrompt(userPrompt);

    // 如果Prompt质量足够好，不需要建议
    if (analysis.completeness >= 70 && analysis.clarity >= 70 && analysis.specificity >= 70) {
      return null;
    }

    // 生成建议标题和描述
    let title = '💡 优化您的描述';
    let description = '';
    let reason = '';

    if (analysis.missingElements.length > 0) {
      title = `✨ 补充${analysis.missingElements[0]}`;
      description = `建议添加：${analysis.missingElements.join('、')}`;
      reason = `当前描述完整度${analysis.completeness}%，补充后效果会更好`;
    } else if (analysis.specificity < 60) {
      title = '🎯 让描述更具体';
      description = '使用更具体的形容词和细节描述';
      reason = '具体描述能帮助AI更准确地理解您的意图';
    } else if (analysis.clarity < 60) {
      title = '📝 扩展您的想法';
      description = '添加更多细节让创意更清晰';
      reason = '更详细的描述通常能产生更好的结果';
    }

    return {
      id: `sugg-prompt-opt-${Date.now()}`,
      type: SuggestionType.PROMPT_OPTIMIZATION,
      title,
      description,
      action: {
        type: 'message',
        payload: analysis.optimizedPrompt || '请帮我优化这个描述'
      },
      priority: Math.round((100 - analysis.completeness) * 0.8),
      reason,
      confidence: Math.round(analysis.completeness) / 100,
      timestamp: Date.now(),
      metadata: {
        analysis,
        originalPrompt: userPrompt,
        optimizedPrompt: analysis.optimizedPrompt
      }
    } as Suggestion;
  }

  /**
   * 快速检查 Prompt 质量
   */
  quickCheck(prompt: string): {
    isValid: boolean;
    score: number;
    quickTip?: string;
  } {
    const analysis = this.quickAnalyze(prompt);
    const score = (analysis.clarity + analysis.completeness + analysis.specificity) / 3;

    let quickTip: string | undefined;
    if (score < 50) {
      quickTip = '建议添加更多细节，如主体、风格、色彩等';
    } else if (score < 70) {
      quickTip = '可以尝试描述更具体的视觉效果';
    }

    return {
      isValid: score >= 40,
      score: Math.round(score),
      quickTip
    };
  }

  /**
   * 快速分析（同步版本）
   */
  private quickAnalyze(prompt: string): Omit<PromptAnalysis, 'optimizedPrompt'> {
    const lowerPrompt = prompt.toLowerCase();
    
    // 检查关键元素
    let foundElements = 0;
    for (const keywords of Object.values(DESIGN_ELEMENTS)) {
      if (keywords.some(k => lowerPrompt.includes(k))) {
        foundElements++;
      }
    }

    const totalElements = Object.keys(DESIGN_ELEMENTS).length;
    const completeness = Math.round((foundElements / totalElements) * 100);

    // 清晰度
    const wordCount = prompt.length;
    let clarity = 50;
    if (wordCount < 10) clarity = 30;
    else if (wordCount < 30) clarity = 60;
    else if (wordCount < 100) clarity = 80;
    else clarity = 90;

    // 具体度
    const vagueWords = ['好看', '漂亮', '不错', '可以'];
    const vagueCount = vagueWords.filter(w => lowerPrompt.includes(w)).length;
    const specificity = Math.max(20, 100 - vagueCount * 25);

    return {
      clarity,
      completeness,
      specificity,
      missingElements: [],
      suggestions: []
    };
  }
}

// 导出单例
let promptOptimizerInstance: PromptOptimizer | null = null;

export function getPromptOptimizer(): PromptOptimizer {
  if (!promptOptimizerInstance) {
    promptOptimizerInstance = new PromptOptimizer();
  }
  return promptOptimizerInstance;
}

export function resetPromptOptimizer(): void {
  promptOptimizerInstance = null;
}
