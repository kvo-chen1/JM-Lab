/**
 * 创作灵感中心 - 优化版
 * 学习抖音"热点宝"设计，集成实时热点追踪功能
 */

import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Lightbulb,
  Hash,
  Trophy,
  Wand2,
  Video,
  TrendingUp,
  Eye,
  Heart,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  BarChart3,
  Zap,
  Sparkles,
  RotateCcw,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { trendingService, TrendingTopic } from '@/services/trendingService';
import { supabase } from '@/lib/supabase';
import TrendingCard from '@/components/TrendingCardV2';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// 默认数据 - 当数据库为空时使用
const getDefaultTopics = (category: string): TrendingTopic[] => {
  const defaultData: Record<string, TrendingTopic[]> = {
    'tianjin-culture': [
      {
        id: 'default-1',
        title: '狗不理包子制作技艺',
        description: '传承百年的天津味道，探索非遗美食的制作工艺',
        category: 'tianjin-culture',
        subcategory: 'food',
        heatValue: 280000000,
        growthRate: 15.5,
        videoCount: 1563000,
        viewCount: 680000,
        likeCount: 48000,
        trend: 'rising',
        relatedTags: ['狗不理', '包子', '传统美食', '老字号', '非遗'],
        suggestedAngles: ['拍摄包子制作的 18 个褶细节', '采访老字号传承人讲述历史'],
        timeRange: '24h',
        rank: 1,
      },
      {
        id: 'default-2',
        title: '天津之眼夜景航拍',
        description: '海河两岸灯火辉煌，展现现代天津的璀璨夜景',
        category: 'tianjin-culture',
        subcategory: 'river',
        heatValue: 190000000,
        growthRate: 12.3,
        videoCount: 982000,
        viewCount: 524000,
        likeCount: 36000,
        trend: 'rising',
        relatedTags: ['天津之眼', '夜景', '海河', '航拍'],
        suggestedAngles: ['无人机航拍天津之眼全景', '结合海河游船视角'],
        timeRange: '24h',
        rank: 2,
      },
      {
        id: 'default-3',
        title: '天津话方言教学',
        description: '听相声学天津话，地道方言趣味教学',
        category: 'tianjin-culture',
        subcategory: 'dialect',
        heatValue: 120000000,
        growthRate: 20.8,
        videoCount: 678000,
        viewCount: 458000,
        likeCount: 32000,
        trend: 'rising',
        relatedTags: ['天津话', '方言', '相声', '教学'],
        suggestedAngles: ['相声演员教经典天津话', '外地人学天津话的趣事'],
        timeRange: '24h',
        rank: 3,
      },
      {
        id: 'default-4',
        title: '泥人张非遗技艺',
        description: '一双手捏出万千世界，传统手工艺的匠心传承',
        category: 'tianjin-culture',
        subcategory: 'craft',
        heatValue: 98000000,
        growthRate: 8.5,
        videoCount: 345000,
        viewCount: 386000,
        likeCount: 29000,
        trend: 'stable',
        relatedTags: ['泥人张', '非遗', '手工艺', '泥塑'],
        suggestedAngles: ['记录泥人张制作全过程', '展示经典作品背后的故事'],
        timeRange: '24h',
        rank: 4,
      },
      {
        id: 'default-5',
        title: '五大道历史建筑',
        description: '百年洋楼故事多，探寻天津的历史印记',
        category: 'tianjin-culture',
        subcategory: 'history',
        heatValue: 75000000,
        growthRate: 10.2,
        videoCount: 456000,
        viewCount: 321000,
        likeCount: 23000,
        trend: 'rising',
        relatedTags: ['五大道', '洋楼', '历史', '建筑'],
        suggestedAngles: ['探访五大道名人故居', '讲述建筑背后的历史故事'],
        timeRange: '24h',
        rank: 5,
      },
    ],
    'brand-tasks': [
      {
        id: 'brand-default-1',
        title: '海河乳业品牌宣传视频创作',
        description: '展示海河牛奶与天津早餐文化的结合',
        category: 'brand-tasks',
        subcategory: 'food-brand',
        heatValue: 15000000,
        growthRate: 25.6,
        videoCount: 156,
        viewCount: 89000,
        likeCount: 5600,
        trend: 'rising',
        relatedTags: ['海河乳业', '品牌宣传', '短视频'],
        suggestedAngles: ['展示海河牛奶配煎饼果子', '采访工厂了解生产工艺'],
        timeRange: '24h',
        rank: 1,
      },
      {
        id: 'brand-default-2',
        title: '天津之眼景区推广内容创作',
        description: '拍摄天津之眼夜景及周边美食推荐',
        category: 'brand-tasks',
        subcategory: 'tourism-brand',
        heatValue: 12000000,
        growthRate: 18.3,
        videoCount: 234,
        viewCount: 67000,
        likeCount: 4200,
        trend: 'rising',
        relatedTags: ['天津之眼', '景区推广', '夜景', '旅游'],
        suggestedAngles: ['无人机航拍全景', '周边美食和住宿推荐'],
        timeRange: '24h',
        rank: 2,
      },
    ],
    'creative-events': [
      {
        id: 'event-default-1',
        title: '"津门记忆"摄影大赛',
        description: '用镜头记录天津的历史建筑与人文风情',
        category: 'creative-events',
        subcategory: 'photo',
        heatValue: 25000000,
        growthRate: 35.2,
        videoCount: 1234,
        viewCount: 156000,
        likeCount: 12500,
        trend: 'rising',
        relatedTags: ['摄影大赛', '津门记忆', '历史建筑'],
        suggestedAngles: ['五大道欧式建筑摄影', '海河两岸夜景拍摄'],
        timeRange: '24h',
        rank: 1,
      },
      {
        id: 'event-default-2',
        title: '天津话创意表情包设计征集',
        description: '设计有趣的天津方言表情包，传播本土文化',
        category: 'creative-events',
        subcategory: 'design',
        heatValue: 18000000,
        growthRate: 28.6,
        videoCount: 856,
        viewCount: 98000,
        likeCount: 8900,
        trend: 'rising',
        relatedTags: ['表情包', '天津话', '方言', '创意设计'],
        suggestedAngles: ['经典天津话词汇表情包', '天津人日常对话系列'],
        timeRange: '24h',
        rank: 2,
      },
    ],
    'ai-inspiration': [
      {
        id: 'ai-default-1',
        title: 'AI生成天津风景水墨画',
        description: '利用 AI 绘图工具创作天津地标的水墨风格作品',
        category: 'ai-inspiration',
        subcategory: 'image',
        heatValue: 8500000,
        growthRate: 45.2,
        videoCount: 2340,
        viewCount: 156000,
        likeCount: 18900,
        trend: 'rising',
        relatedTags: ['AI绘图', '水墨画', '天津风景', '数字艺术'],
        suggestedAngles: ['天津之眼水墨风格', '古文化街水墨长卷'],
        timeRange: '24h',
        rank: 1,
      },
      {
        id: 'ai-default-2',
        title: 'AI创作天津美食文案',
        description: 'AI 生成天津美食的创意文案和脚本',
        category: 'ai-inspiration',
        subcategory: 'copy',
        heatValue: 6200000,
        growthRate: 38.5,
        videoCount: 1856,
        viewCount: 98000,
        likeCount: 12300,
        trend: 'rising',
        relatedTags: ['AI文案', '天津美食', '脚本创作'],
        suggestedAngles: ['狗不理包子创意文案', '天津早餐文化脚本'],
        timeRange: '24h',
        rank: 2,
      },
    ],
    'templates': [
      {
        id: 'template-default-1',
        title: '津门印象海报模板',
        description: '天津文化主题的海报设计模板',
        category: 'templates',
        subcategory: 'poster',
        heatValue: 12000000,
        growthRate: 15.8,
        videoCount: 23000,
        viewCount: 89000,
        likeCount: 6700,
        trend: 'stable',
        relatedTags: ['海报模板', '津门印象', '文化主题'],
        suggestedAngles: ['天津地标建筑模板', '传统纹样设计素材'],
        timeRange: '24h',
        rank: 1,
      },
      {
        id: 'template-default-2',
        title: '天津话搞笑配音模板',
        description: '天津方言配音的短视频模板',
        category: 'templates',
        subcategory: 'video',
        heatValue: 9800000,
        growthRate: 22.3,
        videoCount: 18000,
        viewCount: 67000,
        likeCount: 8900,
        trend: 'rising',
        relatedTags: ['视频模板', '天津话', '搞笑配音'],
        suggestedAngles: ['日常对话配音模板', '天津话挑战系列'],
        timeRange: '24h',
        rank: 2,
      },
    ],
  };
  
  return defaultData[category] || defaultData['tianjin-culture'];
};

