import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import {
  Star,
  Trophy,
  Target,
  Zap
} from 'lucide-react';
import GameLayout from '@/components/games/GameLayout';
import GameHero from '@/components/games/GameHero';
import LeftSidebar from '@/components/games/LeftSidebar';
import MainContent from '@/components/games/MainContent';
import RightSidebar from '@/components/games/RightSidebar';
import { LeaderboardEntry, Achievement, RecentGame } from '@/services/gameService';
import { gameScoringService, GameType } from '@/services/gameScoringService';
import { supabase } from '@/lib/supabaseClient';

// 懒加载游戏组件
import CulturalMemoryGame from '@/components/CulturalMemoryGame';
import CulturalMatchingGame from '@/components/CulturalMatchingGame';
import CulturalPuzzleGame from '@/components/CulturalPuzzleGame';
import CulturalSortingGame from '@/components/CulturalSortingGame';
import CulturalRiddleGame from '@/components/CulturalRiddleGame';
import CulturalTimelineGame from '@/components/CulturalTimelineGame';
import CulturalWordChainGame from '@/components/CulturalWordChainGame';
import CulturalSpotTheDifferenceGame from '@/components/CulturalSpotTheDifferenceGame';
import CulturalPairMatchingGame from '@/components/CulturalPairMatchingGame';
import CulturalQuizGame from '@/components/CulturalQuizGame';

// 游戏封面图片 - 使用渐变色占位图
const getGameCover = (seed: string, color1: string, color2: string) => 
  `https://picsum.photos/seed/${seed}/800/400`;

// 游戏数据映射
const gamesList = [
  {
    id: 'cultural-knowledge',
    title: '文化知识挑战',
    description: '测试你对天津地方文化和中国传统文化的了解。包含多种题型和难度级别，从简单到困难，逐步提升你的文化知识水平。',
    category: 'quiz',
    difficulty: 'medium' as const,
    image: getGameCover('cultural-quiz', '3b82f6', '1d4ed8'),
    players: 12580,
    rating: 4.8,
    duration: '10-15分钟',
    features: ['多种题型', '难度分级', '实时反馈', '积分系统'],
    color: 'from-blue-500 to-blue-600',
    component: 'quiz'
  },
  {
    id: 'cultural-memory',
    title: '文化记忆游戏',
    description: '翻牌匹配相同的文化元素，挑战你的记忆力和文化知识。包含多种难度级别。',
    category: 'memory',
    difficulty: 'easy' as const,
    image: getGameCover('memory-game', '8b5cf6', '6d28d9'),
    players: 8920,
    rating: 4.6,
    duration: '5-10分钟',
    features: ['记忆训练', '文化元素', '计时挑战', '连击奖励'],
    color: 'from-purple-500 to-purple-600',
    component: 'memory'
  },
  {
    id: 'matching-game',
    title: '文化连连看',
    description: '连接相同的文化图案，在限定时间内完成所有配对。',
    category: 'matching',
    difficulty: 'easy' as const,
    image: getGameCover('matching-game', '06b6d4', '0891b2'),
    players: 7560,
    rating: 4.5,
    duration: '5-8分钟',
    features: ['图案匹配', '限时挑战', '道具系统', '排行榜'],
    color: 'from-cyan-500 to-cyan-600',
    component: 'matching'
  },
  {
    id: 'puzzle-game',
    title: '文化拼图',
    description: '将打乱的天津文化图片拼回原样，锻炼你的观察力和耐心。',
    category: 'puzzle',
    difficulty: 'medium' as const,
    image: getGameCover('puzzle-game', 'ec4899', 'be185d'),
    players: 6230,
    rating: 4.7,
    duration: '10-20分钟',
    features: ['多难度级别', '精美图片', '计时模式', '收藏系统'],
    color: 'from-pink-500 to-pink-600',
    component: 'puzzle'
  },
  {
    id: 'sorting-game',
    title: '文化排序',
    description: '按照时间顺序或重要性排序文化事件和人物。',
    category: 'sorting',
    difficulty: 'hard' as const,
    image: getGameCover('sorting-game', '22c55e', '15803d'),
    players: 4890,
    rating: 4.4,
    duration: '8-12分钟',
    features: ['历史知识', '逻辑排序', '时间线', '挑战模式'],
    color: 'from-green-500 to-green-600',
    component: 'sorting'
  },
  {
    id: 'riddle-game',
    title: '文化猜谜',
    description: '根据提示猜出天津文化相关的谜语，考验你的文化积累。',
    category: 'riddle',
    difficulty: 'medium' as const,
    image: getGameCover('riddle-game', 'f97316', 'c2410c'),
    players: 5670,
    rating: 4.3,
    duration: '5-10分钟',
    features: ['趣味谜语', '提示系统', '积分奖励', '分享功能'],
    color: 'from-orange-500 to-orange-600',
    component: 'riddle'
  },
  {
    id: 'timeline-game',
    title: '文化时间轴',
    description: '将历史事件按照正确的时间顺序排列，了解天津文化的发展历程。',
    category: 'timeline',
    difficulty: 'hard' as const,
    image: getGameCover('timeline-game', 'f59e0b', 'b45309'),
    players: 3450,
    rating: 4.5,
    duration: '15-20分钟',
    features: ['历史知识', '时间排序', '详细解析', '学习模式'],
    color: 'from-amber-500 to-amber-600',
    component: 'timeline'
  },
  {
    id: 'spot-difference',
    title: '文化找茬',
    description: '找出两幅天津文化图片中的不同之处，锻炼你的观察力。',
    category: 'spot',
    difficulty: 'easy' as const,
    image: getGameCover('spot-game', 'f43f5e', 'be123c'),
    players: 9120,
    rating: 4.6,
    duration: '3-8分钟',
    features: ['观察训练', '精美图片', '提示功能', '关卡模式'],
    color: 'from-rose-500 to-rose-600',
    component: 'spot'
  },
  {
    id: 'pair-matching',
    title: '文化配对',
    description: '将相关的文化元素进行配对，考验你的文化知识关联能力。',
    category: 'pair',
    difficulty: 'easy' as const,
    image: getGameCover('pair-game', '14b8a6', '0f766e'),
    players: 7650,
    rating: 4.5,
    duration: '5-10分钟',
    features: ['知识关联', '配对挑战', '提示系统', '积分奖励'],
    color: 'from-teal-500 to-teal-600',
    component: 'pair'
  },
  {
    id: 'wordchain-game',
    title: '成语接龙',
    description: '经典成语接龙游戏，考验你的成语积累和反应速度。',
    category: 'wordchain',
    difficulty: 'medium' as const,
    image: getGameCover('wordchain-game', '6366f1', '4338ca'),
    players: 6780,
    rating: 4.7,
    duration: '5-15分钟',
    features: ['成语知识', '接龙挑战', '提示系统', '积分排行'],
    color: 'from-indigo-500 to-indigo-600',
    component: 'wordchain'
  }
];

