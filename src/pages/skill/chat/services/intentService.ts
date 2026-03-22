import { callQwenChat } from '@/services/llm/chatProviders';

export type IntentType = 
  | 'image-generation'
  | 'logo-design'
  | 'poster-design'
  | 'text-generation'
  | 'brand-copy'
  | 'marketing-copy'
  | 'social-copy'
  | 'color-scheme'
  | 'creative-idea'
  | 'general'
  | 'greeting'
  | 'help';

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  params: Record<string, string>;
  reasoning: string;
}

// 意图识别提示词
const INTENT_RECOGNITION_PROMPT = `你是一个意图识别专家。请分析用户的输入，识别用户的意图类型和提取关键参数。

可选的意图类型：
- image-generation: 图片生成（生成图片、画图、设计图片等）
- logo-design: Logo设计（设计Logo、品牌标识等）
- poster-design: 海报设计（设计海报、宣传图等）
- text-generation: 文案生成（写文案、写文章等）
- brand-copy: 品牌文案（品牌宣传、品牌故事等）
- marketing-copy: 营销文案（营销内容、广告语等）
- social-copy: 社交媒体文案（朋友圈、微博、小红书等）
- color-scheme: 配色方案（推荐颜色、配色建议等）
- creative-idea: 创意点子（营销创意、活动方案等）
- greeting: 问候（打招呼、寒暄等）
- help: 帮助（询问功能、如何使用等）
- general: 一般对话（其他类型的对话）

请严格按照以下 JSON 格式返回结果：
{
  "intent": "意图类型",
  "confidence": 0.95,
  "params": {
    "key1": "value1",
    "key2": "value2"
  },
  "reasoning": "识别理由的简要说明"
}

注意：
1. confidence 是 0-1 之间的置信度
2. params 是提取的关键参数，如风格、主题、用途等
3. 只返回 JSON，不要包含其他内容`;

// 置信度阈值
const CONFIDENCE_THRESHOLD = 0.6;

