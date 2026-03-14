// 动态Prompt构建器 - 智能构建最优Prompt

import { getRAGService } from './ragService';
import { getMemoryService } from './memoryService';
import { getIntentRecognitionService, IntentType } from './intentRecognition';
import { AgentType, AGENT_CONFIG } from '../types/agent';

// Token估算配置
const TOKEN_CONFIG = {
  charsPerToken: 4, // 平均每个token约4个字符
  maxTokens: 4000,  // 最大token数
  reserveTokens: 500, // 预留token给响应
  systemPromptMax: 2000, // 系统prompt最大长度
};

// Prompt构建选项
export interface PromptBuildOptions {
  agent: AgentType;
  userMessage: string;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
  enableRAG?: boolean;
  enableMemory?: boolean;
  enableIntent?: boolean;
  taskContext?: {
    type?: string;
    requirements?: Record<string, any>;
    stage?: string;
  };
}

// 构建结果
export interface PromptBuildResult {
  systemPrompt: string;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  estimatedTokens: number;
  metadata: {
    ragUsed: boolean;
    memoryUsed: boolean;
    intentRecognized: IntentType | null;
    compressed: boolean;
  };
}

// Few-shot示例
interface FewShotExample {
  input: string;
  output: string;
  context?: string;
}

// Few-shot示例库
const FEW_SHOT_EXAMPLES: Partial<Record<AgentType, FewShotExample[]>> = {
  director: [
    {
      input: '我想做一个可爱的IP形象',
      output: '好的！我来帮你设计一个可爱的IP形象。首先，我想了解一下：\n\n1. 这个IP形象主要面向什么人群？（比如儿童、年轻人）\n2. 主要用在什么场景？（比如APP、周边产品）\n3. 有什么特别的要求吗？（比如动物、人物、抽象形象）',
      context: '需求收集阶段'
    },
    {
      input: '确认了，就按这个方案做',
      output: '太好了！确认收到。我现在为你安排团队成员：\n\n👨‍🎨 **品牌设计师**：负责整体视觉设计\n🎨 **插画师**：负责IP形象绘制\n\n预计完成时间：3-5分钟\n\n请稍候，团队已经开始工作了！',
      context: '任务分配阶段'
    }
  ],
  designer: [
    {
      input: '设计一个温馨风格的Logo',
      output: '我来为你设计一个温馨风格的Logo。我会使用圆润的字体和暖色调，营造亲切友好的感觉。\n\n🎨 **设计方案**：\n- 风格：温馨治愈\n- 色彩：暖橙色+米白色\n- 字体：圆润无衬线\n\n正在生成设计稿...',
      context: '设计执行阶段'
    }
  ],
  illustrator: [
    {
      input: '画一个可爱的猫咪形象',
      output: '🐱 **猫咪形象设计**\n\n我来为你创作一个可爱的猫咪IP形象：\n\n**设计要点**：\n- 大大的眼睛，增加可爱度\n- 圆润的身体线条\n- 温暖的毛色（橘色+白色）\n- 添加小腮红增加亲和力\n\n正在绘制中...',
      context: '插画创作阶段'
    }
  ],
  copywriter: [
    {
      input: '为咖啡品牌写一句slogan',
      output: '☕ **品牌标语创作**\n\n基于咖啡品牌的温暖调性，我为你准备了几个方案：\n\n1. "每一杯，都是温暖的开始"\n2. "醇香时光，品味生活"\n3. "用心烘焙，温暖传递"\n\n推荐使用第一个，简洁有力且情感共鸣强。',
      context: '文案创作阶段'
    }
  ],
  animator: [
    {
      input: '做一个品牌宣传动画',
      output: '🎬 **品牌宣传动画制作**\n\n我来为你制作一个30秒的品牌宣传动画：\n\n**动画规划**：\n- 开场：品牌Logo动态展示（5秒）\n- 中段：产品特色展示（15秒）\n- 结尾：品牌slogan+CTA（10秒）\n\n正在生成动画...',
      context: '动画制作阶段'
    }
  ],
  researcher: [
    {
      input: '分析一下竞品的设计风格',
      output: '📊 **竞品设计分析报告**\n\n基于市场调研，我为你总结了竞品的设计特点：\n\n**主流趋势**：\n1. 简约扁平化设计占主导\n2. 品牌色彩更加鲜明\n3. 动态元素应用增多\n\n**差异化机会**：\n- 手绘风格较少见\n- 情感化设计有空间',
      context: '调研分析阶段'
    }
  ]
};

/**
 * Prompt构建器
 */
