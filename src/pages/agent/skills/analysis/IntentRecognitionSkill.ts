/**
 * 意图识别 Skill
 * 分析用户输入，识别用户意图和提取关键实体
 */

import { AnalysisSkill } from '../base/BaseSkill';
import { UserIntent, ExecutionContext, SkillResult, Capability, AgentType } from '../../types/skill';

export interface IntentRecognitionConfig {
  confidenceThreshold?: number;
  enableEntityExtraction?: boolean;
  enableClarification?: boolean;
}

// 意图定义
interface IntentDefinition {
  type: string;
  keywords: string[];
  patterns: RegExp[];
  description: string;
  entities?: string[];
}

// 预定义意图库
const INTENT_DEFINITIONS: IntentDefinition[] = [
  {
    type: 'image-generation',
    keywords: ['画', '生成', '图像', '图片', '绘制', '创作', '设计', '插画', '海报'],
    patterns: [
      /(?:帮我|给我|想|要).*(?:设计|画|做|生成)/i,
      /(?:做|画|设计).*(?:个|一下|一个)/i,
      /(?:生成|画).*(?:图|像)/i
    ],
    description: '用户想要生成图像',
    entities: ['style', 'size', 'brand']
  },
  {
    type: 'video-generation',
    keywords: ['视频', '动画', '动效', '短片', '影片'],
    patterns: [
      /(?:做|生成|创作).*(?:视频|动画)/i,
      /(?:视频|动画).*(?:制作|生成)/i
    ],
    description: '用户想要生成视频',
    entities: ['duration', 'resolution', 'style']
  },
  {
    type: 'text-generation',
    keywords: ['文案', '文字', '写作', '标语', '口号', '故事'],
    patterns: [
      /(?:写|创作|生成).*(?:文案|文字|故事)/i,
      /(?:文案|标语).*(?:创作|生成)/i
    ],
    description: '用户想要生成文本内容',
    entities: ['topic', 'style', 'length']
  },
  {
    type: 'design-request',
    keywords: ['设计', '品牌', 'logo', '包装', 'vi'],
    patterns: [
      /(?:需要|想要|做).*(?:设计|品牌)/i,
      /(?:设计).*(?:logo|品牌|包装)/i
    ],
    description: '用户有设计需求',
    entities: ['designType', 'brand', 'style']
  },
  {
    type: 'requirement-collection',
    keywords: ['需求', '要求', '想要', '需要'],
    patterns: [
      /(?:我|我们).*(?:想要|需要)/i,
      /(?:需求|要求).*(?:是|为)/i
    ],
    description: '用户在表达需求',
    entities: ['projectType', 'targetAudience', 'stylePreference']
  },
  {
    type: 'style-inquiry',
    keywords: ['风格', '样式', '效果', '样子', '感觉'],
    patterns: [
      /(?:什么|哪种|推荐).*(?:风格|样式)/i,
      /(?:风格|样式).*(?:好|合适|推荐)/i
    ],
    description: '用户询问风格相关',
    entities: ['styleCategory']
  },
  {
    type: 'modification',
    keywords: ['修改', '调整', '改', '换', '变', '优化'],
    patterns: [
      /(?:把|将|给).*(?:改|换|调整)/i,
      /(?:修改|调整|优化).*/i
    ],
    description: '用户想要修改现有内容',
    entities: ['modificationType', 'targetElement']
  },
  {
    type: 'confirmation',
    keywords: ['好', '行', '可以', '确定', '确认', '没问题', '对的', '是的'],
    patterns: [
      /^(?:好|行|可以|确定|没问题|对的|是的)$/i,
      /(?:就|那).*(?:这样|可以|行)/i
    ],
    description: '用户确认',
    entities: []
  },
  {
    type: 'rejection',
    keywords: ['不', '不行', '不要', '不对', '错了', '重新', '换'],
    patterns: [
      /^(?:不|不行|不对|不要)$/i,
      /(?:不|别).*(?:这样|要|行)/i
    ],
    description: '用户拒绝或否定',
    entities: ['rejectionReason']
  },
  {
    type: 'greeting',
    keywords: ['你好', '您好', '哈喽', '嗨', 'hello', 'hi'],
    patterns: [
      /^(?:你好|您好|哈喽|嗨|hello|hi)/i
    ],
    description: '用户问候',
    entities: []
  }
];

// 实体提取规则
const ENTITY_RULES: Record<string, Array<{ pattern: RegExp; value: string }>> = {
  designType: [
    { pattern: /(IP|形象|角色|mascot)/i, value: 'IP形象' },
    { pattern: /(logo|标志|商标)/i, value: 'Logo' },
    { pattern: /(海报|宣传|广告)/i, value: '海报' },
    { pattern: /(包装|礼盒|盒子)/i, value: '包装' },
    { pattern: /(插画|插图|手绘)/i, value: '插画' },
    { pattern: /(动画|视频|动效)/i, value: '动画' },
    { pattern: /(品牌|VI|视觉)/i, value: '品牌设计' }
  ],
  style: [
    { pattern: /可爱/i, value: '可爱' },
    { pattern: /温馨|温暖/i, value: '温馨' },
    { pattern: /科技|科技风/i, value: '科技' },
    { pattern: /简约|极简/i, value: '简约' },
    { pattern: /复古|怀旧/i, value: '复古' },
    { pattern: /梦幻|梦幻风/i, value: '梦幻' },
    { pattern: /手绘|手绘风/i, value: '手绘' },
    { pattern: /现代/i, value: '现代' },
    { pattern: /传统|古典/i, value: '传统' }
  ],
  targetAudience: [
    { pattern: /(儿童|孩子|小朋友|学生)/, value: '儿童' },
    { pattern: /(年轻人|青年|大学生)/, value: '年轻人' },
    { pattern: /(商务|企业|公司|B2B)/, value: '商务人士' },
    { pattern: /(女性|女生|女士|女孩)/, value: '女性' },
    { pattern: /(男性|男生|男士)/, value: '男性' }
  ]
};

