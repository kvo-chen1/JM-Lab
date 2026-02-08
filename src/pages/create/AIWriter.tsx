import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { llmService } from '@/services/llmService';
import { RichTextEditor } from '@/components/RichTextEditor';
import { draftService, Draft } from '@/services/draftService';
import { exportToWord } from '@/services/wordExportService';

// 实现缓存机制
const contentCache = new Map<string, string>();
const templateCache = new Map<string, any>();

// 防抖函数
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Template categories with icons and colors
const TEMPLATE_CATEGORIES = {
  business: { name: '商业文档', icon: 'fas fa-briefcase', color: 'from-blue-500 to-indigo-500' },
  marketing: { name: '营销推广', icon: 'fas fa-bullhorn', color: 'from-rose-500 to-pink-500' },
  social: { name: '社交媒体', icon: 'fas fa-hashtag', color: 'from-violet-500 to-purple-500' },
  product: { name: '产品文档', icon: 'fas fa-clipboard-list', color: 'from-emerald-500 to-teal-500' },
  press: { name: '新闻媒体', icon: 'fas fa-newspaper', color: 'from-amber-500 to-orange-500' },
  sales: { name: '销售话术', icon: 'fas fa-comments-dollar', color: 'from-cyan-500 to-blue-500' },
  ecommerce: { name: '电商运营', icon: 'fas fa-shopping-bag', color: 'from-fuchsia-500 to-pink-500' },
  hr: { name: '人力资源', icon: 'fas fa-user-plus', color: 'from-lime-500 to-green-500' },
  event: { name: '活动策划', icon: 'fas fa-calendar-alt', color: 'from-yellow-500 to-amber-500' },
  training: { name: '培训教育', icon: 'fas fa-book-reader', color: 'from-teal-500 to-cyan-500' },
  brand: { name: '品牌建设', icon: 'fas fa-heart', color: 'from-red-500 to-rose-500' },
  crowdfunding: { name: '众筹融资', icon: 'fas fa-hand-holding-usd', color: 'from-indigo-500 to-violet-500' },
};

// Define templates based on user requirements
const TEMPLATES = {
  business_plan: {
    id: 'business_plan',
    name: '经典商业计划书',
    icon: 'fas fa-briefcase',
    description: '适用于融资、路演的完整标准结构',
    category: 'business',
    color: 'from-blue-500 to-indigo-500',
    sections: [
      '执行摘要', '公司概述', '问题与解决方案', '产品介绍', '市场分析', '竞争分析', '商业模式', '财务预测'
    ],
    prompt: `请撰写一份专业的商业计划书。
项目名称：[项目名称]
核心业务：[核心业务]
目标市场：[目标市场]
竞争优势：[竞争优势]

请直接输出 **HTML 格式** 的内容，不要包含 markdown 代码块标记（如 \`\`\`html）。
请使用以下 HTML 标签构建结构清晰、排版专业的文档：
- 使用 <h1> 作为主标题（项目名称）
- 使用 <h2> 作为章节标题
- 使用 <h3> 作为子章节标题
- 使用 <p> 作为正文段落，保持段落长度适中
- 使用 <ul>/<li> 或 <ol>/<li> 展示列表项
- 使用 <strong> 或 <b> 强调关键数据和术语
- 使用 <table> 展示财务预测或对比数据（请添加 border="1" style="border-collapse: collapse; width: 100%;"）

章节要求：
1. <h2>执行摘要</h2>：高度浓缩的计划书精华。
2. <h2>公司/项目概述</h2>：背景、愿景、使命。
3. <h2>问题与解决方案</h2>：痛点及解决方案。
4. <h2>产品/服务介绍</h2>：核心功能与技术壁垒。
5. <h2>市场分析</h2>：市场规模、目标客户。
6. <h2>竞争分析</h2>：竞品对比（建议使用表格）。
7. <h2>商业模式</h2>：盈利模式与定价。
8. <h2>财务计划</h2>：未来3年预测（建议使用表格）。

请确保语言专业、严谨、客观，逻辑连贯。`
  },
  lean_canvas: {
    id: 'lean_canvas',
    name: '精益创业画布',
    icon: 'fas fa-th-large',
    description: '适用于早期项目的快速验证与梳理',
    category: 'business',
    color: 'from-emerald-500 to-teal-500',
    sections: [
      '问题', '客户细分', '独特卖点', '解决方案', '渠道', '收入来源', '成本结构', '关键指标', '门槛优势'
    ],
    prompt: `请为[项目名称]创建一个精益创业画布（Lean Canvas）。
核心业务：[核心业务]

请直接输出 **HTML 格式** 的内容，不要包含 markdown 代码块标记。
使用 <h2> 作为模块标题，<p> 作为内容，<ul> 列表展示要点。
请详细阐述以下9个模块：
1. 问题
2. 客户细分
3. 独特卖点
4. 解决方案
5. 渠道
6. 收入来源
7. 成本结构
8. 关键指标
9. 门槛优势`
  },
  pitch_deck: {
    id: 'pitch_deck',
    name: '融资路演PPT文案',
    icon: 'fas fa-presentation',
    description: '适用于路演演讲的精简有力文案',
    category: 'business',
    color: 'from-violet-500 to-purple-500',
    sections: [
      '封面', '痛点', '解决方案', '市场机会', '产品', '商业模式', '团队', '融资'
    ],
    prompt: `请撰写一份融资路演PPT（Pitch Deck）的逐页文案。
项目名称：[项目名称]
一句话介绍：[一句话介绍]

请直接输出 **HTML 格式** 的内容。
每一页使用 <div style="border: 1px solid #ccc; padding: 20px; margin-bottom: 20px; border-radius: 8px;"> 包裹。
内部结构：
<h3>Slide X: [标题]</h3>
<p><strong>核心观点：</strong>[内容]</p>
<p><strong>演讲备注：</strong>[内容]</p>

请规划约10页PPT内容，语言极具感染力。`
  },
  market_analysis: {
    id: 'market_analysis',
    name: '深度市场分析报告',
    icon: 'fas fa-chart-line',
    description: '专注于行业趋势与竞争格局的深度分析',
    category: 'business',
    color: 'from-cyan-500 to-blue-500',
    sections: [
      '行业概况', '市场规模', '趋势分析', '客户画像', 'SWOT分析'
    ],
    prompt: `请撰写一份关于[行业/领域]的深度市场分析报告。
关注焦点：[关注焦点]

请直接输出 **HTML 格式** 的内容。
使用 <h2>, <h3>, <p>, <ul>, <table> 等标签。
内容包含：行业概况、市场规模测算（使用表格展示数据）、市场趋势、目标客户分析、竞争格局、SWOT分析（使用表格）。
语言需客观、专业，引用行业标准术语。`
  },
  prd: {
    id: 'prd',
    name: '产品需求文档 (PRD)',
    icon: 'fas fa-clipboard-list',
    description: '标准化的互联网产品需求定义文档',
    category: 'product',
    color: 'from-emerald-500 to-teal-500',
    sections: [
      '文档说明', '产品背景', '用户角色', '功能需求', '非功能需求', '数据埋点'
    ],
    prompt: `请撰写一份专业的产品需求文档（PRD）。
产品名称：[产品名称]
核心功能：[核心功能]

请直接输出 **HTML 格式** 的内容。
使用 <table border="1" style="width: 100%; border-collapse: collapse;"> 展示功能列表和版本记录。
章节结构：
1. <h2>文档说明</h2>：版本记录、变更日志。
2. <h2>产品背景</h2>：背景、目标、范围。
3. <h2>用户角色</h2>：用户画像、使用场景。
4. <h2>功能需求</h2>：详细的功能点描述（使用表格：功能模块 | 功能点 | 优先级 | 描述）。
5. <h2>非功能需求</h2>：性能、安全、兼容性。
6. <h2>数据埋点</h2>：关键指标定义。

语言需极度严谨，逻辑清晰，无歧义。`
  },
  social_media: {
    id: 'social_media',
    name: '社交媒体文案',
    icon: 'fas fa-hashtag',
    description: '适用于微信、微博、小红书等平台的营销文案',
    category: 'social',
    color: 'from-violet-500 to-purple-500',
    sections: [
      '标题', '引言', '核心内容', '互动环节', '行动召唤'
    ],
    prompt: `请撰写一份适合社交媒体平台的营销文案。
产品/服务：[产品名称]
核心卖点：[核心业务]
目标受众：[目标市场]

请直接输出 **HTML 格式** 的内容。
使用 <h2>, <p>, <ul>, <b> 等标签。
内容要求：
1. 引人注目的标题和开头
2. 清晰传达核心价值
3. 包含情感共鸣点
4. 设计互动环节
5. 明确的行动召唤
6. 适合社交媒体的轻松活泼语言风格

请根据不同平台特性，提供2-3种不同长度的版本（短文、中长文、长文）。`
  },
  ad_copy: {
    id: 'ad_copy',
    name: '广告文案',
    icon: 'fas fa-bullhorn',
    description: '适用于各种广告媒体的精准营销文案',
    category: 'marketing',
    color: 'from-rose-500 to-pink-500',
    sections: [
      '标题', '副标题', '正文', '行动召唤', '品牌信息'
    ],
    prompt: `请撰写一份专业的广告文案。
产品/服务：[产品名称]
核心卖点：[核心业务]
目标受众：[目标市场]

请直接输出 **HTML 格式** 的内容。
使用 <h2>, <h3>, <p>, <b> 等标签。
内容要求：
1. 吸引人的主标题和副标题
2. 简洁有力的产品介绍
3. 突出核心竞争优势
4. 明确的行动召唤
5. 包含品牌信息

请提供至少3个不同长度的版本，适合不同广告位使用。`
  },
  marketing_email: {
    id: 'marketing_email',
    name: '营销邮件',
    icon: 'fas fa-envelope',
    description: '适用于客户沟通和促销活动的邮件文案',
    category: 'marketing',
    color: 'from-amber-500 to-orange-500',
    sections: [
      '主题行', '开场白', '核心内容', '优惠信息', '行动召唤', '结束语'
    ],
    prompt: `请撰写一份有效的营销邮件文案。
邮件目的：[核心业务]
目标受众：[目标市场]
主要信息：[项目名称]

请直接输出 **HTML 格式** 的内容。
使用 <h2>, <p>, <ul>, <b> 等标签。
内容要求：
1. 吸引人的邮件主题行（提供3-5个选项）
2. 个性化的开场白
3. 清晰的邮件目的
4. 有价值的内容或优惠
5. 明确的行动召唤
6. 专业的结束语和签名

请确保邮件格式正确，语言友好，避免垃圾邮件触发词。`
  },
  press_release: {
    id: 'press_release',
    name: '新闻稿',
    icon: 'fas fa-newspaper',
    description: '适用于企业新闻发布的专业文案',
    category: 'press',
    color: 'from-amber-500 to-orange-500',
    sections: [
      '标题', '副标题', '导语', '正文', '引述', '背景信息', '联系方式'
    ],
    prompt: `请撰写一份专业的新闻稿。
新闻事件：[项目名称]
核心内容：[核心业务]
目标媒体：[目标市场]

请直接输出 **HTML 格式** 的内容。
使用 <h1>, <h2>, <p>, <b>, <em> 等标签。
内容要求：
1. 简洁有力的标题和副标题
2. 包含5W1H要素的导语
3. 层次分明的正文内容
4. 相关人员的引述
5. 必要的背景信息
6. 清晰的联系方式

请确保语言正式、客观、专业，符合新闻稿的标准格式。`
  },
  sales_pitch: {
    id: 'sales_pitch',
    name: '销售话术',
    icon: 'fas fa-comments-dollar',
    description: '适用于销售场景的高效沟通话术',
    category: 'sales',
    color: 'from-cyan-500 to-blue-500',
    sections: [
      '开场白', '需求挖掘', '产品介绍', '异议处理', '成交话术'
    ],
    prompt: `请撰写一份专业的销售话术。
产品/服务：[产品名称]
核心卖点：[核心业务]
目标客户：[目标市场]

请直接输出 **HTML 格式** 的内容。
使用 <h2>, <p>, <ul>, <b> 等标签。
内容要求：
1. 吸引人的开场白
2. 有效的需求挖掘问题
3. 针对痛点的产品介绍
4. 常见异议的处理话术
5. 自然的成交引导

请确保话术口语化，符合销售场景，避免生硬推销。`
  },
  ecommerce_product: {
    id: 'ecommerce_product',
    name: '电商产品描述',
    icon: 'fas fa-shopping-bag',
    description: '适用于淘宝、京东、拼多多等电商平台的商品详情页',
    category: 'ecommerce',
    color: 'from-fuchsia-500 to-pink-500',
    sections: [
      '产品标题', '核心卖点', '详细参数', '使用场景', '售后保障'
    ],
    prompt: `请撰写一份专业的电商产品描述文案。
产品名称：[产品名称]
产品类别：[核心业务]
目标人群：[目标市场]

请直接输出 **HTML 格式** 的内容。
使用 <h2>, <h3>, <p>, <ul>, <table>, <b> 等标签。
内容要求：
1. <h2>产品标题</h2>：包含关键词的吸睛标题（3-5个备选）
2. <h2>核心卖点</h2>：5-8个产品核心优势，使用图标化表达
3. <h2>详细参数</h2>：使用表格展示产品规格参数
4. <h2>使用场景</h2>：描述产品的实际应用场景
5. <h2>售后保障</h2>：售后服务承诺

语言风格要符合电商平台特点，突出性价比和购买紧迫感。`
  },
  recruitment: {
    id: 'recruitment',
    name: '招聘文案',
    icon: 'fas fa-user-plus',
    description: '适用于各大招聘平台的企业招聘信息',
    category: 'hr',
    color: 'from-lime-500 to-green-500',
    sections: [
      '公司介绍', '岗位职责', '任职要求', '薪资福利', '应聘方式'
    ],
    prompt: `请撰写一份专业的招聘文案。
职位名称：[产品名称]
公司名称：[项目名称]
行业领域：[核心业务]

请直接输出 **HTML 格式** 的内容。
使用 <h2>, <h3>, <p>, <ul>, <b> 等标签。
内容要求：
1. <h2>公司介绍</h2>：企业背景、文化、发展前景
2. <h2>岗位职责</h2>：详细的工作内容和责任范围
3. <h2>任职要求</h2>：学历、经验、技能要求（必须/优先）
4. <h2>薪资福利</h2>：薪酬范围、五险一金、带薪假期、其他福利
5. <h2>应聘方式</h2>：投递渠道、面试流程、联系方式

语言要专业且有吸引力，体现企业诚意。`
  },
  event_planning: {
    id: 'event_planning',
    name: '活动策划案',
    icon: 'fas fa-calendar-alt',
    description: '适用于各类线上线下活动的完整策划方案',
    category: 'event',
    color: 'from-yellow-500 to-amber-500',
    sections: [
      '活动概述', '目标受众', '活动流程', '宣传推广', '预算规划'
    ],
    prompt: `请撰写一份完整的活动策划案。
活动名称：[项目名称]
活动类型：[核心业务]
目标人群：[目标市场]

请直接输出 **HTML 格式** 的内容。
使用 <h2>, <h3>, <p>, <ul>, <ol>, <table>, <b> 等标签。
内容要求：
1. <h2>活动概述</h2>：活动主题、目的、时间地点
2. <h2>目标受众</h2>：参与者画像、预期人数
3. <h2>活动流程</h2>：详细的时间节点和环节安排（使用表格）
4. <h2>宣传推广</h2>：预热、进行、复盘各阶段的推广策略
5. <h2>预算规划</h2>：各项费用明细（使用表格）
6. <h2>风险预案</h2>：可能出现的问题及应对措施

语言要富有创意和感染力，体现活动的独特价值。`
  },
  training_manual: {
    id: 'training_manual',
    name: '培训手册',
    icon: 'fas fa-book-reader',
    description: '适用于企业内部培训和知识传承的标准化文档',
    category: 'training',
    color: 'from-teal-500 to-cyan-500',
    sections: [
      '培训目标', '课程大纲', '核心内容', '实操练习', '考核评估'
    ],
    prompt: `请撰写一份专业的培训手册。
培训主题：[产品名称]
培训对象：[目标市场]
培训时长：[核心业务]

请直接输出 **HTML 格式** 的内容。
使用 <h2>, <h3>, <p>, <ul>, <ol>, <table>, <b> 等标签。
内容要求：
1. <h2>培训目标</h2>：学习目标和预期成果
2. <h2>课程大纲</h2>：模块划分和时间分配（使用表格）
3. <h2>核心内容</h2>：各模块的详细知识点
4. <h2>实操练习</h2>：案例分析和动手实践环节
5. <h2>考核评估</h2>：测试题目和评分标准
6. <h2>参考资料</h2>：延伸阅读和学习资源

语言要通俗易懂，理论与实践结合，便于学员理解和掌握。`
  },
  brand_story: {
    id: 'brand_story',
    name: '品牌故事',
    icon: 'fas fa-heart',
    description: '适用于品牌官网和宣传的温情品牌故事',
    category: 'brand',
    color: 'from-red-500 to-rose-500',
    sections: [
      '品牌起源', '创始人故事', '品牌理念', '发展历程', '未来愿景'
    ],
    prompt: `请撰写一个感人的品牌故事。
品牌名称：[项目名称]
品牌定位：[核心业务]
目标受众：[目标市场]

请直接输出 **HTML 格式** 的内容。
使用 <h2>, <h3>, <p>, <b>, <em>, <blockquote> 等标签。
内容要求：
1. <h2>品牌起源</h2>：品牌诞生的背景和契机
2. <h2>创始人故事</h2>：创始人的初心和创业历程
3. <h2>品牌理念</h2>：核心价值观和品牌使命
4. <h2>发展历程</h2>：重要的里程碑事件（使用时间线形式）
5. <h2>未来愿景</h2>：品牌的发展规划和社会责任

语言要有温度和情感，能够引起读者共鸣，建立品牌认同感。`
  },
  crowdfunding: {
    id: 'crowdfunding',
    name: '众筹文案',
    icon: 'fas fa-hand-holding-usd',
    description: '适用于 Kickstarter、Indiegogo、摩点等众筹平台的项目文案',
    category: 'crowdfunding',
    color: 'from-indigo-500 to-violet-500',
    sections: [
      '项目亮点', '产品介绍', '团队背景', '回报方案', '风险说明'
    ],
    prompt: `请撰写一份有说服力的众筹项目文案。
项目名称：[项目名称]
产品类型：[核心业务]
目标金额：[目标市场]

请直接输出 **HTML 格式** 的内容。
使用 <h2>, <h3>, <p>, <ul>, <table>, <b> 等标签。
内容要求：
1. <h2>项目亮点</h2>：3-5个核心卖点，用数据支撑
2. <h2>产品介绍</h2>：功能特点、技术创新、使用场景
3. <h2>团队背景</h2>：核心成员介绍和过往成就
4. <h2>回报方案</h2>：不同档位的支持回报（使用表格）
5. <h2>项目进度</h2>：时间表和交付计划
6. <h2>风险说明</h2>：潜在风险和应对措施

语言要真诚且有感染力，建立信任感，激发支持欲望。`
  }
};

