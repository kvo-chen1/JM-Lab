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
  | 'image-beautification'
  | 'image-style-transfer'
  | 'image-recognition'
  | 'image-editing'
  | 'video-script'
  | 'event-planning'
  | 'ui-design'
  | 'data-report'
  | 'web-search'
  | 'batch-generation'
  | 'compound-generation'
  | 'refinement'
  | 'general'
  | 'greeting'
  | 'help'
  | 'confirmation'
  | 'rejection';

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  params: Record<string, string>;
  reasoning: string;
  reasoningSteps?: string[];
  clarificationNeeded?: boolean;
  clarificationQuestion?: string;
  entities?: {
    originalImageUrl?: string;
    originalText?: string;
    referenceType?: 'previous-image' | 'previous-text' | 'previous-design';
    referencedTaskIndex?: number;
  };
}

// 历史消息类型（宽松定义，兼容多种来源）
interface ChatMessage {
  role: 'user' | 'assistant' | 'agent';
  content: string;
  attachments?: Array<{
    type?: string;
    url?: string;
    content?: string;
  }>;
}

// 指代词模式
const REFERENCE_PATTERNS = {
  // 图片引用
  imageReference: /这张|那张|这个|那张|这张图|那张图|上面|刚才|之前的|那张图|这张照片|那张照片/i,
  // 文案引用
  textReference: /上面|那段|刚才的|之前的|这段|这个文案|这段文字|上面那段|刚才那个/i,
  // 操作指令（与指代词组合表示编辑/复制）
  copyAction: /复制|拷贝|再来一个|再生成|换个|改下|修改|调整|基于|按照|根据/i,
  // 批量操作
  batchAction: /一套|一组|多个|几个|一系列|批量|全套|全套的|所有/i,
  // 优化迭代关键词
  refinementAction: /优化|调整|改一下|换|改成|变成|换个|更好|改进|改善|完善|修正/i,
  // 指代词组合（表示对之前结果的优化）
  refinementReference: /这个|那个|它|这|那|上一个|之前一个|刚才的|上面/i,
};

// 意图识别提示词
const INTENT_RECOGNITION_PROMPT = `你是一个意图识别专家。请分析用户的输入，识别用户的意图类型和提取关键参数。

可选的意图类型：
- image-generation: 图片生成（生成图片、画图、设计图片等）
- logo-design: Logo 设计（设计 Logo、品牌标识等）
- poster-design: 海报设计（设计海报、宣传图等）
- text-generation: 文案生成（写文案、写文章等）
- brand-copy: 品牌文案（品牌宣传、品牌故事等）
- marketing-copy: 营销文案（营销内容、广告语等）
- social-copy: 社交媒体文案（朋友圈、微博、小红书等）
- color-scheme: 配色方案（推荐颜色、配色建议等）
- creative-idea: 创意点子（营销创意、活动方案等）
- image-beautification: 图片美化（美化图片、优化图片、让图片更好看等）
- image-style-transfer: 风格转换（将图片转换成某种风格，如水彩、油画、卡通等）
- image-recognition: 图片识别（识别图片内容、分析图片、描述图片等）
- video-script: 视频脚本（写视频脚本、分镜头、拍摄脚本等）
- event-planning: 活动策划（策划活动、举办活动、活动方案等）
- ui-design: UI 设计（界面设计、APP 设计、网页设计等）
- data-report: 数据分析报告（数据分析报告、周报、月报、数据总结等）
- web-search: 联网搜索（搜索网络信息、查资料、查新闻、查最新信息等，如"帮我搜索最新的AI技术"、"查一下某品牌的资料"）
- compound-generation: 复合任务（一次请求多个不同类型的设计或内容，如"帮我设计一个品牌，包括Logo、海报和名片"）
- refinement: 优化迭代（对之前生成的结果进行调整，如"颜色换成蓝色"、"调整一下风格"、"优化这个设计"）
- greeting: 问候（打招呼、寒暄等，如"你好"、"早上好"）
- help: 帮助（询问功能、如何使用、查资料、搜索信息、获取帮助等，如"帮我查资料"、"你能做什么"、"怎么用"）
- general: 一般对话（其他类型的对话）

请严格按照以下 JSON 格式返回结果：
{
  "intent": "意图类型",
  "confidence": 0.95,
  "params": {
    "key1": "value1",
    "key2": "value2"
  },
  "reasoning": "识别理由的简要说明",
  "clarificationNeeded": false,
  "clarificationQuestion": "如果需要澄清，这里填写问题"
}

注意：
1. confidence 是 0-1 之间的置信度
2. params 是提取的关键参数，如风格、主题、用途等
3. 只返回 JSON，不要包含其他内容
4. clarificationNeeded 为 true 时，需要在 clarificationQuestion 中填写澄清问题

重要：如果用户提到"美化"、"优化"、"转换风格"、"变成 X 风格"等词汇，应该识别为 image-beautification 或 image-style-transfer，而不是一般对话。

关键区分：
- 复合任务(compound-generation) vs 批量生成(batch-generation): 如果用户提到"包括"、"还有"、"以及"、"全套"、"整套"等连接的多个不同类型需求，识别为 compound-generation。如果只提同一类型的大量需求（如"生成10张海报"），识别为 batch-generation
- 优化迭代(refinement) vs 图片编辑(image-editing): refinement 主要针对之前生成的结果进行调整优化，如"颜色换成蓝色"、"风格更简约一些"；image-editing 更侧重于对图片进行编辑修改
- 视频脚本(video-script) vs 文案(text-generation): 如果用户提到"视频"、"脚本"、"分镜"、"拍摄"，应该识别为 video-script
- 活动策划(event-planning) vs 创意点子(creative-idea): 如果用户提到"举办"、"策划"、"活动方案"、"会议"，应该识别为 event-planning
- UI设计(ui-design) vs 海报设计(poster-design): 如果用户提到"界面"、"APP"、"网页"、"小程序"、"交互"，应该识别为 ui-design
- 数据报告(data-report) vs 其他文案: 如果用户提到"数据"、"分析"、"报告"、"周报"、"月报"、"统计"，应该识别为 data-report`;