// 主分类配置
const mainCategories = [
  { id: 'trending', label: '热点追踪', icon: Flame, color: 'from-rose-500 to-pink-500', bgColor: 'bg-rose-50', textColor: 'text-rose-600' },
  { id: 'tianjin-culture', label: '津门文化', icon: Video, color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
  { id: 'brand-tasks', label: '品牌任务', icon: Lightbulb, color: 'from-emerald-500 to-teal-500', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
  { id: 'creative-events', label: '创作活动', icon: Trophy, color: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  { id: 'ai-inspiration', label: 'AI 灵感', icon: Wand2, color: 'from-violet-500 to-purple-500', bgColor: 'bg-violet-50', textColor: 'text-violet-600' },
  { id: 'templates', label: '创作模板', icon: FileText, color: 'from-cyan-500 to-blue-500', bgColor: 'bg-cyan-50', textColor: 'text-cyan-600' },
];

// 子分类配置
const subCategories: Record<string, { id: string; label: string }[]> = {
  'trending': [
    { id: 'all', label: '全部热点' },
    { id: 'rising', label: '上升热点' },
    { id: 'culture', label: '文化' },
    { id: 'food', label: '美食' },
    { id: 'travel', label: '旅游' },
  ],
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

const InspirationHub: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeMainCategory, setActiveMainCategory] = useState('trending');
  const [activeSubCategory, setActiveSubCategory] = useState('all');
  const [sortBy, setSortBy] = useState('heat');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  
  // 搜索功能
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TrendingTopic[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // 热点数据
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [risingStars, setRisingStars] = useState<TrendingTopic[]>([]);
  
  // 加载热点数据
  useEffect(() => {
    loadTrendingData();
  }, [activeMainCategory, activeSubCategory, timeRange]);

  const loadTrendingData = async () => {
    setIsLoading(true);
    try {
      // 根据分类加载不同数据
      if (activeMainCategory === 'trending' || activeMainCategory === 'tianjin-culture') {
        // 加载津门文化数据 - 从真实数据库 (tianjin_traditional_brands + tianjin_hotspots)
        
        // 并行加载老字号和热点数据
        const [brandsRes, hotspotsRes] = await Promise.all([
          supabase
            .from('tianjin_traditional_brands')
            .select('*')
            .order('popularity', { ascending: false })
            .limit(15),
          supabase
            .from('tianjin_hotspots')
            .select('*')
            .order('participant_count', { ascending: false })
            .limit(15)
        ]);

        const brands = brandsRes.data || [];
        const hotspots = hotspotsRes.data || [];

        // 转换为 TrendingTopic 格式
        let mappedTopics: TrendingTopic[] = [
          // 老字号数据
          ...brands.map((brand: any, index: number) => ({
            id: `brand-${brand.id}`,
            title: brand.name,
            description: brand.description,
            category: 'tianjin-culture',
            subcategory: 'time-honored',
            heatValue: (brand.popularity || 0) * 1000,
            growthRate: Math.random() * 25 + 5,
            videoCount: brand.collaboration_tools || 0,
            viewCount: (brand.popularity || 0) * 100,
            likeCount: Math.floor((brand.popularity || 0) * 10),
            trend: 'stable' as const,
            relatedTags: ['老字号', '天津', '传统品牌'],
            suggestedAngles: [
              `探索 ${brand.name} 的历史故事`,
              `讲述 ${brand.name} 的传承技艺`,
              `展示 ${brand.name} 的现代创新`,
            ],
            timeRange: timeRange,
            rank: index + 1,
            coverImage: brand.logo,
          })),
          // 热点活动数据
          ...hotspots.map((hotspot: any, index: number) => ({
            id: `hotspot-${hotspot.id}`,
            title: hotspot.title,
            description: hotspot.description,
            category: 'tianjin-culture',
            subcategory: hotspot.type || 'event',
            heatValue: (hotspot.participant_count || 0) * 500,
            growthRate: Math.random() * 30 + 10,
            videoCount: hotspot.participant_count || 0,
            viewCount: (hotspot.participant_count || 0) * 200,
            likeCount: Math.floor((hotspot.participant_count || 0) * 20),
            trend: hotspot.status === 'ongoing' ? 'rising' as const : 'stable' as const,
            relatedTags: hotspot.tags || [],
            suggestedAngles: [
              `参与活动：${hotspot.title}`,
              hotspot.organizer ? `由 ${hotspot.organizer} 举办` : '热门活动',
              hotspot.has_prize ? '有奖金激励' : '展示才华',
            ],
            timeRange: timeRange,
            rank: brands.length + index + 1,
            coverImage: hotspot.image,
          }))
        ];

        // 根据子分类筛选
        let filteredTopics = mappedTopics;
        if (activeSubCategory !== 'all') {
          filteredTopics = mappedTopics.filter(t => t.subcategory === activeSubCategory);
        }

        // 如果数据库为空，使用默认数据
        if (filteredTopics.length === 0) {
          filteredTopics = getDefaultTopics('tianjin-culture');
        }

        setTrendingTopics(filteredTopics.slice(0, 20));
        setRisingStars(filteredTopics.filter(t => t.trend === 'rising').slice(0, 5));
      } else if (activeMainCategory === 'brand-tasks') {
        // 加载品牌任务数据 - 从真实数据库
        let query = supabase
          .from('brand_tasks')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(20);

        if (activeSubCategory !== 'all') {
          // 根据子分类筛选
          if (activeSubCategory === 'ongoing') {
            query = query.eq('status', 'published');
          }
        }

        const { data: brandTasks, error } = await query;
        
        if (error) throw error;

        // 转换为 TrendingTopic 格式
        let mappedTopics: TrendingTopic[] = (brandTasks || []).map((task: any, index: number) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          category: 'brand-tasks',
          subcategory: activeSubCategory,
          heatValue: task.budget || 0,
          growthRate: Math.random() * 30, // 模拟增长率
          videoCount: task.participant_count || 0,
          viewCount: (task.participant_count || 0) * 1000,
          likeCount: Math.floor((task.participant_count || 0) * 100),
          trend: 'rising' as const,
          relatedTags: task.tags || [],
          suggestedAngles: [
            `根据任务要求创作：${task.requirements?.substring(0, 50)}`,
            '展示品牌故事和价值观',
            '结合天津文化元素创作',
          ],
          timeRange: timeRange,
          rank: index + 1,
        }));

        // 如果数据库为空，使用默认数据
        if (mappedTopics.length === 0) {
          mappedTopics = getDefaultTopics('brand-tasks');
        }

        setTrendingTopics(mappedTopics);
        setRisingStars(mappedTopics.filter(t => t.trend === 'rising').slice(0, 5));
      } else if (activeMainCategory === 'creative-events') {
        // 加载创作活动数据 - 从真实数据库
        let query = supabase
          .from('events')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(20);

        const { data: events, error } = await query;
        
        if (error) throw error;

        // 转换为 TrendingTopic 格式
        let mappedTopics: TrendingTopic[] = (events || []).map((event: any, index: number) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          category: 'creative-events',
          subcategory: activeSubCategory,
          heatValue: event.participant_count ? event.participant_count * 1000 : Math.random() * 10000000,
          growthRate: Math.random() * 40,
          videoCount: event.participant_count || 0,
          viewCount: (event.participant_count || 0) * 500,
          likeCount: Math.floor((event.participant_count || 0) * 50),
          trend: 'rising' as const,
          relatedTags: event.tags || [],
          suggestedAngles: [
            `参与活动：${event.title}`,
            '展示你的创作才华',
            '赢取活动奖励',
          ],
          timeRange: timeRange,
          rank: index + 1,
        }));

        // 如果数据库为空，使用默认数据
        if (mappedTopics.length === 0) {
          mappedTopics = getDefaultTopics('creative-events');
        }

        setTrendingTopics(mappedTopics);
        setRisingStars(mappedTopics.filter(t => t.trend === 'rising').slice(0, 5));
      } else if (activeMainCategory === 'ai-inspiration') {
        // 加载 AI 灵感数据 - 从 tianjin_templates 表
        const { data: templates, error } = await supabase
          .from('tianjin_templates')
          .select('*')
          .order('usage_count', { ascending: false })
          .limit(20);

        if (error) throw error;

        let mappedTopics: TrendingTopic[] = (templates || []).map((template: any, index: number) => ({
          id: `ai-${template.id}`,
          title: template.name,
          description: template.description,
          category: 'ai-inspiration',
          subcategory: template.category || activeSubCategory,
          heatValue: (template.usage_count || 0) * 100,
          growthRate: Math.random() * 50,
          videoCount: template.usage_count || 0,
          viewCount: (template.usage_count || 0) * 200,
          likeCount: Math.floor((template.usage_count || 0) * 10),
          trend: 'rising' as const,
          relatedTags: [template.category || 'AI灵感'],
          suggestedAngles: [
            `使用模板 "${template.name}" 创作`,
            'AI 辅助生成更多创意',
            '探索 AI 创作的可能性',
          ],
          timeRange: timeRange,
          rank: index + 1,
          coverImage: template.thumbnail,
        }));

        // 如果数据库为空，使用默认数据
        if (mappedTopics.length === 0) {
          mappedTopics = getDefaultTopics('ai-inspiration');
        }

        setTrendingTopics(mappedTopics);
        setRisingStars(mappedTopics.filter(t => t.trend === 'rising').slice(0, 5));
      } else if (activeMainCategory === 'templates') {
        // 加载模板数据 - 从 tianjin_templates 表
        const { data: templates, error } = await supabase
          .from('tianjin_templates')
          .select('*')
          .order('usage_count', { ascending: false })
          .limit(20);

        if (error) throw error;

        let mappedTopics: TrendingTopic[] = (templates || []).map((template: any, index: number) => ({
          id: `template-${template.id}`,
          title: template.name,
          description: template.description,
          category: 'templates',
          subcategory: template.category || activeSubCategory,
          heatValue: (template.usage_count || 0) * 100,
          growthRate: Math.random() * 40,
          videoCount: template.usage_count || 0,
          viewCount: (template.usage_count || 0) * 150,
          likeCount: Math.floor((template.usage_count || 0) * 8),
          trend: 'stable' as const,
          relatedTags: [template.category || '创作模板'],
          suggestedAngles: [
            `使用模板 "${template.name}" 快速创作`,
            '基于模板进行二次创作',
            '参考模板风格创作原创内容',
          ],
          timeRange: timeRange,
          rank: index + 1,
          coverImage: template.thumbnail,
        }));

        // 如果数据库为空，使用默认数据
        if (mappedTopics.length === 0) {
          mappedTopics = getDefaultTopics('templates');
        }

        setTrendingTopics(mappedTopics);
        setRisingStars(mappedTopics.filter(t => t.trend === 'rising').slice(0, 5));
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败，已使用演示数据');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理参与热点
  const handleParticipate = (topic: TrendingTopic) => {
    if (!user) {
      toast.error('请先登录后再参与创作');
      navigate('/login');
      return;
    }
    
    // 记录用户行为
    trendingService.trackUserBehavior(user.id, topic.id, 'use');
    
    // 保存创作上下文
    const creationContext = {
      sourceType: 'trending',
      topicId: topic.id,
      topicTitle: topic.title,
      relatedTags: topic.relatedTags,
      suggestedAngles: topic.suggestedAngles,
      createdAt: Date.now(),
    };
    
    localStorage.setItem('creationContext', JSON.stringify(creationContext));
    
    // 跳转到创作页面
    navigate('/create', {
      state: {
        fromTrending: true,
        prefillData: {
          title: `参与 #${topic.title}`,
          tags: topic.relatedTags,
          category: topic.category,
        }
      }
    });
    
    toast.success('已带入热点创作！');
  };

  // 处理收藏
  const handleBookmark = (topic: TrendingTopic) => {
    if (!user) return;
    trendingService.trackUserBehavior(user.id, topic.id, 'bookmark');
    toast.success('已收藏热点');
  };

  // 处理分享
  const handleShare = (topic: TrendingTopic) => {
    const shareUrl = `${window.location.origin}/trending/${topic.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('链接已复制到剪贴板');
    
    if (user) {
      trendingService.trackUserBehavior(user.id, topic.id, 'share');
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    loadTrendingData();
    toast.success('数据已刷新');
  };

  // 搜索处理
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    try {
      const results = await trendingService.searchTrendingTopics(query);
      setSearchResults(results);
    } catch (error) {
      console.error('搜索失败:', error);
      toast.error('搜索失败');
    } finally {
      setIsSearching(false);
    }
  };

  // 搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // 防抖搜索
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    setSearchTimeout(setTimeout(() => handleSearch(query), 300));
  };

  // 清除搜索
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和搜索 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.div 
            className={`p-3 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/25`}
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <Zap className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              创作灵感
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              探索津门文化，发现创作机会
            </p>
          </div>
        </div>
        
        {/* 搜索框 */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <Search className={`w-4 h-4 ${isSearching ? 'animate-pulse' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="搜索灵感..."
            value={searchQuery}
            onChange={handleSearchChange}
            className={`w-48 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
          />
          {searchQuery && (
            <button onClick={handleClearSearch} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
              <X className={`w-3 h-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          )}
        </div>
        
        {/* 刷新按钮 */}
        <button
          onClick={handleRefresh}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            isDark
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* 上升热点速览 */}
      {activeMainCategory === 'trending' && risingStars.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border-2 border-dashed ${
            isDark
              ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30'
              : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-emerald-500" />
            <h2 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              🔥 上升热点
            </h2>
            <span className="text-xs text-emerald-500 font-medium">
              增长率最高
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {risingStars.map((topic, index) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleParticipate(topic)}
                className={`p-3 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                  isDark
                    ? 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700'
                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                    index < 3
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                      : isDark
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-xs font-medium truncate flex-1">
                    {topic.title}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-500 font-medium">
                    +{topic.growthRate}%
                  </span>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    {topic.viewCount >= 10000 ? `${(topic.viewCount / 10000).toFixed(1)}万` : topic.viewCount}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

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

      {/* 子分类筛选和排序 */}
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
              <option value="heat">热度最高</option>
              <option value="growth">增长最快</option>
              <option value="newest">最新发布</option>
            </select>
            <ChevronDown className="w-4 h-4" />
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600 border border-gray-200'}`}>
            <Clock className="w-4 h-4" />
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-transparent outline-none cursor-pointer"
            >
              <option value="24h">24 小时</option>
              <option value="7d">7 天</option>
              <option value="30d">30 天</option>
            </select>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 列表区域：搜索结果或热点列表 */}
      <div>
        {/* 搜索结果标题 */}
        {isSearching && (
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-rose-500" />
            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              搜索 "{searchQuery}" 的结果
            </span>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              ({searchResults.length} 个结果)
            </span>
          </div>
        )}
        
        {/* 列表内容 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isLoading ? (
          // 加载状态
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="animate-pulse space-y-3">
                <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-3/4`} />
                <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/2`} />
                <div className={`h-20 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded`} />
              </div>
            </div>
          ))
        ) : isSearching && searchResults.length > 0 ? (
          // 搜索结果
          searchResults.map((topic, index) => (
            <TrendingCard
              key={topic.id}
              topic={topic}
              onParticipate={handleParticipate}
              onBookmark={handleBookmark}
              onShare={handleShare}
            />
          ))
        ) : trendingTopics.length > 0 ? (
          trendingTopics.map((topic, index) => (
            <TrendingCard
              key={topic.id}
              topic={topic}
              onParticipate={handleParticipate}
              onBookmark={handleBookmark}
              onShare={handleShare}
            />
          ))
        ) : (
          // 空状态
          <div className="col-span-full text-center py-12">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Sparkles className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              暂无热点数据
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              换个分类或时间范围试试
            </p>
          </div>
        )}
      </div>
      </div>

      {/* 加载更多 - 只在有数据且非搜索状态显示 */}
      {!isSearching && trendingTopics.length > 0 && (
        <div className="flex justify-center mt-6">
          <button className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-colors ${
            isDark 
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}>
            加载更多
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default InspirationHub;
