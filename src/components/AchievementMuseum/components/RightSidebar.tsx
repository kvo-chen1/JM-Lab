import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import {
  Trophy,
  Star,
  Clock,
  TrendingUp,
  Award,
  Zap,
  Crown,
  Medal,
  ChevronRight,
  Sparkles,
  Target,
  Flame
} from 'lucide-react';
import type {
  Achievement,
  UserAchievementInfo,
  CreatorLevel,
  LeaderboardItem
} from '../types';
import { rarityConfig } from '../hooks/useAchievements';

interface RightSidebarProps {
  userInfo: UserAchievementInfo | null;
  recentUnlocks: Achievement[];
  creatorLevels: CreatorLevel[];
}

export default function RightSidebar({
  userInfo,
  recentUnlocks,
  creatorLevels,
}: RightSidebarProps) {
  const { isDark } = useTheme();
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 获取排行榜数据
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await apiClient.get<LeaderboardItem[]>('/api/leaderboard/achievements');
        if (response.ok && response.data) {
          setLeaderboard(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const currentLevel = userInfo?.currentLevel;
  const nextLevel = userInfo?.nextLevel;

  return (
    <aside className={`w-80 flex-shrink-0 hidden xl:block ${isDark ? 'bg-gray-900/30' : 'bg-white/30'} backdrop-blur-sm`}>
      <div className="sticky top-20 p-4 space-y-6">
        {/* 用户等级卡片 */}
        {currentLevel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl p-5 ${
              isDark
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
            }`}
          >
            {/* 装饰背景 */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <Crown className="w-full h-full text-[#C02C38]" />
            </div>

            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                  isDark ? 'bg-[#C02C38]/20' : 'bg-[#C02C38]/10'
                }`}>
                  {currentLevel.icon}
                </div>
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    当前等级
                  </p>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {currentLevel.name}
                  </h3>
                </div>
              </div>

              {/* 等级进度 */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    升级进度
                  </span>
                  <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {userInfo?.levelProgress || 0}%
                  </span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${userInfo?.levelProgress || 0}%` }}
                    transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-[#C02C38] via-[#D04550] to-[#F59E0B]"
                  />
                </div>
                {nextLevel && (
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    距离 <span className="text-[#C02C38] font-medium">{nextLevel.name}</span> 还需 {userInfo?.pointsToNextLevel || 0} 积分
                  </p>
                )}
              </div>

              {/* 当前积分 */}
              <div className={`flex items-center justify-between p-3 rounded-xl ${
                isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
              }`}>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#F59E0B]" />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总积分</span>
                </div>
                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {userInfo?.currentPoints?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* 最近解锁 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              最近解锁
            </h3>
            <button className={`text-xs flex items-center gap-1 transition-colors ${
              isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}>
              查看全部
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {(recentUnlocks || []).length > 0 ? (
              (recentUnlocks || []).slice(0, 4).map((achievement, index) => {
                if (!achievement) return null;
                const rarity = rarityConfig[achievement.rarity] || rarityConfig.common;
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                      isDark
                        ? 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50'
                        : 'bg-white hover:bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isDark ? rarity.darkBgColor : rarity.bgColor
                    }`}>
                      <i className={`fas fa-${achievement.icon || 'star'} ${rarity.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {achievement.name || '未知成就'}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {achievement.unlockedAt || '-'}
                      </p>
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                      isDark ? 'bg-[#C02C38]/20 text-[#C02C38]' : 'bg-[#C02C38]/10 text-[#C02C38]'
                    }`}>
                      +{achievement.points || 0}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className={`text-center py-8 rounded-xl ${
                isDark ? 'bg-gray-800/30 border border-gray-700/50' : 'bg-gray-50 border border-gray-100'
              }`}>
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <Clock className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  暂无解锁记录
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  开始创作，解锁你的第一个成就！
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 排行榜 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              成就排行榜
            </h3>
            <button className={`text-xs flex items-center gap-1 transition-colors ${
              isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}>
              查看全部
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className={`rounded-xl overflow-hidden ${
            isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white border border-gray-100'
          }`}>
            {isLoading ? (
              <div className="px-4 py-8 text-center">
                <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>加载中...</div>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>暂无排行榜数据</div>
              </div>
            ) : (
              leaderboard.map((item, index) => (
                <motion.div
                  key={item.userId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    index !== leaderboard.length - 1
                      ? isDark ? 'border-b border-gray-700/50' : 'border-b border-gray-100'
                      : ''
                  } ${index < 3 ? (isDark ? 'bg-gradient-to-r from-[#C02C38]/5 to-transparent' : 'bg-gradient-to-r from-[#C02C38]/5 to-transparent') : ''}`}
                >
                  {/* 排名 */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-[#F59E0B] text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-[#8B5CF6] text-white' :
                    isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {item.rank}
                  </div>

                  {/* 头像 */}
                  {item.avatar ? (
                    <img src={item.avatar} alt={item.userName} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      {item.userName.charAt(0)}
                    </div>
                  )}

                  {/* 用户信息 */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                      {item.userName}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {item.achievementsCount} 个成就
                    </p>
                  </div>

                    {/* 积分 */}
                    <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.totalPoints.toLocaleString()}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

        {/* 推荐成就 */}
        <div>
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            即将解锁
          </h3>
          <div className={`p-4 rounded-xl ${
            isDark
              ? 'bg-gradient-to-br from-[#C02C38]/10 to-purple-900/10 border border-[#C02C38]/20'
              : 'bg-gradient-to-br from-[#C02C38]/5 to-purple-50 border border-[#C02C38]/10'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-[#C02C38]/20' : 'bg-[#C02C38]/10'
              }`}>
                <Target className="w-5 h-5 text-[#C02C38]" />
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  活跃创作者
                </h4>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  连续7天登录平台
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>进度</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>5/7</span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div className="h-full w-[71%] rounded-full bg-gradient-to-r from-[#C02C38] to-[#D04550]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 等级权益预览 */}
        {nextLevel && (
          <div>
            <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              下一等级权益
            </h3>
            <div className={`p-4 rounded-xl ${
              isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  {nextLevel.name}
                </span>
              </div>
              <ul className="space-y-2">
                {(nextLevel.benefits || []).slice(0, 3).map((benefit, idx) => (
                  <li key={idx} className={`flex items-center gap-2 text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-[#C02C38]`} />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
