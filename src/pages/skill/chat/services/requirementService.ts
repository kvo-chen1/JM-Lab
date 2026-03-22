import { callQwenChat } from '@/services/llm/chatProviders';
import type { IntentType } from './intentService';
import { 
  inferMissingInfo, 
  generateNextQuestion as generateSmartQuestion,
  isShortReply,
  extractKeywords,
  extractBrandName,
  identifyIndustry,
  recommendMerchandiseTypes,
} from './smartInference';

// 周边产品分类
export interface MerchandiseCategory {
  id: string;
  name: string;
  icon: string;
  items: string[];
}

// 需求字段定义
export interface RequirementField {
  key: string;
  label: string;
  description: string;
  required: boolean;
  type: 'text' | 'select' | 'multiselect' | 'textarea';
  options?: string[];
  placeholder?: string;
  categories?: MerchandiseCategory[];
}

// 需求分析结果
export interface RequirementAnalysis {
  ready: boolean;                    // 是否可以直接执行
  collectedInfo: Record<string, string>;  // 已收集的信息
  missingFields: RequirementField[]; // 缺失的字段
  summary: string;                   // 当前理解的需求摘要
  nextQuestion?: string;             // 下一个问题
  suggestions?: string[];            // 建议的回复
}

// 各意图类型的需求字段定义
const INTENT_REQUIREMENTS: Record<IntentType, RequirementField[]> = {
  'image-generation': [
    { key: 'subject', label: '主题内容', description: '图片的主体内容是什么', required: true, type: 'textarea', placeholder: '例如：一只可爱的猫咪在草地上玩耍' },
    { key: 'style', label: '风格', description: '期望的艺术风格', required: false, type: 'select', options: ['写实', '卡通', '油画', '水彩', '像素风', '赛博朋克', '国风', '简约'] },
    { key: 'mood', label: '氛围', description: '图片的情感氛围', required: false, type: 'select', options: ['温馨', '科技感', '梦幻', '严肃', '活泼', '神秘'] },
    { key: 'colorTone', label: '色调', description: '主色调偏好', required: false, type: 'text', placeholder: '例如：暖色调、冷色调、明亮、暗沉' },
  ],
  'logo-design': [
    { key: 'brandName', label: '品牌名称', description: '品牌或公司的名称', required: true, type: 'text', placeholder: '例如：绿野科技' },
    { key: 'brandConcept', label: '品牌理念', description: '品牌的核心理念或定位', required: true, type: 'textarea', placeholder: '例如：专注环保科技，倡导绿色生活' },
    { 
      key: 'merchandiseType', 
      label: '周边类型', 
      description: '您想要设计哪些类型的周边产品？', 
      required: true, 
      type: 'multiselect',
      options: ['商务文具', '服饰周边', '包装产品', '生活用品', '环境应用'],
      categories: [
        { id: 'stationery', name: '商务文具', icon: '📇', items: ['名片', '信纸', '信封', '文件夹'] },
        { id: 'apparel', name: '服饰周边', icon: '👕', items: ['T 恤', 'POLO 衫', '帽子', '帆布袋', '徽章'] },
        { id: 'packaging', name: '包装产品', icon: '📦', items: ['包装盒', '手提袋', '礼盒', '贴纸', '标签'] },
        { id: 'lifestyle', name: '生活用品', icon: '☕', items: ['马克杯', '笔记本', '日历', '文具套装'] },
        { id: 'environment', name: '环境应用', icon: '🏪', items: ['店面招牌', '指示牌', '背景墙', '灯箱', '横幅'] }
      ]
    },
    { key: 'style', label: '风格偏好', description: 'Logo 的风格', required: false, type: 'select', options: ['简约现代', '复古经典', '科技感', '可爱活泼', '高端奢华', '自然生态'] },
    { key: 'colorPreference', label: '颜色偏好', description: '期望的主色调', required: false, type: 'text', placeholder: '例如：绿色、蓝色，或具体色值' },
    { key: 'application', label: '应用场景', description: 'Logo 主要用在哪里', required: false, type: 'multiselect', options: ['网站', 'APP 图标', '名片', '产品包装', '宣传海报', '社交媒体'] },
  ],
  'poster-design': [
    { key: 'purpose', label: '海报目的', description: '这张海报的用途', required: true, type: 'select', options: ['活动宣传', '产品推广', '品牌宣传', '招聘', '节日祝福', '通知公告'] },
    { key: 'title', label: '主标题', description: '海报的主要标题', required: true, type: 'text', placeholder: '例如：春季新品发布会' },
    { key: 'content', label: '主要内容', description: '需要展示的关键信息', required: true, type: 'textarea', placeholder: '例如：时间、地点、活动亮点等' },
    { key: 'targetAudience', label: '目标受众', description: '面向的人群', required: false, type: 'text', placeholder: '例如：年轻人、商务人士、家长' },
    { key: 'style', label: '风格', description: '设计风格', required: false, type: 'select', options: ['简约大气', '活泼可爱', '科技感', '复古风', '商务正式', '艺术创意'] },
    { key: 'size', label: '尺寸规格', description: '海报尺寸', required: false, type: 'select', options: ['A4', 'A3', '手机海报(9:16)', '微信朋友圈(1:1)', '公众号首图(2.35:1)', '自定义'] },
  ],
  'text-generation': [
    { key: 'type', label: '文案类型', description: '需要什么类型的文案', required: true, type: 'select', options: ['品牌故事', '产品介绍', '广告语', '软文', '邮件', '演讲稿'] },
    { key: 'topic', label: '主题', description: '文案的核心主题', required: true, type: 'text', placeholder: '例如：新品智能手表发布' },
    { key: 'targetAudience', label: '目标受众', description: '面向的读者群体', required: true, type: 'text', placeholder: '例如：25-35岁职场人士' },
    { key: 'keyPoints', label: '核心卖点', description: '需要突出的关键信息', required: true, type: 'textarea', placeholder: '例如：超长续航、健康监测、时尚外观' },
    { key: 'tone', label: '语气风格', description: '文案的语气', required: false, type: 'select', options: ['专业严谨', '亲切友好', '幽默风趣', '激情澎湃', '温暖感人', '简洁有力'] },
    { key: 'length', label: '字数要求', description: '期望的文案长度', required: false, type: 'select', options: ['简短(100字内)', '适中(300字左右)', '详细(500字以上)', '不限'] },
  ],
  'brand-copy': [
    { key: 'brandName', label: '品牌名称', description: '品牌名称', required: true, type: 'text', placeholder: '例如：绿野科技' },
    { key: 'brandPosition', label: '品牌定位', description: '品牌在市场中的定位', required: true, type: 'textarea', placeholder: '例如：高端环保科技品牌' },
    { key: 'values', label: '品牌价值观', description: '品牌的核心价值观', required: true, type: 'textarea', placeholder: '例如：创新、环保、品质' },
    { key: 'targetAudience', label: '目标受众', description: '目标客户群体', required: true, type: 'text', placeholder: '例如：注重环保的中高端消费者' },
    { key: 'usage', label: '使用场景', description: '文案将用在哪里', required: false, type: 'multiselect', options: ['官网', '宣传册', '广告', '社交媒体', '视频脚本', '演讲'] },
  ],
  'marketing-copy': [
    { key: 'product', label: '产品/服务', description: '要推广的产品或服务', required: true, type: 'text', placeholder: '例如：智能空气净化器' },
    { key: 'sellingPoints', label: '核心卖点', description: '最吸引人的特点', required: true, type: 'textarea', placeholder: '例如：99%除菌率、静音设计、智能控制' },
    { key: 'promotion', label: '促销信息', description: '当前的优惠活动', required: false, type: 'text', placeholder: '例如：限时8折、买一送一' },
    { key: 'targetAudience', label: '目标人群', description: '面向的消费者', required: true, type: 'text', placeholder: '例如：有宝宝的家庭' },
    { key: 'platform', label: '投放平台', description: '将在哪些渠道使用', required: false, type: 'multiselect', options: ['微信朋友圈', '微博', '抖音', '小红书', '淘宝', '京东', '线下海报'] },
    { key: 'tone', label: '语气风格', description: '文案调性', required: false, type: 'select', options: ['促销感强', '软性植入', '专业可信', '情感共鸣', '幽默搞笑'] },
  ],
  'social-copy': [
    { key: 'platform', label: '平台', description: '发布到哪个平台', required: true, type: 'select', options: ['微信朋友圈', '微博', '小红书', '抖音', 'B站', '知乎'] },
    { key: 'topic', label: '话题内容', description: '要分享的内容主题', required: true, type: 'textarea', placeholder: '例如：今天尝试了新开的咖啡店...' },
    { key: 'purpose', label: '目的', description: '发布的目的', required: true, type: 'select', options: ['分享生活', '推荐好物', '表达观点', '求助提问', '宣传引流'] },
    { key: 'style', label: '风格', description: '文案风格', required: false, type: 'select', options: ['日常口语', '文艺清新', '专业干货', '幽默搞笑', '情感走心'] },
    { key: 'emoji', label: '使用表情', description: '是否需要表情符号', required: false, type: 'select', options: ['多用', '适量', '不用'] },
  ],
  'color-scheme': [
    { key: 'projectType', label: '项目类型', description: '配色用于什么项目', required: true, type: 'select', options: ['品牌VI', '网站/APP', '海报设计', '产品包装', '室内设计', '服装搭配'] },
    { key: 'emotion', label: '情感氛围', description: '想要传达的感觉', required: true, type: 'select', options: ['专业可信', '活力青春', '高端优雅', '温馨舒适', '科技感', '自然清新'] },
    { key: 'industry', label: '行业', description: '所属行业', required: false, type: 'select', options: ['科技', '金融', '教育', '医疗', '餐饮', '时尚', '环保', '文化'] },
    { key: 'baseColor', label: '基础色', description: '是否有指定主色', required: false, type: 'text', placeholder: '例如：蓝色系，或具体色值 #0066FF' },
    { key: 'colorCount', label: '颜色数量', description: '需要几种颜色', required: false, type: 'select', options: ['2-3种', '4-5种', '6种以上'] },
  ],
  'creative-idea': [
    { key: 'topic', label: '主题', description: '创意围绕什么主题', required: true, type: 'text', placeholder: '例如：春节营销活动' },
    { key: 'goal', label: '目标', description: '想要达成什么效果', required: true, type: 'select', options: ['提升品牌知名度', '增加销量', '吸引新用户', '提升用户活跃度', '改善品牌形象'] },
    { key: 'industry', label: '行业', description: '所属行业', required: true, type: 'select', options: ['快消品', '科技', '餐饮', '零售', '教育', '金融', '娱乐', '其他'] },
    { key: 'budget', label: '预算范围', description: '大致预算', required: false, type: 'select', options: ['低预算', '中等预算', '高预算', '不限'] },
    { key: 'timeline', label: '时间周期', description: '准备时间', required: false, type: 'select', options: ['一周内', '一个月内', '三个月内', '长期规划'] },
  ],
  'general': [],
  'greeting': [],
  'help': [],
};

