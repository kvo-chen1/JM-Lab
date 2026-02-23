import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  TrendingUp, 
  Flame, 
  Sparkles,
  ArrowRight,
  Heart,
  Eye,
  Bookmark,
  RefreshCw,
  Zap,
  Trophy,
  Music,
  Video,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  ChevronRight,
  Star,
  Target,
  Clock,
  Users,
  Award,
  TrendingUp as TrendIcon,
  Palette,
  Wand2,
  Layers
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const hotTopics = [
  { id: 1, title: '#津门文化', views: '128.5万', trend: 'up', category: '文化', hot: true },
  { id: 2, title: '#天津美食', views: '98.2万', trend: 'up', category: '美食', hot: true },
  { id: 3, title: '#海河夜景', views: '76.8万', trend: 'stable', category: '旅游', hot: false },
  { id: 4, title: '#传统手艺', views: '65.3万', trend: 'up', category: '手工', hot: false },
  { id: 5, title: '#方言故事', views: '54.1万', trend: 'down', category: '故事', hot: false },
  { id: 6, title: '#老字号', views: '45.6万', trend: 'up', category: '商业', hot: false },
];

const trendingTemplates = [
  {
    id: 1,
    title: '津门印象海报模板',
    type: 'image',
    usage: '2.3万',
    likes: '4.5K',
    image: '/template-1.jpg',
    tags: ['海报', '文化', '传统'],
    color: 'from-rose-400 to-orange-400'
  },
  {
    id: 2,
    title: '天津话搞笑配音',
    type: 'video',
    usage: '1.8万',
    likes: '3.2K',
    image: '/template-2.jpg',
    tags: ['视频', '方言', '搞笑'],
    color: 'from-violet-400 to-purple-400'
  },
  {
    id: 3,
    title: '美食探店Vlog模板',
    type: 'video',
    usage: '1.5万',
    likes: '2.8K',
    image: '/template-3.jpg',
    tags: ['Vlog', '美食', '探店'],
    color: 'from-emerald-400 to-teal-400'
  },
  {
    id: 4,
    title: '传统纹样设计素材',
    type: 'image',
    usage: '9.8K',
    likes: '1.9K',
    image: '/template-4.jpg',
    tags: ['设计', '纹样', '素材'],
    color: 'from-blue-400 to-cyan-400'
  },
];

const aiSuggestions = [
  {
    id: 1,
    title: '创作一个关于天津狗不理包子的趣味短视频',
    desc: '结合历史故事和现代元素，展现传统美食的魅力',
    difficulty: '简单',
    estimatedViews: '5-10万',
    tags: ['美食', '历史', '趣味'],
    icon: Video,
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 2,
    title: '设计一套津门文化主题的海报系列',
    desc: '融合传统建筑、民俗元素，展现天津独特魅力',
    difficulty: '中等',
    estimatedViews: '3-8万',
    tags: ['设计', '文化', '系列'],
    icon: Palette,
    color: 'from-blue-500 to-indigo-500'
  },
  {
    id: 3,
    title: '制作天津方言教学短视频',
    desc: '用轻松幽默的方式教外地朋友天津话',
    difficulty: '简单',
    estimatedViews: '10-20万',
    tags: ['方言', '教学', '搞笑'],
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500'
  },
];

const creativeChallenges = [
  {
    id: 1,
    title: '津门记忆摄影大赛',
    desc: '用镜头记录天津的历史建筑与人文风情',
    participants: '1,234',
    prize: '¥5,000',
    deadline: '7天',
    image: '/challenge-1.jpg',
    color: 'from-amber-500 to-yellow-500',
    icon: Trophy
  },
  {
    id: 2,
    title: '创意天津话表情包',
    desc: '设计有趣的天津方言表情包',
    participants: '856',
    prize: '¥3,000',
    deadline: '14天',
    image: '/challenge-2.jpg',
    color: 'from-pink-500 to-rose-500',
    icon: Star
  },
  {
    id: 3,
    title: '传统手艺新演绎',
    desc: '用现代方式展现传统手工艺',
    participants: '567',
    prize: '¥8,000',
    deadline: '21天',
    image: '/challenge-3.jpg',
    color: 'from-emerald-500 to-teal-500',
    icon: Target
  },
];

const popularMusic = [
  { id: 1, title: '津门小调', artist: '传统民乐', usage: '12.5万', duration: '3:24', trend: '+15%' },
  { id: 2, title: '海河之夜', artist: '现代融合', usage: '8.9万', duration: '4:12', trend: '+8%' },
  { id: 3, title: '老城记忆', artist: '轻音乐', usage: '6.7万', duration: '2:58', trend: '+12%' },
  { id: 4, title: '相声片段', artist: '传统曲艺', usage: '5.3万', duration: '5:45', trend: '+5%' },
];

