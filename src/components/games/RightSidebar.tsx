import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { 
  Medal, 
  Trophy, 
  Flame, 
  Clock, 
  Star,
  Crown,
  Award,
  TrendingUp,
  Gamepad2,
  ChevronRight
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  score: number;
  games: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  unlocked: boolean;
  progress: number;
  total: number;
}

interface RightSidebarProps {
  leaderboard: LeaderboardEntry[];
  achievements: Achievement[];
  recentGames: { id: string; name: string; playedAt: string; score: number }[];
}

export default function RightSidebar({ leaderboard, achievements, recentGames }: RightSidebarProps) {
  const { isDark } = useTheme();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-400">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border-yellow-400/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30';
      default:
        return isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 排行榜 */}
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            排行榜
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">本周</span>
        </div>
        
        <div className="space-y-3">
          {leaderboard.slice(0, 5).map((entry, index) => (
            <motion.div
              key={entry.rank}
              className={`flex items-center gap-3 p-3 rounded-xl border ${getRankStyle(entry.rank)} transition-all duration-300`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex-shrink-0">
                {getRankIcon(entry.rank)}
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{entry.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {entry.games} 场游戏
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-red-500">{entry.score}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">积分</div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.button
          className="w-full mt-4 flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
          whileHover={{ x: 4 }}
        >
          查看完整榜单
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* 我的成就 */}
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-500" />
            我的成就
          </h3>
          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            {achievements.filter(a => a.unlocked).length}/{achievements.length}
          </span>
        </div>

        <div className="space-y-3">
          {achievements.slice(0, 4).map((achievement, index) => {
            const Icon = achievement.icon;
            return (
              <motion.div
                key={achievement.id}
                className={`p-3 rounded-xl ${
                  achievement.unlocked 
                    ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20' 
                    : isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    achievement.unlocked 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${achievement.unlocked ? '' : 'text-gray-500'}`}>
                      {achievement.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                      {achievement.description}
                    </div>
                    {/* 进度条 */}
                    <div className="mt-2">
                      <div className={`h-1.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                        <motion.div 
                          className={`h-full rounded-full ${
                            achievement.unlocked 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                              : 'bg-gray-400'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                          transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{achievement.progress}/{achievement.total}</span>
                        <span>{achievement.unlocked ? '已解锁' : '进行中'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 最近游玩 */}
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            最近游玩
          </h3>
        </div>

        <div className="space-y-3">
          {recentGames.slice(0, 4).map((game, index) => (
            <motion.div
              key={game.id}
              className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors cursor-pointer`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: 4 }}
            >
              <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-blue-100'}`}>
                <Gamepad2 className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{game.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{game.playedAt}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-red-500">+{game.score}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 积分统计 */}
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-lg`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          积分统计
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gradient-to-br from-red-50 to-orange-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">总积分</span>
            </div>
            <div className="text-2xl font-bold text-red-500">2,580</div>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gradient-to-br from-orange-50 to-yellow-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">连续天数</span>
            </div>
            <div className="text-2xl font-bold text-orange-500">5</div>
          </div>
        </div>
      </div>
    </div>
  );
}
