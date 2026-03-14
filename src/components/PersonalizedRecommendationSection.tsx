import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { TianjinImage } from '@/components/TianjinStyleComponents';
import { personalizedRecommendationEngine } from '@/services/personalizedRecommendationEngine';
import { userPersonaService } from '@/services/userPersonaService';
import { RecommendationCandidate, RecommendationExplanation } from '@/types/recommendation';
import { BehaviorType, ContentType } from '@/types/userPersona';
import { toast } from 'sonner';
import { ChevronRight, Heart, X, MoreHorizontal, Sparkles, TrendingUp, User } from 'lucide-react';

interface PersonalizedRecommendationSectionProps {
  className?: string;
  limit?: number;
  showExplanation?: boolean;
  autoTrackBehavior?: boolean;
}

const PersonalizedRecommendationSection: React.FC<PersonalizedRecommendationSectionProps> = ({
  className = '',
  limit = 12,
  showExplanation = true,
  autoTrackBehavior = true,
}) => {
  const { isDark } = useTheme();
  const { user, isAuthenticated } = React.useContext(AuthContext);
  const navigate = useNavigate();
  
  const [recommendations, setRecommendations] = useState<RecommendationCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'works' | 'creators' | 'events'>('all');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showFeedbackMenu, setShowFeedbackMenu] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<RecommendationExplanation | null>(null);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const getUserId = useCallback(() => {
    if (user?.id) return user.id;
    let deviceId = localStorage.getItem('jmzf_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('jmzf_device_id', deviceId);
    }
    return deviceId;
  }, [user]);

  const loadRecommendations = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const userId = getUserId();
      const response = await personalizedRecommendationEngine.getRecommendations({
        context: {
          userId,
          timestamp: new Date().toISOString(),
          platform: 'web',
        },
        limit,
        filters: activeTab === 'all' ? undefined : {
          types: [activeTab.slice(0, -1)],
        },
      });

      setRecommendations(response.items);
      
      if (autoTrackBehavior && user?.id) {
        await userPersonaService.trackBehavior(
          user.id,
          'recommendation_session',
          'collection',
          'view',
          { itemCount: response.items.length }
        );
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      toast.error('加载推荐失败，请稍后重试');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getUserId, limit, activeTab, autoTrackBehavior, user?.id]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && autoTrackBehavior && user?.id) {
            const itemId = entry.target.getAttribute('data-item-id');
            if (itemId) {
              userPersonaService.trackBehavior(
                user.id,
                itemId,
                'work',
                'view',
                { source: 'recommendation', position: entry.target.getAttribute('data-position') }
              );
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [autoTrackBehavior, user?.id]);

  const handleItemClick = async (item: RecommendationCandidate) => {
    if (autoTrackBehavior && user?.id) {
      await userPersonaService.trackBehavior(
        user.id,
        item.id,
        item.type as ContentType,
        'click',
        { source: 'recommendation', reasons: item.reasons }
      );
    }

    switch (item.type) {
      case 'work':
        navigate(`/post/${item.id}`);
        break;
      case 'creator':
        navigate(`/creator/${item.id}`);
        break;
      case 'event':
        navigate(`/events/${item.id}`);
        break;
      default:
        navigate('/');
    }
  };

  const handleFeedback = async (
    e: React.MouseEvent,
    item: RecommendationCandidate,
    feedbackType: BehaviorType
  ) => {
    e.stopPropagation();
    
    if (!user?.id) {
      toast.error('请先登录');
      return;
    }

    await personalizedRecommendationEngine.recordFeedback(
      user.id,
      item.id,
      item.type as ContentType,
      feedbackType
    );

    if (feedbackType === 'like') {
      toast.success('感谢反馈，我们会推荐更多类似内容');
    } else if (feedbackType === 'dislike') {
      toast.success('我们会减少类似推荐');
      setRecommendations(prev => prev.filter(r => r.id !== item.id));
    } else if (feedbackType === 'hide') {
      toast.success('已隐藏该推荐');
      setRecommendations(prev => prev.filter(r => r.id !== item.id));
    }

    setShowFeedbackMenu(null);
  };

  const handleShowExplanation = async (e: React.MouseEvent, item: RecommendationCandidate) => {
    e.stopPropagation();
    
    if (!user?.id) return;

    const exp = await personalizedRecommendationEngine.getRecommendationExplanation(
      user.id,
      item.id
    );
    setExplanation(exp);
    setShowExplanationModal(true);
  };

  const filteredRecommendations = recommendations.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'works') return item.type === 'work';
    if (activeTab === 'creators') return item.type === 'creator';
    if (activeTab === 'events') return item.type === 'event';
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'work': return <Sparkles className="w-3 h-3" />;
      case 'creator': return <User className="w-3 h-3" />;
      case 'event': return <TrendingUp className="w-3 h-3" />;
      default: return <Sparkles className="w-3 h-3" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'work': return '作品';
      case 'creator': return '创作者';
      case 'event': return '活动';
      default: return '内容';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'work': return 'bg-gradient-to-r from-violet-500 to-purple-600';
      case 'creator': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'event': return 'bg-gradient-to-r from-emerald-500 to-teal-500';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500';
    }
  };

  if (!isAuthenticated && recommendations.length === 0 && !isLoading) {
    return (
      <div className={`max-w-7xl mx-auto px-4 md:px-6 mb-16 ${className}`}>
        <div className={`rounded-3xl p-8 ${isDark ? 'bg-gray-900/50' : 'bg-gradient-to-br from-blue-50 to-purple-50'} border ${isDark ? 'border-gray-700' : 'border-blue-100'}`}>
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              发现个性化推荐
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              登录后即可获取基于您兴趣的智能推荐
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium"
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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h2 className={`text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-700 to-blue-700 dark:from-white dark:via-purple-300 dark:to-blue-300 bg-clip-text text-transparent`}>
              为您推荐
            </h2>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              基于您的兴趣和行为智能推荐
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-gray-100/60 dark:bg-gray-800/60 backdrop-blur-sm">
            {[
              { value: 'all', label: '全部', icon: 'fa-table-cells' },
              { value: 'works', label: '作品', icon: 'fa-image' },
              { value: 'creators', label: '创作者', icon: 'fa-user' },
              { value: 'events', label: '活动', icon: 'fa-trophy' },
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
                <i className={`fas ${tab.icon} text-[13px] ${activeTab === tab.value ? 'text-blue-500 dark:text-blue-400' : ''}`} />
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => loadRecommendations(true)}
            disabled={isRefreshing}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
              isDark
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
                : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 shadow-sm border border-gray-200'
            } ${isRefreshing ? 'animate-spin' : ''}`}
            title="刷新推荐"
          >
            <i className="fas fa-rotate text-sm" />
          </motion.button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
            >
              <div className={`aspect-square ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} />
              <div className="p-4 space-y-3">
                <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg w-3/4 animate-pulse`} />
                <div className="flex gap-2">
                  <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-16 animate-pulse`} />
                  <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-16 animate-pulse`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredRecommendations.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredRecommendations.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              whileHover={{ y: -10, scale: 1.02 }}
              onHoverStart={() => setHoveredItem(item.id)}
              onHoverEnd={() => setHoveredItem(null)}
              onClick={() => handleItemClick(item)}
              data-item-id={item.id}
              data-position={idx}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ${
                isDark ? 'bg-gray-800' : 'bg-white'
              } ${hoveredItem === item.id ? 'shadow-2xl shadow-purple-500/20' : 'shadow-lg shadow-gray-200/50 dark:shadow-none'}`}
            >
              <div className="relative aspect-square overflow-hidden">
                <TianjinImage
                  src={item.metadata?.thumbnail || '/images/placeholder-image.jpg'}
                  alt={item.metadata?.title || '推荐内容'}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                  fallbackSrc="/images/placeholder-image.jpg"
                  loading="lazy"
                />

                <div className="absolute top-3 left-3">
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 + 0.2 }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg text-white flex items-center gap-1.5 ${getTypeColor(item.type)}`}
                  >
                    {getTypeIcon(item.type)}
                    {getTypeName(item.type)}
                  </motion.span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-4">
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={hoveredItem === item.id ? { y: 0, opacity: 1 } : { y: 10, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-white"
                  >
                    <h4 className="text-sm font-semibold mb-1 line-clamp-1">
                      {item.metadata?.title || '未命名'}
                    </h4>
                    {item.reasons.length > 0 && showExplanation && (
                      <p className="text-xs leading-relaxed line-clamp-2 text-white/80">
                        {item.reasons[0]}
                      </p>
                    )}
                  </motion.div>
                </div>

                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleFeedback(e, item, 'like')}
                    className="w-8 h-8 rounded-full bg-white/95 text-gray-600 hover:bg-gradient-to-br hover:from-red-500 hover:to-pink-500 hover:text-white flex items-center justify-center text-sm transition-all duration-300 shadow-lg"
                    title="喜欢"
                  >
                    <Heart className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleFeedback(e, item, 'hide')}
                    className="w-8 h-8 rounded-full bg-white/95 text-gray-600 hover:bg-gray-800 hover:text-white flex items-center justify-center text-sm transition-all duration-300 shadow-lg"
                    title="不感兴趣"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                  {showExplanation && (
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleShowExplanation(e, item)}
                      className="w-8 h-8 rounded-full bg-white/95 text-gray-600 hover:bg-gray-800 hover:text-white flex items-center justify-center text-sm transition-all duration-300 shadow-lg"
                      title="为什么推荐"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>

              <div className="p-4">
                <h3 className={`font-semibold text-sm mb-3 line-clamp-1 transition-colors duration-300 min-h-[1.25rem] ${
                  isDark ? 'text-white group-hover:text-purple-300' : 'text-gray-900 group-hover:text-purple-600'
                }`}>
                  {item.metadata?.title || '未命名'}
                </h3>

                {item.metadata && (
                  <div className="flex items-center gap-4 text-xs">
                    {item.metadata.likes !== undefined && (
                      <span className={`flex items-center gap-1.5 transition-colors duration-300 ${
                        isDark ? 'text-gray-400 group-hover:text-red-400' : 'text-gray-500 group-hover:text-red-500'
                      }`}>
                        <Heart className="w-3 h-3 text-red-400" />
                        <span className="font-medium">{item.metadata.likes}</span>
                      </span>
                    )}
                    {item.metadata.views !== undefined && (
                      <span className={`flex items-center gap-1.5 transition-colors duration-300 ${
                        isDark ? 'text-gray-400 group-hover:text-blue-400' : 'text-gray-500 group-hover:text-blue-500'
                      }`}>
                        <i className="fas fa-eye text-blue-400 text-[10px]" />
                        <span className="font-medium">{item.metadata.views}</span>
                      </span>
                    )}
                    {item.metadata.followerCount !== undefined && (
                      <span className={`flex items-center gap-1.5 transition-colors duration-300 ${
                        isDark ? 'text-gray-400 group-hover:text-emerald-400' : 'text-gray-500 group-hover:text-emerald-500'
                      }`}>
                        <User className="w-3 h-3 text-emerald-400" />
                        <span className="font-medium">{item.metadata.followerCount} 粉丝</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>
          ))}

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
              <span>查看更多</span>
              <ChevronRight className="w-4 h-4 text-[#C02C38]" />
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
            <Sparkles className="w-8 h-8 text-gray-400" />
          </motion.div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            暂无推荐内容
          </h3>
          <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            继续探索平台内容，我们会为您提供更精准的推荐
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/square')}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-semibold"
          >
            <i className="fas fa-compass mr-2" />
            去发现
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {showExplanationModal && explanation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowExplanationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`max-w-md w-full rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  推荐理由
                </h3>
                <button
                  onClick={() => setShowExplanationModal(false)}
                  className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-purple-50'}`}>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {explanation.primaryReason}
                  </p>
                </div>

                {explanation.secondaryReasons.length > 0 && (
                  <div>
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      其他因素
                    </p>
                    <ul className="space-y-1">
                      {explanation.secondaryReasons.map((reason, idx) => (
                        <li key={idx} className={`text-sm flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          <ChevronRight className="w-4 h-4 text-purple-500" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {explanation.contributingFactors.length > 0 && (
                  <div>
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      影响因素
                    </p>
                    <div className="space-y-2">
                      {explanation.contributingFactors.map((factor, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {factor.factor}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className={`w-24 h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                                style={{ width: `${factor.weight * 100}%` }}
                              />
                            </div>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {Math.round(factor.weight * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`text-center pt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p className="text-xs">
                    推荐置信度: {Math.round(explanation.confidence * 100)}%
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={loadMoreRef} />
    </div>
  );
};

export default PersonalizedRecommendationSection;
