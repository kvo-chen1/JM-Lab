import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { workService, communityService, eventService } from '@/services/apiService';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { ChevronRight, Search } from 'lucide-react';
import MobileSearchPage from '@/components/MobileSearchPage';
import { getPicsumUrl } from '@/utils/templateImageGenerator';
import { toast } from 'sonner';

// 独立的 Banner 组件，避免影响整个页面重新渲染
const BannerCarousel = memo(({ works, isDark }: { works: Work[]; isDark: boolean }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Banner 自动轮播 - 只在组件内部更新状态
  useEffect(() => {
    if (works.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(works.length, 5));
    }, 5000);

    return () => clearInterval(interval);
  }, [works.length]);

  // 控制当前显示的视频播放，其他视频暂停
  useEffect(() => {
    videoRefs.current.forEach((video, workId) => {
      const workIndex = works.findIndex(w => w.id === workId);
      if (workIndex === currentIndex) {
        // 当前显示的视频，尝试播放
        video.play().catch(() => {
          // 自动播放被阻止，静默处理
        });
      } else {
        // 非当前显示的视频，暂停
        video.pause();
      }
    });
  }, [currentIndex, works]);

  if (works.length === 0) {
    return (
      <div className="relative h-[42rem] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80"
          alt="津脉广场"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <h1 className="text-2xl font-bold mb-1">探索津脉广场</h1>
          <p className="text-sm text-white/80">发现天津文化创意灵感</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[42rem] w-full overflow-hidden">
      {/* 轮播图片 */}
      <motion.div
        className="flex h-full"
        animate={{ x: `-${currentIndex * 100}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {works.slice(0, 5).map((work) => (
          <div
            key={work.id}
            className="min-w-full h-full relative cursor-pointer"
            onClick={() => {
              if (work.id) {
                navigate(`/post/${work.id}`);
              } else {
                navigate('/square');
              }
            }}
          >
            {work.isVideo ? (
              <video
                ref={(el) => {
                  if (el) {
                    videoRefs.current.set(work.id, el);
                  }
                }}
                src={work.thumbnail}
                className="w-full h-full object-cover"
                muted
                playsInline
                autoPlay
                loop
                preload="auto"
                onError={(e) => {
                  // 视频加载失败时，显示默认背景图
                  const video = e.target as HTMLVideoElement;
                  video.style.display = 'none';
                  const parent = video.parentElement;
                  if (parent) {
                    const img = document.createElement('img');
                    img.src = work.thumbnail || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80';
                    img.className = 'w-full h-full object-cover';
                    img.alt = work.title;
                    parent.insertBefore(img, video);
                  }
                }}
              />
            ) : (
              <img
                src={work.thumbnail}
                alt={work.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80';
                }}
              />
            )}
            {/* 渐变遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
            
            {/* 作品信息 */}
            <div className="absolute bottom-20 left-0 right-0 px-6 text-white">
              <h2 className="text-xl font-bold mb-1 truncate">
                {work.title}
              </h2>
              <p className="text-sm text-white/80">
                {work.creator}
              </p>
            </div>
          </div>
        ))}
      </motion.div>
      
      {/* 轮播指示器 */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
        {works.slice(0, 5).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentIndex === index 
                ? 'bg-white w-6' 
                : 'bg-white/50'
            }`}
          />
        ))}
      </div>
      
      {/* 左右滑动提示 */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
    </div>
  );
});

// 作品类型定义
interface Work {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  cover_image?: string;
  image_url?: string;
  creator?: string;
  creator_id?: string;
  likes?: number;
  created_at?: string;
}

// 品牌类型
interface Brand {
  id: string;
  name: string;
  logo?: string;
  category: string;
}

// 活动类型
interface Activity {
  id: string;
  title: string;
  status: string;
  participants: number;
  image: string;
  tag: string;
}

// 社群类型
interface Community {
  id: string;
  name: string;
  members: number;
  tags: string[];
  image: string;
}

// 排名类型
interface Ranking {
  rank: number;
  name: string;
  score: number;
  avatar: string;
  trend: 'up' | 'down' | 'same';
}

// 知识库类型
interface Knowledge {
  id: string;
  title: string;
  category: string;
  readTime: string;
  image: string;
}

// 活跃创作者类型
interface ActiveCreator {
  id: string;
  username: string;
  avatar_url: string;
  likes_count: number;
  isOnline?: boolean;
}

// 积分商城商品类型
interface ShopProduct {
  id: string;
  name: string;
  points: number;
  image: string;
  category: string;
  stock: number;
}

// 动画配置
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
};

