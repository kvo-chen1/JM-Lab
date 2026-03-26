/**
 * 智能决策引擎
 * 基于多维度因素做出智能调度决策
 */

import { AgentType, AgentMessage, DesignTask, DelegationTask } from '../types/agent';
import { RequirementAnalysis } from './requirementAnalysisService';

// 决策上下文
export interface DecisionContext {
  userMessage: string;
  requirementAnalysis: RequirementAnalysis;
  currentAgent: AgentType;
  conversationHistory: AgentMessage[];
  availableAgents: AgentType[];
  systemStatus: {
    isGenerating: boolean;
    currentTask: DesignTask | null;
    pendingDelegations: DelegationTask[];
    isThinking: boolean;
  };
}

// 决策结果
export interface DecisionResult {
  action: 'respond' | 'delegate' | 'collaborate' | 'handoff' | 'chain' | 'generate' | 'collect';
  targetAgent?: AgentType;
  targetAgents?: AgentType[];
  reasoning: string;
  confidence: number;
  plan?: {
    steps: string[];
    estimatedTime: string;
  };
  metadata?: {
    analysisScore: number;
    agentMatchScore: number;
    complexityScore: number;
  };
}

// Agent能力定义
interface AgentCapability {
  type: AgentType;
  strengths: string[];
  specialties: string[];
  complexityRange: [number, number]; // 复杂度适应范围 0-100
  collaborationScore: number; // 协作能力 0-1
}

// Agent能力配置
const AGENT_CAPABILITIES: AgentCapability[] = [
  {
    type: 'director',
    strengths: ['需求分析', '项目管理', '质量把控', '团队协调'],
    specialties: ['需求收集', '任务分配', '项目规划', '质量审核'],
    complexityRange: [0, 100],
    collaborationScore: 1.0
  },
  {
    type: 'designer',
    strengths: ['视觉设计', '品牌设计', '图像生成', '包装设计'],
    specialties: ['logo设计', '品牌视觉', '海报设计', '包装视觉', '图像生成'],
    complexityRange: [20, 90],
    collaborationScore: 0.8
  },
  {
    type: 'illustrator',
    strengths: ['插画创作', '角色设计', '手绘风格', '概念设计'],
    specialties: ['IP形象', '角色设计', '插画', '概念图', '手绘风格'],
    complexityRange: [20, 95],
    collaborationScore: 0.7
  },
  {
    type: 'copywriter',
    strengths: ['文案创作', '品牌故事', '标语设计', '内容策划'],
    specialties: ['品牌文案', '标语创作', '故事编写', '内容策划', '命名'],
    complexityRange: [10, 80],
    collaborationScore: 0.9
  },
  {
    type: 'animator',
    strengths: ['动画制作', '视频编辑', '动效设计', '表情包'],
    specialties: ['动画视频', '动效设计', '视频剪辑', '表情包', '短视频'],
    complexityRange: [40, 100],
    collaborationScore: 0.6
  },
  {
    type: 'researcher',
    strengths: ['市场调研', '竞品分析', '趋势研究', '数据分析'],
    specialties: ['市场调研', '竞品分析', '用户研究', '趋势分析', '策略建议'],
    complexityRange: [30, 100],
    collaborationScore: 0.9
  }
];

// 项目类型与Agent匹配度
const PROJECT_TYPE_AGENT_MATCH: Record<string, { primary: AgentType; supporting: AgentType[] }> = {
  'ip-character': { primary: 'illustrator', supporting: ['designer', 'copywriter'] },
  'brand-design': { primary: 'designer', supporting: ['copywriter', 'researcher'] },
  'packaging': { primary: 'designer', supporting: ['illustrator', 'copywriter'] },
  'poster': { primary: 'designer', supporting: ['copywriter', 'illustrator'] },
  'animation': { primary: 'animator', supporting: ['designer', 'copywriter'] },
  'illustration': { primary: 'illustrator', supporting: ['designer'] },
  'mixed': { primary: 'director', supporting: ['designer', 'illustrator', 'copywriter'] }
};

/**
 * 智能决策引擎类
 */
export class DecisionEngine {
  private agentCapabilities: Map<AgentType, AgentCapability>;

  constructor() {
    this.agentCapabilities = new Map();
    AGENT_CAPABILITIES.forEach(cap => {
      this.agentCapabilities.set(cap.type, cap);
    });
  }

