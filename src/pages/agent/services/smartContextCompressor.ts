/**
 * 智能上下文压缩器
 * 基于重要性的智能摘要，替代简单的Token截断
 */

import { AgentMessage } from '../types/agent';
import { callQwenChat } from '@/services/llm/chatProviders';
import { getEmbeddingService } from './embeddingService';

// 消息重要性评分
interface MessageImportance {
  message: AgentMessage;
  importance: number;
  reasons: string[];
  entityCount: number;
  intentClarity: number;
}

// 压缩配置
interface CompressionConfig {
  maxTokens: number;
  maxMessages: number;
  preserveRecent: number;
  preserveImportant: boolean;
  useSummarization: boolean;
  summaryLength: number;
}

// 默认配置
const DEFAULT_CONFIG: CompressionConfig = {
  maxTokens: 4000,
  maxMessages: 20,
  preserveRecent: 5,
  preserveImportant: true,
  useSummarization: true,
  summaryLength: 200
};

// 关键信息模式
const KEY_PATTERNS = {
  // 包含关键决策的信息
  decision: [
    /确定|确认|决定|选定|采用|选择/i,
    /最终|定稿|完成|通过|同意/i
  ],
  // 包含具体需求的信息
  requirement: [
    /需要|想要|希望|要求|必须|应该/i,
    /风格|颜色|尺寸|大小|类型/i
  ],
  // 包含修改记录的信息
  modification: [
    /修改|调整|改|换|优化|完善/i,
    /不对|错了|重新|不一样/i
  ],
  // 包含重要上下文的信息
  context: [
    /之前|刚才|上面|前面|之前说的/i,
    /那个|这个|它|他|她/i
  ]
};

/**
 * 智能上下文压缩器类
 */
export class SmartContextCompressor {
  private config: CompressionConfig;
  private embeddingService = getEmbeddingService();
  private messageCache: Map<string, MessageImportance> = new Map();

  constructor(config?: Partial<CompressionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 压缩消息历史
   */
  async compress(messages: AgentMessage[]): Promise<{
    compressed: AgentMessage[];
    summary: string;
    stats: {
      originalCount: number;
      compressedCount: number;
      compressionRatio: number;
      preservedImportant: number;
    };
  }> {
    if (messages.length <= this.config.maxMessages) {
      return {
        compressed: messages,
        summary: '',
        stats: {
          originalCount: messages.length,
          compressedCount: messages.length,
          compressionRatio: 1,
          preservedImportant: 0
        }
      };
    }

    // 1. 评估每条消息的重要性
    const importanceScores = await this.evaluateImportance(messages);

    // 2. 分离最近消息和历史消息
    const recentMessages = messages.slice(-this.config.preserveRecent);
    const historicalMessages = messages.slice(0, -this.config.preserveRecent);

    // 3. 从历史消息中选择重要消息
    const importantHistorical = this.selectImportantMessages(
      historicalMessages,
      importanceScores,
      this.config.maxMessages - this.config.preserveRecent
    );

    // 4. 对剩余历史消息生成摘要
    let summary = '';
    if (this.config.useSummarization && historicalMessages.length > importantHistorical.length) {
      const messagesToSummarize = historicalMessages.filter(
        m => !importantHistorical.some(im => im.id === m.id)
      );
      summary = await this.generateSummary(messagesToSummarize, importanceScores);
    }

    // 5. 合并结果
    const compressed = [...importantHistorical, ...recentMessages];

    // 6. 计算统计
    const preservedImportant = importantHistorical.filter(
      m => (importanceScores.get(m.id || '')?.importance || 0) > 0.7
    ).length;

    return {
      compressed,
      summary,
      stats: {
        originalCount: messages.length,
        compressedCount: compressed.length,
        compressionRatio: compressed.length / messages.length,
        preservedImportant
      }
    };
  }

  /**
   * 评估消息重要性
   */
  private async evaluateImportance(messages: AgentMessage[]): Promise<Map<string, MessageImportance>> {
    const scores = new Map<string, MessageImportance>();

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const messageId = message.id || `msg_${i}`;
      
      const evaluation = await this.evaluateSingleMessage(message, i, messages);
      scores.set(messageId, evaluation);
      this.messageCache.set(messageId, evaluation);
    }

    return scores;
  }

  /**
   * 评估单条消息的重要性
   */
  private async evaluateSingleMessage(
    message: AgentMessage,
    index: number,
    allMessages: AgentMessage[]
  ): Promise<MessageImportance> {
    const content = message.content;
    const reasons: string[] = [];
    let importance = 0.5; // 基础分
    let entityCount = 0;
    let intentClarity = 0.5;

    // 1. 位置权重（越近越重要）
    const recencyWeight = index / allMessages.length;
    importance += recencyWeight * 0.2;

    // 2. 角色权重（用户消息通常更重要）
    if (message.role === 'user') {
      importance += 0.1;
      reasons.push('用户消息');
    }

    // 3. 内容长度（适中长度通常信息更丰富）
    const contentLength = content.length;
    if (contentLength > 20 && contentLength < 200) {
      importance += 0.1;
      reasons.push('内容长度适中');
    }

    // 4. 关键模式匹配
    for (const [category, patterns] of Object.entries(KEY_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          importance += 0.15;
          reasons.push(`包含${category}信息`);
          break;
        }
      }
    }

