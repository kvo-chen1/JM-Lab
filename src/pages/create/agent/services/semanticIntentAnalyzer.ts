/**
 * 语义意图分析器
 * 使用Embedding和向量相似度实现更精准的意图识别
 */

import { callCurrentModel } from './modelCaller';
import { IntentType } from './intentRecognition';

// 意图示例库 - 用于语义匹配
interface IntentExample {
  intent: IntentType;
  examples: string[];
  embedding?: number[];
}

// 意图示例库
const INTENT_EXAMPLES: IntentExample[] = [
  {
    intent: IntentType.CREATE_DESIGN,
    examples: [
      '我想设计一个Logo',
      '帮我做个海报',
      '需要设计一个IP形象',
      '想要创建一个品牌',
      '能帮我画个图吗',
      '我想做个包装设计',
      '帮我生成一张图片',
      '想要一个可爱的角色',
      '设计一个宣传海报',
      '帮我做个产品包装',
      '我想创作一个形象',
      '能给我设计个标志吗',
      '想要制作一个动画',
      '帮我设计个吉祥物',
      '想做一个品牌设计'
    ]
  },
  {
    intent: IntentType.MODIFY_DESIGN,
    examples: [
      '这个颜色不太对',
      '能改一下风格吗',
      '我想调整一下',
      '这个需要修改',
      '能不能换个颜色',
      '我想换个风格',
      '这个要调整一下',
      '能优化一下吗',
      '想要改一下设计',
      '这个不太满意',
      '能重新设计吗',
      '想要修改一下',
      '这个需要优化',
      '能换个样式吗',
      '我想微调一下'
    ]
  },
  {
    intent: IntentType.STYLE_INQUIRY,
    examples: [
      '有什么风格可选',
      '推荐个风格',
      '什么风格适合我',
      '有哪些风格',
      '这个风格怎么样',
      '哪种风格好看',
      '风格有什么选择',
      '推荐个样式',
      '什么风格比较流行',
      '有哪些设计风格',
      '风格可以换吗',
      '什么样的风格好',
      '能介绍一下风格吗',
      '风格有什么区别',
      '推荐个适合的风格'
    ]
  },
  {
    intent: IntentType.ASK_QUESTION,
    examples: [
      '这个怎么用',
      '怎么操作',
      '为什么这样',
      '是什么意思',
      '如何开始',
      '需要多少钱',
      '多久能完成',
      '有什么要求',
      '怎么收费',
      '支持什么格式',
      '能做什么',
      '有什么功能',
      '如何使用',
      '需要注意什么',
      '流程是什么'
    ]
  },
  {
    intent: IntentType.REQUEST_EXAMPLE,
    examples: [
      '有例子吗',
      '给我看看案例',
      '有参考吗',
      '能看个样例吗',
      '有示例吗',
      '看看之前的作品',
      '有成功案例吗',
      '能展示一下吗',
      '想看个例子',
      '有样品吗',
      '看看效果',
      '能预览吗',
      '有效果图吗',
      '看看别人的',
      '参考案例有吗'
    ]
  },
  {
    intent: IntentType.CONFIRM,
    examples: [
      '好的',
      '可以',
      '没问题',
      '确定',
      '就这样',
      '行',
      '对的',
      '是的',
      '确认了',
      '同意',
      '就这么办',
      'OK',
      '好的就这样',
      '没问题就这样',
      '可以就这样做'
    ]
  },
  {
    intent: IntentType.REJECT,
    examples: [
      '不行',
      '不要',
      '不对',
      '错了',
      '重新来',
      '换一下',
      '不喜欢',
      '不满意',
      '不是这样',
      '不要这个',
      '拒绝',
      '取消',
      '算了',
      '不要了',
      '重新开始'
    ]
  },
  {
    intent: IntentType.CANCEL,
    examples: [
      '取消',
      '停止',
      '结束',
      '放弃',
      '不做了',
      '退出',
      '关掉',
      '终止',
      '撤销',
      '取消操作',
      '停止生成',
      '结束对话',
      '不继续了',
      '取消任务',
      '停止当前操作'
    ]
  },
  {
    intent: IntentType.GREETING,
    examples: [
      '你好',
      '您好',
      '哈喽',
      '嗨',
      'hello',
      'hi',
      '早上好',
      '下午好',
      '晚上好',
      '在吗',
      '有人在吗',
      '你好呀',
      '您好啊',
      '哈喽哈喽',
      '嗨嗨'
    ]
  },
  {
    intent: IntentType.FAREWELL,
    examples: [
      '再见',
      '拜拜',
      'bye',
      'goodbye',
      '下次见',
      '回头见',
      '再联系',
      '走了',
      '先这样',
      '结束',
      '告辞',
      '下次聊',
      '有空再聊',
      '先走了',
      '再见啦'
    ]
  },
  {
    intent: IntentType.THANKS,
    examples: [
      '谢谢',
      '感谢',
      '谢了',
      '多谢',
      '非常感谢',
      '太感谢了',
      '谢谢帮助',
      '感谢支持',
      '谢谢解答',
      '感激不尽',
      '谢谢啦',
      '多谢了',
      '感谢感谢',
      '十分感谢',
      '谢啦'
    ]
  }
];