  /**
   * 做出智能决策
   */
  async makeDecision(context: DecisionContext): Promise<DecisionResult> {
    console.log('[DecisionEngine] 开始决策分析...');

    const { requirementAnalysis, systemStatus, conversationHistory } = context;
    const { confidence, complexity, recommendedAgents, missingInfo, intent } = requirementAnalysis;

    // 1. 计算各维度分数
    const analysisScore = this.calculateAnalysisScore(requirementAnalysis);
    const complexityScore = complexity.score;
    const agentMatchScore = this.calculateAgentMatchScore(recommendedAgents.primary, requirementAnalysis);

    console.log('[DecisionEngine] 评分:', {
      analysisScore,
      complexityScore,
      agentMatchScore
    });

    // 2. 决策逻辑

    // 场景A：系统正在生成中，避免重复请求
    if (systemStatus.isGenerating) {
      return {
        action: 'respond',
        reasoning: '系统正在生成中，请等待当前任务完成',
        confidence: 0.95,
        metadata: { analysisScore, agentMatchScore, complexityScore }
      };
    }

    // 场景B：用户意图是问候或简单咨询
    if (intent.type === 'greeting') {
      return {
        action: 'respond',
        reasoning: '用户只是打招呼，需要热情回应并引导需求',
        confidence: 0.9,
        metadata: { analysisScore, agentMatchScore, complexityScore }
      };
    }

    // 场景C：需求信息严重不足
    if (analysisScore < 40 || confidence < 0.4) {
      return {
        action: 'collect',
        reasoning: `需求信息不足（完整度${analysisScore.toFixed(0)}%），需要进一步收集`,
        confidence: 0.85,
        metadata: { analysisScore, agentMatchScore, complexityScore }
      };
    }

    // 场景D：用户明确拒绝详细收集
    const lastMessage = context.userMessage.toLowerCase();
    if (lastMessage.includes('直接开始') || 
        lastMessage.includes('你决定') || 
        lastMessage.includes('随便') ||
        lastMessage.includes('不用问了')) {
      return {
        action: analysisScore >= 50 ? 'delegate' : 'collect',
        targetAgent: recommendedAgents.primary,
        reasoning: '用户希望快速开始，基于已有信息进行设计',
        confidence: 0.8,
        plan: {
          steps: ['快速确认需求', '开始设计创作'],
          estimatedTime: complexity.estimatedTime
        },
        metadata: { analysisScore, agentMatchScore, complexityScore }
      };
    }

    // 场景E：信息基本完整，可以开始设计
    if (analysisScore >= 60 && confidence >= 0.6) {
      // 判断是否需要多Agent协作
      if (complexityScore >= 70 || recommendedAgents.supporting.length >= 2) {
        return {
          action: 'collaborate',
          targetAgents: [recommendedAgents.primary, ...recommendedAgents.supporting],
          reasoning: `项目复杂度较高（${complexityScore}分），需要多Agent协作完成`,
          confidence: 0.85,
          plan: {
            steps: ['需求确认', '分工协作', '设计创作', '质量审核'],
            estimatedTime: complexity.estimatedTime
          },
          metadata: { analysisScore, agentMatchScore, complexityScore }
        };
      }

      // 单一Agent即可处理
      return {
        action: 'delegate',
        targetAgent: recommendedAgents.primary,
        reasoning: recommendedAgents.reasoning,
        confidence: recommendedAgents.confidence,
        plan: {
          steps: ['需求确认', '设计创作', '质量检查'],
          estimatedTime: complexity.estimatedTime
        },
        metadata: { analysisScore, agentMatchScore, complexityScore }
      };
    }

    // 场景F：信息部分完整，继续收集关键信息
    if (missingInfo.importance === 'high' && missingInfo.questions.length > 0) {
      return {
        action: 'collect',
        reasoning: `缺少关键信息：${missingInfo.missingFields.join('、')}`,
        confidence: 0.75,
        metadata: { analysisScore, agentMatchScore, complexityScore }
      };
    }

    // 默认：继续收集信息
    return {
      action: 'collect',
      reasoning: '需要更多信息才能做出准确判断',
      confidence: 0.6,
      metadata: { analysisScore, agentMatchScore, complexityScore }
    };
  }

