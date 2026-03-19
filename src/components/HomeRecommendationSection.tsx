import React, { useState, useEffect, useCallback, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { TianjinImage } from '@/components/TianjinStyleComponents';
import recommendationService, {
  RecommendedItem,
  RecommendationFeedbackType
} from '@/services/recommendationService';
import homeRecommendationService, {
  HomeRecommendationItem
} from '@/services/homeRecommendationService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
// import PostDetailModal from '@/components/PostDetailModal';
import postsApi from '@/services/postService';
import { workService } from '@/services/apiService';
import { eventService } from '@/services/eventService';

// 视频卡片组件 - 直接自动播放
const VideoCard: React.FC<{
  videoUrl: string;
  title: string;
}> = ({ videoUrl, title }) => {
  return (
    <div className="relative w-full h-full bg-gray-900">
      <video
        src={videoUrl}
        className="w-full h-full object-cover"
        muted
        playsInline
        loop
        autoPlay
        preload="auto"
      />
      {/* 视频标识 */}
      <div className="absolute top-3 left-3 z-10">
        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg flex items-center gap-1.5">
          <i className="fas fa-video text-[10px]"></i>
          视频
        </span>
      </div>
    </div>
  );
};

interface HomeRecommendationSectionProps {
  className?: string;
}

const HomeRecommendationSection: React.FC<HomeRecommendationSectionProps> = ({ className = '' }) => {
  const { isDark } = useTheme();
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'challenges'>('all');
  const [feedbackStatus, setFeedbackStatus] = useState<Record<string, RecommendationFeedbackType>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // 已移除 PostDetailModal 弹窗状态，点击作品直接跳转到独立页面
  // const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  // const [isModalOpen, setIsModalOpen] = useState(false);
  // const [modalLoading, setModalLoading] = useState(false);
  // const [modalError, setModalError] = useState<string | null>(null);

  // 获取用户ID（未登录用户使用设备ID）
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

  // 转换后台推荐项为前端推荐格式
  const transformHomeRecommendation = (item: HomeRecommendationItem): RecommendedItem => {
    return {
      id: item.item_id,
      type: item.item_type === 'work' ? 'post' : 
            item.item_type === 'event' ? 'challenge' : 
            item.item_type === 'template' ? 'template' : 'challenge',
      title: item.title,
      description: item.description || '',
      thumbnail: item.thumbnail || '',
      metadata: {
        thumbnail: item.thumbnail,
        category: item.metadata?.category,
        order_index: item.order_index,
      },
      score: 100 - (item.order_index || 0), // 根据排序索引计算分数，越靠前分数越高
      reason: '运营推荐',
      trend: item.order_index < 3 ? 'up' : item.order_index < 6 ? 'stable' : 'new',
    };
  };

  // 加载推荐内容
  const loadRecommendations = useCallback(async () => {
    setIsLoading(true);
    try {
      const userId = getUserId();
      
      // 1. 首先获取后台配置的固定推荐位
      let fixedRecommendations: RecommendedItem[] = [];
      try {
        console.log('🔄 从后台获取固定推荐位...');
        const homeRecommendations = await homeRecommendationService.getActiveRecommendations();
        console.log('✅ 获取到固定推荐位:', homeRecommendations.length, '个');
        
        if (homeRecommendations.length > 0) {
          fixedRecommendations = homeRecommendations
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            .map(transformHomeRecommendation);
        }
      } catch (apiError) {
        console.warn('⚠️ 从后台获取固定推荐位失败:', apiError);
      }

      // 2. 获取算法推荐数据（用于补充固定推荐位不足的情况）
      try {
        console.log('🔄 从服务器获取最新作品数据...');
        const freshWorks = await workService.getWorks({ limit: 50 });
        console.log('✅ 获取到最新作品:', freshWorks.length, '个');

        if (Array.isArray(freshWorks) && freshWorks.length > 0) {
          localStorage.setItem('works', JSON.stringify(freshWorks));
          localStorage.setItem('jmzf_works', JSON.stringify(freshWorks));
        }
      } catch (apiError) {
        console.warn('⚠️ 从服务器获取作品失败，使用缓存数据:', apiError);
      }

      // 尝试从服务器获取最新活动数据
      let hasNewData = false;
      try {
        console.log('🔄 从服务器获取最新活动数据...');
        const freshEvents = await eventService.getPublishedEvents();
        console.log('✅ 获取到最新活动:', freshEvents.length, '个');

        if (Array.isArray(freshEvents) && freshEvents.length > 0) {
          const challengesData = freshEvents.map(event => ({
            id: event.id,
            title: event.title,
            featuredImage: event.imageUrl,
            participants: 0,
            submissionCount: 0,
            views: 0,
            startDate: event.startTime,
            endDate: event.endTime,
            description: event.description,
            category: event.category,
            tags: event.tags,
            status: event.status,
            location: event.location
          }));
          localStorage.setItem('challenges', JSON.stringify(challengesData));
          localStorage.setItem('jmzf_challenges', JSON.stringify(challengesData));
          hasNewData = true;
        }
      } catch (apiError) {
        console.warn('⚠️ 从服务器获取活动失败，使用缓存数据:', apiError);
      }

      // 如果有新数据，清除推荐缓存
      if (hasNewData) {
        const cacheKey = `jmzf_recommendations_${userId}_hybrid_12_diverse`;
        localStorage.removeItem(cacheKey);
        console.log('🗑️ 已清除推荐缓存，将重新生成推荐');
      }

      // 3. 计算需要补充的算法推荐数量
      const targetCount = 12;
      const fixedCount = fixedRecommendations.length;
      const remainingCount = Math.max(0, targetCount - fixedCount);
      
      console.log('推荐位统计:', { fixedCount, remainingCount, targetCount });

      // 4. 获取算法推荐（排除已在固定推荐位中的项目）
      let algorithmicRecommendations: RecommendedItem[] = [];
      if (remainingCount > 0) {
        const fixedIds = new Set(fixedRecommendations.map(item => item.id));
        
        const algorithmicItems = recommendationService.getRecommendations(userId, {
          strategy: 'hybrid',
          limit: targetCount,
          includeDiverse: true,
          recentDays: 30
        });
        
        // 过滤掉已在固定推荐位中的项目，以及没有有效缩略图的项目
        algorithmicRecommendations = algorithmicItems
          .filter(item => !fixedIds.has(item.id))
          .filter(item => {
            if (item.type !== 'post') return true;
            const thumbnail = item.thumbnail || item.metadata?.thumbnail || '';
            return thumbnail && typeof thumbnail === 'string' && thumbnail.trim() !== '';
          })
          .slice(0, remainingCount);
        
        console.log('算法推荐补充:', algorithmicRecommendations.length, '项');
      }

      // 5. 合并固定推荐位和算法推荐（固定推荐位优先）
      const mergedRecommendations = [...fixedRecommendations, ...algorithmicRecommendations];
      
      console.log('最终推荐结果:', mergedRecommendations.length, '项', {
        fixed: fixedCount,
        algorithmic: algorithmicRecommendations.length
      });
      
      setRecommendations(mergedRecommendations);
    } catch (error) {
      console.error('加载推荐失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getUserId]);

  // 刷新推荐
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // 清除缓存强制重新生成
    const userId = getUserId();
    const cacheKey = `jmzf_recommendations_${userId}_hybrid_12_diverse`;
    localStorage.removeItem(cacheKey);
    
    await loadRecommendations();
    setIsRefreshing(false);
    toast.success('推荐已更新');
  };

  // 初始加载
  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  // 订阅后台推荐位变化（实时同步）
  useEffect(() => {
    console.log('🔔 订阅后台推荐位变化...');
    
    const subscription = supabase
      .channel('home_recommendations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'home_recommendations'
        },
        (payload) => {
          console.log('📡 收到推荐位变更通知:', payload.eventType, payload);
          // 延迟刷新，避免频繁更新
          setTimeout(() => {
            loadRecommendations();
            toast.info('推荐位已更新');
          }, 500);
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 取消订阅后台推荐位变化');
      subscription.unsubscribe();
    };
  }, [loadRecommendations]);

  // 筛选推荐内容
  const filteredRecommendations = activeTab === 'all'
    ? recommendations.slice(0, 12)
    : recommendations
        .filter(item => item.type === activeTab.slice(0, -1) as 'post' | 'challenge')
        .slice(0, 12);

  // 处理推荐项点击
  const handleItemClick = (item: RecommendedItem) => {
    // 记录点击行为
    recommendationService.recordRecommendationClick(getUserId(), item);

    // 根据类型处理点击
    switch (item.type) {
      case 'post':
        // 跳转到作品详情独立页面
        navigate(`/post/${item.id}`);
        break;
      case 'challenge':
        navigate('/events');
        break;
      case 'template':
        navigate('/create');
        break;
      default:
        navigate('/');
    }
  };

  // 处理反馈
  const handleFeedback = (e: React.MouseEvent, item: RecommendedItem, feedbackType: RecommendationFeedbackType) => {
    e.stopPropagation();

    recommendationService.recordRecommendationFeedback(getUserId(), {
      itemId: item.id,
      itemType: item.type,
      feedbackType
    });

    setFeedbackStatus(prev => ({
      ...prev,
      [item.id]: feedbackType
    }));

    if (feedbackType === 'hide') {
      setRecommendations(prev => prev.filter(i => i.id !== item.id));
      toast.success('已隐藏该推荐');
    } else if (feedbackType === 'like') {
      toast.success('感谢您的反馈，我们会推荐更多类似内容');
    } else if (feedbackType === 'dislike') {
      toast.success('感谢您的反馈，我们会减少类似推荐');
    }
  };

  // 处理点赞
  const handleLike = async (id: string) => {
    if (!user) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    try {
      await postsApi.likeWork(id, user.id);
      toast.success('操作成功');
    } catch (error) {
      toast.error('操作失败，请稍后重试');
    }
  };

  // 处理评论
  const handleComment = async (id: string, content: string) => {
    if (!user) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    try {
      await postsApi.addWorkComment(id, user.id, content);
      toast.success('评论成功');
      return Promise.resolve();
    } catch (error) {
      toast.error('评论失败，请稍后重试');
      return Promise.reject(error);
    }
  };

  // 处理分享
  const handleShare = (id: string) => {
    // 复制链接到剪贴板
    const url = `${window.location.origin}/square?post=${id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('链接已复制到剪贴板');
    }).catch(() => {
      toast.error('复制失败，请手动复制');
    });
  };

  // 已移除 handleCloseModal，弹窗已改为独立页面跳转

  // 获取类型名称
  const getTypeName = (type: string): string => {
    switch (type) {
      case 'post': return '作品';
      case 'challenge': return '津脉活动';
      case 'template': return '模板';
      default: return '内容';
    }
  };

  // 获取类型颜色 - 更精致的渐变配色
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'post': return 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-purple-500/30';
      case 'challenge': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-500/30';
      case 'template': return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
    }
  };

  // 获取类型图标
  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'post': return 'fa-image';
      case 'challenge': return 'fa-trophy';
      case 'template': return 'fa-layer-group';
      default: return 'fa-circle';
    }
  };

  if (!isAuthenticated && recommendations.length === 0 && !isLoading) {
    return (
      <div className={`max-w-7xl mx-auto px-4 md:px-6 mb-16 ${className}`}>
        <div className={`rounded-3xl p-8 ${isDark ? 'bg-gray-900/50' : 'bg-gradient-to-br from-blue-50 to-purple-50'} border ${isDark ? 'border-gray-700' : 'border-blue-100'}`}>
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
            >
              <i className="fas fa-magic text-white text-2xl"></i>
            </motion.div>
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              发现个性化推荐
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              登录后即可获取基于您兴趣的智能推荐
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition-all"
            >
              立即登录
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 md:px-6 mb-16 ${className}`}>
      {/* 标题栏 - 全新设计 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/30"
          >
            <i className="fas fa-sparkles text-white text-lg"></i>
            {/* 装饰光晕 */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 blur-xl opacity-50 -z-10"></div>
          </motion.div>
          <div>
            <h2 className={`text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-700 to-blue-700 dark:from-white dark:via-purple-300 dark:to-blue-300 bg-clip-text text-transparent`}>
              为您推荐
            </h2>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              基于您的浏览和喜好智能推荐
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 类型筛选 - 简洁标签式设计 */}
          <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-gray-100/60 dark:bg-gray-800/60 backdrop-blur-sm">
            {[
              { value: 'all', label: '全部', icon: 'fa-table-cells' },
              { value: 'posts', label: '作品', icon: 'fa-image' },
              { value: 'challenges', label: '活动', icon: 'fa-trophy' }
            ].map(tab => (
              <motion.button
                key={tab.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.value as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.value 
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : isDark 
                      ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/50' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
              >
                <i className={`fas ${tab.icon} text-[13px] ${activeTab === tab.value ? 'text-blue-500 dark:text-blue-400' : ''}`}></i>
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>

          {/* 刷新按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
              isDark 
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700' 
                : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 shadow-sm border border-gray-200'
            } ${isRefreshing ? 'animate-spin' : ''}`}
            title="刷新推荐"
          >
            <i className="fas fa-rotate text-sm"></i>
          </motion.button>
        </div>
      </div>

      {/* 推荐内容网格 */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
            >
              <div className={`aspect-square ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
              <div className="p-4 space-y-3">
                <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg w-3/4 animate-pulse`}></div>
                <div className="flex gap-2">
                  <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-16 animate-pulse`}></div>
                  <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-16 animate-pulse`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredRecommendations.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredRecommendations.map((item, idx) => {
            // 调试：检查异常数据
            if (!item.title || item.title === '1') {
              console.warn('推荐项数据异常:', { id: item.id, title: item.title, type: item.type, item });
            }
            return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ y: -10, scale: 1.02 }}
              onHoverStart={() => setHoveredCard(item.id)}
              onHoverEnd={() => setHoveredCard(null)}
              onClick={() => handleItemClick(item)}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ${
                isDark ? 'bg-gray-800' : 'bg-white'
              } ${hoveredCard === item.id ? 'shadow-2xl shadow-purple-500/20' : 'shadow-lg shadow-gray-200/50 dark:shadow-none'}`}
            >
              {/* 缩略图容器 */}
              <div className="relative aspect-square overflow-hidden">
                {/* 判断是否为视频作品 - 从 metadata 中获取 videoUrl */}
                {item.type === 'post' && (item.metadata?.videoUrl || item.metadata?.video_url) ? (
                  <VideoCard
                    videoUrl={item.metadata?.videoUrl || item.metadata?.video_url}
                    title={item.title}
                  />
                ) : (
                  <>
                    <TianjinImage
                      src={item.thumbnail || '/images/placeholder-image.jpg'}
                      alt={item.title}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                      fallbackSrc="/images/placeholder-image.jpg"
                      loading="lazy"
                    />
                    {/* 类型标签 - 更精致的设计 */}
                    <div className="absolute top-3 left-3">
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 + 0.2 }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg ${getTypeColor(item.type)} flex items-center gap-1.5`}
                      >
                        <i className={`fas ${getTypeIcon(item.type)} text-[10px]`}></i>
                        {getTypeName(item.type)}
                      </motion.span>
                    </div>
                  </>
                )}

                {/* 渐变遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* 作品标题与描述（悬停显示） */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-4">
                  <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={hoveredCard === item.id ? { y: 0, opacity: 1 } : { y: 10, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-white"
                  >
                    <h4 className="text-sm font-semibold mb-1 line-clamp-1">{item.title || '未命名作品'}</h4>
                    <p className="text-xs leading-relaxed line-clamp-2 text-white/80">
                      {item.metadata?.description || item.metadata?.content || '暂无描述'}
                    </p>
                  </motion.div>
                </div>

                {/* 反馈按钮（悬停显示） */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleFeedback(e, item, 'like')}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 shadow-lg ${
                      feedbackStatus[item.id] === 'like'
                        ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white'
                        : 'bg-white/95 text-gray-600 hover:bg-gradient-to-br hover:from-red-500 hover:to-pink-500 hover:text-white'
                    }`}
                    title="喜欢"
                  >
                    <i className="fas fa-heart"></i>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleFeedback(e, item, 'hide')}
                    className="w-8 h-8 rounded-full bg-white/95 text-gray-600 hover:bg-gray-800 hover:text-white flex items-center justify-center text-sm transition-all duration-300 shadow-lg"
                    title="不感兴趣"
                  >
                    <i className="fas fa-times"></i>
                  </motion.button>
                </div>
              </div>

              {/* 内容信息 - 更精致的布局 */}
              <div className="p-4">
                <h3 className={`font-semibold text-sm mb-3 line-clamp-1 transition-colors duration-300 min-h-[1.25rem] ${
                  isDark ? 'text-white group-hover:text-purple-300' : 'text-gray-900 group-hover:text-purple-600'
                }`}>
                  {item.title || '未命名作品'}
                </h3>
                
                {/* 互动数据 - 更美观的展示 */}
                {item.metadata && (
                  <div className="flex items-center gap-4 text-xs">
                    {item.metadata.likes !== undefined && (
                      <span className={`flex items-center gap-1.5 transition-colors duration-300 ${
                        isDark ? 'text-gray-400 group-hover:text-red-400' : 'text-gray-500 group-hover:text-red-500'
                      }`}>
                        <i className="fas fa-heart text-red-400"></i>
                        <span className="font-medium">{item.metadata.likes}</span>
                      </span>
                    )}
                    {item.metadata.views !== undefined && (
                      <span className={`flex items-center gap-1.5 transition-colors duration-300 ${
                        isDark ? 'text-gray-400 group-hover:text-blue-400' : 'text-gray-500 group-hover:text-blue-500'
                      }`}>
                        <i className="fas fa-eye text-blue-400"></i>
                        <span className="font-medium">{item.metadata.views}</span>
                      </span>
                    )}
                    {item.metadata.participants !== undefined && (
                      <span className={`flex items-center gap-1.5 transition-colors duration-300 ${
                        isDark ? 'text-gray-400 group-hover:text-emerald-400' : 'text-gray-500 group-hover:text-emerald-500'
                      }`}>
                        <i className="fas fa-users text-emerald-400"></i>
                        <span className="font-medium">{item.metadata.participants}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 底部装饰线 */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </motion.div>
          )})}

          {/* 查看更多作品按钮 */}
          <div className="col-span-2 md:col-span-3 lg:col-span-4 flex justify-center mt-4">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/square')}
              className={`px-8 py-3 rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                isDark
                  ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                  : 'bg-white text-gray-900 hover:bg-gray-50 shadow-lg border border-gray-200'
              }`}
            >
              <span>查看更多作品</span>
              <i className="fas fa-arrow-right text-[#C02C38]"></i>
            </motion.button>
          </div>
        </div>
      ) : (
        <div className={`text-center py-16 rounded-3xl ${isDark ? 'bg-gray-800/50' : 'bg-gradient-to-br from-gray-50 to-blue-50/50'} border border-dashed ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center"
          >
            <i className="fas fa-compass text-gray-400 text-3xl"></i>
          </motion.div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            暂无推荐内容
          </h3>
          <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            继续探索平台内容，我们会为您提供更精准的推荐
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/square')}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-semibold hover:shadow-lg transition-all"
          >
            <i className="fas fa-compass mr-2"></i>
            去发现
          </motion.button>
        </div>
      )}

      {/* 已移除 PostDetailModal 弹窗，点击作品直接跳转到独立页面 /post/:id */}
    </div>
  );
};

export default HomeRecommendationSection;
