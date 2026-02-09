import React from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Star,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Zap
} from 'lucide-react';
import { User as UserType } from '@/contexts/authContext';

interface MembershipStatusCardProps {
  isDark: boolean;
  user: UserType | null;
  onRenew: () => void;
  onUpgrade: () => void;
}

const MembershipStatusCard: React.FC<MembershipStatusCardProps> = ({
  isDark,
  user,
  onRenew,
  onUpgrade
}) => {
  const isActive = user?.membershipStatus === 'active';
  const daysUntilExpiry = user?.membershipEnd
    ? Math.ceil((new Date(user.membershipEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const getMembershipConfig = (level?: string) => {
    switch (level) {
      case 'vip':
        return {
          name: 'VIP会员',
          icon: Crown,
          gradient: 'from-purple-500 via-violet-500 to-indigo-500',
          bgGradient: isDark
            ? 'from-purple-500/20 via-violet-500/20 to-indigo-500/20'
            : 'from-purple-100 via-violet-100 to-indigo-100',
          borderColor: isDark ? 'border-purple-500/30' : 'border-purple-300',
          textColor: isDark ? 'text-purple-300' : 'text-purple-700',
          accentColor: 'text-purple-500',
          description: '享受顶级AI创作体验',
          features: ['专属AI训练模型', '一对一设计师服务', '商业授权', '无限作品存储']
        };
      case 'premium':
        return {
          name: '高级会员',
          icon: Star,
          gradient: 'from-blue-500 via-cyan-500 to-teal-500',
          bgGradient: isDark
            ? 'from-blue-500/20 via-cyan-500/20 to-teal-500/20'
            : 'from-blue-100 via-cyan-100 to-teal-100',
          borderColor: isDark ? 'border-blue-500/30' : 'border-blue-300',
          textColor: isDark ? 'text-blue-300' : 'text-blue-700',
          accentColor: 'text-blue-500',
          description: '解锁高级AI创作功能',
          features: ['无限AI生成次数', '高级AI模型访问', '高清作品导出', '优先处理队列']
        };
      default:
        return {
          name: '免费会员',
          icon: User,
          gradient: 'from-gray-400 via-slate-400 to-zinc-400',
          bgGradient: isDark
            ? 'from-gray-500/20 via-slate-500/20 to-zinc-500/20'
            : 'from-gray-100 via-slate-100 to-zinc-100',
          borderColor: isDark ? 'border-gray-500/30' : 'border-gray-300',
          textColor: isDark ? 'text-gray-300' : 'text-gray-700',
          accentColor: 'text-gray-500',
          description: '基础AI创作体验',
          features: ['基础AI创作功能', '每天限量生成次数', '基础社区功能', '基础作品存储']
        };
    }
  };

  const config = getMembershipConfig(user?.membershipLevel);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative overflow-hidden rounded-3xl p-8
        bg-gradient-to-br ${config.bgGradient}
        border ${config.borderColor}
        ${isDark ? 'backdrop-blur-sm' : ''}
      `}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`
          absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30
          bg-gradient-to-br ${config.gradient} blur-3xl
        `} />
        <div className={`
          absolute -bottom-20 -left-20 w-48 h-48 rounded-full opacity-20
          bg-gradient-to-tr ${config.gradient} blur-3xl
        `} />
      </div>

      {/* 装饰性网格 */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(${isDark ? '#fff' : '#000'} 1px, transparent 1px),
                           linear-gradient(90deg, ${isDark ? '#fff' : '#000'} 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative">
        {/* 顶部徽章和状态 */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className={`
                w-16 h-16 rounded-2xl flex items-center justify-center
                bg-gradient-to-br ${config.gradient}
                shadow-lg shadow-${config.accentColor.split('-')[1]}-500/30
              `}
            >
              <Icon size={32} className="text-white" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {config.name}
                </h2>
                <Sparkles size={18} className={config.accentColor} />
              </div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {config.description}
              </p>
            </div>
          </div>

          {/* 状态标签 */}
          <div className={`
            px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2
            ${!isActive
              ? isDark
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-rose-100 text-rose-700 border border-rose-200'
              : daysUntilExpiry && daysUntilExpiry <= 7
                ? isDark
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-amber-100 text-amber-700 border border-amber-200'
                : isDark
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            }
          `}>
            {!isActive ? (
              <>
                <AlertCircle size={14} />
                <span>已过期</span>
              </>
            ) : daysUntilExpiry && daysUntilExpiry <= 7 ? (
              <>
                <Clock size={14} />
                <span>即将到期</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>有效</span>
              </>
            )}
          </div>
        </div>

        {/* 到期时间 */}
        {user?.membershipEnd && (
          <div className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-6
            ${isDark ? 'bg-slate-800/50' : 'bg-white/60'} backdrop-blur-sm
          `}>
            <Clock size={16} className={isDark ? 'text-slate-400' : 'text-gray-500'} />
            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              到期时间：
              <span className="font-medium">
                {new Date(user.membershipEnd).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                <span className={`ml-2 text-xs ${
                  daysUntilExpiry <= 7
                    ? 'text-amber-500'
                    : isDark ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  (还剩 {daysUntilExpiry} 天)
                </span>
              )}
            </span>
          </div>
        )}

        {/* 权益预览 */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {config.features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl
                ${isDark ? 'bg-slate-800/50' : 'bg-white/60'} backdrop-blur-sm
              `}
            >
              <Zap size={14} className={config.accentColor} />
              <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {feature}
              </span>
            </motion.div>
          ))}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-3">
          {user?.membershipLevel !== 'free' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRenew}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-medium
                transition-all duration-200
                ${isDark
                  ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              <RefreshCw size={18} />
              <span>续费会员</span>
            </motion.button>
          )}

          {user?.membershipLevel !== 'vip' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onUpgrade}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-medium
                bg-gradient-to-r ${config.gradient}
                text-white shadow-lg
                hover:shadow-xl hover:brightness-110
                transition-all duration-200
              `}
            >
              <Sparkles size={18} />
              <span>升级会员</span>
              <ArrowRight size={18} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MembershipStatusCard;