export class PromptBuilder {
  private ragService = getRAGService();
  private memoryService = getMemoryService();
  private intentService = getIntentRecognitionService();

  /**
   * 构建完整Prompt
   */
  async buildPrompt(options: PromptBuildOptions): Promise<PromptBuildResult> {
    const { agent, userMessage, conversationHistory = [] } = options;

    // 1. 识别用户意图
    let intent: IntentType | null = null;
    if (options.enableIntent !== false) {
      const intentResult = await this.intentService.recognizeIntent(userMessage);
      intent = intentResult.primaryIntent;
    }

    // 2. 构建系统Prompt
    let systemPrompt = await this.buildSystemPrompt(agent, options);

    // 3. 应用RAG增强
    let ragUsed = false;
    if (options.enableRAG !== false && intent === IntentType.CREATE_DESIGN) {
      const enhancedPrompt = await this.ragService.enhancePromptWithRAG(
        systemPrompt,
        userMessage,
        { maxLength: 1500 }
      );
      if (enhancedPrompt !== systemPrompt) {
        systemPrompt = enhancedPrompt;
        ragUsed = true;
      }
    }

    // 4. 应用记忆增强
    let memoryUsed = false;
    if (options.enableMemory !== false) {
      const memoryEnhancedPrompt = this.memoryService.buildMemoryEnhancedPrompt(systemPrompt, agent);
      if (memoryEnhancedPrompt !== systemPrompt) {
        systemPrompt = memoryEnhancedPrompt;
        memoryUsed = true;
      }
    }

    // 5. 添加Few-shot示例
    systemPrompt = this.addFewShotExamples(systemPrompt, agent, intent);

    // 6. 压缩Prompt以控制token数
    let compressed = false;
    const estimatedTokens = this.estimateTokens(systemPrompt, conversationHistory, userMessage);
    if (estimatedTokens > TOKEN_CONFIG.maxTokens - TOKEN_CONFIG.reserveTokens) {
      systemPrompt = this.compressPrompt(systemPrompt);
      compressed = true;
    }

    // 7. 构建消息列表
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    return {
      systemPrompt,
      messages,
      estimatedTokens: this.estimateTokens(systemPrompt, conversationHistory, userMessage),
      metadata: {
        ragUsed,
        memoryUsed,
        intentRecognized: intent,
        compressed
      }
    };
  }

  /**
   * 构建系统Prompt
   */
  private async buildSystemPrompt(
    agent: AgentType,
    options: PromptBuildOptions
  ): Promise<string> {
    const config = AGENT_CONFIG[agent];
    let prompt = config.systemPrompt;

    // 添加任务上下文
    if (options.taskContext) {
      prompt += this.buildTaskContextSection(options.taskContext);
    }

    // 添加当前Agent角色说明
    prompt += `\n\n## 当前角色\n你是${config.name}，${config.description}。你的回复应该体现你的专业特点。`;

    return prompt;
  }

  /**
   * 构建任务上下文部分
   */
  private buildTaskContextSection(context: PromptBuildOptions['taskContext']): string {
    if (!context) return '';

    let section = '\n\n## 任务上下文\n';

    if (context.type) {
      section += `- 任务类型：${context.type}\n`;
    }

    if (context.stage) {
      section += `- 当前阶段：${context.stage}\n`;
    }

    if (context.requirements) {
      section += '- 已收集需求：\n';
      for (const [key, value] of Object.entries(context.requirements)) {
        if (value) {
          section += `  - ${key}：${value}\n`;
        }
      }
    }

    return section;
  }

  /**
   * 添加Few-shot示例
   */
  private addFewShotExamples(
    basePrompt: string,
    agent: AgentType,
    intent: IntentType | null
  ): string {
    const examples = FEW_SHOT_EXAMPLES[agent] || [];
    if (examples.length === 0) return basePrompt;

    // 根据意图选择相关示例
    let selectedExamples = examples;
    if (intent) {
      const relevantExamples = examples.filter(ex => {
        // 简单匹配：检查示例上下文是否包含意图关键词
        const context = ex.context || '';
        if (intent === IntentType.CREATE_DESIGN && context.includes('设计')) return true;
        if (intent === IntentType.MODIFY_DESIGN && context.includes('修改')) return true;
        return false;
      });
      if (relevantExamples.length > 0) {
        selectedExamples = relevantExamples;
      }
    }

    // 限制示例数量
    selectedExamples = selectedExamples.slice(0, 2);

    if (selectedExamples.length === 0) return basePrompt;

    let fewShotSection = '\n\n## 参考示例\n\n';
    selectedExamples.forEach((ex, index) => {
      fewShotSection += `示例${index + 1}：\n`;
      fewShotSection += `用户：${ex.input}\n`;
      fewShotSection += `回复：${ex.output}\n\n`;
    });

    return basePrompt + fewShotSection;
  }

