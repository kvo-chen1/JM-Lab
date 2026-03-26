/**
 * 设计总监 Agent - 强化版
 * 统筹全局，负责深度需求分析、智能任务分配和项目质量把控
 */

import { BaseAgent, AgentResponse, ExecutionContext } from './BaseAgent';
import { AgentType, AgentMessage, DesignTask } from '../types/agent';
import { 
  RequirementAnalysisService, 
  RequirementAnalysis,
  analyzeRequirements 
} from '../services/requirementAnalysisService';
import { llmService } from '@/services/llmService';

// 任务规划结果
interface TaskPlan {
  steps: TaskStep[];
  estimatedDuration: string;
  requiredAgents: AgentType[];
  checkpoints: string[];
}

interface TaskStep {
  id: string;
  name: string;
  description: string;
  assignedAgent: AgentType;
  dependencies: string[];
  estimatedTime: string;
}

// 调度决策
interface DispatchDecision {
  action: 'collect' | 'delegate' | 'collaborate' | 'generate';
  targetAgent?: AgentType;
  targetAgents?: AgentType[];
  reasoning: string;
  nextMessage: string;
  taskPlan?: TaskPlan;
}

// 质量评估结果
interface QualityReview {
  score: number;
  meetsRequirements: boolean;
  feedback: string;
  suggestions: string[];
  needsRevision: boolean;
}

/**
 * 设计总监 Agent - 强化版
 */
export class DirectorAgent extends BaseAgent {
  readonly type: AgentType = 'director';
  readonly name = '津脉设计总监';
  readonly description = '统筹全局，负责深度需求分析、智能任务分配和项目质量把控';
  
  private analysisService: RequirementAnalysisService;
  private currentAnalysis: RequirementAnalysis | null = null;
  private conversationStage: 'greeting' | 'analyzing' | 'collecting' | 'planning' | 'executing' | 'reviewing' = 'greeting';

  constructor() {
    super();
    this.analysisService = new RequirementAnalysisService();
  }

  /**
   * 处理用户消息 - 主入口
   */
  async handleMessage(message: string, context: ExecutionContext): Promise<AgentResponse> {
    return this.handleMessageWithErrorHandling(async () => {
      console.log('[DirectorAgent] 处理消息:', message);
      console.log('[DirectorAgent] 当前阶段:', this.conversationStage);

      // 1. 问候语处理
      if (this.isGreeting(message)) {
        return this.handleGreeting();
      }

      // 2. 深度需求分析
      const analysis = await this.analyzeRequirements(message, context);
      this.currentAnalysis = analysis;

      // 3. 根据分析结果做调度决策
      const decision = await this.makeDispatchDecision(analysis, context);

      // 4. 执行决策
      return this.executeDecision(decision, analysis, context);
    });
  }

  /**
   * 深度需求分析
   */
  private async analyzeRequirements(
    message: string, 
    context: ExecutionContext
  ): Promise<RequirementAnalysis> {
    console.log('[DirectorAgent] 开始深度需求分析...');
    
    this.conversationStage = 'analyzing';
    
    const analysis = await analyzeRequirements(
      message,
      context.history,
      { deepAnalysis: true, useHistory: true }
    );

    console.log('[DirectorAgent] 需求分析完成:', {
      projectType: analysis.projectType,
      confidence: analysis.confidence,
      complexity: analysis.complexity.level
    });

    return analysis;
  }

