/**
 * 图像生成 Skill
 * 根据文本描述生成高质量图像
 */

import { CreationSkill } from '../base/BaseSkill';
import { UserIntent, ExecutionContext, SkillResult, Capability, AgentType } from '../../types/skill';
import { llmService } from '@/services/llmService';
import { PRESET_STYLES } from '../../types/agent';

export interface ImageGenerationConfig {
  defaultSize?: string;
  defaultModel?: string;
  maxPromptLength?: number;
  enableStyleEnhancement?: boolean;
}

export class ImageGenerationSkill extends CreationSkill {
  readonly id = 'image-generation';
  readonly name = '图像生成';
  readonly description = '根据文本描述生成高质量图像，支持多种风格和尺寸';
  readonly version = '1.0.0';

  protected supportedAgents: AgentType[] = ['designer', 'illustrator', 'director'];

  readonly capabilities: Capability[] = [
    {
      id: 'generate-image',
      name: '生成图像',
      description: '根据文本描述生成图像',
      parameters: [
        { name: 'prompt', type: 'string', required: true, description: '图像描述' },
        { name: 'style', type: 'string', required: false, description: '风格偏好' },
        { name: 'size', type: 'string', required: false, defaultValue: '1024x1024', description: '图像尺寸' },
        { name: 'brand', type: 'string', required: false, description: '品牌名称' }
      ]
    },
    {
      id: 'modify-image',
      name: '修改图像',
      description: '基于已有图像进行修改优化',
      parameters: [
        { name: 'imageUrl', type: 'string', required: true, description: '原图像URL' },
        { name: 'modification', type: 'string', required: true, description: '修改需求' },
        { name: 'originalPrompt', type: 'string', required: false, description: '原图像提示词' }
      ]
    }
  ];

  private imageConfig: ImageGenerationConfig;

  constructor(config: ImageGenerationConfig = {}) {
    super();
    this.imageConfig = {
      defaultSize: '1024x1024',
      defaultModel: 'qwen-image-2.0-pro',
      maxPromptLength: 1000,
      enableStyleEnhancement: true,
      ...config
    };
  }

  /**
   * 检查是否可以处理该意图
   */
  canHandle(intent: UserIntent): boolean {
    const imageKeywords = ['画', '生成', '图像', '图片', '绘制', '创作', '设计', '插画', '海报', 'logo'];
    const hasImageKeyword = intent.keywords.some(kw =>
      imageKeywords.some(ik => kw.toLowerCase().includes(ik))
    );

    const imageIntentTypes = ['image-generation', 'design-request', 'modification'];
    const isImageIntent = imageIntentTypes.includes(intent.type);

    return hasImageKeyword || isImageIntent;
  }

  /**
   * 执行图像生成
   */
  protected async doExecute(context: ExecutionContext): Promise<SkillResult> {
    const { parameters, message } = context;

    // 判断是生成新图像还是修改现有图像
    if (parameters?.imageUrl) {
      return this.modifyImage(parameters);
    }

    return this.generateImage(parameters || {}, message);
  }

