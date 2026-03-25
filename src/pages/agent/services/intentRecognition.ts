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
  OTHER = 'OTHER',
  MULTI_STEP_TASK = 'MULTI_STEP_TASK' // 多步骤任务
}

// 多步骤任务步骤
export interface TaskStep {
  id: string;
  name: string;
  description: string;
  agent: string;
  dependencies: string[];
}

// 多步骤任务识别结果
export interface MultiStepTaskResult {
  isMultiStep: boolean;
  steps: TaskStep[];
  workflowType: string;
  estimatedDuration: string;
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
    keywords: ['设计', '创建', '生成', '制作', '画', '做', '想要', '需要', '创作', '绘制'],
    patterns: [
      /(?:帮我|给我|想|要|需要).*(?:设计|画|做|生成|创作)/i,
      /(?:做|画|设计|生成|创作).*(?:个|一下|一个|张|幅)/i,
      /^(?:帮我|给我).*?(?:画|设计|做|生成)/i
    ],
    description: '用户想要创建新的设计'
  },
  {
    type: IntentType.MODIFY_DESIGN,
    keywords: ['修改', '调整', '改', '换', '变', '优化', '完善', '改一下', '调一下', '重新', '换个', '改成'],
    patterns: [
      /(?:把|将|给).*(?:改|换|调整|优化)/i,
      /(?:修改|调整|优化|重新).*/i,
      /^(?:改一下|调一下|换个|变下|改成)/i
    ],
    description: '用户想要修改现有设计'
  },
  {
    type: IntentType.STYLE_INQUIRY,
    keywords: ['风格', '样式', '效果', '样子', '感觉', '氛围', '好看', '选哪个', '哪个好看', '有什么风格'],
    patterns: [
      /(?:什么|哪种|推荐).*(?:风格|样式)/i,
      /(?:风格|样式).*(?:好|合适|推荐|选择)/i,
      /^(?:有啥|有什么|有哪些).*(?:风格|样式)/i,
      /^(?:哪个|哪种|什么).*(?:风格|好看)/i,
      /(?:哪个|哪种).*好看/i
    ],
    description: '用户询问风格相关'
  },
  {
    type: IntentType.ASK_QUESTION,
    keywords: ['?', '？', '怎么', '如何', '为什么', '是什么', '多少', '吗', '能否', '可以', '能吗', '为什', '怎样'],
    patterns: [
      /^(?:请问|我想知道|能否|可以|能不能).*/i,
      /.*\?$/,
      /(?:怎么|如何|怎样).*(?:做|用|操作|实现)/i
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
    keywords: ['好', '行', '可以', '确定', '确认', '没问题', '对的', '是的', 'OK', 'ok', '好嘞', '收到', '就这样', '就这么办'],
    patterns: [
      /^(?:好|行|可以|确定|没问题|对的|是的|OK|好嘞|收到|就这样)$/i,
      /(?:就|那).*(?:这样|可以|行)/i,
      /^(?:好的|好的好的|好嘞)$/i
    ],
    description: '用户确认'
  },
  {
    type: IntentType.REJECT,
    keywords: ['不', '不行', '不要', '不对', '错了', '重新', '换', '不喜欢', '不满意', '不太好', '不是', '别', '不要这个'],
    patterns: [
      /^(?:不|不行|不对|不要|不喜欢|不满意|不太好)$/i,
      /(?:不|别|不太).*(?:这样|要|行|喜欢|满意)/i,
      /^(?:不要|别要|不喜欢)$/i
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
    keywords: ['你好', '您好', '哈喽', '嗨', 'hello', 'hi', '在吗', '你好呀', '嗨喽', '早上好', '下午好', '晚上好', 'hi', 'hey'],
    patterns: [
      /^(?:你好|您好|哈喽|嗨|hello|hi|hey|在吗|你好呀|嗨喽|早上好|下午好|晚上好)$/i
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

// 多步骤任务检测器
export class MultiStepTaskDetector {
  // 多步骤关键词模式
  private static readonly MULTI_STEP_PATTERNS = [
    { pattern: /先(.+?)再(.+)/, type: 'sequential' },
    { pattern: /先(.+?)然后(.+)/, type: 'sequential' },
    { pattern: /首先(.+?)接着(.+)/, type: 'sequential' },
    { pattern: /第一步(.+?)第二步(.+)/, type: 'sequential' },
    { pattern: /第1步(.+?)第2步(.+)/, type: 'sequential' },
    { pattern: /(.+?)之后(.+)/, type: 'sequential' },
    { pattern: /(.+?)接着(.+)/, type: 'sequential' },
    { pattern: /(.+?)然后(.+)/, type: 'sequential' },
    { pattern: /(.+?)最后(.+)/, type: 'sequential' },
    { pattern: /不仅(.+?)还要(.+)/, type: 'parallel' },
    { pattern: /既要(.+?)又要(.+)/, type: 'parallel' },
    { pattern: /同时(.+?)和(.+)/, type: 'parallel' }
  ];

  // 任务类型映射
  private static readonly TASK_TYPE_MAP: Record<string, { name: string; agent: string; description: string }> = {
    '品牌设计': { name: '品牌设计', agent: 'designer', description: '设计品牌Logo和视觉识别系统' },
    '品牌': { name: '品牌设计', agent: 'designer', description: '设计品牌Logo和视觉识别系统' },
    'Logo': { name: 'Logo设计', agent: 'designer', description: '设计品牌标志' },
    'logo': { name: 'Logo设计', agent: 'designer', description: '设计品牌标志' },
    '标志': { name: 'Logo设计', agent: 'designer', description: '设计品牌标志' },
    'VI': { name: 'VI系统设计', agent: 'designer', description: '设计品牌视觉识别系统' },
    'vi': { name: 'VI系统设计', agent: 'designer', description: '设计品牌视觉识别系统' },
    '视觉识别': { name: 'VI系统设计', agent: 'designer', description: '设计品牌视觉识别系统' },
    '包装': { name: '包装设计', agent: 'designer', description: '设计产品包装' },
    '礼盒': { name: '包装设计', agent: 'designer', description: '设计产品包装' },
    '盒子': { name: '包装设计', agent: 'designer', description: '设计产品包装' },
    '宣传': { name: '宣传物料设计', agent: 'designer', description: '设计宣传海报和物料' },
    '海报': { name: '海报设计', agent: 'designer', description: '设计宣传海报' },
    '物料': { name: '宣传物料设计', agent: 'designer', description: '设计宣传物料' },
    'IP': { name: 'IP形象设计', agent: 'illustrator', description: '设计IP形象和角色' },
    '形象': { name: 'IP形象设计', agent: 'illustrator', description: '设计IP形象和角色' },
    '角色': { name: 'IP形象设计', agent: 'illustrator', description: '设计IP形象和角色' },
    '插画': { name: '插画设计', agent: 'illustrator', description: '创作插画作品' },
    '文案': { name: '文案创作', agent: 'copywriter', description: '撰写品牌文案' },
    '标语': { name: '标语创作', agent: 'copywriter', description: '创作品牌标语' },
    '动画': { name: '动画制作', agent: 'animator', description: '制作动画视频' },
    '视频': { name: '视频制作', agent: 'animator', description: '制作宣传视频' }
  };

  /**
   * 检测是否为多步骤任务
   */
  static detect(userInput: string): MultiStepTaskResult {
    const normalized = userInput.toLowerCase().trim();

    // 检查是否匹配多步骤模式
    for (const { pattern, type } of this.MULTI_STEP_PATTERNS) {
      const match = normalized.match(pattern);
      if (match) {
        const steps = this.extractSteps(match, type);
        if (steps.length >= 2) {
          return {
            isMultiStep: true,
            steps,
            workflowType: this.determineWorkflowType(steps),
            estimatedDuration: this.estimateDuration(steps)
          };
        }
      }
    }

    // 检查是否包含多个任务类型
    const detectedTypes = this.detectMultipleTaskTypes(normalized);
    if (detectedTypes.length >= 2) {
      const steps = detectedTypes.map((type, index) => ({
        id: `step_${index + 1}`,
        name: type.name,
        description: type.description,
        agent: type.agent,
        dependencies: index === 0 ? [] : [`step_${index}`]
      }));

      return {
        isMultiStep: true,
        steps,
        workflowType: this.determineWorkflowType(steps),
        estimatedDuration: this.estimateDuration(steps)
      };
    }

    return {
      isMultiStep: false,
      steps: [],
      workflowType: '',
      estimatedDuration: ''
    };
  }

  /**
   * 从匹配结果提取步骤
   */
  private static extractSteps(match: RegExpMatchArray, type: string): TaskStep[] {
    const steps: TaskStep[] = [];
    const groups = match.slice(1); // 去掉完整匹配

    groups.forEach((content, index) => {
      const taskInfo = this.identifyTaskType(content.trim());
      steps.push({
        id: `step_${index + 1}`,
        name: taskInfo.name,
        description: taskInfo.description,
        agent: taskInfo.agent,
        dependencies: index === 0 ? [] : [`step_${index}`]
      });
    });

    return steps;
  }

  /**
   * 识别任务类型
   */
  private static identifyTaskType(content: string): { name: string; agent: string; description: string } {
    for (const [keyword, info] of Object.entries(this.TASK_TYPE_MAP)) {
      if (content.includes(keyword.toLowerCase())) {
        return info;
      }
    }

    // 默认返回通用设计任务
    return {
      name: '设计任务',
      agent: 'designer',
      description: `完成${content}相关设计`
    };
  }

  /**
   * 检测多个任务类型
   */
  private static detectMultipleTaskTypes(content: string): Array<{ name: string; agent: string; description: string }> {
    const detected: Array<{ name: string; agent: string; description: string }> = [];
    const detectedNames = new Set<string>();

    for (const [keyword, info] of Object.entries(this.TASK_TYPE_MAP)) {
      if (content.includes(keyword.toLowerCase()) && !detectedNames.has(info.name)) {
        detected.push(info);
        detectedNames.add(info.name);
      }
    }

    return detected;
  }

  /**
   * 确定工作流类型
   */
  private static determineWorkflowType(steps: TaskStep[]): string {
    const hasBrand = steps.some(s => s.name.includes('品牌') || s.name.includes('Logo'));
    const hasPackaging = steps.some(s => s.name.includes('包装'));
    const hasPromotion = steps.some(s => s.name.includes('宣传') || s.name.includes('海报'));
    const hasIP = steps.some(s => s.name.includes('IP') || s.name.includes('形象'));

    if (hasBrand && hasPackaging && hasPromotion) {
      return 'brand-packaging-promotion';
    }
    if (hasBrand && hasPackaging) {
      return 'brand-packaging';
    }
    if (hasIP) {
      return 'ip-design';
    }
    if (hasBrand) {
      return 'brand-design';
    }

    return 'custom-workflow';
  }

  /**
   * 估计执行时间
   */
  private static estimateDuration(steps: TaskStep[]): string {
    const baseTime = steps.length * 5; // 每步5分钟基础时间
    const totalMinutes = baseTime + 5; // 加5分钟缓冲

    if (totalMinutes < 60) {
      return `${totalMinutes}分钟`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
  }
}

// 导出便捷函数
export function detectMultiStepTask(userInput: string): MultiStepTaskResult {
  return MultiStepTaskDetector.detect(userInput);
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
