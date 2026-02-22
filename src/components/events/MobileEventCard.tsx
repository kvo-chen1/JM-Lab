import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Event } from '@/types';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Heart,
  Bookmark,
  Flame,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';
import { toggleBookmark, toggleLike } from '@/services/collectionService';
import { CollectionType } from '@/types/collection';
import { toast } from 'sonner';

interface MobileEventCardProps {
  event: Event;
  onClick: () => void;
  index?: number;
  isBookmarked?: boolean;
  isLiked?: boolean;
  onBookmarkChange?: (isBookmarked: boolean) => void;
  onLikeChange?: (isLiked: boolean) => void;
}

// 品牌色彩配置
const brandColors = {
  primary: '#E53935',      // 津脉红
  primaryLight: '#FF6F60', // 浅红
  primaryDark: '#AB000D',  // 深红
  secondary: '#1A237E',    // 深蓝
  accent: '#FFD54F',       // 金色点缀
  success: '#4CAF50',      // 成功绿
  warning: '#FF9800',      // 警告橙
  info: '#2196F3',         // 信息蓝
};

export default function MobileEventCard({ 
  event, 
  onClick, 
  index = 0,
  isBookmarked: initialBookmarked = false,
  isLiked: initialLiked = false,
  onBookmarkChange,
  onLikeChange
}: MobileEventCardProps) {
  const { isDark } = useTheme();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const now = new Date();

  // 辅助函数：解析日期值
  const parseDateValue = (dateValue: any): Date => {
    if (dateValue == null) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') {
      if (/^\d+$/.test(dateValue)) {
        const numValue = parseInt(dateValue, 10);
        const msValue = numValue < 1e12 ? numValue * 1000 : numValue;
        return new Date(msValue);
      }
      const parsed = new Date(dateValue);
      return !isNaN(parsed.getTime()) ? parsed : new Date();
    }
    if (typeof dateValue === 'number') {
      const msValue = dateValue < 1e12 ? dateValue * 1000 : dateValue;
      return new Date(msValue);
    }
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const eventStart = parseDateValue(event.startTime);
  const eventEnd = parseDateValue(event.endTime);

  // 检查活动状态
  const isRankingPublished = (event as any).finalRankingPublished === true ||
                             (event as any).final_ranking_published === true ||
                             (event as any).status === 'completed';

  let status: 'upcoming' | 'ongoing' | 'completed' = 'upcoming';
  let statusText = '即将开始';
  let statusColor = brandColors.success;
  let statusBg = isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600';

  if (isRankingPublished) {
    status = 'completed';
    statusText = '已结束';
    statusColor = '#9E9E9E';
    statusBg = isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-500';
  } else if (now >= eventStart && now <= eventEnd) {
    status = 'ongoing';
    statusText = '进行中';
    statusColor = brandColors.warning;
    statusBg = isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600';
  } else if (now > eventEnd) {
    status = 'completed';
    statusText = '已结束';
    statusColor = '#9E9E9E';
    statusBg = isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-500';
  }

  // 计算剩余时间
  const getTimeLeft = () => {
    const diff = eventStart.getTime() - now.getTime();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}天后`;
    if (hours > 0) return `${hours}小时后`;
    return '即将开始';
  };

  const timeLeft = getTimeLeft();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
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
      toast.error('操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取活动亮点标签
  const getHighlightTag = () => {
    if (event.participants && event.participants > 100) {
      return { text: '热门', icon: Flame, color: 'bg-orange-500' };
    }
    if (status === 'upcoming' && timeLeft && timeLeft.includes('1天')) {
      return { text: '即将截止', icon: Clock, color: 'bg-red-500' };
    }
    if (event.tags?.includes('精选')) {
      return { text: '精选', icon: Sparkles, color: 'bg-purple-500' };
    }
    return null;
  };

  const highlightTag = getHighlightTag();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      onClick={onClick}
      className={`group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
        isDark 
          ? 'bg-gray-800/80 border border-gray-700/50 hover:border-gray-600 hover:shadow-xl hover:shadow-black/20' 
          : 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-200/50'
      }`}
      style={{
        boxShadow: isDark 
          ? '0 2px 8px rgba(0,0,0,0.3)' 
          : '0 2px 8px rgba(0,0,0,0.06)'
      }}
    >
      {/* 封面图容器 - 使用 4:3 比例更适合两列布局 */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {/* 骨架屏 */}
        {!imageLoaded && (
          <div className={`absolute inset-0 animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
        )}
        
        <motion.img
          src={event.media?.[0]?.url || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20culture%20event&image_size=square`}
          alt={event.title}
          className="w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          onLoad={() => setImageLoaded(true)}
          style={{
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease, transform 0.5s ease'
          }}
        />
        
        {/* 悬浮时图片放大效果 */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{
            backgroundImage: `url(${event.media?.[0]?.url || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20culture%20event&image_size=square`})`,
            opacity: 0
          }}
        />
        
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
        
        {/* 状态标签 - 左上角 */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 + 0.2 }}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold backdrop-blur-md ${statusBg}`}
          >
            <span 
              className="inline-block w-1 h-1 rounded-full mr-1"
              style={{ backgroundColor: statusColor }}
            />
            {statusText}
          </motion.span>
          
          {/* 活动类型标签 */}
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 + 0.25 }}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium backdrop-blur-md ${
              event.type === 'online' 
                ? 'bg-blue-500/90 text-white' 
                : 'bg-emerald-500/90 text-white'
            }`}
          >
            {event.type === 'online' ? '线上' : '线下'}
          </motion.span>

          {/* 亮点标签 */}
          {highlightTag && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08 + 0.3 }}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium backdrop-blur-md ${highlightTag.color} text-white flex items-center gap-0.5`}
            >
              <highlightTag.icon className="w-2.5 h-2.5" />
              {highlightTag.text}
            </motion.span>
          )}
        </div>

        {/* 收藏按钮 - 右上角 */}
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 + 0.3 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleBookmark}
          disabled={isLoading}
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md transition-all duration-200 ${
            isBookmarked 
              ? 'bg-yellow-400 text-white' 
              : 'bg-white/90 text-gray-600 hover:bg-white'
          } ${isLoading ? 'opacity-50' : ''}`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
        </motion.button>

        {/* 底部信息 - 悬浮显示 */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span className="font-medium">{event.participants || 0}</span>
              </div>
              {timeLeft && status === 'upcoming' && (
                <div className="flex items-center gap-1 text-yellow-300">
                  <Clock className="w-3 h-3" />
                  <span className="font-medium">{timeLeft}</span>
                </div>
              )}
            </div>
            
            {/* 点赞按钮 */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              disabled={isLoading}
              className={`flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-md transition-all ${
                isLiked 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-[10px]">{event.likeCount || 0}</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* 内容区 - 紧凑设计 */}
      <div className="flex-1 p-3 flex flex-col">
        {/* 标题 - 限制两行 */}
        <h3 
          className={`font-bold text-sm leading-tight mb-1.5 line-clamp-2 transition-colors duration-200 ${
            isDark ? 'text-gray-100 group-hover:text-red-400' : 'text-gray-900 group-hover:text-red-600'
          }`}
          style={{ minHeight: '2.5rem' }}
        >
          {event.title}
        </h3>
        
        {/* 日期信息 */}
        <div className={`flex items-center gap-1.5 text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <Calendar className="w-3 h-3 flex-shrink-0" style={{ color: brandColors.primary }} />
          <span className="truncate">
            {formatDate(eventStart)} - {formatDate(eventEnd)}
          </span>
        </div>

        {/* 地点信息 */}
        {event.location && (
          <div className={`flex items-center gap-1.5 text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: brandColors.info }} />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {/* 标签 - 最多显示2个 */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1">
            {event.tags.slice(0, 2).map((tag, i) => (
              <motion.span 
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.08 + 0.4 + i * 0.05 }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tag}
              </motion.span>
            ))}
            {event.tags.length > 2 && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
              }`}>
                +{event.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 点击波纹效果指示器 */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 via-transparent to-red-500/0 group-hover:from-red-500/5 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
    </motion.div>
  );
}