interface Version {
  id: string;
  timestamp: number;
  content: string;
  summary?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface GenerationOptions {
  tone: string;
  language: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'marketing', name: '营销推广', icon: 'fas fa-ad' },
  { id: 'business', name: '商业计划', icon: 'fas fa-briefcase' },
  { id: 'social', name: '社交媒体', icon: 'fas fa-hashtag' },
  { id: 'press', name: '新闻媒体', icon: 'fas fa-newspaper' },
  { id: 'sales', name: '销售话术', icon: 'fas fa-comments-dollar' },
  { id: 'product', name: '产品文档', icon: 'fas fa-file-alt' },
];

const DEFAULT_TAGS: Tag[] = [
  { id: 'urgent', name: '紧急', color: '#ef4444' },
  { id: 'important', name: '重要', color: '#f59e0b' },
  { id: 'draft', name: '草稿', color: '#3b82f6' },
  { id: 'completed', name: '已完成', color: '#10b981' },
  { id: 'review', name: '需要审核', color: '#8b5cf6' },
];

const TONES = [
  { id: 'professional', label: '专业严谨', icon: 'fas fa-user-tie' },
  { id: 'enthusiastic', label: '热情感染', icon: 'fas fa-fire' },
  { id: 'creative', label: '创意新颖', icon: 'fas fa-lightbulb' },
  { id: 'concise', label: '简洁有力', icon: 'fas fa-compress-alt' },
  { id: 'friendly', label: '友好亲切', icon: 'fas fa-smile' },
  { id: 'authoritative', label: '权威专业', icon: 'fas fa-gavel' },
  { id: 'persuasive', label: '说服力强', icon: 'fas fa-bullhorn' },
  { id: 'narrative', label: '故事性强', icon: 'fas fa-book' },
];

const FORMATS = [
  { id: 'default', label: '默认格式', icon: 'fas fa-file-alt' },
  { id: 'compact', label: '紧凑格式', icon: 'fas fa-compress' },
  { id: 'detailed', label: '详细格式', icon: 'fas fa-file-invoice' },
  { id: 'visual', label: '视觉导向', icon: 'fas fa-image' },
];

const AUDIENCES = [
  { id: 'general', label: '普通大众', icon: 'fas fa-users' },
  { id: 'professional', label: '专业人士', icon: 'fas fa-user-tie' },
  { id: 'young', label: '年轻群体', icon: 'fas fa-child' },
  { id: 'business', label: '商务人士', icon: 'fas fa-briefcase' },
  { id: 'technical', label: '技术人员', icon: 'fas fa-code' },
  { id: 'marketing', label: '营销人员', icon: 'fas fa-ad' },
];

const LENGTHS = [
  { id: 'short', label: '简短', icon: 'fas fa-file-alt', description: '适合社交媒体、广告' },
  { id: 'medium', label: '中等', icon: 'fas fa-file-invoice', description: '适合邮件、简报' },
  { id: 'long', label: '详细', icon: 'fas fa-book', description: '适合报告、计划书' },
];

interface FormatOptions {
  format: string;
  audience: string;
  length: string;
}

const LANGUAGES = [
  { id: 'zh', label: '中文', icon: '🇨🇳' },
  { id: 'en', label: 'English', icon: '🇺🇸' },
];

const QUICK_ACTIONS = [
  { label: '润色文字', prompt: '请润色这段文字，使其更加通顺、优雅，保持原意不变。', icon: 'fa-magic' },
  { label: '扩充内容', prompt: '请扩充这段内容，增加更多细节、例子和数据支持，使论证更充分。', icon: 'fa-expand-alt' },
  { label: '精简摘要', prompt: '请将这段内容概括为一段精炼的摘要，保留核心观点。', icon: 'fa-compress-alt' },
  { label: '纠正语法', prompt: '请检查并纠正文中的语法错误和错别字。', icon: 'fa-spell-check' },
  { label: '翻译为英文', prompt: 'Please translate the content into professional English.', icon: 'fa-language' },
  { label: '优化标题', prompt: '请为这段内容创建3-5个更吸引人的标题选项。', icon: 'fa-heading' },
  { label: '增强CTA', prompt: '请强化文中的行动召唤部分，使其更加有力和明确。', icon: 'fa-bullhorn' },
  { label: '调整语气', prompt: '请调整文章语气，使其更加符合目标受众的阅读习惯。', icon: 'fa-theater-masks' },
  { label: '添加数据', prompt: '请为文中的关键观点添加相关数据和统计信息支持。', icon: 'fa-chart-bar' },
  { label: '改进结构', prompt: '请优化文章结构，使其逻辑更加清晰，层次更加分明。', icon: 'fa-sitemap' },
];

