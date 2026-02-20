import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { BookOpen, X, ChevronDown, ChevronUp, Copy, Check, Lightbulb, FileText, Target } from 'lucide-react';

interface Example {
  title: string;
  content: string;
  tips: string[];
}

interface SectionExample {
  sectionType: string;
  description: string;
  purpose: string;
  keyPoints: string[];
  examples: Example[];
  commonMistakes: string[];
  writingTips: string[];
}

const sectionExamples: Record<string, SectionExample> = {
  '执行摘要': {
    sectionType: '执行摘要',
    description: '执行摘要是整个文档的精华浓缩，让读者在几分钟内了解核心内容',
    purpose: '帮助忙碌的高管快速了解项目/方案的核心价值，决定是否继续阅读',
    keyPoints: ['项目背景与问题', '解决方案概述', '核心价值主张', '关键数据指标', '资金需求与用途', '团队优势'],
    examples: [
      {
        title: '商业计划书执行摘要示例',
        content: '【项目简介】XYZ科技是一家专注于企业级AI解决方案的科技公司，致力于通过人工智能技术帮助企业提升运营效率。\n\n【核心优势】1) 自主研发的核心算法，准确率达95%以上；2) 已服务50+中大型企业客户；3) 团队来自BAT等顶级科技公司。\n\n【市场机会】中国企业级AI市场规模达千亿级，年增长率超过30%，市场潜力巨大。\n\n【融资需求】本轮计划融资3000万元，用于产品研发（40%）、市场拓展（35%）和团队建设（25%）。',
        tips: ['控制在1-2页内', '使用数据说话', '突出差异化优势'],
      },
    ],
    commonMistakes: ['过于详细，篇幅过长', '缺乏数据支撑', '没有突出差异化', '忽略风险因素'],
    writingTips: ['先写完整文档，最后写摘要', '每段只讲一个核心观点', '使用 bullet points 提高可读性'],
  },
  '市场分析': {
    sectionType: '市场分析',
    description: '全面分析目标市场的规模、趋势、竞争格局和增长潜力',
    purpose: '证明项目的市场机会真实存在，展示对行业的深度理解',
    keyPoints: ['市场规模与增长', '目标用户画像', '行业趋势分析', '竞争格局', '市场痛点', '进入壁垒'],
    examples: [
      {
        title: '市场规模分析示例',
        content: '【TAM（总可及市场）】\n全球企业协作软件市场规模达450亿美元，预计未来5年复合增长率12%。\n\n【SAM（可服务市场）】\n亚太地区企业协作软件市场约120亿美元，其中中国市场占比35%。\n\n【SOM（可获得市场）】\n基于我们目前的资源和能力，初期可触达的中型企业市场约5亿美元。\n\n【增长驱动因素】\n1) 远程办公常态化；2) 数字化转型加速；3) Z世代进入职场带来新需求。',
        tips: ['引用权威数据源', '区分TAM/SAM/SOM', '分析增长驱动因素'],
      },
    ],
    commonMistakes: ['数据陈旧或来源不明', '市场规模估算过于乐观', '忽略竞争对手', '缺乏用户调研支撑'],
    writingTips: ['使用图表可视化数据', '对比国内外市场', '分析宏观环境影响'],
  },
  '产品介绍': {
    sectionType: '产品介绍',
    description: '详细描述产品的功能、特性、技术架构和使用场景',
    purpose: '让读者清晰理解产品是什么、能做什么、为什么有价值',
    keyPoints: ['产品定位', '核心功能', '技术架构', '产品优势', '使用场景', '路线图'],
    examples: [
      {
        title: 'SaaS产品介绍示例',
        content: '【产品定位】\n智能客服机器人平台，专为电商企业打造，7×24小时自动处理客户咨询。\n\n【核心功能】\n1. 多轮对话：理解复杂问题，支持多轮交互\n2. 知识库管理：一键导入FAQ，自动学习优化\n3. 人机协作：复杂问题自动转人工\n4. 数据分析：实时统计咨询热点和满意度\n\n【技术优势】\n基于GPT-4大模型，结合行业知识库微调，意图识别准确率达92%。',
        tips: ['用场景化语言描述', '配合截图或演示', '强调用户价值'],
      },
    ],
    commonMistakes: ['过于技术化', '功能罗列缺乏重点', '没有用户视角', '忽略竞品对比'],
    writingTips: ['从用户痛点切入', '用故事化方式展示', '提供Demo或试用'],
  },
  '商业模式': {
    sectionType: '商业模式',
    description: '清晰阐述如何赚钱、收入来源、成本结构和盈利逻辑',
    purpose: '证明项目的商业可行性和盈利潜力',
    keyPoints: ['收入模式', '定价策略', '成本结构', '盈利预测', '客户获取成本', '客户终身价值'],
    examples: [
      {
        title: 'SaaS商业模式示例',
        content: '【收入模式】\n订阅制收费，按月/年付费，提供基础版、专业版、企业版三档套餐。\n\n【定价策略】\n- 基础版：¥99/月，适合小团队\n- 专业版：¥299/月，适合成长型企业\n- 企业版：定制化报价\n\n【单位经济模型】\n- 获客成本(CAC)：¥1,200\n- 客户终身价值(LTV)：¥8,500\n- LTV/CAC比率：7.1（健康值>3）\n- 回本周期：8个月',
        tips: ['展示单位经济模型', '计算LTV/CAC', '说明定价依据'],
      },
    ],
    commonMistakes: ['收入预测过于乐观', '忽略获客成本', '成本估算不足', '没有盈亏平衡分析'],
    writingTips: ['用数据说话', '对比行业标杆', '做敏感性分析'],
  },
  '团队介绍': {
    sectionType: '团队介绍',
    description: '展示核心团队的背景、经验和能力，证明团队能胜任',
    purpose: '建立信任，证明团队有执行力和相关经验',
    keyPoints: ['创始人背景', '核心团队', '顾问团队', '团队优势', '股权结构', '招聘计划'],
    examples: [
      {
        title: '创业团队介绍示例',
        content: '【创始人 - 张明】\n- 前阿里巴巴产品总监，10年互联网产品经验\n- 曾主导千万级用户产品设计\n- 北京大学计算机硕士\n\n【CTO - 李华】\n- 前腾讯技术专家，15年研发经验\n- 分布式系统专家，多项技术专利\n- 清华大学博士\n\n【团队优势】\n1. 互补的技能组合：产品+技术+运营\n2. 丰富的行业资源\n3. 成功的创业经历',
        tips: ['突出相关经验', '展示成功案例', '说明团队稳定性'],
      },
    ],
    commonMistakes: ['过于冗长', '缺乏相关经验', '团队不完整', '股权结构不合理'],
    writingTips: ['用数据量化成就', '展示团队照片', '说明团队文化'],
  },
  '财务预测': {
    sectionType: '财务预测',
    description: '展示未来3-5年的收入、成本、利润和现金流预测',
    purpose: '证明项目的财务可行性和增长潜力',
    keyPoints: ['收入预测', '成本预测', '利润预测', '现金流预测', '关键假设', '敏感性分析'],
    examples: [
      {
        title: '三年财务预测示例',
        content: '【收入预测】\n- 第一年：¥500万（种子客户）\n- 第二年：¥2,000万（市场拓展）\n- 第三年：¥6,000万（规模增长）\n\n【成本结构】\n- 研发成本：40%\n- 销售与市场：35%\n- 运营管理：25%\n\n【盈利预测】\n- 第一年：亏损¥200万\n- 第二年：盈亏平衡\n- 第三年：净利润¥800万（利润率13%）',
        tips: ['提供详细假设', '做情景分析', '对比行业数据'],
      },
    ],
    commonMistakes: ['预测过于乐观', '假设不明确', '忽略季节性', '没有风险调整'],
    writingTips: ['保守估计', '分情景预测', '定期更新'],
  },
  '风险分析': {
    sectionType: '风险分析',
    description: '识别潜在风险并提出应对措施，展示风险意识',
    purpose: '证明团队对风险有清醒认识，有应对预案',
    keyPoints: ['市场风险', '技术风险', '运营风险', '财务风险', '法律风险', '应对措施'],
    examples: [
      {
        title: '风险分析示例',
        content: '【市场风险 - 中高风险】\n风险：市场竞争加剧，巨头入场\n应对：深耕细分领域，建立客户粘性，快速迭代产品\n\n【技术风险 - 中风险】\n风险：核心技术被模仿或超越\n应对：持续研发投入，申请专利保护，建立技术壁垒\n\n【运营风险 - 低风险】\n风险：关键人员流失\n应对：完善激励机制，建立人才梯队，知识文档化',
        tips: ['诚实面对风险', '提供具体应对', '定期评估更新'],
      },
    ],
    commonMistakes: ['回避风险', '应对措施空洞', '风险评估不准确', '没有应急预案'],
    writingTips: ['分类别展示', '量化风险等级', '说明监控机制'],
  },
  '发展规划': {
    sectionType: '发展规划',
    description: '描述未来3-5年的战略目标和实施路径',
    purpose: '展示长期愿景和清晰的执行计划',
    keyPoints: ['短期目标', '中期目标', '长期愿景', '里程碑', '资源需求', '退出机制'],
    examples: [
      {
        title: '三年发展规划示例',
        content: '【第一年 - 产品验证期】\n目标：完成产品MVP，获得100个种子客户\n里程碑：Q2产品上线，Q4完成PMF验证\n\n【第二年 - 市场拓展期】\n目标：实现盈亏平衡，客户数达1000家\n里程碑：Q2完成A轮融资，Q4进入新市场\n\n【第三年 - 规模增长期】\n目标：成为行业前三，启动IPO准备\n里程碑：Q2完成B轮融资，Q4实现规模化盈利',
        tips: ['设定可量化目标', '明确时间节点', '说明资源需求'],
      },
    ],
    commonMistakes: ['目标过于宏大', '缺乏可行性', '时间节点不明确', '忽略资源约束'],
    writingTips: ['SMART原则', '分阶段展示', '与财务预测对应'],
  },
};

