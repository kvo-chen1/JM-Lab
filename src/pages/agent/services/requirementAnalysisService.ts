/**
 * 需求分析服务
 * 深度分析用户需求，提供智能需求收集和分析能力
 */

import { AgentMessage, AgentType } from '../types/agent';
import { llmService } from '@/services/llmService';

// 项目类型
export type ProjectType = 
  | 'ip-character' 
  | 'brand-design' 
  | 'packaging' 
  | 'poster' 
  | 'animation' 
  | 'illustration' 
  | 'mixed'
  | 'unknown';

// 复杂度等级
export type ComplexityLevel = 'simple' | 'medium' | 'complex';

// 需求分析结果
export interface RequirementAnalysis {
  // 基础信息
  projectType: ProjectType;
  confidence: number;  // 置信度 0-1
  
  // 需求详情
  requirements: {
    description: string;        // 需求描述
    targetAudience?: string;    // 目标受众
    stylePreference?: string;   // 风格偏好
    usageScenario?: string;     // 使用场景
    brandInfo?: string;         // 品牌信息
    constraints?: string[];     // 约束条件
    keyElements?: string[];     // 关键元素
  };
  
  // 复杂度分析
  complexity: {
    level: ComplexityLevel;
    factors: string[];          // 复杂度因素
    estimatedTime: string;      // 预估时间
    score: number;              // 复杂度分数 0-100
  };
  
  // Agent分配建议
  recommendedAgents: {
    primary: AgentType;         // 主负责Agent
    supporting: AgentType[];    // 辅助Agent
    reasoning: string;          // 分配理由
    confidence: number;         // 分配置信度
  };
  
  // 缺失信息
  missingInfo: {
    questions: string[];        // 需要询问的问题
    importance: 'high' | 'medium' | 'low';  // 重要程度
    missingFields: string[];    // 缺失的字段
  };
  
  // 用户意图
  intent: {
    type: 'create' | 'modify' | 'consult' | 'continue' | 'greeting';
    urgency: 'high' | 'medium' | 'low';
    explicit: boolean;          // 是否明确表达
  };
  
  // 分析元数据
  meta: {
    analyzedAt: number;
    messageCount: number;
    analysisVersion: string;
  };
}

// 分析选项
export interface AnalysisOptions {
  deepAnalysis?: boolean;       // 是否进行深度分析
  useHistory?: boolean;         // 是否使用历史消息
  maxRetries?: number;          // 最大重试次数
  timeout?: number;             // 超时时间
}

// 默认分析选项
const DEFAULT_OPTIONS: AnalysisOptions = {
  deepAnalysis: true,
  useHistory: true,
  maxRetries: 2,
  timeout: 10000
};

/**
 * 需求分析服务类
 */
export class RequirementAnalysisService {
  private cache: Map<string, RequirementAnalysis> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 分析用户需求
   */
  async analyze(
    message: string, 
    history: AgentMessage[] = [],
    options: AnalysisOptions = {}
  ): Promise<RequirementAnalysis> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    // 检查缓存
    const cacheKey = this.generateCacheKey(message, history);
    const cached = this.getCachedAnalysis(cacheKey);
    if (cached) {
      console.log('[RequirementAnalysis] 使用缓存结果');
      return cached;
    }

