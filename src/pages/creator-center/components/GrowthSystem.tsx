import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Zap, 
  Target,
  Crown,
  Medal,
  Gem,
  Flame,
  Lock,
  Check,
  Gift,
  Sparkles,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useCreatorCenter } from '@/hooks/useCreatorCenter';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import achievementService from '@/services/achievementService';

const levelIcons: Record<number, React.ElementType> = {
  1: Star,
  2: Zap,
  3: Target,
  4: Trophy,
  5: Crown,
  6: Medal,
  7: Gem,
};

const levelColors: Record<number, string> = {
  1: 'from-gray-400 to-gray-500',
  2: 'from-green-400 to-green-500',
  3: 'from-blue-400 to-blue-500',
  4: 'from-purple-400 to-purple-500',
  5: 'from-orange-400 to-orange-500',
  6: 'from-red-400 to-red-500',
  7: 'from-yellow-400 to-yellow-500',
};

const GrowthSystem: React.FC = () => {
  const { isDark } = useTheme();
  const { level, stats, works, loading } = useCreatorCenter();
  const [activeTab, setActiveTab] = useState<'levels' | 'achievements' | 'privileges'>('levels');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [creatorLevels, setCreatorLevels] = useState<any[]>([]);

  // 加载成就等级数据
  useEffect(() => {
    const levels = achievementService.getAllCreatorLevels();
    setCreatorLevels(levels);
  }, []);

  // 基于真实数据计算成就
  const achievements = React.useMemo(() => {
    const totalLikes = stats?.totalLikes || 0;
    const totalViews = stats?.totalViews || 0;
    const worksCount = works.length;

    return [
      {
        id: 1,
        title: '初次创作',
        desc: '发布第一个作品',
        icon: Sparkles,
        unlocked: worksCount >= 1,
        rarity: 'common',
        progress: Math.min(worksCount, 1),
        total: 1,
      },
      {
        id: 2,
        title: '小有名气',
        desc: '获得100个赞',
        icon: Star,
        unlocked: totalLikes >= 100,
        rarity: 'rare',
        progress: Math.min(totalLikes, 100),
        total: 100,
      },
      {
        id: 3,
        title: '热门作品',
        desc: '单作品浏览量破1000',
        icon: Flame,
        unlocked: works.some(w => w.views >= 1000),
        rarity: 'rare',
        progress: Math.min(Math.max(...works.map(w => w.views), 0), 1000),
        total: 1000,
      },
      {
        id: 4,
        title: '创作达人',
        desc: '发布10个作品',
        icon: Zap,
        unlocked: worksCount >= 10,
        rarity: 'rare',
        progress: Math.min(worksCount, 10),
        total: 10,
      },
      {
        id: 5,
        title: '社区之星',
        desc: '获得1000个赞',
        icon: Crown,
        unlocked: totalLikes >= 1000,
        rarity: 'epic',
        progress: Math.min(totalLikes, 1000),
        total: 1000,
      },
      {
        id: 6,
        title: '内容王者',
        desc: '发布50个作品',
        icon: Trophy,
        unlocked: worksCount >= 50,
        rarity: 'epic',
        progress: Math.min(worksCount, 50),
        total: 50,
      },
      {
        id: 7,
        title: '传奇创作者',
        desc: '总浏览量突破10万',
        icon: Gem,
        unlocked: totalViews >= 100000,
        rarity: 'legendary',
        progress: Math.min(totalViews, 100000),
        total: 100000,
      },
    ];
  }, [stats, works]);

  const currentLevel = level || { level: 1, name: '创作新手', currentXP: 0, nextLevelXP: 100, progress: 0 };
  const nextLevel = creatorLevels.find((l: any) => l.level === currentLevel.level + 1);
  const currentLevelData = creatorLevels.find((l: any) => l.level === currentLevel.level);

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700',
      rare: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      epic: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      legendary: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    };
    return colors[rarity] || colors.common;
  };

  const getRarityLabel = (rarity: string) => {
    const labels: Record<string, string> = {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说',
    };
    return labels[rarity] || rarity;
  };

  // 等待认证状态检查
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // 未登录状态显示提示
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className={`p-6 rounded-2xl text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-blue-500" />
          <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            创作者成长体系
          </h2>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            登录后即可查看你的等级和成长进度
          </p>
          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium"
            >
              立即登录
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            创作者成长体系
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            通过创作积累成长值，解锁更多权益
          </p>
        </div>
      </div>

      <div className={`p-8 rounded-3xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${
        isDark ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${levelColors[currentLevel.level] || levelColors[1]} flex items-center justify-center shadow-xl`}>
              {(() => {
                const IconComponent = levelIcons[currentLevel.level] || Star;
                return <IconComponent className="w-16 h-16 text-white" />;
              })()}
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold text-white">{currentLevel.level}</span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {currentLevel.name}
            </h2>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {nextLevel 
                ? `距离「${nextLevel.name}」还需 ${nextLevel.requiredPoints - currentLevel.currentXP} 积分`
                : '已达到最高等级！'
              }
            </p>
            <div className="mt-4">
              <div className={`h-4 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${currentLevel.progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full bg-gradient-to-r ${levelColors[currentLevel.level] || levelColors[1]}`}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  {currentLevel.currentXP} XP
                </span>
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  {currentLevel.nextLevelXP} XP
                </span>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} text-center`}>
            <Gift className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              当前权益
            </p>
            <p className="text-2xl font-bold text-purple-500">
              {currentLevelData?.benefits?.length || currentLevelData?.权益?.length || 0}
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              项特权
            </p>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${
        isDark ? 'border-gray-700' : 'border-gray-100'
      } overflow-hidden`}>
        <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          {[
            { id: 'levels', label: '等级体系', icon: Trophy },
            { id: 'achievements', label: '成就徽章', icon: Medal },
            { id: 'privileges', label: '等级权益', icon: Crown },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? isDark
                      ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5'
                      : 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : isDark
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'levels' && (
              <motion.div
                key="levels"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {creatorLevels.map((levelItem: any, index: number) => {
                  const isCurrent = levelItem.level === currentLevel.level;
                  const isUnlocked = currentLevel.currentXP >= levelItem.requiredPoints;
                  const LevelIcon = levelIcons[levelItem.level] || Star;
                  const nextLevelItem = creatorLevels[index + 1];

                  return (
                    <motion.div
                      key={levelItem.level}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-4 p-4 rounded-xl ${
                        isCurrent
                          ? isDark
                            ? 'bg-blue-600/10 border border-blue-500/30'
                            : 'bg-blue-50 border border-blue-200'
                          : isDark
                          ? 'bg-gray-700/30'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${levelColors[levelItem.level]} flex items-center justify-center ${
                        !isUnlocked && 'opacity-50 grayscale'
                      }`}>
                        <LevelIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {levelItem.icon} {levelItem.name}
                          </h3>
                          {isCurrent && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
                              当前
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {levelItem.requiredPoints} {nextLevelItem ? `- ${nextLevelItem.requiredPoints - 1}` : '+'} 积分
                        </p>
                      </div>
                      {isUnlocked ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-400" />
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === 'achievements' && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {achievements.map((achievement, index) => {
                  const Icon = achievement.icon;
                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-5 rounded-xl border ${
                        achievement.unlocked
                          ? isDark
                            ? 'bg-gray-700/50 border-gray-600'
                            : 'bg-white border-gray-200'
                          : isDark
                          ? 'bg-gray-800/50 border-gray-700 opacity-60'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          achievement.unlocked
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                            : isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          <Icon className={`w-6 h-6 ${achievement.unlocked ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {achievement.title}
                            </h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getRarityColor(achievement.rarity)}`}>
                              {getRarityLabel(achievement.rarity)}
                            </span>
                          </div>
                          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {achievement.desc}
                          </p>
                          {achievement.unlocked ? (
                            <p className="text-xs text-green-500 mt-2">
                              获得于 {achievement.date}
                            </p>
                          ) : (
                            <div className="mt-3">
                              <div className={`h-1.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                                  style={{ width: `${(achievement.progress! / achievement.total!) * 100}%` }}
                                />
                              </div>
                              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                进度: {achievement.progress}/{achievement.total}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === 'privileges' && (
              <motion.div
                key="privileges"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {creatorLevels.map((levelItem: any, index: number) => {
                  const isUnlocked = currentLevel.level >= levelItem.level;
                  const benefits = levelItem.benefits || levelItem.权益 || [];

                  return (
                    <motion.div
                      key={levelItem.level}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-5 rounded-xl ${
                        isUnlocked
                          ? isDark
                            ? 'bg-gray-700/50'
                            : 'bg-gray-50'
                          : isDark
                          ? 'bg-gray-800/30 opacity-50'
                          : 'bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${levelColors[levelItem.level]} flex items-center justify-center`}>
                          <span className="text-sm font-bold text-white">{levelItem.level}</span>
                        </div>
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {levelItem.icon} {levelItem.name}
                        </h3>
                        {isUnlocked && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded-full">
                            已解锁
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {benefits.map((item: string, i: number) => (
                          <div
                            key={i}
                            className={`flex items-center gap-2 p-3 rounded-lg ${
                              isUnlocked
                                ? isDark
                                  ? 'bg-gray-600/30'
                                  : 'bg-white'
                                : isDark
                                ? 'bg-gray-700/30'
                                : 'bg-gray-100'
                            }`}
                          >
                            <Check className={`w-4 h-4 ${isUnlocked ? 'text-green-500' : 'text-gray-400'}`} />
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default GrowthSystem;
