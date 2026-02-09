import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { 
  Brain, 
  Puzzle, 
  Link2, 
  Shuffle, 
  SortAsc, 
  Lightbulb, 
  History, 
  Eye,
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

// 懒加载游戏组件
import CulturalMemoryGame from '@/components/CulturalMemoryGame';
import CulturalMatchingGame from '@/components/CulturalMatchingGame';
import CulturalPuzzleGame from '@/components/CulturalPuzzleGame';

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
    component: null // 跳转到知识库页面
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
    component: null // 待实现
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
    component: null // 待实现
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
    component: null // 待实现
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
    component: null // 待实现
  }
];

// 排行榜数据
const leaderboardData = [
  { rank: 1, name: '文化达人', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', score: 15800, games: 45 },
  { rank: 2, name: '津门学子', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', score: 14200, games: 38 },
  { rank: 3, name: '历史爱好者', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', score: 12800, games: 42 },
  { rank: 4, name: '文化传承者', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4', score: 11500, games: 35 },
  { rank: 5, name: '知识探索者', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5', score: 10200, games: 28 },
];

// 成就数据
const achievementsData = [
  { id: '1', name: '初出茅庐', description: '完成第一个游戏', icon: Star, unlocked: true, progress: 1, total: 1 },
  { id: '2', name: '文化新星', description: '累计获得1000积分', icon: Trophy, unlocked: true, progress: 2580, total: 1000 },
  { id: '3', name: '坚持不懈', description: '连续登录7天', icon: Zap, unlocked: false, progress: 5, total: 7 },
  { id: '4', name: '知识达人', description: '完成所有游戏', icon: Target, unlocked: false, progress: 3, total: 10 },
];

// 最近游玩数据
const recentGamesData = [
  { id: '1', name: '文化知识挑战', playedAt: '2小时前', score: 850 },
  { id: '2', name: '文化记忆游戏', playedAt: '昨天', score: 620 },
  { id: '3', name: '文化连连看', playedAt: '3天前', score: 480 },
  { id: '4', name: '文化找茬', playedAt: '5天前', score: 630 },
];

export default function Games() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDifficulty, setActiveDifficulty] = useState('all');
  
  // 游戏弹窗状态
  const [openGame, setOpenGame] = useState<string | null>(null);

  // 过滤游戏
  const filteredGames = useMemo(() => {
    return gamesList.filter(game => {
      const categoryMatch = activeCategory === 'all' || game.category === activeCategory;
      const difficultyMatch = activeDifficulty === 'all' || game.difficulty === activeDifficulty;
      return categoryMatch && difficultyMatch;
    });
  }, [activeCategory, activeDifficulty]);

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
  };

  // 获取当前打开的游戏组件
  const getGameComponent = () => {
    const game = gamesList.find(g => g.id === openGame);
    if (!game) return null;

    switch (game.component) {
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
            achievements={achievementsData}
            recentGames={recentGamesData}
          />
        }
      />
      
      {/* 游戏弹窗 */}
      {openGame && getGameComponent()}
    </>
  );
}