  /**
   * 估算Token数
   */
  private estimateTokens(
    systemPrompt: string,
    history: { role: string; content: string }[],
    userMessage: string
  ): number {
    let totalChars = systemPrompt.length;

    for (const msg of history) {
      totalChars += msg.content.length + 20; // +20 for role and formatting
    }

    totalChars += userMessage.length + 20;

    return Math.ceil(totalChars / TOKEN_CONFIG.charsPerToken);
  }

  /**
   * 压缩Prompt
   */
  private compressPrompt(prompt: string): string {
    // 1. 移除多余的空行
    let compressed = prompt.replace(/\n{3,}/g, '\n\n');

    // 2. 如果还是太长，截断示例部分
    const maxLength = TOKEN_CONFIG.systemPromptMax;
    if (compressed.length > maxLength) {
      // 找到示例部分并移除
      const exampleIndex = compressed.indexOf('## 参考示例');
      if (exampleIndex > 0) {
        compressed = compressed.substring(0, exampleIndex).trim();
      }
    }

    // 3. 如果还是太长，截断到最大长度
    if (compressed.length > maxLength) {
      compressed = compressed.substring(0, maxLength) + '\n\n...（内容已截断）';
    }

    return compressed;
  }

  /**
   * 快速构建简单Prompt
   */
  async buildSimplePrompt(
    agent: AgentType,
    userMessage: string,
    additionalContext?: string
  ): Promise<string> {
    const config = AGENT_CONFIG[agent];
    let prompt = config.systemPrompt;

    if (additionalContext) {
      prompt += `\n\n## 额外上下文\n${additionalContext}`;
    }

    // 应用记忆增强
    prompt = this.memoryService.buildMemoryEnhancedPrompt(prompt, agent);

    return prompt;
  }

  /**
   * 构建风格推荐Prompt
   */
  async buildStyleRecommendationPrompt(requirements: string): Promise<string> {
    const ragAdvice = await this.ragService.generateDesignAdvice(requirements, {
      includeCases: false,
      includeStyles: true
    });

    return `你是津脉品牌设计师，擅长根据需求推荐最适合的设计风格。

## 用户需求
${requirements}

${ragAdvice}

请基于以上信息，为用户推荐2-3个最适合的风格，并说明理由。`;
  }

  /**
   * 构建需求分析Prompt
   */
  async buildRequirementAnalysisPrompt(userInput: string): Promise<string> {
    const intentResult = await this.intentService.recognizeIntent(userInput);

    let prompt = `你是津脉设计总监，擅长分析用户需求并提取关键信息。

## 用户输入
"${userInput}"

## 意图识别结果
- 主要意图：${intentResult.primaryIntent}
- 置信度：${(intentResult.confidence * 100).toFixed(1)}%
- 需要澄清：${intentResult.clarificationNeeded ? '是' : '否'}`;

    if (Object.keys(intentResult.entities).length > 0) {
      prompt += '\n\n## 提取的实体\n';
      for (const [key, value] of Object.entries(intentResult.entities)) {
        prompt += `- ${key}：${value}\n`;
      }
    }

    prompt += `\n\n请分析以上信息，输出JSON格式：
{
  "projectType": "项目类型",
  "targetAudience": "目标受众",
  "stylePreference": "风格偏好",
  "usageScenario": "使用场景",
  "missingInfo": ["缺失信息1", "缺失信息2"],
  "confidence": 0-1之间的置信度
}`;

    return prompt;
  }

  /**
   * 获取Prompt统计信息
   */
  getStats(): {
    ragAvailable: boolean;
    memoryAvailable: boolean;
    fewShotExamplesCount: number;
  } {
    const ragStats = this.ragService.getStats();
    const memoryStats = this.memoryService.getMemoryStats();

    let fewShotCount = 0;
    for (const examples of Object.values(FEW_SHOT_EXAMPLES)) {
      fewShotCount += examples.length;
    }

    return {
      ragAvailable: ragStats.totalCases > 0,
      memoryAvailable: memoryStats.totalInteractions > 0,
      fewShotExamplesCount: fewShotCount
    };
  }
}

// 导出单例
let promptBuilderInstance: PromptBuilder | null = null;

export function getPromptBuilder(): PromptBuilder {
  if (!promptBuilderInstance) {
    promptBuilderInstance = new PromptBuilder();
  }
  return promptBuilderInstance;
}

export function resetPromptBuilder(): void {
  promptBuilderInstance = null;
}
