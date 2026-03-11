import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';

interface JinbiInsufficientModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredAmount: number;
  currentBalance: number;
  serviceName?: string;
}

export const JinbiInsufficientModal: React.FC<JinbiInsufficientModalProps> = ({
  isOpen,
  onClose,
  requiredAmount,
  currentBalance,
  serviceName = '此服务',
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleRecharge = () => {
    onClose();
    navigate('/jinbi');
  };

  const handleUpgrade = () => {
    onClose();
    navigate('/membership');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* 弹窗内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`
              fixed inset-0 flex items-center justify-center z-50
              pointer-events-none
            `}
          >
            <div
              className={`
                w-full max-w-md mx-4 pointer-events-auto
                rounded-2xl p-6 shadow-2xl
                ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'}
              `}
              onClick={(e) => e.stopPropagation()}
            >
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className={`
                absolute top-4 right-4 p-1 rounded-lg
                ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}
                transition-colors
              `}
            >
              <X size={20} />
            </button>

            {/* 图标 */}
            <div className="flex justify-center mb-4">
              <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center
                ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}
              `}>
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
            </div>

            {/* 标题 */}
            <h3 className={`text-xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              津币余额不足
            </h3>

            {/* 描述 */}
            <p className={`text-center mb-6 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              {serviceName}需要 <span className="font-semibold text-amber-500">{requiredAmount}</span> 津币
              <br />
              您当前余额为 <span className="font-semibold">{currentBalance}</span> 津币
            </p>

            {/* 余额卡片 */}
            <div className={`
              rounded-xl p-4 mb-6
              ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}
            `}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>当前余额</span>
                </div>
                <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                  {currentBalance.toLocaleString()} 津币
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-dashed border-gray-300 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>所需金额</span>
                  <span className="font-bold text-rose-500">
                    {requiredAmount.toLocaleString()} 津币
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-dashed border-gray-300 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>差额</span>
                  <span className="font-bold text-rose-500">
                    {(requiredAmount - currentBalance).toLocaleString()} 津币
                  </span>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRecharge}
                className={`
                  w-full py-3 rounded-xl font-medium
                  flex items-center justify-center gap-2
                  ${isDark
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white hover:from-amber-600 hover:to-yellow-700'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white hover:from-amber-600 hover:to-yellow-700'
                  }
                  transition-all shadow-lg shadow-amber-500/25
                `}
              >
                <Coins className="w-5 h-5" />
                立即充值津币
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpgrade}
                className={`
                  w-full py-3 rounded-xl font-medium
                  flex items-center justify-center gap-2
                  ${isDark
                    ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                  }
                  transition-all
                `}
              >
                <Sparkles className="w-5 h-5" />
                升级会员获取更多津币
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className={`
                  w-full py-3 rounded-xl font-medium text-sm
                  ${isDark
                    ? 'text-slate-400 hover:text-slate-300'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                  transition-colors
                `}
              >
                稍后再说
              </motion.button>
            </div>

            {/* 提示 */}
            <p className={`text-xs text-center mt-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              升级会员每月可获得大量津币奖励，更划算！
            </p>
          </div>
        </motion.div>
      </>
      )}
    </AnimatePresence>
  );
};

export default JinbiInsufficientModal;
