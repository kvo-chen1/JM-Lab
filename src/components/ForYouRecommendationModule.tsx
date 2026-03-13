import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { TianjinImage } from '@/components/TianjinStyleComponents';
import { personalizedRecommendationEngine } from '@/services/personalizedRecommendationEngine';
import { userPersonaService } from '@/services/userPersonaService';
import { RecommendationCandidate } from '@/types/recommendation';
import { toast } from 'sonner';
import { 
  Heart, 
  X, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  TrendingUp,
  Clock,
  Target,
  Lightbulb,
  RefreshCw
} from 'lucide-react';

interface ForYouRecommendationModuleProps {
  className?: string;
  autoSlide?: boolean;
  slideInterval?: number;
  showReasons?: boolean;
}

const ForYouRecommendationModule: React.FC<ForYouRecommendationModuleProps> = ({
  className = '',
  autoSlide = true,
  slideInterval = 5000,
  showReasons = true,
}) => {
  const { isDark } = useTheme();
  const { user, isAuthenticated } = React.useContext(AuthContext);
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState<RecommendationCandidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState<Array<{
    itemId: string;
    feedback: string;
    timestamp: Date;
  }>>([]);

  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);

  const getUserId = useCallback(() => {
    if (user?.id) return user.id;
    let deviceId = localStorage.getItem('jmzf_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('jmzf_device_id', deviceId);
    }
    return deviceId;
  }, [user]);

  const loadRecommendations = useCallback(async () => {
    setIsLoading(true);
    try {
      const userId = getUserId();
      const response = await personalizedRecommendationEngine.getRecommendations({
        context: {
          userId,
          timestamp: new Date().toISOString(),
          platform: 'web',
        },
        limit: 20,
      });

      setRecommendations(response.items);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getUserId]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  useEffect(() => {
    if (!autoSlide || recommendations.length === 0) return;

    slideTimerRef.current = setInterval(() => {
      if (!isTransitioning) {
        goToNext();
      }
    }, slideInterval);

    return () => {
      if (slideTimerRef.current) {
        clearInterval(slideTimerRef.current);
      }
    };
  }, [autoSlide, slideInterval, recommendations.length, isTransitioning]);

  const goToNext = useCallback(() => {
    if (recommendations.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev + 1) % recommendations.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [recommendations.length]);

  const goToPrev = useCallback(() => {
    if (recommendations.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev - 1 + recommendations.length) % recommendations.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [recommendations.length]);

  const handleDragEnd = (event: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 100;
    const velocity = info.velocity.x;

    if (velocity < -500 || info.offset.x < -threshold) {
      handleFeedback('dislike');
    } else if (velocity > 500 || info.offset.x > threshold) {
      handleFeedback('like');
    }
  };

  const handleFeedback = async (type: 'like' | 'dislike' | 'skip') => {
    const current = recommendations[currentIndex];
    if (!current || !user?.id) {
      goToNext();
      return;
    }

    try {
      await personalizedRecommendationEngine.recordFeedback(
        user.id,
        current.id,
        current.type as any,
        type === 'like' ? 'like' : type === 'dislike' ? 'dislike' : 'skip'
      );

      setFeedbackHistory(prev => [...prev, {
        itemId: current.id,
        feedback: type,
        timestamp: new Date(),
      }]);

      if (type === 'like') {
        toast.success('已记录您的喜好');
      } else if (type === 'dislike') {
        toast.success('我们会减少类似推荐');
      }

      goToNext();
    } catch (error) {
      console.error('Feedback error:', error);
      goToNext();
    }
  };

  const handleItemClick = async () => {
    const current = recommendations[currentIndex];
    if (!current) return;

    if (user?.id) {
      await userPersonaService.trackBehavior(
        user.id,
        current.id,
        current.type as any,
        'click',
        { source: 'for_you_module' }
      );
    }

    switch (current.type) {
      case 'work':
        navigate(`/post/${current.id}`);
        break;
      case 'creator':
        navigate(`/creator/${current.id}`);
        break;
      case 'event':
        navigate(`/events/${current.id}`);
        break;
      default:
        navigate('/');
    }
  };

  const getReasonIcon = (reason: string) => {
    if (reason.includes('兴趣') || reason.includes('标签')) return <Target className="w-4 h-4" />;
    if (reason.includes('热门') || reason.includes('人气')) return <TrendingUp className="w-4 h-4" />;
    if (reason.includes('新鲜') || reason.includes('最新')) return <Clock className="w-4 h-4" />;
    return <Lightbulb className="w-4 h-4" />;
  };

  const current = recommendations[currentIndex];

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className={`rounded-3xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
          <div className={`aspect-[4/5] ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} />
          <div className="p-6 space-y-4">
            <div className={`h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-3/4 animate-pulse`} />
            <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/2 animate-pulse`} />
          </div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 flex items-center justify-center shadow-xl"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              为你推荐
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              滑动或点击反馈，让推荐更懂你
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFeedbackPanel(!showFeedbackPanel)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              showFeedbackPanel
                ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white'
                : isDark
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              反馈记录
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadRecommendations}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isDark
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <RefreshCw className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      <div className="relative" ref={containerRef}>
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, x: 100 }}
              transition={{ duration: 0.3 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd}
              style={{ x, rotate, opacity }}
              onClick={handleItemClick}
              className={`relative rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing ${
                isDark ? 'bg-gray-800' : 'bg-white'
              } shadow-2xl`}
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <TianjinImage
                  src={current.metadata?.thumbnail || '/images/placeholder-image.jpg'}
                  alt={current.metadata?.title || '推荐内容'}
                  className="w-full h-full object-cover"
                  fallbackSrc="/images/placeholder-image.jpg"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold text-white ${
                      current.type === 'work' ? 'bg-gradient-to-r from-violet-500 to-purple-600' :
                      current.type === 'creator' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                      'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}>
                      {current.type === 'work' ? '作品' : current.type === 'creator' ? '创作者' : '活动'}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs bg-white/20 text-white backdrop-blur-sm">
                      {currentIndex + 1} / {recommendations.length}
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <motion.h3
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-white text-xl font-bold mb-2 line-clamp-2"
                  >
                    {current.metadata?.title || '推荐内容'}
                  </motion.h3>

                  {showReasons && current.reasons.length > 0 && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-wrap gap-2 mb-4"
                    >
                      {current.reasons.slice(0, 3).map((reason, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/20 text-white backdrop-blur-sm"
                        >
                          {getReasonIcon(reason)}
                          {reason}
                        </span>
                      ))}
                    </motion.div>
                  )}

                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    {current.metadata?.likes !== undefined && (
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {current.metadata.likes}
                      </span>
                    )}
                    {current.metadata?.views !== undefined && (
                      <span className="flex items-center gap-1">
                        <i className="fas fa-eye text-xs" />
                        {current.metadata.views}
                      </span>
                    )}
                    {current.metadata?.creatorName && (
                      <span className="truncate max-w-[150px]">
                        @{current.metadata.creatorName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 0.3, x: 0 }}
                  className="w-16 h-16 rounded-full bg-red-500/50 flex items-center justify-center"
                >
                  <X className="w-8 h-8 text-white" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 0.3, x: 0 }}
                  className="w-16 h-16 rounded-full bg-green-500/50 flex items-center justify-center"
                >
                  <Heart className="w-8 h-8 text-white" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center gap-4 mt-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToPrev}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDark
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            } transition-all shadow-lg`}
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleFeedback('dislike')}
            className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg`}
          >
            <X className="w-6 h-6" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleFeedback('like')}
            className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg`}
          >
            <Heart className="w-6 h-6" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToNext}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDark
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            } transition-all shadow-lg`}
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showFeedbackPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mt-6 rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
          >
            <div className="p-4">
              <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                最近反馈
              </h4>
              {feedbackHistory.length === 0 ? (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  暂无反馈记录
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {feedbackHistory.slice(-10).reverse().map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                      }`}
                    >
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {item.itemId.slice(0, 8)}...
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.feedback === 'like'
                          ? 'bg-green-100 text-green-600'
                          : item.feedback === 'dislike'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.feedback === 'like' ? '喜欢' : item.feedback === 'dislike' ? '不喜欢' : '跳过'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForYouRecommendationModule;
