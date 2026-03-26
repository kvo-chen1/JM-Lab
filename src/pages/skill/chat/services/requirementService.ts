import { callQwenChat } from '@/services/llm/chatProviders';
import type { IntentType } from './intentService';
import type { AnalysisDetail } from '../types';
import {
  inferMissingInfo,
  generateNextQuestion as generateSmartQuestion,
  isShortReply,
  extractKeywords,
  extractBrandName,
  extractBrandInfo,
  identifyIndustry,
  recommendMerchandiseTypes,
} from './smartInference';
import {
  parseNumberedTasks,
  recognizeMaterialType,
} from './taskOrchestrationService';

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
  condition?: FieldCondition;
}

// 动态字段显示条件
export interface FieldCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'in' | 'notIn';
  value: string | string[];
  action?: 'show' | 'hide' | 'require';
}

// 需求分析结果
export interface RequirementAnalysis {
  ready: boolean;
  collectedInfo: Record<string, string>;
  missingFields: RequirementField[];
  summary: string;
  nextQuestion?: string;
  suggestions?: string[];
  intentSwitch?: IntentSwitchInfo;
  analysisDetails?: AnalysisDetail[];
}

// 意图切换信息
export interface IntentSwitchInfo {
  previousIntent: IntentType;
  newIntent: IntentType;
  confidence: number;
  needsConfirmation: boolean;
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
  'image-beautification': [
    { key: 'imageUrl', label: '图片', description: '需要美化的图片', required: false, type: 'text', placeholder: '请上传图片' },
    { key: 'beautifyType', label: '美化类型', description: '想要如何美化', required: false, type: 'select', options: ['提升画质', '色彩增强', '风格转换', '修复瑕疵'] },
  ],
  'image-style-transfer': [
    { key: 'imageUrl', label: '图片', description: '需要转换风格的图片', required: false, type: 'text', placeholder: '请上传图片' },
    { key: 'targetStyle', label: '目标风格', description: '想要转换成的风格', required: true, type: 'select', options: ['油画', '水彩', '素描', '卡通', '赛博朋克', '国风'] },
  ],
  'image-recognition': [
    { key: 'imageUrl', label: '图片', description: '需要识别的图片', required: false, type: 'text', placeholder: '请上传图片' },
    { key: 'recognitionType', label: '识别类型', description: '想要识别什么', required: false, type: 'select', options: ['物体识别', '文字识别', '场景识别', '人脸识别'] },
  ],
  'image-editing': [
    { key: 'originalImageUrl', label: '原图', description: '需要编辑的原图', required: false, type: 'text', placeholder: '请上传或使用已生成的图片' },
    { key: 'editType', label: '编辑类型', description: '想要如何编辑', required: true, type: 'select', options: ['修改局部', '更换元素', '调整颜色', '改变风格', '扩展画面', '复制变体'] },
    { key: 'editInstruction', label: '编辑要求', description: '具体的编辑要求', required: true, type: 'textarea', placeholder: '例如：把这只猫换成蓝眼睛' },
  ],
  'batch-generation': [
    { key: 'batchType', label: '批量类型', description: '批量生成什么', required: true, type: 'select', options: ['多张变体', '多款周边', '多平台适配', '整套VI', '系列插画'] },
    { key: 'baseContent', label: '基础内容', description: '批量生成的基础', required: true, type: 'textarea', placeholder: '例如：基于之前生成的Logo' },
    { key: 'quantity', label: '数量', description: '需要生成的数量', required: false, type: 'select', options: ['3-5个', '6-10个', '10个以上', '不限制'] },
    { key: 'variations', label: '变化要求', description: '每个变体之间的差异', required: false, type: 'textarea', placeholder: '例如：不同的颜色方案、不同的布局等' },
  ],
  'video-script': [
    { key: 'videoType', label: '视频类型', description: '需要什么类型的视频脚本', required: true, type: 'select', options: ['宣传片', '短视频', 'vlog', '教学视频', '产品演示', '品牌故事'] },
    { key: 'duration', label: '视频时长', description: '视频预计时长', required: true, type: 'select', options: ['15秒以内', '15-30秒', '30-60秒', '1-3分钟', '3-5分钟', '5分钟以上'] },
    { key: 'mainMessage', label: '核心信息', description: '视频要传达的核心内容', required: true, type: 'textarea', placeholder: '例如：产品核心卖点、品牌理念等' },
    { key: 'targetAudience', label: '目标受众', description: '视频面向的人群', required: true, type: 'text', placeholder: '例如：25-35岁职场女性' },
    { key: 'scene', label: '场景描述', description: '视频的主要场景', required: false, type: 'textarea', placeholder: '例如：办公室场景、家庭场景、户外场景等' },
    { key: 'style', label: '视频风格', description: '期望的视频风格', required: false, type: 'select', options: ['纪录片风格', '剧情风格', '动画风格', '访谈风格', '快闪风格', '真人出镜', '无人物'] },
    { key: 'scriptFormat', label: '脚本格式', description: '需要的脚本格式', required: false, type: 'select', options: ['分镜脚本', '对话脚本', '纯文字脚本', '详细脚本'] },
    { key: 'needVoiceover', label: '配音需求', description: '是否需要配音', required: false, type: 'select', options: ['不需要配音', '需要配音', '只需要配音'] },
    { key: 'bgmStyle', label: '背景音乐', description: '背景音乐风格偏好', required: false, type: 'select', options: ['轻快', '舒缓', '激昂', '神秘', '科技感', '无要求'] },
  ],
  'event-planning': [
    { key: 'eventType', label: '活动类型', description: '活动形式', required: true, type: 'select', options: ['线上活动', '线下活动', '线上线下结合'] },
    { key: 'eventName', label: '活动名称', description: '活动主题名称', required: true, type: 'text', placeholder: '例如：618大促、年度用户大会' },
    { key: 'eventGoal', label: '活动目标', description: '希望通过活动达成什么', required: true, type: 'textarea', placeholder: '例如：提升品牌知名度、增加销售额、获取新用户' },
    { key: 'targetAudience', label: '目标人群', description: '活动面向的对象', required: true, type: 'text', placeholder: '例如：现有客户、潜在客户、企业客户' },
    { key: 'budget', label: '预算范围', description: '活动预算', required: true, type: 'select', options: ['1万以下', '1-5万', '5-10万', '10-50万', '50万以上', '暂不确定'] },
    { key: 'timeline', label: '时间安排', description: '活动时间和周期', required: true, type: 'textarea', placeholder: '例如：2024年Q2，计划筹备1个月' },
    { key: 'activities', label: '活动内容', description: '主要活动环节', required: true, type: 'textarea', placeholder: '例如：开幕式、主题演讲、互动环节、抽奖等' },
    { key: 'promotion', label: '推广计划', description: '活动宣传推广方案', required: false, type: 'textarea', placeholder: '例如：预热期、爆发期、持续期各阶段的推广策略' },
    { key: 'kpi', label: '效果指标', description: '衡量活动成功的指标', required: false, type: 'textarea', placeholder: '例如：参与人数、转化率、销售额增长' },
  ],
  'ui-design': [
    { key: 'projectType', label: '项目类型', description: '设计项目的类型', required: true, type: 'select', options: ['APP设计', '网页设计', '小程序设计', 'Dashboard', '后台管理系统', '落地页'] },
    { key: 'mainFunction', label: '主要功能', description: '产品的核心功能', required: true, type: 'textarea', placeholder: '例如：用户登录、内容浏览、在线下单、支付等' },
    { key: 'userCount', label: '用户规模', description: '预计用户量级', required: false, type: 'select', options: ['100以内', '100-1000', '1000-1万', '1万-10万', '10万以上'] },
    { key: 'platform', label: '目标平台', description: '设计面向的平台', required: false, type: 'multiselect', options: ['iOS', 'Android', 'Web', 'H5', '微信小程序'] },
    { key: 'style', label: '设计风格', description: '期望的设计风格', required: false, type: 'select', options: ['简约现代', '科技感', '可爱活泼', '高端奢华', '商务正式', '文艺清新'] },
    { key: 'brandColor', label: '品牌色', description: '品牌主色调', required: false, type: 'text', placeholder: '例如：蓝色系，或具体色值 #0066FF' },
    { key: 'reference', label: '参考案例', description: '是否有参考的设计', required: false, type: 'textarea', placeholder: '例如：参考某APP的设计风格' },
    { key: 'needs', label: '特殊需求', description: '其他特殊要求', required: false, type: 'textarea', placeholder: '例如：无障碍设计、深色模式支持等' },
  ],
  'data-report': [
    { key: 'reportType', label: '报告类型', description: '需要的报告类型', required: true, type: 'select', options: ['周报', '月报', '季报', '年报', '专项报告', '竞品分析'] },
    { key: 'reportTitle', label: '报告标题', description: '报告的主题', required: true, type: 'text', placeholder: '例如：2024年Q1用户增长分析报告' },
    { key: 'dataSource', label: '数据来源', description: '数据来自哪里', required: true, type: 'textarea', placeholder: '例如：GA、友盟、自有数据库等' },
    { key: 'metrics', label: '关键指标', description: '需要关注的核心指标', required: true, type: 'textarea', placeholder: '例如：DAU、留存率、转化率、GMV等' },
    { key: 'comparison', label: '对比维度', description: '是否需要对比分析', required: false, type: 'select', options: ['环比', '同比', '竞品对比', '不做对比'] },
    { key: 'audience', label: '阅读对象', description: '报告的读者是谁', required: true, type: 'text', placeholder: '例如：管理层、业务负责人、公司全员' },
    { key: 'focus', label: '重点关注', description: '报告需要重点分析的内容', required: false, type: 'textarea', placeholder: '例如：用户流失原因分析、新功能效果评估等' },
    { key: 'format', label: '报告格式', description: '期望的报告格式', required: false, type: 'select', options: ['PPT', 'Word', 'Excel', '在线文档', '邮件'] },
  ],
  'web-search': [],
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

