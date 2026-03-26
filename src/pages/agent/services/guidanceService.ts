/**
 * 智能引导服务
 * 根据用户状态和需求提供个性化的引导和建议
 */

import { AgentType, AgentMessage, RequirementCollection } from '../types/agent';
import { RequirementAnalysis } from './requirementAnalysisService';

// 引导建议
export interface GuidanceSuggestion {
  id: string;
  type: 'info' | 'tip' | 'action' | 'warning';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  actions?: {
    label: string;
    action: string;
    data?: any;
  }[];
}

// 快速操作
export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  action: string;
  data?: any;
}

// 对话上下文
export interface ConversationContext {
  messages: AgentMessage[];
  currentAgent: AgentType;
  requirementCollection?: RequirementCollection;
  lastAnalysis?: RequirementAnalysis;
  userPreferences?: {
    preferredStyle?: string;
    preferredAgent?: AgentType;
    quickStartMode?: boolean;
  };
}

/**
 * 智能引导服务类
 */
export class GuidanceService {
  /**
   * 生成引导建议
   */
  async generateGuidance(context: ConversationContext): Promise<GuidanceSuggestion[]> {
    const suggestions: GuidanceSuggestion[] = [];
    const { messages, currentAgent, requirementCollection, lastAnalysis } = context;

    // 新用户引导
    if (messages.length <= 2) {
      suggestions.push({
        id: 'welcome-tip',
        type: 'tip',
        title: '💡 新用户提示',
        content: '您可以告诉我想要设计什么，我会帮您分析需求并安排合适的团队成员。',
        priority: 'medium'
      });
    }

    // 需求收集阶段的引导
    if (currentAgent === 'director' && requirementCollection) {
      const stage = requirementCollection.stage;
      
      if (stage === 'initial') {
        suggestions.push({
          id: 'design-type-guide',
          type: 'info',
          title: '🎨 设计类型参考',
          content: '常见设计类型：IP形象、品牌设计、包装设计、海报设计、动画视频、插画设计',
          priority: 'low',
          actions: [
            { label: 'IP形象', action: 'set_design_type', data: { type: 'ip-character' } },
            { label: '品牌设计', action: 'set_design_type', data: { type: 'brand-design' } },
            { label: '包装设计', action: 'set_design_type', data: { type: 'packaging' } }
          ]
        });
      }

      if (stage === 'collecting') {
        suggestions.push({
          id: 'quick-start-option',
          type: 'tip',
          title: '⚡ 快速开始',
          content: '如果您希望直接开始设计，可以说"直接开始"或"你决定"，我会基于专业判断为您创作。',
          priority: 'medium'
        });
      }
    }

    // 基于需求分析的引导
    if (lastAnalysis) {
      const { missingInfo, confidence } = lastAnalysis;

      // 如果缺少关键信息
      if (missingInfo.importance === 'high' && missingInfo.questions.length > 0) {
        suggestions.push({
          id: 'missing-info-tip',
          type: 'info',
          title: '📝 完善需求',
          content: missingInfo.questions[0],
          priority: 'high'
        });
      }

      // 如果置信度低
      if (confidence < 0.5) {
        suggestions.push({
          id: 'clarify-tip',
          type: 'warning',
          title: '🤔 需求澄清',
          content: '您的需求描述可以更详细一些，这样我能为您提供更精准的设计方案。',
          priority: 'medium'
        });
      }
    }

    // 基于对话历史的引导
    if (messages.length > 10) {
      const recentMessages = messages.slice(-5);
      const hasQuestion = recentMessages.some(m => 
        m.role === 'assistant' && m.content.includes('？')
      );

      if (hasQuestion) {
        suggestions.push({
          id: 'response-reminder',
          type: 'tip',
          title: '⏰ 等待回复',
          content: '您有未回答的问题，回复后我可以继续为您服务。',
          priority: 'low'
        });
      }
    }

    // 按优先级排序
    return suggestions.sort((a, b) => {
      const priorityMap = { high: 3, medium: 2, low: 1 };
      return priorityMap[b.priority] - priorityMap[a.priority];
    });
  }