  /**
   * 评估Agent匹配度
   */
  evaluateAgentMatch(agent: AgentType, requirements: RequirementAnalysis): {
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
  } {
    const capability = this.agentCapabilities.get(agent);
    if (!capability) {
      return {
        score: 0.5,
        strengths: [],
        weaknesses: ['未知Agent类型'],
        recommendation: '使用默认Agent'
      };
    }

    const { projectType, complexity, requirements: reqDetails } = requirements;
    let score = 0.5;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // 1. 项目类型匹配
    const typeMatch = PROJECT_TYPE_AGENT_MATCH[projectType];
    if (typeMatch) {
      if (typeMatch.primary === agent) {
        score += 0.3;
        strengths.push('项目类型的最佳匹配');
      } else if (typeMatch.supporting.includes(agent)) {
        score += 0.15;
        strengths.push('适合协助完成此类型项目');
      }
    }

    // 2. 复杂度匹配
    if (complexity.score >= capability.complexityRange[0] && 
        complexity.score <= capability.complexityRange[1]) {
      score += 0.2;
      strengths.push('复杂度在能力范围内');
    } else if (complexity.score > capability.complexityRange[1]) {
      score -= 0.1;
      weaknesses.push('项目复杂度超出常规能力范围');
    }

    // 3. 专业领域匹配
    const styleMatch = this.matchStyleToAgent(reqDetails.stylePreference || '', agent);
    if (styleMatch > 0.5) {
      score += 0.15;
      strengths.push('擅长用户偏好的风格');
    }

    // 4. 协作能力（复杂项目）
    if (complexity.level === 'complex' && capability.collaborationScore > 0.8) {
      score += 0.1;
      strengths.push('优秀的协作能力');
    }

    // 生成推荐语
    let recommendation = '';
    if (score >= 0.8) {
      recommendation = `${capability.type}是此项目的最佳选择，专业匹配度高`;
    } else if (score >= 0.6) {
      recommendation = `${capability.type}能够胜任此项目，建议由其主导`;
    } else {
      recommendation = `${capability.type}可以参与，但可能需要其他Agent协助`;
    }

    return {
      score: Math.min(1, Math.max(0, score)),
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 2),
      recommendation
    };
  }

  /**
   * 生成决策解释
   */
  generateDecisionExplanation(decision: DecisionResult): string {
    const { action, targetAgent, targetAgents, reasoning, confidence, plan } = decision;

    let explanation = '';

    switch (action) {
      case 'collect':
        explanation = `我需要更多信息才能为您提供最佳设计方案。\n\n${reasoning}`;
        break;

      case 'delegate':
        explanation = `我将安排 **${this.getAgentName(targetAgent!)}** 来负责您的项目。\n\n${reasoning}`;
        if (plan) {
          explanation += `\n\n预计完成时间：**${plan.estimatedTime}**`;
        }
        break;

      case 'collaborate':
        explanation = `这是一个综合性项目，我将组织专家团队协作完成：\n\n`;
        targetAgents?.forEach((agent, i) => {
          const role = i === 0 ? '主负责' : '协助';
          explanation += `${i + 1}. **${this.getAgentName(agent)}** - ${role}\n`;
        });
        explanation += `\n${reasoning}`;
        if (plan) {
          explanation += `\n\n预计完成时间：**${plan.estimatedTime}**`;
        }
        break;

      case 'generate':
        explanation = `基于您的需求，我现在开始为您创作设计。\n\n${reasoning}`;
        break;

      default:
        explanation = reasoning;
    }

    return explanation;
  }

  /**
   * 推荐最佳Agent组合
   */
  recommendAgentTeam(requirements: RequirementAnalysis): {
    primary: AgentType;
    supporting: AgentType[];
    reasoning: string;
  } {
    const { projectType, complexity } = requirements;

    // 基于项目类型获取默认配置
    const defaultMatch = PROJECT_TYPE_AGENT_MATCH[projectType] || 
                        { primary: 'designer', supporting: [] };

    // 评估各Agent匹配度
    const agentScores = AGENT_CAPABILITIES.map(cap => ({
      type: cap.type,
      ...this.evaluateAgentMatch(cap.type, requirements)
    })).sort((a, b) => b.score - a.score);

    // 选择主负责Agent
    const primary = agentScores[0]?.type || defaultMatch.primary;

    // 选择辅助Agent
    let supporting: AgentType[] = [];
    
    if (complexity.level === 'complex') {
      // 复杂项目需要2-3个辅助Agent
      supporting = agentScores
        .slice(1, 4)
        .filter(a => a.score > 0.5 && a.type !== primary)
        .map(a => a.type);
    } else if (complexity.level === 'medium') {
      // 中等复杂度项目需要1-2个辅助Agent
      supporting = agentScores
        .slice(1, 3)
        .filter(a => a.score > 0.6 && a.type !== primary)
        .map(a => a.type);
    }

    // 生成推荐理由
    const primaryEval = agentScores.find(a => a.type === primary);
    const reasoning = primaryEval?.recommendation || 
                     `基于项目类型和复杂度，${this.getAgentName(primary)}最适合主导此项目`;

    return {
      primary,
      supporting: supporting.slice(0, 2), // 最多2个辅助Agent
      reasoning
    };
  }

  /**
   * 评估是否需要切换Agent
   */
  shouldSwitchAgent(
    currentAgent: AgentType,
    requirements: RequirementAnalysis,
    conversationHistory: AgentMessage[]
  ): {
    shouldSwitch: boolean;
    recommendedAgent?: AgentType;
    reason: string;
  } {
    const { projectType, confidence } = requirements;

    // 如果当前Agent已经是最佳匹配，不切换
    const typeMatch = PROJECT_TYPE_AGENT_MATCH[projectType];
    if (typeMatch?.primary === currentAgent) {
      return {
        shouldSwitch: false,
        reason: '当前Agent已是最佳匹配'
      };
    }

    // 如果需求置信度低，保持当前Agent继续收集
    if (confidence < 0.5) {
      return {
        shouldSwitch: false,
        reason: '需求不够明确，继续收集信息'
      };
    }

    // 检查对话历史，如果用户多次提到特定领域，考虑切换
    const recentMessages = conversationHistory.slice(-5);
    const messageText = recentMessages.map(m => m.content).join(' ').toLowerCase();

    // 检测领域转换信号
    if (currentAgent !== 'illustrator' && 
        (messageText.includes('插画') || messageText.includes('手绘') || messageText.includes('角色'))) {
      return {
        shouldSwitch: true,
        recommendedAgent: 'illustrator',
        reason: '用户多次提到插画/角色相关内容，建议切换至插画师'
      };
    }

    if (currentAgent !== 'animator' && 
        (messageText.includes('动画') || messageText.includes('视频') || messageText.includes('动效'))) {
      return {
        shouldSwitch: true,
        recommendedAgent: 'animator',
        reason: '用户多次提到动画/视频相关内容，建议切换至动画师'
      };
    }

    // 如果当前Agent匹配度太低，建议切换
    const currentMatch = this.evaluateAgentMatch(currentAgent, requirements);
    if (currentMatch.score < 0.4) {
      const recommended = this.recommendAgentTeam(requirements);
      return {
        shouldSwitch: true,
        recommendedAgent: recommended.primary,
        reason: `当前Agent匹配度较低（${(currentMatch.score * 100).toFixed(0)}%），建议切换至更合适的Agent`
      };
    }

    return {
      shouldSwitch: false,
      reason: '当前Agent匹配度良好，继续当前对话'
    };
  }

  // ============ 私有方法 ============

  private calculateAnalysisScore(analysis: RequirementAnalysis): number {
    const { requirements, confidence, missingInfo } = analysis;
    
    let score = 0;
    const totalFields = 6; // description, targetAudience, stylePreference, usageScenario, brandInfo, constraints
    let filledFields = 0;

    if (requirements.description) filledFields++;
    if (requirements.targetAudience) filledFields++;
    if (requirements.stylePreference) filledFields++;
    if (requirements.usageScenario) filledFields++;
    if (requirements.brandInfo) filledFields++;
    if (requirements.constraints && requirements.constraints.length > 0) filledFields++;

    // 基础分数（字段完整度）
    score = (filledFields / totalFields) * 60;

    // 置信度加权
    score += confidence * 25;

    // 缺失信息惩罚
    const missingPenalty = missingInfo.missingFields.length * 5;
    score -= missingPenalty;

    return Math.max(0, Math.min(100, score));
  }

  private calculateAgentMatchScore(agent: AgentType, requirements: RequirementAnalysis): number {
    const evaluation = this.evaluateAgentMatch(agent, requirements);
    return evaluation.score;
  }

  private matchStyleToAgent(style: string, agent: AgentType): number {
    const styleLower = style.toLowerCase();
    
    const styleAgentMap: Record<string, AgentType[]> = {
      '插画': ['illustrator', 'designer'],
      '手绘': ['illustrator'],
      '卡通': ['illustrator', 'designer'],
      '角色': ['illustrator'],
      '动画': ['animator'],
      '视频': ['animator'],
      '文案': ['copywriter'],
      '文字': ['copywriter'],
      '科技': ['designer', 'animator'],
      '简约': ['designer'],
      '品牌': ['designer', 'copywriter']
    };

    for (const [keyword, agents] of Object.entries(styleAgentMap)) {
      if (styleLower.includes(keyword) && agents.includes(agent)) {
        return 0.8;
      }
    }

    return 0.3;
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
export const decisionEngine = new DecisionEngine();

// 导出便捷函数
export async function makeDecision(context: DecisionContext): Promise<DecisionResult> {
  return decisionEngine.makeDecision(context);
}

export function evaluateAgentMatch(agent: AgentType, requirements: RequirementAnalysis) {
  return decisionEngine.evaluateAgentMatch(agent, requirements);
}

export function recommendAgentTeam(requirements: RequirementAnalysis) {
  return decisionEngine.recommendAgentTeam(requirements);
}