interface SectionExamplesProps {
  sectionName: string;
  onClose: () => void;
}

export const SectionExamples: React.FC<SectionExamplesProps> = ({
  sectionName,
  onClose,
}) => {
  const { isDark } = useTheme();
  const [expandedExample, setExpandedExample] = useState<number | null>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // 查找匹配的示例，如果没有精确匹配，尝试模糊匹配
  const example = Object.entries(sectionExamples).find(([key]) => 
    sectionName.toLowerCase().includes(key.toLowerCase()) ||
    key.toLowerCase().includes(sectionName.toLowerCase())
  )?.[1];

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!example) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              章节示例
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center py-8">
          <Lightbulb className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            暂无 "{sectionName}" 的示例
          </p>
          <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            建议参考类似章节的写作方法
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}
    >
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {example.sectionType} - 写作指南
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {example.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[70vh] overflow-auto">
        {/* 写作目的 */}
        <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-600" />
            <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
              写作目的
            </h4>
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {example.purpose}
          </p>
        </div>

        {/* 关键要点 */}
        <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h4 className={`font-medium text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            应包含的关键要点
          </h4>
          <div className="flex flex-wrap gap-2">
            {example.keyPoints.map((point, index) => (
              <span
                key={index}
                className={`px-3 py-1 rounded-full text-xs ${
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {point}
              </span>
            ))}
          </div>
        </div>

        {/* 示例内容 */}
        <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h4 className={`font-medium text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            参考示例
          </h4>
          <div className="space-y-3">
            {example.examples.map((ex, index) => (
              <div
                key={index}
                className={`rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}
              >
                <button
                  onClick={() => setExpandedExample(expandedExample === index ? null : index)}
                  className="w-full flex items-center justify-between p-3 text-left"
                >
                  <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {ex.title}
                  </span>
                  {expandedExample === index ? (
                    <ChevronUp className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  ) : (
                    <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  )}
                </button>
                <AnimatePresence>
                  {expandedExample === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={`p-3 pt-0 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                        <pre className={`text-xs whitespace-pre-wrap font-sans mt-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {ex.content}
                        </pre>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex gap-2">
                            {ex.tips.map((tip, tipIndex) => (
                              <span
                                key={tipIndex}
                                className={`text-xs px-2 py-0.5 rounded ${
                                  isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {tip}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() => handleCopy(ex.content, index)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                              isDark
                                ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="w-3 h-3" />
                                已复制
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                复制
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* 常见错误 */}
        <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h4 className={`font-medium text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            常见错误 ❌
          </h4>
          <ul className="space-y-2">
            {example.commonMistakes.map((mistake, index) => (
              <li key={index} className={`flex items-start gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="text-red-500 mt-0.5">•</span>
                {mistake}
              </li>
            ))}
          </ul>
        </div>

        {/* 写作技巧 */}
        <div className="p-4">
          <h4 className={`font-medium text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            写作技巧 💡
          </h4>
          <ul className="space-y-2">
            {example.writingTips.map((tip, index) => (
              <li key={index} className={`flex items-start gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="text-green-500 mt-0.5">✓</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default SectionExamples;