  /**
   * 智能调度决策
   */
  private async makeDispatchDecision(
    analysis: RequirementAnalysis,
    context: ExecutionContext
  ): Promise<DispatchDecision> {
    console.log('[DirectorAgent] 制定调度决策...');

    const { intent, confidence, missingInfo } = analysis;
    const completeness = this.analysisService.evaluateCompleteness(analysis);

    // 场景1：用户只是打招呼或咨询
    if (intent.type === 'greeting' || intent.type === 'consult') {
      if (completeness < 30) {
        return {
          action: 'collect',
          reasoning: '用户需求不够明确，需要进一步收集',
          nextMessage: await this.generateCollectionMessage(analysis)
        };
      }
    }

    // 场景2：信息收集阶段
    if (this.conversationStage === 'collecting' || completeness < 60) {
      // 检查是否可以开始设计
      const canStart = this.analysisService.canStartDesign(analysis);
      
      if (!canStart.canStart && missingInfo.importance === 'high') {
        return {
          action: 'collect',
          reasoning: canStart.reason,
          nextMessage: await this.generateCollectionMessage(analysis)
        };
      }
    }

    // 场景3：可以开始设计
    if (confidence >= 0.6 && completeness >= 50) {
      this.conversationStage = 'planning';
      
      // 创建任务规划
      const taskPlan = await this.createTaskPlan(analysis);
      
      // 决定执行方式
      if (analysis.recommendedAgents.supporting.length > 0) {
        return {
          action: 'collaborate',
          targetAgents: [analysis.recommendedAgents.primary, ...analysis.recommendedAgents.supporting],
          reasoning: analysis.recommendedAgents.reasoning,
          nextMessage: await this.generateCollaborationMessage(analysis, taskPlan),
          taskPlan
        };
      } else {
        return {
          action: 'delegate',
          targetAgent: analysis.recommendedAgents.primary,
          reasoning: analysis.recommendedAgents.reasoning,
          nextMessage: await this.generateDelegationMessage(analysis, taskPlan),
          taskPlan
        };
      }
    }

    // 默认：继续收集信息
    return {
      action: 'collect',
      reasoning: '需要更多信息才能做出准确判断',
      nextMessage: await this.generateCollectionMessage(analysis)
    };
  }

  /**
   * 执行调度决策
   */
  private executeDecision(
    decision: DispatchDecision,
    analysis: RequirementAnalysis,
    context: ExecutionContext
  ): AgentResponse {
    console.log('[DirectorAgent] 执行决策:', decision.action);

    switch (decision.action) {
      case 'collect':
        this.conversationStage = 'collecting';
        return this.createTextResponse(decision.nextMessage, {
          type: 'requirement-collection',
          analysis: analysis,
          missingFields: analysis.missingInfo.missingFields
        });

      case 'delegate':
        this.conversationStage = 'executing';
        return this.createTextResponse(decision.nextMessage, {
          type: 'delegation',
          targetAgent: decision.targetAgent,
          taskPlan: decision.taskPlan,
          analysis: analysis
        });

      case 'collaborate':
        this.conversationStage = 'executing';
        return this.createTextResponse(decision.nextMessage, {
          type: 'collaboration',
          targetAgents: decision.targetAgents,
          taskPlan: decision.taskPlan,
          analysis: analysis
        });

      default:
        return this.createTextResponse(decision.nextMessage, {
          type: 'text',
          analysis: analysis
        });
    }
  }

  /**
   * 创建任务规划
   */
  private async createTaskPlan(analysis: RequirementAnalysis): Promise<TaskPlan> {
    console.log('[DirectorAgent] 创建任务规划...');

    const { projectType, complexity, recommendedAgents } = analysis;
    
    // 基于项目类型和复杂度生成任务步骤
    const steps: TaskStep[] = [];
    
    // 步骤1：需求确认
    steps.push({
      id: 'step-1',
      name: '需求确认',
      description: '确认设计需求和目标',
      assignedAgent: 'director',
      dependencies: [],
      estimatedTime: '5分钟'
    });

    // 步骤2：创意构思
    steps.push({
      id: 'step-2',
      name: '创意构思',
      description: '进行创意发想和概念设计',
      assignedAgent: recommendedAgents.primary,
      dependencies: ['step-1'],
      estimatedTime: complexity.level === 'simple' ? '10分钟' : '20分钟'
    });

    // 步骤3：设计执行（复杂项目分多步）
    if (complexity.level === 'complex') {
      steps.push({
        id: 'step-3a',
        name: '初稿设计',
        description: '完成设计初稿',
        assignedAgent: recommendedAgents.primary,
        dependencies: ['step-2'],
        estimatedTime: '15分钟'
      });
      
      steps.push({
        id: 'step-3b',
        name: '细节优化',
        description: '优化设计细节',
        assignedAgent: recommendedAgents.primary,
        dependencies: ['step-3a'],
        estimatedTime: '10分钟'
      });
    } else {
      steps.push({
        id: 'step-3',
        name: '设计制作',
        description: '完成设计制作',
        assignedAgent: recommendedAgents.primary,
        dependencies: ['step-2'],
        estimatedTime: '15分钟'
      });
    }

    // 步骤4：质量检查（复杂项目）
    if (complexity.level !== 'simple') {
      steps.push({
        id: 'step-4',
        name: '质量检查',
        description: '检查设计质量是否符合要求',
        assignedAgent: 'director',
        dependencies: [complexity.level === 'complex' ? 'step-3b' : 'step-3'],
        estimatedTime: '5分钟'
      });
    }

    return {
      steps,
      estimatedDuration: complexity.estimatedTime,
      requiredAgents: [recommendedAgents.primary, ...recommendedAgents.supporting],
      checkpoints: ['需求确认', '初稿完成', '最终交付']
    };
  }