    try {
      // 构建分析提示词
      const prompt = this.buildAnalysisPrompt(message, history, opts);
      
      // 调用LLM进行分析
      const response = await llmService.generateResponse(prompt, {
        priority: 'high',
        timeout: opts.timeout
      });

      // 解析分析结果
      const analysis = this.parseAnalysisResult(response, message, history);
      
      // 缓存结果
      this.cacheAnalysis(cacheKey, analysis);
      
      console.log('[RequirementAnalysis] 分析完成:', {
        projectType: analysis.projectType,
        confidence: analysis.confidence,
        complexity: analysis.complexity.level
      });

      return analysis;
    } catch (error) {
      console.error('[RequirementAnalysis] 分析失败:', error);
      // 返回降级分析结果
      return this.generateFallbackAnalysis(message);
    }
  }

  /**
   * 快速分析（轻量级）
   */
  async quickAnalyze(message: string): Promise<Partial<RequirementAnalysis>> {
    const prompt = `快速分析以下设计需求，返回JSON格式：

用户需求："${message}"

请分析：
1. 项目类型（ip-character/brand-design/packaging/poster/animation/illustration）
2. 置信度（0-1）
3. 关键信息提取

返回格式：
{
  "projectType": "类型",
  "confidence": 0.8,
  "keyInfo": {
    "description": "需求描述",
    "targetAudience": "目标受众",
    "stylePreference": "风格偏好"
  }
}`;

    try {
      const response = await llmService.generateResponse(prompt, {
        priority: 'normal',
        timeout: 5000
      });
      return this.parseQuickAnalysis(response);
    } catch (error) {
      return this.extractKeyInfo(message);
    }
  }

  /**
   * 提取关键信息
   */
  extractKeyInfo(message: string): Partial<RequirementAnalysis['requirements']> {
    const lowerMsg = message.toLowerCase();
    const result: Partial<RequirementAnalysis['requirements']> = {
      description: message
    };

    // 提取目标受众
    const audiencePatterns = [
      { pattern: /(年轻人|青年|青少年)/, value: '年轻人' },
      { pattern: /(儿童|小孩|孩子|宝宝)/, value: '儿童' },
      { pattern: /(老人|老年人|中老年)/, value: '老年人' },
      { pattern: /(商务人士|职场|白领)/, value: '商务人士' },
      { pattern: /(学生|大学生)/, value: '学生' },
      { pattern: /(女性|女生|女士|妈妈)/, value: '女性' },
      { pattern: /(男性|男生|男士)/, value: '男性' }
    ];

    for (const { pattern, value } of audiencePatterns) {
      if (pattern.test(lowerMsg)) {
        result.targetAudience = value;
        break;
      }
    }

    // 提取风格偏好
    const stylePatterns = [
      { pattern: /(简约|极简|简单)/, value: '简约风格' },
      { pattern: /(复古|怀旧|古典)/, value: '复古风格' },
      { pattern: /(可爱|萌|卡通)/, value: '可爱风格' },
      { pattern: /(酷炫|炫酷|科技)/, value: '科技风格' },
      { pattern: /(温馨|温暖|治愈)/, value: '温馨风格' },
      { pattern: /(华丽|奢华|高端)/, value: '华丽风格' },
      { pattern: /(手绘|插画|艺术)/, value: '手绘风格' }
    ];

    for (const { pattern, value } of stylePatterns) {
      if (pattern.test(lowerMsg)) {
        result.stylePreference = value;
        break;
      }
    }

    // 提取使用场景
    const scenarioPatterns = [
      { pattern: /(线上|网络|互联网|电商)/, value: '线上推广' },
      { pattern: /(线下|实体|门店|店铺)/, value: '线下物料' },
      { pattern: /(印刷|打印|海报|宣传)/, value: '印刷物料' },
      { pattern: /(社交|朋友圈|微信|微博)/, value: '社交媒体' },
      { pattern: /(包装|产品|商品)/, value: '产品包装' }
    ];

    for (const { pattern, value } of scenarioPatterns) {
      if (pattern.test(lowerMsg)) {
        result.usageScenario = value;
        break;
      }
    }

    // 提取品牌信息（@品牌名）
    const brandMatch = message.match(/@([^\s,，.。!！?？]+)/);
    if (brandMatch) {
      result.brandInfo = brandMatch[1];
    }

    // 提取关键元素
    const elementPatterns = [
      /(动物|宠物|猫|狗|鸟|鱼)/,
      /(植物|花|树|草)/,
      /(建筑|房子|楼|桥)/,
      /(人物|角色|形象|IP)/,
      /(文字|字体|标语|logo)/
    ];

    result.keyElements = [];
    for (const pattern of elementPatterns) {
      const match = lowerMsg.match(pattern);
      if (match) {
        result.keyElements.push(match[0]);
      }
    }

    return result;
  }

  /**
   * 评估需求完整度
   */
  evaluateCompleteness(analysis: RequirementAnalysis): number {
    const { requirements, confidence, missingInfo } = analysis;
    
    let score = 0;
    const weights = {
      description: 20,
      targetAudience: 20,
      stylePreference: 20,
      usageScenario: 15,
      brandInfo: 10,
      confidence: 15
    };

    if (requirements.description) score += weights.description;
    if (requirements.targetAudience) score += weights.targetAudience;
    if (requirements.stylePreference) score += weights.stylePreference;
    if (requirements.usageScenario) score += weights.usageScenario;
    if (requirements.brandInfo) score += weights.brandInfo;
    
    // 置信度加权
    score += confidence * weights.confidence;

    // 缺失信息惩罚
    const missingPenalty = missingInfo.missingFields.length * 5;
    score = Math.max(0, score - missingPenalty);

    return Math.min(100, score);
  }

  /**
   * 生成追问问题
   */
  generateFollowUpQuestions(analysis: RequirementAnalysis): string[] {
    const { missingInfo, requirements, projectType } = analysis;
    const questions: string[] = [];

    // 基于缺失信息生成问题
    if (!requirements.targetAudience) {
      questions.push('这个设计主要面向哪些人群？（如：年轻人、儿童、商务人士等）');
    }

    if (!requirements.stylePreference) {
      questions.push('您希望呈现什么样的风格？（如：简约、复古、可爱、科技感等）');
    }

    if (!requirements.usageScenario) {
      questions.push('这个设计主要用在哪里？（如：线上推广、线下物料、产品包装等）');
    }

    // 基于项目类型生成专业问题
    switch (projectType) {
      case 'ip-character':
        if (!requirements.keyElements?.includes('角色')) {
          questions.push('您希望这个角色有什么样的性格特征或故事背景？');
        }
        break;
      case 'brand-design':
        if (!requirements.brandInfo) {
          questions.push('请告诉我品牌名称和品牌的核心价值/理念');
        }
        break;
      case 'packaging':
        questions.push('这是什么产品的包装？有什么特殊的功能需求吗？');
        break;
    }

    // 根据重要程度排序
    if (missingInfo.importance === 'high') {
      return questions.slice(0, 2); // 高优先级只问最关键的问题
    }

    return questions.slice(0, 3);
  }

  /**
   * 判断是否可以开始设计
   */
  canStartDesign(analysis: RequirementAnalysis): {
    canStart: boolean;
    reason: string;
    confidence: number;
  } {
    const completeness = this.evaluateCompleteness(analysis);
    const { confidence, missingInfo, intent } = analysis;

    // 用户明确表达紧急或明确意图
    if (intent.explicit && intent.urgency === 'high') {
      return {
        canStart: true,
        reason: '用户明确表达了设计需求，可以开始',
        confidence: confidence * 0.9
      };
    }

    // 完整度足够高
    if (completeness >= 70 && confidence >= 0.7) {
      return {
        canStart: true,
        reason: `需求完整度${completeness.toFixed(0)}%，信息较充分`,
        confidence
      };
    }

    // 关键信息缺失
    if (missingInfo.importance === 'high' && missingInfo.missingFields.length > 0) {
      return {
        canStart: false,
        reason: `缺少关键信息：${missingInfo.missingFields.join('、')}`,
        confidence: confidence * 0.5
      };
    }

    // 置信度太低
    if (confidence < 0.5) {
      return {
        canStart: false,
        reason: '需求不够明确，需要进一步澄清',
        confidence
      };
    }

    // 默认可以继续
    return {
      canStart: completeness >= 50,
      reason: completeness >= 50 ? '基本信息已具备，可以开始设计' : '建议补充更多信息',
      confidence
    };
  }

  /**
   * 生成智能回复
   */
  async generateResponse(analysis: RequirementAnalysis): Promise<string> {
    const { projectType, requirements, missingInfo, recommendedAgents, complexity } = analysis;
    
    let response = '';

    // 确认已理解的信息
    response += '**我已经了解了以下信息：**\n\n';
    response += `- 项目类型：**${this.getProjectTypeName(projectType)}**\n`;
    if (requirements.targetAudience) {
      response += `- 目标受众：**${requirements.targetAudience}**\n`;
    }
    if (requirements.stylePreference) {
      response += `- 风格偏好：**${requirements.stylePreference}**\n`;
    }
    if (requirements.usageScenario) {
      response += `- 使用场景：**${requirements.usageScenario}**\n`;
    }

    // 复杂度评估
    response += `\n**项目复杂度评估：**${this.getComplexityLabel(complexity.level)}\n`;
    response += `预计完成时间：**${complexity.estimatedTime}**\n`;

    // 团队分配建议
    response += `\n**建议团队配置：**\n`;
    response += `- 主要负责：${this.getAgentName(recommendedAgents.primary)}\n`;
    if (recommendedAgents.supporting.length > 0) {
      response += `- 协助团队：${recommendedAgents.supporting.map(a => this.getAgentName(a)).join('、')}\n`;
    }

    // 询问缺失信息
    if (missingInfo.questions.length > 0) {
      response += `\n**为了做出更好的设计，我还想了解：**\n\n`;
      missingInfo.questions.forEach((q, i) => {
        response += `${i + 1}. ${q}\n`;
      });
    }

    return response;
  }

  // ============ 私有方法 ============

  private buildAnalysisPrompt(
    message: string, 
    history: AgentMessage[],
    options: AnalysisOptions
  ): string {
    const historyContext = options.useHistory && history.length > 0
      ? `\n历史对话：\n${history.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}`
      : '';

    return `作为专业的设计需求分析师，请深度分析以下用户需求。

用户输入："${message}"${historyContext}

请从以下维度进行专业分析，返回JSON格式：

{
  "projectType": "项目类型（ip-character/brand-design/packaging/poster/animation/illustration/mixed/unknown）",
  "confidence": 0.85,
  "requirements": {
    "description": "需求描述",
    "targetAudience": "目标受众",
    "stylePreference": "风格偏好",
    "usageScenario": "使用场景",
    "brandInfo": "品牌信息",
    "constraints": ["约束条件"],
    "keyElements": ["关键元素"]
  },
  "complexity": {
    "level": "simple/medium/complex",
    "factors": ["复杂度因素"],
    "estimatedTime": "预估时间",
    "score": 65
  },
  "recommendedAgents": {
    "primary": "主负责Agent类型",
    "supporting": ["辅助Agent类型"],
    "reasoning": "分配理由",
    "confidence": 0.9
  },
  "missingInfo": {
    "questions": ["需要询问的问题"],
    "importance": "high/medium/low",
    "missingFields": ["缺失字段"]
  },
  "intent": {
    "type": "create/modify/consult/continue/greeting",
    "urgency": "high/medium/low",
    "explicit": true
  }
}

分析要求：
1. projectType：准确识别项目类型，不确定时用unknown
2. confidence：对分析结果的置信度（0-1）
3. complexity：评估项目复杂度，考虑创意难度、技术要求、时间压力等
4. recommendedAgents：基于项目类型推荐最适合的Agent
5. missingInfo：识别缺失的关键信息，按重要程度排序
6. intent：判断用户意图和紧急程度

请确保分析专业、准确、全面。`;
  }

  private parseAnalysisResult(
    response: string, 
    message: string,
    history: AgentMessage[]
  ): RequirementAnalysis {
    try {
      // 提取JSON
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('无法解析分析结果');
      }

      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return {
        projectType: parsed.projectType || 'unknown',
        confidence: parsed.confidence || 0.5,
        requirements: {
          description: parsed.requirements?.description || message,
          targetAudience: parsed.requirements?.targetAudience,
          stylePreference: parsed.requirements?.stylePreference,
          usageScenario: parsed.requirements?.usageScenario,
          brandInfo: parsed.requirements?.brandInfo,
          constraints: parsed.requirements?.constraints || [],
          keyElements: parsed.requirements?.keyElements || []
        },
        complexity: {
          level: parsed.complexity?.level || 'medium',
          factors: parsed.complexity?.factors || [],
          estimatedTime: parsed.complexity?.estimatedTime || '1-2天',
          score: parsed.complexity?.score || 50
        },
        recommendedAgents: {
          primary: parsed.recommendedAgents?.primary || 'designer',
          supporting: parsed.recommendedAgents?.supporting || [],
          reasoning: parsed.recommendedAgents?.reasoning || '基于项目类型的默认分配',
          confidence: parsed.recommendedAgents?.confidence || 0.7
        },
        missingInfo: {
          questions: parsed.missingInfo?.questions || [],
          importance: parsed.missingInfo?.importance || 'medium',
          missingFields: parsed.missingInfo?.missingFields || []
        },
        intent: {
          type: parsed.intent?.type || 'consult',
          urgency: parsed.intent?.urgency || 'medium',
          explicit: parsed.intent?.explicit ?? false
        },
        meta: {
          analyzedAt: Date.now(),
          messageCount: history.length + 1,
          analysisVersion: '1.0'
        }
      };
    } catch (error) {
      console.error('[RequirementAnalysis] 解析失败:', error);
      return this.generateFallbackAnalysis(message);
    }
  }

  private parseQuickAnalysis(response: string): Partial<RequirementAnalysis> {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('[RequirementAnalysis] 快速分析解析失败');
    }
    return {};
  }

  private generateFallbackAnalysis(message: string): RequirementAnalysis {
    const keyInfo = this.extractKeyInfo(message);
    
    return {
      projectType: 'unknown',
      confidence: 0.3,
      requirements: {
        description: message,
        ...keyInfo
      },
      complexity: {
        level: 'medium',
        factors: ['需求不够明确'],
        estimatedTime: '待定',
        score: 50
      },
      recommendedAgents: {
        primary: 'director',
        supporting: [],
        reasoning: '需求不够明确，需要设计总监进一步收集',
        confidence: 0.5
      },
      missingInfo: {
        questions: [
          '请详细描述您的设计需求',
          '这个设计的目标受众是谁？',
          '您希望呈现什么样的风格？'
        ],
        importance: 'high',
        missingFields: ['description', 'targetAudience', 'stylePreference']
      },
      intent: {
        type: 'consult',
        urgency: 'medium',
        explicit: false
      },
      meta: {
        analyzedAt: Date.now(),
        messageCount: 1,
        analysisVersion: '1.0-fallback'
      }
    };
  }

  private generateCacheKey(message: string, history: AgentMessage[]): string {
    return `${message}_${history.length}`;
  }

  private getCachedAnalysis(key: string): RequirementAnalysis | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.meta.analyzedAt < this.cacheTimeout) {
      return cached;
    }
    return null;
  }

  private cacheAnalysis(key: string, analysis: RequirementAnalysis): void {
    this.cache.set(key, analysis);
    
    // 清理过期缓存
    const now = Date.now();
    for (const [k, v] of this.cache.entries()) {
      if (now - v.meta.analyzedAt > this.cacheTimeout) {
        this.cache.delete(k);
      }
    }
  }

  private getProjectTypeName(type: ProjectType): string {
    const names: Record<ProjectType, string> = {
      'ip-character': 'IP形象设计',
      'brand-design': '品牌设计',
      'packaging': '包装设计',
      'poster': '海报设计',
      'animation': '动画视频',
      'illustration': '插画设计',
      'mixed': '综合设计项目',
      'unknown': '待确定'
    };
    return names[type] || type;
  }

  private getComplexityLabel(level: ComplexityLevel): string {
    const labels: Record<ComplexityLevel, string> = {
      'simple': '🟢 简单',
      'medium': '🟡 中等',
      'complex': '🔴 复杂'
    };
    return labels[level];
  }

  private getAgentName(type: AgentType): string {
    const names: Record<AgentType, string> = {
      'director': '津脉设计总监',
      'designer': '津脉品牌设计师',
      'illustrator': '津脉插画师',
      'copywriter': '津脉文案策划',
      'animator': '津脉动画师',
      'researcher': '津脉研究员',
      'system': '系统',
      'user': '用户'
    };
    return names[type] || type;
  }
}

// 导出单例实例
export const requirementAnalysisService = new RequirementAnalysisService();

// 导出便捷函数
export async function analyzeRequirements(
  message: string,
  history?: AgentMessage[],
  options?: AnalysisOptions
): Promise<RequirementAnalysis> {
  return requirementAnalysisService.analyze(message, history, options);
}

export function quickAnalyzeRequirements(message: string): Promise<Partial<RequirementAnalysis>> {
  return requirementAnalysisService.quickAnalyze(message);
}
