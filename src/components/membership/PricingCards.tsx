import React from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Star,
  User,
  Check,
  Sparkles,
  ArrowRight,
  Zap
} from 'lucide-react';
import { User as UserType } from '@/contexts/authContext';

interface PricingPeriod {
  price: number;
  period: string;
  discount?: string;
  originalPrice?: number;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ElementType;
  gradient: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  buttonGradient: string;
}

interface PricingData {
  premium: {
    monthly: PricingPeriod;
    quarterly: PricingPeriod;
    yearly: PricingPeriod;
  };
  vip: {
    monthly: PricingPeriod;
    quarterly: PricingPeriod;
    yearly: PricingPeriod;
  };
}

interface PricingCardsProps {
  isDark: boolean;
  user: UserType | null;
  onUpgrade: (planId: string) => void;
  pricing?: PricingData;
}

const PricingCards: React.FC<PricingCardsProps> = ({ isDark, user, onUpgrade, pricing }) => {
  // 获取价格显示
  const getPriceDisplay = (planId: string) => {
    if (pricing) {
      const planPricing = pricing[planId as keyof PricingData];
      if (planPricing) {
        return {
          monthly: planPricing.monthly,
          quarterly: planPricing.quarterly,
          yearly: planPricing.yearly
        };
      }
    }
    // 默认价格
    const defaultPrices: Record<string, { monthly: PricingPeriod; quarterly: PricingPeriod; yearly: PricingPeriod }> = {
      premium: {
        monthly: { price: 99, period: '月' },
        quarterly: { price: 269, period: '季度', discount: '9折', originalPrice: 297 },
        yearly: { price: 899, period: '年', discount: '7.6折', originalPrice: 1188 }
      },
      vip: {
        monthly: { price: 199, period: '月' },
        quarterly: { price: 539, period: '季度', discount: '9折', originalPrice: 597 },
        yearly: { price: 1799, period: '年', discount: '7.5折', originalPrice: 2388 }
      }
    };
    return defaultPrices[planId] || defaultPrices.premium;
  };

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: '免费会员',
      price: 0,
      period: '永久',
      description: '基础AI创作体验',
      features: [
        '每天10次AI生成',
        '基础AI模型',
        '基础模板库',
        '1GB云存储',
        '社区参与'
      ],
      icon: User,
      gradient: 'from-gray-400 via-slate-400 to-zinc-400',
      bgGradient: isDark
        ? 'from-gray-500/10 via-slate-500/10 to-zinc-500/10'
        : 'from-gray-50 via-slate-50 to-zinc-50',
      borderColor: isDark ? 'border-gray-500/30' : 'border-gray-200',
      textColor: isDark ? 'text-gray-300' : 'text-gray-700',
      buttonGradient: 'from-gray-500 to-slate-500'
    },
    {
      id: 'premium',
      name: '高级会员',
      price: getPriceDisplay('premium').monthly.price,
      period: '月',
      description: '解锁高级AI创作功能',
      features: [
        '无限AI生成次数',
        '高级AI模型访问',
        '高清作品导出',
        '优先处理队列',
        '专属模板库',
        '去除水印',
        '50GB云存储'
      ],
      popular: true,
      icon: Star,
      gradient: 'from-blue-500 via-cyan-500 to-teal-500',
      bgGradient: isDark
        ? 'from-blue-500/10 via-cyan-500/10 to-teal-500/10'
        : 'from-blue-50 via-cyan-50 to-teal-50',
      borderColor: isDark ? 'border-blue-500/30' : 'border-blue-200',
      textColor: isDark ? 'text-blue-300' : 'text-blue-700',
      buttonGradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'vip',
      name: 'VIP会员',
      price: getPriceDisplay('vip').monthly.price,
      period: '月',
      description: '享受顶级AI创作体验',
      features: [
        '包含高级会员所有权益',
        '专属AI训练模型',
        '一对一设计师服务',
        '商业授权',
        '专属活动邀请',
        '无限作品存储',
        '最高优先级处理',
        '7x24小时专属客服'
      ],
      icon: Crown,
      gradient: 'from-purple-500 via-violet-500 to-indigo-500',
      bgGradient: isDark
        ? 'from-purple-500/10 via-violet-500/10 to-indigo-500/10'
        : 'from-purple-50 via-violet-50 to-indigo-50',
      borderColor: isDark ? 'border-purple-500/30' : 'border-purple-200',
      textColor: isDark ? 'text-purple-300' : 'text-purple-700',
      buttonGradient: 'from-purple-500 to-violet-500'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          选择适合您的会员方案
        </h3>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          升级会员，解锁更多AI创作功能
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = user?.membershipLevel === plan.id;
          const canUpgrade = user?.membershipLevel !== 'vip' && plan.id !== 'free' && plan.id !== user?.membershipLevel;

          return (
            <motion.div
              key={plan.id}
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`
                relative rounded-3xl overflow-hidden border-2
                ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}
                ${isCurrentPlan ? 'ring-2 ring-offset-2 ring-offset-background ' + plan.borderColor.replace('border-', 'ring-') : ''}
                ${plan.borderColor}
                ${isDark ? 'bg-slate-900/50' : 'bg-white'}
              `}
            >
              {/* 热门标签 */}
              {plan.popular && (
                <div className={`
                  absolute top-0 left-0 right-0 py-2 text-center text-sm font-medium text-white
                  bg-gradient-to-r ${plan.gradient}
                `}>
                  <div className="flex items-center justify-center gap-1">
                    <Sparkles size={14} />
                    <span>最受欢迎</span>
                  </div>
                </div>
              )}

              {/* 当前计划标签 */}
              {isCurrentPlan && (
                <div className={`
                  absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium
                  ${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}
                `}>
                  当前计划
                </div>
              )}

              <div className={`p-6 ${plan.popular ? 'pt-14' : ''}`}>
                {/* 图标和名称 */}
                <div className="text-center mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`
                      w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4
                      bg-gradient-to-br ${plan.gradient}
                      shadow-lg
                    `}
                  >
                    <Icon size={32} className="text-white" />
                  </motion.div>
                  <h4 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h4>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                </div>

                {/* 价格 */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-4xl font-bold ${plan.textColor}`}>
                      ¥{plan.price}
                    </span>
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      /{plan.period}
                    </span>
                  </div>
                </div>

                {/* 功能列表 */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className={`
                        w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                        ${isDark ? 'bg-slate-800' : 'bg-gray-100'}
                      `}>
                        <Check size={12} className={plan.textColor} />
                      </div>
                      <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        {feature}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                {/* 操作按钮 */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => canUpgrade && onUpgrade(plan.id)}
                  disabled={!canUpgrade}
                  className={`
                    w-full py-3 rounded-xl font-medium text-sm
                    flex items-center justify-center gap-2
                    transition-all duration-200
                    ${isCurrentPlan
                      ? isDark
                        ? 'bg-slate-800 text-slate-400 cursor-default'
                        : 'bg-gray-100 text-gray-400 cursor-default'
                      : plan.id === 'free'
                        ? isDark
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : `bg-gradient-to-r ${plan.buttonGradient} text-white shadow-lg hover:shadow-xl hover:brightness-110`
                    }
                  `}
                >
                  {isCurrentPlan ? (
                    '当前计划'
                  ) : plan.id === 'free' ? (
                    '免费使用'
                  ) : (
                    <>
                      <Zap size={16} />
                      <span>立即升级</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              </div>

              {/* 底部装饰 */}
              <div className={`
                h-1 bg-gradient-to-r ${plan.gradient}
                ${plan.popular ? 'opacity-100' : 'opacity-50'}
              `} />
            </motion.div>
          );
        })}
      </motion.div>

      {/* 底部说明 */}
      <p className={`text-center text-xs mt-6 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
        所有付费方案均支持7天无理由退款 · 可随时取消订阅
      </p>
    </div>
  );
};

export default PricingCards;