  /**
   * 生成新图像
   */
  private async generateImage(
    params: Record<string, any>,
    userMessage: string
  ): Promise<SkillResult> {
    try {
      // 构建提示词
      const prompt = this.buildPrompt(params, userMessage);

      console.log('[ImageGenerationSkill] Generating image with prompt:', prompt.substring(0, 100) + '...');

      // 调用图像生成API
      const result = await llmService.generateImage({
        model: this.imageConfig.defaultModel,
        prompt: prompt,
        size: params.size || this.imageConfig.defaultSize,
        n: 1
      });

      if (!result.ok) {
        throw new Error(result.error || '图像生成失败');
      }

      // 提取图像URL
      let imageUrl: string | undefined;
      if (result.data?.data && Array.isArray(result.data.data) && result.data.data.length > 0) {
        imageUrl = result.data.data[0].url;
      } else if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        imageUrl = result.data[0].url;
      }

      if (!imageUrl) {
        throw new Error('无法获取生成的图像URL');
      }

      return this.createSuccessResult(
        imageUrl,
        'image',
        {
          prompt,
          style: params.style,
          size: params.size || this.imageConfig.defaultSize,
          generatedAt: Date.now()
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '图像生成失败';
      console.error('[ImageGenerationSkill] Error:', errorMessage);
      return this.createErrorResult(errorMessage, true);
    }
  }

  /**
   * 修改现有图像
   */
  private async modifyImage(params: Record<string, any>): Promise<SkillResult> {
    try {
      const { imageUrl, modification, originalPrompt } = params;

      // 构建修改提示词
      const prompt = this.buildModificationPrompt(imageUrl, modification, originalPrompt);

      console.log('[ImageGenerationSkill] Modifying image:', imageUrl);

      // 调用图像生成API（使用修改提示词）
      const result = await llmService.generateImage({
        model: this.imageConfig.defaultModel,
        prompt: prompt,
        size: this.imageConfig.defaultSize,
        n: 1
      });

      if (!result.ok) {
        throw new Error(result.error || '图像修改失败');
      }

      let newImageUrl: string | undefined;
      if (result.data?.data && Array.isArray(result.data.data) && result.data.data.length > 0) {
        newImageUrl = result.data.data[0].url;
      }

      if (!newImageUrl) {
        throw new Error('无法获取修改后的图像URL');
      }

      return this.createSuccessResult(
        newImageUrl,
        'image',
        {
          originalUrl: imageUrl,
          modification,
          prompt,
          modifiedAt: Date.now()
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '图像修改失败';
      console.error('[ImageGenerationSkill] Modification error:', errorMessage);
      return this.createErrorResult(errorMessage, true);
    }
  }

  /**
   * 构建生成提示词
   */
  private buildPrompt(params: Record<string, any>, userMessage: string): string {
    const parts: string[] = [];

    // 添加品牌信息
    if (params.brand) {
      parts.push(`为品牌"${params.brand}"设计`);
    }

    // 添加主要描述
    const description = params.prompt || userMessage;
    parts.push(this.cleanDescription(description));

    // 添加风格
    if (params.style) {
      const stylePrompt = this.getStylePrompt(params.style);
      parts.push(`风格：${stylePrompt}`);
    }

    // 添加质量要求
    parts.push('高质量，精美细节，专业设计作品');

    return parts.join('，');
  }

  /**
   * 构建修改提示词
   */
  private buildModificationPrompt(
    imageUrl: string,
    modification: string,
    originalPrompt?: string
  ): string {
    const parts: string[] = [];

    parts.push('基于以下参考作品进行修改优化：');
    parts.push(`参考作品：${imageUrl}`);

    if (originalPrompt) {
      parts.push(`原描述：${originalPrompt}`);
    }

    parts.push(`修改需求：${modification}`);
    parts.push('要求：请保持参考作品的整体构图和核心元素，根据修改需求进行精准调整');

    return parts.join('\n');
  }

  /**
   * 清理描述文本
   */
  private cleanDescription(description: string): string {
    // 移除指令词
    const instructionKeywords = ['直接生成', '开始生成', '生成吧', '开始吧', '直接做', '就这样'];
    let cleaned = description;

    for (const keyword of instructionKeywords) {
      cleaned = cleaned.replace(keyword, '');
    }

    // 处理风格引用 @风格名
    const styleMentionRegex = /@([\u4e00-\u9fa5]+|[a-zA-Z0-9_-]+)/g;
    cleaned = cleaned.replace(styleMentionRegex, '');

    // 清理多余空格和标点
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/^[，,、]+|[，,、]+$/g, '').trim();

    return cleaned;
  }

  /**
   * 获取风格提示词
   */
  private getStylePrompt(style: string): string {
    // 查找预设风格
    const presetStyle = PRESET_STYLES.find(s =>
      s.id === style || s.name === style
    );

    if (presetStyle) {
      return presetStyle.prompt;
    }

    // 返回原始风格描述
    return style;
  }

  /**
   * 初始化
   */
  protected async onInitialize(): Promise<void> {
    console.log('[ImageGenerationSkill] Initialized with config:', this.imageConfig);
  }
}
