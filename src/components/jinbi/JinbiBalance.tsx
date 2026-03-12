import React from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useJinbi } from '@/hooks/useJinbi';
import { useTheme } from '@/hooks/useTheme';

interface JinbiBalanceProps {
  showDetails?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export const JinbiBalance: React.FC<JinbiBalanceProps> = ({
  showDetails = false,
  compact = false,
  onClick,
}) => {
  const { isDark } = useTheme();
  const { balance, monthlyStats, loading } = useJinbi();

  // Debug logging
  React.useEffect(() => {
    console.log('[JinbiBalance] balance:', balance);
    console.log('[JinbiBalance] loading:', loading);
  }, [balance, loading]);

  const availableBalance = balance?.availableBalance || 0;

  if (compact) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full
          ${isDark
            ? 'bg-gradient-to-r from-amber-500/20 to-yellow-600/20 hover:from-amber-500/30 hover:to-yellow-600/30'
            : 'bg-gradient-to-r from-amber-100 to-yellow-100 hover:from-amber-200 hover:to-yellow-200'
          }
          transition-all duration-200
        `}
      >
        <Coins className="w-4 h-4 text-amber-500" />
        <span className={`font-bold text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
          {loading.balance ? '...' : (availableBalance || 0).toLocaleString()}
        </span>
        <span className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>津币</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-2xl p-5 border
        ${isDark
          ? 'bg-gradient-to-br from-amber-500/10 to-yellow-600/10 border-amber-500/30'
          : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200'
        }
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center
            ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}
          `}>
            <Wallet className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>津币余额</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
              {loading.balance ? '...' : (availableBalance || 0).toLocaleString()}
              <span className="text-sm font-normal ml-1">津币</span>
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium
            ${isDark
              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
              : 'bg-amber-500 text-white hover:bg-amber-600'
            }
            transition-colors
          `}
        >
          充值
        </motion.button>
      </div>

      {showDetails && (
        <div className={`
          grid grid-cols-3 gap-4 pt-4 border-t
          ${isDark ? 'border-amber-500/20' : 'border-amber-200'}
        `}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>本月收入</span>
            </div>
            <p className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              +{(monthlyStats?.earned || 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="w-3 h-3 text-rose-500" />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>本月支出</span>
            </div>
            <p className={`font-semibold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
              -{(monthlyStats?.spent || 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Coins className="w-3 h-3 text-amber-500" />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>净变化</span>
            </div>
            <p className={`font-semibold ${
              (monthlyStats?.netChange || 0) >= 0
                ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
                : (isDark ? 'text-rose-400' : 'text-rose-600')
            }`}>
              {(monthlyStats?.netChange || 0) >= 0 ? '+' : ''}{(monthlyStats?.netChange || 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default JinbiBalance;
