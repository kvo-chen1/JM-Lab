import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  Trophy,
  Target,
  Zap,
  Clock,
  TrendingUp,
  Award,
  Star,
  Crown
} from 'lucide-react';
import type { AchievementStats, UserAchievementInfo } from '../types';
import { rarityConfig } from '../hooks/useAchievements';

interface StatsPanelProps {
  stats: AchievementStats | null;
  userInfo: UserAchievementInfo | null;
}

export default function StatsPanel({ stats, userInfo }: StatsPanelProps) {
  const { isDark } = useTheme();

  const statCards = [
    {
      icon: Trophy,
      label: '总成就',
      value: stats?.total || 0,
      color: '#C02C38',
      bgColor: isDark ? 'bg-[#C02C38]/10' : 'bg-[#C02C38]/5',
    },
    {
      icon: Target,
      label: '已解锁',
      value: stats?.unlocked || 0,
      color: '#22C55E',
      bgColor: isDark ? 'bg-green-500/10' : 'bg-green-500/5',
    },
    {
      icon: Zap,
      label: '总积分',
      value: userInfo?.currentPoints?.toLocaleString() || 0,
      color: '#F59E0B',
      bgColor: isDark ? 'bg-amber-500/10' : 'bg-amber-500/5',
    },
    {
      icon: Crown,
      label: '当前等级',
      value: userInfo?.currentLevel?.name || '-',
      color: '#8B5CF6',
      bgColor: isDark ? 'bg-purple-500/10' : 'bg-purple-500/5',
      isText: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className={`relative overflow-hidden rounded-2xl p-4 ${
              isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white border border-gray-100'
            }`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2`}
              style={{ backgroundColor: card.color }}
            />

            <div className="relative">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.bgColor}`}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {card.value}
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {card.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 稀有度分布 */}
      {stats?.rarityDistribution && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className={`rounded-2xl p-5 ${
            isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white border border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              稀有度分布
            </h3>
            <div className={`text-xs px-2 py-1 rounded-full ${
              isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
            }`}>
              共 {stats.total} 个
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.rarityDistribution).map(([rarity, count], index) => {
              const config = rarityConfig[rarity as keyof typeof rarityConfig];
              const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

              return (
                <div key={rarity} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                        {count} 个
                      </span>
                      <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 完成进度 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className={`rounded-2xl p-5 ${
          isDark
            ? 'bg-gradient-to-br from-[#C02C38]/10 to-purple-900/10 border border-[#C02C38]/20'
            : 'bg-gradient-to-br from-[#C02C38]/5 to-purple-50 border border-[#C02C38]/10'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-[#C02C38]/20' : 'bg-[#C02C38]/10'
            }`}>
              <TrendingUp className="w-5 h-5 text-[#C02C38]" />
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                完成进度
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                继续加油，解锁更多成就！
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats?.completionRate || 0}%
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {stats?.unlocked || 0}/{stats?.total || 0}
            </p>
          </div>
        </div>

        <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats?.completionRate || 0}%` }}
            transition={{ duration: 1, delay: 0.8 }}
            className="h-full rounded-full bg-gradient-to-r from-[#C02C38] via-[#D04550] to-[#F59E0B]"
          />
        </div>

        {/* 里程碑标记 */}
        <div className="relative mt-2 h-4">
          {[25, 50, 75, 100].map((milestone) => (
            <div
              key={milestone}
              className="absolute top-0 -translate-x-1/2"
              style={{ left: `${milestone}%` }}
            >
              <div className={`w-0.5 h-2 ${
                (stats?.completionRate || 0) >= milestone
                  ? 'bg-[#C02C38]'
                  : isDark ? 'bg-gray-600' : 'bg-gray-300'
              }`} />
              <span className={`text-[10px] ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {milestone}%
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
