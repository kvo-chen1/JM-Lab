/**
 * 研究员 Agent
 * 专注市场调研、竞品分析、趋势研究
 */

import { BaseAgent, AgentResponse } from './BaseAgent';
import { AgentType } from '../types/agent';
import { ExecutionContext, UserIntent } from '../types/skill';
import { IntentRecognitionSkill } from '../skills/analysis/IntentRecognitionSkill';
import { TextGenerationSkill } from '../skills/creation/TextGenerationSkill';

export class ResearcherAgent extends BaseAgent {
  readonly type: AgentType = 'researcher';
  readonly name = '津脉研究员';
  readonly description = '专注市场调研、竞品分析和趋势研究';

  constructor() {
    super();

    // 注册研究员专属 Skill
    this.registerSkills([
      new IntentRecognitionSkill(),
      new TextGenerationSkill()
    ]);
  }

  /**
   * 处理用户消息
   */
  async handleMessage(message: string, context: ExecutionContext): Promise<AgentResponse> {
    try {
      // 1. 识别意图
      const intent = await this.recognizeIntent(message);

      // 2. 处理不同类型的意图
      switch (intent.type) {
        case 'market-research':
          return this.handleMarketResearch(message, intent, context);

        case 'competitor-analysis':
          return this.handleCompetitorAnalysis(message, intent, context);

        case 'trend-research':
          return this.handleTrendResearch(message, intent, context);

        case 'user-research':
          return this.handleUserResearch(message, intent, context);

        default:
          return this.handleDefault(message, intent);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '处理失败';
      return this.createErrorResponse(errorMessage);
    }
  }

  /**
   * 处理市场调研请求
   */
  private async handleMarketResearch(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    const textSkill = this.getSkills().find(s => s.id === 'text-generation');

    if (textSkill) {
      const result = await this.executeSkill(textSkill, {
        ...context,
        message,
        parameters: {
          ...context.parameters,
          ...intent.entities,
          type: 'market-research',
          prompt: this.buildMarketResearchPrompt(message, intent)
        }
      });

      if (result.success) {
        return this.buildResponse(result);
      }
    }

    return this.createTextResponse(
      '我来为您进行市场调研。请告诉我：\n• 调研的行业或领域\n• 目标市场（地域/人群）\n• 调研目的\n• 期望的交付形式',
      { intent: intent.type, stage: 'requirement-collection' }
    );
  }

  /**
   * 处理竞品分析请求
   */
  private async handleCompetitorAnalysis(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    const textSkill = this.getSkills().find(s => s.id === 'text-generation');

    if (textSkill) {
      const result = await this.executeSkill(textSkill, {
        ...context,
        message,
        parameters: {
          ...context.parameters,
          ...intent.entities,
          type: 'competitor-analysis',
          prompt: this.buildCompetitorPrompt(message, intent)
        }
      });

      if (result.success) {
        return this.buildResponse(result);
      }
    }

    return this.createTextResponse(
      '我来为您进行竞品分析。请提供：\n• 您的产品/服务信息\n• 主要竞品名称\n• 分析维度（功能/价格/市场定位等）\n• 分析目的',
      { intent: intent.type }
    );
  }

  /**
   * 处理趋势研究请求
   */
  private async handleTrendResearch(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    const textSkill = this.getSkills().find(s => s.id === 'text-generation');

    if (textSkill) {
      const result = await this.executeSkill(textSkill, {
        ...context,
        message,
        parameters: {
          ...context.parameters,
          ...intent.entities,
          type: 'trend-research',
          prompt: this.buildTrendPrompt(message, intent)
        }
      });

      if (result.success) {
        return this.buildResponse(result);
      }
    }

    return this.createTextResponse(
      '我来为您研究行业趋势。请描述：\n• 关注的行业或领域\n• 时间范围（近期/年度/长期）\n• 趋势类型（设计趋势/消费趋势/技术趋势等）',
      { intent: intent.type }
    );
  }

  /**
   * 处理用户研究请求
   */
  private async handleUserResearch(
    message: string,
    intent: UserIntent,
    context: ExecutionContext
  ): Promise<AgentResponse> {
    const textSkill = this.getSkills().find(s => s.id === 'text-generation');

    if (textSkill) {
      const result = await this.executeSkill(textSkill, {
        ...context,
        message,
        parameters: {
          ...context.parameters,
          ...intent.entities,
          type: 'user-research',
          prompt: this.buildUserResearchPrompt(message, intent)
        }
      });

      if (result.success) {
        return this.buildResponse(result);
      }
    }

    return this.createTextResponse(
      '我来帮您进行用户研究。请告诉我：\n• 目标用户群体\n• 研究目的\n• 产品/服务类型\n• 研究方法偏好',
      { intent: intent.type }
    );
  }

  /**
   * 构建市场调研提示词
   */
  private buildMarketResearchPrompt(message: string, intent: UserIntent): string {
    const industry = intent.entities?.industry || '相关行业';
    const market = intent.entities?.market || '目标市场';
    
    return `进行${industry}的市场调研，目标市场：${market}。调研内容：${message}。要求：数据详实、分析深入、结论明确。`;
  }

  /**
   * 构建竞品分析提示词
   */
  private buildCompetitorPrompt(message: string, intent: UserIntent): string {
    const product = intent.entities?.product || '产品';
    const competitors = intent.entities?.competitors || '主要竞品';
    
    return `对${product}进行竞品分析，竞品包括：${competitors}。分析内容：${message}。要求：对比清晰、洞察深刻、建议可行。`;
  }

  /**
   * 构建趋势研究提示词
   */
  private buildTrendPrompt(message: string, intent: UserIntent): string {
    const field = intent.entities?.field || '行业';
    const timeframe = intent.entities?.timeframe || '近期';
    
    return `研究${field}的${timeframe}趋势。研究内容：${message}。要求：趋势判断准确、案例丰富、前瞻性强。`;
  }

  /**
   * 构建用户研究提示词
   */
  private buildUserResearchPrompt(message: string, intent: UserIntent): string {
    const targetUser = intent.entities?.targetUser || '目标用户';
    const product = intent.entities?.product || '产品';
    
    return `对${targetUser}进行用户研究，产品：${product}。研究内容：${message}。要求：洞察深入、画像清晰、建议实用。`;
  }

  /**
   * 默认处理
   */
  private handleDefault(message: string, intent: UserIntent): AgentResponse {
    if (intent.clarificationNeeded) {
      return this.createTextResponse(
        intent.suggestedResponse || '能否详细描述一下您的研究需求？',
        { clarificationNeeded: true }
      );
    }

    return this.createTextResponse(
      `你好！我是津脉研究员，专注于：

• 市场调研与分析
• 竞品分析与对标
• 行业趋势研究
• 用户研究与洞察

请告诉我您需要什么样的研究服务？`,
      { intent: intent.type }
    );
  }

  /**
   * 生成研究建议
   */
  async generateResearchSuggestions(requirements: string): Promise<string[]> {
    const suggestions: string[] = [];

    if (requirements.includes('市场') || requirements.includes('行业')) {
      suggestions.push('建议明确调研的地理范围和目标人群');
      suggestions.push('考虑使用一手数据和二手数据相结合的方式');
    }

    if (requirements.includes('竞品') || requirements.includes('竞争')) {
      suggestions.push('选择3-5个主要竞品进行深入分析');
      suggestions.push('从功能、价格、渠道、品牌等多维度对比');
    }

    if (requirements.includes('趋势')) {
      suggestions.push('关注行业报告、权威媒体和专家观点');
      suggestions.push('结合历史数据和当前动态进行预测');
    }

    if (requirements.includes('用户')) {
      suggestions.push('明确目标用户的画像和细分维度');
      suggestions.push('考虑定量调研和定性调研的结合');
    }

    if (suggestions.length === 0) {
      suggestions.push('请提供更多研究需求细节，我可以给出更精准的建议');
    }

    return suggestions;
  }

  /**
   * 生成市场分析报告模板
   */
  generateMarketReportTemplate(): string {
    return `
# 市场研究报告

## 1. 执行摘要
- 研究背景
- 核心发现
- 关键建议

## 2. 市场概况
- 市场规模
- 增长趋势
- 市场结构

## 3. 竞争分析
- 主要竞争者
- 市场份额
- 竞争格局

## 4. 用户洞察
- 用户画像
- 用户需求
- 用户行为

## 5. 趋势与机会
- 行业趋势
- 市场机会
- 风险提示

## 6. 结论与建议
- 核心结论
- 行动建议
`;
  }
}