// 置信度阈值
const CONFIDENCE_THRESHOLD = 0.6;

// 确认词汇模式
const CONFIRMATION_PATTERNS = /^(?:好的|确认|是|可以|没问题|行|OK|ok|Ok|yes|Yes|YES|好|嗯|对的|没错|继续|开始吧|开始撰写|开始生成|执行|开始任务|确认执行)$/;

// 拒绝/否定词汇模式
const REJECTION_PATTERNS = /^(?:不|不用|不要|算了|取消|拒绝|否|No|no|NO|别|停止|结束|退出)$/;

// 检测是否是确认意图
export const isConfirmationIntent = (message: string): boolean => {
  return CONFIRMATION_PATTERNS.test(message.trim());
};

// 检测是否是拒绝意图
export const isRejectionIntent = (message: string): boolean => {
  return REJECTION_PATTERNS.test(message.trim());
};

// 从历史消息中查找最近的图片附件
const findLatestImageAttachment = (history: ChatMessage[]): string | undefined => {
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.attachments && msg.attachments.length > 0) {
      const imageAttachment = msg.attachments.find(att => att.type === 'image' && att.url);
      if (imageAttachment?.url) {
        return imageAttachment.url;
      }
    }
  }
  return undefined;
};

// 从历史消息中查找最近的文本附件
const findLatestTextAttachment = (history: ChatMessage[]): string | undefined => {
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.attachments && msg.attachments.length > 0) {
      const textAttachment = msg.attachments.find(att => att.type === 'text' && att.content);
      if (textAttachment?.content) {
        return textAttachment.content;
      }
    }
  }
  return undefined;
};

// 检测是否包含指代词引用
const hasReferenceToPrevious = (message: string): boolean => {
  return REFERENCE_PATTERNS.imageReference.test(message) ||
         REFERENCE_PATTERNS.textReference.test(message);
};

// 检测是否是图片编辑意图（指代词 + 操作指令）
const isImageEditingIntent = (message: string): boolean => {
  return REFERENCE_PATTERNS.imageReference.test(message) &&
         (REFERENCE_PATTERNS.copyAction.test(message) || REFERENCE_PATTERNS.imageReference.test(message));
};

// 检测是否是文案编辑意图
const isTextEditingIntent = (message: string): boolean => {
  return REFERENCE_PATTERNS.textReference.test(message) &&
         (REFERENCE_PATTERNS.copyAction.test(message) || /复制|改成|修改|调整/.test(message));
};