  // ===== 新增：检测编号任务列表（如 1. Logo设计 2. 海报设计）=====
  const numberedTasks = parseNumberedTasks(userMessage);
  console.log('[analyzeRequirements] 检测到编号任务:', numberedTasks.length, numberedTasks);

  if (numberedTasks.length >= 2) {
    // 检测到编号列表，解析为批量任务
    // 提取品牌名和品牌信息（用于构建完整的prompt）
    const brandName = extractBrandName(userMessage)?.value || '';
    const brandInfo = extractBrandInfo(userMessage);

    const batchTasks = numberedTasks.map((task, index) => {
      const materialType = recognizeMaterialType(task.rawText);
      console.log(`[analyzeRequirements] 任务 ${index + 1}:`, task.name, '->', materialType?.name || task.name);

      // 构建完整的prompt，包含品牌信息和任务描述
      let fullPrompt = task.rawText;
      if (brandName) {
        fullPrompt = `为品牌"${brandName}"设计：${fullPrompt}`;
      }
      if (brandInfo.industry) {
        fullPrompt += `，行业：${brandInfo.industry}`;
      }
      if (brandInfo.brandConcept) {
        fullPrompt += `，品牌理念：${brandInfo.brandConcept}`;
      }
      if (brandInfo.style) {
        fullPrompt += `，风格要求：${brandInfo.style}`;
      }
      if (brandInfo.colors) {
        fullPrompt += `，配色：${brandInfo.colors}`;
      }
      if (brandInfo.keywords) {
        fullPrompt += `，关键词：${brandInfo.keywords}`;
      }
      if (brandInfo.targetAudience) {
        fullPrompt += `，目标客群：${brandInfo.targetAudience}`;
      }
      if (brandInfo.font) {
        fullPrompt += `，字体：${brandInfo.font}`;
      }

      return {
        id: `task_${index + 1}`,
        name: materialType?.name || task.name,
        prompt: fullPrompt,
        skill: materialType?.skill || 'poster-design',
        type: materialType?.type || 'design',
      };
    });

    console.log('[analyzeRequirements] 返回 batchTasks:', batchTasks.length);

    return {
      ready: true, // 直接就绪，跳过常规收集
      collectedInfo: {
        batchType: '整套VI',
        baseContent: userMessage,
        brandName,
        batchTasks: JSON.stringify(batchTasks),
        taskCount: String(batchTasks.length),
      },
      missingFields: [],
      summary: `检测到${batchTasks.length}个任务：${batchTasks.map(t => t.name).join('、')}`,
      suggestions: batchTasks.map(t => `✓ ${t.name}`),
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
        { role: 'system', content: '你是一个需求分析专家，擅长从对话中提取结构化信息。', timestamp: Date.now() },
        { role: 'user', content: prompt, timestamp: Date.now() },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      signal,
    });