const InspirationHub: React.FC = () => {
  const { isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState('all');
  const [savedIdeas, setSavedIdeas] = useState<number[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const categories = [
    { id: 'all', label: '全部', icon: Layers, count: 24 },
    { id: 'hot', label: '热门话题', icon: Flame, count: 6 },
    { id: 'template', label: '创作模板', icon: Wand2, count: 12 },
    { id: 'ai', label: 'AI灵感', icon: Sparkles, count: 8 },
    { id: 'challenge', label: '创作挑战', icon: Trophy, count: 3 },
  ];

  const toggleSave = (id: number) => {
    setSavedIdeas(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'image': return ImageIcon;
      default: return FileText;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendIcon className="w-3 h-3 text-emerald-500" />;
      case 'down': return <TrendIcon className="w-3 h-3 text-rose-500 rotate-180" />;
      default: return <div className="w-3 h-3 rounded-full bg-amber-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-3xl ${isDark ? 'bg-gray-800/50' : 'bg-white'} shadow-xl border ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-pink-400/20 to-orange-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative px-8 py-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3 mb-4"
              >
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                  每日更新
                </span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`text-3xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                创作灵感中心
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-lg max-w-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              >
                发现热门话题，获取AI创作建议，参与创作挑战，让你的创意无限迸发
              </motion.p>
            </div>
            
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`hidden md:flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                isDark 
                  ? 'bg-gray-700/80 text-gray-200 hover:bg-gray-700 border border-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              刷新灵感
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Category Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
      >
        {categories.map((cat, index) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                  : isDark
                  ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
              <span className="font-medium">{cat.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isActive 
                  ? 'bg-white/20 text-white' 
                  : isDark 
                    ? 'bg-gray-700 text-gray-400' 
                    : 'bg-gray-100 text-gray-500'
              }`}>
                {cat.count}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Hot Topics Section */}
          {(activeCategory === 'all' || activeCategory === 'hot') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl ${isDark ? 'bg-gray-800/50' : 'bg-white'} shadow-lg border ${isDark ? 'border-gray-700/50' : 'border-gray-100'} overflow-hidden`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                      <Flame className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        热门话题
                      </h2>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        实时更新的热门创作主题
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ x: 4 }}
                    className={`flex items-center gap-1 text-sm font-medium ${
                      isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                    }`}
                  >
                    查看更多
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hotTopics.map((topic, index) => (
                    <motion.div
                      key={topic.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      onMouseEnter={() => setHoveredCard(topic.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                        isDark 
                          ? 'bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 hover:border-gray-500' 
                          : 'bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold text-lg ${
                          index < 3 
                            ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg shadow-orange-500/25' 
                            : isDark 
                              ? 'bg-gray-600 text-gray-400' 
                              : 'bg-gray-200 text-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {topic.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              {topic.views}次浏览
                            </span>
                            {topic.hot && (
                              <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                                <Flame className="w-3 h-3" />
                                热门
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getTrendIcon(topic.trend)}
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          isDark ? 'bg-gray-600/50 text-gray-400' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {topic.category}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* AI Suggestions Section */}
          {(activeCategory === 'all' || activeCategory === 'ai') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl ${isDark ? 'bg-gray-800/50' : 'bg-white'} shadow-lg border ${isDark ? 'border-gray-700/50' : 'border-gray-100'} overflow-hidden`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                      <Sparkles className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        AI 创作建议
                      </h2>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        基于你的创作风格智能推荐
                      </p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                    isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                  }`}>
                    <Zap className="w-3 h-3" />
                    智能推荐
                  </span>
                </div>

                <div className="space-y-4">
                  {aiSuggestions.map((suggestion, index) => {
                    const Icon = suggestion.icon;
                    return (
                      <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.01 }}
                        className={`group relative p-5 rounded-2xl border transition-all duration-300 overflow-hidden ${
                          isDark 
                            ? 'bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-800/30 hover:border-purple-700/50' 
                            : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:border-purple-300'
                        }`}
                      >
                        <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${suggestion.color}`} />
                        
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pl-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${suggestion.color}`}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {suggestion.title}
                              </h3>
                            </div>
                            
                            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {suggestion.desc}
                            </p>
                            
                            <div className="flex items-center gap-4 mb-4">
                              <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${
                                isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-white text-gray-600 shadow-sm'
                              }`}>
                                <Target className="w-3 h-3" />
                                难度: {suggestion.difficulty}
                              </span>
                              <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${
                                isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-white text-gray-600 shadow-sm'
                              }`}>
                                <Eye className="w-3 h-3" />
                                预估曝光: {suggestion.estimatedViews}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {suggestion.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                                    isDark 
                                      ? 'bg-blue-900/30 text-blue-300' 
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleSave(suggestion.id)}
                            className={`p-2.5 rounded-xl transition-all ${
                              savedIdeas.includes(suggestion.id)
                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                                : isDark
                                ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${savedIdeas.includes(suggestion.id) ? 'fill-current' : ''}`} />
                          </motion.button>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="w-full mt-5 py-3 text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow"
                        >
                          使用这个创意
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Creative Challenges Section */}
          {(activeCategory === 'all' || activeCategory === 'challenge') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl ${isDark ? 'bg-gray-800/50' : 'bg-white'} shadow-lg border ${isDark ? 'border-gray-700/50' : 'border-gray-100'} overflow-hidden`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                      <Trophy className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        创作挑战
                      </h2>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        参与挑战赢取丰厚奖励
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ x: 4 }}
                    className={`flex items-center gap-1 text-sm font-medium ${
                      isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                    }`}
                  >
                    全部挑战
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {creativeChallenges.map((challenge, index) => {
                    const Icon = challenge.icon;
                    return (
                      <motion.div
                        key={challenge.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.03, y: -4 }}
                        className={`group relative p-5 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${
                          isDark 
                            ? 'bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 hover:border-gray-500' 
                            : 'bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 shadow-sm hover:shadow-lg'
                        }`}
                      >
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${challenge.color}`} />
                        
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${challenge.color} flex items-center justify-center mb-4 shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        
                        <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {challenge.title}
                        </h3>
                        <p className={`text-xs mb-4 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {challenge.desc}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <Users className="w-3 h-3" />
                            {challenge.participants}
                          </span>
                          <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <Clock className="w-3 h-3" />
                            {challenge.deadline}
                          </span>
                        </div>
                        
                        <div className={`flex items-center justify-center gap-1 py-2 px-4 rounded-xl text-sm font-bold ${
                          isDark 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          <Award className="w-4 h-4" />
                          奖金 {challenge.prize}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Trending Templates */}
          {(activeCategory === 'all' || activeCategory === 'template') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl ${isDark ? 'bg-gray-800/50' : 'bg-white'} shadow-lg border ${isDark ? 'border-gray-700/50' : 'border-gray-100'} overflow-hidden`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-pink-500/20' : 'bg-pink-100'}`}>
                      <Wand2 className="w-5 h-5 text-pink-500" />
                    </div>
                    <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      热门模板
                    </h2>
                  </div>
                </div>

                <div className="space-y-4">
                  {trendingTemplates.map((template, index) => {
                    const TypeIcon = getTypeIcon(template.type);
                    return (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        className={`group flex gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                          isDark 
                            ? 'bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 hover:border-gray-500' 
                            : 'bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 shadow-sm hover:shadow-md'
                        }`}
                      >
                        <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow`}>
                          <TypeIcon className="w-8 h-8 text-white/80" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold truncate mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {template.title}
                          </h3>
                          <div className="flex items-center gap-3 mb-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              {template.usage}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {template.likes}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {template.tags.slice(0, 2).map((tag, i) => (
                              <span
                                key={i}
                                className={`text-[10px] px-2 py-1 rounded-md font-medium ${
                                  isDark ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-600 shadow-sm'
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full mt-5 py-3 text-sm font-semibold rounded-xl transition-all ${
                    isDark 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  查看更多模板
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Popular Music */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl ${isDark ? 'bg-gray-800/50' : 'bg-white'} shadow-lg border ${isDark ? 'border-gray-700/50' : 'border-gray-100'} overflow-hidden`}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'}`}>
                  <Music className="w-5 h-5 text-cyan-500" />
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    热门音乐
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    为你的作品配上热门BGM
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {popularMusic.map((music, index) => (
                  <motion.div
                    key={music.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                      isDark 
                        ? 'hover:bg-gray-700/50' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                      <Music className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {music.title}
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {music.artist}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {music.usage}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {music.trend}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl p-6 ${isDark ? 'bg-gradient-to-br from-indigo-600 to-purple-700' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} shadow-xl shadow-indigo-500/25`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-white/20">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-bold">创作数据</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-xl bg-white/10">
                <p className="text-2xl font-bold text-white">128</p>
                <p className="text-xs text-white/70">今日灵感</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/10">
                <p className="text-2xl font-bold text-white">45</p>
                <p className="text-xs text-white/70">已收藏</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/10">
                <p className="text-2xl font-bold text-white">12</p>
                <p className="text-xs text-white/70">参与挑战</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/10">
                <p className="text-2xl font-bold text-white">8</p>
                <p className="text-xs text-white/70">获奖作品</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default InspirationHub;
