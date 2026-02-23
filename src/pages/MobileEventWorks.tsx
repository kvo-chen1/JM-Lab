import { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { useEventWorks } from '@/hooks/useEventWorks';
import { useEventService } from '@/hooks/useEventService';
import { eventParticipationService } from '@/services/eventParticipationService';
import { ImageCarousel } from '@/components/ImageCarousel';
import { toast } from 'sonner';
import {
  ChevronLeft,
  LayoutGrid,
  List,
  Filter,
  Image,
  Video,
  FileAudio,
  FileText,
  MoreHorizontal,
  Clock,
  TrendingUp,
  Star,
  ThumbsUp,
  Users,
  Loader2,
  Share2,
  Calendar,
  MapPin,
  ExternalLink,
  Lock,
  Heart,
  X,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Upload,
  ArrowUp,
} from 'lucide-react';

// 媒体类型选项
const mediaTypeOptions = [
  { value: 'all', label: '全部', icon: LayoutGrid },
  { value: 'image', label: '图片', icon: Image },
  { value: 'video', label: '视频', icon: Video },
  { value: 'audio', label: '音频', icon: FileAudio },
  { value: 'document', label: '文档', icon: FileText },
];

// 排序选项
const sortOptions = [
  { value: 'newest', label: '最新', icon: Clock },
  { value: 'popular', label: '热门', icon: TrendingUp },
  { value: 'rating', label: '评分', icon: Star },
  { value: 'votes', label: '投票', icon: ThumbsUp },
];

// 品牌色彩
const brandColors = {
  primary: '#E53935',
  primaryLight: '#FF6F60',
  primaryDark: '#AB000D',
};

// 媒体类型图标映射
const mediaTypeIcons = {
  image: Image,
  video: Video,
  audio: FileAudio,
  document: FileText,
  other: MoreHorizontal,
};

export default function MobileEventWorks() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const { getEvent } = useEventService();

  // 本地状态
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [eventInfo, setEventInfo] = useState<{
    title: string;
    description?: string;
    thumbnailUrl?: string;
    media?: { url: string; type: string }[];
    startTime?: Date | string;
    endTime?: Date | string;
    location?: string;
    participantCount?: number;
  } | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [participationStatus, setParticipationStatus] = useState<{
    isParticipated: boolean;
    participationId?: string;
    status?: string;
  }>({ isParticipated: false });
  const [isCheckingParticipation, setIsCheckingParticipation] = useState(true);

  // 滚动相关
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.95]);
  const headerY = useTransform(scrollY, [0, 100], [0, -2]);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // 使用自定义 Hook 获取作品数据
  const {
    submissions,
    selectedSubmission,
    userInteractions,
    totalCount,
    isLoading,
    isLoadingMore,
    hasMore,
    filters,
    setFilters,
    loadMore,
    handleVote,
    handleLike,
    handleRate,
    getUserInteraction,
  } = useEventWorks({
    eventId: eventId || '',
    userId: user?.id,
  });

  // 监听滚动显示返回顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 加载活动信息和用户参与状态
  useEffect(() => {
    if (!eventId) return;

    const loadEventInfo = async () => {
      setIsLoadingEvent(true);
      try {
        const event = await getEvent(eventId);
        if (event) {
          setEventInfo({
            title: event.title,
            description: event.description,
            thumbnailUrl: event.media && Array.isArray(event.media) && event.media.length > 0 ? event.media[0].url : undefined,
            media: event.media,
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location,
            participantCount: event.participants,
          });
        }
      } catch (error) {
        console.error('加载活动信息失败:', error);
      } finally {
        setIsLoadingEvent(false);
      }
    };

    loadEventInfo();
  }, [eventId, getEvent]);

  // 检查用户参与状态
  useEffect(() => {
    if (!eventId || !user?.id) {
      setIsCheckingParticipation(false);
      return;
    }

    const checkParticipation = async () => {
      setIsCheckingParticipation(true);
      try {
        const status = await eventParticipationService.checkParticipation(eventId, user.id);
        setParticipationStatus(status);
      } catch (error) {
        console.error('检查参与状态失败:', error);
      } finally {
        setIsCheckingParticipation(false);
      }
    };

    checkParticipation();
  }, [eventId, user?.id]);

  // 处理分享
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('链接已复制');
    } catch {
      toast.error('复制失败');
    }
  };

  // 返回顶部
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 处理作品点击
  const handleWorkClick = (workId: string) => {
    navigate(`/events/${eventId}/works/${workId}`);
  };

  // 处理提交作品
  const handleSubmitWork = () => {
    navigate(`/events/${eventId}/submit`);
  };

  // 将作品分成两列（瀑布流效果）
  const leftColumn = submissions.filter((_, index) => index % 2 === 0);
  const rightColumn = submissions.filter((_, index) => index % 2 === 1);

  // 获取当前作品的交互状态
  const currentInteraction = selectedSubmission
    ? getUserInteraction(selectedSubmission.id)
    : undefined;

  if (!eventId) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center px-4">
          <p className="text-gray-500">活动ID不存在</p>
          <button
            onClick={() => navigate('/events')}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl"
          >
            返回活动列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} pb-20`}>
      {/* 顶部导航栏 - 移动端优化 */}
      <motion.header
        style={{ opacity: headerOpacity, y: headerY }}
        className={`sticky top-0 z-40 backdrop-blur-xl border-b ${
          isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'
        }`}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 左侧：返回按钮 */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/events')}
              className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                isDark 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              <ChevronLeft className="w-8 h-8" strokeWidth={2.5} />
            </motion.button>

            {/* 中间：活动标题 */}
            <div className="flex-1 mx-2 min-w-0 text-center">
              {isLoadingEvent ? (
                <div className={`h-5 w-32 rounded animate-pulse mx-auto ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
              ) : (
                <h1 className={`text-base font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {eventInfo?.title || '活动作品'}
                </h1>
              )}
            </div>

            {/* 右侧：作品数量 */}
            <div className="flex items-center justify-end w-16 h-9">
              {isLoadingEvent ? (
                <div className={`h-4 w-12 rounded animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
              ) : (
                <span className={`text-xs whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {totalCount} 个作品
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* 活动信息卡片 - 可展开 */}
      <div className="px-4 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl overflow-hidden ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border shadow-sm`}
        >
          {/* 活动封面 */}
          {eventInfo?.media && eventInfo.media.length > 0 && (
            <div className="relative aspect-[16/9]">
              <ImageCarousel
                images={eventInfo.media.filter(m => m.type === 'image').map(m => m.url)}
                alt={eventInfo.title}
                aspectRatio="aspect-[16/9]"
                autoPlay={true}
                interval={5000}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                <h2 className="text-white font-semibold text-sm line-clamp-2">
                  {eventInfo.title}
                </h2>
              </div>
            </div>
          )}

          {/* 活动基本信息 */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                {eventInfo?.startTime && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                      {new Date(eventInfo.startTime).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
                {eventInfo?.location && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                      {eventInfo.location}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                    {eventInfo?.participantCount || 0} 参与
                  </span>
                </div>
              </div>
            </div>

            {/* 查看详情按钮 */}
            <button
              onClick={() => navigate(`/events/${eventId}`)}
              className="flex items-center justify-center gap-1 w-full py-2 text-xs font-medium rounded-xl transition-colors"
              style={{ color: brandColors.primary, backgroundColor: `${brandColors.primary}10` }}
            >
              查看活动详情
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* 筛选和排序栏 */}
      <div className="px-4 py-4">
        <div className={`flex items-center justify-between p-2 rounded-xl ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* 视图切换 */}
          <div className={`flex items-center rounded-lg p-0.5 ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'list'
                  ? isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* 排序选择 */}
          <div className="flex items-center gap-2">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              const isActive = filters.sortBy === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setFilters({ sortBy: option.value as any })}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'text-white'
                      : isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={isActive ? { backgroundColor: brandColors.primary } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* 筛选按钮 */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilterDrawer(true)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            筛选
          </motion.button>
        </div>
      </div>

      {/* 作品列表 */}
      <div className="px-4 pb-4">
        {isLoading && submissions.length === 0 ? (
          // 加载骨架屏
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl overflow-hidden animate-pulse`}
                style={{ height: i % 2 === 0 ? '220px' : '200px' }}
              >
                <div className={`aspect-[4/3] ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <div className="p-3 space-y-2">
                  <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-3/4`} />
                  <div className={`h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/2`} />
                </div>
              </div>
            ))}
          </div>
        ) : submissions.length === 0 ? (
          // 空状态
          <div className={`text-center py-12 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className={`text-base font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              暂无作品
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              该活动还没有人提交作品
            </p>
          </div>
        ) : (
          // 作品列表 - 瀑布流布局
          <div className="grid grid-cols-2 gap-3">
            {/* 左列 */}
            <div className="flex flex-col gap-3">
              {leftColumn.map((submission, index) => (
                <MobileWorkCard
                  key={submission.id}
                  submission={submission}
                  interaction={getUserInteraction(submission.id)}
                  onClick={() => handleWorkClick(submission.id)}
                  index={index * 2}
                  isDark={isDark}
                />
              ))}
            </div>

            {/* 右列 - 添加顶部偏移创造瀑布流效果 */}
            <div className="flex flex-col gap-3 pt-4">
              {rightColumn.map((submission, index) => (
                <MobileWorkCard
                  key={submission.id}
                  submission={submission}
                  interaction={getUserInteraction(submission.id)}
                  onClick={() => handleWorkClick(submission.id)}
                  index={index * 2 + 1}
                  isDark={isDark}
                />
              ))}
            </div>
          </div>
        )}

        {/* 加载更多 */}
        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                isLoadingMore
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              {isLoadingMore ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  加载中...
                </span>
              ) : (
                '加载更多'
              )}
            </button>
          </div>
        )}
      </div>

      {/* 筛选抽屉 */}
      <AnimatePresence>
        {showFilterDrawer && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilterDrawer(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            {/* 抽屉内容 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[80vh] overflow-y-auto ${
                isDark ? 'bg-gray-900' : 'bg-white'
              }`}
            >
              {/* 抽屉头部 */}
              <div className={`sticky top-0 flex items-center justify-between px-4 py-3 border-b ${
                isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'
              }`}>
                <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  筛选作品
                </h3>
                <button
                  onClick={() => setShowFilterDrawer(false)}
                  className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 媒体类型筛选 */}
              <div className="p-4">
                <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  媒体类型
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {mediaTypeOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = filters.mediaType === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFilters({ mediaType: option.value as any })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                          isActive
                            ? 'text-white'
                            : isDark
                              ? 'bg-gray-800 text-gray-300'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                        style={isActive ? { backgroundColor: brandColors.primary } : {}}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 底部按钮 */}
              <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                <button
                  onClick={() => {
                    setFilters({ mediaType: 'all', sortBy: 'newest' });
                    setShowFilterDrawer(false);
                  }}
                  className={`w-full py-3 rounded-xl text-sm font-medium ${
                    isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  重置筛选
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 提交作品浮动按钮 */}
      <AnimatePresence>
        {!isCheckingParticipation && isAuthenticated && participationStatus.isParticipated && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmitWork}
            className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full text-white font-medium shadow-lg"
            style={{ backgroundColor: brandColors.primary, boxShadow: `0 4px 14px ${brandColors.primary}40` }}
          >
            <Upload className="w-5 h-5" />
            <span className="text-sm">提交作品</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 返回顶部按钮 */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToTop}
            className={`fixed bottom-20 left-4 z-40 p-3 rounded-full shadow-lg ${
              isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 未报名提示 */}
      {!isCheckingParticipation && isAuthenticated && !participationStatus.isParticipated && (
        <div className={`fixed bottom-0 left-0 right-0 p-4 z-40 ${
          isDark ? 'bg-gray-900/95' : 'bg-white/95'
        } backdrop-blur-xl border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                需要先报名活动
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                提交作品前请先报名参加活动
              </p>
            </div>
            <button
              onClick={() => navigate(`/events/${eventId}`)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor: brandColors.primary }}
            >
              去报名
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 移动端作品卡片组件
interface MobileWorkCardProps {
  submission: any;
  interaction?: any;
  onClick: () => void;
  index: number;
  isDark: boolean;
}

function MobileWorkCard({ submission, interaction, onClick, index, isDark }: MobileWorkCardProps) {
  const mediaType = submission.mediaType || 'image';
  const MediaIcon = mediaTypeIcons[mediaType as keyof typeof mediaTypeIcons] || Image;
  const coverImage = submission.coverImage || submission.workThumbnail ||
    (submission.files && submission.files.length > 0 ? submission.files[0].url : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative rounded-2xl overflow-hidden cursor-pointer ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border shadow-sm`}
    >
      {/* 封面图 */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
        {coverImage ? (
          <img
            src={coverImage}
            alt={submission.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MediaIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          </div>
        )}

        {/* 媒体类型标签 */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium backdrop-blur-sm ${
            isDark ? 'bg-gray-900/70 text-gray-200' : 'bg-white/70 text-gray-700'
          }`}>
            {submission.mediaType === 'image' ? '图片' :
             submission.mediaType === 'video' ? '视频' :
             submission.mediaType === 'audio' ? '音频' :
             submission.mediaType === 'document' ? '文档' : '其他'}
          </span>
        </div>

        {/* 评分标签 */}
        {submission.avgRating > 0 && (
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium backdrop-blur-sm flex items-center gap-0.5 ${
              isDark ? 'bg-amber-500/90 text-white' : 'bg-amber-400 text-white'
            }`}>
              <Star className="w-3 h-3 fill-current" />
              {submission.avgRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="p-3">
        {/* 标题 */}
        <h3 className={`font-semibold text-sm mb-2 line-clamp-2 ${
          isDark ? 'text-gray-100' : 'text-gray-900'
        }`}>
          {submission.title}
        </h3>

        {/* 作者信息 */}
        <div className="flex items-center gap-2 mb-2">
          {submission.creatorAvatar ? (
            <img
              src={submission.creatorAvatar}
              alt={submission.creatorName || '用户'}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-[10px] font-medium">
              {submission.creatorName?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <span className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {submission.creatorName || '匿名用户'}
          </span>
        </div>

        {/* 统计信息 */}
        <div className={`flex items-center gap-3 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          <span className="flex items-center gap-0.5">
            <ThumbsUp className={`w-3 h-3 ${interaction?.hasVoted ? 'text-red-500' : ''}`} />
            {submission.voteCount}
          </span>
          <span className="flex items-center gap-0.5">
            <Heart className={`w-3 h-3 ${interaction?.hasLiked ? 'text-red-500 fill-current' : ''}`} />
            {submission.likeCount}
          </span>
          <span className="ml-auto">
            {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : ''}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