/**
 * 计算余弦相似度
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 简单的文本Embedding（基于词频的简化版）
 * 实际应用中应该调用真实的Embedding API
 */
function simpleEmbedding(text: string): number[] {
  // 文本预处理
  const normalized = text.toLowerCase().trim();
  
  // 构建词汇表（从所有示例中提取）
  const vocabulary = new Set<string>();
  INTENT_EXAMPLES.forEach(intent => {
    intent.examples.forEach(example => {
      example.split(/\s+/).forEach(word => {
        vocabulary.add(word.toLowerCase());
      });
    });
  });
  
  // 构建词频向量
  const vocabArray = Array.from(vocabulary);
  const words = normalized.split(/\s+/);
  const vector = new Array(vocabArray.length).fill(0);
  
  words.forEach(word => {
    const index = vocabArray.indexOf(word.toLowerCase());
    if (index !== -1) {
      vector[index] += 1;
    }
  });
  
  // 归一化
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    return vector.map(val => val / norm);
  }
  
  return vector;
}

/**
 * 语义意图分析器类
 */
export class SemanticIntentAnalyzer {
  private initialized = false;
  private exampleEmbeddings: Map<IntentType, number[][]> = new Map();

  /**
   * 初始化 - 预计算所有示例的Embedding
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[SemanticIntentAnalyzer] Initializing...');

    // 预计算所有意图示例的Embedding
    for (const intentExample of INTENT_EXAMPLES) {
      const embeddings = intentExample.examples.map(example => 
        simpleEmbedding(example)
      );
      this.exampleEmbeddings.set(intentExample.intent, embeddings);
    }

    this.initialized = true;
    console.log('[SemanticIntentAnalyzer] Initialized successfully');
  }

  /**
   * 基于语义相似度识别意图
   */
  async analyze(input: string): Promise<{
    primaryIntent: IntentType;
    confidence: number;
    secondaryIntents: { intent: IntentType; confidence: number }[];
    semanticScore: number;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    const inputEmbedding = simpleEmbedding(input);
    const scores: { intent: IntentType; score: number }[] = [];

    // 计算与每个意图的相似度
    for (const [intent, embeddings] of this.exampleEmbeddings) {
      // 取与所有示例的最大相似度
      let maxSimilarity = 0;
      for (const exampleEmbedding of embeddings) {
        const similarity = cosineSimilarity(inputEmbedding, exampleEmbedding);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
      scores.push({ intent, score: maxSimilarity });
    }

    // 排序
    scores.sort((a, b) => b.score - a.score);

    // 计算置信度（归一化）
    const primaryScore = scores[0].score;
    const confidence = Math.min(primaryScore * 1.5, 1); // 放大信号，但不超过1

    return {
      primaryIntent: scores[0].intent,
      confidence,
      secondaryIntents: scores.slice(1, 4).map(s => ({
        intent: s.intent,
        confidence: Math.min(s.score * 1.5, 1)
      })),
      semanticScore: primaryScore
    };
  }

  /**
   * 使用LLM进行深度语义理解
   * 用于处理复杂或模糊的输入
   */
  async deepAnalyze(input: string): Promise<{
    intent: IntentType;
    confidence: number;
    reasoning: string;
    entities: Record<string, string>;
  }> {
    try {
      const prompt = `分析以下用户输入的意图和实体：

用户输入："${input}"

请分析并返回JSON格式：
{
  "intent": "意图类型",
  "confidence": 0-1之间的置信度,
  "reasoning": "分析理由",
  "entities": {
    "designType": "设计类型（如果有）",
    "style": "风格（如果有）",
    "audience": "目标受众（如果有）",
    "other": "其他关键信息"
  }
}

可能的意图类型：
- CREATE_DESIGN: 创建设计
- MODIFY_DESIGN: 修改设计
- STYLE_INQUIRY: 风格询问
- ASK_QUESTION: 提问
- REQUEST_EXAMPLE: 请求示例
- CONFIRM: 确认
- REJECT: 拒绝
- CANCEL: 取消
- GREETING: 问候
- FAREWELL: 告别
- THANKS: 感谢
- UNCLEAR: 不明确

请仔细分析用户的真实意图，考虑上下文和隐含意思。`;

      const response = await callCurrentModel([
        { role: 'system', content: '你是一个专业的意图分析助手。' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.3,
        max_tokens: 800
      });

      // 解析JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          intent: parsed.intent as IntentType,
          confidence: parsed.confidence,
          reasoning: parsed.reasoning,
          entities: parsed.entities || {}
        };
      }
    } catch (error) {
      console.error('[SemanticIntentAnalyzer] Deep analysis failed:', error);
    }

    // 降级到简单分析
    const simpleResult = await this.analyze(input);
    return {
      intent: simpleResult.primaryIntent,
      confidence: simpleResult.confidence,
      reasoning: '基于语义相似度分析',
      entities: {}
    };
  }

