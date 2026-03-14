import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  X,
  Zap,
  Calendar,
  Target,
  Share2,
  Sparkles,
  Lock,
  Unlock
} from 'lucide-react';
import type { Achievement } from '../types';
import { rarityConfig } from '../hooks/useAchievements';
import { AchievementIcon } from './AchievementIcon';

interface AchievementDetailProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AchievementDetail({
  achievement,
  isOpen,
  onClose,
}: AchievementDetailProps) {
  const { isDark } = useTheme();

  if (!achievement) return null;

  const rarity = rarityConfig[achievement.rarity] || rarityConfig.common;
  const isUnlocked = achievement.isUnlocked || false;

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
          />

          {/* 弹窗内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed inset-0 flex items-center justify-center p-4 z-[70]`}
          >
            <div className={`w-full max-w-lg max-h-[90vh] ${
              isDark ? 'bg-gray-900' : 'bg-white'
            } rounded-3xl overflow-hidden shadow-2xl flex flex-col`}
            >
            {/* 头部装饰 */}
            <div
              className={`h-32 relative overflow-hidden ${
                isUnlocked
                  ? isDark ? rarity.darkBgColor : rarity.bgColor
                  : isDark ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              {/* 装饰图案 */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${rarity.color}40 0%, transparent 70%)`,
                  }}
                />
              </div>

              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isDark
                    ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-400'
                    : 'bg-white/80 hover:bg-white text-gray-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              {/* 成就图标 */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                className={`absolute -bottom-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-3xl ${
                  isUnlocked
                    ? isDark
                      ? 'bg-gradient-to-br from-white/20 to-white/5 border-2 border-white/20'
                      : 'bg-white border-2 border-gray-100 shadow-lg'
                    : isDark
                      ? 'bg-gray-700 border-2 border-gray-600'
                      : 'bg-gray-200 border-2 border-gray-300'
                }`}
                style={{
                  boxShadow: isUnlocked ? `0 8px 32px ${rarity.color}40` : 'none',
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <AchievementIcon
                    icon={achievement.icon || 'star'}
                    className="w-10 h-10"
                    style={{ 
                      color: isUnlocked ? rarity.color : isDark ? '#4B5563' : '#9CA3AF'
                    }}
                    fallbackClassName="text-4xl"
                  />
                </div>
              </motion.div>
            </div>

            {/* 内容区域 */}
            <div className="pt-14 pb-6 px-6 overflow-y-auto">
              {/* 状态标签 */}
              <div className="flex justify-center mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                    isUnlocked
                      ? isDark
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-green-100 text-green-600'
                      : isDark
                        ? 'bg-gray-700 text-gray-500'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isUnlocked ? (
                    <>
                      <Unlock className="w-3 h-3" />
                      已解锁
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" />
                      未解锁
                    </>
                  )}
                </span>
              </div>

              {/* 标题 */}
              <h2 className={`text-2xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {achievement.name || '未知成就'}
              </h2>

              {/* 稀有度 */}
              <div className="flex justify-center mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                    isDark ? rarity.darkBgColor : rarity.bgColor
                  }`}
                  style={{ color: rarity.color }}
                >
                  <Sparkles className="w-3 h-3" />
                  {rarity.label}成就
                </span>
              </div>

              {/* 描述 */}
              <p className={`text-center text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {achievement.description || '暂无描述'}
              </p>

              {/* 信息卡片 */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-[#F59E0B]" />
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>积分奖励</span>
                  </div>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {achievement.points || 0}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-[#C02C38]" />
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>完成进度</span>
                  </div>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {achievement.progress || 0}%
                  </p>
                </div>
              </div>

              {/* 进度条 */}
              <div className="mb-6">
                <div className="flex justify-between text-xs mb-2">
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                    {achievement.criteria || '完成条件'}
                  </span>
                  <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                    {achievement.progress || 0}%
                  </span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${achievement.progress || 0}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: rarity.color }}
                  />
                </div>
              </div>

              {/* 解锁时间 */}
              {isUnlocked && achievement.unlockedAt && (
                <div className={`flex items-center justify-center gap-2 p-4 rounded-2xl mb-6 ${
                  isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-100'
                }`}>
                  <Calendar className="w-4 h-4 text-green-500" />
                  <span className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    解锁于 {achievement.unlockedAt}
                  </span>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                    isUnlocked
                      ? 'bg-[#C02C38] text-white hover:bg-[#D04550]'
                      : isDark
                        ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!isUnlocked}
                >
                  <Share2 className="w-4 h-4" />
                  分享成就
                </button>
                <button
                  onClick={onClose}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                    isDark
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  关闭
                </button>
              </div>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
