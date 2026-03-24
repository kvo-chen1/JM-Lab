import type { IntentType } from './intentService';

// 智能推断结果
export interface InferredInfo {
  key: string;
  value: string;
  confidence: number;
  reasoning: string;
  source: 'keyword' | 'context' | 'industry-knowledge';
}

// 行业知识推断规则
interface IndustryInferenceRule {
  keywords: string[];
  inferences: Record<string, string>;
}

// 周边类型推断规则
interface MerchandiseInferenceRule {
  keywords: string[];
  merchandiseTypes: string[];
}

// 品牌名识别规则
interface BrandNamePattern {
  pattern: RegExp;
  confidence: number;
  reasoning: string;
}

// 行业关键词规则
interface IndustryKeywordRule {
  keywords: string[];
  industry: string;
}

// 品牌名识别规则
const BRAND_NAME_PATTERNS: BrandNamePattern[] = [
  // 包含"品牌"、"公司"等关键词
  { pattern: /(品牌 | 公司 | 产品|叫|做|为|给)/, confidence: 0.9, reasoning: '包含品牌相关关键词' },
  // 单个词，2-4 个字，可能是品牌名
  { pattern: /^[\u4e00-\u9fa5]{2,4}$/, confidence: 0.7, reasoning: '简短的中文词，可能是品牌名' },
  // 英文单词或缩写（大写字母组合）
  { pattern: /^[A-Z]{2,10}$/, confidence: 0.8, reasoning: '大写字母组合，可能是品牌缩写' },
  // 引号中的内容
  { pattern: /[""]([^"""]+)["]/, confidence: 0.95, reasoning: '引号中的内容，很可能是品牌名' },
];

// 行业关键词规则
const INDUSTRY_KEYWORDS: IndustryKeywordRule[] = [
  { keywords: ['科技', '互联网', 'AI', '智能', '软件', '数码'], industry: '科技' },
  { keywords: ['环保', '绿色', '生态', '自然', '可持续'], industry: '环保' },
  { keywords: ['时尚', '服装', '美妆', '奢侈品', '潮流'], industry: '时尚' },
  { keywords: ['餐饮', '美食', '咖啡', '餐厅', '食品'], industry: '餐饮' },
  { keywords: ['教育', '学校', '培训', '学习', '课程'], industry: '教育' },
  { keywords: ['医疗', '健康', '医院', '药品'], industry: '医疗' },
  { keywords: ['金融', '银行', '投资', '理财'], industry: '金融' },
];

// 各行业的智能推断规则
const INDUSTRY_INFERENCES: Record<string, IndustryInferenceRule[]> = {
  'logo-design': [
    {
      keywords: ['科技', '互联网', 'AI', '智能', '软件'],
      inferences: {
        style: '简约现代，带有科技感',
        colorTone: '蓝色系、冷色调，体现专业和创新',
        industry: '科技/互联网',
      },
    },
    {
      keywords: ['餐饮', '美食', '咖啡', '餐厅'],
      inferences: {
        style: '温馨亲切，可能有手绘元素',
        colorTone: '暖色调，如橙色、红色、棕色',
        industry: '餐饮',
      },
    },
    {
      keywords: ['教育', '学校', '培训', '学习'],
      inferences: {
        style: '专业可信，简洁明了',
        colorTone: '蓝色、绿色，体现成长和信任',
        industry: '教育',
      },
    },
    {
      keywords: ['环保', '绿色', '生态', '自然'],
      inferences: {
        style: '自然生态，可能使用植物元素',
        colorTone: '绿色系，体现环保理念',
        industry: '环保',
      },
    },
    {
      keywords: ['时尚', '服装', '美妆', '奢侈品'],
      inferences: {
        style: '高端奢华，简约精致',
        colorTone: '黑白色、金色、玫瑰金',
        industry: '时尚/奢侈品',
      },
    },
  ],
  'poster-design': [
    {
      keywords: ['活动', '发布会', '展览'],
      inferences: {
        style: '简约大气，视觉冲击力强',
        size: '手机海报 (9:16) 或 A3',
      },
    },
    {
      keywords: ['促销', '优惠', '打折'],
      inferences: {
        style: '活泼醒目，突出价格信息',
        colorTone: '红色、橙色等暖色调',
      },
    },
  ],
  'color-scheme': [
    {
      keywords: ['科技', '互联网'],
      inferences: {
        baseColor: '蓝色系 (#0066FF, #1890FF)',
        emotion: '专业可信，科技感',
      },
    },
    {
      keywords: ['餐饮', '美食'],
      inferences: {
        baseColor: '橙色、红色系',
        emotion: '温馨舒适，促进食欲',
      },
    },
    {
      keywords: ['医疗', '健康'],
      inferences: {
        baseColor: '蓝色、绿色系',
        emotion: '专业可信，安心',
      },
    },
    {
      keywords: ['儿童', '教育'],
      inferences: {
        baseColor: '多彩配色',
        emotion: '活力青春，活泼',
      },
    },
  ],
};

// 周边类型智能推断规则
const MERCHANDISE_INFERENCES: MerchandiseInferenceRule[] = [
  {
    keywords: ['文具', '办公', '商务', '名片', '信纸'],
    merchandiseTypes: ['商务文具'],
  },
  {
    keywords: ['衣服', '服装', 'T 恤', '帽子', '服饰', '穿搭'],
    merchandiseTypes: ['服饰周边'],
  },
  {
    keywords: ['包装', '盒子', '袋子', '礼盒', '手提袋'],
    merchandiseTypes: ['包装产品'],
  },
  {
    keywords: ['杯子', '水杯', '笔记本', '生活用品', '日常'],
    merchandiseTypes: ['生活用品'],
  },
  {
    keywords: ['店面', '招牌', '指示牌', '背景墙', '环境', '店铺'],
    merchandiseTypes: ['环境应用'],
  },
];

// 颜色推断
const COLOR_INFERENCES: Record<string, Partial<InferredInfo>> = {
  '蓝色': {
    value: '蓝色系 (#0066FF, #1890FF)',
    reasoning: '蓝色是科技、专业、信任的代表色',
  },
  '红色': {
    value: '红色系 (#FF0000, #E74C3C)',
    reasoning: '红色代表热情、活力、促销',
  },
  '绿色': {
    value: '绿色系 (#52C41A, #27AE60)',
    reasoning: '绿色象征自然、健康、成长',
  },
  '紫色': {
    value: '紫色系 (#722ED1, #8E44AD)',
    reasoning: '紫色代表优雅、神秘、创意',
  },
  '橙色': {
    value: '橙色系 (#FA8C16, #F39C12)',
    reasoning: '橙色体现活力、温暖、亲和',
  },
  '黑色': {
    value: '黑色系 (#000000, #333333)',
    reasoning: '黑色代表高端、简约、专业',
  },
  '白色': {
    value: '白色系 (#FFFFFF, #F5F5F5)',
    reasoning: '白色象征简洁、纯净、现代',
  },
};

// 风格推断
const STYLE_INFERENCES: Record<string, Partial<InferredInfo>> = {
  '简约': {
    value: '简约现代',
    reasoning: '简约风格适合大多数现代品牌',
  },
  '复古': {
    value: '复古经典',
    reasoning: '复古风格适合有历史感的品牌',
  },
  '可爱': {
    value: '可爱活泼',
    reasoning: '可爱风格适合面向年轻群体或儿童的品牌',
  },
  '高端': {
    value: '高端奢华',
    reasoning: '高端风格适合奢侈品或高端服务',
  },
};

/**
 * 智能推断缺失信息
 * 基于用户输入和已有信息进行推断
 */
export const inferMissingInfo = (
  intent: IntentType,
  collectedInfo: Record<string, string>,
  userMessage: string
): InferredInfo[] => {
  const inferences: InferredInfo[] = [];

  // 1. 基于行业关键词推断
  if (intent === 'logo-design' || intent === 'color-scheme') {
    const rules = INDUSTRY_INFERENCES[intent] || [];
    
    for (const rule of rules) {
      const matchedKeyword = rule.keywords.find(keyword =>
        userMessage.toLowerCase().includes(keyword.toLowerCase())
      );

      if (matchedKeyword) {
        // 找到匹配的行业关键词
        for (const [key, value] of Object.entries(rule.inferences)) {
          if (!collectedInfo[key]) {
            inferences.push({
              key,
              value,
              confidence: 0.8,
              reasoning: `根据您提到的"${matchedKeyword}"推断`,
              source: 'keyword',
            });
          }
        }
      }
    }
  }

  // 2. 颜色推断
  if (!collectedInfo['colorTone'] && !collectedInfo['colorPreference'] && !collectedInfo['baseColor']) {
    for (const [color, inference] of Object.entries(COLOR_INFERENCES)) {
      if (userMessage.includes(color)) {
        const targetKey = intent === 'logo-design' ? 'colorPreference' : 
                         intent === 'color-scheme' ? 'baseColor' : 'colorTone';
        
        inferences.push({
          key: targetKey,
          value: inference.value || color,
          confidence: 0.9,
          reasoning: inference.reasoning || '',
          source: 'keyword',
        });
      }
    }
  }

  // 3. 风格推断
  if (!collectedInfo['style']) {
    for (const [style, inference] of Object.entries(STYLE_INFERENCES)) {
      if (userMessage.includes(style)) {
        inferences.push({
          key: 'style',
          value: inference.value || style,
          confidence: 0.85,
          reasoning: inference.reasoning || '',
          source: 'keyword',
        });
      }
    }
  }

  // 4. 周边类型推断
  if (intent === 'logo-design' && !collectedInfo['merchandiseType']) {
    for (const rule of MERCHANDISE_INFERENCES) {
      const matchedKeyword = rule.keywords.find(keyword =>
        userMessage.toLowerCase().includes(keyword.toLowerCase())
      );

      if (matchedKeyword) {
        inferences.push({
          key: 'merchandiseType',
          value: rule.merchandiseTypes.join(','),
          confidence: 0.8,
          reasoning: `根据您提到的"${matchedKeyword}"推断`,
          source: 'keyword',
        });
      }
    }
  }

  // 5. 上下文推断（如果之前提到过）
  // TODO: 结合历史对话进行推断

  return inferences;
};

/**
 * 智能生成下一个问题
 * 基于已收集信息和用户风格动态生成
 */
export const generateNextQuestion = (
  intent: IntentType,
  collectedInfo: Record<string, string>,
  missingFields: Array<{ key: string; label: string; required: boolean }>,
  userMessage?: string
): {
  question: string;
  priority: 'high' | 'medium' | 'low';
  suggestions?: string[];
  inferred?: InferredInfo[];
} => {
  // 首先检查是否有智能推断
  if (userMessage) {
    const inferences = inferMissingInfo(intent, collectedInfo, userMessage);
    
    if (inferences.length > 0) {
      // 有推断信息，生成确认式问题
      const inferenceText = inferences.map(i => 
        `• ${getLabelForKey(i.key, intent)}: ${i.value}`
      ).join('\n');

      return {
        question: `我注意到您提到了一些信息，我理解您的需求是：\n\n${inferenceText}\n\n请问我的理解正确吗？或者您有其他想法？`,
        priority: 'high',
        suggestions: ['正确，就这样', '我想调整一下', '重新描述'],
        inferred: inferences,
      };
    }
  }

  // 没有推断，使用传统方式
  if (missingFields.length === 0) {
    return {
      question: '需求已收集完整，准备开始生成',
      priority: 'high',
      suggestions: ['开始生成', '再补充一些信息'],
    };
  }

  // 选择最重要的缺失字段
  const requiredFields = missingFields.filter(f => f.required);
  const optionalFields = missingFields.filter(f => !f.required);
  
  const nextField = requiredFields[0] || optionalFields[0];
  
  if (!nextField) {
    return {
      question: '需求已收集完整',
      priority: 'high',
      suggestions: ['开始生成'],
    };
  }

  // 生成智能问题
  const question = generateSmartQuestion(intent, nextField.key, collectedInfo);

  // 生成建议回复（传递 collectedInfo 以便动态生成更贴合的建议）
  const suggestions = generateSuggestions(intent, nextField.key, collectedInfo);

  return {
    question,
    priority: nextField.required ? 'high' : 'medium',
    suggestions,
  };
};

/**
 * 生成智能问题
 * 基于字段类型和上下文生成更自然的问题
 */
const generateSmartQuestion = (
  intent: IntentType,
  fieldKey: string,
  collectedInfo: Record<string, string>
): string => {
  // 基于已收集信息生成关联性问题
  const context = Object.entries(collectedInfo)
    .map(([k, v]) => `${getLabelForKey(k, intent)}: ${v}`)
    .join(', ');

  const questions: Record<string, string> = {
    // Logo 设计
    'brandName': context 
      ? `好的，了解了${collectedInfo['brandName'] || '您的品牌'}。接下来，品牌名称是什么呢？`
      : '首先，请告诉我品牌或公司的名称？',
    'brandConcept': '这个品牌有什么特别的理念或故事吗？这能帮助我设计更有意义的 Logo。',
    'merchandiseType': '您想要设计哪些类型的周边产品呢？我会为您推荐合适的设计方案。',
    'style': '您偏好什么风格？比如简约现代、复古经典、科技感等。',
    'colorPreference': '颜色方面有什么偏好吗？比如蓝色系代表专业，绿色系体现环保。',
    
    // 文案创作
    'topic': '这篇文案的主题是什么呢？比如新品发布、活动宣传等。',
    'targetAudience': '这篇文案是写给谁看的？了解受众能帮助我选择合适的语气。',
    'keyPoints': '有哪些核心卖点或关键信息需要突出强调？',
    'tone': '您希望文案是什么语气？专业严谨、亲切友好、还是幽默风趣？',
    
    // 配色方案
    'projectType': '这个配色方案用于什么项目呢？不同项目有不同的配色策略。',
    'emotion': '您想通过配色传达什么感觉？比如专业可信、活力青春、高端优雅等。',
    'baseColor': '有指定的主色吗？或者您偏好某个色系？',
  };

  return questions[fieldKey] || `请告诉我${getLabelForKey(fieldKey, intent)}？`;
};

/**
 * 生成建议回复选项
 * 根据已收集的信息动态生成更贴合的建议
 */
const generateSuggestions = (
  intent: IntentType,
  fieldKey: string,
  collectedInfo?: Record<string, string>
): string[] => {
  // 基础建议映射
  const suggestionsMap: Record<string, string[]> = {
    'style': ['简约现代', '科技感', '高端大气', '年轻活力'],
    'tone': ['专业严谨', '亲切友好', '幽默风趣', '简洁有力'],
    'emotion': ['专业可信', '活力青春', '高端优雅', '温馨舒适'],
    'merchandiseType': ['商务文具📇', '服饰周边👕', '包装产品📦', '生活用品☕'],
    'colorPreference': ['蓝色系', '绿色系', '红色系', '黑白色'],
  };

  // 基于已收集信息动态调整建议
  const contextSuggestions: Record<string, Record<string, string[]>> = {
    'style': {
      '科技': ['简约现代', '科技感', '赛博朋克', '极简几何'],
      '环保': ['自然生态', '绿色清新', '低碳环保'],
      '时尚': ['高端奢华', '精致优雅', '潮流前卫'],
      '餐饮': ['温馨亲切', '现代简约', '手绘风格'],
      '教育': ['专业可信', '活力青春', '简洁明了'],
      '儿童': ['可爱活泼', '卡通趣味', '色彩缤纷'],
    },
    'tone': {
      '专业': ['专业严谨', '简洁有力', '权威可信'],
      '亲切': ['亲切友好', '温暖感人', '轻松活泼'],
      '年轻': ['幽默风趣', '活力四射', '时尚潮流'],
    },
    'emotion': {
      '科技': ['专业可信', '科技感', '未来感'],
      '环保': ['自然清新', '健康活力', '舒适放松'],
      '高端': ['高端优雅', '尊贵奢华', '精致品质'],
    },
    'colorPreference': {
      '科技': ['蓝色系', '紫色系', '黑白色'],
      '环保': ['绿色系', '蓝绿色', '自然色'],
      '时尚': ['玫瑰金', '黑白色', '金色系'],
      '餐饮': ['橙色系', '红色系', '暖色调'],
      '儿童': ['多彩配色', '粉色系', '明亮色'],
    },
  };

  let suggestions = suggestionsMap[fieldKey] || [];

  // 根据行业关键词调整建议
  if (collectedInfo && (fieldKey === 'style' || fieldKey === 'tone' || fieldKey === 'emotion' || fieldKey === 'colorPreference')) {
    const contextMap = contextSuggestions[fieldKey];
    if (contextMap) {
      for (const [keyword, keywordsSuggestions] of Object.entries(contextMap)) {
        // 检查是否提到了相关行业关键词
        const industryKeywords: Record<string, string[]> = {
          '科技': ['科技', '互联网', 'AI', '智能', '软件', '数码'],
          '环保': ['环保', '绿色', '生态', '自然', '可持续'],
          '时尚': ['时尚', '服装', '美妆', '奢侈品', '潮流'],
          '餐饮': ['餐饮', '美食', '咖啡', '餐厅', '食品'],
          '教育': ['教育', '学校', '培训', '学习', '课程'],
          '儿童': ['儿童', '小孩', '宝贝', '亲子', '早教'],
          '高端': ['高端', '奢华', '尊贵', '精品'],
        };

        const industryKws = industryKeywords[keyword] || [];
        const collectedText = Object.values(collectedInfo).join('');

        if (industryKws.some(kw => collectedText.includes(kw))) {
          // 合并建议，优先使用行业相关的建议
          suggestions = [...keywordsSuggestions, ...suggestions.filter(s => !keywordsSuggestions.includes(s))];
          break;
        }
      }
    }
  }

  return suggestions;
};

/**
 * 获取字段的显示标签
 */
const getLabelForKey = (key: string, intent: IntentType): string => {
  const labels: Record<string, string> = {
    'brandName': '品牌名称',
    'brandConcept': '品牌理念',
    'merchandiseType': '周边类型',
    'style': '风格偏好',
    'colorPreference': '颜色偏好',
    'colorTone': '色调',
    'baseColor': '基础色',
    'emotion': '情感氛围',
    'topic': '主题',
    'targetAudience': '目标受众',
    'keyPoints': '核心卖点',
    'tone': '语气风格',
    'projectType': '项目类型',
  };

  return labels[key] || key;
};

/**
 * 检查用户输入是否包含简短回复
 * 如"蓝色"、"简约"等，触发智能推断
 */
export const isShortReply = (message: string): boolean => {
  const trimmed = message.trim();
  // 少于 10 个字的回复认为是简短回复
  return trimmed.length <= 10 && !trimmed.includes('，') && !trimmed.includes('。');
};

/**
 * 提取用户回复中的关键信息
 */
export const extractKeywords = (message: string): {
  colors: string[];
  styles: string[];
  industries: string[];
  emotions: string[];
} => {
  const lowerMessage = message.toLowerCase();
  
  const colors = Object.keys(COLOR_INFERENCES).filter(color => 
    message.includes(color)
  );
  
  const styles = Object.keys(STYLE_INFERENCES).filter(style => 
    lowerMessage.includes(style)
  );
  
  const industries: string[] = [];
  const allIndustryKeywords = Object.values(INDUSTRY_INFERENCES)
    .flat()
    .flatMap(rule => rule.keywords);
  
  industries.push(...allIndustryKeywords.filter(keyword =>
    lowerMessage.includes(keyword.toLowerCase())
  ));
  
  return {
    colors,
    styles,
    industries,
    emotions: [], // TODO: 情感关键词
  };
};

/**
 * 识别品牌名
 */
export const extractBrandName = (message: string): InferredInfo | null => {
  // 尝试匹配引号中的内容（优先级最高）
  const quoteMatch = message.match(/[""']([^""']+)[""']/);
  if (quoteMatch && quoteMatch[1].trim()) {
    const brandName = quoteMatch[1].trim();
    // 排除一些通用词汇
    if (!['这个', '那个', '什么', '如何', '怎么'].includes(brandName)) {
      return {
        key: 'brandName',
        value: brandName,
        confidence: 0.95,
        reasoning: '从引号中提取',
        source: 'context',
      };
    }
  }
  
  // 尝试匹配品牌名模式
  for (const pattern of BRAND_NAME_PATTERNS) {
    if (pattern.pattern.test(message)) {
      // 提取匹配的内容
      const match = message.match(pattern.pattern);
      if (match) {
        let brandName = match[1] || match[0];
        brandName = brandName.trim();
        
        // 排除一些通用词汇
        if (brandName && !['品牌', '公司', '产品', '这个', '那个'].includes(brandName)) {
          return {
            key: 'brandName',
            value: brandName,
            confidence: pattern.confidence,
            reasoning: pattern.reasoning,
            source: 'context',
          };
        }
      }
    }
  }
  
  return null;
};

/**
 * 识别行业类型
 */
export const identifyIndustry = (message: string): string | null => {
  for (const rule of INDUSTRY_KEYWORDS) {
    const matchedKeyword = rule.keywords.find(keyword =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (matchedKeyword) {
      return rule.industry;
    }
  }
  
  return null;
};

/**
 * 基于品牌理念推荐周边类型
 */
export const recommendMerchandiseTypes = (brandConcept: string): string[] => {
  const MERCHANDISE_RECOMMENDATIONS: Record<string, string[]> = {
    '科技': ['商务文具', '生活用品', '环境应用'],
    '环保': ['生活用品', '服饰周边', '包装产品'],
    '时尚': ['服饰周边', '生活用品', '包装产品'],
    '餐饮': ['包装产品', '生活用品'],
    '教育': ['商务文具', '生活用品', '服饰周边'],
    '医疗': ['商务文具', '生活用品'],
    '金融': ['商务文具', '生活用品', '环境应用'],
  };
  
  const keywordResult = extractKeywords(brandConcept);
  
  // 将所有关键词合并为一个数组
  const allKeywords = [
    ...keywordResult.industries,
    ...keywordResult.styles,
    ...keywordResult.emotions
  ];
  
  // 匹配推荐规则
  for (const [industry, types] of Object.entries(MERCHANDISE_RECOMMENDATIONS)) {
    const industryKeywords = INDUSTRY_KEYWORDS.find(r => r.industry === industry)?.keywords || [];
    if (allKeywords.some(keyword => industryKeywords.includes(keyword))) {
      return types;
    }
  }
  
  // 默认推荐
  return ['商务文具', '生活用品', '包装产品'];
};

export default {
  inferMissingInfo,
  generateNextQuestion,
  isShortReply,
  extractKeywords,
  extractBrandName,
  identifyIndustry,
  recommendMerchandiseTypes,
};