export class IntentRecognitionSkill extends AnalysisSkill {
  readonly id = 'intent-recognition';
  readonly name = '意图识别';
  readonly description = '分析用户输入，识别用户意图和提取关键实体';
  readonly version = '1.0.0';

  protected supportedAgents: AgentType[] = ['director', 'designer', 'system'];

  readonly capabilities: Capability[] = [
    {
      id: 'recognize-intent',
      name: '识别意图',
      description: '识别用户的真实意图',
      parameters: [
        { name: 'message', type: 'string', required: true, description: '用户消息' }
      ]
    },
    {
      id: 'extract-entities',
      name: '提取实体',
      description: '从用户输入中提取关键实体',
      parameters: [
        { name: 'message', type: 'string', required: true, description: '用户消息' },
        { name: 'entityTypes', type: 'array', required: false, description: '实体类型列表' }
      ]
    }
  ];

  private recognitionConfig: IntentRecognitionConfig;

  constructor(config: IntentRecognitionConfig = {}) {
    super();
    this.recognitionConfig = {
      confidenceThreshold: 0.6,
      enableEntityExtraction: true,
      enableClarification: true,
      ...config
    };
  }

  /**
   * 检查是否可以处理该意图
   */
  canHandle(intent: UserIntent): boolean {
    // 意图识别 Skill 可以处理任何输入
    return true;
  }

  /**
   * 执行意图识别
   */
  protected async doExecute(context: ExecutionContext): Promise<SkillResult> {
    const { message, parameters } = context;

    try {
      const result = this.recognizeIntent(message);

      return this.createAnalysisResult(
        {
          intent: result.type,
          confidence: result.confidence,
          entities: result.entities,
          keywords: result.keywords,
          clarificationNeeded: result.clarificationNeeded,
          suggestedResponse: result.suggestedResponse
        },
        result.confidence
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '意图识别失败';
      console.error('[IntentRecognitionSkill] Error:', errorMessage);
      return this.createErrorResult(errorMessage, false);
    }
  }

  /**
   * 识别意图
   */
  private recognizeIntent(message: string): UserIntent {
    const normalized = message.toLowerCase().trim();
    const keywords = this.extractKeywords(normalized);

    // 计算每个意图的分数
    const scores: Map<string, number> = new Map();

    for (const intent of INTENT_DEFINITIONS) {
      let score = 0;

      // 关键词匹配
      for (const keyword of intent.keywords) {
        if (normalized.includes(keyword.toLowerCase())) {
          score += 0.3;
        }
      }

      // 模式匹配
      for (const pattern of intent.patterns) {
        if (pattern.test(normalized)) {
          score += 0.5;
        }
      }

      if (score > 0) {
        scores.set(intent.type, Math.min(score, 1));
      }
    }

    // 排序并获取最高分的意图
    const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
      return {
        type: 'unclear',
        confidence: 0,
        keywords,
        entities: {},
        rawMessage: message,
        clarificationNeeded: true,
        suggestedResponse: '抱歉，我不太理解您的意思。您是想设计什么东西吗？'
      };
    }

    const [primaryType, primaryConfidence] = sorted[0];

    // 提取实体
    const entities = this.recognitionConfig.enableEntityExtraction
      ? this.extractEntities(normalized)
      : {};

    // 判断是否需要澄清
    const clarificationNeeded = primaryConfidence < (this.recognitionConfig.confidenceThreshold || 0.6);

    return {
      type: primaryType,
      confidence: primaryConfidence,
      keywords,
      entities,
      rawMessage: message,
      clarificationNeeded,
      suggestedResponse: clarificationNeeded
        ? this.generateClarification(primaryType, entities)
        : undefined
    };
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 简单的中文分词
    const words = text.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];
    return words.map(w => w.toLowerCase());
  }

  /**
   * 提取实体
   */
  private extractEntities(text: string): Record<string, string> {
    const entities: Record<string, string> = {};

    for (const [entityType, rules] of Object.entries(ENTITY_RULES)) {
      for (const rule of rules) {
        if (rule.pattern.test(text)) {
          entities[entityType] = rule.value;
          break;
        }
      }
    }

    return entities;
  }

  /**
   * 生成澄清建议
   */
  private generateClarification(intentType: string, entities: Record<string, string>): string {
    if (intentType === 'image-generation' && !entities.designType) {
      return '您想要设计什么呢？比如IP形象、Logo、海报、包装等。';
    }

    if (intentType === 'image-generation' && !entities.style) {
      return '您有偏好的风格吗？比如可爱、简约、科技风等。';
    }

    if (intentType === 'design-request' && !entities.designType) {
      return '您需要哪种类型的设计服务？';
    }

    if (intentType === 'unclear') {
      return '您可以描述一下想要设计的内容和用途，我会帮您规划。';
    }

    return '能否提供更多细节，以便我更好地理解您的需求？';
  }

  /**
   * 批量识别意图
   */
  recognizeBatch(messages: string[]): UserIntent[] {
    return messages.map(msg => this.recognizeIntent(msg));
  }

  /**
   * 添加自定义意图
   */
  addIntentDefinition(definition: IntentDefinition): void {
    INTENT_DEFINITIONS.push(definition);
  }

  /**
   * 初始化
   */
  protected async onInitialize(): Promise<void> {
    console.log('[IntentRecognitionSkill] Initialized with config:', this.recognitionConfig);
  }
}
