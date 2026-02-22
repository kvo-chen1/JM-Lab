import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { Event } from '@/types';
import { Calendar, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react';

interface EventBannerCarouselProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
}

// 辅助函数：解析日期值
const parseEventDate = (dateValue: any): Date => {
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
  return new Date();
};

// 获取活动状态
const getEventStatus = (event: Event) => {
  const now = new Date();
  const eventStart = parseEventDate(event.startTime);
  const eventEnd = parseEventDate(event.endTime);

  const isRankingPublished = (event as any).finalRankingPublished === true ||
                             (event as any).final_ranking_published === true ||
                             (event as any).status === 'completed';

  if (isRankingPublished || now > eventEnd) {
    return { text: '已结束', color: 'bg-gray-500', bgColor: 'bg-gray-500/80' };
  } else if (now >= eventStart && now <= eventEnd) {
    return { text: '进行中', color: 'bg-amber-500', bgColor: 'bg-amber-500/80' };
  } else {
    return { text: '即将开始', color: 'bg-emerald-500', bgColor: 'bg-emerald-500/80' };
  }
};

const EventBannerCarousel = memo(({ events, onEventClick }: EventBannerCarouselProps) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // 筛选有图片的活动
  const eventsWithImages = events.filter(event =>
    event.media && event.media.length > 0 && event.media[0]?.url
  ).slice(0, 5);

  // 自动轮播
  useEffect(() => {
    if (eventsWithImages.length <= 1 || !isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % eventsWithImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [eventsWithImages.length, isAutoPlaying]);

  const handlePrev = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + eventsWithImages.length) % eventsWithImages.length);
  }, [eventsWithImages.length]);

  const handleNext = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % eventsWithImages.length);
  }, [eventsWithImages.length]);

  const handleDotClick = useCallback((index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  }, []);

  const handleEventClick = useCallback((event: Event) => {
    if (onEventClick) {
      onEventClick(event);
    } else {
      navigate(`/cultural-events?eventId=${event.id}&openModal=true`);
    }
  }, [navigate, onEventClick]);

  if (eventsWithImages.length === 0) {
    return (
      <div className="relative h-[60vh] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80"
          alt="津脉活动"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <h1 className="text-2xl font-bold mb-1">探索津脉活动</h1>
          <p className="text-sm text-white/80">参与精彩文化活动</p>
        </div>
      </div>
    );
  }

  const currentEvent = eventsWithImages[currentIndex];
  const status = getEventStatus(currentEvent);
  const eventStart = parseEventDate(currentEvent.startTime);
  const eventEnd = parseEventDate(currentEvent.endTime);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative h-[42rem] w-full overflow-hidden -mt-20">
      {/* 轮播图片 - 全屏覆盖 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentEvent.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0 cursor-pointer"
          onClick={() => handleEventClick(currentEvent)}
        >
          <img
            src={currentEvent.media?.[0]?.url}
            alt={currentEvent.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80';
            }}
          />

          {/* 渐变遮罩 - 从底部向上 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* 活动信息 - 底部 */}
          <div className="absolute bottom-16 left-0 right-0 px-4 text-white">
            {/* 标签行 - 放在标题上方 */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold text-white ${status.bgColor} backdrop-blur-sm`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full bg-white mr-1 ${status.text !== '已结束' ? 'animate-pulse' : ''}`} />
                {status.text}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium text-white ${
                currentEvent.type === 'online' ? 'bg-blue-500/80' : 'bg-emerald-500/80'
              } backdrop-blur-sm`}>
                {currentEvent.type === 'online' ? '线上' : '线下'}
              </span>
            </div>

            <h2 className="text-lg font-bold mb-2 line-clamp-2 drop-shadow-lg">
              {currentEvent.title}
            </h2>

            {/* 活动详情 */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/80">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(eventStart)} - {formatDate(eventEnd)}</span>
              </div>

              {currentEvent.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[100px]">{currentEvent.location}</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{currentEvent.participants || 0} 人参与</span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 左右切换按钮 */}
      {eventsWithImages.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-all backdrop-blur-sm z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-all backdrop-blur-sm z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* 轮播指示器 */}
      {eventsWithImages.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
          {eventsWithImages.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                handleDotClick(index);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === index
                  ? 'bg-white w-6'
                  : 'bg-white/50 w-2 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
});

EventBannerCarousel.displayName = 'EventBannerCarousel';

export default EventBannerCarousel;