    // 解析结果
    let result: Partial<RequirementAnalysis> & { analysisDetails?: AnalysisDetail[] } = {};
    try {
      const parsed = JSON.parse(response);
      const parsedCollectedInfo = parsed.collectedInfo || {};
      const parsedMissingFields = requirements.filter(r =>
        r.required && (!parsedCollectedInfo || !parsedCollectedInfo[r.key])
      );

      // 生成 analysisDetails
      const generatedAnalysisDetails: AnalysisDetail[] = [];

      // 已收集的信息
      Object.entries(parsedCollectedInfo).forEach(([key, value]) => {
        const stringValue = String(value || '');
        if (stringValue.trim()) {
          const field = requirements.find(r => r.key === key);
          generatedAnalysisDetails.push({
            field: key,
            label: field?.label || key,
            value: stringValue,
            source: 'explicit',
            confidence: 0.9,
            reasoning: '从用户消息中直接提取',
          });
        }
      });

      // 缺失的字段
      parsedMissingFields.forEach(field => {
        generatedAnalysisDetails.push({
          field: field.key,
          label: field.label,
          value: undefined,
          source: 'inferred',
          reasoning: `需要补充此信息才能完成${getIntentDisplayName(intent)}任务`,
        });
      });

      result = {
        collectedInfo: parsedCollectedInfo,
        missingFields: parsedMissingFields,
        nextQuestion: parsed.nextQuestion,
        suggestions: parsed.suggestions || [],
        summary: parsed.summary || '',
        analysisDetails: generatedAnalysisDetails,
      };
    } catch (e) {
      // 解析失败，使用降级方案
      const fallbackResult = fallbackAnalysis(intent, userMessage, requirements);
      result = {
        ...fallbackResult,
        analysisDetails: fallbackResult.analysisDetails || [],
      };
    }