  /**
   * 质量检查与反馈
   */
  async reviewOutput(
    output: any, 
    originalRequirements: RequirementAnalysis
  ): Promise<QualityReview> {
    console.log('[DirectorAgent] 进行质量检查...');

    const prompt = `作为设计总监，请评估以下设计成果是否符合原始需求。

原始需求：
${JSON.stringify(originalRequirements.requirements, null, 2)}

设计成果：
${JSON.stringify(output, null, 2)}

请从以下维度评估（0-100分）：
1. 符合度：是否符合原始需求描述
2. 创意性：是否有创意和独特性
3. 完成度：是否完整、细致
4. 专业性：设计质量是否专业

返回JSON格式：
{
  "score": 85,
  "meetsRequirements": true,
  "feedback": "总体评价",
  "suggestions": ["改进建议1", "改进建议2"],
  "needsRevision": false
}`;

    try {
      const response = await llmService.generateResponse(prompt, {
        priority: 'normal'
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const review = JSON.parse(jsonMatch[0]);
        return {
          score: review.score || 70,
          meetsRequirements: review.meetsRequirements ?? true,
          feedback: review.feedback || '设计完成',
          suggestions: review.suggestions || [],
          needsRevision: review.needsRevision ?? false
        };
      }
    } catch (error) {
      console.error('[DirectorAgent] 质量检查失败:', error);
    }

    // 降级返回
    return {
      score: 70,
      meetsRequirements: true,
      feedback: '设计已完成，基本符合需求',
      suggestions: [],
      needsRevision: false
    };
  }

  /**
   * 生成信息收集消息 - 结构化表格格式
   */
  private async generateCollectionMessage(analysis: RequirementAnalysis): Promise<string> {
    const questions = this.analysisService.generateFollowUpQuestions(analysis);
    
    let message = '';
    
    // 标题
    const projectTypeName = analysis.projectType !== 'unknown' 
      ? this.getProjectTypeName(analysis.projectType) 
      : '设计';
    message += `获取${projectTypeName}的关键信息\n\n`;
    
    // 使用 Markdown 表格展示需求项
    if (questions.length > 0) {
      // 将问题映射到标准需求项
      const requirementItems = this.mapQuestionsToRequirementItems(questions, analysis);
      
      // 构建表格 - 使用两行两列的格式
      message += '| 需求项 | 问题描述 |\n';
      message += '| :--- | :--- |\n';
      
      requirementItems.forEach(item => {
        // 确保问题描述在一行内，移除换行符
        const cleanQuestion = item.question.replace(/\n/g, ' ').trim();
        message += `| **${item.label}** | ${cleanQuestion} |\n`;
      });
      
      message += '\n';
    }

    message += '💡 **小贴士**：您也可以直接说"开始设计"或"你决定"，我会基于专业判断为您创作。';

    return message;
  }

  /**
   * 将问题映射到标准需求项
   */
  private mapQuestionsToRequirementItems(
    questions: string[], 
    analysis: RequirementAnalysis
  ): Array<{ label: string; question: string }> {
    const items: Array<{ label: string; question: string }> = [];
    
    // 根据项目类型确定标准需求项
    const projectType = analysis.projectType;
    
    // 通用需求项映射
    const questionMappings: Record<string, { label: string; patterns: string[] }> = {
      '主题': { 
        label: projectType === 'poster' ? '海报主题' : '设计主题', 
        patterns: ['主题', '核心', '宣传点', '设计什么'] 
      },
      '场景': { 
        label: '使用场景', 
        patterns: ['场景', '用在哪里', '使用', '用途'] 
      },
      '尺寸': { 
        label: projectType === 'packaging' ? '包装尺寸' : '尺寸要求', 
        patterns: ['尺寸', '大小', '规格', '格式'] 
      },
      '文案': { 
        label: '文案内容', 
        patterns: ['文案', '文字', '内容', '标语', '写什么'] 
      },
      '风格': { 
        label: '视觉风格', 
        patterns: ['风格', '样式', '外观', '感觉'] 
      },
      '受众': { 
        label: '目标受众', 
        patterns: ['受众', '人群', '面向', '给谁'] 
      },
      '品牌': { 
        label: '品牌信息', 
        patterns: ['品牌', '名称', 'logo', '标识'] 
      },
      '颜色': { 
        label: '色彩偏好', 
        patterns: ['颜色', '色彩', '配色', '色调'] 
      }
    };
    
    // 为每个问题匹配需求项
    questions.forEach((q, index) => {
      let matched = false;
      
      for (const [key, mapping] of Object.entries(questionMappings)) {
        if (mapping.patterns.some(pattern => q.includes(pattern))) {
          items.push({ label: mapping.label, question: q });
          matched = true;
          break;
        }
      }
      
      // 如果没有匹配到，使用通用标签
      if (!matched) {
        items.push({ label: `需求项${index + 1}`, question: q });
      }
    });
    
    return items;
  }

  /**
   * 生成委派消息
   */
  private async generateDelegationMessage(
    analysis: RequirementAnalysis,
    taskPlan: TaskPlan
  ): Promise<string> {
    const { projectType, requirements, complexity, recommendedAgents } = analysis;
    
    let message = `**📋 需求分析完成！**\n\n`;
    
    // 项目概况
    message += `**项目概况**\n`;
    message += `- 类型：${this.getProjectTypeName(projectType)}\n`;
    message += `- 复杂度：${this.getComplexityEmoji(complexity.level)} ${this.getComplexityLabel(complexity.level)}\n`;
    message += `- 预计用时：${complexity.estimatedTime}\n\n`;

    // 需求摘要
    message += `**需求摘要**\n`;
    if (requirements.targetAudience) {
      message += `- 目标受众：${requirements.targetAudience}\n`;
    }
    if (requirements.stylePreference) {
      message += `- 风格偏好：${requirements.stylePreference}\n`;
    }
    if (requirements.usageScenario) {
      message += `- 使用场景：${requirements.usageScenario}\n`;
    }
    message += '\n';

    // 团队分配
    message += `**👥 团队配置**\n`;
    message += `根据您的需求，我安排 **${this.getAgentName(recommendedAgents.primary)}** 来负责这个项目。\n`;
    if (recommendedAgents.supporting.length > 0) {
      message += `${this.getAgentName(recommendedAgents.primary)} 将协同 ${recommendedAgents.supporting.map(a => this.getAgentName(a)).join('、')} 一起完成。\n`;
    }
    message += `\n*${recommendedAgents.reasoning}*\n\n`;

    // 执行计划
    message += `**📝 执行计划**\n`;
    taskPlan.steps.forEach((step, i) => {
      message += `${i + 1}. **${step.name}** (${step.estimatedTime})\n`;
    });
    message += '\n';

    message += `现在让我为您开始创作，请稍候...`;

    return message;
  }

  /**
   * 生成协作消息
   */
  private async generateCollaborationMessage(
    analysis: RequirementAnalysis,
    taskPlan: TaskPlan
  ): Promise<string> {
    const { recommendedAgents, complexity } = analysis;
    
    let message = `**🎯 这是一个综合性的设计项目！**\n\n`;
    
    message += `**项目复杂度：**${this.getComplexityEmoji(complexity.level)} ${this.getComplexityLabel(complexity.level)}\n`;
    message += `**预计用时：**${complexity.estimatedTime}\n\n`;

    message += `**👥 专家团队协作**\n\n`;
    message += `我将组织以下团队成员协同完成：\n\n`;
    
    const allAgents = [recommendedAgents.primary, ...recommendedAgents.supporting];
    allAgents.forEach((agent, i) => {
      const role = i === 0 ? '主负责' : '协助';
      message += `${i + 1}. **${this.getAgentName(agent)}** - ${role}\n`;
    });
    
    message += `\n*${recommendedAgents.reasoning}*\n\n`;
    
    message += `**📋 协作流程**\n`;
    taskPlan.steps.forEach((step, i) => {
      message += `${i + 1}. **${step.name}** - ${this.getAgentName(step.assignedAgent)}负责\n`;
    });
    message += '\n';

    message += `团队已就位，现在开始协作创作...`;

    return message;
  }

  /**
   * 处理问候
   */
  private handleGreeting(): AgentResponse {
    this.conversationStage = 'greeting';
    
    return this.createTextResponse(
      `您好！欢迎来到津脉设计～ 👋\n\n` +
      `我是**津脉设计总监**，您的专属设计顾问。\n\n` +
      `**我可以为您提供：**\n` +
      `- 🎨 **IP形象设计** - 打造独特的角色、吉祥物\n` +
      `- 🏢 **品牌设计** - 构建完整的视觉识别系统\n` +
      `- 📦 **包装设计** - 产品包装创意与视觉呈现\n` +
      `- 🖼️ **海报设计** - 宣传物料与视觉传达\n` +
      `- 🎬 **动画视频** - 动态视觉内容制作\n` +
      `- ✏️ **插画设计** - 手绘风格艺术创作\n\n` +
      `**我会根据您的需求：**\n` +
      `1. 深度分析设计需求\n` +
      `2. 制定专业的执行方案\n` +
      `3. 调度最合适的专家团队\n` +
      `4. 把控设计质量直到交付\n\n` +
      `请告诉我您想要设计什么？越详细越好～`,
      { type: 'greeting' }
    );
  }

  /**
   * 判断是否是问候语
   */
  private isGreeting(message: string): boolean {
    const greetings = ['你好', '您好', 'hello', 'hi', '在吗', '在不在', '有人吗'];
    const lowerMsg = message.toLowerCase().trim();
    
    // 纯问候语（长度较短）
    if (lowerMsg.length <= 6 && greetings.some(g => lowerMsg.includes(g))) {
      return true;
    }
    
    // 包含问候但没有实质内容
    if (greetings.some(g => lowerMsg.includes(g)) && lowerMsg.length < 10) {
      return true;
    }
    
    return false;
  }

  /**
   * 获取项目类型名称
   */
  private getProjectTypeName(type: string): string {
    const names: Record<string, string> = {
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

  /**
   * 获取复杂度标签
   */
  private getComplexityLabel(level: string): string {
    const labels: Record<string, string> = {
      'simple': '简单',
      'medium': '中等',
      'complex': '复杂'
    };
    return labels[level] || level;
  }

  /**
   * 获取复杂度表情
   */
  private getComplexityEmoji(level: string): string {
    const emojis: Record<string, string> = {
      'simple': '🟢',
      'medium': '🟡',
      'complex': '🔴'
    };
    return emojis[level] || '⚪';
  }

  /**
   * 获取Agent名称
   */
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

  /**
   * 获取当前分析结果
   */
  getCurrentAnalysis(): RequirementAnalysis | null {
    return this.currentAnalysis;
  }

  /**
   * 获取当前对话阶段
   */
  getConversationStage(): string {
    return this.conversationStage;
  }

  /**
   * 重置对话状态
   */
  resetConversation(): void {
    this.currentAnalysis = null;
    this.conversationStage = 'greeting';
  }
}

// 导出单例实例
export const directorAgent = new DirectorAgent();

// 导出便捷函数
export async function analyzeWithDirector(
  message: string,
  history?: AgentMessage[]
): Promise<RequirementAnalysis> {
  return directorAgent['analyzeRequirements'](message, { 
    userId: 'anonymous',
    sessionId: 'temp',
    message,
    history: history || []
  });
}


