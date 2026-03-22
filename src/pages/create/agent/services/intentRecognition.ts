/**
 * 意图识别服务 - 兼容层
 * 已迁移到 semanticIntentAnalyzer.ts 和 entityExtractor.ts
 * 此文件保留以维持向后兼容
 */

// 意图类型
export enum IntentType {
  CREATE_DESIGN = 'CREATE_DESIGN',
  MODIFY_DESIGN = 'MODIFY_DESIGN',
  STYLE_INQUIRY = 'STYLE_INQUIRY',
  ASK_QUESTION = 'ASK_QUESTION',
  REQUEST_EXAMPLE = 'REQUEST_EXAMPLE',
  CONFIRM = 'CONFIRM',
  REJECT = 'REJECT',
  CANCEL = 'CANCEL',
  GREETING = 'GREETING',
  FAREWELL = 'FAREWELL',
  THANKS = 'THANKS',
  UNCLEAR = 'UNCLEAR',
  OTHER = 'OTHER'
}

// 意图识别结果
export interface IntentRecognitionResult {
  primaryIntent: IntentType;
  confidence: number;
  secondaryIntents: { intent: IntentType; confidence: number }[];
  entities: Record<string, string>;
  clarificationNeeded: boolean;
  suggestedResponse?: string;
}

// 意图定义
interface IntentDefinition {
  type: IntentType;
  keywords: string[];
  patterns: RegExp[];
  description: string;
}

// 意图定义库
const INTENT_DEFINITIONS: IntentDefinition[] = [
  {
    type: IntentType.CREATE_DESIGN,
    keywords: ['设计', '创建', '生成', '制作', '画', '做', '想要', '需要'],
    patterns: [
      /(?:帮我|给我|想|要).*(?:设计|画|做|生成)/i,
      /(?:做|画|设计).*(?:个|一下|一个)/i
    ],
    description: '用户想要创建新的设计'
  },
  {
    type: IntentType.MODIFY_DESIGN,
    keywords: ['修改', '调整', '改', '换', '变', '优化', '完善'],
    patterns: [
      /(?:把|将|给).*(?:改|换|调整)/i,
      /(?:修改|调整|优化).*/i
    ],
    description: '用户想要修改现有设计'
  },
  {
    type: IntentType.STYLE_INQUIRY,
    keywords: ['风格', '样式', '效果', '样子', '感觉', '氛围'],
    patterns: [
      /(?:什么|哪种|推荐).*(?:风格|样式)/i,
      /(?:风格|样式).*(?:好|合适|推荐)/i
    ],
    description: '用户询问风格相关'
  },
  {
    type: IntentType.ASK_QUESTION,
    keywords: ['?', '？', '怎么', '如何', '为什么', '是什么', '多少', '吗'],
    patterns: [
      /^(?:请问|我想知道|能否|可以).*/i,
      /.*\?$/
    ],
    description: '用户提出问题'
  },
  {
    type: IntentType.REQUEST_EXAMPLE,
    keywords: ['例子', '示例', '参考', '案例', '看看', '样例'],
    patterns: [
      /(?:给|发|看).*(?:例子|示例|参考)/i,
      /(?:有|有没有).*(?:例子|案例)/i
    ],
    description: '用户请求示例'
  },
  {
    type: IntentType.CONFIRM,
    keywords: ['好', '行', '可以', '确定', '确认', '没问题', '对的', '是的'],
    patterns: [
      /^(?:好|行|可以|确定|没问题|对的|是的)$/i,
      /(?:就|那).*(?:这样|可以|行)/i
    ],
    description: '用户确认'
  },
  {
    type: IntentType.REJECT,
    keywords: ['不', '不行', '不要', '不对', '错了', '重新', '换'],
    patterns: [
      /^(?:不|不行|不对|不要)$/i,
      /(?:不|别).*(?:这样|要|行)/i
    ],
    description: '用户拒绝或否定'
  },
  {
    type: IntentType.CANCEL,
    keywords: ['取消', '停止', '结束', '算了', '放弃'],
    patterns: [
      /^(?:取消|停止|结束|算了|放弃)$/i
    ],
    description: '用户想要取消操作'
  },
  {
    type: IntentType.GREETING,
    keywords: ['你好', '您好', '哈喽', '嗨', 'hello', 'hi'],
    patterns: [
      /^(?:你好|您好|哈喽|嗨|hello|hi)/i
    ],
    description: '用户问候'
  },
  {
    type: IntentType.FAREWELL,
    keywords: ['再见', '拜拜', 'bye', 'goodbye', '下次'],
    patterns: [
      /^(?:再见|拜拜|bye|goodbye)/i
    ],
    description: '用户告别'
  },
  {
    type: IntentType.THANKS,
    keywords: ['谢谢', '感谢', '谢了', '多谢'],
    patterns: [
      /^(?:谢谢|感谢|谢了|多谢)/i
    ],
    description: '用户表示感谢'
  }
];