// 检测是否是批量生成意图
const isBatchGenerationIntent = (message: string): boolean => {
  // 检测批量关键词
  if (REFERENCE_PATTERNS.batchAction.test(message)) {
    return true;
  }

  // 检测编号列表（如 1. xxx 2. xxx）
  const numberedPattern = /(?:^|\n)\s*(?:\(?)(\d+)[\.、\)\s]+([^\n]+?)(?=\s*(?:\n|$|\(?\d+[\.、\)\s]))/;
  const matches = message.match(new RegExp(numberedPattern, 'g'));
  if (matches && matches.length >= 2) {
    return true;
  }

  // 检测"第X步"格式
  const stepPattern = /第\s*\d+\s*步/;
  if (stepPattern.test(message)) {
    return true;
  }

  return false;
};

// 检测是否是优化迭代意图（指代词引用 + 优化关键词）
const isRefinementIntent = (message: string): boolean => {
  const hasRefReference = REFERENCE_PATTERNS.refinementReference.test(message);
  const hasRefAction = REFERENCE_PATTERNS.refinementAction.test(message);

  if (hasRefReference && hasRefAction) {
    return true;
  }

  // 也检测纯优化关键词模式（针对上一条结果）
  const pureRefinementPatterns = [
    /^优化/i,
    /^调整/i,
    /^改一下/i,
    /^换.*颜色/i,
    /^换.*风格/i,
    /^更好/i,
    /^改进/i,
    /^改善/i,
  ];

  return pureRefinementPatterns.some(p => p.test(message.trim()));
};

// 识别用户意图
export const recognizeIntent = async (
  userMessage: string,
  signal?: AbortSignal,
  history: ChatMessage[] = []
): Promise<IntentResult> => {
  // 首先检查是否是上下文引用类请求
  const entities: IntentResult['entities'] = {};

  if (hasReferenceToPrevious(userMessage)) {
    const latestImage = findLatestImageAttachment(history);
    const latestText = findLatestTextAttachment(history);

    if (latestImage) {
      entities.originalImageUrl = latestImage;
      entities.referenceType = 'previous-image';
    }
    if (latestText) {
      entities.originalText = latestText;
      entities.referenceType = 'previous-text';
    }
  }

  try {
    // 构建包含上下文的提示词
    const contextPrompt = entities.originalImageUrl || entities.originalText
      ? `用户消息：${userMessage}\n\n[上下文] 用户的上一条消息中包含一张图片/文案，可能与当前请求有关。`
      : userMessage;

    const response = await callQwenChat({
      model: 'qwen-turbo',
      messages: [
        { role: 'system', content: INTENT_RECOGNITION_PROMPT, timestamp: Date.now() },
        { role: 'user', content: contextPrompt, timestamp: Date.now() },
      ],
      temperature: 0.3,
      max_tokens: 500,
      signal,
    });

    // 解析 JSON 响应
    try {
      const result = JSON.parse(response);
      const confidence = result.confidence || 0.5;
      let intent = result.intent || 'general';

      // 如果检测到指代词引用，覆盖识别结果
      if (entities.originalImageUrl && isImageEditingIntent(userMessage)) {
        intent = 'image-editing';
      } else if (entities.originalText && isTextEditingIntent(userMessage)) {
        intent = 'text-generation';
      } else if (isBatchGenerationIntent(userMessage)) {
        intent = 'batch-generation';
      }

      // 检测 refinement 意图（指代词 + 优化关键词）
      if (isRefinementIntent(userMessage)) {
        intent = 'refinement';
      }

      // 如果置信度低于阈值但不是复合或优化意图，降级为需要澄清
      if (confidence < CONFIDENCE_THRESHOLD && intent !== 'general' && intent !== 'greeting' && intent !== 'help') {
        // 检查是否应该标记为需要澄清而非直接降级
        if (confidence >= 0.5) {
          return {
            intent: intent,
            confidence: confidence,
            params: result.params || {},
            reasoning: result.reasoning || `置信度较低(${Math.round(confidence * 100)}%)，需要确认`,
            entities,
            clarificationNeeded: true,
            clarificationQuestion: result.clarificationQuestion || `我注意到您的需求可能涉及多个方面，您是指...？`,
          };
        }
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
        entities,
        clarificationNeeded: result.clarificationNeeded || false,
        clarificationQuestion: result.clarificationQuestion,
      };
    } catch (parseError) {
      console.error('[IntentService] Failed to parse intent response:', response);
      // 如果解析失败，使用简单的关键词匹配作为降级方案
      return fallbackIntentRecognition(userMessage, entities);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('请求已取消');
    }
    console.error('[IntentService] Error:', error);
    // 使用降级方案
    return fallbackIntentRecognition(userMessage, entities);
  }
};

