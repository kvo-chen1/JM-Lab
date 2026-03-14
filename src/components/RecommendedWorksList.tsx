import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { TianjinImage } from '@/components/TianjinStyleComponents';
import { personalizedRecommendationEngine } from '@/services/personalizedRecommendationEngine';
import { userPersonaService } from '@/services/userPersonaService';
import { RecommendationCandidate } from '@/types/recommendation';
import { BehaviorType } from '@/types/userPersona';
import { toast } from 'sonner';
import { Heart, MessageCircle, Share2, Bookmark, Play, Volume2, VolumeX } from 'lucide-react';

interface RecommendedWorksListProps {
  className?: string;
  limit?: number;
  layout?: 'grid' | 'list' | 'waterfall';
  showInteraction?: boolean;
  showReason?: boolean;
  autoPlay?: boolean;
}

const RecommendedWorksList: React.FC<RecommendedWorksListProps> = ({
  className = '',
  limit = 12,
  layout = 'grid',
  showInteraction = true,
  showReason = true,
  autoPlay = false,
}) => {
  const { isDark } = useTheme();
  const { user, isAuthenticated } = React.useContext(AuthContext);
  const navigate = useNavigate();

  const [works, setWorks] = useState<RecommendationCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredWork, setHoveredWork] = useState<string | null>(null);
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set());
  const [interactionState, setInteractionState] = useState<Record<string, {
    liked?: boolean;
    saved?: boolean;
  }>>({});

  const observerRef = useRef<IntersectionObserver | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const getUserId = useCallback(() => {
    if (user?.id) return user.id;
    let deviceId = localStorage.getItem('jmzf_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('jmzf_device_id', deviceId);
    }
    return deviceId;
  }, [user]);

  const loadWorks = useCallback(async () => {
    setIsLoading(true);
    try {
      const userId = getUserId();
      const response = await personalizedRecommendationEngine.getRecommendations({
        context: {
          userId,
          timestamp: new Date().toISOString(),
          platform: 'web',
        },
        limit: limit * 2,
        filters: {
          types: ['work'],
        },
      });

      setWorks(response.items.slice(0, limit));
    } catch (error) {
      console.error('Failed to load works:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getUserId, limit]);

  useEffect(() => {
    loadWorks();
  }, [loadWorks]);

  useEffect(() => {
    if (!autoPlay) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const videoId = entry.target.getAttribute('data-video-id');
          const video = videoRefs.current.get(videoId || '');
          
          if (video) {
            if (entry.isIntersecting) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [autoPlay]);

  const handleWorkClick = async (work: RecommendationCandidate) => {
    if (user?.id) {
      await userPersonaService.trackBehavior(
        user.id,
        work.id,
        'work',
        'click',
        { source: 'recommended_works', reasons: work.reasons }
      );
    }
    navigate(`/post/${work.id}`);
  };

  const handleInteraction = async (
    e: React.MouseEvent,
    work: RecommendationCandidate,
    type: 'like' | 'comment' | 'share' | 'save'
  ) => {
    e.stopPropagation();

    if (!user?.id) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }

    const behaviorMap: Record<string, BehaviorType> = {
      like: 'like',
      comment: 'comment',
      share: 'share',
      save: 'favorite',
    };

    try {
      await userPersonaService.trackBehavior(
        user.id,
        work.id,
        'work',
        behaviorMap[type],
        { source: 'recommended_works' }
      );

      setInteractionState(prev => ({
        ...prev,
        [work.id]: {
          ...prev[work.id],
          [type === 'save' ? 'saved' : type === 'like' ? 'liked' : type]: 
            !(prev[work.id]?.[type === 'save' ? 'saved' : type === 'like' ? 'liked' : type]),
        },
      }));

      if (type === 'like') {
        toast.success(interactionState[work.id]?.liked ? '已取消点赞' : '点赞成功');
      } else if (type === 'save') {
        toast.success(interactionState[work.id]?.saved ? '已取消收藏' : '收藏成功');
      } else if (type === 'share') {
        const url = `${window.location.origin}/post/${work.id}`;
        navigator.clipboard.writeText(url);
        toast.success('链接已复制到剪贴板');
      }
    } catch (error) {
      console.error('Interaction error:', error);
      toast.error('操作失败');
    }
  };

  const toggleMute = (e: React.MouseEvent, workId: string) => {
    e.stopPropagation();
    setMutedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workId)) {
        newSet.delete(workId);
      } else {
        newSet.add(workId);
      }
      return newSet;
    });
  };

  const isVideo = (work: RecommendationCandidate) => {
    return work.metadata?.videoUrl || work.metadata?.type === 'video';
  };

  const renderWorkCard = (work: RecommendationCandidate, idx: number) => {
    const metadata = work.metadata || {};
    const isVideoWork = isVideo(work);
    const isMuted = mutedVideos.has(work.id);
    const state = interactionState[work.id] || {};

    return (
      <motion.div
        key={work.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
        whileHover={{ y: -5, scale: 1.01 }}
        onHoverStart={() => setHoveredWork(work.id)}
        onHoverEnd={() => setHoveredWork(null)}
        onClick={() => handleWorkClick(work)}
        className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-md hover:shadow-xl`}
        data-video-id={isVideoWork ? work.id : undefined}
      >
        <div className={`relative overflow-hidden ${
          layout === 'waterfall' ? 'aspect-auto' : 'aspect-square'
        }`}>
          {isVideoWork ? (
            <div className="relative w-full h-full">
              <video
                ref={(el) => {
                  if (el) videoRefs.current.set(work.id, el);
                }}
                src={metadata.videoUrl || metadata.video_url}
                className="w-full h-full object-cover"
                muted={isMuted}
                loop
                playsInline
                poster={metadata.thumbnail}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              <div className="absolute top-3 left-3">
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  视频
                </span>
              </div>

              <button
                onClick={(e) => toggleMute(e, work.id)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <>
              <TianjinImage
                src={metadata.thumbnail || '/images/placeholder-image.jpg'}
                alt={metadata.title || '作品'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                fallbackSrc="/images/placeholder-image.jpg"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
              {metadata.title || '未命名作品'}
            </h4>
            {showReason && work.reasons.length > 0 && (
              <p className="text-white/80 text-xs line-clamp-1">
                {work.reasons[0]}
              </p>
            )}
          </div>

          {showInteraction && (
            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => handleInteraction(e, work, 'like')}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                  state.liked
                    ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white'
                    : 'bg-white/95 text-gray-600 hover:bg-gradient-to-br hover:from-red-500 hover:to-pink-500 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${state.liked ? 'fill-current' : ''}`} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => handleInteraction(e, work, 'save')}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                  state.saved
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                    : 'bg-white/95 text-gray-600 hover:bg-gradient-to-br hover:from-amber-500 hover:to-orange-500 hover:text-white'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${state.saved ? 'fill-current' : ''}`} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => handleInteraction(e, work, 'share')}
                className="w-8 h-8 rounded-full bg-white/95 text-gray-600 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all duration-300 shadow-lg"
              >
                <Share2 className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>

        <div className="p-3">
          <h4 className={`font-medium text-sm mb-2 line-clamp-1 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {metadata.title || '未命名作品'}
          </h4>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs">
              {metadata.likes !== undefined && (
                <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Heart className="w-3 h-3" />
                  {metadata.likes}
                </span>
              )}
              {metadata.views !== undefined && (
                <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <i className="fas fa-eye text-[10px]" />
                  {metadata.views}
                </span>
              )}
              {metadata.comments !== undefined && (
                <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <MessageCircle className="w-3 h-3" />
                  {metadata.comments}
                </span>
              )}
            </div>

            {metadata.creatorName && (
              <span className={`text-xs truncate max-w-[100px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                @{metadata.creatorName}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className={`grid gap-4 ${
          layout === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
          layout === 'list' ? 'grid-cols-1' :
          'grid-cols-2 md:grid-cols-3'
        }`}>
          {[...Array(limit)].map((_, i) => (
            <div
              key={i}
              className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
            >
              <div className={`aspect-square ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} />
              <div className="p-3 space-y-2">
                <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-3/4 animate-pulse`} />
                <div className="flex gap-2">
                  <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-12 animate-pulse`} />
                  <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-12 animate-pulse`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (works.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className={`grid gap-4 ${
        layout === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
        layout === 'list' ? 'grid-cols-1' :
        'grid-cols-2 md:grid-cols-3'
      }`}>
        {works.map((work, idx) => renderWorkCard(work, idx))}
      </div>
    </div>
  );
};

export default RecommendedWorksList;
