import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { 
  Puzzle, 
  Brain, 
  Eye, 
  Shuffle, 
  SortAsc, 
  Lightbulb, 
  Link2, 
  History, 
  Layers,
  Target,
  BookOpen
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  count: number;
  color: string;
}

interface LeftSidebarProps {
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  activeDifficulty: string;
  onDifficultyChange: (difficulty: string) => void;
}

export default function LeftSidebar({ 
  activeCategory, 
  onCategoryChange,
  activeDifficulty,
  onDifficultyChange 
}: LeftSidebarProps) {
  const { isDark } = useTheme();

  const categories: Category[] = [
    { id: 'all', name: '全部游戏', icon: Layers, count: 10, color: 'from-gray-500 to-gray-600' },
    { id: 'quiz', name: '知识挑战', icon: Brain, count: 1, color: 'from-blue-500 to-blue-600' },
    { id: 'memory', name: '记忆游戏', icon: Puzzle, count: 2, color: 'from-purple-500 to-purple-600' },
    { id: 'matching', name: '连连看', icon: Link2, count: 2, color: 'from-cyan-500 to-cyan-600' },
    { id: 'puzzle', name: '拼图游戏', icon: Shuffle, count: 1, color: 'from-pink-500 to-pink-600' },
    { id: 'sorting', name: '排序游戏', icon: SortAsc, count: 1, color: 'from-green-500 to-green-600' },
    { id: 'riddle', name: '猜谜游戏', icon: Lightbulb, count: 1, color: 'from-orange-500 to-orange-600' },
    { id: 'timeline', name: '时间轴', icon: History, count: 1, color: 'from-amber-500 to-amber-600' },
    { id: 'spot', name: '找茬游戏', icon: Eye, count: 1, color: 'from-rose-500 to-rose-600' },
  ];

  const difficulties = [
    { id: 'all', name: '全部难度', color: 'bg-gray-100 text-gray-700' },
    { id: 'easy', name: '简单', color: 'bg-green-100 text-green-700' },
    { id: 'medium', name: '中等', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'hard', name: '困难', color: 'bg-red-100 text-red-700' },
  ];

  return (
    <div className="space-y-6">
      {/* 游戏分类 */}
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-lg`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-red-500" />
          游戏分类
        </h3>
        <div className="space-y-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <motion.button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg` 
                    : `${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} text-gray-700 dark:text-gray-300`
                }`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">{category.name}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  {category.count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 难度筛选 */}
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-lg`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-500" />
          难度筛选
        </h3>
        <div className="flex flex-wrap gap-2">
          {difficulties.map((difficulty) => (
            <motion.button
              key={difficulty.id}
              onClick={() => onDifficultyChange(difficulty.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeDifficulty === difficulty.id
                  ? difficulty.color + ' ring-2 ring-offset-2 ring-gray-300 dark:ring-gray-600'
                  : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {difficulty.name}
            </motion.button>
          ))}
        </div>
      </div>

    </div>
  );
}
