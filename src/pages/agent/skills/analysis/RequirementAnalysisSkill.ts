/**
 * 需求分析 Skill
 * 深入分析用户需求，提取关键信息
 */

import { AnalysisSkill } from '../base/BaseSkill';
import { UserIntent, ExecutionContext, SkillResult, Capability, AgentType } from '../../types/skill';
import { callCurrentModel } from '../../services/modelCaller';

export class RequirementAnalysisSkill extends AnalysisSkill {
  readonly id = 'requirement-analysis';
  readonly name = '需求分析';
  readonly description = '深入分析用户需求，提取关键信息和约束条件';
  readonly version = '1.0.0';

  protected supportedAgents: AgentType[] = ['director', 'designer', 'researcher'];

  readonly capabilities: Capability[] = [
    {
      id: 'analyze-requirements',
      name: '分析需求',
      description: '分析用户需求并提取关键信息',
      parameters: [
        { name: 'description', type: 'string', required: true, description: '需求描述' }
      ]
    }
  ];

  canHandle(intent: UserIntent): boolean {
    return ['requirement-collection', 'design-request'].includes(intent.type);
  }

  protected async doExecute(context: ExecutionContext): Promise<SkillResult> {
    const { message, parameters } = context;
    const description = parameters?.description || message;

    try {
      const analysis = await this.analyzeRequirements(description);

      return this.createAnalysisResult(analysis, 0.85);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '需求分析失败';
      return this.createErrorResult(errorMessage, true);
    }
  }

  private async analyzeRequirements(description: string): Promise<Record<string, any>> {
    const prompt = `请分析以下设计需求，提取关键信息：

需求描述：${description}

请输出JSON格式的分析结果，包含以下字段：
- projectType: 项目类型（IP形象/品牌设计/海报/包装等）
- targetAudience: 目标受众
- stylePreference: 风格偏好
- usageScenario: 使用场景
- timeline: 时间要求
- complexity: 复杂度（simple/medium/complex）
- keyRequirements: 关键需求点（数组）
- missingInfo: 缺失信息（数组）`;

    const response = await callCurrentModel(
      [{ role: 'user', content: prompt }],
      { temperature: 0.3, max_tokens: 1000 }
    );

    // 尝试解析JSON
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                       response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    } catch {
      // 解析失败返回基础分析
    }

    return {
      projectType: this.inferProjectType(description),
      targetAudience: '',
      stylePreference: '',
      usageScenario: '',
      timeline: '',
      complexity: 'medium',
      keyRequirements: [description],
      missingInfo: ['目标受众', '风格偏好', '使用场景']
    };
  }

  private inferProjectType(description: string): string {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('ip') || lowerDesc.includes('形象')) return 'IP形象';
    if (lowerDesc.includes('logo') || lowerDesc.includes('品牌')) return '品牌设计';
    if (lowerDesc.includes('海报')) return '海报设计';
    if (lowerDesc.includes('包装')) return '包装设计';
    if (lowerDesc.includes('插画')) return '插画设计';
    if (lowerDesc.includes('动画') || lowerDesc.includes('视频')) return '动画视频';
    return '设计项目';
  }
}
