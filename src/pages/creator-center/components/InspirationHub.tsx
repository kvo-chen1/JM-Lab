import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Lightbulb,
  Hash,
  Trophy,
  Wand2,
  Music,
  Video,
  TrendingUp,
  Eye,
  Heart,
  Share2,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Clock,
  Filter,
  ExternalLink,
  Play,
  Image as ImageIcon,
  FileText,
  BarChart3,
  ArrowUpRight,
  Bookmark,
  Zap
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

// 主分类配置 - 结合天津文化平台特色
const mainCategories = [
  { id: 'tianjin-culture', label: '津门文化', icon: Video, color: 'from-rose-500 to-pink-500', bgColor: 'bg-rose-50', textColor: 'text-rose-600' },
  { id: 'brand-tasks', label: '品牌任务', icon: Lightbulb, color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
  { id: 'creative-events', label: '创作活动', icon: Trophy, color: 'from-emerald-500 to-teal-500', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
  { id: 'hot-topics', label: '热门话题', icon: Hash, color: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  { id: 'ai-inspiration', label: 'AI灵感', icon: Wand2, color: 'from-violet-500 to-purple-500', bgColor: 'bg-violet-50', textColor: 'text-violet-600' },
  { id: 'templates', label: '创作模板', icon: FileText, color: 'from-cyan-500 to-blue-500', bgColor: 'bg-cyan-50', textColor: 'text-cyan-600' },
];

// 子分类配置 - 根据平台特色定制
const subCategories: Record<string, { id: string; label: string }[]> = {
  'tianjin-culture': [
    { id: 'all', label: '全部' },
    { id: 'food', label: '天津美食' },
    { id: 'history', label: '历史建筑' },
    { id: 'dialect', label: '天津方言' },
    { id: 'craft', label: '传统手艺' },
    { id: 'opera', label: '戏曲曲艺' },
    { id: 'custom', label: '民俗风情' },
    { id: 'river', label: '海河风光' },
    { id: 'time-honored', label: '老字号' },
  ],
  'brand-tasks': [
    { id: 'all', label: '全部' },
    { id: 'ongoing', label: '进行中' },
    { id: 'high-reward', label: '高额奖励' },
    { id: 'new', label: '最新发布' },
    { id: 'food-brand', label: '美食品牌' },
    { id: 'culture-brand', label: '文化品牌' },
    { id: 'tourism-brand', label: '旅游品牌' },
  ],
  'creative-events': [
    { id: 'all', label: '全部' },
    { id: 'ongoing', label: '进行中' },
    { id: 'signup', label: '报名中' },
    { id: 'ended', label: '已结束' },
    { id: 'photo', label: '摄影大赛' },
    { id: 'design', label: '设计征集' },
    { id: 'video', label: '视频创作' },
  ],
  'hot-topics': [
    { id: 'all', label: '全部' },
    { id: 'trending', label: '实时上升' },
    { id: 'culture', label: '文化' },
    { id: 'food', label: '美食' },
    { id: 'travel', label: '旅游' },
    { id: 'life', label: '生活' },
    { id: 'story', label: '故事' },
  ],
  'ai-inspiration': [
    { id: 'all', label: '全部' },
    { id: 'image', label: 'AI绘图' },
    { id: 'video', label: 'AI视频' },
    { id: 'copy', label: '文案生成' },
    { id: 'design', label: '设计灵感' },
    { id: 'story', label: '故事创作' },
  ],
  'templates': [
    { id: 'all', label: '全部' },
    { id: 'poster', label: '海报模板' },
    { id: 'video', label: '视频模板' },
    { id: 'social', label: '社交媒体' },
    { id: 'festival', label: '节日节气' },
    { id: 'business', label: '商业宣传' },
  ],
};

// 模拟数据 - 津门文化
const tianjinCultureData = [
  {
    id: 1,
    title: '狗不理包子制作全过程，传承百年的天津味道',
    author: '津味传承',
    category: '天津美食',
    views: '68.0万',
    likes: '4.8万',
    comments: '3,200',
    shares: '7,800',
    tags: ['狗不理', '包子', '传统美食', '老字号'],
  },
  {
    id: 2,
    title: '天津之眼夜景航拍，海河两岸灯火辉煌',
    author: '航拍天津',
    category: '海河风光',
    views: '52.4万',
    likes: '3.6万',
    comments: '2,100',
    shares: '6,200',
    tags: ['天津之眼', '夜景', '海河', '航拍'],
  },
  {
    id: 3,
    title: '听相声学天津话，地道方言教学',
    author: '津门曲艺',
    category: '天津方言',
    views: '45.8万',
    likes: '3.2万',
    comments: '4,500',
    shares: '5,600',
    tags: ['相声', '天津话', '方言', '教学'],
  },
  {
    id: 4,
    title: '泥人张技艺展示，一双手捏出万千世界',
    author: '非遗传承',
    category: '传统手艺',
    views: '38.6万',
    likes: '2.9万',
    comments: '1,800',
    shares: '4,200',
    tags: ['泥人张', '非遗', '手工艺', '泥塑'],
  },
  {
    id: 5,
    title: '五大道历史建筑巡礼，百年洋楼故事多',
    author: '天津历史',
    category: '历史建筑',
    views: '32.1万',
    likes: '2.3万',
    comments: '1,500',
    shares: '3,800',
    tags: ['五大道', '洋楼', '历史', '建筑'],
  },
  {
    id: 6,
    title: '十八街麻花制作技艺，酥脆香甜的传统味道',
    author: '津味小吃',
    category: '天津美食',
    views: '28.9万',
    likes: '2.1万',
    comments: '1,200',
    shares: '3,200',
    tags: ['十八街麻花', '小吃', '传统', '美食'],
  },
];

// 模拟数据 - 品牌任务
const brandTasksData = [
  {
    id: 1,
    title: '海河乳业品牌宣传视频创作',
    brand: '海河乳业',
    reward: '¥2,000-5,000',
    participants: '156',
    deadline: '15天',
    category: '美食品牌',
    requirement: '展示海河牛奶与天津早餐文化的结合',
  },
  {
    id: 2,
    title: '天津之眼景区推广内容创作',
    brand: '天津之眼',
    reward: '¥3,000-8,000',
    participants: '234',
    deadline: '20天',
    category: '旅游品牌',
    requirement: '拍摄天津之眼夜景及周边美食推荐',
  },
  {
    id: 3,
    title: '桂发祥十八街麻花创意短视频',
    brand: '桂发祥',
    reward: '¥1,500-4,000',
    participants: '189',
    deadline: '10天',
    category: '美食品牌',
    requirement: '创意展示麻花制作过程或食用场景',
  },
  {
    id: 4,
    title: '天津博物馆文物故事创作',
    brand: '天津博物馆',
    reward: '¥2,500-6,000',
    participants: '98',
    deadline: '30天',
    category: '文化品牌',
    requirement: '讲述馆藏文物背后的历史故事',
  },
  {
    id: 5,
    title: '杨柳青年画非遗传承推广',
    brand: '杨柳青年画社',
    reward: '¥2,000-5,500',
    participants: '76',
    deadline: '25天',
    category: '文化品牌',
    requirement: '展示年画制作工艺或创新应用',
  },
  {
    id: 6,
    title: '天津古文化街探店视频',
    brand: '古文化街管委会',
    reward: '¥1,000-3,000',
    participants: '312',
    deadline: '12天',
    category: '旅游品牌',
    requirement: '探访古文化街特色店铺及手工艺品',
  },
];

// 模拟数据 - 创作活动
const creativeEventsData = [
  {
    id: 1,
    title: '"津门记忆"摄影大赛',
    desc: '用镜头记录天津的历史建筑与人文风情',
    participants: '1,234',
    prize: '¥10,000',
    deadline: '报名截止：7天',
    status: 'signup',
    category: '摄影大赛',
  },
  {
    id: 2,
    title: '天津话创意表情包设计征集',
    desc: '设计有趣的天津方言表情包，传播本土文化',
    participants: '856',
    prize: '¥5,000',
    deadline: '投稿截止：14天',
    status: 'ongoing',
    category: '设计征集',
  },
  {
    id: 3,
    title: '"海河之夜"短视频创作大赛',
    desc: '拍摄海河两岸夜景及市民生活',
    participants: '567',
    prize: '¥8,000',
    deadline: '投稿截止：21天',
    status: 'ongoing',
    category: '视频创作',
  },
  {
    id: 4,
    title: '天津美食地图创作计划',
    desc: '绘制天津特色美食地图，推荐隐藏美食',
    participants: '423',
    prize: '¥6,000',
    deadline: '报名截止：5天',
    status: 'signup',
    category: '设计征集',
  },
  {
    id: 5,
    title: '传统手艺新演绎创意赛',
    desc: '用现代方式展现天津传统手工艺',
    participants: '234',
    prize: '¥12,000',
    deadline: '已结束',
    status: 'ended',
    category: '视频创作',
  },
  {
    id: 6,
    title: '"我的天津故事"征文活动',
    desc: '分享你与天津的难忘故事',
    participants: '1,567',
    prize: '¥3,000',
    deadline: '投稿截止：30天',
    status: 'ongoing',
    category: '视频创作',
  },
];

// 模拟数据 - 热门话题
const hotTopicsData = [
  {
    id: 1,
    title: '津门文化',
    views: '2.8亿',
    works: '156.3万',
    likes: '892.5万',
    shares: '125.0万',
    trend: '+15%',
  },
  {
    id: 2,
    title: '天津美食',
    views: '1.9亿',
    works: '98.2万',
    likes: '567.3万',
    shares: '89.6万',
    trend: '+12%',
  },
  {
    id: 3,
    title: '海河夜景',
    views: '1.2亿',
    works: '45.6万',
    likes: '324.8万',
    shares: '56.3万',
    trend: '+8%',
  },
  {
    id: 4,
    title: '天津方言',
    views: '9,800万',
    works: '67.8万',
    likes: '445.2万',
    shares: '78.9万',
    trend: '+20%',
  },
  {
    id: 5,
    title: '传统手艺',
    views: '7,500万',
    works: '34.5万',
    likes: '267.6万',
    shares: '45.2万',
    trend: '+5%',
  },
  {
    id: 6,
    title: '老字号故事',
    views: '6,200万',
    works: '28.9万',
    likes: '198.4万',
    shares: '34.7万',
    trend: '+10%',
  },
];

// 模拟数据 - AI灵感
const aiInspirationData = [
  {
    id: 1,
    title: '创作一个关于天津狗不理包子的趣味短视频',
    desc: '结合历史故事和现代元素，展现传统美食的魅力',
    difficulty: '简单',
    estimatedViews: '5-10万',
    type: '视频',
    tags: ['美食', '历史', '趣味'],
  },
  {
    id: 2,
    title: '设计一套津门文化主题的海报系列',
    desc: '融合传统建筑、民俗元素，展现天津独特魅力',
    difficulty: '中等',
    estimatedViews: '3-8万',
    type: '设计',
    tags: ['设计', '文化', '系列'],
  },
  {
    id: 3,
    title: '制作天津方言教学短视频',
    desc: '用轻松幽默的方式教外地朋友天津话',
    difficulty: '简单',
    estimatedViews: '10-20万',
    type: '视频',
    tags: ['方言', '教学', '搞笑'],
  },
  {
    id: 4,
    title: 'AI生成海河夜景艺术画作',
    desc: '利用AI绘图工具创作海河夜景的艺术作品',
    difficulty: '简单',
    estimatedViews: '2-5万',
    type: 'AI绘图',
    tags: ['AI', '绘画', '夜景'],
  },
  {
    id: 5,
    title: '撰写天津老字号品牌故事文案',
    desc: '为天津传统品牌撰写有温度的品牌故事',
    difficulty: '中等',
    estimatedViews: '1-3万',
    type: '文案',
    tags: ['文案', '品牌', '故事'],
  },
  {
    id: 6,
    title: '创作天津传统戏曲与现代音乐融合视频',
    desc: '将传统戏曲元素融入现代音乐视频创作',
    difficulty: '困难',
    estimatedViews: '8-15万',
    type: '视频',
    tags: ['戏曲', '音乐', '创新'],
  },
];

// 模拟数据 - 创作模板
const templatesData = [
  { id: 1, title: '津门印象海报模板', usage: '2.3万', type: 'poster', tags: ['海报', '文化', '传统'] },
  { id: 2, title: '天津话搞笑配音模板', usage: '1.8万', type: 'video', tags: ['视频', '方言', '搞笑'] },
  { id: 3, title: '美食探店Vlog模板', usage: '1.5万', type: 'video', tags: ['Vlog', '美食', '探店'] },
  { id: 4, title: '传统纹样设计素材', usage: '9,800', type: 'poster', tags: ['设计', '纹样', '素材'] },
  { id: 5, title: '海河夜景视频片头', usage: '8,500', type: 'video', tags: ['视频', '夜景', '片头'] },
  { id: 6, title: '天津建筑线描素材', usage: '7,200', type: 'poster', tags: ['插画', '建筑', '素材'] },
];

const InspirationHub: React.FC = () => {
  const { isDark } = useTheme();
  const [activeMainCategory, setActiveMainCategory] = useState('tianjin-culture');
  const [activeSubCategory, setActiveSubCategory] = useState('all');
  const [sortBy, setSortBy] = useState('views');
  const [timeRange, setTimeRange] = useState('24h');

  // 获取当前主分类
  const currentCategory = mainCategories.find(c => c.id === activeMainCategory);

  // 获取当前数据
  const getCurrentData = () => {
    switch (activeMainCategory) {
      case 'tianjin-culture':
        return tianjinCultureData;
      case 'brand-tasks':
        return brandTasksData;
      case 'creative-events':
        return creativeEventsData;
      case 'hot-topics':
        return hotTopicsData;
      case 'ai-inspiration':
        return aiInspirationData;
      case 'templates':
        return templatesData;
      default:
        return tianjinCultureData;
    }
  };

  const currentData = getCurrentData();

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/25`}>
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>创作灵感</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>探索津门文化，发现创作机会</p>
        </div>
      </div>

      {/* 主分类标签栏 */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {mainCategories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeMainCategory === cat.id;
          return (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveMainCategory(cat.id);
                setActiveSubCategory('all');
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                  : isDark
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{cat.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* 子分类筛选 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {subCategories[activeMainCategory]?.map((sub) => {
            const isActive = activeSubCategory === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveSubCategory(sub.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? isDark
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-900 text-white'
                    : isDark
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>

        {/* 排序和时间筛选 */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600 border border-gray-200'}`}>
            <span>排序:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent outline-none cursor-pointer"
            >
              <option value="views">播放最高</option>
              <option value="likes">点赞最多</option>
              <option value="newest">最新发布</option>
            </select>
            <ChevronDown className="w-4 h-4" />
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600 border border-gray-200'}`}>
            <Clock className="w-4 h-4" />
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent outline-none cursor-pointer"
            >
              <option value="24h">24小时</option>
              <option value="7d">7天</option>
              <option value="30d">30天</option>
            </select>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 内容列表 */}
      <div className={`rounded-2xl ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'} overflow-hidden`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMainCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* 津门文化列表 */}
            {activeMainCategory === 'tianjin-culture' && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {tianjinCultureData.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer`}
                  >
                    {/* 排名 */}
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                      index < 3 
                        ? 'bg-gradient-to-br from-rose-500 to-pink-500 text-white' 
                        : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    
                    {/* 缩略图 */}
                    <div className={`w-24 h-16 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                      <Video className="w-6 h-6 text-gray-400" />
                    </div>
                    
                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold truncate mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {item.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {item.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {item.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          {item.shares}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map((tag, i) => (
                          <span key={i} className={`text-[10px] px-2 py-0.5 rounded ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* 分类标签 */}
                    <span className={`px-3 py-1 rounded-lg text-xs ${isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'}`}>
                      {item.category}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 品牌任务列表 */}
            {activeMainCategory === 'brand-tasks' && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {brandTasksData.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer`}
                  >
                    {/* 排名 */}
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                      index < 3 
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white' 
                        : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    
                    {/* 品牌图标 */}
                    <div className={`w-16 h-16 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center flex-shrink-0`}>
                      <Lightbulb className="w-6 h-6 text-gray-400" />
                    </div>
                    
                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold truncate mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {task.title}
                      </h3>
                      <p className={`text-xs truncate mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {task.requirement}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          {task.participants}人参与
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          剩余{task.deadline}
                        </span>
                      </div>
                    </div>
                    
                    {/* 奖励和操作 */}
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                        {task.reward}
                      </span>
                      <button className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isDark ? 'text-amber-400 hover:bg-amber-500/10' : 'text-amber-600 hover:bg-amber-50'
                      }`}>
                        <ExternalLink className="w-3 h-3" />
                        参与任务
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 创作活动列表 */}
            {activeMainCategory === 'creative-events' && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {creativeEventsData.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer`}
                  >
                    {/* 排名 */}
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                      index < 3 
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white' 
                        : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    
                    {/* 活动图标 */}
                    <div className={`w-16 h-16 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center flex-shrink-0`}>
                      <Trophy className="w-6 h-6 text-gray-400" />
                    </div>
                    
                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold truncate mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {event.title}
                      </h3>
                      <p className={`text-xs truncate mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {event.desc}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          {event.participants}人参与
                        </span>
                        <span className={`flex items-center gap-1 ${
                          event.status === 'ended' ? 'text-gray-400' : 'text-emerald-500'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {event.deadline}
                        </span>
                      </div>
                    </div>
                    
                    {/* 奖金和操作 */}
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                        奖金 {event.prize}
                      </span>
                      <button className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isDark ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-emerald-600 hover:bg-emerald-50'
                      }`}>
                        <ExternalLink className="w-3 h-3" />
                        {event.status === 'signup' ? '立即报名' : event.status === 'ended' ? '查看结果' : '参与活动'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 热门话题列表 */}
            {activeMainCategory === 'hot-topics' && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {hotTopicsData.map((topic, index) => (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer`}
                  >
                    {/* 排名 */}
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                      index < 3 
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white' 
                        : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    
                    {/* 话题图标 */}
                    <div className={`w-16 h-16 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center flex-shrink-0`}>
                      <Hash className="w-6 h-6 text-gray-400" />
                    </div>
                    
                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold truncate mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        #{topic.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {topic.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {topic.works}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {topic.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          {topic.shares}
                        </span>
                      </div>
                    </div>
                    
                    {/* 趋势 */}
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-500 text-sm font-medium">{topic.trend}</span>
                      <button className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isDark ? 'text-blue-400 hover:bg-blue-500/10' : 'text-blue-600 hover:bg-blue-50'
                      }`}>
                        <ExternalLink className="w-3 h-3" />
                        参与话题
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* AI灵感列表 */}
            {activeMainCategory === 'ai-inspiration' && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {aiInspirationData.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer`}
                  >
                    {/* 排名 */}
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                      index < 3 
                        ? 'bg-gradient-to-br from-violet-500 to-purple-500 text-white' 
                        : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    
                    {/* AI图标 */}
                    <div className={`w-16 h-16 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center flex-shrink-0`}>
                      <Wand2 className="w-6 h-6 text-gray-400" />
                    </div>
                    
                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold truncate mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.title}
                      </h3>
                      <p className={`text-xs truncate mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.desc}
                      </p>
                      <div className="flex items-center gap-2">
                        {item.tags.map((tag, i) => (
                          <span key={i} className={`text-[10px] px-2 py-0.5 rounded ${isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-700'}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* 难度和预估 */}
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-lg text-xs ${
                        item.difficulty === '简单' 
                          ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                          : item.difficulty === '中等'
                          ? isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                          : isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {item.difficulty}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        预估曝光: {item.estimatedViews}
                      </span>
                      <button className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isDark ? 'text-violet-400 hover:bg-violet-500/10' : 'text-violet-600 hover:bg-violet-50'
                      }`}>
                        <ExternalLink className="w-3 h-3" />
                        使用创意
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 创作模板列表 */}
            {activeMainCategory === 'templates' && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {templatesData.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer`}
                  >
                    {/* 排名 */}
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                      index < 3 
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white' 
                        : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    
                    {/* 模板图标 */}
                    <div className={`w-16 h-16 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center flex-shrink-0`}>
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                    
                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold truncate mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {template.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {template.tags.map((tag, i) => (
                          <span key={i} className={`text-[10px] px-2 py-0.5 rounded ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* 使用量和操作 */}
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {template.usage}人使用
                      </span>
                      <button className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isDark ? 'text-cyan-400 hover:bg-cyan-500/10' : 'text-cyan-600 hover:bg-cyan-50'
                      }`}>
                        <ExternalLink className="w-3 h-3" />
                        使用模板
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 加载更多 */}
      <div className="flex justify-center">
        <button className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-colors ${
          isDark 
            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
        }`}>
          加载更多
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InspirationHub;
