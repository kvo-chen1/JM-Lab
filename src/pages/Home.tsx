import { useState, useRef, useEffect, lazy, Suspense, useMemo, useCallback, useContext } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { TianjinImage, TianjinButton, TianjinTag, TianjinAvatar } from '@/components/TianjinStyleComponents';
import { llmService } from '@/services/llmService'
import voiceService from '@/services/voiceService'
import { workService, userService } from '@/services/apiService'
import { useTranslation } from 'react-i18next'
import PromptInput from '@/components/PromptInput'
import eventBus from '@/lib/eventBus' // 导入事件总线
import {
  ANIMATION_VARIANTS,
  INTERACTION_VARIANTS,
  SCROLL_TRIGGER_CONFIG,
  getResponsiveDuration,
  getResponsiveDelay
} from '@/config/animationConfig'

// 响应式动画速度控制
const useResponsiveAnimation = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 根据设备类型返回动画持续时间
  const getDuration = (defaultDuration: number) => {
    return getResponsiveDuration(defaultDuration, isMobile, isTablet);
  };

  // 根据设备类型返回动画延迟时间
  const getDelay = (defaultDelay: number) => {
    return getResponsiveDelay(defaultDelay, isMobile, isTablet);
  };

  return { isMobile, isTablet, getDuration, getDelay };
};