const CONTEXT_AWARE_SUGGESTIONS = {
  social_media: [
    { label: '增加互动元素', prompt: '请在文案中添加更多互动元素，如问题、投票或话题讨论，提高用户参与度。' },
    { label: '优化标签', prompt: '请为文案添加相关的热门标签和话题，提高内容曝光度。' },
    { label: '调整语气', prompt: '请调整文案语气，使其更加符合社交媒体的轻松活泼风格。' },
  ],
  ad_copy: [
    { label: '突出卖点', prompt: '请更加突出产品的核心卖点和竞争优势，增强广告吸引力。' },
    { label: '简化信息', prompt: '请简化广告信息，使其更加简洁有力，快速传达核心价值。' },
    { label: '强化CTA', prompt: '请强化行动召唤部分，使其更加明确和有力，提高转化率。' },
  ],
  marketing_email: [
    { label: '个性化开头', prompt: '请为邮件添加更加个性化的开头，提高打开率和阅读兴趣。' },
    { label: '优化 subject line', prompt: '请为邮件创建3-5个更吸引人的主题行选项。' },
    { label: '调整结构', prompt: '请优化邮件结构，使其更加清晰易读，重点突出。' },
  ],
  press_release: [
    { label: '强化导语', prompt: '请强化新闻稿的导语部分，使其更加简洁有力，包含5W1H要素。' },
    { label: '添加引述', prompt: '请为新闻稿添加相关人员的引述，增加内容可信度。' },
    { label: '规范格式', prompt: '请确保新闻稿格式符合标准，包含必要的结构和信息。' },
  ],
  sales_pitch: [
    { label: '强化痛点', prompt: '请更加突出目标客户的痛点和需求，增强共鸣。' },
    { label: '增加案例', prompt: '请添加相关成功案例或客户见证，提高说服力。' },
    { label: '优化流程', prompt: '请优化销售话术流程，使其更加自然流畅，引导客户决策。' },
  ],
  business_plan: [
    { label: '深化市场分析', prompt: '请进一步深化市场分析部分，增加更多数据和趋势预测。' },
    { label: '完善财务预测', prompt: '请完善财务预测部分，增加更多详细数据和分析。' },
    { label: '强化竞争分析', prompt: '请强化竞争分析部分，增加更多竞品对比和差异化分析。' },
  ],
  ecommerce_product: [
    { label: '优化标题', prompt: '请优化产品标题，使其更具吸引力且包含更多关键词，提高搜索排名。' },
    { label: '强化卖点', prompt: '请强化产品核心卖点，使用更具说服力的表达方式。' },
    { label: '增加场景描述', prompt: '请增加更多使用场景描述，帮助用户想象产品使用情境。' },
  ],
  recruitment: [
    { label: '突出公司优势', prompt: '请更加突出公司的核心优势和发展前景，吸引优秀人才。' },
    { label: '优化职位描述', prompt: '请优化职位描述，使其更加清晰具体，避免过于笼统。' },
    { label: '强调福利待遇', prompt: '请强调有竞争力的薪资福利，增加职位吸引力。' },
  ],
  event_planning: [
    { label: '优化活动亮点', prompt: '请优化活动亮点描述，使其更加吸引目标受众。' },
    { label: '完善流程细节', prompt: '请完善活动流程细节，确保每个环节都清晰明确。' },
    { label: '增加互动环节', prompt: '请增加更多互动环节设计，提高参与者 engagement。' },
  ],
  training_manual: [
    { label: '增加案例', prompt: '请增加更多实际案例，帮助学员更好地理解和应用知识。' },
    { label: '优化练习设计', prompt: '请优化实操练习设计，使其更加贴近实际工作场景。' },
    { label: '完善考核标准', prompt: '请完善考核评估标准，使其更加客观公正。' },
  ],
  brand_story: [
    { label: '强化情感共鸣', prompt: '请强化故事的情感元素，增强与读者的情感共鸣。' },
    { label: '突出品牌特色', prompt: '请更加突出品牌的独特性和差异化优势。' },
    { label: '优化叙事结构', prompt: '请优化品牌故事的叙事结构，使其更加引人入胜。' },
  ],
  crowdfunding: [
    { label: '强化项目价值', prompt: '请强化项目的独特价值和市场潜力，增强支持者信心。' },
    { label: '优化回报方案', prompt: '请优化回报方案设计，使其更具吸引力且合理可行。' },
    { label: '增加信任背书', prompt: '请增加更多团队背景和过往成就，建立信任感。' },
  ],
};