    // 5. 实体数量
    const entityMatches = this.extractEntities(content);
    entityCount = entityMatches.length;
    importance += Math.min(entityCount * 0.05, 0.2);
    if (entityCount > 0) {
      reasons.push(`包含${entityCount}个实体`);
    }

    // 6. 意图清晰度
    intentClarity = this.evaluateIntentClarity(content);
    importance += intentClarity * 0.1;
    if (intentClarity > 0.7) {
      reasons.push('意图清晰');
    }

    // 7. 语义独特性（与其他消息的差异度）
    if (index > 0) {
      const similarity = await this.calculateSimilarity(message, allMessages[index - 1]);
      if (similarity < 0.5) {
        importance += 0.1;
        reasons.push('语义独特');
      }
    }

    // 归一化到0-1
    importance = Math.min(Math.max(importance, 0), 1);

    return {
      message,
      importance,
      reasons: [...new Set(reasons)], // 去重
      entityCount,
      intentClarity
    };
  }

  /**
   * 提取简单实体
   */
  private extractEntities(content: string): string[] {
    const entities: string[] = [];
    
    // 设计类型
    const designTypes = content.match(/(logo|标志|海报|包装|ip|形象|插画|品牌)/gi) || [];
    entities.push(...designTypes);
    
    // 风格
    const styles = content.match(/(可爱|简约|复古|国潮|现代|科技|手绘)/g) || [];
    entities.push(...styles);
    
    // 颜色
    const colors = content.match(/(红色|蓝色|绿色|黄色|紫色|粉色|黑色|白色)/g) || [];
    entities.push(...colors);
    
    // 受众
    const audiences = content.match(/(儿童|年轻人|学生|职场|商务|女性|男性)/g) || [];
    entities.push(...audiences);
    
    return [...new Set(entities)];
  }

  /**
   * 评估意图清晰度
   */
  private evaluateIntentClarity(content: string): number {
    let score = 0.5;
    
    // 包含动词通常意图更清晰
    const verbs = content.match(/(设计|做|画|创作|生成|制作|想要|需要)/g);
    if (verbs && verbs.length > 0) {
      score += 0.2;
    }
    
    // 包含具体对象
    const objects = content.match(/(logo|海报|包装|形象|插画)/gi);
    if (objects && objects.length > 0) {
      score += 0.2;
    }
    
    // 疑问句意图不太清晰
    if (/[?？]/.test(content)) {
      score -= 0.1;
    }
    
    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * 计算两条消息的相似度
   */
  private async calculateSimilarity(a: AgentMessage, b: AgentMessage): Promise<number> {
    try {
      const embeddingA = await this.embeddingService.getEmbedding(a.content);
      const embeddingB = await this.embeddingService.getEmbedding(b.content);
      return this.embeddingService.cosineSimilarity(embeddingA, embeddingB);
    } catch (error) {
      // 降级到简单相似度计算
      return this.simpleSimilarity(a.content, b.content);
    }
  }

  /**
   * 简单相似度计算（基于词重叠）
   */
  private simpleSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    
    return intersection.size / union.size;
  }

  /**
   * 选择重要消息
   */
  private selectImportantMessages(
    messages: AgentMessage[],
    scores: Map<string, MessageImportance>,
    maxCount: number
  ): AgentMessage[] {
    // 按重要性排序
    const sorted = messages
      .map(m => ({
        message: m,
        importance: scores.get(m.id || '')?.importance || 0
      }))
      .sort((a, b) => b.importance - a.importance);
    
    // 选择前N个
    return sorted.slice(0, maxCount).map(item => item.message);
  }

  /**
   * 生成摘要
   */
  private async generateSummary(
    messages: AgentMessage[],
    scores: Map<string, MessageImportance>
  ): Promise<string> {
    if (messages.length === 0) return '';

    // 构建对话文本
    const dialogueText = messages
      .map(m => `${m.role === 'user' ? '用户' : '助手'}：${m.content}`)
      .join('\n');

    try {
      const prompt = `请对以下对话历史进行摘要，提取关键信息和决策点：

${dialogueText}

请生成一个简洁的摘要（不超过${this.config.summaryLength}字），包含：
1. 用户的主要需求
2. 已确定的设计要素
3. 重要的决策或修改

摘要：`;

      const summary = await callQwenChat({
        model: 'qwen3.5-122b-a10b',
        messages: [
          { role: 'system', content: '你是一个专业的对话摘要助手。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 300
      });

      return summary.trim();
    } catch (error) {
      console.error('[SmartContextCompressor] Summary generation failed:', error);
      return '';
    }
  }

  /**
   * 获取消息重要性详情（用于调试）
   */
  getMessageImportance(messageId: string): MessageImportance | undefined {
    return this.messageCache.get(messageId);
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.messageCache.clear();
  }
}

// 导出单例
let compressorInstance: SmartContextCompressor | null = null;

export function getSmartContextCompressor(): SmartContextCompressor {
  if (!compressorInstance) {
    compressorInstance = new SmartContextCompressor();
  }
  return compressorInstance;
}

export function resetSmartContextCompressor(): void {
  compressorInstance = null;
}
