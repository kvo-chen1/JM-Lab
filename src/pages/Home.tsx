import { useState, useRef, useEffect, useMemo, useCallback, useContext } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { ExternalLink } from 'lucide-react';
import { TianjinImage, TianjinTag, TianjinAvatar } from '@/components/TianjinStyleComponents';
import { llmService } from '@/services/llmService'
import voiceService from '@/services/voiceService'
import { workService } from '@/services/apiService'
import { useTranslation } from 'react-i18next'
import eventBus from '@/lib/eventBus' // 导入事件总线
import HomeRecommendationSection from '@/components/HomeRecommendationSection'
import JinMaiTemplatesSection from '@/components/JinMaiTemplatesSection'
import HotSearchSection from '@/components/HotSearchSection'
import PartnerBrandsSection from '@/components/PartnerBrandsSection'
import { usePlatformStats } from '@/hooks/usePlatformStats'
import { recordUserAction } from '@/services/recommendationService'
import pendingMessageService from '@/services/pendingMessageService'
import {
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
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // 已移除自动跳转逻辑，让已登录用户也能访问首页

  const { t } = useTranslation();
  const { scrollY } = useScroll();
  const { getDuration, getDelay } = useResponsiveAnimation();

  // 平台统计数据
  const { stats, loading: statsLoading } = usePlatformStats();
  
  // 获取用户ID（用于行为追踪）
  const getUserId = useCallback(() => {
    if (user?.id) return user.id;
    // 为未登录用户生成临时ID
    let deviceId = localStorage.getItem('jmzf_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('jmzf_device_id', deviceId);
    }
    return deviceId;
  }, [user]);
  
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
    const loginListener = eventBus.on('auth:login', (data) => {
      console.log('Home page received login event:', data);
      const username = data?.user?.username || '用户';
      toast.success(`欢迎回来，${username}!`);
    });
    
    const logoutListener = eventBus.on('auth:logout', () => {
      console.log('Home page received logout event');
      toast.info('您已成功登出');
    });
    
    const workCreatedListener = eventBus.on('作品:创建', (data) => {
      console.log('Home page received work created event:', data);
      toast.success('作品创建成功！');
    });
    
    const workPublishedListener = eventBus.on('作品:发布', (data) => {
      console.log('Home page received work published event:', data);
      toast.success(
        <div className="flex items-center justify-between gap-4 min-w-[280px]">
          <div className="flex items-center gap-2">
            <span className="text-sm text-emerald-700">作品发布成功</span>
          </div>
          <button
            onClick={() => navigate('/square')}
            className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-[#C02C38] to-[#D64545] text-white hover:shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-1 font-medium whitespace-nowrap"
          >
            <ExternalLink className="w-3 h-3" />
            去广场查看
          </button>
        </div>,
        {
          duration: 5000,
          className: 'bg-emerald-50 border-emerald-200 !py-2 !px-3'
        }
      );
    });
    
    const dataRefreshListener = eventBus.on('数据:刷新', (data) => {
      console.log('Home page received data refresh event:', data);
      // 只处理特定类型的数据刷新事件，避免无限循环
      if (data.type === 'work:created' || data.type === 'work:updated' || data.type === 'work:deleted') {
        fetchData();
      }
    });
    
    // 清理事件监听器
    return () => {
      eventBus.off('auth:login', loginListener);
      eventBus.off('auth:logout', logoutListener);
      eventBus.off('作品:创建', workCreatedListener);
      eventBus.off('作品:发布', workPublishedListener);
      eventBus.off('数据:刷新', dataRefreshListener);
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
      
      // 临时禁用缓存以便调试
      // if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < CACHE_DURATION) {
      //   // 使用缓存数据
      //   const { works: cachedWorks, creators: cachedCreators } = JSON.parse(cachedData);
      //   // 确保数据是数组格式
      //   setWorks(Array.isArray(cachedWorks) ? cachedWorks : []);
      //   setPopularCreators(Array.isArray(cachedCreators) ? cachedCreators : []);
      //   setIsLoading(false);
      //   return;
      // }
      
      // 缓存过期或不存在，从API获取
      console.log('[Home] Fetching works data...');
      const worksData = await workService.getWorks({ limit: 20 });
      console.log('[Home] Works data:', worksData);
      // 确保worksData是数组
      setWorks(Array.isArray(worksData) ? worksData : []);
      
      // 生成热门创作者数据 - 从 worksData 中提取创作者信息
      let creatorsArray: any[] = [];
      
      try {
        console.log('[Home] Processing creators data from worksData...');
        
        // 从 worksData 中提取创作者信息（后端 API 已返回 author 字段）
        const creatorsMap = new Map();
        
        if (Array.isArray(worksData)) {
          worksData.forEach(work => {
            // 优先使用 author 字段（后端 API 返回的结构）
            const authorId = work.author?.id || work.creator_id;
            const authorName = work.author?.username || work.creator || '未知用户';
            const authorAvatar = work.author?.avatar || work.creatorAvatar;
            
            if (authorId) {
              if (!creatorsMap.has(authorId)) {
                creatorsMap.set(authorId, {
                  id: authorId,
                  name: authorName,
                  avatar: authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName}`,
                  likes: 0
                });
              }
              const creator = creatorsMap.get(authorId);
              creator.likes += work.likes || 0;
            }
          });
        }
        
        creatorsArray = Array.from(creatorsMap.values())
          .sort((a, b) => b.likes - a.likes)
          .slice(0, 5);
        
        console.log('[Home] Creators array:', creatorsArray);
      } catch (err) {
        console.error('获取创作者数据失败:', err);
      }
      
      setPopularCreators(creatorsArray);
      
      // 缓存数据（带配额检查）
      try {
        const dataToCache = {
          works: worksData,
          creators: creatorsArray
        };
        const cacheString = JSON.stringify(dataToCache);
        // 检查数据大小（大约 5MB 限制）
        if (cacheString.length < 4 * 1024 * 1024) {
          localStorage.setItem('homePageData', cacheString);
          localStorage.setItem('homePageDataTimestamp', now.toString());
        } else {
          console.warn('缓存数据太大，跳过缓存');
        }
      } catch (storageErr) {
        console.warn('缓存数据失败（可能是存储配额不足）:', storageErr);
        // 尝试清理旧数据
        try {
          localStorage.removeItem('homePageData');
          localStorage.removeItem('works');
        } catch (e) {
          // 忽略清理错误
        }
      }
      
      // 同时保存到推荐系统使用的 key (works) - 限制数量避免超出配额
      if (Array.isArray(worksData) && worksData.length > 0) {
        try {
          const limitedWorks = worksData.slice(0, 50); // 只缓存前50条
          localStorage.setItem('works', JSON.stringify(limitedWorks));
        } catch (storageErr) {
          console.warn('缓存作品数据失败:', storageErr);
        }
      }
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
    // 清理可能存在的浏览器自动填充值，确保输入框和React state同步
    setSearch('');
    setSelectedTags([]);
  }, []);
  
  // 创作提示词输入状态
  const [search, setSearch] = useState('');
  
  // 状态管理
  const [inspireOn, setInspireOn] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // 防抖定时器引用
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [creativeDirections] = useState<string[]>([]);
  const [generatedText] = useState('');
  const [isGenerating] = useState(false);
  const [diagnosedIssues, setDiagnosedIssues] = useState<string[]>([]);
  const [optimizationSummary, setOptimizationSummary] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeAudioUrl, setOptimizeAudioUrl] = useState('');
  
  // 快速标签
  const quickTags = ['国潮风格','非遗元素','科创思维','地域素材','节日庆典','文创产品'];
  
  // 快速标签状态
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // 页面内功能区定位引用
  const creativeRef = useRef<HTMLDivElement | null>(null);
  const generatedRef = useRef<HTMLDivElement | null>(null);
  const optimizedRef = useRef<HTMLDivElement | null>(null);
  
  const ensurePrompt = (): string => {
    const base = search.trim();
    const tagsText = selectedTags.join(' ').trim();
    const combined = base || tagsText;
    // 如果没有输入，使用默认提示词
    const result = combined || '天津文化设计灵感';
    return inspireOn ? `${result} 灵感加持` : result;
  };
  
  const handleInspireClick = useCallback(async () => {
    const p = ensurePrompt();
    if (!p.trim()) {
      toast.warning('请先输入创作内容');
      return;
    }

    setIsOptimizing(true);
    try {
      // 使用千问模型，单次调用优化提示词
      llmService.setCurrentModel('qwen');
      const optimized = await llmService.generateResponse(
        `请将以下创作描述优化为AI绘画提示词，要求：
1. 保留核心主题和风格
2. 添加细节描述（色彩、构图、质感）
3. 使用逗号分隔关键词
4. 控制在50字以内
5. 必须使用中文输出，不要出现英文
6. 只输出优化后的提示词，不要解释

原文：${p}`
      );

      const cleaned = String(optimized || '').trim()
        .replace(/^["']|["']$/g, '')
        .replace(/^(提示词|优化后)[:：]\s*/i, '')
        .replace(/[\n\r]+/g, ' ')
        .trim();

      if (cleaned && cleaned !== p && !/接口不可用|未返回内容/.test(cleaned)) {
        setSearch(cleaned);
        toast.success('提示词优化完成');
      } else {
        toast.info('当前提示词已很完善');
      }
    } catch (error) {
      console.error('优化失败:', error);
      toast.error('优化失败，请稍后重试');
    } finally {
      setIsOptimizing(false);
    }
  }, [search, selectedTags]);
  
  const handleGenerateClick = useCallback(async () => {
    const p = ensurePrompt();
    
    // 检测是否为手机端
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // 手机端：跳转到津小脉AI助手并自动触发消息
      // 保存到数据库，下次登录依然可以看到
      await pendingMessageService.savePendingMessage(p, '/home', { source: 'home-generate' });
      navigate('/ai-assistant?autoSend=true');
    } else {
      // PC端：保持原有行为，跳转到创作中心
      // 保存当前输入到本地存储，以便设计工坊页面读取
      const workshopData = {
        prompt: p,
        tags: selectedTags,
        timestamp: Date.now(),
        source: 'home-page'
      };
      localStorage.setItem('workshopInspirationData', JSON.stringify(workshopData));
      
      // 发布创作生成事件
      eventBus.emit('请求:开始', {
        url: '/create',
        method: 'GET',
        options: { query: p, from: 'home' }
      });
      
      navigate(`/create?from=home&prompt=${encodeURIComponent(p)}`);
    }
  }, [navigate, selectedTags]);
  
  const handleOptimizeClick = async () => {
    const p = ensurePrompt();
    
    // 发布优化开始事件
    eventBus.emit('请求:开始', {
      url: '/optimize',
      method: 'POST',
      options: { prompt: p }
    });
    
    setIsOptimizing(true);
    setOptimizeAudioUrl('');
    setOptimizationSummary('');
    try {
      llmService.setCurrentModel('kimi');
      llmService.updateConfig({
        stream: false,
        system_prompt: '你是资深创作优化助手，请针对用户的创作问题进行结构化诊断与优化。'
      });
      const issues = llmService.diagnoseCreationIssues(p);
      setDiagnosedIssues(issues);
      const summary = await llmService.generateResponse(`${p}（请输出结构化的优化说明与下一步行动）`);
      if (summary && !/接口不可用|未返回内容/.test(summary)) {
        setOptimizationSummary(summary);
      }
      const optimized = await llmService.generateResponse(
        `请将以下创作问题提炼为可直接用于AI生成的中文提示词，只输出提示词本句：\n${p}`
      );
      const oneLine = optimized.split(/\r?\n/).find(s => s.trim()) || optimized;
      const cleaned = oneLine.replace(/^"|"$/g, '').replace(/^“|”$/g, '').replace(/^提示词[:：]\s*/, '').trim();
      if (cleaned && !/接口不可用|未返回内容/.test(cleaned)) {
        setSearch(cleaned);
        toast.success('已生成优化提示词');
      }
      toast.success(`发现${issues.length}条优化建议`);
      
      // 发布优化成功事件
      eventBus.emit('请求:成功', {
        url: '/optimize',
        method: 'POST',
        data: { issues, optimized: cleaned, summary }
      });
    } catch (error) {
      console.error('优化失败:', error);
      
      // 发布优化失败事件
      eventBus.emit('请求:失败', {
        url: '/optimize',
        method: 'POST',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      toast.error('优化失败，请稍后重试');
    } finally {
      setIsOptimizing(false);
    }
  };
  
  const toggleInspire = () => {
    const next = !inspireOn;
    setInspireOn(next);
    toast.info(next ? '灵感加持已开启' : '灵感加持已关闭');
  };
  
  // 随机灵感库
  const RANDOM_INSPIRATIONS = [
    // 国潮风格
    '杨柳青风格的现代包装设计',
    '天津之眼与赛博朋克融合',
    '泥人张风格的3D角色建模',
    '海河夜景的国潮插画',
    '传统纹样的现代应用',
    '非遗元素的数字化表达',
    '京剧脸谱与国潮服饰结合',
    '青花瓷元素的现代UI设计',
    '中国龙元素的赛博朋克风格',
    '传统剪纸艺术的动态演绎',
    // 地域特色
    '天津煎饼果子的趣味插画',
    '十八街麻花的创意包装设计',
    '耳朵眼炸糕的品牌视觉设计',
    '古文化街的文化旅游海报',
    '五大道历史建筑的插画系列',
    '天津港的现代工业风格设计',
    // 非遗元素
    '风筝魏的传统工艺展示',
    '杨柳青年画的现代演绎',
    '泥人张彩塑的3D建模',
    '天津快板的文化传播设计',
    '评剧元素的艺术海报',
    // 科创思维
    'AI生成的传统山水画',
    '元宇宙中的非遗展示',
    '数字孪生天津城市景观',
    'VR体验天津传统文化',
    '区块链数字藏品设计',
    // 文创产品
    '天津特色冰箱贴设计',
    '传统纹样的手机壳设计',
    '非遗元素的帆布包图案',
    '天津地标的文创T恤',
    '文化主题的笔记本封面',
    // 节日庆典
    '春节主题的国潮海报',
    '元宵节的花灯设计',
    '端午节的龙舟插画',
    '中秋节的月饼包装',
    '传统婚礼的视觉设计'
  ];

  // 随机灵感功能
  const handleRandomInspiration = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * RANDOM_INSPIRATIONS.length);
    const randomInspiration = RANDOM_INSPIRATIONS[randomIndex];
    
    // 随机选择1-2个相关标签
    const relevantTags = quickTags
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 2) + 1);
    
    setSearch(randomInspiration);
    setSelectedTags(relevantTags);
    
    toast.success('随机灵感已生成！', {
      description: randomInspiration,
      duration: 3000
    });
  }, [quickTags]);
  
  // 标签对应的高质量提示词
  const tagToPrompt: Record<string, string> = {
    '国潮风格': '新中式国潮插画，传统纹样与现代几何融合，朱砂红与墨黑配色，金色描边，平面设计风格',
    '非遗元素': '非遗工艺视觉，剪纸皮影刺绣元素，手工质感，民俗图案，暖色调，文化传承主题',
    '科创思维': '科技未来感设计，赛博朋克美学，霓虹光效，数字艺术，冷色调蓝紫渐变，智能交互视觉',
    '地域素材': '天津地域文化，海河津门故里五大道建筑，方言元素，码头文化，市井气息，本土特色视觉',
    '节日庆典': '传统节日庆典，红灯笼烟花舞龙舞狮，喜庆氛围，中国红金色配色，团圆祝福主题',
    '文创产品': '文创产品设计，博物馆联名非遗IP城市符号，实用美学，年轻潮流，包装周边礼品设计'
  };

  const toggleTag = (tag: string) => {
    const promptText = tagToPrompt[tag] || tag;
    // 单选模式：点击新标签时替换之前的标签和提示词
    setSelectedTags([tag]);
    setSearch(promptText);
  };

  const clearAllTags = () => {
    setSelectedTags([]);
    setSearch('');
  };

  const handleVoiceInput = async () => {
    try {
      setIsListening(true);
      const result = await voiceService.startListening();
      if (result && result.text) {
        setSearch((prev) => prev ? `${prev} ${result.text}` : result.text);
        toast.success('语音输入成功');
      }
    } catch (error) {
      console.error('语音输入失败:', error);
      toast.error('语音输入失败，请重试');
    } finally {
      setIsListening(false);
    }
  };

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

  // Hero Image/Video Loading State
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState(false);

  return (
    <div className={`relative min-h-screen w-full overflow-hidden ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      
      {/* Hero Section - Immersive Background */}
      <div className="relative h-[85vh] w-full flex flex-col justify-center items-center overflow-hidden bg-gray-900">
        {/* Background Video with Parallax */}
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 z-0"
        >
          <video
            src="https://videos.pexels.com/video-files/16458946/16458946-uhd_2560_1440_30fps.mp4"
            poster="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1600&q=80"
            className="w-full h-full object-cover"
            onLoadedData={(e) => {
              console.log('✅ Video loaded successfully!');
              setHeroLoaded(true);
            }}
            onError={(e) => {
              console.error('❌ Video failed to load:', e);
              setVideoLoadError(true);
              setHeroLoaded(true);
            }}
            onPlay={() => console.log('▶️ Video started playing')}
            autoPlay
            muted
            loop
            controls={false}
            playsInline
            preload="auto"
            style={{ display: 'block' }}
            crossOrigin="anonymous"
          />
        </motion.div>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-indigo-900/30 to-purple-900/50 z-[1]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent z-[2]"></div>
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${isDark ? 'from-gray-950' : 'from-white'} to-transparent z-[2] h-32`}></div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-5xl w-full px-4 sm:px-6 text-center overflow-hidden">
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: getDuration(0.56), ease: "easeOut", delay: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 md:mb-6 drop-shadow-2xl tracking-tight"
          >
            <span className="block truncate px-2">{t('common.welcome')}</span>
            <span className="block mt-1 md:mt-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent truncate px-2">
              释放创意潜能
            </span>
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: getDuration(0.56), delay: 0.05, ease: "easeOut" }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-8 md:mb-12 font-light tracking-wide max-w-2xl mx-auto px-4"
          >
            {t('home.exploreTianjinCulture')}
          </motion.p>

          {/* Search Bar - Glassmorphism with Enhanced Animations */}
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: getDuration(0.56), delay: 0.1, type: 'spring', stiffness: 140 }}
            className="w-full max-w-4xl mx-auto backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl lg:rounded-3xl p-2.5 lg:p-3 shadow-2xl transition-all duration-200 hover:bg-white/15 focus-within:bg-white/15 focus-within:border-white/30 focus-within:shadow-3xl hover:shadow-3xl"
          >
            <div className="flex flex-col md:flex-row gap-2 lg:gap-3">
              <div className="flex-grow relative min-w-0">
                <textarea
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerateClick()}
                  placeholder="输入灵感，开启创作之旅..."
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  rows={1}
                  className="w-full min-h-[48px] md:min-h-[52px] lg:min-h-[56px] max-h-[120px] bg-transparent text-white placeholder-white/60 px-3 md:px-4 lg:px-6 py-2.5 md:py-3 lg:py-3.5 text-sm md:text-base outline-none transition-all duration-300 resize-none overflow-y-auto"
                  style={{ lineHeight: '1.5' }}
                />
                <div className="absolute right-2 lg:right-4 top-2 lg:top-3 flex items-center gap-1">
                  {search && (
                    <motion.button
                      onClick={clearAllTags}
                      className="p-1 lg:p-1.5 rounded-full text-white/60 hover:bg-white/10 transition-colors"
                      aria-label="清除所有内容"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <i className="fas fa-times-circle text-base lg:text-lg"></i>
                    </motion.button>
                  )}
                </div>
              </div>
              <div className="flex gap-2 p-0.5 flex-shrink-0">
                <motion.button
                  onClick={handleInspireClick}
                  className="h-10 md:h-11 lg:h-12 px-3 md:px-4 lg:px-6 rounded-lg lg:rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all shadow-lg flex items-center gap-1.5 whitespace-nowrap"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.15 }}
                >
                  <i className="fas fa-lightbulb text-sm lg:text-base"></i>
                  <span className="text-xs md:text-sm">优化提示词</span>
                </motion.button>
                <motion.button
                  onClick={handleGenerateClick}
                  className="h-10 md:h-11 lg:h-12 px-3 md:px-4 lg:px-6 rounded-lg lg:rounded-xl bg-white text-black hover:bg-gray-100 font-bold transition-all shadow-xl flex items-center gap-1.5 whitespace-nowrap"
                  whileHover={{ scale: 1.03, y: -2, boxShadow: '0 10px 30px -5px rgba(255, 255, 255, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18, duration: 0.15 }}
                >
                  <i className="fas fa-wand-magic-sparkles text-sm lg:text-base"></i>
                  <span className="text-xs md:text-sm">生成</span>
                </motion.button>
              </div>
            </div>
            {/* Quick Tags inside search bar area */}
            <div className="flex gap-2 px-2 lg:px-4 pb-1.5 lg:pb-2 mt-2 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory">
              {quickTags.map((tag, i) => (
                <motion.button
                  key={i}
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-2.5 lg:px-3 py-1.5 min-w-max rounded-full border transition-all ${selectedTags.includes(tag) ? 'bg-white text-black border-white shadow-lg' : 'bg-transparent text-white/70 border-white/20 hover:bg-white/10'}`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.02, duration: 0.15 }}
                  layoutId={`tag-${tag}`}
                  style={{
                    touchAction: 'manipulation',
                    minHeight: '28px',
                    scrollSnapAlign: 'start'
                  }}
                >
                  {tag}
                </motion.button>
              ))}
            </div>
          </motion.div>
          
          {/* Hero Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: getDuration(0.56), delay: 0.25 }}
            className="flex flex-wrap justify-center gap-6 sm:gap-8 md:gap-10 mt-8 md:mt-12 lg:mt-16 text-white/80 px-4"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -3 }}
              className="flex flex-col items-center p-3 md:p-4 rounded-xl hover:bg-white/10 transition-all"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 md:mb-2"
              >
                1000+
              </motion.div>
              <span className="text-xs sm:text-sm text-white/70">创作作品</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -3 }}
              className="flex flex-col items-center p-3 md:p-4 rounded-xl hover:bg-white/10 transition-all"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: 0.35 }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 md:mb-2"
              >
                500+
              </motion.div>
              <span className="text-xs sm:text-sm text-white/70">活跃创作者</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -3 }}
              className="flex flex-col items-center p-3 md:p-4 rounded-xl hover:bg-white/10 transition-all"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: 0.7 }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 md:mb-2"
              >
                50+
              </motion.div>
              <span className="text-xs sm:text-sm text-white/70">文化活动</span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area - Overlapping the Hero */}
      <div className="relative z-30 -mt-20 pb-20">
        
        {/* 平台数据统计展示 */}
        <div className="pt-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: getDuration(0.5) }}
            className="max-w-7xl mx-auto px-4 md:px-6"
          >
            <div className={`rounded-3xl p-8 md:p-12 ${isDark ? 'bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-pink-900/30 border border-indigo-500/20' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100'}`}>
              <div className="text-center mb-8">
                <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  平台数据
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  实时统计平台运行情况
                </p>
              </div>

              {statsLoading ? (
                <div className="flex justify-center py-8">
                  <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin ${isDark ? 'border-indigo-400' : 'border-indigo-600'}`} />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {[
                    { label: '总作品数', value: stats?.totalWorks || 0, icon: '🎨' },
                    { label: '创作者', value: stats?.totalCreators || 0, icon: '👥' },
                    { label: '今日活跃', value: stats?.activeUsers || 0, icon: '🔥' },
                    { label: '总浏览量', value: stats?.totalViews || 0, icon: '👁️' }
                  ].map((stat, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                      className={`text-center p-4 rounded-2xl ${isDark ? 'bg-slate-800/50' : 'bg-white/70'} backdrop-blur-sm`}
                    >
                      <div className="text-3xl mb-2">{stat.icon}</div>
                      <div className={`text-2xl md:text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {stat.value.toLocaleString()}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* 系统状态指示器 */}
              <div className="mt-8 flex justify-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  所有系统正常运行
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 1. 智能推荐区域 - 基于用户行为的个性化推荐 */}
        <div className="pt-24">
          <HomeRecommendationSection />
        </div>

        {/* 2. 津脉作品模板区域 - 天津文化特色模板 */}
        <div className="pt-16">
          <JinMaiTemplatesSection />
        </div>

        {/* 3. 热搜榜 - 热门搜索展示 */}
        <div className="pt-16">
          <HotSearchSection />
        </div>

        {/* 4. 已入驻品牌方 - 合作伙伴展示 */}
        <div className="pt-16">
          <PartnerBrandsSection />
        </div>
        
        {/* 4. 创作中心 (Creative Hub) - Highlighted Cards */}
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
                  whileInView={{ scale: 1 }}
                  transition={{ duration: getDuration(0.56), delay: getDelay(idx * 0.14 + 0.14) }}
                  className="overflow-hidden"
                >
                  <TianjinImage 
                    src={item.img} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                    fallbackSrc="/images/placeholder-image.jpg"
                    loading="lazy"
                    priority={false}
                  />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-8 flex flex-col justify-end">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, delay: idx * 0.05 + 0.1, type: 'spring' }}
                    whileHover={{ scale: 1.1, rotate: 5, transition: { duration: 0.15 } }}
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${idx === 0 ? 'from-blue-500 to-cyan-500' : idx === 1 ? 'from-purple-500 to-pink-500' : 'from-orange-500 to-red-500'} backdrop-blur-md flex items-center justify-center mb-6 text-white shadow-lg`}
                  >
                    <i className={`fas fa-${item.icon} text-2xl`}></i>
                  </motion.div>
                  <motion.h3 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.05 + 0.15 }}
                    className="text-2xl md:text-3xl font-bold text-white mb-3"
                  >
                    {item.title}
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.05 + 0.2 }}
                    className="text-white/70 text-sm md:text-base font-medium mb-6"
                  >
                    {item.desc}
                  </motion.p>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.05 + 0.25 }}
                    whileHover={{ x: 10, transition: { duration: 0.15 } }}
                    className="flex items-center gap-3 text-white/90"
                  >
                    <span className="text-sm font-medium">立即探索</span>
                    <motion.i 
                      className="fas fa-arrow-right text-sm"
                      whileHover={{ x: 2 }}
                    ></motion.i>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 2. 发现天津 (Discovery) - Magazine Layout */}
        <Section title="发现天津">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[500px]">
            {/* Feature Article - Takes 7 cols */}
            <motion.div 
              initial={{ opacity: 0, x: -100, scale: 0.9 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: getDuration(0.49), delay: 0, type: 'spring', stiffness: 140 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
              className="lg:col-span-7 h-64 md:h-80 lg:h-full lg:row-span-1 relative rounded-3xl overflow-hidden cursor-pointer group shadow-xl" 
              onClick={() => navigate('/cultural-knowledge')}
            >
               <motion.div
                 initial={{ scale: 1.1 }}
                 whileInView={{ scale: 1 }}
                 transition={{ duration: getDuration(0.7), delay: getDelay(0.14) }}
                 className="absolute inset-0 overflow-hidden"
               >
                 <TianjinImage 
                   src="https://images.unsplash.com/photo-1512413914633-b5043f4041ea?w=800&q=80" 
                   alt="文化知识" 
                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                   fallbackSrc="/images/placeholder-image.jpg"
                 />
               </motion.div>
               {/* Enhanced Overlay with Glassmorphism */}
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-8 md:p-12 flex flex-col justify-end">
                 <motion.div 
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.6, delay: 0.4 }}
                   whileHover={{ y: -2 }}
                 >
                   <motion.div
                     initial={{ opacity: 0, scale: 0.8, x: -20 }}
                     whileInView={{ opacity: 1, scale: 1, x: 0 }}
                     transition={{ duration: 0.4, delay: 0.5 }}
                   >
                     <TianjinTag color="red" className="mb-4 bg-red-600/90 border-none text-white shadow-lg backdrop-blur-md">
                       <i className="fas fa-fire mr-1"></i> FEATURED
                     </TianjinTag>
                   </motion.div>
                   <motion.h3 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, delay: 0.6 }}
                     className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight drop-shadow-lg"
                   >
                     探寻津门非遗的<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">现代新生</span>
                   </motion.h3>
                   <motion.p 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, delay: 0.8 }}
                     className="text-white/90 text-lg max-w-xl font-medium drop-shadow-md border-l-4 border-yellow-500 pl-4"
                   >
                     深度解读天津历史、民俗与非遗文化，为创作提供严谨的文化背书。
                   </motion.p>
                 </motion.div>
               </div>
            </motion.div>
            
            {/* Side Articles - Takes 5 cols */}
            <div className="lg:col-span-5 flex flex-col gap-6 h-full lg:row-span-1">
              {/* Tianjin Cultural Map Card */}
              <motion.div 
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: getDuration(0.49), delay: 0.05, type: 'spring', stiffness: 140 }}
                whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.15 } }}
                className={`flex-1 rounded-3xl p-8 relative overflow-hidden cursor-pointer group transition-all duration-200 ${isDark ? 'bg-gray-900' : 'bg-white border border-gray-100'} shadow-xl hover:shadow-2xl`} 
                onClick={() => navigate('/tianjin-map')}
              >
                {/* Background Image Overlay */}
                <div className="absolute inset-0 opacity-[0.2] group-hover:opacity-[0.3] transition-opacity duration-500 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80')] bg-cover bg-center"></div>
                
                <div className="relative z-10 h-full flex flex-col justify-center">
                   <motion.div 
                     initial={{ opacity: 0, scale: 0 }}
                     whileInView={{ opacity: 1, scale: 1 }}
                     transition={{ duration: 0.5, delay: 0.5, type: 'spring' }}
                     whileHover={{ scale: 1.1 }}
                     className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-sm"
                   >
                     <i className="fas fa-map-marked-alt text-xl"></i>
                   </motion.div>
                   <motion.h4 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5, delay: 0.6 }}
                     className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'} group-hover:text-blue-600 transition-colors`}
                   >
                     天津文化地图
                   </motion.h4>
                   <motion.p 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5, delay: 0.7 }}
                     className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'} group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors`}
                   >
                     可视化探索文化地标，寻找身边的灵感。
                   </motion.p>
                </div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0, rotate: 45 }}
                  whileInView={{ opacity: 0.05, scale: 1, rotate: 12 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="absolute -right-4 -bottom-4 transform group-hover:scale-110 group-hover:rotate-0 transition-all duration-700"
                >
                   <i className="fas fa-map-marked-alt text-9xl text-blue-600"></i>
                </motion.div>
              </motion.div>
              

            </div>
          </div>
        </Section>

        {/* 3. 活动与挑战 (Events) - Horizontal Scroll */}
        <Section title="活动与挑战">
           <div className="flex flex-col md:flex-row gap-6 md:overflow-x-auto md:pb-8 md:snap-x md:snap-mandatory scrollbar-hide px-2">
              {[
                { 
                  title: '津门老字号设计赛', 
                  sub: '赢取万元大奖', 
                  img: 'https://images.unsplash.com/photo-1576085898323-218337e3e43c?w=800&q=80', 
                  tag: 'HOT', 
                  tagColor: 'red',
                  link: '/tianjin',
                  icon: 'trophy',
                  date: '进行中'
                },
                { 
                  title: '商业品牌联名挑战', 
                  sub: '连接商业价值', 
                  img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80', 
                  tag: 'BUSINESS', 
                  tagColor: 'blue',
                  link: '/business',
                  icon: 'handshake',
                  date: '剩余12天'
                },
                { 
                  title: '非遗数字藏品展', 
                  sub: '作品征集中', 
                  img: 'https://images.unsplash.com/photo-1550948537-130a1ce83314?w=800&q=80', 
                  tag: 'NEW', 
                  tagColor: 'green',
                  link: '/events',
                  icon: 'vr-cardboard',
                  date: '即将开始'
                }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: getDuration(0.42), delay: idx * 0.03, type: 'spring', stiffness: 140 }}
                  whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.15 } }}
                  className="w-full md:w-auto min-w-[320px] md:min-w-[420px] snap-center cursor-pointer group"
                  onClick={() => navigate(item.link)}
                >
                   <motion.div 
                     className="aspect-[16/9] rounded-3xl overflow-hidden relative mb-5 shadow-lg group-hover:shadow-2xl transition-all duration-500"
                     whileHover={{ y: -5 }}
                   >
                     <motion.div
                       initial={{ scale: 1.2 }}
                       whileInView={{ scale: 1 }}
                       transition={{ duration: getDuration(0.56), delay: getDelay(idx * 0.105 + 0.14) }}
                       whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
                       className="overflow-hidden"
                     >
                       <TianjinImage src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-1000" fallbackSrc="/images/placeholder-image.jpg" />
                     </motion.div>
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"></div>
                      
                      {/* Tag */}
                      <motion.div 
                        initial={{ opacity: 0, x: -20, scale: 0.8 }}
                        whileInView={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ duration: 0.35, delay: idx * 0.03 + 0.05 }}
                        whileHover={{ scale: 1.1, transition: { duration: 0.15 } }}
                        className="absolute top-4 left-4"
                      >
                        <TianjinTag color={item.tagColor as any} className="backdrop-blur-md shadow-lg border-white/20 text-white font-bold tracking-wider">
                          {item.tag}
                        </TianjinTag>
                      </motion.div>
                       
                      {/* Status/Date Badge */}
                      <motion.div 
                        initial={{ opacity: 0, x: 20, scale: 0.8 }}
                        whileInView={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ duration: 0.35, delay: idx * 0.03 + 0.08 }}
                        className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white/90 text-xs font-medium px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.date === '进行中' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
                        {item.date}
                      </motion.div>

                      {/* Content Overlay */}
                      <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.42, delay: idx * 0.03 + 0.12 }}
                        className="absolute bottom-0 left-0 w-full p-6"
                      >
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: idx * 0.03 + 0.15 }}
                          className="flex items-center gap-3 mb-2"
                        >
                           <motion.div 
                             initial={{ opacity: 0, scale: 0 }}
                             whileInView={{ opacity: 1, scale: 1 }}
                             transition={{ duration: 0.28, delay: idx * 0.03 + 0.18 }}
                             whileHover={{ scale: 1.2, rotate: 5, transition: { duration: 0.15 } }}
                             className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md bg-white/20 text-white border border-white/20`}
                           >
                             <i className={`fas fa-${item.icon}`}></i>
                           </motion.div>
                           <motion.h3 
                             initial={{ opacity: 0, x: 20 }}
                             whileInView={{ opacity: 1, x: 0 }}
                             transition={{ duration: 0.35, delay: idx * 0.03 + 0.21 }}
                             className="text-2xl font-bold text-white tracking-tight"
                           >
                             {item.title}
                           </motion.h3>
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: idx * 0.03 + 0.24 }}
                          className="flex justify-between items-center pl-1"
                        >
                          <p className="text-white/80 text-sm font-medium">{item.sub}</p>
                          <motion.span 
                            whileHover={{ scale: 1, rotate: 0, transition: { duration: 0.15 } }}
                            initial={{ opacity: 0, scale: 0.5, rotate: 45 }}
                            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ duration: 0.28, delay: idx * 0.03 + 0.27 }}
                            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transition-all duration-150"
                          >
                            <i className="fas fa-arrow-right text-sm"></i>
                          </motion.span>
                        </motion.div>
                      </motion.div>
                   </motion.div>
                </motion.div>
              ))}
           </div>
        </Section>

        {/* 4. 灵感社区 (Community Hub) - Creators & Works */}
        <Section title="灵感社区">
          
          {/* Active Creators Strip */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6 px-2">
               <motion.h3 
                 initial={{ opacity: 0, x: -20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 transition={{ duration: 0.5 }}
                 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}
               >
                 <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></span>
                 活跃创作者
               </motion.h3>
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/community?context=creator')}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                 查看全部 <i className="fas fa-chevron-right text-xs"></i>
               </motion.button>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4 px-2 snap-x scrollbar-hide">
               {popularCreators.map((creator, idx) => (
                 <motion.div
                   key={idx}
                   initial={{ opacity: 0, y: 30, scale: 0.9 }}
                   whileInView={{ opacity: 1, y: 0, scale: 1 }}
                   viewport={{ once: true }}
                   transition={{ duration: getDuration(0.35), delay: idx * 0.02 }}
                   whileHover={{ y: -5, scale: 1.05, transition: { duration: 0.15 } }}
                   className="flex flex-col items-center min-w-[100px] snap-center cursor-pointer group"
                   onClick={() => creator.id && navigate(`/author/${creator.id}`)}
                 >
                    <div className="relative mb-3">
                      <TianjinAvatar
                        src={creator.avatar}
                        alt={creator.name}
                        size="xl"
                        variant="gradient"
                        online={idx < 3}
                        className="shadow-lg group-hover:shadow-xl transition-all hover:ring-2 hover:ring-blue-400"
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.28, delay: idx * 0.02 + 0.05 }}
                        className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm"
                      >
                        <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                          <i className="fas fa-check"></i>
                        </div>
                      </motion.div>
                    </div>
                    <motion.span 
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 + 0.4 }}
                      className={`text-sm font-medium mb-1 truncate max-w-[100px] ${isDark ? 'text-white' : 'text-gray-800'}`}
                    >
                      {creator.name}
                    </motion.span>
                    <motion.span 
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 + 0.5 }}
                      className="text-xs text-gray-500 flex items-center gap-1"
                    >
                      <i className="fas fa-heart text-red-400 text-[10px]"></i> {(creator.likes / 1000).toFixed(1)}k
                    </motion.span>
                 </motion.div>
               ))}
               <motion.div 
                 initial={{ opacity: 0, y: 30, scale: 0.9 }}
                 whileInView={{ opacity: 1, y: 0, scale: 1 }}
                 transition={{ duration: 0.5, delay: popularCreators.length * 0.1 }}
                 whileHover={{ scale: 1.05 }}
                 className="flex flex-col items-center justify-center min-w-[100px] snap-center cursor-pointer"
               >
                  <div className={`w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center mb-3 ${isDark ? 'border-gray-700 bg-gray-800 text-gray-400' : 'border-gray-300 bg-gray-50 text-gray-500'}`}>
                    <i className="fas fa-plus text-xl"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-500">加入社区</span>
               </motion.div>
            </div>
           </div>
 
           {/* Popular Community Groups - Masonry Style */}
           <div className="mb-12">
             <div className="flex items-center justify-between mb-6 px-2">
                <motion.h3 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}
                >
                  <span className="w-1.5 h-6 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full"></span>
                  热门社群
                </motion.h3>
                <motion.button 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
                  onClick={() => navigate('/community?context=groups')}
                >
                  浏览更多 <i className="fas fa-arrow-right text-xs"></i>
                </motion.button>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
                {[
                  { 
                    title: '国潮设计社群', 
                    desc: '国潮视觉与品牌体系',
                    tags: ['国潮', '设计'],
                    members: 1286,
                    img: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&q=80',
                  },
                  { 
                    title: '高校社团联名', 
                    desc: '企划与视觉讨论',
                    tags: ['高校', '联名'],
                    members: 1014,
                    img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80',
                  },
                  { 
                    title: 'AI艺术生成', 
                    desc: '提示词与实战案例',
                    tags: ['AI', '艺术'],
                    members: 1542,
                    img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
                  },
                  { 
                    title: '非遗数字化', 
                    desc: '数字化案例传播',
                    tags: ['非遗', '数字'],
                    members: 892,
                    img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80',
                  },
                  { 
                    title: '校园IP联名', 
                    desc: '跨界合作交流',
                    tags: ['IP', '校园'],
                    members: 1002,
                    img: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80',
                  },
                  { 
                    title: '老字号企划', 
                    desc: '商业合作讨论',
                    tags: ['老字号', '企划'],
                    members: 756,
                    img: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
                  }
                ].map((group, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: getDuration(0.6), delay: getDelay(idx * 0.1), type: 'spring', stiffness: 100 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className={`relative rounded-2xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all duration-500 ${idx % 3 === 0 ? 'md:col-span-2 md:row-span-2 aspect-square' : 'md:col-span-1 md:row-span-1 aspect-square'}`}
                  >
                  <div className="absolute inset-0 overflow-hidden">
                    <motion.img 
                      initial={{ scale: 1.2 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: getDuration(0.8), delay: getDelay(idx * 0.1 + 0.2) }}
                      whileHover={{ scale: 1.1 }}
                      src={group.img} 
                      alt={group.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000"
                      loading="lazy"
                    />
                  </div>
                    
                    {/* Gradient Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90"></div>
                    
                    {/* Official Badge */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0, rotate: -10 }}
                      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.1 + 0.4 }}
                      className="absolute top-3 right-3 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] px-2 py-0.5 rounded-full"
                    >
                      官方认证
                    </motion.div>

                    {/* Content */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: idx * 0.1 + 0.5 }}
                      className="absolute bottom-0 left-0 w-full p-5"
                    >
                       <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                         <motion.div 
                           initial={{ opacity: 0, y: 10 }}
                           whileHover={{ opacity: 1, y: 0 }}
                           transition={{ duration: 0.4 }}
                           className="flex flex-wrap gap-2 mb-2"
                         >
                           {group.tags.map((tag, i) => (
                             <motion.span 
                               key={i} 
                               initial={{ opacity: 0, scale: 0.8 }}
                               whileHover={{ opacity: 1, scale: 1 }}
                               transition={{ duration: 0.2, delay: i * 0.05 }}
                               className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white"
                             >
                               #{tag}
                             </motion.span>
                           ))}
                         </motion.div>
                         <motion.h4 
                           initial={{ opacity: 0, y: 10 }}
                           whileHover={{ y: -2 }}
                           transition={{ duration: 0.4 }}
                           className={`font-bold text-white mb-1 ${idx % 3 === 0 ? 'text-2xl' : 'text-lg'}`}
                         >
                           {group.title}
                         </motion.h4>
                         <motion.p 
                           initial={{ opacity: 0, y: 10 }}
                           whileHover={{ y: -1 }}
                           transition={{ duration: 0.4, delay: 0.1 }}
                           className="text-white/80 text-xs mb-3 line-clamp-1"
                         >
                           {group.desc}
                         </motion.p>
                          
                         <div className="flex items-center justify-between border-t border-white/20 pt-3">
                            <span className="text-white/70 text-xs flex items-center gap-1">
                              <i className="fas fa-user-friends"></i> {group.members}
                            </span>
                            <motion.button 
                              initial={{ opacity: 0, x: 10 }}
                              whileHover={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.4 }}
                              className="bg-white text-black text-xs px-3 py-1 rounded-full font-bold"
                            >
                              加入
                            </motion.button>
                         </div>
                       </div>
                    </motion.div>
                  </motion.div>
                ))}
             </div>
           </div>

           {/* Community Moments - New Section */}
           <div className="mb-12">
             <div className="flex items-center justify-between mb-6 px-2">
                <motion.h3 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}
                >
                  <span className="w-1.5 h-6 bg-gradient-to-b from-green-500 to-teal-600 rounded-full"></span>
                  社区动态
                </motion.h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
                {[
                  { img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80', title: '线下创作者沙龙', date: '2023.10.15', loc: '意风区·钟书阁' },
                  { img: 'https://images.unsplash.com/photo-1545989253-02cc26577f88?w=800&q=80', title: '非遗数字艺术展', date: '2023.11.02', loc: '天津美术馆' },
                  { img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80', title: '周末共创工坊', date: '每周末', loc: '智慧山艺术中心' }
                ].map((moment, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: getDuration(0.6), delay: getDelay(idx * 0.15), type: 'spring', stiffness: 100 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="relative h-48 rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-xl transition-all duration-500"
                  >
                    <motion.div
                      initial={{ scale: 1.2 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: getDuration(0.8), delay: getDelay(idx * 0.15 + 0.2) }}
                      whileHover={{ scale: 1.1 }}
                      className="overflow-hidden"
                    >
                      <TianjinImage src={moment.img} alt={moment.title} className="w-full h-full object-cover transition-transform duration-1000" fallbackSrc="/images/placeholder-image.jpg" />
                    </motion.div>
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500"></div>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: idx * 0.15 + 0.4 }}
                      className="absolute bottom-0 left-0 w-full p-4"
                    >
                      <div className="flex justify-between items-end">
                        <div>
                          <motion.h4 
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.15 + 0.5 }}
                            className="text-white font-bold text-lg mb-1"
                          >
                            {moment.title}
                          </motion.h4>
                          <motion.p 
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.15 + 0.6 }}
                            className="text-white/80 text-xs flex items-center gap-1"
                          >
                            <i className="fas fa-map-marker-alt"></i> {moment.loc}
                          </motion.p>
                        </div>
                        <motion.span 
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: idx * 0.15 + 0.7 }}
                          className="text-white/60 text-xs bg-black/30 px-2 py-1 rounded backdrop-blur-sm"
                        >
                          {moment.date}
                        </motion.span>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
             </div>
           </div>

           {/* Featured Works Grid with Community Stats */}
          <div className="mb-6 px-2">
             <motion.h3 
               initial={{ opacity: 0, x: -20 }}
               whileInView={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.5 }}
               className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}
             >
               <span className="w-1.5 h-6 bg-gradient-to-b from-red-500 to-orange-600 rounded-full"></span>
               精选作品
             </motion.h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {Array.isArray(gallery) && gallery.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: idx * 0.08, type: 'spring', stiffness: 100 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`relative rounded-2xl overflow-hidden cursor-pointer group shadow-md hover:shadow-2xl transition-all duration-500 bg-white dark:bg-gray-800 mb-0`}
                onClick={() => {
                  // 记录作品点击行为（用于推荐系统）
                  recordUserAction({
                    userId: getUserId(),
                    itemId: item.id,
                    itemType: 'post',
                    actionType: 'click',
                    value: 2,
                    metadata: {
                      category: item.category,
                      tags: item.tags,
                      title: item.title,
                      source: 'home_gallery'
                    }
                  });
                  // 跳转到作品详情页
                  navigate(`/post/${item.id}`);
                }}
              >
                 {/* Image Section */}
                 <div className="relative w-full aspect-square overflow-hidden">
                    {/* 判断是否为视频作品 */}
                    {item.type === 'video' || item.videoUrl ? (
                      <video
                        src={item.videoUrl || item.thumbnail || item.cover_url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        loop
                        autoPlay
                        preload="auto"
                      />
                    ) : (
                      <motion.img
                        initial={{ scale: 1.2 }}
                        whileInView={{ scale: 1 }}
                        transition={{ duration: 0.8, delay: idx * 0.08 + 0.2 }}
                        whileHover={{ scale: 1.1 }}
                        src={item.thumbnail || item.cover_url || '/images/placeholder-image.jpg'}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-1000"
                        loading="lazy"
                      />
                    )}
                    
                    {/* Top Right Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                       <span className="bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                         <i className="fas fa-heart text-red-400"></i> {item.likes}
                       </span>
                       <span className="bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                         <i className="fas fa-comment text-blue-400"></i> {item.commentCount}
                       </span>
                    </div>

                    {/* Bottom Info with Smooth Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-4">
                       <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-400">
                         <h4 className="text-white font-bold truncate text-lg mb-2 drop-shadow-lg">{item.title}</h4>
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div
                                className="cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  (item.author?.id || item.creator_id || item.user_id) && navigate(`/author/${item.author?.id || item.creator_id || item.user_id}`);
                                }}
                              >
                                <TianjinAvatar src={item.creatorAvatar || item.author?.avatar} alt={item.creator || item.author?.username} size="xs" withBorder={false} className="hover:ring-2 hover:ring-blue-400 transition-all" />
                              </div>
                              <span
                                className="text-white/90 text-xs font-medium cursor-pointer hover:text-blue-400 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  (item.author?.id || item.creator_id || item.user_id) && navigate(`/author/${item.author?.id || item.creator_id || item.user_id}`);
                                }}
                              >{item.creator || item.author?.username}</span>
                           </div>
                           <span className="text-white/70 text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                             {item.category}
                           </span>
                         </div>
                       </div>
                    </div>
                 </div>
                 
                 {/* Category Tag at Bottom */}
                 <div className="absolute bottom-3 left-4 z-10">
                   <span className={`backdrop-blur-sm text-xs font-medium px-3 py-1 rounded-full shadow-md ${item.type === 'video' || item.videoUrl ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white' : 'bg-white/90 dark:bg-gray-900/90 text-gray-800 dark:text-gray-200'}`}>
                     {item.type === 'video' || item.videoUrl ? (
                       <span className="flex items-center gap-1">
                         <i className="fas fa-video text-[10px]"></i>
                         视频
                       </span>
                     ) : item.category}
                   </span>
                 </div>
              </motion.div>
            ))}
          </div>
          
          {/* Explore More Button */}
          <div className="mt-16 text-center">
            <motion.button 
              onClick={() => navigate('/explore')}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: getDuration(0.6), type: 'spring', stiffness: 100 }}
              whileHover={{ 
                scale: 1.08, 
                y: -5, 
                boxShadow: isDark ? '0 20px 40px -10px rgba(255, 255, 255, 0.2)' : '0 20px 40px -10px rgba(0, 0, 0, 0.3)',
                background: isDark ? 'linear-gradient(135deg, #ffffff, #f3f4f6)' : 'linear-gradient(135deg, #000000, #374151)'
              }}
              whileTap={{ scale: 0.98, y: -2 }}
              className={`px-10 py-4 rounded-full font-semibold transition-all duration-500 shadow-lg ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}
            >
              <span className="flex items-center justify-center gap-2">
                <span>探索更多作品</span>
                <motion.i 
                  className="fas fa-arrow-right"
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.3 }}
                ></motion.i>
              </span>
            </motion.button>
          </div>
        </Section>

        {/* 5. 趣味互动 (Fun) - 3D Interactive Cards */}
        <div className={`py-20 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 md:px-6">
             <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[

                  { 
                    title: '趣味游戏', 
                    icon: 'gamepad', 
                    color: 'text-purple-500', 
                    bg: 'bg-purple-100 dark:bg-purple-900/40', 
                    link: '/games',
                    img: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80',
                    gradient: 'from-purple-500/20 to-blue-500/20'
                  },
                  { 
                    title: '积分商城', 
                    icon: 'gift', 
                    color: 'text-orange-500', 
                    bg: 'bg-orange-100 dark:bg-orange-900/40', 
                    link: '/points-mall',
                    img: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=800&q=80',
                    gradient: 'from-orange-500/20 to-yellow-500/20'
                  },
                  { 
                    title: '人气榜单', 
                    icon: 'chart-line', 
                    color: 'text-blue-500', 
                    bg: 'bg-blue-100 dark:bg-blue-900/40', 
                    link: '/leaderboard',
                    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
                    gradient: 'from-blue-500/20 to-teal-500/20'
                  }
                ].map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 50, scale: 0.9, rotateY: -10, rotateX: -10 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1, rotateY: 0, rotateX: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: getDuration(0.6), delay: getDelay(idx * 0.15), type: 'spring', stiffness: 100 }}
                    whileHover={{ 
                      y: -15, 
                      scale: 1.05,
                      rotateY: 5,
                      rotateX: 5,
                      boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.3)" 
                    }}
                    className={`relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-700 ${isDark ? 'bg-gray-900/80 border border-gray-700/50' : 'bg-white/80 border border-gray-200'} shadow-lg hover:shadow-3xl backdrop-blur-sm`}
                    onClick={() => navigate(item.link)}
                    style={{ perspective: 1000 }}
                  >
                    {/* Background Image with Enhanced Effect */}
                    <motion.div 
                      className="absolute inset-0 overflow-hidden"
                      initial={{ scale: 1.2, rotateY: 10, rotateX: 10 }}
                      whileInView={{ scale: 1, rotateY: 0, rotateX: 0 }}
                      transition={{ duration: getDuration(0.8), delay: getDelay(idx * 0.15 + 0.2) }}
                      whileHover={{ scale: 1.2, rotateY: -5, rotateX: -5 }}
                    >
                      <img 
                        src={item.img} 
                        alt={item.title} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1500 group-hover:scale-115 opacity-40 mix-blend-overlay"
                        loading="lazy"
                      />
                      
                      {/* Color Gradient Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-80`}></div>
                      
                      {/* Dark Overlay for Deeper Background */}
                      <div className="absolute inset-0 bg-black/30 opacity-60"></div>
                      
                      {/* Subtle Grid Pattern */}
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6Ii8+PHBhdGggZD0iTTMwIDBoMzB2MzBIMzB6TTAgMzBoMzB2MzBIMHoiLz48cGF0aCBkPSJNMCAwaDMwdjMwSDB6Ii8+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0zMCAwaDMwdjMwSDMweiIvPjxwYXRoIGZpbGw9IndoaXRlIiBkPSJNMzAgMzBoMzB2MzBIMzB6Ii8+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0wIDMwSDMwdjMwSDB6Ii8+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0wIDBoMzB2MzBIMHoiLz48L2c+PC9zdmc+')] opacity-10 dark:opacity-20"></div>
                    </motion.div>
                    
                    {/* Card Content with Enhanced Styling */}
                    <div className="relative z-10 p-6 flex flex-col items-center justify-center text-center h-full">
                      {/* Icon with Glow Effect */}
                      <motion.div 
                        initial={{ opacity: 0, scale: 0, rotate: -180 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 0.6, delay: idx * 0.15 + 0.4, type: 'spring', stiffness: 200 }}
                        whileHover={{ scale: 1.3, rotate: 10, boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.3)' }}
                        className={`w-14 h-14 rounded-full ${item.bg} ${item.color} flex items-center justify-center text-2xl mb-4 shadow-xl transition-all duration-500`}
                      >
                        <i className={`fas fa-${item.icon}`}></i>
                      </motion.div>
                      
                      {/* Title with Better Typography */}
                      <motion.h4 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: idx * 0.15 + 0.5 }}
                        whileHover={{ scale: 1.1, y: -2 }}
                        className={`text-lg font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent drop-shadow-lg transition-transform duration-300`}
                      >
                        {item.title}
                      </motion.h4>
                      
                      {/* Subtitle with Arrow Animation */}
                      <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: idx * 0.15 + 0.6 }}
                        className={`text-xs text-white/80 flex items-center gap-1.5 transition-all duration-300 group-hover:text-white/95`}
                      >
                        <span>探索更多</span>
                        <motion.i 
                          className="fas fa-arrow-right text-sm" 
                          animate={{ x: [0, 5, 0] }} 
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        ></motion.i>
                      </motion.p>
                    </div>
                    
                    {/* Decorative Corner Elements */}
                    <motion.div 
                      className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-white/30 rounded-tl-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-300"
                      initial={{ opacity: 0, scale: 0, rotate: -45 }}
                      whileInView={{ opacity: 0.5, scale: 1, rotate: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.15 + 0.7 }}
                      whileHover={{ opacity: 0.8, scale: 1.1, rotate: -5 }}
                    ></motion.div>
                    <motion.div 
                      className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-white/30 rounded-br-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-300"
                      initial={{ opacity: 0, scale: 0, rotate: 45 }}
                      whileInView={{ opacity: 0.5, scale: 1, rotate: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.15 + 0.8 }}
                      whileHover={{ opacity: 0.8, scale: 1.1, rotate: 5 }}
                    ></motion.div>
                  </motion.div>
                ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
