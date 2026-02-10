import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { 
  Play, 
  Clock, 
  Star, 
  Users, 
  Trophy,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface Game {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  image: string;
  players: number;
  rating: number;
  duration: string;
  features: string[];
  color: string;
  onPlay: () => void;
}

interface MainContentProps {
  games: Game[];
  featuredGame: Game | null;
  onPlayGame: (gameId: string) => void;
}

const difficultyLabels = {
  easy: { text: '简单', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  medium: { text: '中等', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  hard: { text: '困难', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
};

export default function MainContent({ games, featuredGame, onPlayGame }: MainContentProps) {
  const { isDark } = useTheme();

  return (
    <div className="space-y-6">
      {/* 精选游戏展示 */}
      {featuredGame && (
        <motion.div
          className={`rounded-3xl overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-2xl`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 精选标签 */}
          <div className="relative">
            <div className="absolute top-4 left-4 z-10">
              <span className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                <Sparkles className="w-3 h-3" />
                精选推荐
              </span>
            </div>
            
            {/* 游戏图片 */}
            <div className="relative h-64 overflow-hidden">
              <img
                src={featuredGame.image}
                alt={featuredGame.title}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* 游戏信息叠加 */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyLabels[featuredGame.difficulty].color}`}>
                    {difficultyLabels[featuredGame.difficulty].text}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-white/80">
                    <Clock className="w-3 h-3" />
                    {featuredGame.duration}
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-2">{featuredGame.title}</h2>
                <p className="text-white/80 text-sm line-clamp-2">{featuredGame.description}</p>
              </div>
            </div>
          </div>

          {/* 游戏详情 */}
          <div className="p-6">
            {/* 特色功能 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {featuredGame.features.map((feature, idx) => (
                <span 
                  key={idx}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs ${
                    isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  {feature}
                </span>
              ))}
            </div>

            {/* 统计信息 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {featuredGame.players > 0 ? (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{featuredGame.players.toLocaleString()} 人在玩</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-green-500">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">新游戏</span>
                  </div>
                )}
                {featuredGame.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{featuredGame.rating}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 开始游戏按钮 */}
            <motion.button
              onClick={() => onPlayGame(featuredGame.id)}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="w-5 h-5" />
              开始游戏
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* 游戏列表 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            全部游戏
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            共 {games.length} 个游戏
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {games.map((game, index) => (
              <motion.div
                key={game.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`group rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-lg hover:shadow-xl transition-all duration-300`}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* 游戏图片 */}
                  <div className="relative sm:w-48 h-40 sm:h-auto overflow-hidden flex-shrink-0">
                    <img
                      src={game.image}
                      alt={game.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyLabels[game.difficulty].color}`}>
                        {difficultyLabels[game.difficulty].text}
                      </span>
                    </div>
                  </div>

                  {/* 游戏信息 */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-lg font-bold mb-1 group-hover:text-red-500 transition-colors">
                        {game.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                        {game.description}
                      </p>
                      
                      {/* 特色标签 */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {game.features.slice(0, 2).map((feature, idx) => (
                          <span 
                            key={idx}
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        {game.players > 0 ? (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {game.players.toLocaleString()} 人在玩
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-500">
                            <Sparkles className="w-3.5 h-3.5" />
                            新游戏
                          </span>
                        )}
                        {game.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            {game.rating}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {game.duration}
                        </span>
                      </div>
                      
                      <motion.button
                        onClick={() => onPlayGame(game.id)}
                        className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="w-3.5 h-3.5" />
                        开始
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