export default function MobileHome() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [works, setWorks] = useState<Work[]>([]);
  const [userWorks, setUserWorks] = useState<Work[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [ranking, setRanking] = useState<Ranking[]>([]);
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [activeCreators, setActiveCreators] = useState<ActiveCreator[]>([]);
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSearchPage, setShowSearchPage] = useState(false);

  // 津脉作品模板数据（与PC端 JinMaiTemplatesSection 一致）
  interface JinMaiTemplate {
    id: string;
    title: string;
    subtitle: string;
    thumbnail: string;
    category: string;
    tags: string[];
    likes: number;
    usageCount: number;
    prompt: string;
  }

  const jinMaiTemplates: JinMaiTemplate[] = [
    {
      id: 'jm-001',
      title: '杨柳青年画·连年有余',
      subtitle: '传统年画风格，寓意吉祥',
      thumbnail: getPicsumUrl('yangliuqing-nianhua-traditional-folk-art', 600, 400),
      category: 'nianhua',
      tags: ['年画', '传统', '吉祥'],
      likes: 2341,
      usageCount: 568,
      prompt: '杨柳青年画风格，胖娃娃抱鲤鱼，莲花盛开，红色喜庆背景，传统中国年画'
    },
    {
      id: 'jm-002',
      title: '泥人张·戏曲人物',
      subtitle: '彩塑艺术，栩栩如生',
      thumbnail: getPicsumUrl('nirenzhang-clay-figurine-colorful-art', 600, 400),
      category: 'niren',
      tags: ['泥塑', '戏曲', '非遗'],
      likes: 1856,
      usageCount: 423,
      prompt: '泥人张彩塑风格，京剧人物，精致细腻，传统服饰，生动表情'
    },
    {
      id: 'jm-003',
      title: '风筝魏·燕子风筝',
      subtitle: '传统工艺，匠心独运',
      thumbnail: getPicsumUrl('fengzhengwei-kite-flying-sky-traditional', 600, 400),
      category: 'fengzheng',
      tags: ['风筝', '工艺', '春天'],
      likes: 1523,
      usageCount: 389,
      prompt: '风筝魏传统工艺，燕子造型风筝，竹骨纸面，彩绘精美，蓝天白云背景'
    },
    {
      id: 'jm-004',
      title: '天津之眼·夜景',
      subtitle: '城市地标，璀璨夜色',
      thumbnail: getPicsumUrl('tianjin-eye-ferris-wheel-night-lights', 600, 400),
      category: 'landmark',
      tags: ['地标', '夜景', '现代'],
      likes: 3421,
      usageCount: 892,
      prompt: '天津之眼摩天轮，海河夜景，灯光璀璨，城市天际线，现代都市风格'
    },
    {
      id: 'jm-005',
      title: '煎饼果子·国潮',
      subtitle: '津味早餐新演绎',
      thumbnail: getPicsumUrl('jianbing-guozi-chinese-crepe-street-food', 600, 400),
      category: 'brand',
      tags: ['美食', '早餐', '国潮'],
      likes: 2156,
      usageCount: 567,
      prompt: '天津煎饼果子国潮风格插画，传统早餐，热气腾腾，金黄色调，现代设计元素，街头美食文化'
    },
    {
      id: 'jm-006',
      title: '五大道·民国风情',
      subtitle: '历史建筑，欧陆风情',
      thumbnail: getPicsumUrl('wudadao-european-architecture-historic', 600, 400),
      category: 'landmark',
      tags: ['历史', '建筑', '风情'],
      likes: 1892,
      usageCount: 445,
      prompt: '天津五大道，民国建筑，欧式风格，梧桐树影，复古色调，历史感'
    },
  ];

  // 获取分类中文标签
  const getCategoryLabel = (category: string): string => {
    const labelMap: Record<string, string> = {
      'nianhua': '年画',
      'niren': '泥塑',
      'fengzheng': '风筝',
      'landmark': '地标',
      'brand': '老字号',
      'guochao': '国潮'
    };
    return labelMap[category] || '其他';
  };

  // 获取所有数据
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // 并行获取所有数据
      await Promise.all([
        fetchWorks(),
        fetchUserWorks(),
        fetchBrands(),
        fetchActivities(),
        fetchCommunities(),
        fetchRanking(),
        fetchKnowledge(),
        fetchActiveCreators(),
        fetchShopProducts()
      ]);
    } catch (err) {
      console.error('获取数据失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取作品数据 - 使用与PC端相同的API
  const fetchWorks = async () => {
    try {
      console.log('开始获取作品数据...');
      const worksData = await workService.getWorks({ limit: 20 });
      console.log('获取到作品数据:', worksData?.length || 0, '条');

      // 如果没有数据，使用模拟数据
      if (!worksData || worksData.length === 0) {
        console.log('没有获取到真实数据，使用模拟数据');
        setWorks(getMockWorks());
        return;
      }

      // 处理作品数据，添加缩略图
      const processedWorks = worksData.map((work: any) => {
        // 确保 creator 是字符串
        let creatorStr = '未知创作者';
        if (typeof work.creator === 'string') {
          creatorStr = work.creator;
        } else if (work.creator?.username) {
          creatorStr = work.creator.username;
        } else if (work.creator_name) {
          creatorStr = work.creator_name;
        } else if (work.author) {
          creatorStr = work.author;
        }

        // 确保 title 是字符串
        let titleStr = '无标题';
        if (typeof work.title === 'string') {
          titleStr = work.title;
        } else if (work.title) {
          titleStr = String(work.title);
        }

        // 处理媒体URL - 支持图片和视频
        let mediaUrl = work.thumbnail || work.cover_url || work.image_url || work.image || work.video_url;
        // 如果没有媒体URL，使用默认占位图
        if (!mediaUrl) {
          mediaUrl = 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&q=80';
        }

        // 检测是否为视频
        const isVideo = mediaUrl.match(/\.(mp4|webm|mov|avi|mkv)$/i) ||
                       work.media_type === 'video' ||
                       work.type === 'video';

        return {
          ...work,
          title: titleStr,
          thumbnail: mediaUrl,
          isVideo,
          creator: creatorStr
        };
      });
      
      console.log('处理后的作品数据:', processedWorks);
      setWorks(processedWorks);
    } catch (err) {
      console.error('获取作品失败:', err);
      setWorks(getMockWorks());
    }
  };

  // 获取用户作品数据
  const fetchUserWorks = async () => {
    try {
      // 从 localStorage 获取当前用户ID
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.log('用户未登录，不获取用户作品');
        setUserWorks([]);
        return;
      }

      const user = JSON.parse(userStr);
      if (!user?.id) {
        console.log('用户ID不存在，不获取用户作品');
        setUserWorks([]);
        return;
      }

      console.log('开始获取用户作品数据...', user.id);

      // 从 Supabase 获取用户作品
      const { data: worksData, error } = await supabase
        .from('works')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('获取用户作品失败:', error);
        setUserWorks([]);
        return;
      }

      console.log('获取到用户作品数据:', worksData?.length || 0, '条');

      // 处理作品数据
      const processedUserWorks = (worksData || []).map((work: any) => {
        let mediaUrl = work.thumbnail || work.cover_url || work.image_url || work.image;
        if (!mediaUrl) {
          mediaUrl = 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&q=80';
        }

        const isVideo = mediaUrl.match(/\.(mp4|webm|mov|avi|mkv)$/i) ||
                       work.media_type === 'video' ||
                       work.type === 'video';

        return {
          ...work,
          title: work.title || '无标题',
          thumbnail: mediaUrl,
          isVideo,
          creator: user.username || '我'
        };
      });

      setUserWorks(processedUserWorks);
    } catch (err) {
      console.error('获取用户作品失败:', err);
      setUserWorks([]);
    }
  };

  // 获取品牌数据 - 使用与PC端相同的 brand_partnerships 表
  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brand_partnerships')
        .select('*')
        .eq('status', 'approved')
        .limit(10);
      
      if (error) {
        // 如果表不存在，使用静态数据
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log('brand_partnerships 表不存在，使用静态数据');
          setBrands(getStaticBrands());
          return;
        }
        throw error;
      }
      
      console.log('获取到品牌数据:', data?.length || 0, '条');
      
      if (data && data.length > 0) {
        setBrands(data.map((b: any) => {
          // 检查 brand_logo 是否有效（不是占位图URL）
          let logo = b.brand_logo;
          if (!logo || 
              logo.includes('placeholder') || 
              logo.includes('via.placeholder') ||
              logo === '' ||
              logo === 'null' ||
              logo === 'undefined') {
            logo = getBrandIcon(b.brand_name);
          }
          
          return {
            id: b.id,
            name: b.brand_name,
            logo: logo,
            category: getBrandCategory(b.brand_name),
            description: b.description
          };
        }));
      } else {
        setBrands(getStaticBrands());
      }
    } catch (err) {
      console.log('品牌数据获取失败，使用静态数据:', err);
      setBrands(getStaticBrands());
    }
  };

  // 品牌分类映射（与PC端一致）
  const getBrandCategory = (name: string): string => {
    const categoryMap: Record<string, string> = {
      '桂发祥': '传统美食',
      '耳朵眼': '传统美食',
      '大福来': '传统美食',
      '果仁张': '传统美食',
      '煎饼果子': '传统美食',
      '茶汤李': '传统美食',
      '石头门坎素包': '传统美食',
      '孙记烧卖': '传统美食',
      '老美华': '传统服饰',
      '亨得利表行': '钟表眼镜',
      '利顺德': '酒店文旅',
      '正兴德茶庄': '茶叶文化',
      '天津海河乳品有限公司': '乳制品',
      '海河': '乳制品',
    };
    return categoryMap[name] || '老字号';
  };

  // 获取品牌图标（与PC端一致）
  const getBrandIcon = (name: string): string => {
    const iconMap: Record<string, string> = {
      '桂发祥': '🥨',
      '耳朵眼': '🍘',
      '煎饼果子': '🌯',
      '大福来': '🍜',
      '果仁张': '🌰',
      '茶汤李': '🍵',
      '老美华': '👞',
      '利顺德': '🏨',
      '亨得利表行': '⌚',
      '正兴德茶庄': '🍃',
      '石头门坎素包': '🥟',
      '孙记烧卖': '🥟',
      '天津海河乳品有限公司': '🥛',
      '海河': '🥛',
    };
    return iconMap[name] || '🏪';
  };

  // 静态品牌数据（与PC端一致）
  const getStaticBrands = (): Brand[] => [
    { id: '1', name: '桂发祥', logo: '🥨', category: '传统美食' },
    { id: '2', name: '煎饼果子', logo: '🌯', category: '传统美食' },
    { id: '3', name: '耳朵眼', logo: '🍘', category: '传统美食' },
    { id: '4', name: '老美华', logo: '👞', category: '传统服饰' },
    { id: '5', name: '果仁张', logo: '🌰', category: '传统美食' },
    { id: '6', name: '利顺德', logo: '🏨', category: '酒店文旅' },
  ];

  // 获取活动数据 - 直接从 Supabase 查询
  const fetchActivities = async () => {
    try {
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) {
        console.error('获取活动数据失败:', error);
        setActivities(getMockActivities());
        return;
      }
      
      console.log('获取到活动数据:', eventsData?.length || 0, '条', eventsData);
      
      if (!eventsData || eventsData.length === 0) {
        setActivities(getMockActivities());
        return;
      }
      
      setActivities(eventsData.map((a: any) => {
        // 处理活动封面图片 - 检查所有可能的字段
        let imageUrl = a.cover_image || a.cover_url || a.image_url || a.banner || a.image || a.thumbnail;
        
        // 如果图片URL无效或者是placeholder，使用默认图片
        if (!imageUrl || 
            imageUrl.includes('placeholder') || 
            typeof imageUrl !== 'string') {
          imageUrl = 'https://images.unsplash.com/photo-1576085898323-218337e3e43c?w=400&q=80';
        }
        
        // 处理状态显示
        let statusText = a.status || '进行中';
        
        // 转换状态为中文
        const statusMap: Record<string, string> = {
          'completed': '已完成',
          'ongoing': '进行中',
          'upcoming': '即将开始',
          'rejected': '已拒绝',
          'pending': '待审核',
          'draft': '草稿',
          'approved': '已审核',
          'published': '已发布'
        };
        
        if (statusMap[statusText.toLowerCase()]) {
          statusText = statusMap[statusText.toLowerCase()];
        }
        
        return {
          id: a.id,
          title: a.title || a.name || '未命名活动',
          image: imageUrl,
          status: statusText,
          tag: a.tag || statusText,
          participants: a.participants_count || a.participant_count || a.registration_count || 0
        };
      }));
    } catch (err) {
      console.log('活动数据获取失败，使用模拟数据:', err);
      setActivities(getMockActivities());
    }
  };

  // 获取社群数据 - 使用 API 服务
  const fetchCommunities = async () => {
    try {
      const communitiesData = await communityService.getCommunities();
      console.log('获取到社群数据:', communitiesData?.length || 0, '条');
      setCommunities(communitiesData?.map((c: any) => ({ 
        ...c, 
        members: c.member_count || c.members || c.memberCount || 0,
        image: c.cover_image || c.cover_url || c.image || c.avatar,
        tags: c.tags || []
      })) || getMockCommunities());
    } catch (err) {
      console.log('社群数据获取失败，使用模拟数据:', err);
      setCommunities(getMockCommunities());
    }
  };

  // 获取排名数据 - 从 users 表获取真实数据
  const fetchRanking = async () => {
    try {
      // 使用 supabaseAdmin 绕过 RLS 限制获取用户列表，按 likes_count 排序
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, username, avatar_url')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!data || data.length === 0) {
        console.log('没有获取到用户数据，使用模拟数据');
        setRanking(getMockRanking());
        return;
      }

      // 格式化排名数据
      const rankingData = data.map((user, index) => ({
        rank: index + 1,
        name: user.username || '用户' + (index + 1),
        score: user.likes_count || 0,
        avatar: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id || index}`,
        trend: 'same' as const // 简化处理，默认显示持平
      }));

      setRanking(rankingData);
    } catch (err) {
      console.log('排名数据获取失败，使用模拟数据:', err);
      setRanking(getMockRanking());
    }
  };

  // 获取知识库数据 - 使用与 CulturalKnowledge 页面相同的真实数据
  const fetchKnowledge = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        // 如果表不存在或出错，使用静态数据
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log('knowledge_articles 表不存在，使用静态数据');
          setKnowledge(getHeritageKnowledge());
          return;
        }
        throw error;
      }

      if (data && data.length > 0) {
        setKnowledge(data.map((k: any) => ({
          id: k.id,
          title: k.title,
          category: k.category || '文化知识',
          readTime: k.read_time || k.readTime || '5分钟',
          image: k.cover_image || k.cover_url || k.image || getKnowledgeImage(k.category)
        })));
      } else {
        setKnowledge(getHeritageKnowledge());
      }
    } catch (err) {
      console.log('知识库数据获取失败，使用静态数据:', err);
      setKnowledge(getHeritageKnowledge());
    }
  };

  // 获取活跃创作者数据
  const fetchActiveCreators = async () => {
    try {
      // 使用 supabaseAdmin 绕过 RLS 限制获取活跃用户
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, username, avatar_url, likes_count')
        .order('likes_count', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!data || data.length === 0) {
        setActiveCreators(getMockActiveCreators());
        return;
      }

      // 格式化活跃创作者数据
      const creatorsData = data.map((user) => ({
        id: user.id,
        username: user.username || '未知用户',
        avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        likes_count: user.likes_count || 0,
        isOnline: Math.random() > 0.5 // 随机显示在线状态
      }));

      setActiveCreators(creatorsData);
    } catch (err) {
      console.log('活跃创作者数据获取失败，使用模拟数据:', err);
      setActiveCreators(getMockActiveCreators());
    }
  };

  // 模拟活跃创作者数据
  const getMockActiveCreators = (): ActiveCreator[] => [
    { id: '1', username: '创意达人小王', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', likes_count: 9850, isOnline: true },
    { id: '2', username: '艺术家张华', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', likes_count: 8720, isOnline: false },
    { id: '3', username: '摄影师李明', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', likes_count: 7650, isOnline: true },
    { id: '4', username: '插画师小美', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4', likes_count: 6540, isOnline: false },
    { id: '5', username: '设计师阿杰', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5', likes_count: 5430, isOnline: true },
  ];

  // 获取积分商城商品数据
  const fetchShopProducts = async () => {
    try {
      // 这里可以从 Supabase 获取真实的积分商城商品数据
      // 暂时使用模拟数据
      setShopProducts(getMockShopProducts());
    } catch (err) {
      console.log('积分商城数据获取失败，使用模拟数据:', err);
      setShopProducts(getMockShopProducts());
    }
  };

  // 模拟积分商城商品数据
  const getMockShopProducts = (): ShopProduct[] => [
    { id: '1', name: '津脉文创T恤', points: 500, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80', category: '文创', stock: 100 },
    { id: '2', name: '非遗手工艺品', points: 800, image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&q=80', category: '非遗', stock: 50 },
    { id: '3', name: '设计师马克杯', points: 300, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80', category: '周边', stock: 200 },
    { id: '4', name: '创意笔记本', points: 200, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80', category: '文具', stock: 150 },
    { id: '5', name: '艺术帆布包', points: 400, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80', category: '文创', stock: 80 },
    { id: '6', name: '定制徽章套装', points: 150, image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&q=80', category: '周边', stock: 300 },
  ];

  // 根据分类获取默认图片
  const getKnowledgeImage = (category: string): string => {
    const imageMap: Record<string, string> = {
      '非遗传承': 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&q=80',
      '民间艺术': 'https://images.unsplash.com/photo-1512413914633-b5043f4041ea?w=400&q=80',
      '传统工艺': 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&q=80',
      '传统美食': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
      '城市文化': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80',
    };
    return imageMap[category] || 'https://images.unsplash.com/photo-1512413914633-b5043f4041ea?w=400&q=80';
  };

  // 文化知识静态数据（与 CulturalKnowledge 页面一致）
  const getHeritageKnowledge = (): Knowledge[] => [
    {
      id: 'story-001',
      title: '泥人张彩塑：指尖上的天津文化',
      category: '非遗传承',
      readTime: '8分钟',
      image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&q=80'
    },
    {
      id: 'story-002',
      title: '杨柳青年画：年画中的天津故事',
      category: '民间艺术',
      readTime: '5分钟',
      image: 'https://images.unsplash.com/photo-1512413914633-b5043f4041ea?w=400&q=80'
    },
    {
      id: 'story-003',
      title: '天津风筝魏：放飞的艺术',
      category: '传统工艺',
      readTime: '6分钟',
      image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&q=80'
    },
    {
      id: 'story-004',
      title: '果仁张：天津的美味传说',
      category: '传统美食',
      readTime: '4分钟',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80'
    },
    {
      id: 'story-005',
      title: '天津方言的文化魅力',
      category: '城市文化',
      readTime: '3分钟',
      image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80'
    },
    {
      id: 'story-006',
      title: '煎饼果子的城市记忆',
      category: '传统美食',
      readTime: '5分钟',
      image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80'
    },
  ];

  // 模拟数据
  const getMockWorks = (): Work[] => [
    { id: '1', title: '杨柳青年画新演绎', thumbnail: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&q=80', creator: '创意达人小王', likes: 2341 },
    { id: '2', title: '天津之眼夜景', thumbnail: 'https://images.unsplash.com/photo-1513415564515-763d91423bdd?w=400&q=80', creator: '摄影师李明', likes: 1856 },
    { id: '3', title: '泥人张现代风格', thumbnail: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&q=80', creator: '艺术家张华', likes: 3201 },
    { id: '4', title: '海河风光插画', thumbnail: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=80', creator: '插画师小美', likes: 1567 },
    { id: '5', title: '煎饼果子品牌视觉', thumbnail: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&q=80', creator: '设计师阿杰', likes: 2890 },
    { id: '6', title: '天津方言文创', thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&q=80', creator: '文创达人', likes: 1234 },
  ];

  const getMockBrands = (): Brand[] => [
    { id: '1', name: '煎饼果子', logo: '🌯', category: '老字号' },
    { id: '2', name: '耳朵眼', logo: '🍘', category: '传统美食' },
    { id: '3', name: '十八街麻花', logo: '🥨', category: '传统美食' },
    { id: '4', name: '杨柳青年画', logo: '🖼️', category: '非遗文化' },
    { id: '5', name: '泥人张', logo: '🎭', category: '非遗文化' },
    { id: '6', name: '桂发祥', logo: '🥮', category: '传统美食' },
  ];

  const getMockActivities = (): Activity[] => [
    { id: '1', title: '津门老字号设计赛', status: '进行中', participants: 1234, image: 'https://images.unsplash.com/photo-1576085898323-218337e3e43c?w=400&q=80', tag: 'HOT' },
    { id: '2', title: '非遗数字藏品展', status: '报名中', participants: 856, image: 'https://images.unsplash.com/photo-1550948537-130a1ce83314?w=400&q=80', tag: 'NEW' },
    { id: '3', title: '商业品牌联名挑战', status: '即将开始', participants: 567, image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&q=80', tag: '预告' },
  ];

  const getMockCommunities = (): Community[] => [
    { id: '1', name: '国潮设计社群', members: 1286, tags: ['国潮', '设计'], image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&q=80' },
    { id: '2', name: 'AI艺术生成', members: 1542, tags: ['AI', '艺术'], image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80' },
    { id: '3', name: '非遗数字化', members: 892, tags: ['非遗', '数字'], image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&q=80' },
    { id: '4', name: '高校社团联名', members: 1014, tags: ['高校', '联名'], image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80' },
  ];

  const getMockRanking = (): Ranking[] => [
    { rank: 1, name: '创意达人小王', score: 9850, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rank1', trend: 'up' },
    { rank: 2, name: '艺术家张华', score: 8720, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rank2', trend: 'same' },
    { rank: 3, name: '摄影师李明', score: 7650, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rank3', trend: 'up' },
    { rank: 4, name: '插画师小美', score: 6540, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rank4', trend: 'down' },
    { rank: 5, name: '设计师阿杰', score: 5430, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rank5', trend: 'up' },
  ];

  // 获取排名颜色
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-amber-500';
    if (rank === 2) return 'from-gray-300 to-gray-400';
    if (rank === 3) return 'from-orange-400 to-amber-600';
    return 'from-gray-200 to-gray-300';
  };

  // 模块卡片组件
  const SectionCard = ({ 
    title, 
    subtitle,
    onClick, 
    children 
  }: { 
    title: string; 
    subtitle?: string; 
    onClick?: () => void;
    children: React.ReactNode;
  }) => (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          {subtitle && <p className="text-xs text-gray-500 mb-0.5">{subtitle}</p>}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <button 
          onClick={onClick}
          className="text-gray-400 hover:text-gray-600 mt-1"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      {children}
    </motion.section>
  );

  return (
    <div className={`min-h-screen pb-4 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* 移动端搜索页面 */}
      <MobileSearchPage isOpen={showSearchPage} onClose={() => setShowSearchPage(false)} />

      {/* 顶部搜索框 - 放在 Banner 外面，避免被 -mt 影响 */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pb-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-md mx-auto pointer-events-auto"
        >
          <div 
            onClick={() => setShowSearchPage(true)}
            className={`flex items-center gap-3 px-4 py-3 rounded-full cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
              isDark 
                ? 'bg-white/95 text-gray-700 shadow-lg' 
                : 'bg-white/95 text-gray-700 shadow-lg'
            }`}
          >
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-400 text-base">搜索</span>
          </div>
        </motion.div>
      </div>

      {/* 顶部 Banner - 使用独立的 BannerCarousel 组件，避免影响页面其他部分重新渲染 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-[42rem] w-full overflow-hidden -mt-20"
      >
        <BannerCarousel works={works} isDark={isDark} />
      </motion.div>

      {/* 主内容区域 */}
      <div className="px-3 pt-4 pb-0 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* 1. 为你推荐 */}
            <SectionCard
              title="为你推荐"
              subtitle="精选灵感"
              onClick={() => navigate('/square')}
            >
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                {(works || []).slice(0, 8).map((work) => (
                  <motion.div
                    key={work.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/post/${work.id}`)}
                    className="flex-shrink-0 w-28 cursor-pointer"
                  >
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
                      {work.isVideo ? (
                        <video
                          src={work.thumbnail}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          autoPlay
                          loop
                          preload="auto"
                        />
                      ) : (
                        <img
                          src={work.thumbnail}
                          alt={work.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&q=80';
                          }}
                        />
                      )}
                      {work.isVideo && (
                        <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 5.84a.75.75 0 00-1.06 1.06l4.78 4.78-4.78 4.78a.75.75 0 101.06 1.06l5.25-5.25a.75.75 0 000-1.06L6.3 5.84z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                        <p className="text-[10px] text-white truncate">{work.title}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </SectionCard>

            {/* 2. 津脉广场 */}
            <SectionCard
              title="津脉广场"
              subtitle="最新创作"
              onClick={() => navigate('/square')}
            >
              <div className="grid grid-cols-3 gap-2">
                {(works || []).slice(0, 6).map((work, index) => (
                  <motion.div
                    key={work.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/post/${work.id}`)}
                    className={`cursor-pointer ${index === 0 ? 'col-span-2 row-span-2' : ''}`}
                  >
                    <div className={`relative rounded-xl overflow-hidden bg-gray-100 ${index === 0 ? 'aspect-square' : 'aspect-square'}`}>
                      {work.isVideo ? (
                        <video
                          src={work.thumbnail}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          autoPlay
                          loop
                          preload="auto"
                        />
                      ) : (
                        <img
                          src={work.thumbnail}
                          alt={work.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&q=80';
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      {work.isVideo && (
                        <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 5.84a.75.75 0 00-1.06 1.06l4.78 4.78-4.78 4.78a.75.75 0 101.06 1.06l5.25-5.25a.75.75 0 000-1.06L6.3 5.84z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-[10px] text-white font-medium truncate">{work.title}</p>
                        <p className="text-[8px] text-white/70 truncate">{work.creator}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </SectionCard>

            {/* 3. 津脉作品 - 使用津脉广场瀑布流样式 */}
            <SectionCard
              title="津脉作品"
              subtitle="精选模板"
              onClick={() => navigate('/tianjin')}
            >
              {/* 双列瀑布流布局 */}
              <div className="flex gap-3">
                {/* 左列 */}
                <div className="flex-1 flex flex-col gap-3">
                  {jinMaiTemplates.filter((_, i) => i % 2 === 0).map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        toast.success(`已选择「${template.title}」模板，跳转至AI助手...`);
                        // 保存到 sessionStorage（防止页面刷新后丢失）
                        sessionStorage.setItem('templatePrompt', template.prompt);
                        sessionStorage.setItem('templateName', template.title);
                        // 跳转到AI助手页面，并传递模板提示词
                        navigate('/ai-assistant', {
                          state: {
                            prompt: template.prompt,
                            templateId: template.id,
                            templateName: template.title,
                            templateCategory: getCategoryLabel(template.category)
                          }
                        });
                      }}
                      className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                    >
                      {/* 图片容器 - 使用3:4宽高比 */}
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <img
                          src={template.thumbnail}
                          alt={template.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&q=80';
                          }}
                        />
                        {/* 渐变遮罩 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        
                        {/* 分类标签 */}
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 text-[10px] font-medium bg-gradient-to-r from-[#C02C38] to-[#D64545] text-white rounded-full shadow-lg">
                            {getCategoryLabel(template.category)}
                          </span>
                        </div>
                        
                        {/* 底部信息 */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h4 className="text-white font-bold text-sm mb-1 line-clamp-1">
                            {template.title}
                          </h4>
                          <p className="text-white/80 text-xs line-clamp-1 mb-2">
                            {template.subtitle}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-white/70">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                              {template.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                              {template.usageCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* 右列 */}
                <div className="flex-1 flex flex-col gap-3">
                  {jinMaiTemplates.filter((_, i) => i % 2 === 1).map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        toast.success(`已选择「${template.title}」模板，跳转至AI助手...`);
                        // 保存到 sessionStorage（防止页面刷新后丢失）
                        sessionStorage.setItem('templatePrompt', template.prompt);
                        sessionStorage.setItem('templateName', template.title);
                        // 跳转到AI助手页面，并传递模板提示词
                        navigate('/ai-assistant', {
                          state: {
                            prompt: template.prompt,
                            templateId: template.id,
                            templateName: template.title,
                            templateCategory: getCategoryLabel(template.category)
                          }
                        });
                      }}
                      className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                    >
                      {/* 图片容器 - 使用3:4宽高比 */}
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <img
                          src={template.thumbnail}
                          alt={template.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&q=80';
                          }}
                        />
                        {/* 渐变遮罩 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        
                        {/* 分类标签 */}
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 text-[10px] font-medium bg-gradient-to-r from-[#C02C38] to-[#D64545] text-white rounded-full shadow-lg">
                            {getCategoryLabel(template.category)}
                          </span>
                        </div>
                        
                        {/* 底部信息 */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h4 className="text-white font-bold text-sm mb-1 line-clamp-1">
                            {template.title}
                          </h4>
                          <p className="text-white/80 text-xs line-clamp-1 mb-2">
                            {template.subtitle}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-white/70">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                              {template.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                              {template.usageCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* 4. 已入驻的品牌方 */}
            <SectionCard
              title="已入驻的品牌方"
              subtitle="合作伙伴"
              onClick={() => navigate('/brands')}
            >
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                {(brands || []).map((brand) => (
                  <motion.div
                    key={brand.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/brands/${brand.id}`)}
                    className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl min-w-[72px] cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center text-xl overflow-hidden">
                      {typeof brand.logo === 'string' && brand.logo.startsWith('http') && !brand.logo.includes('placeholder') ? (
                        <img 
                          src={brand.logo} 
                          alt={brand.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) parent.innerText = getBrandIcon(brand.name);
                          }}
                        />
                      ) : (
                        brand.logo || getBrandIcon(brand.name)
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">{brand.name}</span>
                    <span className="text-[8px] text-gray-400">{brand.category}</span>
                  </motion.div>
                ))}
              </div>
            </SectionCard>

            {/* 4. 津脉活动 */}
            <SectionCard
              title="津脉活动"
              subtitle="精彩活动"
              onClick={() => navigate('/events')}
            >
              <div className="space-y-2">
                {(activities || []).slice(0, 3).map((activity) => (
                  <motion.div
                    key={activity.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/events/${activity.id}`)}
                    className="flex gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer"
                  >
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={activity.image || 'https://images.unsplash.com/photo-1576085898323-218337e3e43c?w=400&q=80'} 
                        alt={activity.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576085898323-218337e3e43c?w=400&q=80';
                        }}
                      />
                      <div className="absolute top-1 left-1 bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded">
                        {activity.tag}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">{activity.title}</h4>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          activity.status === '进行中' ? 'bg-green-100 text-green-600' :
                          activity.status === '报名中' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {activity.status}
                        </span>
                        <span className="text-[10px] text-gray-400">{activity.participants}人参与</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </SectionCard>

            {/* 5. 津脉社群 */}
            <SectionCard
              title="津脉社群"
              subtitle="加入讨论"
              onClick={() => navigate('/community')}
            >
              <div className="grid grid-cols-2 gap-2">
                {(communities || []).slice(0, 4).map((community) => (
                  <motion.div
                    key={community.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/community/${community.id}`)}
                    className="relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer"
                  >
                    <img 
                      src={community.image || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80'} 
                      alt={community.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                      <span className="text-white text-[8px]">{community.members}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <h4 className="text-white font-medium text-xs">{community.name}</h4>
                      <div className="flex gap-1 mt-0.5">
                        {(community.tags || []).slice(0, 2).map(tag => (
                          <span key={tag} className="text-[8px] text-white/80 bg-white/20 px-1 rounded">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </SectionCard>

            {/* 6. 趣味游戏 */}
            <SectionCard
              title="趣味游戏"
              subtitle="边玩边学"
              onClick={() => navigate('/games')}
            >
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: '文化猜谜', icon: '🎯', desc: '猜天津文化', image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&q=80' },
                  { name: '创意拼图', icon: '🧩', desc: '拼图挑战', image: 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=400&q=80' },
                  { name: '知识问答', icon: '❓', desc: '文化知识', image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80' }
                ].map((game) => (
                  <motion.button
                    key={game.name}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/games')}
                    className="relative rounded-xl overflow-hidden aspect-[3/4] text-white"
                  >
                    {/* 背景图片 */}
                    <img
                      src={game.image}
                      alt={game.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* 渐变遮罩 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    {/* 内容 */}
                    <div className="relative z-10 flex flex-col items-center justify-end h-full p-3">
                      <div className="text-2xl mb-1">{game.icon}</div>
                      <div className="text-xs font-medium">{game.name}</div>
                      <div className="text-[8px] text-white/80">{game.desc}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </SectionCard>

            {/* 7. 文化知识库 */}
            <SectionCard
              title="文化知识库"
              subtitle="学习天津"
              onClick={() => navigate('/knowledge')}
            >
              <div className="space-y-2">
                {(knowledge || []).slice(0, 3).map((item) => (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/knowledge/${item.id}`)}
                    className="flex gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image || 'https://images.unsplash.com/photo-1512413914633-b5043f4041ea?w=400&q=80'} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1512413914633-b5043f4041ea?w=400&q=80';
                        }}
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <span className="text-[8px] text-indigo-500 font-medium">{item.category}</span>
                      <h4 className="font-medium text-gray-900 dark:text-white text-xs line-clamp-2">{item.title}</h4>
                      <span className="text-[8px] text-gray-400 mt-1">阅读时间 {item.readTime}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </SectionCard>

            {/* 8. 活跃创作者 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-blue-500 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">活跃创作者</h3>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                {(activeCreators || []).slice(0, 8).map((creator) => (
                  <motion.div
                    key={creator.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/author/${creator.id}`)}
                    className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <div className="relative">
                      <img
                        src={creator.avatar_url}
                        alt={creator.username}
                        className="w-14 h-14 rounded-full border-2 border-blue-500 object-cover"
                      />
                      {creator.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                      )}
                    </div>
                    <span className="text-xs text-gray-900 dark:text-white truncate max-w-[60px]">{creator.username}</span>
                    <div className="flex items-center gap-0.5 text-[10px] text-gray-400">
                      <span>❤️</span>
                      <span>{creator.likes_count > 1000 ? (creator.likes_count / 1000).toFixed(1) + 'k' : creator.likes_count}</span>
                    </div>
                  </motion.div>
                ))}
                {/* 加入社区按钮 */}
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/community')}
                  className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                    <span className="text-xl text-gray-400">+</span>
                  </div>
                  <span className="text-xs text-gray-500">加入社区</span>
                </motion.div>
              </div>
            </motion.section>

            {/* 9. 人气榜 */}
            <SectionCard
              title="人气榜"
              subtitle="创作者排行"
              onClick={() => navigate('/leaderboard')}
            >
              <div className="space-y-1">
                {(ranking || []).slice(0, 3).map((user) => (
                  <motion.div
                    key={user.rank}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer"
                    onClick={() => navigate(`/user/${user.name}`)}
                  >
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${getRankColor(user.rank)} flex items-center justify-center text-white font-bold text-xs`}>
                      {user.rank}
                    </div>
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white text-xs truncate">{user.name}</h4>
                      <p className="text-[10px] text-gray-400">{user.score} 人气值</p>
                    </div>
                    {user.trend === 'up' && <span className="text-green-500 text-xs">↑</span>}
                    {user.trend === 'down' && <span className="text-red-500 text-xs">↓</span>}
                    {user.trend === 'same' && <span className="text-gray-400 text-xs">-</span>}
                  </motion.div>
                ))}
              </div>
            </SectionCard>

            {/* 10. 积分商城 */}
            <SectionCard
              title="积分商城"
              subtitle="兑换好礼"
              onClick={() => navigate('/shop')}
            >
              <div className="grid grid-cols-3 gap-2">
                {(shopProducts || []).slice(0, 6).map((product, index) => (
                  <motion.div
                    key={product.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/shop/product/${product.id}`)}
                    className={`cursor-pointer ${index === 0 ? 'col-span-2 row-span-2' : ''}`}
                  >
                    <div className={`relative rounded-xl overflow-hidden bg-gray-100 ${index === 0 ? 'aspect-square' : 'aspect-square'}`}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      {/* 积分标签 */}
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                        {product.points} 积分
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-[10px] text-white font-medium truncate">{product.name}</p>
                        <p className="text-[8px] text-white/70 truncate">{product.category}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </SectionCard>

            {/* 底部提示 */}
            <div className="text-center pt-1 pb-0 text-xs text-gray-400">
              <p>已经到底了</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
