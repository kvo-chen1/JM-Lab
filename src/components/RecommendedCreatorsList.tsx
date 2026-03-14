import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { personalizedRecommendationEngine } from '@/services/personalizedRecommendationEngine';
import { userPersonaService } from '@/services/userPersonaService';
import { RecommendationCandidate } from '@/types/recommendation';
import { toast } from 'sonner';
import { User, Plus, Check, ChevronRight, Sparkles } from 'lucide-react';

interface RecommendedCreatorsListProps {
  className?: string;
  limit?: number;
  layout?: 'horizontal' | 'grid';
  showFollowButton?: boolean;
}

const RecommendedCreatorsList: React.FC<RecommendedCreatorsListProps> = ({
  className = '',
  limit = 6,
  layout = 'horizontal',
  showFollowButton = true,
}) => {
  const { isDark } = useTheme();
  const { user, isAuthenticated } = React.useContext(AuthContext);
  const navigate = useNavigate();

  const [creators, setCreators] = useState<RecommendationCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [hoveredCreator, setHoveredCreator] = useState<string | null>(null);

  const loadCreators = useCallback(async () => {
    setIsLoading(true);
    try {
      const userId = user?.id || localStorage.getItem('jmzf_device_id') || 'anonymous';
      
      const response = await personalizedRecommendationEngine.getRecommendations({
        context: {
          userId,
          timestamp: new Date().toISOString(),
          platform: 'web',
        },
        limit: limit * 2,
        filters: {
          types: ['creator'],
        },
      });

      setCreators(response.items.slice(0, limit));
    } catch (error) {
      console.error('Failed to load creators:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, limit]);

  useEffect(() => {
    loadCreators();
  }, [loadCreators]);

  const handleFollow = async (e: React.MouseEvent, creatorId: string) => {
    e.stopPropagation();
    
    if (!user?.id) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }

    try {
      const isFollowing = followingStatus[creatorId];
      
      await userPersonaService.trackBehavior(
        user.id,
        creatorId,
        'creator',
        isFollowing ? 'unfollow' : 'follow'
      );

      setFollowingStatus(prev => ({
        ...prev,
        [creatorId]: !isFollowing,
      }));

      toast.success(isFollowing ? '已取消关注' : '关注成功');
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('操作失败，请稍后重试');
    }
  };

  const handleCreatorClick = async (creator: RecommendationCandidate) => {
    if (user?.id) {
      await userPersonaService.trackBehavior(
        user.id,
        creator.id,
        'creator',
        'click',
        { source: 'recommended_creators' }
      );
    }
    navigate(`/creator/${creator.id}`);
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} />
            <div className={`h-5 w-24 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded animate-pulse`} />
          </div>
        </div>
        <div className={`flex gap-4 ${layout === 'grid' ? 'flex-wrap' : 'overflow-x-auto pb-2'}`}>
          {[...Array(limit)].map((_, i) => (
            <div
              key={i}
              className={`flex-shrink-0 ${layout === 'grid' ? 'w-full' : 'w-48'} rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
            >
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse mb-3`} />
                <div className={`h-4 w-20 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded animate-pulse mb-2`} />
                <div className={`h-3 w-16 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded animate-pulse`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (creators.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg"
          >
            <User className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              推荐创作者
            </h3>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              发现优质内容创作者
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/creators')}
          className={`flex items-center gap-1 text-sm font-medium ${
            isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          查看更多
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>

      <div className={`flex gap-4 ${layout === 'grid' ? 'flex-wrap' : 'overflow-x-auto pb-2 scrollbar-hide'}`}>
        {creators.map((creator, idx) => {
          const isFollowing = followingStatus[creator.id];
          const metadata = creator.metadata || {};

          return (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onHoverStart={() => setHoveredCreator(creator.id)}
              onHoverEnd={() => setHoveredCreator(null)}
              onClick={() => handleCreatorClick(creator)}
              className={`flex-shrink-0 ${layout === 'grid' ? 'w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]' : 'w-48'} 
                rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-750' 
                  : 'bg-white hover:bg-gray-50'
              } shadow-md hover:shadow-xl`}
            >
              <div className="flex flex-col items-center">
                <div className="relative mb-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-offset-2 ring-blue-500/50">
                    {metadata.avatar ? (
                      <img
                        src={metadata.avatar}
                        alt={metadata.name || 'Creator'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <User className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      </div>
                    )}
                  </div>
                  {hoveredCreator === creator.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
                    >
                      <Sparkles className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </div>

                <h4 className={`font-semibold text-sm mb-1 line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {metadata.name || '创作者'}
                </h4>

                <p className={`text-xs mb-3 line-clamp-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {metadata.followerCount ? `${metadata.followerCount} 粉丝` : '暂无粉丝'}
                </p>

                {creator.reasons.length > 0 && (
                  <p className={`text-xs mb-3 line-clamp-2 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {creator.reasons[0]}
                  </p>
                )}

                {showFollowButton && isAuthenticated && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleFollow(e, creator.id)}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isFollowing
                        ? isDark
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-100 text-gray-600'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg'
                    }`}
                  >
                    {isFollowing ? (
                      <span className="flex items-center justify-center gap-1">
                        <Check className="w-4 h-4" />
                        已关注
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1">
                        <Plus className="w-4 h-4" />
                        关注
                      </span>
                    )}
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendedCreatorsList;
