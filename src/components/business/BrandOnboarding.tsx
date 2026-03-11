import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  FileCheck, 
  Rocket, 
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users,
  Palette,
  Megaphone,
  Store
} from 'lucide-react';

interface BrandOnboardingProps {
  isDark: boolean;
  onStartApplication: () => void;
  stats: {
    approvedPartnerships: number;
    publishedEvents: number;
  };
}

const BrandOnboarding: React.FC<BrandOnboardingProps> = ({ 
  isDark, 
  onStartApplication,
  stats 
}) => {
  const navigate = useNavigate();
  const benefits = [
    {
      icon: Users,
      title: '触达年轻用户',
      description: '通过平台10万+创作者和年轻用户群体，帮助品牌实现年轻化转型',
      color: 'blue'
    },
    {
      icon: Palette,
      title: 'AI创意设计',
      description: '利用AI技术快速生成海量国潮设计方案，降低设计成本',
      color: 'purple'
    },
    {
      icon: Megaphone,
      title: '活动推广支持',
      description: '平台提供活动发布、推广、报名管理一站式服务',
      color: 'green'
    },
    {
      icon: TrendingUp,
      title: '数据洞察分析',
      description: '实时了解用户反馈和市场趋势，优化品牌策略',
      color: 'orange'
    }
  ];

  const steps = [
    {
      number: '01',
      title: '提交入驻申请',
      description: '填写品牌信息和合作意向，提交入驻申请',
      icon: FileCheck
    },
    {
      number: '02',
      title: '平台审核',
      description: '我们将在1-3个工作日内完成审核',
      icon: CheckCircle2
    },
    {
      number: '03',
      title: '正式入驻',
      description: '审核通过后即可创建活动，与创作者合作',
      icon: Rocket
    }
  ];

  return (
    <div className="space-y-16">
      {/* 入驻引导头部 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-6"
        >
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            品牌入驻通道
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`text-4xl md:text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          加入津脉智坊
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            品牌合作计划
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`text-lg max-w-2xl mx-auto mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
        >
          与平台合作，连接10万+创作者和年轻用户，通过AI技术为品牌注入年轻活力
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <button
            onClick={onStartApplication}
            className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 flex items-center gap-2"
          >
            <Building2 className="w-5 h-5" />
            品牌方入驻
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate('/merchant/apply')}
            className={`group px-8 py-4 rounded-xl font-semibold border transition-all duration-300 hover:scale-105 flex items-center gap-2 ${
              isDark 
                ? 'border-emerald-500/50 text-emerald-400 hover:border-emerald-500 hover:bg-emerald-500/10' 
                : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <Store className="w-5 h-5" />
            商家入驻申请
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* 统计数据 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center gap-8 mt-12"
        >
          <div className="text-center">
            <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats.approvedPartnerships}+
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>入驻品牌</div>
          </div>
          <div className="w-px bg-gray-300 dark:bg-gray-600" />
          <div className="text-center">
            <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              10万+
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>创作者</div>
          </div>
          <div className="w-px bg-gray-300 dark:bg-gray-600" />
          <div className="text-center">
            <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats.publishedEvents}+
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>品牌活动</div>
          </div>
        </motion.div>
      </motion.section>

      {/* 入驻优势 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className={`text-2xl font-bold text-center mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          入驻优势
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`
                p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg
                ${isDark 
                  ? 'bg-slate-800/50 border-slate-700 hover:border-blue-500/50' 
                  : 'bg-white border-gray-200 hover:border-blue-300'}
              `}
            >
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center mb-4
                ${benefit.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
                ${benefit.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' : ''}
                ${benefit.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' : ''}
                ${benefit.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30' : ''}
              `}>
                <benefit.icon className={`w-6 h-6 
                  ${benefit.color === 'blue' ? 'text-blue-500' : ''}
                  ${benefit.color === 'purple' ? 'text-purple-500' : ''}
                  ${benefit.color === 'green' ? 'text-green-500' : ''}
                  ${benefit.color === 'orange' ? 'text-orange-500' : ''}
                `} />
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {benefit.title}
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 入驻流程 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className={`text-2xl font-bold text-center mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          入驻流程
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative p-6 rounded-2xl border text-center
                ${isDark 
                  ? 'bg-slate-800/50 border-slate-700' 
                  : 'bg-white border-gray-200'}
              `}
            >
              <div className={`
                absolute -top-4 left-1/2 -translate-x-1/2
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                bg-gradient-to-r from-blue-500 to-purple-600 text-white
              `}>
                {step.number}
              </div>
              <div className="mt-4">
                <div className={`
                  w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center
                  ${isDark ? 'bg-slate-700' : 'bg-gray-100'}
                `}>
                  <step.icon className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {step.title}
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA 区域 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className={`
          p-8 rounded-3xl text-center
          ${isDark 
            ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/20' 
            : 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200'}
        `}
      >
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          准备好开始了吗？
        </h2>
        <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          立即申请入驻，开启品牌年轻化之旅
        </p>
        <button
          onClick={onStartApplication}
          className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
        >
          <Building2 className="w-5 h-5" />
          立即申请入驻
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.section>
    </div>
  );
};

export default BrandOnboarding;
