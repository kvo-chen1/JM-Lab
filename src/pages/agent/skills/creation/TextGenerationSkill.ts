/**
 * 文本生成 Skill
 * 生成文案、标语、品牌故事等文本内容
 */

import { CreationSkill } from '../base/BaseSkill';
import { UserIntent, ExecutionContext, SkillResult, Capability, AgentType } from '../../types/skill';
import { callCurrentModel } from '../../services/modelCaller';

export interface TextGenerationConfig {
  defaultMaxTokens?: number;
  defaultTemperature?: number;
  enableStyleAdaptation?: boolean;
}

export class TextGenerationSkill extends CreationSkill {
  readonly id = 'text-generation';
  readonly name = '文本生成';
  readonly description = '生成文案、标语、品牌故事等文本内容';
  readonly version = '1.0.0';

  protected supportedAgents: AgentType[] = ['copywriter', 'designer', 'director'];

  readonly capabilities: Capability[] = [
    {
      id: 'write-copy',
      name: '撰写文案',
      description: '根据需求撰写品牌文案',
      parameters: [
        { name: 'topic', type: 'string', required: true, description: '文案主题' },
        { name: 'style', type: 'string', required: false, description: '文案风格' },
        { name: 'length', type: 'string', required: false, defaultValue: 'medium', description: '长度（short/medium/long）' }
      ]
    },
    {
      id: 'create-slogan',
      name: '创作标语',
      description: '创作品牌标语或口号',
      parameters: [
        { name: 'brand', type: 'string', required: true, description: '品牌名称' },
        { name: 'value', type: 'string', required: false, description: '品牌价值主张' },
        { name: 'count', type: 'number', required: false, defaultValue: 3, description: '生成数量' }
      ]
    },
    {
      id: 'brand-story',
      name: '品牌故事',
      description: '创作品牌故事',
      parameters: [
        { name: 'brand', type: 'string', required: true, description: '品牌名称' },
        { name: 'background', type: 'string', required: false, description: '品牌背景' },
        { name: 'tone', type: 'string', required: false, defaultValue: 'warm', description: '故事调性' }
      ]
    }
  ];

  private textConfig: TextGenerationConfig;

  constructor(config: TextGenerationConfig = {}) {
    super();
    this.textConfig = {
      defaultMaxTokens: 1000,
      defaultTemperature: 0.7,
      enableStyleAdaptation: true,
      ...config
    };
  }

  /**
   * 检查是否可以处理该意图
   */
  canHandle(intent: UserIntent): boolean {
    const textKeywords = ['文案', '文字', '写作', '标语', '口号', '故事', '内容', 'copy', 'slogan'];
    const hasTextKeyword = intent.keywords.some(kw =>
      textKeywords.some(tk => kw.toLowerCase().includes(tk.toLowerCase()))
    );

    const textIntentTypes = ['text-generation', 'copywriting', 'slogan-creation'];
    const isTextIntent = textIntentTypes.includes(intent.type);

    return hasTextKeyword || isTextIntent;
  }

  /**
   * 执行文本生成
   */
  protected async doExecute(context: ExecutionContext): Promise<SkillResult> {
    const { parameters, message } = context;

    // 根据参数判断生成类型
    if (parameters?.brand && parameters?.value) {
      return this.createSlogan(parameters);
    }

    if (parameters?.brand && parameters?.tone) {
      return this.createBrandStory(parameters);
    }

    return this.writeCopy(parameters || {}, message);
  }

  /**
   * 撰写文案
   */
  private async writeCopy(
    params: Record<string, any>,
    userMessage: string
  ): Promise<SkillResult> {
    try {
      const topic = params.topic || userMessage;
      const style = params.style || '专业';
      const length = params.length || 'medium';

      const lengthMap: Record<string, string> = {
        short: '100字以内',
        medium: '200-300字',
        long: '500字以上'
      };

      const prompt = `请为以下主题撰写${style}风格的文案，字数要求：${lengthMap[length]}。

主题：${topic}

要求：
1. 语言流畅，富有感染力
2. 符合品牌调性
3. 适合用于营销传播

请直接输出文案内容：`;

      const response = await callCurrentModel(
        [{ role: 'user', content: prompt }],
        {
          temperature: this.textConfig.defaultTemperature,
          max_tokens: this.textConfig.defaultMaxTokens
        }
      );

      return this.createSuccessResult(
        response,
        'text',
        {
          topic,
          style,
          length,
          generatedAt: Date.now()
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文案生成失败';
      console.error('[TextGenerationSkill] Error:', errorMessage);
      return this.createErrorResult(errorMessage, true);
    }
  }

  /**
   * 创作标语
   */
  private async createSlogan(params: Record<string, any>): Promise<SkillResult> {
    try {
      const { brand, value = '', count = 3 } = params;

      const prompt = `请为品牌"${brand}"创作${count}条标语/口号。

品牌价值主张：${value || '待补充'}

要求：
1. 简洁有力，朗朗上口
2. 体现品牌特色
3. 易于记忆和传播
4. 每条标语不超过15个字

请输出${count}条标语：`;

      const response = await callCurrentModel(
        [{ role: 'user', content: prompt }],
        {
          temperature: 0.8,
          max_tokens: 500
        }
      );

      // 解析标语
      const slogans = this.parseSlogans(response, count);

      return this.createSuccessResult(
        response,
        'text',
        {
          brand,
          value,
          slogans,
          count,
          generatedAt: Date.now()
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '标语创作失败';
      console.error('[TextGenerationSkill] Slogan error:', errorMessage);
      return this.createErrorResult(errorMessage, true);
    }
  }

  /**
   * 创作品牌故事
   */
  private async createBrandStory(params: Record<string, any>): Promise<SkillResult> {
    try {
      const { brand, background = '', tone = 'warm' } = params;

      const toneMap: Record<string, string> = {
        warm: '温暖感人',
        professional: '专业严谨',
        creative: '创意有趣',
        luxury: '高端奢华'
      };

      const prompt = `请为品牌"${brand}"创作一个${toneMap[tone] || '温暖'}风格的品牌故事。

品牌背景：${background || '这是一个有情怀的品牌'}

要求：
1. 故事要有情感共鸣
2. 体现品牌价值观
3. 字数在300-500字之间
4. 适合用于品牌宣传

请输出品牌故事：`;

      const response = await callCurrentModel(
        [{ role: 'user', content: prompt }],
        {
          temperature: 0.75,
          max_tokens: 1000
        }
      );

      return this.createSuccessResult(
        response,
        'text',
        {
          brand,
          background,
          tone,
          generatedAt: Date.now()
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '品牌故事创作失败';
      console.error('[TextGenerationSkill] Brand story error:', errorMessage);
      return this.createErrorResult(errorMessage, true);
    }
  }

  /**
   * 解析标语
   */
  private parseSlogans(text: string, expectedCount: number): string[] {
    const lines = text.split('\n').filter(line => line.trim());
    const slogans: string[] = [];

    for (const line of lines) {
      // 匹配数字开头的行（如 "1. 标语内容" 或 "1、标语内容"）
      const match = line.match(/^\d+[.、\s]+(.+)$/);
      if (match) {
        slogans.push(match[1].trim());
      }
    }

    // 如果没有匹配到格式化的标语，按行分割
    if (slogans.length === 0) {
      return lines.slice(0, expectedCount);
    }

    return slogans.slice(0, expectedCount);
  }

  /**
   * 初始化
   */
  protected async onInitialize(): Promise<void> {
    console.log('[TextGenerationSkill] Initialized with config:', this.textConfig);
  }
}