  /**
   * 批量分析多个输入
   */
  async analyzeBatch(inputs: string[]): Promise<Array<{
    input: string;
    primaryIntent: IntentType;
    confidence: number;
  }>> {
    const results = await Promise.all(
      inputs.map(async input => {
        const result = await this.analyze(input);
        return {
          input,
          primaryIntent: result.primaryIntent,
          confidence: result.confidence
        };
      })
    );
    return results;
  }

  /**
   * 获取最相似的示例
   * 用于调试和优化
   */
  async getMostSimilarExamples(input: string, topK: number = 3): Promise<Array<{
    intent: IntentType;
    example: string;
    similarity: number;
  }>> {
    if (!this.initialized) {
      await this.initialize();
    }

    const inputEmbedding = simpleEmbedding(input);
    const similarities: Array<{
      intent: IntentType;
      example: string;
      similarity: number;
    }> = [];

    for (const intentExample of INTENT_EXAMPLES) {
      for (let i = 0; i < intentExample.examples.length; i++) {
        const embeddings = this.exampleEmbeddings.get(intentExample.intent);
        if (embeddings && embeddings[i]) {
          const similarity = cosineSimilarity(inputEmbedding, embeddings[i]);
          similarities.push({
            intent: intentExample.intent,
            example: intentExample.examples[i],
            similarity
          });
        }
      }
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
}

// 导出单例
let analyzerInstance: SemanticIntentAnalyzer | null = null;

export function getSemanticIntentAnalyzer(): SemanticIntentAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new SemanticIntentAnalyzer();
  }
  return analyzerInstance;
}

export function resetSemanticIntentAnalyzer(): void {
  analyzerInstance = null;
}