// 识别用户意图
export const recognizeIntent = async (
  userMessage: string,
  signal?: AbortSignal
): Promise<IntentResult> => {
  try {
    const response = await callQwenChat({
      model: 'qwen-turbo',
      messages: [
        { role: 'system' as 'system', content: INTENT_RECOGNITION_PROMPT },
        { role: 'user' as 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 500,
      signal,
    });

    // 解析 JSON 响应
    try {
      const result = JSON.parse(response);
      const confidence = result.confidence || 0.5;
      const intent = result.intent || 'general';

      // 如果置信度低于阈值，降级为 general 意图
      if (confidence < CONFIDENCE_THRESHOLD && intent !== 'general' && intent !== 'greeting' && intent !== 'help') {
        console.log(`[IntentService] Confidence ${confidence} below threshold ${CONFIDENCE_THRESHOLD}, falling back to general`);
        return {
          intent: 'general',
          confidence: confidence,
          params: result.params || {},
          reasoning: `置信度低于阈值(${CONFIDENCE_THRESHOLD})，降级为一般对话`,
        };
      }

      return {
        intent: intent,
        confidence: confidence,
        params: result.params || {},
        reasoning: result.reasoning || '',
      };
    } catch (parseError) {
      console.error('[IntentService] Failed to parse intent response:', response);
      // 如果解析失败，使用简单的关键词匹配作为降级方案
      return fallbackIntentRecognition(userMessage);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('请求已取消');
    }
    console.error('[IntentService] Error:', error);
    // 使用降级方案
    return fallbackIntentRecognition(userMessage);
  }
};

// 降级意图识别（基于关键词）
const fallbackIntentRecognition = (message: string): IntentResult => {
  const lowerMessage = message.toLowerCase();

  // Logo 设计相关（支持中英文）
  if (lowerMessage.includes('logo') || lowerMessage.includes('标志') || lowerMessage.includes('品牌标识') || lowerMessage.includes('brand identity') || lowerMessage.includes('商标')) {
    return {
      intent: 'logo-design',
      confidence: 0.9,
      params: extractParams(lowerMessage),
      reasoning: '关键词匹配：logo/标志',
    };
  }

  // 海报设计相关（支持中英文）
  if (lowerMessage.includes('海报') || lowerMessage.includes('宣传') || lowerMessage.includes('poster') || lowerMessage.includes('banner') || lowerMessage.includes('flyer')) {
    return {
      intent: 'poster-design',
      confidence: 0.85,
      params: extractParams(lowerMessage),
      reasoning: '关键词匹配：海报/宣传',
    };
  }

  // 图片生成相关
  if (lowerMessage.includes('图') || lowerMessage.includes('画') || lowerMessage.includes('生成') || lowerMessage.includes('image') || lowerMessage.includes('picture') || lowerMessage.includes('generate')) {
    return {
      intent: 'image-generation',
      confidence: 0.8,
      params: extractParams(lowerMessage),
      reasoning: '关键词匹配：图/画/生成',
    };
  }

  // 品牌文案相关
  if (lowerMessage.includes('品牌') || lowerMessage.includes('brand')) {
    return {
      intent: 'brand-copy',
      confidence: 0.85,
      params: extractParams(lowerMessage),
      reasoning: '关键词匹配：品牌',
    };
  }

  // 营销文案相关（支持中英文）
  if (lowerMessage.includes('营销') || lowerMessage.includes('推广') || lowerMessage.includes('marketing') || lowerMessage.includes('promotion') || lowerMessage.includes('advertising')) {
    return {
      intent: 'marketing-copy',
      confidence: 0.85,
      params: extractParams(lowerMessage),
      reasoning: '关键词匹配：营销/推广',
    };
  }

  // 社交媒体文案（支持中英文）
  if (lowerMessage.includes('朋友圈') || lowerMessage.includes('微博') || lowerMessage.includes('小红书') || lowerMessage.includes('抖音') || lowerMessage.includes('微信') || lowerMessage.includes('weibo') || lowerMessage.includes('xiaohongshu') || lowerMessage.includes('tiktok') || lowerMessage.includes('instagram') || lowerMessage.includes('facebook') || lowerMessage.includes('twitter') || lowerMessage.includes('social media')) {
    return {
      intent: 'social-copy',
      confidence: 0.9,
      params: extractParams(lowerMessage),
      reasoning: '关键词匹配：社交媒体平台',
    };
  }

  // 文案生成相关（支持中英文）
  if (lowerMessage.includes('文案') || lowerMessage.includes('文字') || lowerMessage.includes('写') || lowerMessage.includes('copy') || lowerMessage.includes('writing') || lowerMessage.includes('content')) {
    return {
      intent: 'text-generation',
      confidence: 0.8,
      params: extractParams(lowerMessage),
      reasoning: '关键词匹配：文案/文字/写',
    };
  }

  // 配色方案相关（支持中英文）
  if (lowerMessage.includes('配色') || lowerMessage.includes('颜色') || lowerMessage.includes('色彩') || lowerMessage.includes('color') || lowerMessage.includes('colour') || lowerMessage.includes('palette')) {
    return {
      intent: 'color-scheme',
      confidence: 0.9,
      params: extractParams(lowerMessage),
      reasoning: '关键词匹配：配色/颜色/色彩',
    };
  }

  // 创意相关（支持中英文）
  if (lowerMessage.includes('创意') || lowerMessage.includes('点子') || lowerMessage.includes('想法') || lowerMessage.includes('方案') || lowerMessage.includes('creative') || lowerMessage.includes('idea') || lowerMessage.includes('brainstorm')) {
    return {
      intent: 'creative-idea',
      confidence: 0.85,
      params: extractParams(lowerMessage),
      reasoning: '关键词匹配：创意/点子/想法/方案',
    };
  }

  // 问候相关（支持中英文）
  if (lowerMessage.includes('你好') || lowerMessage.includes('您好') || lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.includes('greetings')) {
    return {
      intent: 'greeting',
      confidence: 0.9,
      params: {},
      reasoning: '关键词匹配：问候语',
    };
  }

  // 帮助相关（支持中英文）
  if (lowerMessage.includes('帮助') || lowerMessage.includes('怎么用') || lowerMessage.includes('功能') || lowerMessage.includes('help') || lowerMessage.includes('how to') || lowerMessage.includes('what can')) {
    return {
      intent: 'help',
      confidence: 0.85,
      params: {},
      reasoning: '关键词匹配：帮助/功能',
    };
  }

  // 默认一般对话
  return {
    intent: 'general',
    confidence: 0.6,
    params: extractParams(lowerMessage),
    reasoning: '未匹配到特定意图',
  };
};

// 提取参数
const extractParams = (message: string): Record<string, string> => {
  const params: Record<string, string> = {};
  
  // 提取风格
  const styleKeywords = ['简约', '复古', '现代', '科技感', '可爱', '商务', '高端', '时尚'];
  for (const style of styleKeywords) {
    if (message.includes(style)) {
      params.style = style;
      break;
    }
  }
  
  // 提取用途
  const usageKeywords = ['商业', '个人', '社交', '宣传', '展示', '推广'];
  for (const usage of usageKeywords) {
    if (message.includes(usage)) {
      params.usage = usage;
      break;
    }
  }
  
  // 提取主题
  if (message.includes('关于')) {
    const match = message.match(/关于(.+?)(的|，|。|\s|$)/);
    if (match) {
      params.topic = match[1].trim();
    }
  }
  
  return params;
};

// 获取意图的显示名称
export const getIntentDisplayName = (intent: IntentType): string => {
  const displayNames: Record<IntentType, string> = {
    'image-generation': '图片生成',
    'logo-design': 'Logo设计',
    'poster-design': '海报设计',
    'text-generation': '文案生成',
    'brand-copy': '品牌文案',
    'marketing-copy': '营销文案',
    'social-copy': '社媒文案',
    'color-scheme': '配色方案',
    'creative-idea': '创意点子',
    'general': '一般对话',
    'greeting': '问候',
    'help': '帮助',
  };
  
  return displayNames[intent] || '未知意图';
};

// 获取意图的图标颜色
export const getIntentColor = (intent: IntentType): string => {
  const colors: Record<IntentType, string> = {
    'image-generation': 'from-purple-500 to-pink-500',
    'logo-design': 'from-blue-500 to-cyan-500',
    'poster-design': 'from-green-500 to-emerald-500',
    'text-generation': 'from-orange-500 to-red-500',
    'brand-copy': 'from-indigo-500 to-purple-500',
    'marketing-copy': 'from-pink-500 to-rose-500',
    'social-copy': 'from-cyan-500 to-blue-500',
    'color-scheme': 'from-yellow-500 to-orange-500',
    'creative-idea': 'from-red-500 to-pink-500',
    'general': 'from-gray-500 to-gray-600',
    'greeting': 'from-green-500 to-teal-500',
    'help': 'from-blue-500 to-indigo-500',
  };
  
  return colors[intent] || 'from-gray-500 to-gray-600';
};

export default {
  recognizeIntent,
  getIntentDisplayName,
  getIntentColor,
};
