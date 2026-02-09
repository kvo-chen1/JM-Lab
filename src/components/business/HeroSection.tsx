import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Briefcase, MapPin, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  isDark: boolean;
  stats: Array<{ label: string; value: string; icon?: React.ElementType }>;
}

// 数字滚动动画组件
const AnimatedNumber: React.FC<{ value: string; isDark: boolean }> = ({ value, isDark }) => {
  const [displayValue, setDisplayValue] = useState('0');
  const numericValue = parseInt(value.replace(/\D/g, ''));
  const suffix = value.replace(/\d/g, '');
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) {
      setDisplayValue(numericValue.toString());
      return;
    }
    
    hasAnimated.current = true;
    const duration = 2000;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayValue(numericValue.toString());
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current).toString());
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [numericValue]);

  return (
    <span className={`text-3xl md:text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {displayValue}{suffix}
    </span>
  );
};

const HeroSection: React.FC<HeroSectionProps> = ({ isDark, stats }) => {
  const iconMap: Record<string, React.ElementType> = {
    '入驻品牌': Building2,
    '活跃创作者': Users,
    '落地案例': Briefcase,
    '覆盖城市': MapPin,
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative mb-12"
    >
      {/* 主Hero卡片 */}
      <div className={`
        relative overflow-hidden rounded-3xl
        ${isDark 
          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700' 
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'}
        shadow-2xl shadow-blue-500/10
      `}>
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl" />
          {/* 网格背景 */}
          <div 
            className={`absolute inset-0 opacity-[0.03] ${isDark ? 'text-white' : 'text-black'}`}
            style={{
              backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        <div className="relative z-10 px-8 py-12 md:px-12 md:py-16">
          {/* 标题区域 */}
          <div className="max-w-3xl mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                AI 赋能老字号品牌年轻化
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              品牌合作与
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                企业服务
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`text-lg md:text-xl leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              连接创意与商业的桥梁，通过AI技术与创作者生态，
              <br className="hidden md:block" />
              为老字号品牌注入年轻活力，打造全链路商业解决方案
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4 mt-8"
            >
              <button className="group px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 flex items-center gap-2">
                开始合作
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className={`px-6 py-3 rounded-xl font-semibold border transition-all duration-300 hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:border-gray-500' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>
                了解更多
              </button>
            </motion.div>
          </div>

          {/* 统计数据 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats.map((stat, index) => {
              const Icon = iconMap[stat.label] || Building2;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className={`
                    relative p-6 rounded-2xl overflow-hidden group cursor-pointer
                    ${isDark 
                      ? 'bg-slate-800/50 border border-slate-700 hover:border-blue-500/50' 
                      : 'bg-white/80 border border-gray-200 hover:border-blue-300'}
                    backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1
                  `}
                >
                  {/* 装饰渐变 */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                  
                  <div className="relative z-10">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center mb-4
                      ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}
                    `}>
                      <Icon className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {stat.label}
                    </div>
                    <AnimatedNumber value={stat.value} isDark={isDark} />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default HeroSection;
