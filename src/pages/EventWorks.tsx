import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { useEventWorks } from '@/hooks/useEventWorks';
import { WorkCard, RatingComponent, WorkActionButtons } from '@/components/works';
import { eventWorkService } from '@/services/eventWorkService';
import { useEventService } from '@/hooks/useEventService';
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
  ChevronRight,
  Loader2,
  Share2,
  Calendar,
  MapPin,
  ExternalLink,
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
  { value: 'newest', label: '最新发布', icon: Clock },
  { value: 'popular', label: '最受欢迎', icon: TrendingUp },
  { value: 'rating', label: '评分最高', icon: Star },
  { value: 'votes', label: '投票最多', icon: ThumbsUp },
];

export default function EventWorks() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const { getEventById } = useEventService();
  
  // 本地状态
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [eventInfo, setEventInfo] = useState<{
    title: string;
    description?: string;
    thumbnailUrl?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    participantCount?: number;
  } | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);

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
    selectSubmission,
    loadMore,
    handleVote,
    handleLike,
    handleRate,
    getUserInteraction,
  } = useEventWorks({
    eventId: eventId || '',
    userId: user?.id,
  });

  // 加载活动信息
  useEffect(() => {
    if (!eventId) return;
    
    const loadEventInfo = async () => {
      setIsLoadingEvent(true);
      try {
        // 从 Supabase 获取活动信息
        const event = await getEventById(eventId);
        
        if (event) {
          setEventInfo({
            title: event.title,
            description: event.description,
            thumbnailUrl: event.media && event.media.length > 0 ? event.media[0].url : undefined,
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location,
            participantCount: event.participantCount,
          });
        }
      } catch (error) {
        console.error('加载活动信息失败:', error);
      } finally {
        setIsLoadingEvent(false);
      }
    };

    loadEventInfo();
  }, [eventId, getEventById]);

  // 处理分享
  const handleShare = async () => {
    if (!selectedSubmission) return;
    
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('链接已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  };

  // 获取当前作品的交互状态
  const currentInteraction = selectedSubmission
    ? getUserInteraction(selectedSubmission.id)
    : undefined;

  // 处理评分
  const onRate = async (rating: number) => {
    if (!selectedSubmission) return;
    await handleRate(selectedSubmission.id, rating);
  };

  // 处理投票
  const onVote = async () => {
    if (!selectedSubmission) return;
    await handleVote(selectedSubmission.id);
  };

  // 处理点赞
  const onLike = async () => {
    if (!selectedSubmission) return;
    await handleLike(selectedSubmission.id);
  };

  if (!eventId) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className="text-gray-500">活动ID不存在</p>
          <button
            onClick={() => navigate('/events')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            返回活动列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* 顶部导航栏 */}
      <header className={`sticky top-24 z-40 backdrop-blur-lg border-b shadow-sm ${isDark ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-gray-200'}`}>
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 左侧：返回按钮和活动信息 */}
            <div className="flex items-center gap-4 min-w-0">
              <motion.button
                whileHover={{ x: -4, backgroundColor: isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(243, 244, 246, 1)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/events')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors flex-shrink-0 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">返回活动</span>
              </motion.button>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 flex-shrink-0" />

              {isLoadingEvent ? (
                <div className="w-32 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                <div className="min-w-0 py-1">
                  <h1 className={`text-lg font-bold tracking-tight truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {eventInfo?.title || '活动作品'}
                  </h1>
                  <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {totalCount} 个作品
                  </p>
                </div>
              )}
            </div>

            {/* 右侧：视图切换和筛选 */}
            <div className="flex items-center gap-2">
              {/* 视图切换 */}
              <div className={`flex items-center rounded-lg p-1 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? (isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 shadow-sm') : 'text-gray-500'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? (isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 shadow-sm') : 'text-gray-500'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧边栏：活动信息和筛选 */}
          <aside className="lg:col-span-2 space-y-6">
            {/* 活动信息卡片 */}
            {eventInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}
              >
                {eventInfo.thumbnailUrl && (
                  <div className="aspect-video relative">
                    <img
                      src={eventInfo.thumbnailUrl}
                      alt={eventInfo.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h2 className="text-white font-semibold text-sm line-clamp-2">
                        {eventInfo.title}
                      </h2>
                    </div>
                  </div>
                )}
                <div className="p-4 space-y-3">
                  {eventInfo.startTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                        {new Date(eventInfo.startTime).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  )}
                  {eventInfo.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                        {eventInfo.location}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                      {eventInfo.participantCount || 0} 人参与
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/events/${eventId}`)}
                    className="w-full flex items-center justify-center gap-1 text-sm text-primary-600 hover:text-primary-700 mt-2"
                  >
                    查看活动详情
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* 媒体类型筛选 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}
            >
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Filter className="w-4 h-4" />
                筛选
              </h3>
              <div className="space-y-2">
                {mediaTypeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setFilters({ mediaType: option.value as any })}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                        filters.mediaType === option.value
                          ? isDark
                            ? 'bg-primary-600/20 text-primary-400'
                            : 'bg-primary-50 text-primary-700'
                          : isDark
                            ? 'text-gray-400 hover:bg-gray-700'
                            : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* 排序选项 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}
            >
              <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                排序
              </h3>
              <div className="space-y-2">
                {sortOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setFilters({ sortBy: option.value as any })}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                        filters.sortBy === option.value
                          ? isDark
                            ? 'bg-primary-600/20 text-primary-400'
                            : 'bg-primary-50 text-primary-700'
                          : isDark
                            ? 'text-gray-400 hover:bg-gray-700'
                            : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </aside>

          {/* 中间：作品列表 */}
          <section className="lg:col-span-6">
            {isLoading && submissions.length === 0 ? (
              // 加载骨架屏
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-4'}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl overflow-hidden animate-pulse`}
                  >
                    <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : submissions.length === 0 ? (
              // 空状态
              <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <MoreHorizontal className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  暂无作品
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  该活动还没有人提交作品，快来参与吧！
                </p>
                <button
                  onClick={() => navigate(`/events/${eventId}/submit`)}
                  className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                >
                  提交作品
                </button>
              </div>
            ) : (
              // 作品列表
              <>
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-4'}>
                  {submissions.map((submission, index) => (
                    <WorkCard
                      key={submission.id}
                      submission={submission}
                      interaction={getUserInteraction(submission.id)}
                      isSelected={selectedSubmission?.id === submission.id}
                      onClick={() => selectSubmission(submission)}
                      index={index}
                    />
                  ))}
                </div>

                {/* 加载更多 */}
                {hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className={`px-6 py-3 rounded-xl font-medium transition-all ${
                        isLoadingMore
                          ? 'opacity-50 cursor-not-allowed'
                          : isDark
                            ? 'bg-gray-800 hover:bg-gray-700 text-white'
                            : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
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
              </>
            )}
          </section>

          {/* 右侧边栏：作品详情 */}
          <aside className="lg:col-span-4">
            <AnimatePresence mode="wait">
              {selectedSubmission ? (
                <motion.div
                  key={selectedSubmission.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`sticky top-24 rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}
                >
                  {/* 作品封面 */}
                  <div className="aspect-video relative bg-gray-100 dark:bg-gray-700">
                    {(selectedSubmission.coverImage || (selectedSubmission.files && selectedSubmission.files.length > 0)) ? (
                      <img
                        src={selectedSubmission.coverImage || selectedSubmission.files[0].url}
                        alt={selectedSubmission.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* 作品信息 */}
                  <div className="p-6 space-y-6">
                    {/* 标题和作者 */}
                    <div>
                      <h2 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedSubmission.title}
                      </h2>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                          {selectedSubmission.creatorName?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            {selectedSubmission.creatorName || '匿名用户'}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {new Date(selectedSubmission.submittedAt).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 描述 */}
                    {selectedSubmission.description && (
                      <div>
                        <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          作品描述
                        </h3>
                        <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {selectedSubmission.description}
                        </p>
                      </div>
                    )}

                    {/* 统计数据 */}
                    <div className={`grid grid-cols-3 gap-4 p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {selectedSubmission.voteCount}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>投票</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {selectedSubmission.likeCount}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>点赞</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {selectedSubmission.avgRating.toFixed(1)}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>评分</p>
                      </div>
                    </div>

                    {/* 评分组件 */}
                    <div>
                      <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        作品评分
                      </h3>
                      <RatingComponent
                        rating={selectedSubmission.avgRating}
                        ratingCount={selectedSubmission.ratingCount}
                        interactive={isAuthenticated}
                        userRating={currentInteraction?.userRating || null}
                        onRate={onRate}
                        size="lg"
                      />
                    </div>

                    {/* 操作按钮 */}
                    <div>
                      <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        互动操作
                      </h3>
                      <WorkActionButtons
                        voteCount={selectedSubmission.voteCount}
                        likeCount={selectedSubmission.likeCount}
                        hasVoted={currentInteraction?.hasVoted || false}
                        hasLiked={currentInteraction?.hasLiked || false}
                        onVote={onVote}
                        onLike={onLike}
                        onShare={handleShare}
                        size="lg"
                      />
                    </div>

                    {/* 文件列表 */}
                    {selectedSubmission.files && selectedSubmission.files.length > 0 && (
                      <div>
                        <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          附件 ({selectedSubmission.files.length})
                        </h3>
                        <div className="space-y-2">
                          {selectedSubmission.files.map((file: any, index: number) => (
                            <a
                              key={index}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                                isDark
                                  ? 'bg-gray-700 hover:bg-gray-600'
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                            >
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                              <span className={`text-sm truncate flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {file.name || `附件 ${index + 1}`}
                              </span>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`sticky top-24 rounded-2xl p-8 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <LayoutGrid className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    点击左侧作品查看详情
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
        </div>
      </main>
    </div>
  );
}
