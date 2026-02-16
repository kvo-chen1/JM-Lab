import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { usePoints } from '@/contexts/PointsContext';
import { Coins, TrendingUp, TrendingDown, History, X, ChevronRight } from 'lucide-react';

interface PointsDisplayProps {
  showDetails?: boolean;
  variant?: 'compact' | 'full';
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({ 
  showDetails = true,
  variant = 'compact'
}) => {
  const { isDark } = useTheme();
  const { currentPoints, recentChanges, stats, isLoading } = usePoints();
  const [showHistory, setShowHistory] = useState(false);
  const [animatePoints, setAnimatePoints] = useState(false);
  const [prevPoints, setPrevPoints] = useState(currentPoints);

  // 监听积分变化，触发动画
  useEffect(() => {
    if (currentPoints !== prevPoints) {
      setAnimatePoints(true);
      const timer = setTimeout(() => {
        setAnimatePoints(false);
        setPrevPoints(currentPoints);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPoints, prevPoints]);

  // 格式化数字
  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) {
      return '0';
    }
    return Math.max(0, num).toLocaleString('zh-CN');
  };

  // 获取变动图标
  const getChangeIcon = (type: 'earned' | 'spent') => {
    return type === 'earned' ? (
      <TrendingUp className="w-3 h-3 text-green-500" />
    ) : (
      <TrendingDown className="w-3 h-3 text-red-500" />
    );
  };

  // 获取变动颜色
  const getChangeColor = (type: 'earned' | 'spent') => {
    return type === 'earned' ? 'text-green-500' : 'text-red-500';
  };

  if (variant === 'compact') {
    return (
      <>
        {/* 紧凑版本 - 用于导航栏 */}
        <motion.div
          className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all ${
            isDark 
              ? 'bg-gray-800 hover:bg-gray-700' 
              : 'bg-white hover:bg-gray-50'
          } shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
          onClick={() => setShowHistory(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={`p-1 rounded-full ${isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'}`}>
            <Coins className="w-4 h-4 text-yellow-500" />
          </div>
          <motion.span
            key={currentPoints}
            initial={animatePoints ? { scale: 1.2, color: currentPoints > prevPoints ? '#22c55e' : '#ef4444' } : {}}
            animate={{ scale: 1, color: isDark ? '#fff' : '#000' }}
            className="font-bold text-sm"
          >
            {isLoading ? '...' : formatNumber(currentPoints)}
          </motion.span>

          {/* 变动提示 */}
          <AnimatePresence>
            {recentChanges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                  recentChanges[0].type === 'earned' ? 'bg-green-500' : 'bg-red-500'
                } text-white`}
              >
                {recentChanges[0].type === 'earned' ? '+' : '-'}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 历史记录弹窗 */}
        <AnimatePresence>
          {showHistory && showDetails && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                onClick={() => setShowHistory(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className={`fixed top-16 right-4 w-80 z-50 rounded-2xl shadow-2xl overflow-hidden ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                {/* 头部 */}
                <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5 text-gray-500" />
                      <span className="font-bold">积分变动</span>
                    </div>
                    <button
                      onClick={() => setShowHistory(false)}
                      className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 积分概览 */}
                <div className={`p-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>当前积分</span>
                    <span className="text-2xl font-bold text-yellow-500">{formatNumber(currentPoints)}</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="flex-1">
                      <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>累计获得</div>
                      <div className="font-medium text-green-500">+{formatNumber(stats.totalEarned)}</div>
                    </div>
                    <div className="flex-1">
                      <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>累计消耗</div>
                      <div className="font-medium text-red-500">-{formatNumber(stats.totalSpent)}</div>
                    </div>
                  </div>
                </div>

                {/* 最近变动 */}
                <div className="max-h-64 overflow-y-auto">
                  {recentChanges.length === 0 ? (
                    <div className={`p-4 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      暂无积分变动记录
                    </div>
                  ) : (
                    recentChanges.map((change, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-3 flex items-center justify-between border-b ${
                          isDark ? 'border-gray-700' : 'border-gray-100'
                        } last:border-0`}
                      >
                        <div className="flex items-center gap-2">
                          {getChangeIcon(change.type)}
                          <div>
                            <div className="text-sm font-medium">{change.source}</div>
                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {change.description}
                            </div>
                          </div>
                        </div>
                        <div className={`font-bold ${getChangeColor(change.type)}`}>
                          {change.type === 'earned' ? '+' : '-'}{change.points}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* 底部链接 */}
                <div className={`p-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <a
                    href="/points-history"
                    className={`flex items-center justify-center gap-1 text-sm font-medium ${
                      isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'
                    }`}
                  >
                    查看全部记录
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // 完整版本
  return (
    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
      {/* 积分概览 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            我的积分
          </h3>
          <motion.div
            key={currentPoints}
            initial={animatePoints ? { scale: 1.1 } : {}}
            animate={{ scale: 1 }}
            className="flex items-center gap-2"
          >
            <Coins className="w-8 h-8 text-yellow-500" />
            <span className="text-4xl font-bold">{formatNumber(currentPoints)}</span>
          </motion.div>
        </div>
        <div className="text-right">
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>今日获得</div>
          <div className="text-xl font-bold text-green-500">
            +{formatNumber(recentChanges
              .filter(c => c.type === 'earned')
              .reduce((sum, c) => sum + c.points, 0)
            )}
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>累计获得</div>
          <div className="text-lg font-bold text-green-500">+{formatNumber(stats.totalEarned)}</div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>累计消耗</div>
          <div className="text-lg font-bold text-red-500">-{formatNumber(stats.totalSpent)}</div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>兑换次数</div>
          <div className="text-lg font-bold text-blue-500">{stats.sourceStats.exchange || 0}</div>
        </div>
      </div>

      {/* 最近变动 */}
      {showDetails && (
        <div>
          <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            最近变动
          </h4>
          <div className="space-y-2">
            {recentChanges.length === 0 ? (
              <div className={`text-sm text-center py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                暂无积分变动
              </div>
            ) : (
              recentChanges.slice(0, 3).map((change, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      change.type === 'earned' 
                        ? isDark ? 'bg-green-500/20' : 'bg-green-100'
                        : isDark ? 'bg-red-500/20' : 'bg-red-100'
                    }`}>
                      {getChangeIcon(change.type)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{change.source}</div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {change.description}
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold ${getChangeColor(change.type)}`}>
                    {change.type === 'earned' ? '+' : '-'}{change.points}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsDisplay;