    // 兜底逻辑：重新计算缺失字段，确保准确性
    // 即使 LLM 返回了结果，也要根据 INTENT_REQUIREMENTS 重新验证
    const finalMissingFields = requirements.filter(r =>
      r.required && (!result.collectedInfo || !result.collectedInfo[r.key] ||
                    result.collectedInfo[r.key].trim() === '')
    );

    // 更新 analysisDetails 中的缺失字段
    if (result.analysisDetails) {
      finalMissingFields.forEach(field => {
        if (!result.analysisDetails!.some(d => d.field === field.key)) {
          result.analysisDetails!.push({
            field: field.key,
            label: field.label,
            value: undefined,
            source: 'inferred',
            reasoning: `需要补充此信息才能完成${getIntentDisplayName(intent)}任务`,
          });
        }
      });
    }

    return {
      ready: finalMissingFields.length === 0,
      collectedInfo: result.collectedInfo || {},
      missingFields: finalMissingFields,
      nextQuestion: result.nextQuestion,
      suggestions: result.suggestions,
      summary: result.summary || '',
      analysisDetails: result.analysisDetails || [],
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
  const analysisDetails: AnalysisDetail[] = [];

  // 尝试识别品牌名
  const brandNameInference = extractBrandName(userMessage);
  if (brandNameInference) {
    collectedInfo['brandName'] = brandNameInference.value;
    analysisDetails.push({
      field: 'brandName',
      label: '品牌名称',
      value: brandNameInference.value,
      source: 'explicit',
      confidence: brandNameInference.confidence,
      reasoning: brandNameInference.reasoning,
    });
  }

  // 尝试识别行业
  const industry = identifyIndustry(userMessage);
  if (industry) {
    collectedInfo['industry'] = industry;
    analysisDetails.push({
      field: 'industry',
      label: '行业',
      value: industry,
      source: 'inferred',
      confidence: 0.8,
      reasoning: '根据用户描述的关键词推断所属行业',
    });
  }

  // 使用智能推断引擎推断其他信息
  const inferences = inferMissingInfo(intent, collectedInfo, userMessage);
  inferences.forEach(inf => {
    if (!collectedInfo[inf.key]) {
      collectedInfo[inf.key] = inf.value;
      const field = requirements.find(r => r.key === inf.key);
      analysisDetails.push({
        field: inf.key,
        label: field?.label || inf.key,
        value: inf.value,
        source: 'inferred',
        confidence: inf.confidence,
        reasoning: inf.reasoning,
      });
    }
  });

  // 生成下一个问题
  const missingFieldsSimple = requirements
    .filter(r => r.required && !collectedInfo[r.key])
    .map(r => ({ key: r.key, label: r.label, required: r.required }));

  const questionResult = generateSmartQuestion(intent, collectedInfo, missingFieldsSimple, userMessage);

  // 生成建议回复
  const suggestions = questionResult.suggestions || [];

  // 为缺失的字段生成分析详情
  missingFieldsSimple.forEach(field => {
    analysisDetails.push({
      field: field.key,
      label: field.label,
      value: undefined,
      source: 'inferred',
      reasoning: `需要补充此信息才能完成${getIntentDisplayName(intent)}任务`,
    });
  });

  // 生成摘要
  const summary = `用户想要进行${getIntentDisplayName(intent)}。${Object.keys(collectedInfo).length > 0 ? `已识别：${Object.entries(collectedInfo).map(([k, v]) => `${k}: ${v}`).join('、')}` : ''}`;

  return {
    ready: missingFieldsSimple.length === 0,
    collectedInfo,
    missingFields: requirements.filter(r => r.required && !collectedInfo[r.key]),
    nextQuestion: questionResult.question,
    suggestions,
    summary,
    analysisDetails,
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
    'image-beautification': '图片美化',
    'image-style-transfer': '风格转换',
    'image-recognition': '图片识别',
    'image-editing': '图片编辑',
    'batch-generation': '批量生成',
    'video-script': '视频脚本',
    'event-planning': '活动策划',
    'ui-design': 'UI设计',
    'data-report': '数据分析报告',
    'web-search': '联网搜索',
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
  const visibleFields = filterVisibleFields(requirements, collectedInfo);
  return visibleFields
    .filter(r => r.required)
    .every(r => {
      const value = collectedInfo[r.key];
      if (!value || value.trim() === '') return false;
      const validation = validateField(r.key, value);
      return validation.valid;
    });
};

// 过滤动态显示的字段
export const filterVisibleFields = (
  requirements: RequirementField[],
  collectedInfo: Record<string, string>
): RequirementField[] => {
  return requirements.filter(field => {
    if (!field.condition) return true;

    const conditionValue = collectedInfo[field.condition.field];
    if (!conditionValue) return field.condition.action !== 'show';

    const { operator, value, action } = field.condition;

    let isMatch = false;
    switch (operator) {
      case 'equals':
        isMatch = conditionValue === value;
        break;
      case 'notEquals':
        isMatch = conditionValue !== value;
        break;
      case 'contains':
        isMatch = conditionValue.includes(value as string);
        break;
      case 'notContains':
        isMatch = !conditionValue.includes(value as string);
        break;
      case 'in':
        isMatch = Array.isArray(value) && value.includes(conditionValue);
        break;
      case 'notIn':
        isMatch = Array.isArray(value) && !value.includes(conditionValue);
        break;
    }

    if (action === 'show') {
      return isMatch;
    } else if (action === 'hide') {
      return !isMatch;
    }

    return true;
  });
};

// 检测意图切换
export const detectIntentSwitch = (
  previousIntent: IntentType,
  newIntent: IntentType,
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): IntentSwitchInfo | null => {
  if (previousIntent === newIntent) {
    return null;
  }

  if (['greeting', 'help', 'general'].includes(previousIntent) ||
      ['greeting', 'help', 'general'].includes(newIntent)) {
    return null;
  }

  const hasIntentKeywords = /^(帮我|我想|需要|给我|来个|设计|写|制作|生成)/.test(message);
  const confidence = hasIntentKeywords ? 0.85 : 0.7;
  const needsConfirmation = confidence < 0.9;

  return {
    previousIntent,
    newIntent,
    confidence,
    needsConfirmation,
  };
};

export default {
  analyzeRequirements,
  generateRequirementForm,
  isRequirementsComplete,
  validateField,
  validateCollectedInfo,
  filterVisibleFields,
  detectIntentSwitch,
};
