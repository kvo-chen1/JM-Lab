import React from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Zap,
  TrendingUp,
  Sparkles,
  Clock,
  ArrowRight,
  RefreshCw,
  Package,
  Headphones,
  Percent,
  Gift,
  Crown,
  Star,
  AlertCircle,
  CheckCircle2,
  Infinity,
  Coins,
  TrendingDown,
  Wallet
} from 'lucide-react';
import { User } from '@/contexts/authContext';

interface UsageStats {
  aiGenerations: {
    used: number;
    total: number | null;
    percentage: number;
  };
  storage: {
    used: number;
    total: number | null;
    percentage: number;
  };
  exports: {
    used: number;
    total: number | null;
    percentage: number;
  };
  jinbi?: {
    earned: number;
    spent: number;
    netChange: number;
  };
}

interface RightSidebarProps {
  isDark: boolean;
  user: User | null;
  membershipLevel?: string;
  membershipStatus?: string;
  membershipEnd?: string | Date | null;
  onRenew: () => void;
  onUpgrade: () => void;
  usageStats?: UsageStats | null;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  isDark,
  user,
  membershipLevel,
  membershipStatus,
  membershipEnd,
  onRenew,
  onUpgrade,
  usageStats
}) => {
  // 优先使用传入的会员信息，否则使用 user 对象中的信息
  const currentLevel = membershipLevel || user?.membershipLevel || 'free';
  const currentStatus = membershipStatus || user?.membershipStatus || 'active';
  const currentEndDate = membershipEnd || user?.membershipEnd;

  const isActive = currentStatus === 'active';
  const daysUntilExpiry = currentEndDate
    ? Math.ceil((new Date(currentEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // 使用传入的统计数据或默认值
  const defaultStats = {
    aiGenerations: { used: 0, total: 10, percentage: 0 },
    storage: { used: 0, total: 1, percentage: 0 },
    exports: { used: 0, total: 5, percentage: 0 }
  };

  const stats = usageStats ? {
    aiGenerations: usageStats.aiGenerations || defaultStats.aiGenerations,
    storage: usageStats.storage || defaultStats.storage,
    exports: usageStats.exports || defaultStats.exports,
    jinbi: usageStats.jinbi
  } : defaultStats;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-rose-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const formatValue = (value: number | null, suffix: string = '') => {
    if (value === null) return <Infinity size={14} className="inline" />;
    return `${value}${suffix}`;
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-slate-900/30' : 'bg-gray-50/50'}`}>
      {/* 会员提醒区域 */}
      <div className={`p-5 ${isDark ? 'border-b border-slate-700/50' : 'border-b border-gray-200'}`}>
        <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
          <Bell size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
          会员提醒
        </h3>

        {!isActive ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              rounded-xl p-4 border
              ${isDark
                ? 'bg-rose-500/10 border-rose-500/30'
                : 'bg-rose-50 border-rose-200'
            }
            `}
          >
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>
                  会员已过期
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-rose-400/70' : 'text-rose-600/70'}`}>
                  您的会员权益已暂停，续费后可恢复使用
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onRenew}
                  className="mt-3 px-4 py-2 rounded-lg text-sm font-medium bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                >
                  立即续费
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : daysUntilExpiry && daysUntilExpiry <= 7 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              rounded-xl p-4 border
              ${isDark
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-amber-50 border-amber-200'
            }
            `}
          >
            <div className="flex items-start gap-3">
              <Clock size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                  即将到期
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-amber-400/70' : 'text-amber-600/70'}`}>
                  还有 {daysUntilExpiry} 天到期，建议及时续费
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onRenew}
                  className="mt-3 px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                >
                  续费会员
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              rounded-xl p-4 border
              ${isDark
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-emerald-50 border-emerald-200'
            }
            `}
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  会员状态正常
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-emerald-400/70' : 'text-emerald-600/70'}`}>
                  {daysUntilExpiry
                    ? `会员有效期还剩 ${daysUntilExpiry} 天`
                    : '您的会员权益正在生效中'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* 快捷操作 */}
      <div className={`p-5 ${isDark ? 'border-b border-slate-700/50' : 'border-b border-gray-200'}`}>
        <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
          <Zap size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
          快捷操作
        </h3>

        <div className="space-y-2">
          <motion.button
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRenew}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              font-medium text-sm transition-all duration-200
              ${isDark
                ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }
            `}
          >
            <RefreshCw size={18} />
            <span className="flex-1 text-left">续费会员</span>
            <ArrowRight size={16} className="opacity-50" />
          </motion.button>

          {currentLevel !== 'vip' && (
            <motion.button
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onUpgrade}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                font-medium text-sm transition-all duration-200
                ${isDark
                  ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }
              `}
            >
              <Sparkles size={18} />
              <span className="flex-1 text-left">升级会员</span>
              <ArrowRight size={16} className="opacity-50" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              font-medium text-sm transition-all duration-200
              ${isDark
                ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }
            `}
          >
            <Package size={18} />
            <span className="flex-1 text-left">查看订单</span>
            <ArrowRight size={16} className="opacity-50" />
          </motion.button>
        </div>
      </div>

      {/* 津币统计 */}
      {stats.jinbi && (
        <div className={`p-5 ${isDark ? 'border-b border-slate-700/50' : 'border-b border-gray-200'}`}>
          <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
            <Coins size={16} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
            津币统计
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <div className={`
              rounded-xl p-3 text-center
              ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}
            `}>
              <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>本月收入</p>
              <p className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                +{stats.jinbi.earned.toLocaleString()}
              </p>
            </div>
            <div className={`
              rounded-xl p-3 text-center
              ${isDark ? 'bg-rose-500/10' : 'bg-rose-50'}
            `}>
              <TrendingDown className="w-4 h-4 text-rose-500 mx-auto mb-1" />
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>本月支出</p>
              <p className={`font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                -{stats.jinbi.spent.toLocaleString()}
              </p>
            </div>
            <div className={`
              rounded-xl p-3 text-center
              ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}
            `}>
              <Wallet className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>净变化</p>
              <p className={`font-bold ${stats.jinbi.netChange >= 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-rose-400' : 'text-rose-600')}`}>
                {stats.jinbi.netChange >= 0 ? '+' : ''}{stats.jinbi.netChange.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 使用统计 */}
      <div className={`p-5 ${isDark ? 'border-b border-slate-700/50' : 'border-b border-gray-200'}`}>
        <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
          <TrendingUp size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
          本月使用统计
        </h3>

        <div className="space-y-4">
          {/* AI生成次数 */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>AI生成次数</span>
              <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {stats.aiGenerations.used} / {formatValue(stats.aiGenerations.total)}
              </span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.aiGenerations.total === null ? 100 : Math.min(stats.aiGenerations.percentage, 100)}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`h-full rounded-full ${getProgressColor(stats.aiGenerations.percentage)}`}
              />
            </div>
          </div>

          {/* 存储空间 */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>存储空间</span>
              <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {stats.storage.used}GB / {formatValue(stats.storage.total, 'GB')}
              </span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.storage.total === null ? 100 : Math.min(stats.storage.percentage, 100)}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className={`h-full rounded-full ${getProgressColor(stats.storage.percentage)}`}
              />
            </div>
          </div>

          {/* 导出次数 */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>高清导出</span>
              <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {stats.exports.used} / {formatValue(stats.exports.total)}
              </span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.exports.total === null ? 100 : Math.min(stats.exports.percentage, 100)}%` }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className={`h-full rounded-full ${getProgressColor(stats.exports.percentage)}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 推荐升级 */}
      {currentLevel !== 'vip' && (
        <div className={`p-5 ${isDark ? 'border-b border-slate-700/50' : 'border-b border-gray-200'}`}>
          <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
            <Gift size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
            推荐升级
          </h3>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`
              rounded-xl p-4 border cursor-pointer
              ${isDark
                ? 'bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/30'
                : 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200'
              }
            `}
            onClick={onUpgrade}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}
              `}>
                <Crown size={20} className="text-purple-500" />
              </div>
              <div>
                <p className={`font-medium text-sm ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                  {currentLevel === 'free' ? '高级会员' : 'VIP会员'}
                </p>
                <p className={`text-xs ${isDark ? 'text-purple-400/70' : 'text-purple-600/70'}`}>
                  解锁更多权益
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {(currentLevel === 'free' ? [
                '无限AI生成次数',
                '高级AI模型访问',
                '去除水印'
              ] : [
                '专属AI训练模型',
                '一对一设计师服务',
                '商业授权'
              ]).map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Star size={12} className="text-purple-500" />
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{feature}</span>
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-4 py-2 rounded-lg text-sm font-medium bg-purple-500 text-white hover:bg-purple-600 transition-colors"
            >
              立即升级
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* 限时活动 */}
      <div className="p-5">
        <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
          <Percent size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
          限时活动
        </h3>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            rounded-xl p-4 border
            ${isDark
              ? 'bg-gradient-to-br from-rose-500/10 to-orange-500/10 border-rose-500/30'
              : 'bg-gradient-to-br from-rose-50 to-orange-50 border-rose-200'
            }
          `}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-500 text-white">
              限时
            </span>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              剩余 3 天
            </span>
          </div>
          <p className={`font-medium text-sm ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>
            新年特惠活动
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            升级年付会员享 8 折优惠
          </p>
        </motion.div>
      </div>

      {/* 客服支持 */}
      <div className={`mt-auto p-5 ${isDark ? 'border-t border-slate-700/50' : 'border-t border-gray-200'}`}>
        <div className={`
          rounded-xl p-4 flex items-center gap-3
          ${isDark ? 'bg-slate-800/50' : 'bg-white border border-gray-200'}
        `}>
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}
          `}>
            <Headphones size={20} className="text-indigo-500" />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              需要帮助？
            </p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              联系客服获取支持
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