// 降级意图识别（基于关键词）
const fallbackIntentRecognition = (
  message: string,
  entities?: IntentResult['entities']
): IntentResult => {
  const lowerMessage = message.toLowerCase();
  const reasoningSteps: string[] = [];

  // 优先检测指代词引用 + 操作指令 = 图片编辑意图
  if (isImageEditingIntent(message)) {
    reasoningSteps.push('检测到指代词（这张/那个/上面）');
    reasoningSteps.push('检测到操作指令（复制/改/换/基于）');
    reasoningSteps.push('判定为图片编辑/二次创作意图');
    return {
      intent: 'image-editing',
      confidence: 0.95,
      params: extractParams(message),
      reasoning: '检测到基于已有图片进行编辑的请求',
      reasoningSteps,
      entities,
    };
  }

  // 检测批量生成意图
  if (isBatchGenerationIntent(message)) {
    reasoningSteps.push('检测到批量操作关键词（一套/一组/多个/全套）');
    reasoningSteps.push('判定为批量生成意图');
    return {
      intent: 'batch-generation',
      confidence: 0.9,
      params: extractParams(message),
      reasoning: '检测到批量生成请求',
      reasoningSteps,
      entities,
    };
  }

  // Logo 设计相关（支持中英文）
  if (lowerMessage.includes('logo') || lowerMessage.includes('标志') || lowerMessage.includes('品牌标识') || lowerMessage.includes('brand identity') || lowerMessage.includes('商标')) {
    reasoningSteps.push(`检测到关键词：${lowerMessage.includes('logo') ? 'logo' : ''} ${lowerMessage.includes('标志') ? '标志' : ''} ${lowerMessage.includes('品牌标识') ? '品牌标识' : ''} ${lowerMessage.includes('商标') ? '商标' : ''}`);
    reasoningSteps.push('这些关键词明确指向品牌标志设计');
    return {
      intent: 'logo-design',
      confidence: 0.9,
      params: extractParams(lowerMessage),
      reasoning: '检测到品牌标识相关关键词（logo/标志/商标），判定为 Logo 设计意图',
      reasoningSteps,
    };
  }

  // 海报设计相关（支持中英文）
  if (lowerMessage.includes('海报') || lowerMessage.includes('宣传') || lowerMessage.includes('poster') || lowerMessage.includes('banner') || lowerMessage.includes('flyer')) {
    reasoningSteps.push(`检测到关键词：${lowerMessage.includes('海报') ? '海报' : ''} ${lowerMessage.includes('宣传') ? '宣传' : ''} ${lowerMessage.includes('poster') ? 'poster' : ''} ${lowerMessage.includes('banner') ? 'banner' : ''}`);
    reasoningSteps.push('这些关键词表明用户需要设计宣传物料');
    return {
      intent: 'poster-design',
      confidence: 0.85,
      params: extractParams(lowerMessage),
      reasoning: '检测到宣传物料相关关键词（海报/宣传/banner），判定为海报设计意图',
      reasoningSteps,
    };
  }

  // 图片美化相关（优先级高于一般图片生成）
  if (lowerMessage.includes('美化') || lowerMessage.includes('优化') || lowerMessage.includes('改善') || lowerMessage.includes('调整') || lowerMessage.includes('beautify') || lowerMessage.includes('enhance') || lowerMessage.includes('improve')) {
    reasoningSteps.push(`检测到优化类关键词：${lowerMessage.includes('美化') ? '美化' : ''} ${lowerMessage.includes('优化') ? '优化' : ''} ${lowerMessage.includes('改善') ? '改善' : ''}`);
    reasoningSteps.push('用户希望对现有图片进行改进，而非生成新图片');
    return {
      intent: 'image-beautification',
      confidence: 0.9,
      params: extractParams(lowerMessage),
      reasoning: '检测到图片优化类关键词（美化/优化/改善），判定为图片美化意图',
      reasoningSteps,
      entities,
    };
  }

  // 检测优化迭代意图（指代词引用 + 优化关键词）
  if (isRefinementIntent(message)) {
    reasoningSteps.push('检测到优化迭代关键词');
    reasoningSteps.push('检测到指代词引用');
    reasoningSteps.push('判定为优化迭代意图');
    return {
      intent: 'refinement',
      confidence: 0.95,
      params: extractParams(message),
      reasoning: '检测到对之前生成结果的优化迭代请求',
      reasoningSteps,
      entities,
    };
  }

  // 风格转换相关
  if (lowerMessage.includes('转换') || lowerMessage.includes('风格') || lowerMessage.includes('变成') || lowerMessage.includes('改成') || lowerMessage.includes('水彩') || lowerMessage.includes('油画') || lowerMessage.includes('卡通') || lowerMessage.includes('素描') || lowerMessage.includes('style') || lowerMessage.includes('transfer')) {
    reasoningSteps.push(`检测到风格相关关键词：${lowerMessage.includes('风格') ? '风格' : ''} ${lowerMessage.includes('转换') ? '转换' : ''} ${lowerMessage.includes('水彩') ? '水彩' : ''} ${lowerMessage.includes('油画') ? '油画' : ''} ${lowerMessage.includes('卡通') ? '卡通' : ''}`);
    reasoningSteps.push('用户希望将图片转换成特定艺术风格');
    return {
      intent: 'image-style-transfer',
      confidence: 0.9,
      params: extractParams(lowerMessage),
      reasoning: '检测到风格转换关键词（风格/转换/水彩/油画/卡通），判定为风格转换意图',
      reasoningSteps,
    };
  }

  // 图片识别相关
  if (lowerMessage.includes('识别') || lowerMessage.includes('分析') || lowerMessage.includes('描述') || lowerMessage.includes('这是什么') || lowerMessage.includes('recognize') || lowerMessage.includes('analyze') || lowerMessage.includes('describe')) {
    reasoningSteps.push(`检测到分析类关键词：${lowerMessage.includes('识别') ? '识别' : ''} ${lowerMessage.includes('分析') ? '分析' : ''} ${lowerMessage.includes('描述') ? '描述' : ''}`);
    reasoningSteps.push('用户希望了解图片的内容');
    return {
      intent: 'image-recognition',
      confidence: 0.9,
      params: extractParams(lowerMessage),
      reasoning: '检测到图片分析关键词（识别/分析/描述），判定为图片识别意图',
      reasoningSteps,
    };
  }

  // 图片生成相关
  if (lowerMessage.includes('图') || lowerMessage.includes('画') || lowerMessage.includes('生成') || lowerMessage.includes('image') || lowerMessage.includes('picture') || lowerMessage.includes('generate')) {
    reasoningSteps.push(`检测到生成类关键词：${lowerMessage.includes('图') ? '图' : ''} ${lowerMessage.includes('画') ? '画' : ''} ${lowerMessage.includes('生成') ? '生成' : ''}`);
    reasoningSteps.push('用户希望创建新的图片');
    return {
      intent: 'image-generation',
      confidence: 0.8,
      params: extractParams(lowerMessage),
      reasoning: '检测到图片生成关键词（图/画/生成），判定为图片生成意图',
      reasoningSteps,
    };
  }

  // 品牌文案相关
  if (lowerMessage.includes('品牌') || lowerMessage.includes('brand')) {
    reasoningSteps.push(`检测到品牌相关关键词：${lowerMessage.includes('品牌') ? '品牌' : ''}`);
    reasoningSteps.push('用户需要与品牌相关的文字内容');
    return {
      intent: 'brand-copy',
      confidence: 0.85,
      params: extractParams(lowerMessage),
      reasoning: '检测到品牌关键词，判定为品牌文案意图',
      reasoningSteps,
    };
  }

  // 营销文案相关（支持中英文）
  if (lowerMessage.includes('营销') || lowerMessage.includes('推广') || lowerMessage.includes('marketing') || lowerMessage.includes('promotion') || lowerMessage.includes('advertising')) {
    reasoningSteps.push(`检测到营销推广关键词：${lowerMessage.includes('营销') ? '营销' : ''} ${lowerMessage.includes('推广') ? '推广' : ''}`);
    reasoningSteps.push('用户需要用于推广宣传的文案');
    return {
      intent: 'marketing-copy',
      confidence: 0.85,
      params: extractParams(lowerMessage),
      reasoning: '检测到营销推广关键词，判定为营销文案意图',
      reasoningSteps,
    };
  }

  // 社交媒体文案（支持中英文）
  if (lowerMessage.includes('朋友圈') || lowerMessage.includes('微博') || lowerMessage.includes('小红书') || lowerMessage.includes('抖音') || lowerMessage.includes('微信') || lowerMessage.includes('weibo') || lowerMessage.includes('xiaohongshu') || lowerMessage.includes('tiktok') || lowerMessage.includes('instagram') || lowerMessage.includes('facebook') || lowerMessage.includes('twitter') || lowerMessage.includes('social media')) {
    reasoningSteps.push(`检测到社交媒体平台关键词：朋友圈/微博/小红书/抖音等`);
    reasoningSteps.push('用户需要发布在特定社交平台的内容');
    return {
      intent: 'social-copy',
      confidence: 0.9,
      params: extractParams(lowerMessage),
      reasoning: '检测到社交媒体平台关键词，判定为社媒文案意图',
      reasoningSteps,
    };
  }

  // 文案生成相关（支持中英文）
  if (lowerMessage.includes('文案') || lowerMessage.includes('文字') || lowerMessage.includes('写') || lowerMessage.includes('copy') || lowerMessage.includes('writing') || lowerMessage.includes('content')) {
    reasoningSteps.push(`检测到文字创作关键词：${lowerMessage.includes('文案') ? '文案' : ''} ${lowerMessage.includes('写') ? '写' : ''}`);
    reasoningSteps.push('用户需要创作文字内容');
    return {
      intent: 'text-generation',
      confidence: 0.8,
      params: extractParams(lowerMessage),
      reasoning: '检测到文字创作关键词（文案/写），判定为文案生成意图',
      reasoningSteps,
    };
  }

  // 配色方案相关（支持中英文）
  if (lowerMessage.includes('配色') || lowerMessage.includes('颜色') || lowerMessage.includes('色彩') || lowerMessage.includes('color') || lowerMessage.includes('colour') || lowerMessage.includes('palette')) {
    reasoningSteps.push(`检测到配色相关关键词：${lowerMessage.includes('配色') ? '配色' : ''} ${lowerMessage.includes('颜色') ? '颜色' : ''} ${lowerMessage.includes('色彩') ? '色彩' : ''}`);
    reasoningSteps.push('用户需要颜色搭配方案');
    return {
      intent: 'color-scheme',
      confidence: 0.9,
      params: extractParams(lowerMessage),
      reasoning: '检测到配色相关关键词，判定为配色方案意图',
      reasoningSteps,
    };
  }

  // 创意相关（支持中英文）
  if (lowerMessage.includes('创意') || lowerMessage.includes('点子') || lowerMessage.includes('想法') || lowerMessage.includes('方案') || lowerMessage.includes('creative') || lowerMessage.includes('idea') || lowerMessage.includes('brainstorm')) {
    reasoningSteps.push(`检测到创意类关键词：${lowerMessage.includes('创意') ? '创意' : ''} ${lowerMessage.includes('点子') ? '点子' : ''} ${lowerMessage.includes('想法') ? '想法' : ''}`);
    reasoningSteps.push('用户需要创意想法或方案');
    return {
      intent: 'creative-idea',
      confidence: 0.85,
      params: extractParams(lowerMessage),
      reasoning: '检测到创意类关键词（创意/点子/想法），判定为创意点子意图',
      reasoningSteps,
    };
  }

  // 视频脚本相关（支持中英文）
  if (lowerMessage.includes('视频') || lowerMessage.includes('脚本') || lowerMessage.includes('分镜') || lowerMessage.includes('拍摄') || lowerMessage.includes('video') || lowerMessage.includes('script') || lowerMessage.includes('storyboard')) {
    reasoningSteps.push(`检测到视频制作关键词：${lowerMessage.includes('视频') ? '视频' : ''} ${lowerMessage.includes('脚本') ? '脚本' : ''} ${lowerMessage.includes('分镜') ? '分镜' : ''}`);
    reasoningSteps.push('用户需要视频相关的脚本或策划');
    return {
      intent: 'video-script',
      confidence: 0.9,
      params: extractParams(lowerMessage),
      reasoning: '检测到视频制作关键词（视频/脚本/分镜），判定为视频脚本意图',
      reasoningSteps,
    };
  }

  // 活动策划相关（支持中英文）
  if (lowerMessage.includes('活动') || lowerMessage.includes('策划') || lowerMessage.includes('举办') || lowerMessage.includes('会议') || lowerMessage.includes('event') || lowerMessage.includes('planning') || lowerMessage.includes('organize')) {
    reasoningSteps.push(`检测到活动策划关键词：${lowerMessage.includes('活动') ? '活动' : ''} ${lowerMessage.includes('策划') ? '策划' : ''} ${lowerMessage.includes('举办') ? '举办' : ''}`);
    reasoningSteps.push('用户需要策划或组织活动');
    return {
      intent: 'event-planning',
      confidence: 0.9,
      params: extractParams(lowerMessage),
      reasoning: '检测到活动策划关键词，判定为活动策划意图',
      reasoningSteps,
    };
  }

  // UI设计相关（支持中英文）
  if (lowerMessage.includes('界面') || lowerMessage.includes('app') || lowerMessage.includes('网页') || lowerMessage.includes('小程序') || lowerMessage.includes('交互') || lowerMessage.includes('ui') || lowerMessage.includes('interface') || lowerMessage.includes('dashboard')) {
    reasoningSteps.push(`检测到界面设计关键词：${lowerMessage.includes('界面') ? '界面' : ''} ${lowerMessage.includes('app') ? 'APP' : ''} ${lowerMessage.includes('网页') ? '网页' : ''} ${lowerMessage.includes('小程序') ? '小程序' : ''}`);
    reasoningSteps.push('用户需要界面或产品设计');
    return {
      intent: 'ui-design',
      confidence: 0.9,
      params: extractParams(lowerMessage),
      reasoning: '检测到界面设计关键词（界面/APP/网页/小程序），判定为 UI 设计意图',
      reasoningSteps,
    };
  }

  // 数据分析报告相关（支持中英文）
  if (lowerMessage.includes('数据') || lowerMessage.includes('分析') || lowerMessage.includes('报告') || lowerMessage.includes('周报') || lowerMessage.includes('月报') || lowerMessage.includes('统计') || lowerMessage.includes('data') || lowerMessage.includes('report') || lowerMessage.includes('analytics')) {
    reasoningSteps.push(`检测到数据报告关键词：${lowerMessage.includes('数据') ? '数据' : ''} ${lowerMessage.includes('报告') ? '报告' : ''} ${lowerMessage.includes('周报') ? '周报/月报' : ''}`);
    reasoningSteps.push('用户需要数据汇总或分析报告');
    return {
      intent: 'data-report',
      confidence: 0.9,
      params: extractParams(lowerMessage),
      reasoning: '检测到数据报告关键词（数据/报告/周报/月报），判定为数据分析报告意图',
      reasoningSteps,
    };
  }

  // 确认意图检测 - 优先级最高，放在最前面
  if (isConfirmationIntent(message)) {
    reasoningSteps.push('检测到确认词汇：好的/确认/是/可以/OK等');
    reasoningSteps.push('用户确认执行当前任务');
    return {
      intent: 'confirmation',
      confidence: 0.95,
      params: {},
      reasoning: '检测到确认词汇，判定为确认意图',
      reasoningSteps,
    };
  }

  // 拒绝意图检测 - 优先级最高
  if (isRejectionIntent(message)) {
    reasoningSteps.push('检测到拒绝词汇：不/不要/算了/取消等');
    reasoningSteps.push('用户拒绝或取消当前任务');
    return {
      intent: 'rejection',
      confidence: 0.95,
      params: {},
      reasoning: '检测到拒绝词汇，判定为拒绝意图',
      reasoningSteps,
    };
  }

  // 联网搜索相关（支持中英文）- 优先级较高，放在问候和帮助之前
  if (lowerMessage.includes('搜索') || lowerMessage.includes('查') || lowerMessage.includes('找资料') ||
      lowerMessage.includes('网上') || lowerMessage.includes('最新') || lowerMessage.includes('新闻') ||
      lowerMessage.includes('资讯') || lowerMessage.includes('search') || lowerMessage.includes('lookup') ||
      lowerMessage.includes('百度') || lowerMessage.includes('谷歌') || lowerMessage.includes('google')) {
    // 排除已经处理过的特定意图
    const isSpecificIntent = lowerMessage.includes('logo') || lowerMessage.includes('海报') ||
                             lowerMessage.includes('文案') || lowerMessage.includes('设计');
    if (!isSpecificIntent) {
      reasoningSteps.push(`检测到联网搜索关键词：${lowerMessage.includes('搜索') ? '搜索' : ''} ${lowerMessage.includes('查') ? '查' : ''} ${lowerMessage.includes('最新') ? '最新' : ''}`);
      reasoningSteps.push('用户希望搜索网络信息或查资料');
      return {
        intent: 'web-search',
        confidence: 0.9,
        params: { query: message },
        reasoning: '检测到联网搜索关键词（搜索/查/最新/新闻），判定为联网搜索意图',
        reasoningSteps,
      };
    }
  }

  // 问候相关（支持中英文）- 放在确认/拒绝检测之后
  if (lowerMessage.includes('你好') || lowerMessage.includes('您好') || lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.includes('greetings')) {
    reasoningSteps.push(`检测到问候语：${lowerMessage.includes('你好') ? '你好' : ''} ${lowerMessage.includes('hello') ? 'hello' : ''}`);
    reasoningSteps.push('这是一个打招呼的问候');
    return {
      intent: 'greeting',
      confidence: 0.9,
      params: {},
      reasoning: '检测到问候语，判定为问候意图',
      reasoningSteps,
    };
  }

  // 帮助相关（支持中英文）
  if (lowerMessage.includes('帮助') || lowerMessage.includes('怎么用') || lowerMessage.includes('功能') ||
      lowerMessage.includes('help') || lowerMessage.includes('how to') || lowerMessage.includes('what can') ||
      lowerMessage.includes('查资料') || lowerMessage.includes('搜索') || lowerMessage.includes('查找') ||
      lowerMessage.includes('找资料') || lowerMessage.includes('能做什么') || lowerMessage.includes('有什么功能')) {
    reasoningSteps.push(`检测到帮助类关键词：${lowerMessage.includes('帮助') ? '帮助' : ''} ${lowerMessage.includes('功能') ? '功能' : ''} ${lowerMessage.includes('查资料') ? '查资料' : ''}`);
    reasoningSteps.push('用户想了解功能或寻求帮助');
    return {
      intent: 'help',
      confidence: 0.85,
      params: {},
      reasoning: '检测到帮助类关键词，判定为帮助意图',
      reasoningSteps,
    };
  }

  // 默认一般对话
  reasoningSteps.push('未匹配到任何特定关键词');
  reasoningSteps.push('将其归类为一般对话');
  return {
    intent: 'general',
    confidence: 0.6,
    params: extractParams(lowerMessage),
    reasoning: '未检测到特定意图关键词，判定为一般对话',
    reasoningSteps,
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
    'logo-design': 'Logo 设计',
    'poster-design': '海报设计',
    'text-generation': '文案生成',
    'brand-copy': '品牌文案',
    'marketing-copy': '营销文案',
    'social-copy': '社媒文案',
    'color-scheme': '配色方案',
    'creative-idea': '创意点子',
    'image-beautification': '图片美化',
    'image-style-transfer': '风格转换',
    'image-recognition': '图片识别',
    'image-editing': '图片编辑',
    'video-script': '视频脚本',
    'event-planning': '活动策划',
    'ui-design': 'UI 设计',
    'data-report': '数据分析报告',
    'web-search': '联网搜索',
    'batch-generation': '批量生成',
    'compound-generation': '复合任务',
    'refinement': '优化迭代',
    'general': '一般对话',
    'greeting': '问候',
    'help': '帮助',
    'confirmation': '确认',
    'rejection': '拒绝',
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
    'image-beautification': 'from-pink-500 to-rose-500',
    'image-style-transfer': 'from-purple-500 to-indigo-500',
    'image-recognition': 'from-blue-500 to-cyan-500',
    'image-editing': 'from-violet-500 to-purple-500',
    'video-script': 'from-red-600 to-orange-500',
    'event-planning': 'from-emerald-500 to-green-500',
    'ui-design': 'from-violet-500 to-purple-500',
    'data-report': 'from-sky-500 to-blue-500',
    'web-search': 'from-blue-600 to-cyan-400',
    'batch-generation': 'from-teal-500 to-cyan-500',
    'compound-generation': 'from-amber-500 to-orange-500',
    'refinement': 'from-rose-500 to-pink-500',
    'general': 'from-gray-500 to-gray-600',
    'greeting': 'from-green-500 to-teal-500',
    'help': 'from-blue-500 to-indigo-500',
    'confirmation': 'from-emerald-500 to-green-500',
    'rejection': 'from-red-500 to-orange-500',
  };

  return colors[intent] || 'from-gray-500 to-gray-600';
};

export default {
  recognizeIntent,
  getIntentDisplayName,
  getIntentColor,
};