// 分析需求
export const analyzeRequirements = async (
  intent: IntentType,
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  signal?: AbortSignal
): Promise<RequirementAnalysis> => {
  const requirements = INTENT_REQUIREMENTS[intent] || [];
  
  // 如果该意图不需要收集信息，直接返回 ready
  if (requirements.length === 0) {
    return {
      ready: true,
      collectedInfo: {},
      missingFields: [],
      summary: '无需额外信息',
    };
  }

  // 构建分析提示词
  const prompt = `请分析用户的需求，从对话历史中提取信息。

意图类型：${intent}
需求字段：${JSON.stringify(requirements, null, 2)}

用户最新消息：${userMessage}

历史对话：
${history.map(h => `${h.role}: ${h.content}`).join('\n')}

请分析：
1. 从用户消息和历史对话中提取已知的字段值
2. 识别哪些必填字段还缺失
3. 生成一个友好的问题来询问缺失的关键信息
4. 总结当前已理解的需求

严格按照以下 JSON 格式返回：
{
  "collectedInfo": {"字段key": "提取的值", ...},
  "missingFields": ["缺失的字段key"],
  "nextQuestion": "询问用户的问题",
  "suggestions": ["建议的回复选项1", "建议的回复选项2"],
  "summary": "当前理解的需求摘要"
}`;

  try {
    const response = await callQwenChat({
      model: 'qwen-turbo',
      messages: [
        { role: 'system' as 'system', content: '你是一个需求分析专家，擅长从对话中提取结构化信息。' },
        { role: 'user' as 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      signal,
    });

    // 解析结果
    let result: Partial<RequirementAnalysis> = {};
    try {
      const parsed = JSON.parse(response);
      result = {
        collectedInfo: parsed.collectedInfo || {},
        missingFields: requirements.filter(r => 
          r.required && (!parsed.collectedInfo || !parsed.collectedInfo[r.key])
        ),
        nextQuestion: parsed.nextQuestion,
        suggestions: parsed.suggestions || [],
        summary: parsed.summary || '',
      };
    } catch (e) {
      // 解析失败，使用降级方案
      result = fallbackAnalysis(intent, userMessage, requirements);
    }

    const missingRequired = result.missingFields || [];
    
    return {
      ready: missingRequired.length === 0,
      collectedInfo: result.collectedInfo || {},
      missingFields: missingRequired,
      nextQuestion: result.nextQuestion,
      suggestions: result.suggestions,
      summary: result.summary || '',
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('请求已取消');
    }
    console.error('[RequirementService] Error:', error);
    // 使用降级方案
    return fallbackAnalysis(intent, userMessage, requirements);
  }
};

// 降级分析方案（基于关键词匹配 + 智能推断）
const fallbackAnalysis = (
  intent: IntentType,
  userMessage: string,
  requirements: RequirementField[]
): RequirementAnalysis => {
  const collectedInfo: Record<string, string> = {};
  
  // 尝试识别品牌名
  const brandNameInference = extractBrandName(userMessage);
  if (brandNameInference) {
    collectedInfo['brandName'] = brandNameInference.value;
  }
  
  // 尝试识别行业
  const industry = identifyIndustry(userMessage);
  if (industry) {
    collectedInfo['industry'] = industry;
  }
  
  // 使用智能推断引擎推断其他信息
  const inferences = inferMissingInfo(intent, collectedInfo, userMessage);
  inferences.forEach(inf => {
    if (!collectedInfo[inf.key]) {
      collectedInfo[inf.key] = inf.value;
    }
  });
  
  // 生成下一个问题
  const missingFieldsSimple = requirements
    .filter(r => r.required && !collectedInfo[r.key])
    .map(r => ({ key: r.key, label: r.label, required: r.required }));
  
  const questionResult = generateSmartQuestion(intent, collectedInfo, missingFieldsSimple, userMessage);
  
  // 生成建议回复
  const suggestions = questionResult.suggestions || [];
  
  // 生成摘要
  const summary = `用户想要进行${getIntentDisplayName(intent)}。${Object.keys(collectedInfo).length > 0 ? `已识别：${Object.entries(collectedInfo).map(([k, v]) => `${k}: ${v}`).join('、')}` : ''}`;
  
  return {
    ready: missingFieldsSimple.length === 0,
    collectedInfo,
    missingFields: requirements.filter(r => r.required && !collectedInfo[r.key]),
    nextQuestion: questionResult.question,
    suggestions,
    summary,
  };
};

// 获取意图显示名称
const getIntentDisplayName = (intent: IntentType): string => {
  const names: Record<IntentType, string> = {
    'image-generation': '图片生成',
    'logo-design': 'Logo设计',
    'poster-design': '海报设计',
    'text-generation': '文案创作',
    'brand-copy': '品牌文案',
    'marketing-copy': '营销文案',
    'social-copy': '社媒文案',
    'color-scheme': '配色方案',
    'creative-idea': '创意点子',
    'general': '对话',
    'greeting': '问候',
    'help': '帮助',
  };
  return names[intent] || '任务';
};

// 生成需求收集表单
export const generateRequirementForm = (intent: IntentType): RequirementField[] => {
  return INTENT_REQUIREMENTS[intent] || [];
};

// 字段验证规则
const VALIDATION_RULES: Record<string, (value: string) => { valid: boolean; message?: string }> = {
  // 品牌名称：不能为空，长度2-50
  brandName: (value) => {
    if (!value || value.trim().length === 0) return { valid: false, message: '品牌名称不能为空' };
    if (value.trim().length < 2) return { valid: false, message: '品牌名称至少需要2个字符' };
    if (value.trim().length > 50) return { valid: false, message: '品牌名称不能超过50个字符' };
    return { valid: true };
  },
  // 主题内容：不能为空，长度5-500
  subject: (value) => {
    if (!value || value.trim().length === 0) return { valid: false, message: '主题内容不能为空' };
    if (value.trim().length < 5) return { valid: false, message: '主题内容描述需要更详细一些（至少5个字符）' };
    if (value.trim().length > 500) return { valid: false, message: '主题内容不能超过500个字符' };
    return { valid: true };
  },
  // 标题：不能为空，长度2-100
  title: (value) => {
    if (!value || value.trim().length === 0) return { valid: false, message: '标题不能为空' };
    if (value.trim().length < 2) return { valid: false, message: '标题至少需要2个字符' };
    if (value.trim().length > 100) return { valid: false, message: '标题不能超过100个字符' };
    return { valid: true };
  },
  // 主题/话题：不能为空，长度2-200
  topic: (value) => {
    if (!value || value.trim().length === 0) return { valid: false, message: '主题不能为空' };
    if (value.trim().length < 2) return { valid: false, message: '主题描述需要更详细一些' };
    if (value.trim().length > 200) return { valid: false, message: '主题不能超过200个字符' };
    return { valid: true };
  },
  // 产品/服务：不能为空
  product: (value) => {
    if (!value || value.trim().length === 0) return { valid: false, message: '产品/服务名称不能为空' };
    if (value.trim().length < 2) return { valid: false, message: '产品/服务名称至少需要2个字符' };
    return { valid: true };
  },
  // 目标受众：不能为空
  targetAudience: (value) => {
    if (!value || value.trim().length === 0) return { valid: false, message: '目标受众不能为空' };
    return { valid: true };
  },
};

// 验证单个字段
export const validateField = (
  fieldKey: string,
  value: string
): { valid: boolean; message?: string } => {
  const validator = VALIDATION_RULES[fieldKey];
  if (validator) {
    return validator(value);
  }
  // 默认验证：非空检查
  if (!value || value.trim().length === 0) {
    return { valid: false, message: '该字段不能为空' };
  }
  return { valid: true };
};

// 验证所有已收集的字段
export const validateCollectedInfo = (
  intent: IntentType,
  collectedInfo: Record<string, string>
): { valid: boolean; errors: Record<string, string> } => {
  const requirements = INTENT_REQUIREMENTS[intent] || [];
  const errors: Record<string, string> = {};

  requirements
    .filter(r => r.required)
    .forEach(r => {
      const value = collectedInfo[r.key];
      const validation = validateField(r.key, value || '');
      if (!validation.valid) {
        errors[r.key] = validation.message || `${r.label}无效`;
      }
    });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

// 检查是否收集完成
export const isRequirementsComplete = (
  intent: IntentType,
  collectedInfo: Record<string, string>
): boolean => {
  const requirements = INTENT_REQUIREMENTS[intent] || [];
  return requirements
    .filter(r => r.required)
    .every(r => {
      const value = collectedInfo[r.key];
      if (!value || value.trim() === '') return false;
      const validation = validateField(r.key, value);
      return validation.valid;
    });
};

export default {
  analyzeRequirements,
  generateRequirementForm,
  isRequirementsComplete,
  validateField,
  validateCollectedInfo,
};
