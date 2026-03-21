/**
 * 意图识别 Skill
 */

import { AnalysisSkill } from '../base/BaseSkill';
import type { UserIntent, ExecutionContext, SkillResult } from '../../types/skill';

export class IntentRecognitionSkill extends AnalysisSkill {
  readonly id = 'intent-recognition';
  readonly name = '意图识别';
  readonly description = '分析用户输入，识别用户意图';

  readonly capabilities = [
    {
      id: 'recognize-intent',
      name: '识别意图',
      description: '识别用户的真实意图',
      parameters: [{ name: 'message', type: 'string', required: true, description: '用户消息' }]
    }
  ];

  canHandle(intent: UserIntent): boolean {
    return true;
  }

  protected async doExecute(context: ExecutionContext): Promise<SkillResult> {
    const { message } = context;
    const normalized = message.toLowerCase().trim();

    let intentType = 'unclear';
    let confidence = 0;
    const keywords: string[] = [];
    const entities: Record<string, string> = {};

    // 简单的关键词匹配
    if (normalized.includes('画') || normalized.includes('生成') || normalized.includes('图像') || normalized.includes('图片')) {
      intentType = 'image-generation';
      confidence = 0.9;
      keywords.push('图像', '生成');
    } else if (normalized.includes('视频') || normalized.includes('动画')) {
      intentType = 'video-generation';
      confidence = 0.9;
      keywords.push('视频', '动画');
    } else if (normalized.includes('文案') || normalized.includes('写作') || normalized.includes('文字')) {
      intentType = 'text-generation';
      confidence = 0.9;
      keywords.push('文案', '写作');
    } else if (normalized.includes('你好') || normalized.includes('您好') || normalized.includes('嗨')) {
      intentType = 'greeting';
      confidence = 0.95;
      keywords.push('问候');
    } else if (normalized.includes('需求') || normalized.includes('分析')) {
      intentType = 'requirement-analysis';
      confidence = 0.8;
      keywords.push('需求', '分析');
    }

    // 提取实体
    if (normalized.includes('logo')) entities.designType = 'Logo';
    if (normalized.includes('海报')) entities.designType = '海报';
    if (normalized.includes('包装')) entities.designType = '包装';

    return this.createSuccessResult(
      JSON.stringify({ intent: intentType, confidence, keywords, entities }),
      'structured',
      { intent: intentType, confidence, keywords, entities }
    );
  }
}
