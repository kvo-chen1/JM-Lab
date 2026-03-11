import React from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Star,
  User,
  Check,
  Sparkles,
  ArrowRight,
  Zap,
  Coins,
  Gem,
  Award
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
  jinbiPerMonth: number;
  discountRate: string;
  popular?: boolean;
  icon: React.ElementType;
  gradient: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  buttonGradient: string;
}

interface PricingData {
  base: {
    monthly: PricingPeriod;
    quarterly: PricingPeriod;
    yearly: PricingPeriod;
  };
  pro: {
    monthly: PricingPeriod;
    quarterly: PricingPeriod;
    yearly: PricingPeriod;
  };
  star: {
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
  membershipLevel?: string;
  onUpgrade: (planId: string) => void;
  pricing?: PricingData;
}

const PricingCards: React.FC<PricingCardsProps> = ({ isDark, user, membershipLevel, onUpgrade, pricing }) => {
  // 优先使用传入的会员等级，否则使用 user 对象中的
  const currentLevel = membershipLevel || user?.membershipLevel || 'free';
  
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
    // 默认价格（五级会员体系）
    const defaultPrices: Record<string, { monthly: PricingPeriod; quarterly: PricingPeriod; yearly: PricingPeriod }> = {
      base: {
        monthly: { price: 29, period: '月' },
        quarterly: { price: 79, period: '季度', discount: '9折', originalPrice: 87 },
        yearly: { price: 279, period: '年', discount: '8折', originalPrice: 348 }
      },
      pro: {
        monthly: { price: 99, period: '月' },
        quarterly: { price: 269, period: '季度', discount: '9折', originalPrice: 297 },
        yearly: { price: 899, period: '年', discount: '7.6折', originalPrice: 1188 }
      },
      star: {
        monthly: { price: 199, period: '月' },
        quarterly: { price: 539, period: '季度', discount: '9折', originalPrice: 597 },
        yearly: { price: 1799, period: '年', discount: '7.5折', originalPrice: 2388 }
      },
      vip: {
        monthly: { price: 399, period: '月' },
        quarterly: { price: 1079, period: '季度', discount: '9折', originalPrice: 1197 },
        yearly: { price: 3599, period: '年', discount: '7.5折', originalPrice: 4788 }
      }
    };
    return defaultPrices[planId] || defaultPrices.pro;
  };

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: '免费体验',
      price: 0,
      period: '永久',
      description: '基础AI创作体验',
      jinbiPerMonth: 0,
      discountRate: '无折扣',
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
      id: 'base',
      name: '基础会员',
      price: getPriceDisplay('base').monthly.price,
      period: '月',
      description: '适合轻度使用者',
      jinbiPerMonth: 1000,
      discountRate: '95折',
      features: [
        '每月1000津币',
        '3个并发任务',
        '10GB云存储',
        '消费95折优惠',
        '每日签到奖励',
        '基础客服支持'
      ],
      icon: Award,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      bgGradient: isDark
        ? 'from-emerald-500/10 via-teal-500/10 to-cyan-500/10'
        : 'from-emerald-50 via-teal-50 to-cyan-50',
      borderColor: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
      textColor: isDark ? 'text-emerald-300' : 'text-emerald-700',
      buttonGradient: 'from-emerald-500 to-teal-500'
    },
    {
      id: 'pro',
      name: '专业会员',
      price: getPriceDisplay('pro').monthly.price,
      period: '月',
      description: '性价比之选，最受欢迎',
      jinbiPerMonth: 3000,
      discountRate: '9折',
      popular: true,
      features: [
        '每月3000津币',
        '5个并发任务',
        '50GB云存储',
        '消费9折优惠',
        '高清无水印导出',
        '优先处理队列',
        '专属模板库'
      ],
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
      id: 'star',
      name: '星耀会员',
      price: getPriceDisplay('star').monthly.price,
      period: '月',
      description: '专业创作者首选',
      jinbiPerMonth: 8000,
      discountRate: '85折',
      features: [
        '每月8000津币',
        '10个并发任务',
        '200GB云存储',
        '消费85折优惠',
        '4K超清导出',
        '高级AI模型',
        '一对一客服',
        '商业使用授权'
      ],
      icon: Gem,
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
      bgGradient: isDark
        ? 'from-violet-500/10 via-purple-500/10 to-fuchsia-500/10'
        : 'from-violet-50 via-purple-50 to-fuchsia-50',
      borderColor: isDark ? 'border-violet-500/30' : 'border-violet-200',
      textColor: isDark ? 'text-violet-300' : 'text-violet-700',
      buttonGradient: 'from-violet-500 to-purple-500'
    },
    {
      id: 'vip',
      name: '至尊会员',
      price: getPriceDisplay('vip').monthly.price,
      period: '月',
      description: '享受顶级AI创作体验',
      jinbiPerMonth: 20000,
      discountRate: '8折',
      features: [
        '每月20000津币',
        '20个并发任务',
        '无限云存储',
        '消费8折优惠',
        '专属AI训练模型',
        '最高优先级处理',
        '7x24小时专属客服',
        '专属活动邀请',
        'API访问权限'
      ],
      icon: Crown,
      gradient: 'from-amber-500 via-orange-500 to-red-500',
      bgGradient: isDark
        ? 'from-amber-500/10 via-orange-500/10 to-red-500/10'
        : 'from-amber-50 via-orange-50 to-red-50',
      borderColor: isDark ? 'border-amber-500/30' : 'border-amber-200',
      textColor: isDark ? 'text-amber-300' : 'text-amber-700',
      buttonGradient: 'from-amber-500 to-orange-500'
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
          升级会员，每月获得津币奖励，享受更多AI创作功能
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentLevel === plan.id;
          const canUpgrade = currentLevel !== 'vip' && plan.id !== 'free' && plan.id !== currentLevel;

          return (
            <motion.div
              key={plan.id}
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`
                relative rounded-2xl overflow-hidden border-2
                ${plan.popular ? 'md:-mt-2 md:mb-2 ring-2 ring-offset-2 ring-offset-background ring-blue-500' : ''}
                ${isCurrentPlan ? 'ring-2 ring-offset-2 ring-offset-background ' + plan.borderColor.replace('border-', 'ring-') : ''}
                ${plan.borderColor}
                ${isDark ? 'bg-slate-900/50' : 'bg-white'}
              `}
            >
              {/* 热门标签 */}
              {plan.popular && (
                <div className={`
                  absolute top-0 left-0 right-0 py-1.5 text-center text-xs font-medium text-white
                  bg-gradient-to-r ${plan.gradient}
                `}>
                  <div className="flex items-center justify-center gap-1">
                    <Sparkles size={12} />
                    <span>最受欢迎</span>
                  </div>
                </div>
              )}

              {/* 当前计划标签 */}
              {isCurrentPlan && (
                <div className={`
                  absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium
                  ${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}
                `}>
                  当前
                </div>
              )}

              <div className={`p-4 ${plan.popular ? 'pt-10' : ''}`}>
                {/* 图标和名称 */}
                <div className="text-center mb-4">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`
                      w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3
                      bg-gradient-to-br ${plan.gradient}
                      shadow-lg
                    `}
                  >
                    <Icon size={24} className="text-white" />
                  </motion.div>
                  <h4 className={`text-lg font-bold ${plan.textColor}`}>{plan.name}</h4>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                </div>

                {/* 价格 */}
                <div className="text-center mb-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ¥{plan.price}
                    </span>
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      /{plan.period}
                    </span>
                  </div>
                  
                  {/* 津币奖励 */}
                  {plan.jinbiPerMonth > 0 && (
                    <div className={`
                      mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs
                      ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'}
                    `}>
                      <Coins size={12} />
                      每月{plan.jinbiPerMonth.toLocaleString()}津币
                    </div>
                  )}
                  
                  {/* 折扣 */}
                  {plan.discountRate !== '无折扣' && (
                    <div className={`
                      mt-1 text-xs
                      ${isDark ? 'text-emerald-400' : 'text-emerald-600'}
                    `}>
                      消费{plan.discountRate}
                    </div>
                  )}
                </div>

                {/* 功能列表 */}
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check size={14} className={`mt-0.5 flex-shrink-0 ${plan.textColor}`} />
                      <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* 按钮 */}
                {plan.id === 'free' ? (
                  <button
                    disabled
                    className={`
                      w-full py-2 rounded-xl text-sm font-medium
                      ${isDark 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                    `}
                  >
                    免费使用
                  </button>
                ) : isCurrentPlan ? (
                  <button
                    disabled
                    className={`
                      w-full py-2 rounded-xl text-sm font-medium
                      ${isDark 
                        ? 'bg-emerald-500/20 text-emerald-300 cursor-not-allowed' 
                        : 'bg-emerald-100 text-emerald-700 cursor-not-allowed'}
                    `}
                  >
                    当前计划
                  </button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onUpgrade(plan.id)}
                    className={`
                      w-full py-2 rounded-xl text-sm font-medium text-white
                      bg-gradient-to-r ${plan.buttonGradient}
                      shadow-lg hover:shadow-xl transition-shadow
                      flex items-center justify-center gap-1
                    `}
                  >
                    <Zap size={14} />
                    立即升级
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 津币说明 */}
      <div className={`mt-8 p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
        <div className="flex items-start gap-3">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
            ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}
          `}>
            <Coins className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h4 className={`font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
              什么是津币？
            </h4>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              津币是平台的虚拟货币，用于支付AI生成服务。升级会员每月可获得津币奖励，
              也可以直接充值购买。津币余额不足时，部分功能将无法使用。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingCards;
