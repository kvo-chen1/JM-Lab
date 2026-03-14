import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Lock, Unlock, Zap, ChevronRight } from 'lucide-react';
import type { Achievement, ViewMode } from '../types';
import { rarityConfig } from '../hooks/useAchievements';
import { AchievementIcon } from './AchievementIcon';

interface AchievementCardProps {
  achievement: Achievement;
  viewMode: ViewMode;
  index: number;
  onClick: () => void;
}

export default function AchievementCard({
  achievement,
  viewMode,
  index,
  onClick,
}: AchievementCardProps) {
  const { isDark } = useTheme();
  
  // 防御性检查
  if (!achievement) {
    return null;
  }
  
  const rarity = rarityConfig[achievement.rarity] || rarityConfig.common;
  const isUnlocked = achievement.isUnlocked || false;

  // 网格视图
  if (viewMode === 'grid') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        onClick={onClick}
        className={`group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 ${
          isUnlocked
            ? isDark
              ? `${rarity.darkBgColor} border ${rarity.darkBorderColor}`
              : `${rarity.bgColor} border ${rarity.borderColor}`
            : isDark
              ? 'bg-gray-800/50 border border-gray-700/50 opacity-70'
              : 'bg-gray-50 border border-gray-200 opacity-70'
        }`}
      >
        {/* 发光效果 */}
        {isUnlocked && (
          <div
            className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${rarity.glowColor}`}
            style={{
              boxShadow: `inset 0 0 30px ${rarity.color}20`,
            }}
          />
        )}

        <div className="relative p-5">
          {/* 顶部：图标和状态 */}
          <div className="flex items-start justify-between mb-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                isUnlocked
                  ? isDark
                    ? 'bg-gradient-to-br from-white/20 to-white/5'
                    : 'bg-gradient-to-br from-white/80 to-white/40'
                  : isDark
                    ? 'bg-gray-700'
                    : 'bg-gray-200'
              }`}
              style={{
                boxShadow: isUnlocked ? `0 4px 20px ${rarity.color}40` : 'none',
              }}
            >
              <AchievementIcon
                icon={achievement.icon || 'star'}
                className="w-6 h-6"
                style={{ color: isUnlocked ? rarity.color : isDark ? '#4B5563' : '#9CA3AF' }}
              />
            </motion.div>

            {/* 状态标识 */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isUnlocked
                ? isDark
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-green-100 text-green-600'
                : isDark
                  ? 'bg-gray-700 text-gray-500'
                  : 'bg-gray-200 text-gray-500'
            }`}>
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
            </div>
          </div>

          {/* 内容 */}
          <div className="mb-4">
            <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {achievement.name || '未知成就'}
            </h3>
            <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {achievement.description || '暂无描述'}
            </p>
          </div>

          {/* 稀有度标签 */}
          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                isDark ? rarity.darkBgColor : rarity.bgColor
              }`}
              style={{ color: rarity.color }}
            >
              {rarity.label}
            </span>
            <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Zap className="w-3 h-3" />
              {achievement.points || 0} 积分
            </div>
          </div>

          {/* 进度条 */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                {achievement.criteria || '完成条件'}
              </span>
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                {achievement.progress || 0}%
              </span>
            </div>
            <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${achievement.progress || 0}%` }}
                transition={{ duration: 0.8, delay: index * 0.05 + 0.2 }}
                className="h-full rounded-full"
                style={{ backgroundColor: rarity.color }}
              />
            </div>
          </div>

          {/* 解锁时间 */}
          {isUnlocked && achievement.unlockedAt && (
            <p className={`text-xs mt-3 pt-3 border-t ${
              isDark ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'
            }`}>
              解锁于 {achievement.unlockedAt}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  // 列表视图
  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ x: 4 }}
        onClick={onClick}
        className={`group cursor-pointer flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
          isUnlocked
            ? isDark
              ? `${rarity.darkBgColor} border ${rarity.darkBorderColor}`
              : `${rarity.bgColor} border ${rarity.borderColor}`
            : isDark
              ? 'bg-gray-800/50 border border-gray-700/50 opacity-70'
              : 'bg-gray-50 border border-gray-200 opacity-70'
        }`}
      >
        {/* 图标 */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isUnlocked
              ? isDark ? 'bg-white/10' : 'bg-white/60'
              : isDark ? 'bg-gray-700' : 'bg-gray-200'
          }`}
        >
          <AchievementIcon
            icon={achievement.icon || 'star'}
            className="w-5 h-5"
            style={{ color: isUnlocked ? rarity.color : isDark ? '#4B5563' : '#9CA3AF' }}
          />
        </motion.div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {achievement.name || '未知成就'}
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                isDark ? rarity.darkBgColor : rarity.bgColor
              }`}
              style={{ color: rarity.color }}
            >
              {rarity.label}
            </span>
          </div>
          <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {achievement.description || '暂无描述'}
          </p>
        </div>

        {/* 进度 */}
        <div className="w-32 flex-shrink-0 hidden sm:block">
          <div className="flex justify-between text-xs mb-1">
            <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>进度</span>
            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{achievement.progress || 0}%</span>
          </div>
          <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${achievement.progress || 0}%`, backgroundColor: rarity.color }}
            />
          </div>
        </div>

        {/* 积分 */}
        <div className={`flex items-center gap-1 text-sm font-medium flex-shrink-0 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <Zap className="w-4 h-4" />
          {achievement.points || 0}
        </div>

        {/* 箭头 */}
        <ChevronRight className={`w-5 h-5 flex-shrink-0 transition-colors ${
          isDark ? 'text-gray-600 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-gray-600'
        }`} />
      </motion.div>
    );
  }

  // 时间轴视图
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative flex gap-4"
    >
      {/* 时间轴线 */}
      <div className="flex flex-col items-center">
        <motion.div
          whileHover={{ scale: 1.2 }}
          onClick={onClick}
          className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer z-10 ${
            isUnlocked
              ? isDark ? 'bg-[#C02C38]/20 border-2 border-[#C02C38]' : 'bg-[#C02C38]/10 border-2 border-[#C02C38]'
              : isDark ? 'bg-gray-800 border-2 border-gray-600' : 'bg-gray-100 border-2 border-gray-300'
          }`}
        >
          <AchievementIcon
            icon={achievement.icon || 'star'}
            className="w-5 h-5"
            style={{ color: isUnlocked ? '#C02C38' : isDark ? '#4B5563' : '#9CA3AF' }}
          />
        </motion.div>
        {index < 6 && (
          <div className={`w-0.5 flex-1 mt-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
        )}
      </div>

      {/* 内容卡片 */}
      <motion.div
        whileHover={{ y: -2 }}
        onClick={onClick}
        className={`flex-1 cursor-pointer rounded-xl p-4 mb-6 transition-all duration-200 ${
          isUnlocked
            ? isDark
              ? `${rarity.darkBgColor} border ${rarity.darkBorderColor}`
              : `${rarity.bgColor} border ${rarity.borderColor}`
            : isDark
              ? 'bg-gray-800/50 border border-gray-700/50 opacity-70'
              : 'bg-gray-50 border border-gray-200 opacity-70'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {achievement.name || '未知成就'}
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {achievement.description || '暂无描述'}
            </p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              isDark ? rarity.darkBgColor : rarity.bgColor
            }`}
            style={{ color: rarity.color }}
          >
            {rarity.label}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className={`flex items-center gap-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {achievement.points || 0} 积分
            </span>
            {isUnlocked && achievement.unlockedAt && (
              <span>解锁于 {achievement.unlockedAt}</span>
            )}
          </div>
          <div className={`text-xs font-medium ${
            isUnlocked
              ? isDark ? 'text-green-400' : 'text-green-600'
              : isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {achievement.progress || 0}%
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