// 转换成就数据格式以适应 RightSidebar
const convertAchievements = (achievements: Achievement[]) => {
  return achievements.map(a => ({
    ...a,
    icon: a.icon === 'Star' ? Star : 
          a.icon === 'Trophy' ? Trophy : 
          a.icon === 'Zap' ? Zap : 
          a.icon === 'Target' ? Target : Star
  }));
};

export default function Games() {
  // 强制刷新标记: 2026-02-10-v3
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDifficulty, setActiveDifficulty] = useState('all');
  
  // 游戏弹窗状态
  const [openGame, setOpenGame] = useState<string | null>(null);
  
  // 真实数据状态
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [achievementsData, setAchievementsData] = useState<Achievement[]>([]);
  const [recentGamesData, setRecentGamesData] = useState<RecentGame[]>([]);
  const [userStats, setUserStats] = useState<{ totalScore: number; streakDays: number; totalGames: number } | null>(null);
  const [gamesStats, setGamesStats] = useState<Record<string, { players: number; rating: number; hasData: boolean }>>({});
  const [isLoading, setIsLoading] = useState(true);

  // 加载游戏数据
  const loadGameData = async () => {
    setIsLoading(true);
    try {
      // 并行加载所有数据
      const [leaderboard, gameStats] = await Promise.all([
        gameScoringService.getGameLeaderboard(),
        gameScoringService.getGamesStats()
      ]);
      
      console.log('[Games] Leaderboard loaded:', JSON.stringify(leaderboard, null, 2));
      console.log('[Games] Games stats loaded:', JSON.stringify(gameStats, null, 2));
      
      // 转换格式以兼容现有组件
      const formattedLeaderboard: LeaderboardEntry[] = leaderboard.map(entry => ({
        rank: entry.rank,
        name: entry.name,
        avatar: entry.avatar,
        score: entry.score,
        games: entry.games
      }));
      
      setLeaderboardData(formattedLeaderboard);
      
      // 转换游戏统计数据
      const formattedGameStats: Record<string, { players: number; rating: number; hasData: boolean }> = {};
      for (const [gameType, stats] of Object.entries(gameStats)) {
        formattedGameStats[gameType] = {
          players: stats.players,
          rating: stats.rating,
          hasData: stats.hasData
        };
      }
      setGamesStats(formattedGameStats);
      
      // 加载成就数据和用户统计
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [achievements, stats] = await Promise.all([
          gameScoringService.getUserAchievements(user.id),
          gameScoringService.getUserGameStats(user.id)
        ]);
        
        const formattedAchievements: Achievement[] = achievements.map(a => ({
          id: a.id,
          name: a.name,
          description: a.description,
          icon: a.icon,
          unlocked: a.unlocked,
          progress: a.unlocked ? a.condition.target : 0,
          total: a.condition.target
        }));
        setAchievementsData(formattedAchievements);
        
        // 设置用户统计数据
        setUserStats({
          totalScore: stats.totalScore,
          streakDays: stats.streakDays,
          totalGames: stats.totalGames
        });
      } else {
        // 未登录时显示默认成就列表（全部未解锁）
        const defaultAchievements = gameScoringService.ACHIEVEMENTS.map(a => ({
          id: a.id,
          name: a.name,
          description: a.description,
          icon: a.icon,
          unlocked: false,
          progress: 0,
          total: a.condition.target
        }));
        setAchievementsData(defaultAchievements);
        setUserStats(null);
      }
    } catch (error) {
      console.error('[Games] Failed to load game data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    console.log('[Games] Loading real game data...');
    loadGameData();
  }, []);
  
  // 刷新数据（游戏关闭后调用）
  const handleRefreshData = useCallback(() => {
    console.log('[Games] Refreshing game data...');
    loadGameData();
  }, []);

  // 游戏ID到GameType的映射
  const gameIdToType: Record<string, GameType> = {
    'cultural-knowledge': 'cultural-quiz',
    'cultural-memory': 'cultural-memory',
    'matching-game': 'matching-game',
    'puzzle-game': 'puzzle-game',
    'sorting-game': 'sorting-game',
    'riddle-game': 'riddle-game',
    'timeline-game': 'timeline-game',
    'spot-difference': 'spot-difference'
  };

  // 过滤游戏并应用动态统计数据
  const filteredGames = useMemo(() => {
    return gamesList.filter(game => {
      const categoryMatch = activeCategory === 'all' || game.category === activeCategory;
      const difficultyMatch = activeDifficulty === 'all' || game.difficulty === activeDifficulty;
      return categoryMatch && difficultyMatch;
    }).map(game => {
      const gameType = gameIdToType[game.id];
      const stats = gameType && gamesStats[gameType];
      
      if (stats && stats.hasData) {
        // 有真实数据时显示真实统计
        return {
          ...game,
          players: stats.players,
          rating: stats.rating
        };
      }
      // 没有数据时显示"新游戏"标识
      return {
        ...game,
        players: 0,
        rating: 0
      };
    });
  }, [activeCategory, activeDifficulty, gamesStats]);

  // 精选游戏（第一个游戏）
  const featuredGame = filteredGames.length > 0 ? filteredGames[0] : null;
  
  // 其他游戏
  const otherGames = filteredGames.slice(1);

  const handlePlayGame = (gameId: string) => {
    const game = gamesList.find(g => g.id === gameId);
    if (game) {
      if (game.id === 'cultural-knowledge') {
        // 知识挑战跳转到知识库页面
        navigate('/cultural-knowledge');
      } else if (game.component) {
        // 打开游戏弹窗
        setOpenGame(gameId);
      } else {
        // 其他游戏提示开发中
        alert('该游戏正在开发中，敬请期待！');
      }
    }
  };

  const handleCloseGame = () => {
    setOpenGame(null);
    // 游戏关闭后刷新数据
    handleRefreshData();
  };

  // 获取当前打开的游戏组件
  const getGameComponent = () => {
    const game = gamesList.find(g => g.id === openGame);
    if (!game) return null;

    switch (game.component) {
      case 'quiz':
        return (
          <CulturalQuizGame 
            isOpen={true} 
            onClose={handleCloseGame} 
          />
        );
      case 'memory':
        return (
          <CulturalMemoryGame 
            isOpen={true} 
            onClose={handleCloseGame} 
          />
        );
      case 'matching':
        return (
          <CulturalMatchingGame 
            isOpen={true} 
            onClose={handleCloseGame} 
          />
        );
      case 'puzzle':
        return (
          <CulturalPuzzleGame 
            isOpen={true} 
            onClose={handleCloseGame} 
          />
        );
      case 'sorting':
        return (
          <CulturalSortingGame 
            isOpen={true} 
            onClose={handleCloseGame} 
          />
        );
      case 'riddle':
        return (
          <CulturalRiddleGame 
            isOpen={true} 
            onClose={handleCloseGame} 
          />
        );
      case 'timeline':
        return (
          <CulturalTimelineGame 
            isOpen={true} 
            onClose={handleCloseGame} 
          />
        );
      case 'wordchain':
        return (
          <CulturalWordChainGame 
            isOpen={true} 
            onClose={handleCloseGame} 
          />
        );
      case 'spot':
        return (
          <CulturalSpotTheDifferenceGame 
            isOpen={true} 
            onClose={handleCloseGame} 
          />
        );
      case 'pair':
        return (
          <CulturalPairMatchingGame 
            isOpen={true} 
            onClose={handleCloseGame} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <GameLayout
        hero={<GameHero />}
        leftSidebar={
          <LeftSidebar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            activeDifficulty={activeDifficulty}
            onDifficultyChange={setActiveDifficulty}
          />
        }
        mainContent={
          <MainContent
            games={otherGames}
            featuredGame={featuredGame}
            onPlayGame={handlePlayGame}
          />
        }
        rightSidebar={
          <RightSidebar
            leaderboard={leaderboardData}
            achievements={convertAchievements(achievementsData)}
            recentGames={recentGamesData}
            userStats={userStats}
            isLoading={isLoading}
          />
        }
      />
      
      {/* 游戏弹窗 */}
      {openGame && getGameComponent()}
    </>
  );
}