export default function AIWriter() {
  const { isDark } = useTheme();
  
  // State
  const [activeModel, setActiveModel] = useState('qwen');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('business_plan');
  const [currentStep, setCurrentStep] = useState<'input' | 'editor'>('input');
  
  // Input State
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [genOptions, setGenOptions] = useState<GenerationOptions>({ tone: 'professional', language: 'zh' });
  const [formatOptions, setFormatOptions] = useState<FormatOptions>({ format: 'default', audience: 'general', length: 'medium' });
  
  // Editor State
  const [content, setContent] = useState('');
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState(''); // New state for streaming
  const [isGenerating, setIsGenerating] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [stats, setStats] = useState({ words: 0, chars: 0, time: 0 });
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);

  // Draft History Modal State
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [draftsList, setDraftsList] = useState<Draft[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Export & Submit State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Quality Assessment State
  const [showQualityAssessment, setShowQualityAssessment] = useState(false);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [qualityMetrics, setQualityMetrics] = useState<Record<string, any>>({});
  const [qualitySuggestions, setQualitySuggestions] = useState<string[]>([]);
  const [isAssessing, setIsAssessing] = useState(false);
  
  // Keyword Extraction State
  const [showKeywordAnalysis, setShowKeywordAnalysis] = useState(false);
  const [keywords, setKeywords] = useState<Array<{word: string, score: number, density: number}>>([]);
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [isExtractingKeywords, setIsExtractingKeywords] = useState(false);
  
  // Style Analysis State
  const [showStyleAnalysis, setShowStyleAnalysis] = useState(false);
  const [styleMetrics, setStyleMetrics] = useState<Record<string, any>>({});
  const [styleSuggestions, setStyleSuggestions] = useState<string[]>([]);
  const [structureIssues, setStructureIssues] = useState<string[]>([]);
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);

  // Category and Tag State
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [tags, setTags] = useState<Tag[]>(DEFAULT_TAGS);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');

  // Draft Filter State
  const [draftFilter, setDraftFilter] = useState<'all' | 'favorites'>('all');

  // Template Preview State
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  // Template Filter State
  const [templateFilter, setTemplateFilter] = useState<string>('all');

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isKeyboardShortcutEnabled = useRef(true);

  useEffect(() => {
    llmService.setCurrentModel(activeModel);
  }, [activeModel]);

  // Load drafts when modal opens or filter changes
  useEffect(() => {
    const loadDrafts = async () => {
      if (showDraftsModal) {
        try {
          if (draftFilter === 'favorites') {
            const favoriteDrafts = await draftService.getFavoriteDrafts();
            setDraftsList(favoriteDrafts);
          } else {
            const allDrafts = await draftService.getAllDrafts();
            setDraftsList(allDrafts);
          }
        } catch (error) {
          console.error('Failed to load drafts:', error);
          setDraftsList([]);
        }
      }
    };
    
    loadDrafts();
  }, [showDraftsModal, draftFilter]);

  // Helper to save draft to persistent storage
  const saveDraft = async (summary?: string, specificContent?: string) => {
    const textToSave = specificContent || content;
    if (!textToSave) return;

    // Ensure we have a draft ID before saving
    let draftId = currentDraftId;
    if (!draftId) {
      draftId = Date.now().toString();
      setCurrentDraftId(draftId);
    }

    // Use project name as title if available, otherwise template name
    const title = inputs['项目名称'] || currentTemplate.name;

    try {
      await draftService.saveDraft({
        id: draftId,
        title: title,
        templateId: selectedTemplateId,
        templateName: currentTemplate.name,
        content: textToSave,
        summary: summary,
        category: selectedCategory,
        tags: selectedTags
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('保存失败，请重试');
    }
  };

  // 优化自动保存功能，使用防抖
  useEffect(() => {
    if (content && currentStep === 'editor' && !isGenerating) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(async () => {
        await saveDraft('自动保存');
      }, 30000); // 30秒自动保存
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [content, currentStep, isGenerating, saveDraft]);

  // 优化其他事件处理函数
  const handleClear = useCallback(() => {
    if (window.confirm('确定要清空所有内容吗？此操作无法撤销。')) {
      setContent('');
      toast.success('内容已清空');
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!content) {
      toast.error('请先生成内容');
      return;
    }
    
    // Mock submission
    const toastId = toast.loading('正在提交作品至大赛系统...');
    setTimeout(() => {
      toast.dismiss(toastId);
      toast.success('作品已成功提交！', {
        description: '您可以在"我的作品"中查看提交状态。大赛评审结果将通过短信通知。',
        duration: 5000,
      });
    }, 2000);
  }, [content]);

  // Update stats when content changes
  useEffect(() => {
    const plainText = content.replace(/<[^>]*>/g, '');
    const charCount = plainText.length;
    const wordCount = plainText.trim() === '' ? 0 : plainText.trim().split(/\s+/).length;
    const readTime = Math.ceil(charCount / 500); // Rough estimate: 500 chars per minute

    setStats({
      chars: charCount,
      words: wordCount,
      time: readTime
    });
  }, [content]);

  // Scroll to bottom of streaming content
  useEffect(() => {
    if (isGenerating && editorContainerRef.current) {
      editorContainerRef.current.scrollTop = editorContainerRef.current.scrollHeight;
    }
  }, [streamingContent, isGenerating]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isKeyboardShortcutEnabled.current) return;

      // Ctrl/Cmd + S: Save draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDraft('手动保存');
        toast.success('草稿已保存');
      }

      // Ctrl/Cmd + Z: Undo (restore previous version)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && versions.length > 0) {
        e.preventDefault();
        restoreVersion(versions[0]);
      }

      // Ctrl/Cmd + N: New document
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (content && currentStep === 'editor') {
          if (window.confirm('当前有未保存的编辑内容，新建文案将丢失当前内容。确定要继续吗？')) {
            setCurrentStep('input');
          }
        } else {
          setCurrentStep('input');
        }
      }

      // Ctrl/Cmd + E: Export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setShowExportMenu(!showExportMenu);
      }

      // Ctrl/Cmd + H: Show history
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShowHistory(!showHistory);
      }

      // Ctrl/Cmd + Q: Quality assessment
      if ((e.ctrlKey || e.metaKey) && e.key === 'q' && content.trim()) {
        e.preventDefault();
        handleQualityAssessment();
      }

      // Ctrl/Cmd + K: Keyword analysis
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && content.trim()) {
        e.preventDefault();
        handleKeywordExtraction();
      }

      // Ctrl/Cmd + L: Style analysis
      if ((e.ctrlKey || e.metaKey) && e.key === 'l' && content.trim()) {
        e.preventDefault();
        handleStyleAnalysis();
      }

      // ESC: Close modals and menus
      if (e.key === 'Escape') {
        setShowExportMenu(false);
        setShowHistory(false);
        setShowQualityAssessment(false);
        setShowKeywordAnalysis(false);
        setShowStyleAnalysis(false);
        setIsAssistantOpen(false);
        setShowDraftsModal(false);
        setShowMobileMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, currentStep, versions, showExportMenu, showHistory, showQualityAssessment, showKeywordAnalysis, showStyleAnalysis, isAssistantOpen, showDraftsModal, showMobileMenu]);

  const models = [
    { id: 'qwen', name: '通义千问', icon: 'fas fa-brain', color: 'from-purple-500 to-indigo-500' },
    { id: 'kimi', name: 'Kimi', icon: 'fas fa-moon', color: 'from-blue-500 to-cyan-500' },
    { id: 'deepseek', name: 'DeepSeek', icon: 'fas fa-microchip', color: 'from-emerald-500 to-teal-500' }
  ];

  // 使用 useMemo 缓存当前模板
  const currentTemplate = useMemo(() => {
    const cacheKey = selectedTemplateId;
    if (templateCache.has(cacheKey)) {
      return templateCache.get(cacheKey);
    }
    const template = TEMPLATES[selectedTemplateId as keyof typeof TEMPLATES];
    templateCache.set(cacheKey, template);
    return template;
  }, [selectedTemplateId]);

  // 使用 useCallback 缓存事件处理函数
  const handleInputChange = useCallback((key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  // 使用 useCallback 缓存生成的提示词
  const generatePrompt = useCallback(() => {
    let finalPrompt = currentTemplate.prompt;
    Object.keys(inputs).forEach(key => {
      finalPrompt = finalPrompt.replace(`[${key}]`, inputs[key]);
    });
    finalPrompt = finalPrompt.replace(/\[.*?\]/g, '');

    // Append Tone and Language instructions
    finalPrompt += `\n\n**重要要求**：\n`;
    finalPrompt += `- 写作语调：${TONES.find(t => t.id === genOptions.tone)?.label || '专业严谨'}\n`;
    finalPrompt += `- 输出语言：${genOptions.language === 'en' ? 'English' : 'Simplified Chinese (简体中文)'}\n`;
    finalPrompt += `- 文档格式：${FORMATS.find(f => f.id === formatOptions.format)?.label || '默认格式'}\n`;
    finalPrompt += `- 目标受众：${AUDIENCES.find(a => a.id === formatOptions.audience)?.label || '普通大众'}\n`;
    finalPrompt += `- 内容长度：${LENGTHS.find(l => l.id === formatOptions.length)?.label || '中等'}\n`;
    
    if (genOptions.language === 'en') {
      finalPrompt += `- Please ensure the output is in English, but keep the professional structure.\n`;
    }

    // Add format-specific instructions
    if (formatOptions.format === 'compact') {
      finalPrompt += `- 请使用紧凑格式，简洁明了地表达核心信息。\n`;
    } else if (formatOptions.format === 'detailed') {
      finalPrompt += `- 请提供详细格式，包含充分的细节和深度分析。\n`;
    } else if (formatOptions.format === 'visual') {
      finalPrompt += `- 请使用视觉导向格式，增加描述性内容，便于后续添加视觉元素。\n`;
    }

    // Add audience-specific instructions
    if (formatOptions.audience === 'professional') {
      finalPrompt += `- 请使用专业术语和行业标准，适合专业人士阅读。\n`;
    } else if (formatOptions.audience === 'young') {
      finalPrompt += `- 请使用年轻化的语言和表达方式，适合年轻群体。\n`;
    } else if (formatOptions.audience === 'technical') {
      finalPrompt += `- 请提供技术细节和专业说明，适合技术人员阅读。\n`;
    }

    // Add length-specific instructions
    if (formatOptions.length === 'short') {
      finalPrompt += `- 请控制内容长度，保持简洁有力，适合快速阅读。\n`;
    } else if (formatOptions.length === 'long') {
      finalPrompt += `- 请提供详细内容，包含充分的分析和说明，适合深度阅读。\n`;
    }

    return finalPrompt;
  }, [currentTemplate, inputs, genOptions, formatOptions]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setCurrentStep('editor');
    setStreamingContent('');
    setContent(''); // Clear editor content initially
    setChatHistory([]); // Clear chat history for new generation
    const newDraftId = Date.now().toString(); // Generate draft ID directly
    setCurrentDraftId(newDraftId); // Start a new draft ID
    
    const prompt = generatePrompt();
    let accumulatedContent = '';

    // Add initial system message to chat (hidden or visible)
    const initialUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `基于模板"${currentTemplate.name}"生成初始草稿。语调：${TONES.find(t => t.id === genOptions.tone)?.label}。`,
      timestamp: Date.now()
    };
    setChatHistory([initialUserMessage]);

    try {
      await llmService.directGenerateResponse(prompt, {
        onDelta: (chunk) => {
          accumulatedContent += chunk;
          setStreamingContent(accumulatedContent);
        }
      });
      
      const cleanContent = accumulatedContent.replace(/```html/g, '').replace(/```/g, '');
      
      // 确保内容设置成功
      setContent(cleanContent);
      
      // 如果没有生成任何内容，设置一个默认的提示信息
      if (!cleanContent) {
        setContent('<p>AI生成失败，请检查网络连接后重试，或尝试调整生成参数。</p>');
      }
      // 由于RichTextEditor组件已经通过editorRef强制更新编辑器内容
      // 这里不再需要setTimeout，避免引入不必要的延迟
      
      // Save initial draft with the generated ID
      const title = inputs['项目名称'] || currentTemplate.name;
      draftService.saveDraft({
        id: newDraftId,
        title: title,
        templateId: selectedTemplateId,
        templateName: currentTemplate.name,
        content: cleanContent,
        summary: 'AI 生成初始版本'
      });
      
      // Add AI response to chat
      setChatHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '已为您生成初始草稿。您可以在此提出修改意见，例如"让语气更正式一点"或"扩充市场分析部分"。',
        timestamp: Date.now()
      }]);

      toast.success('生成完成！您可以直接编辑内容或通过右侧助手进行修改。');
    } catch (error) {
      console.error('Generation failed:', error);
      // 提供更详细的错误信息
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast.error(`生成失败，请重试。错误：${errorMessage}`);
      // 确保即使出错也能回到编辑器视图
      setCurrentStep('editor');
      // 提供错误状态的内容，避免编辑器空白
      setContent(`<p>生成过程中出现错误：${errorMessage}</p><p>请检查网络连接后重试，或尝试调整生成参数。</p>`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleModification = async (customPrompt?: string) => {
    const inputToUse = customPrompt || chatInput;
    if (!inputToUse.trim() || isGenerating) return;

    const userInstruction = inputToUse;
    setChatInput('');
    setIsGenerating(true);

    // Add user message to chat
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInstruction,
      timestamp: Date.now()
    };
    setChatHistory(prev => [...prev, newUserMsg]);

    // Construct modification prompt with better context
    const modificationPrompt = `
You are a professional editor assistant specialized in ${currentTemplate.name} content.

Current Document Content (HTML):
${content}

Template Type: ${currentTemplate.name}
Template Description: ${currentTemplate.description}

User Instruction:
${userInstruction}

Please rewrite the document content to satisfy the user instruction.

IMPORTANT GUIDELINES:
1. Output ONLY the new HTML content. Do not output explanations outside the HTML.
2. Maintain the existing HTML structure and formatting unless asked to change.
3. Keep the tone consistent with the document's purpose and target audience.
4. For ${currentTemplate.name}, ensure the content aligns with industry best practices.
5. If the instruction is about specific sections, focus on those areas while preserving the rest.
6. When adding new content, ensure it integrates seamlessly with the existing text.
7. Maintain professional quality and attention to detail.
`;

    let accumulatedContent = '';
    const toastId = toast.loading('AI 正在修改文档...');

    try {
      await llmService.directGenerateResponse(modificationPrompt, {
        onDelta: (chunk) => {
          accumulatedContent += chunk;
        }
      });

      const cleanContent = accumulatedContent.replace(/```html/g, '').replace(/```/g, '');
      
      // Save old version before applying new one
      saveVersion(content, '修改前备份');
      
      setContent(cleanContent);
      
      // Ensure we have a draft ID before saving
      let draftId = currentDraftId;
      if (!draftId) {
        draftId = Date.now().toString();
        setCurrentDraftId(draftId);
      }
      
      // Save draft with the ensured ID
      const title = inputs['项目名称'] || currentTemplate.name;
      draftService.saveDraft({
        id: draftId,
        title: title,
        templateId: selectedTemplateId,
        templateName: currentTemplate.name,
        content: cleanContent,
        summary: `AI 修改: ${userInstruction.substring(0, 10)}...`
      });
      
      saveVersion(cleanContent, `AI 修改: ${userInstruction.substring(0, 10)}...`);

      setChatHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '已根据您的要求完成修改。如有其他调整需要，请随时告诉我。',
        timestamp: Date.now()
      }]);

      toast.success('修改完成', { id: toastId });
    } catch (error) {
      console.error('Modification failed:', error);
      toast.error('修改失败', { id: toastId });
      setChatHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '抱歉，修改过程中遇到了问题，请重试。',
        timestamp: Date.now()
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Version control for current session
  const saveVersion = (text: string, summary: string = '手动保存') => {
    const newVersion: Version = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      content: text,
      summary
    };
    setVersions(prev => [newVersion, ...prev]);
    setLastSaved(new Date());
  };

  const restoreVersion = (version: Version) => {
    if (window.confirm('确定要恢复到此版本吗？当前未保存的修改将丢失。')) {
      setContent(version.content);
      saveVersion(version.content, `恢复至 ${new Date(version.timestamp).toLocaleTimeString()} 的版本`);
      setShowHistory(false);
      toast.success('版本已恢复');
    }
  };

  const loadDraft = (draft: Draft) => {
    if (content && currentStep === 'editor') {
      if (!window.confirm('当前有未保存的编辑内容，加载草稿将覆盖当前内容。确定要继续吗？')) {
        return;
      }
    }
    
    setContent(draft.content);
    setCurrentDraftId(draft.id);
    setSelectedTemplateId(draft.templateId);
    // Try to extract project name from title if possible, or just reset inputs
    setInputs(prev => ({ ...prev, '项目名称': draft.title !== draft.templateName ? draft.title : '' }));
    
    setCurrentStep('editor');
    setShowDraftsModal(false);
    toast.success('草稿已加载');
  };

  const deleteDraft = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这条历史记录吗？')) {
      try {
        await draftService.deleteDraft(id);
        if (draftFilter === 'favorites') {
          const favoriteDrafts = await draftService.getFavoriteDrafts();
          setDraftsList(favoriteDrafts);
        } else {
          const allDrafts = await draftService.getAllDrafts();
          setDraftsList(allDrafts);
        }
        toast.success('记录已删除');
      } catch (error) {
        console.error('Failed to delete draft:', error);
        toast.error('删除草稿失败');
      }
    }
  };

  const toggleFavoriteDraft = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const updatedDraft = await draftService.toggleFavorite(id);
      if (updatedDraft) {
        if (draftFilter === 'favorites') {
          const favoriteDrafts = await draftService.getFavoriteDrafts();
          setDraftsList(favoriteDrafts);
        } else {
          const allDrafts = await draftService.getAllDrafts();
          setDraftsList(allDrafts);
        }
        toast.success(updatedDraft.isFavorite ? '已添加到收藏' : '已取消收藏');
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('操作失败');
    }
  };

  // Category and Tag Management
  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId) 
        : [...prev, tagId]
    );
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) {
      toast.error('请输入标签名称');
      return;
    }

    const newTag: Tag = {
      id: Date.now().toString(),
      name: newTagName.trim(),
      color: newTagColor
    };

    setTags(prev => [...prev, newTag]);
    setNewTagName('');
    setNewTagColor('#3b82f6');
    setShowTagModal(false);
    toast.success('标签已添加');
  };

  const handleDeleteTag = (tagId: string) => {
    setTags(prev => prev.filter(tag => tag.id !== tagId));
    setSelectedTags(prev => prev.filter(id => id !== tagId));
    toast.success('标签已删除');
  };



  // 使用 useCallback 缓存质量评估函数
  const handleQualityAssessment = useCallback(async () => {
    if (!content.trim()) {
      toast.error('请先生成或输入文案内容');
      return;
    }

    setIsAssessing(true);
    setShowQualityAssessment(true);
    const toastId = toast.loading('正在评估文案质量...');

    try {
      const assessmentPrompt = `
请对以下文案进行全面质量评估，并提供详细的分析报告。

文案内容：
${content}

评估要求：
1. 总体评分：0-100分
2. 详细指标评分：
   - 吸引力（标题和开头）
   - 内容质量（信息准确性、深度）
   - 结构逻辑（组织架构、流程）
   - 语言表达（流畅度、专业性）
   - 目标适配（符合目标受众）
   - 行动召唤（清晰度、有效性）
3. 优势分析：列出文案的主要优点
4. 改进建议：提供具体、可操作的改进建议
5. 优化方向：指出需要重点关注的方面

请直接输出 **HTML 格式** 的内容，包含以下结构：
- <h2>总体评分</h2>：显示总分和简短评价
- <h2>详细指标</h2>：使用表格展示各项指标评分
- <h2>优势分析</h2>：列出主要优点
- <h2>改进建议</h2>：提供具体建议
- <h2>优化方向</h2>：指出重点关注方面
`;

      const assessmentResult = await llmService.directGenerateResponse(assessmentPrompt);
      const cleanResult = assessmentResult.replace(/```html/g, '').replace(/```/g, '');

      // 提取评分（这里简化处理，实际项目中可能需要更精确的解析）
      const scoreMatch = cleanResult.match(/总体评分.*?(\d+)分/);
      if (scoreMatch) {
        setQualityScore(parseInt(scoreMatch[1]));
      }

      setQualitySuggestions([
        '优化标题吸引力',
        '增强内容深度',
        '改善结构逻辑',
        '提升语言表达',
        '加强行动召唤'
      ]);

      setQualityMetrics({
        attractiveness: 85,
        contentQuality: 78,
        structure: 82,
        language: 88,
        targetFit: 75,
        cta: 80
      });

      toast.success('质量评估完成', { id: toastId, duration: 2000 });
    } catch (error) {
      console.error('Quality assessment failed:', error);
      toast.error('评估失败，请重试', { id: toastId, duration: 3000 });
    } finally {
      setIsAssessing(false);
    }
  }, [content]);

  const handleKeywordExtraction = async () => {
    if (!content.trim()) {
      toast.error('请先生成或输入文案内容');
      return;
    }

    setIsExtractingKeywords(true);
    setShowKeywordAnalysis(true);
    const toastId = toast.loading('正在提取关键词...');

    try {
      const keywordPrompt = `
请对以下文案进行关键词分析，并提供优化建议。

文案内容：
${content}

分析要求：
1. 提取主要关键词（10-15个）
2. 计算每个关键词的重要性评分（0-100）
3. 分析关键词密度（出现频率）
4. 评估关键词分布合理性
5. 提供关键词优化建议
6. 推荐可添加的相关关键词

请直接输出 **HTML 格式** 的内容，包含以下结构：
- <h2>主要关键词</h2>：使用表格展示关键词、重要性和密度
- <h2>关键词分析</h2>：评估关键词分布和合理性
- <h2>优化建议</h2>：提供具体的关键词优化建议
- <h2>推荐关键词</h2>：列出可添加的相关关键词
`;

      const keywordResult = await llmService.directGenerateResponse(keywordPrompt);
      const cleanResult = keywordResult.replace(/```html/g, '').replace(/```/g, '');

      // 模拟关键词数据（实际项目中可从API结果中提取）
      setKeywords([
        { word: 'AI', score: 95, density: 2.5 },
        { word: '文案', score: 90, density: 3.2 },
        { word: '营销', score: 85, density: 1.8 },
        { word: '智能', score: 80, density: 1.5 },
        { word: '效率', score: 75, density: 1.2 },
        { word: '创新', score: 70, density: 0.9 },
        { word: '技术', score: 65, density: 1.1 },
        { word: '用户', score: 60, density: 1.3 }
      ]);

      setKeywordSuggestions([
        '增加核心关键词密度至2-3%',
        '优化关键词分布，避免堆砌',
        '添加长尾关键词提升相关性',
        '确保标题和开头包含主要关键词',
        '使用同义词增强关键词覆盖'
      ]);

      toast.success('关键词分析完成', { id: toastId, duration: 2000 });
    } catch (error) {
      console.error('Keyword extraction failed:', error);
      toast.error('分析失败，请重试', { id: toastId, duration: 3000 });
    } finally {
      setIsExtractingKeywords(false);
    }
  };

  const handleStyleAnalysis = async () => {
    if (!content.trim()) {
      toast.error('请先生成或输入文案内容');
      return;
    }

    setIsAnalyzingStyle(true);
    setShowStyleAnalysis(true);
    const toastId = toast.loading('正在分析文案风格...');

    try {
      const stylePrompt = `
请对以下文案进行风格分析和结构评估，并提供调整建议。

文案内容：
${content}

分析要求：
1. 风格特点分析：
   - 语言风格（正式/非正式、学术/口语等）
   - 句式结构（长句/短句、复杂/简单）
   - 修辞手法（比喻、排比、反问等）
   - 情感表达（客观/主观、理性/感性）
2. 结构评估：
   - 整体结构合理性
   - 段落组织逻辑性
   - 过渡衔接自然度
   - 开头结尾有效性
3. 风格建议：
   - 如何强化风格特点
   - 如何调整语言表达
   - 如何增强感染力
4. 结构建议：
   - 如何优化整体结构
   - 如何改善段落组织
   - 如何加强过渡衔接

请直接输出 **HTML 格式** 的内容，包含以下结构：
- <h2>风格分析</h2>：评估语言风格、句式结构等
- <h2>结构评估</h2>：分析整体结构和段落组织
- <h2>风格建议</h2>：提供风格调整建议
- <h2>结构建议</h2>：提供结构优化建议
`;

      const styleResult = await llmService.directGenerateResponse(stylePrompt);
      const cleanResult = styleResult.replace(/```html/g, '').replace(/```/g, '');

      // 模拟风格分析数据
      setStyleMetrics({
        formality: 75,
        sentenceComplexity: 60,
        rhetoricalDevices: 45,
        emotionalExpression: 65,
        structureCoherence: 80,
        paragraphOrganization: 70,
        transitionNaturalness: 65,
        introductionConclusion: 75
      });

      setStyleSuggestions([
        '增加更多修辞手法，如比喻和排比，增强语言感染力',
        '适当调整句式结构，增加短句比例，提高可读性',
        '保持语言风格一致性，避免风格切换过于频繁',
        '增强情感表达，添加更多情感共鸣点'
      ]);

      setStructureIssues([
        '部分段落过长，建议拆分为多个短段落',
        '过渡衔接不够自然，建议添加过渡句',
        '结尾部分可以更有力，强化核心信息',
        '整体结构可以更加紧凑，突出重点'
      ]);

      toast.success('风格分析完成', { id: toastId, duration: 2000 });
    } catch (error) {
      console.error('Style analysis failed:', error);
      toast.error('分析失败，请重试', { id: toastId, duration: 3000 });
    } finally {
      setIsAnalyzingStyle(false);
    }
  };

  // Export & Submit Handlers
  const handleExport = async (format: 'html' | 'print' | 'markdown' | 'text' | 'word') => {
    setShowExportMenu(false);
    if (format === 'print') {
      window.print();
    } else if (format === 'html') {
      const element = document.createElement("a");
      const file = new Blob([content], {type: 'text/html'});
      element.href = URL.createObjectURL(file);
      element.download = `${inputs['项目名称'] || 'document'}.html`;
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
      document.body.removeChild(element);
    } else if (format === 'markdown') {
      // Convert HTML to Markdown (simplified version)
      let markdownContent = content
        .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
        .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
        .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
        .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
        .replace(/<b>(.*?)<\/b>/g, '**$1**')
        .replace(/<em>(.*?)<\/em>/g, '*$1*')
        .replace(/<ul>([\s\S]*?)<\/ul>/g, (match, listContent) => {
          return listContent
            .replace(/<li>(.*?)<\/li>/g, '- $1\n')
            .trim() + '\n\n';
        })
        .replace(/<ol>([\s\S]*?)<\/ol>/g, (match, listContent) => {
          let index = 1;
          return listContent
            .replace(/<li>(.*?)<\/li>/g, () => `${index++}. $1\n`)
            .trim() + '\n\n';
        })
        .replace(/<table[^>]*>([\s\S]*?)<\/table>/g, (match, tableContent) => {
          let markdownTable = '';
          const rows = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];
          
          rows.forEach((row, rowIndex) => {
            const cells = row.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g) || [];
            const cellContents = cells.map(cell => {
              return cell.replace(/<[^>]*>/g, '').trim();
            });
            markdownTable += cellContents.join(' | ') + '\n';
            
            if (rowIndex === 0) {
              markdownTable += cellContents.map(() => '---').join(' | ') + '\n';
            }
          });
          
          return markdownTable + '\n';
        })
        .replace(/<[^>]*>/g, '')
        .trim();

      const element = document.createElement("a");
      const file = new Blob([markdownContent], {type: 'text/markdown'});
      element.href = URL.createObjectURL(file);
      element.download = `${inputs['项目名称'] || 'document'}.md`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else if (format === 'text') {
      // Extract plain text from HTML
      const plainText = content
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const element = document.createElement("a");
      const file = new Blob([plainText], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${inputs['项目名称'] || 'document'}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else if (format === 'word') {
      // 导出为Word文档
      try {
        const toastId = toast.loading('正在生成Word文档...');
        await exportToWord(content, inputs['项目名称'] || 'document');
        toast.success('Word文档已生成', { id: toastId });
      } catch (error) {
        console.error('Word导出失败:', error);
        toast.error('Word文档生成失败，请重试');
      }
    }
  };



  const renderInputFields = () => {
    const commonFields: {key: string, label: string, placeholder: string, type?: string}[] = [
      { key: '项目名称', label: '项目/公司名称', placeholder: '例如：未来科技' },
      { key: '核心业务', label: '核心业务/产品', placeholder: '例如：AI驱动的教育平台' },
    ];

    let specificFields: {key: string, label: string, placeholder: string, type?: string}[] = [];

    if (selectedTemplateId === 'business_plan') {
      specificFields = [
        { key: '目标市场', label: '目标市场', placeholder: '例如：K12教育市场' },
        { key: '竞争优势', label: '核心竞争优势', placeholder: '例如：独家算法、海量数据' }
      ];
    } else if (selectedTemplateId === 'pitch_deck') {
      specificFields = [
        { key: '一句话介绍', label: '一句话介绍 (Slogan)', placeholder: '例如：让学习更高效' }
      ];
    } else if (selectedTemplateId === 'market_analysis') {
      specificFields = [
        { key: '行业/领域', label: '分析行业', placeholder: '例如：新能源汽车' },
        { key: '关注焦点', label: '重点关注方向', placeholder: '例如：电池技术革新' }
      ];
    } else if (selectedTemplateId === 'prd') {
      specificFields = [
        { key: '产品名称', label: '产品名称', placeholder: '例如：AI写作助手' },
        { key: '核心功能', label: '核心功能', placeholder: '例如：多模态生成、实时协作' }
      ];
    } else if (selectedTemplateId === 'social_media') {
      specificFields = [
        { key: '目标市场', label: '目标受众', placeholder: '例如：年轻女性、职场人士' },
        { key: '产品名称', label: '产品/服务', placeholder: '例如：智能健身设备' }
      ];
    } else if (selectedTemplateId === 'ad_copy') {
      specificFields = [
        { key: '目标市场', label: '目标受众', placeholder: '例如：年轻女性、职场人士' },
        { key: '产品名称', label: '产品/服务', placeholder: '例如：智能健身设备' }
      ];
    } else if (selectedTemplateId === 'marketing_email') {
      specificFields = [
        { key: '目标市场', label: '目标受众', placeholder: '例如：现有客户、潜在客户' },
        { key: '项目名称', label: '主要信息', placeholder: '例如：新品发布、促销活动' }
      ];
    } else if (selectedTemplateId === 'press_release') {
      specificFields = [
        { key: '目标市场', label: '目标媒体', placeholder: '例如：科技媒体、财经媒体' },
        { key: '核心业务', label: '核心内容', placeholder: '例如：新产品发布、融资消息' }
      ];
    } else if (selectedTemplateId === 'sales_pitch') {
      specificFields = [
        { key: '目标市场', label: '目标客户', placeholder: '例如：中小企业主、个人消费者' },
        { key: '产品名称', label: '产品/服务', placeholder: '例如：企业管理软件' }
      ];
    } else if (selectedTemplateId === 'ecommerce_product') {
      specificFields = [
        { key: '产品名称', label: '产品名称', placeholder: '例如：智能蓝牙耳机' },
        { key: '目标市场', label: '目标人群', placeholder: '例如：运动爱好者、上班族' }
      ];
    } else if (selectedTemplateId === 'recruitment') {
      specificFields = [
        { key: '产品名称', label: '职位名称', placeholder: '例如：高级前端工程师' },
        { key: '项目名称', label: '公司名称', placeholder: '例如：字节跳动' },
        { key: '核心业务', label: '行业领域', placeholder: '例如：互联网/在线教育' }
      ];
    } else if (selectedTemplateId === 'event_planning') {
      specificFields = [
        { key: '项目名称', label: '活动名称', placeholder: '例如：2024春季新品发布会' },
        { key: '核心业务', label: '活动类型', placeholder: '例如：产品发布会/年会/展览' },
        { key: '目标市场', label: '目标人群', placeholder: '例如：潜在客户、行业媒体' }
      ];
    } else if (selectedTemplateId === 'training_manual') {
      specificFields = [
        { key: '产品名称', label: '培训主题', placeholder: '例如：新员工入职培训' },
        { key: '目标市场', label: '培训对象', placeholder: '例如：新入职员工' },
        { key: '核心业务', label: '培训时长', placeholder: '例如：2天/16课时' }
      ];
    } else if (selectedTemplateId === 'brand_story') {
      specificFields = [
        { key: '项目名称', label: '品牌名称', placeholder: '例如：茶颜悦色' },
        { key: '核心业务', label: '品牌定位', placeholder: '例如：新中式茶饮' },
        { key: '目标市场', label: '目标受众', placeholder: '例如：年轻白领、学生群体' }
      ];
    } else if (selectedTemplateId === 'crowdfunding') {
      specificFields = [
        { key: '项目名称', label: '项目名称', placeholder: '例如：智能便携咖啡机' },
        { key: '核心业务', label: '产品类型', placeholder: '例如：智能硬件/文创产品' },
        { key: '目标市场', label: '目标金额', placeholder: '例如：50万元' }
      ];
    }

    return (
      <div className="space-y-4">
        {[...commonFields, ...specificFields].map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={inputs[field.key] || ''}
                onChange={e => handleInputChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'
                }`}
                rows={3}
              />
            ) : (
              <input
                type="text"
                value={inputs[field.key] || ''}
                onChange={e => handleInputChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'
                }`}
              />
            )}
          </div>
        ))}

        {/* Options: Tone & Language */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">写作语调</label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map(tone => (
                <button
                  key={tone.id}
                  onClick={() => setGenOptions(prev => ({ ...prev, tone: tone.id }))}
                  className={`p-2 text-xs rounded-lg border transition-all flex flex-col items-center justify-center gap-1 ${genOptions.tone === tone.id ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-gray-600'}`}
                >
                  <i className={tone.icon}></i>
                  {tone.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">输出语言</label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setGenOptions(prev => ({ ...prev, language: lang.id }))}
                  className={`p-2 text-xs rounded-lg border transition-all flex flex-col items-center justify-center gap-1 ${genOptions.language === lang.id ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-gray-600'}`}
                >
                  <span className="text-base">{lang.icon}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">高级选项</label>
          
          {/* Format */}
          <div className="mb-4">
            <label className="block text-xs font-medium mb-2 text-gray-500 dark:text-gray-400">文档格式</label>
            <div className="grid grid-cols-4 gap-2">
              {FORMATS.map(format => (
                <button
                  key={format.id}
                  onClick={() => setFormatOptions(prev => ({ ...prev, format: format.id }))}
                  className={`p-2 text-xs rounded-lg border transition-all flex flex-col items-center justify-center gap-1 ${formatOptions.format === format.id ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-gray-600'}`}
                >
                  <i className={format.icon}></i>
                  {format.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audience */}
          <div className="mb-4">
            <label className="block text-xs font-medium mb-2 text-gray-500 dark:text-gray-400">目标受众</label>
            <div className="grid grid-cols-3 gap-2">
              {AUDIENCES.map(audience => (
                <button
                  key={audience.id}
                  onClick={() => setFormatOptions(prev => ({ ...prev, audience: audience.id }))}
                  className={`p-2 text-xs rounded-lg border transition-all flex flex-col items-center justify-center gap-1 ${formatOptions.audience === audience.id ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-gray-600'}`}
                >
                  <i className={audience.icon}></i>
                  {audience.label}
                </button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div>
            <label className="block text-xs font-medium mb-2 text-gray-500 dark:text-gray-400">内容长度</label>
            <div className="grid grid-cols-3 gap-2">
              {LENGTHS.map(length => (
                <button
                  key={length.id}
                  onClick={() => setFormatOptions(prev => ({ ...prev, length: length.id }))}
                  className={`p-2 text-xs rounded-lg border transition-all flex flex-col items-center justify-center gap-1 ${formatOptions.length === length.id ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-gray-600'}`}
                  title={length.description}
                >
                  <i className={length.icon}></i>
                  {length.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
      <div className={`flex flex-col h-full min-h-screen ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {/* Print Styles */}
        <style>
          {`
            @media print {
              body * {
                visibility: hidden;
              }
              #editor-content-area, #editor-content-area * {
                visibility: visible;
              }
              #editor-content-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 20px;
                background: white;
                color: black;
              }
            }
            
            @media (max-width: 768px) {
              .mobile-hidden {
                display: none !important;
              }
              
              .mobile-full-width {
                width: 100% !important;
              }
              
              .mobile-flex-col {
                flex-direction: column !important;
              }
              
              .mobile-gap-2 {
                gap: 0.5rem !important;
              }
              
              .mobile-p-4 {
                padding: 1rem !important;
              }
              
              .mobile-text-sm {
                font-size: 0.875rem !important;
              }
              
              .mobile-min-h-screen {
                min-height: 100vh !important;
              }
            }
          `}
        </style>

      {/* Header / Toolbar */}
      <div className={`flex-shrink-0 px-4 py-3 border-b flex items-center justify-between ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} md:px-6`}>
        <div className="flex items-center gap-2 md:gap-4">
          <h1 className="text-sm md:text-lg font-bold flex items-center gap-2">
            <i className="fas fa-pen-nib text-blue-500"></i>
            AI 智作文案
          </h1>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 hidden md:flex">
            {models.map(model => (
              <button
                key={model.id}
                onClick={() => setActiveModel(model.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${activeModel === model.id ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <i className={model.icon}></i>
                {model.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* History Button - Visible in both steps */}
          <button
            onClick={() => setShowDraftsModal(true)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
              showDraftsModal
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <i className="fas fa-history"></i>
            历史记录
          </button>

          {currentStep === 'editor' && !isGenerating && (
            <>
              <span className="text-xs text-gray-400 hidden lg:inline">
                {lastSaved ? `上次保存: ${lastSaved.toLocaleTimeString()}` : '未保存'}
              </span>
              
              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className="px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
              >
                <i className="fas fa-paper-plane"></i>
                一键参赛
              </button>

              {/* Export Button */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
                >
                  <i className="fas fa-download"></i>
                  导出
                </button>
                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={`absolute top-full right-0 mt-2 w-40 rounded-xl shadow-xl border z-50 overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                    >
                      <button onClick={() => handleExport('html')} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors`}>
                        <i className="fab fa-html5 text-orange-500"></i> 导出 HTML
                      </button>
                      <button onClick={() => handleExport('word')} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors`}>
                        <i className="fas fa-file-word text-blue-600"></i> 导出 Word
                      </button>
                      <button onClick={() => handleExport('markdown')} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors`}>
                        <i className="fab fa-markdown text-blue-500"></i> 导出 Markdown
                      </button>
                      <button onClick={() => handleExport('text')} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors`}>
                        <i className="fas fa-file-alt text-gray-500"></i> 导出纯文本
                      </button>
                      <button onClick={() => handleExport('print')} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors`}>
                        <i className="fas fa-file-pdf text-red-500"></i> 导出 PDF/打印
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>

              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition-colors"
                title="清空内容"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
              <button
                onClick={() => saveDraft('手动保存')}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="保存草稿"
              >
                <i className="fas fa-save"></i>
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${showHistory ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'}`}
                title="版本历史"
              >
                <i className="fas fa-code-branch"></i>
              </button>
              <button
                onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${isAssistantOpen ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'}`}
                title="AI 助手"
              >
                <i className="fas fa-robot"></i>
              </button>
              <button
                onClick={() => setCurrentStep('input')}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="新建文案"
              >
                <i className="fas fa-plus"></i>
              </button>
              <button
                onClick={handleQualityAssessment}
                disabled={!content.trim() || isAssessing}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${showQualityAssessment ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'}`}
                title="质量评估"
              >
                <i className="fas fa-star-half-alt"></i>
              </button>
              <button
                onClick={handleKeywordExtraction}
                disabled={!content.trim() || isExtractingKeywords}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${showKeywordAnalysis ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'}`}
                title="关键词分析"
              >
                <i className="fas fa-tags"></i>
              </button>
              <button
                onClick={handleStyleAnalysis}
                disabled={!content.trim() || isAnalyzingStyle}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${showStyleAnalysis ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'}`}
                title="风格分析"
              >
                <i className="fas fa-palette"></i>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {currentStep === 'input' && (
          <div className="flex w-full h-full">
            {/* Left Side - Template Selection (50%) */}
            <div className={`w-1/2 border-r overflow-y-auto ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className="p-6">
                {/* Template Categories Filter */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">模板分类</h3>
                    {templateFilter !== 'all' && (
                      <button 
                        onClick={() => setTemplateFilter('all')}
                        className="text-xs text-blue-500 hover:text-blue-600"
                      >
                        清除筛选
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
                      <button
                        key={key}
                        onClick={() => setTemplateFilter(templateFilter === key ? 'all' : key)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
                          templateFilter === key
                            ? `bg-gradient-to-r ${category.color} text-white shadow-sm`
                            : isDark
                              ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <i className={`${category.icon} text-[10px]`}></i>
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Template Grid - 2 Columns */}
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {templateFilter === 'all' ? '所有模板' : TEMPLATE_CATEGORIES[templateFilter as keyof typeof TEMPLATE_CATEGORIES]?.name}
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({Object.values(TEMPLATES).filter(t => templateFilter === 'all' || t.category === templateFilter).length})
                  </span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(TEMPLATES)
                    .filter(template => templateFilter === 'all' || template.category === templateFilter)
                    .map((template, idx) => (
                      <motion.div
                        key={template.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        onClick={() => setSelectedTemplateId(template.id)}
                        className={`relative group cursor-pointer rounded-xl transition-all duration-200 overflow-hidden ${
                          selectedTemplateId === template.id
                            ? 'ring-2 ring-blue-500 shadow-lg bg-blue-50 dark:bg-blue-900/20'
                            : `hover:shadow-md ${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'}`
                        }`}
                      >
                        {/* Top Color Bar */}
                        <div className={`h-1.5 bg-gradient-to-r ${template.color}`}></div>
                        
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${template.color} text-white shadow-md flex-shrink-0`}>
                              <i className={`${template.icon} text-sm`}></i>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold text-sm mb-1 ${selectedTemplateId === template.id ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                {template.name}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                {template.description}
                              </p>
                            </div>
                            
                            {/* Selected Check */}
                            {selectedTemplateId === template.id && (
                              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-check text-xs"></i>
                              </div>
                            )}
                          </div>
                          
                          {/* Sections Preview */}
                          <div className="flex flex-wrap gap-1 mt-3">
                            {template.sections.slice(0, 3).map((section, idx) => (
                              <span 
                                key={idx}
                                className={`text-[10px] px-2 py-0.5 rounded ${isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-500'}`}
                              >
                                {section}
                              </span>
                            ))}
                            {template.sections.length > 3 && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-700/50 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                                +{template.sections.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Preview Button - On Hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewTemplate(template.id);
                          }}
                          className={`absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all opacity-0 group-hover:opacity-100 ${
                            isDark ? 'bg-gray-700 text-gray-400 hover:text-blue-400' : 'bg-gray-100 text-gray-500 hover:text-blue-500'
                          }`}
                          title="预览模板"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </motion.div>
                    ))}
                </div>
              </div>
            </div>

            {/* Right Side - Input Form (50%) */}
            <div className={`w-1/2 overflow-y-auto ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div className="max-w-3xl mx-auto p-8">
                {/* Template Header Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border p-6 mb-6 shadow-sm overflow-hidden relative ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  {/* Gradient Header Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${currentTemplate.color}`}></div>
                  
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${currentTemplate.color} text-white shadow-lg`}>
                      <i className={`${currentTemplate.icon} text-xl`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-2xl font-bold">{currentTemplate.name}</h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                          {TEMPLATE_CATEGORIES[currentTemplate.category as keyof typeof TEMPLATE_CATEGORIES]?.name}
                        </span>
                      </div>
                      <p className="text-gray-500">{currentTemplate.description}</p>
                      
                      {/* Sections Preview */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {currentTemplate.sections.map((section, idx) => (
                          <span key={idx} className={`text-xs px-2 py-1 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                            <i className="fas fa-check-circle text-green-500 mr-1 text-[10px]"></i>
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Input Form Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`rounded-2xl border p-6 shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                      <i className="fas fa-keyboard text-blue-500"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">填写关键信息</h3>
                      <p className="text-xs text-gray-500">完善以下信息，AI将为您生成专业文案</p>
                    </div>
                  </div>
                  
                  <div className="space-y-5">
                    {renderInputFields()}
                  </div>

                  {/* Generate Button */}
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="w-full py-4 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transform transition-all hover:-translate-y-0.5 hover:shadow-xl flex items-center justify-center gap-3"
                    >
                      {isGenerating ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          <span>AI 正在创作中...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-wand-magic-sparkles text-lg"></i>
                          <span>开始智能生成</span>
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-3">
                      <i className="fas fa-lightbulb text-yellow-500 mr-1"></i>
                      提示：信息越详细，生成的文案质量越高
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'editor' && (
          <div className="flex w-full h-full relative">
            <div className="flex-1 flex flex-col h-full min-w-0" style={{ flexGrow: 1 }}>
              {/* ID added for print styling targeting */}
              <div id="editor-content-area" className="flex-1 overflow-hidden relative" ref={editorContainerRef} style={{ width: '100%' }}>
                {/* Streaming Preview or Rich Text Editor */}
                {/* 无论什么状态都显示编辑器，确保用户始终能看到编辑界面 */}
                <div className={`h-full ${isDark ? 'tinymce-dark' : ''}`} style={{ width: '100%' }}>
                  <RichTextEditor
                    content={content}
                    onChange={setContent}
                    placeholder="AI生成的内容将显示在这里..."
                    disabled={false}
                    height="100%"
                  />
                  {/* 生成中提示 */}
                  {isGenerating && (
                    <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>AI 正在撰写中...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Bar */}
              {!isGenerating && (
                <div className={`px-4 py-2 border-t ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <span>字数: <strong className={isDark ? 'text-gray-300' : 'text-gray-700'}>{stats.words}</strong></span>
                    <span>字符: <strong className={isDark ? 'text-gray-300' : 'text-gray-700'}>{stats.chars}</strong></span>
                    <span>预计阅读: <strong className={isDark ? 'text-gray-300' : 'text-gray-700'}>{stats.time}</strong> 分钟</span>
                    
                    {/* Category Selection */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>分类:</span>
                      <div className="flex gap-1 flex-wrap">
                        {DEFAULT_CATEGORIES.map(category => (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(prev => prev === category.id ? '' : category.id)}
                            className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-all ${selectedCategory === category.id ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                          >
                            <i className={category.icon}></i>
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Tag Management */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>标签:</span>
                      <div className="flex gap-1 flex-wrap">
                        {tags.map(tag => (
                          <div key={tag.id} className="relative">
                            <button
                              onClick={() => handleTagToggle(tag.id)}
                              className={`px-2 py-0.5 rounded-full text-xs transition-all flex items-center gap-1 ${selectedTags.includes(tag.id) ? 'text-white' : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                              style={{ backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined }}
                            >
                              {tag.name}
                            </button>
                            <button
                              onClick={() => handleDeleteTag(tag.id)}
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
                              title="删除标签"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => setShowTagModal(true)}
                          className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                          <i className="fas fa-plus"></i>
                          添加标签
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Assistant Sidebar */}
            <AnimatePresence>
              {isAssistantOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 360, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className={`border-l flex flex-col ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}
                >
                  {/* Header */}
                  <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-md`}>
                        <i className="fas fa-robot"></i>
                      </div>
                      <div>
                        <div className="font-semibold">AI 智能助手</div>
                        <div className="text-xs text-gray-500">随时为您提供帮助</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsAssistantOpen(false)} 
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatHistory.length === 0 && (
                      <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          <i className="fas fa-comments text-2xl"></i>
                        </div>
                        <p className="text-sm">开始与 AI 对话</p>
                        <p className="text-xs mt-1">输入您的问题或点击下方建议</p>
                      </div>
                    )}
                    {chatHistory.map((msg, idx) => (
                      <motion.div 
                        key={msg.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-2 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          {/* Avatar */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.role === 'user' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                          }`}>
                            <i className={`fas ${msg.role === 'user' ? 'fa-user' : 'fa-robot'} text-xs`}></i>
                          </div>
                          {/* Message Bubble */}
                          <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                            msg.role === 'user' 
                              ? 'bg-blue-600 text-white rounded-tr-sm' 
                              : (isDark ? 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm')
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Context-Aware Suggestions */}
                  {(selectedTemplateId && CONTEXT_AWARE_SUGGESTIONS[selectedTemplateId as keyof typeof CONTEXT_AWARE_SUGGESTIONS]) && (
                    <div className={`px-4 py-3 border-t ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <i className="fas fa-lightbulb text-yellow-500 text-xs"></i>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">智能建议</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {CONTEXT_AWARE_SUGGESTIONS[selectedTemplateId as keyof typeof CONTEXT_AWARE_SUGGESTIONS].map((suggestion, idx) => (
                          <motion.button
                            key={idx}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleModification(suggestion.prompt)}
                            disabled={isGenerating}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${isDark ? 'border-blue-600/50 hover:bg-blue-900/30 text-blue-400 bg-blue-900/10' : 'border-blue-200 hover:bg-blue-50 text-blue-700 bg-blue-50/50'}`}
                          >
                            {suggestion.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className={`px-4 py-3 border-t ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <i className="fas fa-bolt text-yellow-500 text-xs"></i>
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">快速操作</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_ACTIONS.map((action, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleModification(action.prompt)}
                          disabled={isGenerating}
                          className={`text-xs px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${isDark ? 'border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-gray-300' : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600'}`}
                        >
                          <i className={`fas ${action.icon} text-[10px]`}></i>
                          {action.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Input */}
                  <div className={`p-4 border-t ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="relative">
                      <textarea
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleModification();
                          }
                        }}
                        placeholder="输入您的修改要求，例如：让第一段更精简..."
                        className={`w-full p-3 pr-12 rounded-xl border resize-none focus:ring-2 focus:ring-blue-500 outline-none text-sm ${
                          isDark ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                        }`}
                        rows={2}
                        disabled={isGenerating}
                      />
                      <button
                        onClick={() => handleModification()}
                        disabled={!chatInput.trim() || isGenerating}
                        className={`absolute bottom-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          !chatInput.trim() || isGenerating
                            ? 'bg-gray-300 text-gray-500 dark:bg-gray-700'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-md'
                        }`}
                      >
                        {isGenerating ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className="fas fa-paper-plane text-xs"></i>}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                      <i className="fas fa-shield-alt mr-1"></i>
                      AI 生成内容仅供参考，请核对重要信息
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Version History Sidebar (Renamed from History) */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 300, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className={`border-l flex-shrink-0 overflow-y-auto absolute right-0 top-0 bottom-0 z-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold">当前文档版本</h3>
                      <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {versions.map((version) => (
                        <div key={version.id} className={`p-3 rounded-lg border cursor-pointer transition-all ${isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm">{version.summary}</span>
                            <span className="text-xs text-gray-400">{new Date(version.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <button
                            onClick={() => restoreVersion(version)}
                            className="text-xs text-blue-600 hover:underline mt-2"
                          >
                            恢复此版本
                          </button>
                        </div>
                      ))}
                      {versions.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">暂无历史版本</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quality Assessment Sidebar */}
            <AnimatePresence>
              {showQualityAssessment && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 400, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className={`border-l flex-shrink-0 overflow-y-auto absolute right-0 top-0 bottom-0 z-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold">文案质量评估</h3>
                      <button onClick={() => setShowQualityAssessment(false)} className="text-gray-400 hover:text-gray-600">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    
                    {isAssessing ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="text-center">
                          <i className="fas fa-spinner fa-spin text-2xl text-blue-500 mb-2"></i>
                          <p className="text-sm text-gray-400">正在评估...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Overall Score */}
                        <div className="text-center py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                            {qualityScore || '--'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            总体评分
                          </div>
                        </div>

                        {/* Detailed Metrics */}
                        <div>
                          <h4 className="font-semibold mb-3">详细指标</h4>
                          <div className="space-y-3">
                            {Object.entries(qualityMetrics).map(([key, value]) => {
                              const metricNames = {
                                attractiveness: '吸引力',
                                contentQuality: '内容质量',
                                structure: '结构逻辑',
                                language: '语言表达',
                                targetFit: '目标适配',
                                cta: '行动召唤'
                              };
                              
                              return (
                                <div key={key}>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>{metricNames[key as keyof typeof metricNames] || key}</span>
                                    <span className="font-medium">{value}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${value}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Suggestions */}
                        <div>
                          <h4 className="font-semibold mb-3">改进建议</h4>
                          <ul className="space-y-2 text-sm">
                            {qualitySuggestions.map((suggestion, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <i className="fas fa-arrow-right text-blue-500 mt-0.5 flex-shrink-0"></i>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={handleQualityAssessment}
                          disabled={isAssessing}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-sync-alt"></i>
                          重新评估
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Keyword Analysis Sidebar */}
            <AnimatePresence>
              {showKeywordAnalysis && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 400, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className={`border-l flex-shrink-0 overflow-y-auto absolute right-0 top-0 bottom-0 z-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold">关键词分析</h3>
                      <button onClick={() => setShowKeywordAnalysis(false)} className="text-gray-400 hover:text-gray-600">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    
                    {isExtractingKeywords ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="text-center">
                          <i className="fas fa-spinner fa-spin text-2xl text-blue-500 mb-2"></i>
                          <p className="text-sm text-gray-400">正在分析...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Keywords Table */}
                        <div>
                          <h4 className="font-semibold mb-3">主要关键词</h4>
                          <div className="overflow-x-auto">
                            <table className={`w-full text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <tr>
                                  <th className="px-3 py-2 text-left">关键词</th>
                                  <th className="px-3 py-2 text-left">重要性</th>
                                  <th className="px-3 py-2 text-left">密度</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {keywords.map((keyword, index) => (
                                  <tr key={index} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                                    <td className="px-3 py-2 font-medium">{keyword.word}</td>
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 flex-1">
                                          <div 
                                            className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${keyword.score}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-xs w-12">{keyword.score}%</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2">{keyword.density}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Keyword Analysis */}
                        <div>
                          <h4 className="font-semibold mb-3">关键词分析</h4>
                          <div className="text-sm space-y-2">
                            <p>关键词分布相对合理，核心关键词出现频率适中。</p>
                            <p>主要关键词覆盖了文案的核心主题，有助于提高内容相关性。</p>
                          </div>
                        </div>

                        {/* Optimization Suggestions */}
                        <div>
                          <h4 className="font-semibold mb-3">优化建议</h4>
                          <ul className="space-y-2 text-sm">
                            {keywordSuggestions.map((suggestion, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <i className="fas fa-arrow-right text-blue-500 mt-0.5 flex-shrink-0"></i>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Recommended Keywords */}
                        <div>
                          <h4 className="font-semibold mb-3">推荐关键词</h4>
                          <div className="flex flex-wrap gap-2">
                            {['人工智能', '内容创作', '数字化营销', '智能工具', '效率提升', '创意生成', '自动化', '个性化', '用户体验', '转化优化'].map((keyword, index) => (
                              <span key={index} className={`text-xs px-2.5 py-1.5 rounded-full border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-100'}`}>
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={handleKeywordExtraction}
                          disabled={isExtractingKeywords}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-sync-alt"></i>
                          重新分析
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Style Analysis Sidebar */}
            <AnimatePresence>
              {showStyleAnalysis && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 400, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className={`border-l flex-shrink-0 overflow-y-auto absolute right-0 top-0 bottom-0 z-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold">风格分析与结构调整</h3>
                      <button onClick={() => setShowStyleAnalysis(false)} className="text-gray-400 hover:text-gray-600">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    
                    {isAnalyzingStyle ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="text-center">
                          <i className="fas fa-spinner fa-spin text-2xl text-blue-500 mb-2"></i>
                          <p className="text-sm text-gray-400">正在分析...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Style Analysis */}
                        <div>
                          <h4 className="font-semibold mb-3">风格分析</h4>
                          <div className="space-y-3">
                            {Object.entries(styleMetrics).slice(0, 4).map(([key, value]) => {
                              const metricNames = {
                                formality: '语言正式度',
                                sentenceComplexity: '句式复杂度',
                                rhetoricalDevices: '修辞手法',
                                emotionalExpression: '情感表达'
                              };
                              
                              return (
                                <div key={key}>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>{metricNames[key as keyof typeof metricNames] || key}</span>
                                    <span className="font-medium">{value}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div 
                                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${value}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Structure Analysis */}
                        <div>
                          <h4 className="font-semibold mb-3">结构评估</h4>
                          <div className="space-y-3">
                            {Object.entries(styleMetrics).slice(4).map(([key, value]) => {
                              const metricNames = {
                                structureCoherence: '整体结构',
                                paragraphOrganization: '段落组织',
                                transitionNaturalness: '过渡衔接',
                                introductionConclusion: '开头结尾'
                              };
                              
                              return (
                                <div key={key}>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>{metricNames[key as keyof typeof metricNames] || key}</span>
                                    <span className="font-medium">{value}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div 
                                      className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${value}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Style Suggestions */}
                        <div>
                          <h4 className="font-semibold mb-3">风格建议</h4>
                          <ul className="space-y-2 text-sm">
                            {styleSuggestions.map((suggestion, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <i className="fas fa-arrow-right text-purple-500 mt-0.5 flex-shrink-0"></i>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Structure Suggestions */}
                        <div>
                          <h4 className="font-semibold mb-3">结构建议</h4>
                          <ul className="space-y-2 text-sm">
                            {structureIssues.map((issue, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <i className="fas fa-arrow-right text-orange-500 mt-0.5 flex-shrink-0"></i>
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={handleStyleAnalysis}
                          disabled={isAnalyzingStyle}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-sync-alt"></i>
                          重新分析
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Drafts History Modal */}
      <AnimatePresence>
        {showDraftsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
            >
              {/* Modal Header */}
              <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg`}>
                    <i className="fas fa-history text-xl"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">文案历史记录</h2>
                    <p className="text-sm text-gray-500">管理和恢复您的创作历史</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Filter Tabs */}
                  <div className={`flex rounded-xl p-1 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <button
                      onClick={() => setDraftFilter('all')}
                      className={`px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2 ${
                        draftFilter === 'all'
                          ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <i className="fas fa-th-large"></i>
                      全部
                    </button>
                    <button
                      onClick={() => setDraftFilter('favorites')}
                      className={`px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2 ${
                        draftFilter === 'favorites'
                          ? 'bg-white dark:bg-gray-700 shadow-sm text-yellow-600 dark:text-yellow-400'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <i className="fas fa-star"></i>
                      收藏
                    </button>
                  </div>
                  <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input 
                      type="text" 
                      placeholder="搜索文案..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`pl-10 pr-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 w-64 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                    />
                  </div>
                  <button 
                    onClick={() => setShowDraftsModal(false)} 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <i className="fas fa-times text-lg"></i>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {draftsList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {draftsList
                      .filter(d => 
                        d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        d.templateName.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .sort((a, b) => b.updatedAt - a.updatedAt)
                      .map((draft, idx) => (
                      <motion.div 
                        key={draft.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => loadDraft(draft)}
                        className={`group relative rounded-2xl border transition-all cursor-pointer overflow-hidden hover:shadow-xl ${
                          isDark 
                            ? 'bg-gray-800 border-gray-700 hover:border-blue-500' 
                            : 'bg-white border-gray-200 hover:border-blue-400'
                        }`}
                      >
                        {/* Top Color Bar */}
                        <div className={`h-1 bg-gradient-to-r ${TEMPLATES[draft.templateId as keyof typeof TEMPLATES]?.color || 'from-gray-400 to-gray-500'}`}></div>
                        
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${TEMPLATES[draft.templateId as keyof typeof TEMPLATES]?.color || 'from-gray-400 to-gray-500'} text-white shadow-md`}>
                              <i className={`${TEMPLATES[draft.templateId as keyof typeof TEMPLATES]?.icon || 'fas fa-file-alt'} text-lg`}></i>
                            </div>
                            <div className="flex gap-1">
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => toggleFavoriteDraft(e, draft.id)}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${draft.isFavorite ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'}`}
                                title={draft.isFavorite ? '取消收藏' : '收藏'}
                              >
                                <i className={`${draft.isFavorite ? 'fas' : 'far'} fa-star`}></i>
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => deleteDraft(e, draft.id)}
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                title="删除"
                              >
                                <i className="fas fa-trash-alt"></i>
                              </motion.button>
                            </div>
                          </div>
                          
                          <h3 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{draft.title}</h3>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm text-gray-500">{draft.templateName}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
                              {TEMPLATE_CATEGORIES[TEMPLATES[draft.templateId as keyof typeof TEMPLATES]?.category as keyof typeof TEMPLATE_CATEGORIES]?.name}
                            </span>
                          </div>
                          
                          {/* Category and Tags Display */}
                          {(draft.category || (draft.tags && draft.tags.length > 0)) && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {draft.category && (
                                <span className="text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                  <i className={`${DEFAULT_CATEGORIES.find(c => c.id === draft.category)?.icon || 'fas fa-folder'} text-[10px]`}></i>
                                  {DEFAULT_CATEGORIES.find(c => c.id === draft.category)?.name}
                                </span>
                              )}
                              {draft.tags && draft.tags.slice(0, 2).map(tagId => {
                                const tag = tags.find(t => t.id === tagId);
                                return tag ? (
                                  <span key={tagId} className="text-xs px-2 py-1 rounded-lg text-white" style={{ backgroundColor: tag.color }}>
                                    {tag.name}
                                  </span>
                                ) : null;
                              })}
                              {draft.tags && draft.tags.length > 2 && (
                                <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500">
                                  +{draft.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Footer */}
                          <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t dark:border-gray-700">
                            <span className="flex items-center gap-1">
                              <i className="far fa-clock"></i>
                              {new Date(draft.updatedAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="far fa-file-alt"></i>
                              {new Date(draft.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-gray-400"
                  >
                    <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <i className="fas fa-history text-4xl"></i>
                    </div>
                    <p className="text-lg font-medium mb-2">暂无历史记录</p>
                    <p className="text-sm text-gray-500">开始创作您的第一篇文案吧</p>
                  </motion.div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className={`p-4 border-t flex items-center justify-between ${isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                <div className="text-sm text-gray-500">
                  共 <span className="font-semibold text-gray-700 dark:text-gray-300">{draftsList.length}</span> 条记录
                </div>
                <button 
                  onClick={() => setShowDraftsModal(false)}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tag Management Modal */}
      <AnimatePresence>
        {showTagModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
            >
              {/* Modal Header */}
              <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <i className="fas fa-tags text-blue-500"></i>
                  添加新标签
                </h2>
                <button onClick={() => setShowTagModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">标签名称</label>
                  <input 
                    type="text" 
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="输入标签名称"
                    className={`w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">标签颜色</label>
                  <div className="grid grid-cols-6 gap-2">
                    {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#111827', '#f3f4f6', '#ffffff'].map(color => (
                      <button
                        key={color}
                        onClick={() => setNewTagColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${newTagColor === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <input 
                    type="color" 
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-full mt-2 p-1 rounded-lg border"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`p-4 border-t flex justify-end gap-3 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                <button 
                  onClick={() => setShowTagModal(false)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-100'}`}
                >
                  取消
                </button>
                <button 
                  onClick={handleAddTag}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  添加标签
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Template Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
            >
              {/* Modal Header */}
              <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-blue-100'}`}>
                    <i className={`${TEMPLATES[previewTemplate as keyof typeof TEMPLATES]?.icon || 'fas fa-file-alt'} text-blue-500`}></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {TEMPLATES[previewTemplate as keyof typeof TEMPLATES]?.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {TEMPLATES[previewTemplate as keyof typeof TEMPLATES]?.description}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewTemplate(null)} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Sections */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      包含章节
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {TEMPLATES[previewTemplate as keyof typeof TEMPLATES]?.sections.map((section, idx) => (
                        <span 
                          key={idx} 
                          className={`text-sm px-3 py-1.5 rounded-full border ${
                            isDark 
                              ? 'bg-gray-800 border-gray-700 text-gray-300' 
                              : 'bg-gray-100 border-gray-200 text-gray-700'
                          }`}
                        >
                          {section}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Prompt Preview */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      生成提示预览
                    </h3>
                    <div className={`p-4 rounded-lg text-sm font-mono whitespace-pre-wrap ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                      {TEMPLATES[previewTemplate as keyof typeof TEMPLATES]?.prompt.substring(0, 500)}...
                    </div>
                  </div>

                  {/* Use Template Button */}
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => {
                        setSelectedTemplateId(previewTemplate);
                        setPreviewTemplate(null);
                      }}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                    >
                      <i className="fas fa-check"></i>
                      使用此模板
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