  /**
   * 生成快速操作按钮
   */
  generateQuickActions(context: ConversationContext): QuickAction[] {
    const actions: QuickAction[] = [];
    const { currentAgent, requirementCollection, lastAnalysis } = context;

    // 总监Agent的快速操作
    if (currentAgent === 'director') {
      // 如果需求收集未完成
      if (requirementCollection && requirementCollection.stage !== 'completed') {
        actions.push({
          id: 'quick-start',
          label: '⚡ 直接开始',
          description: '基于已有信息快速开始设计',
          action: 'quick_start'
        });
      }

      // 如果需求分析完成
      if (lastAnalysis && lastAnalysis.confidence >= 0.6) {
        actions.push({
          id: 'start-design',
          label: '🎨 开始设计',
          description: '启动设计流程',
          action: 'start_design'
        });
      }

      // 常见设计类型
      actions.push(
        { id: 'design-ip', label: '🎭 IP形象', action: 'design_type', data: { type: 'ip-character' } },
        { id: 'design-brand', label: '🏢 品牌设计', action: 'design_type', data: { type: 'brand-design' } },
        { id: 'design-package', label: '📦 包装设计', action: 'design_type', data: { type: 'packaging' } }
      );
    }

    // 设计师Agent的快速操作
    if (currentAgent === 'designer') {
      actions.push(
        { id: 'generate-logo', label: '🎨 生成Logo', action: 'generate', data: { type: 'logo' } },
        { id: 'generate-poster', label: '🖼️ 生成海报', action: 'generate', data: { type: 'poster' } },
        { id: 'change-style', label: '🎭 切换风格', action: 'change_style' }
      );
    }

    // 插画师Agent的快速操作
    if (currentAgent === 'illustrator') {
      actions.push(
        { id: 'draw-character', label: '👤 画角色', action: 'draw', data: { type: 'character' } },
        { id: 'draw-illustration', label: '🎨 画插画', action: 'draw', data: { type: 'illustration' } },
        { id: 'draw-concept', label: '💡 概念设计', action: 'draw', data: { type: 'concept' } }
      );
    }

    // 通用操作
    actions.push({
      id: 'switch-agent',
      label: '👥 切换专家',
      description: '更换服务专家',
      action: 'switch_agent'
    });

    return actions.slice(0, 6); // 最多显示6个
  }

  /**
   * 生成下一步建议
   */
  generateNextSteps(context: ConversationContext): string[] {
    const steps: string[] = [];
    const { currentAgent, requirementCollection, lastAnalysis } = context;

    if (currentAgent === 'director') {
      if (!requirementCollection || requirementCollection.stage === 'initial') {
        steps.push('告诉我您想要设计什么');
        steps.push('选择设计类型：IP形象、品牌设计、包装设计等');
      } else if (requirementCollection.stage === 'collecting') {
        steps.push('回答我的问题以完善需求');
        steps.push('或者直接说"开始设计"快速开始');
      } else if (requirementCollection.stage === 'confirming') {
        steps.push('确认需求总结');
        steps.push('或提出修改意见');
      }
    }

    if (lastAnalysis) {
      const { projectType } = lastAnalysis;
      
      switch (projectType) {
        case 'ip-character':
          steps.push('描述角色的性格特征');
          steps.push('提供参考图片或风格');
          break;
        case 'brand-design':
          steps.push('提供品牌名称和理念');
          steps.push('确定品牌色彩偏好');
          break;
        case 'packaging':
          steps.push('说明产品类型和特点');
          steps.push('确定包装尺寸和材质');
          break;
      }
    }

    return steps.slice(0, 3);
  }

  /**
   * 生成欢迎消息
   */
  generateWelcomeMessage(isNewUser: boolean = true): string {
    if (isNewUser) {
      return `您好！欢迎来到津脉设计～ 👋

我是**津脉设计总监**，您的专属设计顾问。

**我可以为您提供：**
- 🎨 **IP形象设计** - 打造独特的角色、吉祥物
- 🏢 **品牌设计** - 构建完整的视觉识别系统
- 📦 **包装设计** - 产品包装创意与视觉呈现
- 🖼️ **海报设计** - 宣传物料与视觉传达
- 🎬 **动画视频** - 动态视觉内容制作
- ✏️ **插画设计** - 手绘风格艺术创作

**我会根据您的需求：**
1. 深度分析设计需求
2. 制定专业的执行方案
3. 调度最合适的专家团队
4. 把控设计质量直到交付

请告诉我您想要设计什么？越详细越好～`;
    }

    return `欢迎回来！👋

我是津脉设计总监，继续为您提供专业的设计服务。

今天想创作什么内容呢？`;
  }

