import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Event } from '@/types';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  ArrowRight,
  Heart,
  Share2,
  Bookmark
} from 'lucide-react';
import { useState, useContext } from 'react';
import { toggleBookmark, toggleLike } from '@/services/collectionService';
import { CollectionType } from '@/types/collection';
import { toast } from 'sonner';
import { ShareSelector } from '@/components/ShareSelector';
import { AuthContext } from '@/contexts/authContext';

interface EventCardProps {
  event: Event;
  onClick: () => void;
  viewMode?: 'grid' | 'list';
  isBookmarked?: boolean;
  isLiked?: boolean;
  onBookmarkChange?: (isBookmarked: boolean) => void;
  onLikeChange?: (isLiked: boolean) => void;
}

export default function EventCard({
  event,
  onClick,
  viewMode = 'grid',
  isBookmarked: initialBookmarked = false,
  isLiked: initialLiked = false,
  onBookmarkChange,
  onLikeChange
}: EventCardProps) {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const now = new Date();

  // 处理各种日期格式：Date对象、ISO字符串、bigint时间戳
  let eventStart: Date;
  let eventEnd: Date;

  // 辅助函数：解析日期值
  const parseDateValue = (dateValue: any): Date => {
    if (dateValue == null) {
      return new Date(); // 如果日期为空，返回当前时间作为默认值
    }
    if (dateValue instanceof Date) {
      return dateValue;
    }
    if (typeof dateValue === 'string') {
      // 检查是否是纯数字（时间戳）
      if (/^\d+$/.test(dateValue)) {
        const numValue = parseInt(dateValue, 10);
        // 判断时间戳是秒级还是毫秒级：如果数值小于 1e12，认为是秒级
        const msValue = numValue < 1e12 ? numValue * 1000 : numValue;
        return new Date(msValue);
      }
      // ISO日期字符串
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
      return new Date(); // 如果解析失败，返回当前时间
    }
    if (typeof dateValue === 'number') {
      // 判断时间戳是秒级还是毫秒级
      const msValue = dateValue < 1e12 ? dateValue * 1000 : dateValue;
      return new Date(msValue);
    }
    // 对于其他类型，尝试解析，如果失败则返回当前时间
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  eventStart = parseDateValue(event.startTime);
  eventEnd = parseDateValue(event.endTime);

  // 调试日志
  console.log('[EventCard] 日期解析:', {
    title: event.title,
    rawStartTime: event.startTime,
    rawEndTime: event.endTime,
    parsedStartTime: eventStart.toISOString(),
    parsedEndTime: eventEnd.toISOString(),
    isStartValid: !isNaN(eventStart.getTime()),
    isEndValid: !isNaN(eventEnd.getTime()),
  });

  // 优先检查 final_ranking_published 字段或活动状态，如果已发布排名或状态为completed则视为已结束
  const isRankingPublished = (event as any).finalRankingPublished === true ||
                             (event as any).final_ranking_published === true ||
                             (event as any).status === 'completed';

  let status: 'upcoming' | 'ongoing' | 'completed' = 'upcoming';
  let statusText = '即将开始';
  let statusColor = 'bg-emerald-500';
  let statusBg = 'bg-emerald-100 text-emerald-700';

  if (isRankingPublished) {
    // 如果已发布排名，活动视为已结束
    status = 'completed';
    statusText = '已结束';
    statusColor = 'bg-gray-400';
    statusBg = 'bg-gray-100 text-gray-600';
  } else if (now >= eventStart && now <= eventEnd) {
    status = 'ongoing';
    statusText = '进行中';
    statusColor = 'bg-amber-500';
    statusBg = 'bg-amber-100 text-amber-700';
  } else if (now > eventEnd) {
    status = 'completed';
    statusText = '已结束';
    statusColor = 'bg-gray-400';
    statusBg = 'bg-gray-100 text-gray-600';
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShareModalOpen(true);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await toggleLike(event.id.toString(), CollectionType.ACTIVITY);
      setIsLiked(result);
      onLikeChange?.(result);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await toggleBookmark(event.id.toString(), CollectionType.ACTIVITY);
      setIsBookmarked(result);
      onBookmarkChange?.(result);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 分享数据
  const shareData = {
    type: 'activity' as const,
    id: event.id.toString(),
    title: event.title,
    description: event.description || '',
    thumbnail: event.media?.[0]?.url || '',
    url: `${window.location.origin}/events/${event.id}`,
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={onClick}
        className={`group flex gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
          isDark 
            ? 'bg-gray-800/50 border border-gray-700 hover:border-gray-600' 
            : 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg'
        }`}
      >
        {/* 封面图 */}
        <div className="relative w-32 h-24 sm:w-48 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden">
          <img
            src={event.media?.[0]?.url || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20culture%20event&image_size=landscape_16_9`}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold ${statusBg}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusColor} mr-1.5 ${status !== 'completed' ? 'animate-pulse' : ''}`} />
            {statusText}
          </div>
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-md ${
            event.type === 'online' ? 'bg-blue-500/90 text-white' : 'bg-emerald-500/90 text-white'
          }`}>
            {event.type === 'online' ? '线上' : '线下'}
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-lg mb-2 line-clamp-1 group-hover:text-red-500 transition-colors ${
                isDark ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {event.title}
              </h3>
              <p className={`text-sm line-clamp-2 mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {event.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                disabled={isLoading}
                className={`p-2 rounded-full transition-colors ${
                  isLiked 
                    ? 'bg-red-100 text-red-500' 
                    : isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleBookmark}
                disabled={isLoading}
                className={`p-2 rounded-full transition-colors ${
                  isBookmarked 
                    ? 'bg-yellow-100 text-yellow-500' 
                    : isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleShare}
                className={`p-2 rounded-full transition-colors ${
                  isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400'
                }`}
              >
                <Share2 className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          <div className="mt-auto flex items-center gap-4 text-sm">
            <div className={`flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <Calendar className="w-4 h-4" />
              <span>{formatDate(eventStart)} - {formatDate(eventEnd)}</span>
            </div>
            {event.location && (
              <div className={`flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <MapPin className="w-4 h-4" />
                <span className="truncate max-w-[150px]">{event.location}</span>
              </div>
            )}
            <div className={`flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <Users className="w-4 h-4" />
              <span>{event.participants || 0} 人参与</span>
            </div>
          </div>
        </div>

        {/* 箭头指示器 */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
          className="flex items-center"
        >
          <ArrowRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        </motion.div>

        {/* 分享弹窗 */}
        <ShareSelector
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          shareData={shareData}
          userId={user?.id || ''}
          userName={user?.username || user?.name || ''}
          userAvatar={user?.avatar_url || user?.avatar}
        />
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={`group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
        isDark 
          ? 'bg-gray-800/50 border border-gray-700 hover:border-gray-600 hover:shadow-2xl hover:shadow-black/20' 
          : 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-2xl hover:shadow-gray-200/50'
      }`}
    >
      {/* 封面图 */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={event.media?.[0]?.url || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20culture%20event&image_size=landscape_16_9`}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* 状态标签 */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-md ${statusBg}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusColor} mr-1.5 ${status !== 'completed' ? 'animate-pulse' : ''}`} />
            {statusText}
          </span>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-md ${
            event.type === 'online' ? 'bg-blue-500/90 text-white' : 'bg-emerald-500/90 text-white'
          }`}>
            {event.type === 'online' ? '线上' : '线下'}
          </span>
        </div>

        {/* 悬浮操作按钮 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : -10 }}
          className="absolute top-3 right-3 flex gap-2"
        >
          <button
            onClick={handleLike}
            disabled={isLoading}
            className={`p-2 rounded-full backdrop-blur-md transition-colors ${
              isLiked 
                ? 'bg-red-500 text-white' 
                : 'bg-white/90 text-gray-700 hover:bg-white'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleBookmark}
            disabled={isLoading}
            className={`p-2 rounded-full backdrop-blur-md transition-colors ${
              isBookmarked 
                ? 'bg-yellow-500 text-white' 
                : 'bg-white/90 text-gray-700 hover:bg-white'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/90 text-gray-700 hover:bg-white backdrop-blur-md transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </motion.div>

        {/* 底部信息 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{formatTime(eventStart)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{event.participants || 0} 人参与</span>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 p-5 flex flex-col">
        <h3 className={`font-bold text-lg mb-2 line-clamp-2 leading-tight group-hover:text-red-500 transition-colors ${
          isDark ? 'text-gray-100' : 'text-gray-900'
        }`}>
          {event.title}
        </h3>

        <p className={`text-sm line-clamp-2 mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {event.description}
        </p>

        <div className="mt-auto space-y-2.5">
          <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{formatDate(eventStart)} - {formatDate(eventEnd)}</span>
          </div>

          {event.location && (
            <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {/* 标签 */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {event.tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tag}
                </span>
              ))}
              {event.tags.length > 3 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                }`}>
                  +{event.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 分享弹窗 */}
      <ShareSelector
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareData={shareData}
        userId={user?.id || ''}
        userName={user?.username || user?.name || ''}
        userAvatar={user?.avatar_url || user?.avatar}
      />
    </motion.div>
  );
}
