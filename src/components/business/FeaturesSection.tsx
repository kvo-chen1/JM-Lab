import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, TrendingUp, ArrowRight } from 'lucide-react';

interface FeaturesSectionProps {
  isDark: boolean;
}

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  features: string[];
}

const FeaturesSection: React.FC<FeaturesSectionProps> = ({ isDark }) => {
  const features: Feature[] = [
    {
      icon: Sparkles,
      title: 'AI 创意赋能',
      description: '利用前沿生成式AI技术，快速产出海量国潮设计方案，降低试错成本，提升创意效率',
      gradient: 'from-blue-500 to-cyan-500',
      features: ['智能设计生成', '风格迁移', '批量方案输出', '成本降低80%']
    },
    {
      icon: Users,
      title: 'Z世代创作者生态',
      description: '连接万名年轻创作者，通过赛事、众包等形式，为品牌注入新鲜血液与创意活力',
      gradient: 'from-purple-500 to-pink-500',
      features: ['创作者社区', '众包赛事', '创意众投', '人才储备']
    },
    {
      icon: TrendingUp,
      title: '全链路商业转化',
      description: '从IP设计到实物周边定制（POD），再到数字藏品发行，提供一站式商业解决方案',
      gradient: 'from-orange-500 to-red-500',
      features: ['POD定制', '数字藏品', '电商对接', '数据分析']
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.8, 0.25, 1]
      }
    }
  };

  return (
    <section className="mb-16">
      {/* 标题 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          为什么选择
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            津脉智坊
          </span>
          ？
        </h2>
        <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          三大核心优势，助力品牌实现数字化转型与年轻化升级
        </p>
      </motion.div>

      {/* 特性卡片网格 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            variants={itemVariants}
            className={`
              relative group rounded-3xl overflow-hidden cursor-pointer
              ${isDark 
                ? 'bg-slate-800/50 border border-slate-700' 
                : 'bg-white border border-gray-200'}
              transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10
            `}
          >
            {/* 顶部渐变条 */}
            <div className={`h-1 bg-gradient-to-r ${feature.gradient} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
            
            {/* 背景装饰 */}
            <div className={`
              absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 
              rounded-full blur-3xl transition-opacity duration-500 -mr-20 -mt-20
            `} />

            <div className="p-8 relative z-10">
              {/* 图标 */}
              <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center mb-6
                bg-gradient-to-br ${feature.gradient} shadow-lg shadow-blue-500/20
                transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300
              `}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              {/* 标题 */}
              <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {feature.title}
              </h3>

              {/* 描述 */}
              <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {feature.description}
              </p>

              {/* 特性列表 */}
              <ul className="space-y-2 mb-6">
                {feature.features.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${feature.gradient}`} />
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{item}</span>
                  </li>
                ))}
              </ul>

              {/* 了解更多按钮 */}
              <button className={`
                flex items-center gap-2 text-sm font-semibold group/btn
                ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}
              `}>
                了解更多
                <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* 底部装饰线 */}
            <div className={`
              absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${feature.gradient}
              transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 delay-100
            `} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default FeaturesSection;
