import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Lightbulb, Send, CheckCircle, ArrowRight, Sparkles, FileText } from 'lucide-react';

interface ProcessSectionProps {
  isDark: boolean;
  currentStep: number;
  onStepClick: (step: number) => void;
}

interface Step {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  description: string;
  details: string[];
}

const ProcessSection: React.FC<ProcessSectionProps> = ({ isDark, currentStep, onStepClick }) => {
  const steps: Step[] = [
    {
      id: 1,
      title: '选择意向品牌',
      subtitle: '品牌匹配',
      icon: Search,
      description: '从50+入驻品牌中选择您心仪的合作伙伴',
      details: ['浏览品牌库', '查看品牌故事', '了解合作政策', '确定意向品牌']
    },
    {
      id: 2,
      title: 'AI 辅助方案构思',
      subtitle: '创意生成',
      icon: Lightbulb,
      description: '利用AI技术快速生成创意方案与灵感',
      details: ['输入创意关键词', 'AI生成方案', '多方案对比', '优化调整']
    },
    {
      id: 3,
      title: '提交合作意向',
      subtitle: '正式申请',
      icon: Send,
      description: '填写合作申请表，提交您的创意方案',
      details: ['填写联系信息', '描述合作方案', '上传参考资料', '等待审核']
    }
  ];

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
          合作流程
        </h2>
        <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          简单三步，开启品牌合作之旅
        </p>
      </motion.div>

      {/* 桌面端：水平步骤条 */}
      <div className="hidden md:block">
        <div className="relative">
          {/* 连接线 */}
          <div className={`absolute top-16 left-0 right-0 h-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full`}>
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>

          {/* 步骤节点 */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const isActive = currentStep >= step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => onStepClick(step.id)}
                >
                  {/* 图标容器 */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`
                      relative w-16 h-16 rounded-2xl flex items-center justify-center mb-4 z-10
                      transition-all duration-300
                      ${isActive 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30' 
                        : (isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200')}
                      ${isCurrent ? 'ring-4 ring-blue-500/20' : ''}
                    `}
                  >
                    <step.icon className={`w-7 h-7 ${isActive ? 'text-white' : (isDark ? 'text-gray-500' : 'text-gray-400')}`} />
                    
                    {/* 完成标记 */}
                    {isActive && !isCurrent && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </motion.div>

                  {/* 步骤编号 */}
                  <div className={`
                    text-xs font-bold mb-2 px-2 py-0.5 rounded-full
                    ${isActive 
                      ? 'bg-blue-500/10 text-blue-500' 
                      : (isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-500')}
                  `}>
                    步骤 {step.id}
                  </div>

                  {/* 标题 */}
                  <h3 className={`font-bold text-lg mb-1 ${isActive ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>
                    {step.title}
                  </h3>
                  
                  {/* 副标题 */}
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {step.subtitle}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 当前步骤详情 */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`
            mt-12 p-8 rounded-3xl
            ${isDark 
              ? 'bg-slate-800/50 border border-slate-700' 
              : 'bg-white border border-gray-200'}
          `}
        >
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
              {React.createElement(steps[currentStep - 1].icon, { className: 'w-10 h-10 text-white' })}
            </div>
            <div className="flex-1">
              <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {steps[currentStep - 1].title}
              </h3>
              <p className={`text-lg mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {steps[currentStep - 1].description}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {steps[currentStep - 1].details.map((detail, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600" />
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-105">
              开始此步骤
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* 移动端：垂直时间线 */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => {
          const isActive = currentStep >= step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onStepClick(step.id)}
              className={`
                relative p-6 rounded-2xl cursor-pointer transition-all duration-300
                ${isCurrent 
                  ? (isDark ? 'bg-slate-800 border-2 border-blue-500' : 'bg-white border-2 border-blue-500 shadow-lg shadow-blue-500/10') 
                  : (isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-gray-200')}
              `}
            >
              <div className="flex items-start gap-4">
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                  ${isActive 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                    : (isDark ? 'bg-gray-700' : 'bg-gray-100')}
                `}>
                  <step.icon className={`w-6 h-6 ${isActive ? 'text-white' : (isDark ? 'text-gray-500' : 'text-gray-400')}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`
                      text-xs font-bold px-2 py-0.5 rounded-full
                      ${isActive ? 'bg-blue-500/10 text-blue-500' : (isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-500')}
                    `}>
                      步骤 {step.id}
                    </span>
                    {isActive && !isCurrent && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <h3 className={`font-bold mb-1 ${isActive ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {step.description}
                  </p>
                </div>
                <ArrowRight className={`w-5 h-5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default ProcessSection;
