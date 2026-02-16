import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  Award,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  Target,
  BarChart3,
  Users,
  ChevronRight,
  User,
} from 'lucide-react';
import { WorkScoringData } from '@/services/workScoringService';
import { useState, useMemo } from 'react';

// 排名作品数据接口
export interface RankedWork extends WorkScoringData {
  rank: number;
  rankChange: number; // 排名变化，正数表示上升，负数表示下降，0表示不变
  totalScore: number; // 总分
  judgeCount: number; // 评委数量
  avgScore: number; // 平均分
}

// 排名统计接口
export interface RankingStats {
  totalWorks: number;
  scoredWorks: number;
  unscoredWorks: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
  topScoreGap: number; // 第一名与第二名分数差距
  scoreDistribution: {
    excellent: number; // 9-10分
    good: number; // 7-8分
    average: number; // 5-6分
    poor: number; // <5分
  };
}

interface ScoreRankingPanelProps {
  works: WorkScoringData[];
  isDark: boolean;
  onWorkClick?: (workId: string) => void;
  topN?: number; // 显示前几名，默认10
}

export function ScoreRankingPanel({
  works,
  isDark,
  onWorkClick,
  topN = 10,
}: ScoreRankingPanelProps) {
  const [activeTab, setActiveTab] = useState<'ranking' | 'stats'>('ranking');

  // 计算排名数据
  const { rankedWorks, stats } = useMemo(() => {
    // 过滤出有评分的作品
    const scoredWorks = works.filter(
      (w) => w.avgScore !== undefined && w.avgScore > 0 && w.scoreCount > 0
    );

    // 按平均分降序排序
    const sortedWorks = [...scoredWorks].sort((a, b) => {
      const scoreA = a.avgScore || 0;
      const scoreB = b.avgScore || 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      // 分数相同时，按评分次数降序
      return (b.scoreCount || 0) - (a.scoreCount || 0);
    });

    // 生成排名数据
    const ranked: RankedWork[] = sortedWorks.map((work, index) => ({
      ...work,
      rank: index + 1,
      rankChange: 0, // 实际应用中可以从历史数据计算
      totalScore: (work.avgScore || 0) * (work.scoreCount || 0),
      judgeCount: work.judgeCount || 0,
      avgScore: work.avgScore || 0,
    }));

    // 计算统计数据
    const allScores = sortedWorks.map((w) => w.avgScore || 0);
    const stats: RankingStats = {
      totalWorks: works.length,
      scoredWorks: scoredWorks.length,
      unscoredWorks: works.length - scoredWorks.length,
      avgScore:
        allScores.length > 0
          ? allScores.reduce((a, b) => a + b, 0) / allScores.length
          : 0,
      maxScore: allScores.length > 0 ? Math.max(...allScores) : 0,
      minScore: allScores.length > 0 ? Math.min(...allScores) : 0,
      topScoreGap:
        allScores.length >= 2 ? allScores[0] - allScores[1] : 0,
      scoreDistribution: {
        excellent: allScores.filter((s) => s >= 9).length,
        good: allScores.filter((s) => s >= 7 && s < 9).length,
        average: allScores.filter((s) => s >= 5 && s < 7).length,
        poor: allScores.filter((s) => s > 0 && s < 5).length,
      },
    };

    return { rankedWorks: ranked.slice(0, topN), stats };
  }, [works, topN]);

  // 获取排名图标
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  // 获取排名样式
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white';
      default:
        return isDark
          ? 'bg-gray-700 text-gray-300'
          : 'bg-gray-100 text-gray-600';
    }
  };

  // 获取排名变化图标
  const getRankChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="w-3 h-3 text-emerald-500" />;
    } else if (change < 0) {
      return <TrendingDown className="w-3 h-3 text-red-500" />;
    }
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  // 格式化分数
  const formatScore = (score: number) => {
    return score.toFixed(1);
  };

  // 如果没有评分数据
  if (rankedWorks.length === 0) {
    return (
      <div
        className={`w-80 flex-shrink-0 border-l ${
          isDark
            ? 'bg-gray-800/50 border-gray-700'
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3
              className={`font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              成绩排名
            </h3>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
          <Trophy
            className={`w-16 h-16 mb-4 ${
              isDark ? 'text-gray-600' : 'text-gray-300'
            }`}
          />
          <p
            className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            暂无评分数据
          </p>
          <p
            className={`text-xs mt-2 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            作品评分后将自动显示排名
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-80 flex-shrink-0 border-l flex flex-col ${
        isDark
          ? 'bg-gray-800/50 border-gray-700'
          : 'bg-white border-gray-200'
      }`}
    >
      {/* 标题栏 */}
      <div
        className={`p-4 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3
              className={`font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              成绩排名
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                isDark
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              TOP{Math.min(topN, rankedWorks.length)}
            </span>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="flex mt-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'ranking'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            排行榜
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'stats'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            统计分析
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'ranking' ? (
          <div className="p-3 space-y-2">
            {rankedWorks.map((work, index) => (
              <motion.div
                key={work.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onWorkClick?.(work.id)}
                className={`
                  flex items-center gap-3 p-3 rounded-xl cursor-pointer
                  transition-all group
                  ${
                    isDark
                      ? 'hover:bg-gray-700/50'
                      : 'hover:bg-gray-50'
                  }
                `}
              >
                {/* 排名 */}
                <div
                  className={`
                    w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                    ${getRankStyle(work.rank)}
                  `}
                >
                  {getRankIcon(work.rank) || work.rank}
                </div>

                {/* 作品信息 */}
                <div className="flex-1 min-w-0">
                  <h4
                    className={`font-medium text-sm truncate group-hover:text-red-500 transition-colors ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {work.title || '未命名作品'}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* 创作者头像 */}
                    {work.creatorAvatar ? (
                      <img
                        src={work.creatorAvatar}
                        alt={work.creatorName}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        <User className="w-2.5 h-2.5 text-gray-400" />
                      </div>
                    )}
                    <span
                      className={`text-xs ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      {work.creatorName}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        isDark
                          ? 'bg-gray-700 text-gray-400'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {work.judgeCount}人评分
                    </span>
                  </div>
                </div>

                {/* 分数 */}
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span
                      className={`font-bold text-lg ${
                        work.rank <= 3
                          ? 'text-yellow-500'
                          : isDark
                          ? 'text-white'
                          : 'text-gray-900'
                      }`}
                    >
                      {formatScore(work.avgScore)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    {getRankChangeIcon(work.rankChange)}
                    <span
                      className={`text-xs ${
                        work.rankChange > 0
                          ? 'text-emerald-500'
                          : work.rankChange < 0
                          ? 'text-red-500'
                          : 'text-gray-400'
                      }`}
                    >
                      {work.rankChange !== 0
                        ? Math.abs(work.rankChange)
                        : '-'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* 查看更多 */}
            {stats.scoredWorks > topN && (
              <button
                className={`
                  w-full py-2 text-xs font-medium rounded-lg
                  flex items-center justify-center gap-1
                  transition-colors
                  ${
                    isDark
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <span>查看全部 {stats.scoredWorks} 个已评分作品</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          /* 统计分析 */
          <div className="p-4 space-y-4">
            {/* 概览卡片 */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`p-3 rounded-xl ${
                  isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span
                    className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    平均分
                  </span>
                </div>
                <div
                  className={`text-xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {formatScore(stats.avgScore)}
                </div>
              </div>

              <div
                className={`p-3 rounded-xl ${
                  isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span
                    className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    最高分
                  </span>
                </div>
                <div
                  className={`text-xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {formatScore(stats.maxScore)}
                </div>
              </div>
            </div>

            {/* 评分分布 */}
            <div
              className={`p-4 rounded-xl ${
                isDark ? 'bg-gray-700/30' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <span
                  className={`text-sm font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  评分分布
                </span>
              </div>

              <div className="space-y-2">
                {/* 优秀 */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs w-12 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    优秀 9-10
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                      style={{
                        width: `${
                          stats.scoredWorks > 0
                            ? (stats.scoreDistribution.excellent /
                                stats.scoredWorks) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs w-6 text-right ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {stats.scoreDistribution.excellent}
                  </span>
                </div>

                {/* 良好 */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs w-12 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    良好 7-8
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                      style={{
                        width: `${
                          stats.scoredWorks > 0
                            ? (stats.scoreDistribution.good /
                                stats.scoredWorks) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs w-6 text-right ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {stats.scoreDistribution.good}
                  </span>
                </div>

                {/* 一般 */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs w-12 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    一般 5-6
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                      style={{
                        width: `${
                          stats.scoredWorks > 0
                            ? (stats.scoreDistribution.average /
                                stats.scoredWorks) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs w-6 text-right ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {stats.scoreDistribution.average}
                  </span>
                </div>

                {/* 较差 */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs w-12 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    较差 &lt;5
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full"
                      style={{
                        width: `${
                          stats.scoredWorks > 0
                            ? (stats.scoreDistribution.poor /
                                stats.scoredWorks) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs w-6 text-right ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {stats.scoreDistribution.poor}
                  </span>
                </div>
              </div>
            </div>

            {/* 统计摘要 */}
            <div
              className={`p-4 rounded-xl ${
                isDark ? 'bg-gray-700/30' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-blue-500" />
                <span
                  className={`text-sm font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  评分概况
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span
                    className={
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }
                  >
                    作品总数
                  </span>
                  <span
                    className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {stats.totalWorks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                    className={
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }
                  >
                    已评分
                  </span>
                  <span
                    className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {stats.scoredWorks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                    className={
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }
                  >
                    未评分
                  </span>
                  <span
                    className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {stats.unscoredWorks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                    className={
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }
                  >
                    最低分
                  </span>
                  <span
                    className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {formatScore(stats.minScore)}
                  </span>
                </div>
                {stats.topScoreGap > 0 && (
                  <div className="flex justify-between">
                    <span
                      className={
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }
                    >
                      冠亚军差距
                    </span>
                    <span
                      className={`font-medium text-yellow-500`}
                    >
                      {formatScore(stats.topScoreGap)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScoreRankingPanel;