/**
 * 意图识别服务（兼容层）
 */
export class IntentRecognitionService {
  /**
   * 识别用户意图
   */
  async recognizeIntent(userInput: string): Promise<IntentRecognitionResult> {
    const normalized = userInput.toLowerCase().trim();
    const scores: Map<IntentType, number> = new Map();

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
    const sorted = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
      return {
        primaryIntent: IntentType.UNCLEAR,
        confidence: 0,
        secondaryIntents: [],
        entities: this.extractEntities(userInput),
        clarificationNeeded: true,
        suggestedResponse: '抱歉，我不太理解您的意思。您是想设计什么东西吗？'
      };
    }

    const [primaryIntent, primaryConfidence] = sorted[0];
    const secondaryIntents = sorted.slice(1, 3).map(([intent, confidence]) => ({
      intent,
      confidence
    }));

    // 提取实体
    const entities = this.extractEntities(userInput);

    return {
      primaryIntent,
      confidence: primaryConfidence,
      secondaryIntents,
      entities,
      clarificationNeeded: primaryConfidence < 0.6,
      suggestedResponse: this.generateClarification(primaryIntent, entities)
    };
  }

  /**
   * 批量识别意图
   */
  async recognizeBatch(inputs: string[]): Promise<IntentRecognitionResult[]> {
    return Promise.all(inputs.map(input => this.recognizeIntent(input)));
  }

  /**
   * 获取意图描述
   */
  getIntentDescription(intent: IntentType): string {
    const definition = INTENT_DEFINITIONS.find(d => d.type === intent);
    return definition?.description || '未知意图';
  }

  /**
   * 提取实体
   */
  private extractEntities(input: string): Record<string, string> {
    const entities: Record<string, string> = {};

    // 提取设计类型
    const designTypes = [
      { pattern: /(IP|形象|角色| mascot)/i, type: 'IP形象' },
      { pattern: /(logo|标志|商标)/i, type: 'Logo' },
      { pattern: /(海报|宣传|广告)/i, type: '海报' },
      { pattern: /(包装|礼盒|盒子)/i, type: '包装' },
      { pattern: /(插画|插图|手绘)/i, type: '插画' },
      { pattern: /(动画|视频|动效)/i, type: '动画' },
      { pattern: /(品牌|VI|视觉)/i, type: '品牌设计' }
    ];

    for (const dt of designTypes) {
      if (dt.pattern.test(input)) {
        entities.designType = dt.type;
        break;
      }
    }

    // 提取风格关键词
    const styleKeywords = ['可爱', '温馨', '科技', '简约', '复古', '梦幻', '手绘', '现代', '传统'];
    for (const style of styleKeywords) {
      if (input.includes(style)) {
        entities.style = style;
        break;
      }
    }

    // 提取受众
    const audiencePatterns = [
      { pattern: /(儿童|孩子|小朋友|学生)/, type: '儿童' },
      { pattern: /(年轻人|青年|大学生)/, type: '年轻人' },
      { pattern: /(商务|企业|公司|B2B)/, type: '商务人士' },
      { pattern: /(女性|女生|女士|女孩)/, type: '女性' },
      { pattern: /(男性|男生|男士)/, type: '男性' }
    ];

    for (const ap of audiencePatterns) {
      if (ap.pattern.test(input)) {
        entities.audience = ap.type;
        break;
      }
    }

    return entities;
  }

  /**
   * 生成澄清建议
   */
  private generateClarification(intent: IntentType, entities: Record<string, string>): string | undefined {
    if (intent === IntentType.CREATE_DESIGN && !entities.designType) {
      return '您想要设计什么呢？比如IP形象、Logo、海报、包装等。';
    }

    if (intent === IntentType.CREATE_DESIGN && !entities.style) {
      return '您有偏好的风格吗？比如可爱、简约、科技风等。';
    }

    if (intent === IntentType.UNCLEAR) {
      return '您可以描述一下想要设计的内容和用途，我会帮您规划。';
    }

    return undefined;
  }
}

// 导出单例
let intentServiceInstance: IntentRecognitionService | null = null;

export function getIntentRecognitionService(): IntentRecognitionService {
  if (!intentServiceInstance) {
    intentServiceInstance = new IntentRecognitionService();
  }
  return intentServiceInstance;
}

export function resetIntentRecognitionService(): void {
  intentServiceInstance = null;
}