  /**
   * 分析用户输入并提供实时建议
   */
  analyzeInputForSuggestions(
    input: string,
    context: ConversationContext
  ): GuidanceSuggestion[] {
    const suggestions: GuidanceSuggestion[] = [];
    const lowerInput = input.toLowerCase();

    // 检测设计类型关键词
    const designTypes = [
      { keyword: 'logo', type: 'brand-design', label: 'Logo设计' },
      { keyword: 'ip', type: 'ip-character', label: 'IP形象' },
      { keyword: '角色', type: 'ip-character', label: '角色设计' },
      { keyword: '包装', type: 'packaging', label: '包装设计' },
      { keyword: '海报', type: 'poster', label: '海报设计' },
      { keyword: '插画', type: 'illustration', label: '插画设计' },
      { keyword: '动画', type: 'animation', label: '动画视频' }
    ];

    const detectedType = designTypes.find(dt => lowerInput.includes(dt.keyword));
    if (detectedType) {
      suggestions.push({
        id: 'detected-type',
        type: 'info',
        title: `🎯 检测到${detectedType.label}`,
        content: `您似乎想要做${detectedType.label}，我可以为您安排专业的团队成员。`,
        priority: 'medium',
        actions: [
          { label: '确认', action: 'confirm_type', data: { type: detectedType.type } },
          { label: '不是', action: 'reject_type' }
        ]
      });
    }

    // 检测风格关键词
    const styleKeywords = ['简约', '复古', '可爱', '科技', '温馨', '酷炫', '手绘'];
    const detectedStyle = styleKeywords.find(sk => lowerInput.includes(sk));
    if (detectedStyle) {
      suggestions.push({
        id: 'detected-style',
        type: 'tip',
        title: '🎨 风格识别',
        content: `您提到了"${detectedStyle}"风格，我会在设计中体现这一特点。`,
        priority: 'low'
      });
    }

    // 检测目标受众关键词
    const audienceKeywords = [
      { keyword: '年轻人', label: '年轻群体' },
      { keyword: '儿童', label: '儿童群体' },
      { keyword: '商务', label: '商务人士' },
      { keyword: '女性', label: '女性群体' },
      { keyword: '学生', label: '学生群体' }
    ];
    const detectedAudience = audienceKeywords.find(ak => lowerInput.includes(ak.keyword));
    if (detectedAudience) {
      suggestions.push({
        id: 'detected-audience',
        type: 'tip',
        title: '👥 目标受众',
        content: `面向${detectedAudience.label}的设计，我会考虑这一群体的审美偏好。`,
        priority: 'low'
      });
    }

    return suggestions;
  }

  /**
   * 生成错误恢复建议
   */
  generateErrorRecovery(error: Error, context: ConversationContext): GuidanceSuggestion {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
      return {
        id: 'timeout-recovery',
        type: 'warning',
        title: '⏱️ 请求超时',
        content: '处理您的请求花费了较长时间，请重试或简化您的需求描述。',
        priority: 'high',
        actions: [
          { label: '重试', action: 'retry' },
          { label: '简化需求', action: 'simplify' }
        ]
      };
    }

    if (errorMessage.includes('network') || errorMessage.includes('网络')) {
      return {
        id: 'network-recovery',
        type: 'warning',
        title: '🌐 网络问题',
        content: '网络连接不稳定，请检查网络后重试。',
        priority: 'high',
        actions: [
          { label: '重试', action: 'retry' }
        ]
      };
    }

    // 通用错误恢复
    return {
      id: 'general-recovery',
      type: 'warning',
      title: '⚠️ 遇到问题',
      content: '处理过程中遇到了一些问题，让我重新尝试为您服务。',
      priority: 'medium',
      actions: [
        { label: '重试', action: 'retry' },
        { label: '重新开始', action: 'restart' }
      ]
    };
  }
}

// 导出单例实例
export const guidanceService = new GuidanceService();

// 导出便捷函数
export async function getGuidance(context: ConversationContext): Promise<GuidanceSuggestion[]> {
  return guidanceService.generateGuidance(context);
}

export function getQuickActions(context: ConversationContext): QuickAction[] {
  return guidanceService.generateQuickActions(context);
}

export function getNextSteps(context: ConversationContext): string[] {
  return guidanceService.generateNextSteps(context);
}