export default function Home() {
  const { isDark } = useTheme();
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // 已移除自动跳转逻辑，让已登录用户也能访问首页
  
  const { t } = useTranslation();
  const { scrollY } = useScroll();
  const { getDuration, getDelay } = useResponsiveAnimation();
  
  // Parallax effects
  const heroY = useTransform(scrollY, [0, 500], [0, 200]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  
  // 响应式状态
  const [isMounted, setIsMounted] = useState(false);
  
  // 数据加载状态
  const [works, setWorks] = useState<any[]>([]);
  const [popularCreators, setPopularCreators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    setIsMounted(true);
    
    // 添加事件监听器
    const loginListener = eventBus.subscribe('auth:login', (data) => {
      console.log('Home page received login event:', data);
      const username = data?.user?.username || '用户';
      toast.success(`欢迎回来，${username}!`);
    });
    
    const logoutListener = eventBus.subscribe('auth:logout', () => {
      console.log('Home page received logout event');
      toast.info('您已成功登出');
    });
    
    const workCreatedListener = eventBus.subscribe('作品:创建', (data) => {
      console.log('Home page received work created event:', data);
      toast.success('作品创建成功！');
    });
    
    const workPublishedListener = eventBus.subscribe('作品:发布', (data) => {
      console.log('Home page received work published event:', data);
      toast.success('作品发布成功！');
    });
    
    const dataRefreshListener = eventBus.subscribe('数据:刷新', (data) => {
      console.log('Home page received data refresh event:', data);
      // 只处理特定类型的数据刷新事件，避免无限循环
      if (data.type === 'work:created' || data.type === 'work:updated' || data.type === 'work:deleted') {
        fetchData();
      }
    });
    
    // 清理事件监听器
    return () => {
      eventBus.unsubscribe('auth:login', loginListener);
      eventBus.unsubscribe('auth:logout', logoutListener);
      eventBus.unsubscribe('作品:创建', workCreatedListener);
      eventBus.unsubscribe('作品:发布', workPublishedListener);
      eventBus.unsubscribe('数据:刷新', dataRefreshListener);
    };
  }, []);
  
  // 获取数据 - 优化版，添加缓存机制
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 尝试从缓存获取数据
      const cachedData = localStorage.getItem('homePageData');
      const cacheTimestamp = localStorage.getItem('homePageDataTimestamp');
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存
      
      if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < CACHE_DURATION) {
        // 使用缓存数据
        const { works: cachedWorks, creators: cachedCreators } = JSON.parse(cachedData);
        // 确保数据是数组格式
        setWorks(Array.isArray(cachedWorks) ? cachedWorks : []);
        setPopularCreators(Array.isArray(cachedCreators) ? cachedCreators : []);
        setIsLoading(false);
        return;
      }
      
      // 缓存过期或不存在，从API获取
      const worksData = await workService.getWorks({ limit: 20 });
      // 确保worksData是数组
      setWorks(Array.isArray(worksData) ? worksData : []);
      
      // 生成热门创作者数据
      const creatorsMap = new Map();
      // 确保worksData是数组后再进行操作
      if (Array.isArray(worksData)) {
        worksData.forEach(work => {
          if (work.creator) {
            if (!creatorsMap.has(work.creator)) {
              creatorsMap.set(work.creator, {
                name: work.creator,
                avatar: work.creatorAvatar || '',
                likes: 0
              });
            }
            const creator = creatorsMap.get(work.creator);
            creator.likes += work.likes || 0;
          }
        });
      }
      
      const creatorsArray = Array.from(creatorsMap.values())
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 5);
      setPopularCreators(creatorsArray);
      
      // 缓存数据
      const dataToCache = {
        works: worksData,
        creators: creatorsArray
      };
      localStorage.setItem('homePageData', JSON.stringify(dataToCache));
      localStorage.setItem('homePageDataTimestamp', now.toString());
    } catch (err) {
      console.error('获取数据失败:', err);
      setError('获取数据失败，请稍后重试');
      toast.error('获取数据失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 初始加载数据
  useEffect(() => {
    fetchData();
  }, []);

  // 数据Memo
  const gallery = useMemo(() => works.slice(0, 12), [works]);
  
  // 优化动画性能的自定义Hook
  const useOptimizedAnimation = () => {
    const { isMobile } = useResponsiveAnimation();
    
    // 为移动设备提供更轻量的动画配置
    const getAnimationConfig = (baseConfig: any) => {
      if (isMobile) {
        return {
          ...baseConfig,
          duration: baseConfig.duration * 0.7,
          delay: baseConfig.delay * 0.5,
          // 简化动画类型以提高性能
          type: 'tween'
        };
      }
      return baseConfig;
    };
    
    return { getAnimationConfig };
  };

  // Section Component
  const Section = ({ title, children, className = '' }: { title: string, children: React.ReactNode, className?: string }) => (
    <div className={`max-w-7xl mx-auto px-4 md:px-6 mb-24 ${className}`}>
      <div className="flex items-center justify-between mb-10">
        <h2 className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} tracking-tight`}>
          {title}
        </h2>
        <div className="h-px flex-grow mx-6 bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-700"></div>
      </div>
      {children}
    </div>
  );

  // Hero Image Loading State
  const [heroLoaded, setHeroLoaded] = useState(false);

  return (
    <div className={`relative min-h-screen w-full overflow-hidden ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      
      {/* Hero Section - Immersive Background */}
      <div className="relative h-[85vh] w-full flex flex-col justify-center items-center overflow-hidden bg-gray-900">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 z-0 animate-gradient-shift"></div>
        
        {/* Background Image with Parallax */}
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent z-10"></div>
          <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-gray-950' : 'from-white'} to-transparent z-10 h-32 bottom-0`}></div>
          
          <img 
            src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&q=80" 
            alt="Tianjin Skyline" 
            className={`w-full h-full object-cover transition-opacity duration-1000 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setHeroLoaded(true)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Prevent infinite loop
              target.src = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&q=80'; 
            }}
          />
          
          {/* Simplified Background Effect - Performance Optimized */}
        <div className="absolute inset-0 z-5 bg-gradient-to-b from-white/5 via-transparent to-transparent"></div>
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-5xl w-full px-4 text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 drop-shadow-2xl tracking-tight">
            <span className="block">{t('common.welcome')}</span>
            <span className="block mt-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              释放创意潜能
            </span>
          </h1>
          <p className="text-lg md:text-2xl text-white/90 mb-12 font-light tracking-wide max-w-2xl mx-auto">
            {t('home.exploreTianjinCulture')}
          </p>

          {/* Hero Stats */}
          <div className="flex flex-wrap justify-center gap-10 mt-16 text-white/80">
            <div className="flex flex-col items-center p-4 rounded-xl hover:bg-white/10 transition-all">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                1000+
              </div>
              <span className="text-sm text-white/70">创作作品</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-xl hover:bg-white/10 transition-all">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                500+
              </div>
              <span className="text-sm text-white/70">活跃创作者</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-xl hover:bg-white/10 transition-all">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                50+
              </div>
              <span className="text-sm text-white/70">文化活动</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Overlapping the Hero */}
      <div className="relative z-30 -mt-20 pb-20">
        
        {/* 1. 创作中心 (Creative Hub) - Highlighted Cards */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: getDuration(0.42) }}
            className="text-center mb-12"
          >
            <h2 className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 mt-24`}>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                创作中心
              </span>
            </h2>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
              探索我们的核心创作工具，释放你的创意潜能
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: '创作工具', desc: 'AI辅助文案与图像生成', icon: 'tools', path: '/create', img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80' },
              { title: '灵感引擎', desc: '基于文化大数据的创意推荐', icon: 'bolt', path: '/neo', img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80' },
              { title: '共创向导', desc: '新手友好的全流程引导', icon: 'hat-wizard', path: '/wizard', img: 'https://images.unsplash.com/photo-1596496050827-8299e0220de1?w=800&q=80' }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: getDuration(0.42), delay: idx * 0.05, type: 'spring', stiffness: 140 }}
                whileHover={{ y: -15, scale: 1.03, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', transition: { duration: 0.15 } }}
                className={`relative h-96 rounded-3xl overflow-hidden cursor-pointer group shadow-2xl ${isDark ? 'bg-gray-900' : 'bg-white'}`}
                onClick={() => navigate(item.path)}
              >
                <motion.div
                  initial={{ scale: 1.1 }}
                  whileHover={{ scale: 1.2, rotate: 2 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0"
                >
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-gray-900 via-gray-900/60' : 'from-white via-white/60'} to-transparent opacity-90`}></div>
                </motion.div>
                
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`w-16 h-16 rounded-2xl ${isDark ? 'bg-white/10' : 'bg-black/5'} backdrop-blur-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <i className={`fas fa-${item.icon} text-2xl ${isDark ? 'text-white' : 'text-gray-800'}`}></i>
                  </motion.div>
                  <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 2. 热门作品 (Popular Works) - Masonry Grid */}
        <Section title="热门作品">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {gallery.map((item, idx) => (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: getDuration(0.4), delay: idx * 0.05 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`relative group cursor-pointer overflow-hidden rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg hover:shadow-2xl transition-all duration-300 ${idx % 3 === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                onClick={() => navigate(`/explore?q=${encodeURIComponent(item.title)}`)}
              >
                <div className={`relative ${idx % 3 === 0 ? 'aspect-square' : 'aspect-[4/5]'} overflow-hidden`}>
                  <TianjinImage 
                    src={item.thumbnail} 
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h4 className="text-white font-semibold truncate">{item.title}</h4>
                      <div className="flex items-center gap-3 mt-2 text-white/80 text-sm">
                        <span className="flex items-center gap-1"><i className="fas fa-heart"></i> {item.likes}</span>
                        <span className="flex items-center gap-1"><i className="fas fa-eye"></i> {item.views}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <TianjinButton 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/explore')}
              className="group"
            >
              查看更多作品
              <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
            </TianjinButton>
          </div>
        </Section>

        {/* 3. 热门创作者 (Popular Creators) - Horizontal Scroll */}
        <Section title="热门创作者">
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {popularCreators.map((creator, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: getDuration(0.4), delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className={`flex-shrink-0 w-64 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition-all cursor-pointer snap-start`}
                onClick={() => navigate(`/profile/${creator.name}`)}
              >
                <div className="flex items-center gap-4">
                  <TianjinAvatar src={creator.avatar} alt={creator.name} size="lg" />
                  <div>
                    <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{creator.name}</h4>
                    <p className="text-sm text-gray-500">{creator.likes} 获赞</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* 4. 文化活动 (Cultural Activities) - Timeline Style */}
        <Section title="文化活动">
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
            {[
              { title: '杨柳青年画工作坊', date: '2024-02-15', desc: '体验传统年画制作工艺', icon: 'paint-brush' },
              { title: '泥人张技艺传承', date: '2024-02-20', desc: '学习传统彩塑技法', icon: 'hands' },
              { title: '天津民俗文化展', date: '2024-03-01', desc: '探索津门文化魅力', icon: 'landmark' },
            ].map((event, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: getDuration(0.4), delay: idx * 0.1 }}
                className={`relative flex items-center gap-8 mb-8 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >
                <div className={`flex-1 ${idx % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                  <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg inline-block`}>
                    <span className="text-blue-500 font-semibold">{event.date}</span>
                    <h4 className={`text-xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{event.title}</h4>
                    <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{event.desc}</p>
                  </div>
                </div>
                <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg z-10">
                  <i className={`fas fa-${event.icon}`}></i>
                </div>
                <div className="flex-1 hidden md:block"></div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* 5. 特色功能 (Features) - Bento Grid */}
        <Section title="特色功能">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'AI 智能创作', desc: '基于深度学习的创意生成', icon: 'robot', color: 'from-blue-500 to-cyan-500' },
              { title: '文化知识库', desc: '丰富的天津文化资料', icon: 'book', color: 'from-purple-500 to-pink-500' },
              { title: '社区互动', desc: '与创作者交流分享', icon: 'users', color: 'from-orange-500 to-red-500' },
              { title: '作品展示', desc: '展示你的创意作品', icon: 'image', color: 'from-green-500 to-emerald-500' },
              { title: '活动参与', desc: '参加各类文化活动', icon: 'calendar', color: 'from-yellow-500 to-amber-500' },
              { title: '积分奖励', desc: '创作获得积分奖励', icon: 'gift', color: 'from-indigo-500 to-violet-500' },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: getDuration(0.4), delay: idx * 0.05 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition-all cursor-pointer group`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  <i className={`fas fa-${feature.icon} text-xl`}></i>
                </div>
                <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h4>
                <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* CTA Section */}
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`relative overflow-hidden rounded-3xl p-12 text-center ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
            <div className="relative z-10">
              <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                开始你的创作之旅
              </h2>
              <p className={`text-lg mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                加入我们的创作者社区，探索无限可能
              </p>
              <TianjinButton 
                variant="primary" 
                size="lg"
                onClick={() => navigate('/create')}
                className="group"
              >
                立即开始创作
                <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
              </TianjinButton>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
