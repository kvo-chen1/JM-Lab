import { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { Event } from '@/types';
import { useEventService } from '@/hooks/useEventService';
import { InfoCard, StatCard } from '@/components/InfoCard';
import PublishToSquareModal from '@/components/PublishToSquareModal';
import { ShareModal } from '@/components/ShareModal';
import { EventCard } from '@/components/EventCard';

import {
  CalendarDays,
  Users,
  Eye,
  MapPin,
  Clock,
  Share2,
  Edit3,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  Clock3,
  FileText,
  ChevronLeft,
  Tag,
  User,
  Mail,
  Phone,
  ArrowRight,
  MoreHorizontal,
  Bookmark,
  MessageCircle,
  Crown
} from 'lucide-react';

// 活动状态配置
const statusConfig = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: FileText },
  pending: { label: '审核中', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: Clock3 },
  published: { label: '已发布', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2 },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: XCircle }
};

export default function ActivityDetail() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const { getEvent, deleteEvent, updateEvent, getEvents, getEventStats, incrementViewCount } = useEventService();

  // 活动数据
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);
  const [eventStats, setEventStats] = useState({
    viewCount: 0,
    participants: 0,
    likes: 0,
    shares: 0,
    comments: 0
  });

  // 弹窗状态
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // 检查登录状态并加载活动数据
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    if (!eventId) {
      toast.error('活动ID不存在');
      navigate('/activities');
      return;
    }

    loadEventData();
  }, [isAuthenticated, user, navigate, eventId]);

  // 加载活动数据
  const loadEventData = async () => {
    if (!eventId) return;

    try {
      setIsLoading(true);
      const eventData = await getEvent(eventId);
      setEvent(eventData);

      // 增加浏览量
      await incrementViewCount(eventId);

      // 获取活动统计
      const stats = await getEventStats(eventId);
      setEventStats(stats);

      // 获取相关活动
      const related = await getEvents({
        type: eventData.type,
        limit: 3,
        excludeId: eventId
      });
      setRelatedEvents(related);
    } catch (error) {
      toast.error('加载活动详情失败');
      navigate('/activities');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理删除活动
  const handleDeleteEvent = async () => {
    if (!eventId) return;

    if (window.confirm('确定要删除这个活动吗？此操作不可恢复。')) {
      try {
        await deleteEvent(eventId);
        toast.success('活动已删除');
        navigate('/activities');
      } catch (error) {
        toast.error('删除活动失败，请稍后重试');
      }
    }
  };

  // 处理状态更新
  const handleStatusUpdate = async (newStatus: Event['status']) => {
    if (!eventId) return;

    try {
      await updateEvent(eventId, { status: newStatus });
      setEvent(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`活动状态已更新为${statusConfig[newStatus].label}`);
    } catch (error) {
      toast.error('更新状态失败，请稍后重试');
    }
  };

  // 格式化日期
  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  // 格式化相对时间
  const formatRelativeTime = (date: Date | string) => {
    const now = new Date();
    const eventDate = new Date(date);
    const diff = eventDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return '已结束';
    if (days === 0) return '今天';
    if (days === 1) return '明天';
    if (days <= 7) return `${days}天后`;
    return formatDate(date);
  };

  // 检查是否是活动组织者
  const isOrganizer = useMemo(() => {
    return event?.organizerId === user?.id || user?.isAdmin;
  }, [event, user]);

  // 检查活动状态
  const isUpcoming = useMemo(() => {
    if (!event) return false;
    return new Date(event.startTime) > new Date();
  }, [event]);

  const isOngoing = useMemo(() => {
    if (!event) return false;
    const now = new Date();
    return new Date(event.startTime) <= now && new Date(event.endTime) >= now;
  }, [event]);

  const isEnded = useMemo(() => {
    if (!event) return false;
    return new Date(event.endTime) < new Date();
  }, [event]);

  // 跳转到最终排名页面
  const goToFinalRanking = () => {
    if (!eventId) return;
    navigate(`/ranking/${eventId}`);
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <motion.div
            className="inline-block"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full" />
          </motion.div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <CalendarDays className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">活动不存在</h3>
          <p className="mt-2 text-gray-500">该活动可能已被删除或不存在</p>
          <button
            onClick={() => navigate('/activities')}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            返回活动列表
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[event.status].icon;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 返回按钮 */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/activities')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          返回活动列表
        </motion.button>

        {/* 三栏布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左栏：活动基本信息 (3列) */}
          <div className="lg:col-span-3 xl:col-span-3 space-y-6">
            {/* 活动封面 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden shadow-card"
            >
              {event.thumbnailUrl ? (
                <img
                  src={event.thumbnailUrl}
                  alt={event.title}
                  className="w-full aspect-[4/3] object-cover"
                />
              ) : (
                <div className={`w-full aspect-[4/3] flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <CalendarDays className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </motion.div>

            {/* 活动状态 */}
            <InfoCard>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusConfig[event.status].color}`}>
                    <StatusIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">活动状态</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{statusConfig[event.status].label}</p>
                  </div>
                </div>
                {isUpcoming && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                    {formatRelativeTime(event.startTime)}
                  </span>
                )}
                {isOngoing && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    进行中
                  </span>
                )}
                {isEnded && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    已结束
                  </span>
                )}
              </div>
            </InfoCard>

            {/* 关键信息 */}
            <InfoCard title="活动信息" icon={<CalendarDays className="w-5 h-5" />}>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">开始时间</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(event.startTime)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">结束时间</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(event.endTime)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">活动地点</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{event.location || '待定'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">活动类型</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.type === 'online' ? '线上活动' : '线下活动'}
                    </p>
                  </div>
                </div>
              </div>
            </InfoCard>

            {/* 组织者信息 */}
            <InfoCard title="组织者" icon={<User className="w-5 h-5" />}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                  {event.organizerName?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{event.organizerName || '未知'}</p>
                  <p className="text-xs text-gray-500">活动组织者</p>
                </div>
              </div>
              {(event.contactPhone || event.contactEmail) && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
                  {event.contactPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">{event.contactPhone}</span>
                    </div>
                  )}
                  {event.contactEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">{event.contactEmail}</span>
                    </div>
                  )}
                </div>
              )}
            </InfoCard>
          </div>

          {/* 中栏：活动详情内容 (6列) */}
          <div className="lg:col-span-6 xl:col-span-6">
            {/* 活动标题和操作 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-6 mb-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-card`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">{event.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsShareModalOpen(true)}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Bookmark className="w-5 h-5" />
                  </motion.button>
                  {isOrganizer && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/edit-activity/${eventId}`)}
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <Edit3 className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleDeleteEvent}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
                    </>
                  )}
                </div>
              </div>

              {/* 标签 */}
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* 活动详情内容 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-card`}
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">活动详情</h2>
              <div className="prose dark:prose-invert max-w-none">
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {event.content}
                </div>
              </div>
            </motion.div>

            {/* 多媒体画廊 */}
            {event.media && event.media.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`rounded-2xl p-6 mt-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-card`}
              >
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">活动图片</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {event.media.map((media, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer"
                    >
                      <img
                        src={media.url}
                        alt={`活动图片 ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* 右栏：统计和操作 (3列) */}
          <div className="lg:col-span-3 xl:col-span-3 space-y-6">
            {/* 统计数据 */}
            <InfoCard title="数据统计" icon={<MoreHorizontal className="w-5 h-5" />}>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <Eye className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{eventStats.viewCount}</p>
                  <p className="text-xs text-gray-500">浏览</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <Users className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{eventStats.participants}</p>
                  <p className="text-xs text-gray-500">参与</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <Heart className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{eventStats.likes}</p>
                  <p className="text-xs text-gray-500">点赞</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <Share2 className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{eventStats.shares}</p>
                  <p className="text-xs text-gray-500">分享</p>
                </div>
              </div>
            </InfoCard>

            {/* 操作按钮 */}
            <InfoCard>
              <div className="space-y-3">
                {event.status === 'draft' && isOrganizer && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStatusUpdate('pending')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-all"
                  >
                    <Send className="w-4 h-4" />
                    提交审核
                  </motion.button>
                )}

                {event.status === 'published' && isOrganizer && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsPublishModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    发布到广场
                  </motion.button>
                )}

                {/* 查看最终排名按钮 */}
                {(isOrganizer || isEnded) && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={goToFinalRanking}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-xl transition-all ${
                      isDark
                        ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-white'
                        : 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-white'
                    }`}
                  >
                    <Crown className="w-4 h-4" />
                    查看最终排名
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  联系组织者
                </motion.button>

                {isOrganizer && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/edit-activity/${eventId}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-primary-500 text-primary-600 dark:text-primary-400 font-medium rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    编辑活动
                  </motion.button>
                )}
              </div>
            </InfoCard>

            {/* 相关活动 */}
            {relatedEvents.length > 0 && (
              <InfoCard title="相关活动" icon={<CalendarDays className="w-5 h-5" />}>
                <div className="space-y-4">
                  {relatedEvents.map((relatedEvent) => (
                    <motion.div
                      key={relatedEvent.id}
                      whileHover={{ x: 4 }}
                      onClick={() => navigate(`/activities/${relatedEvent.id}`)}
                      className="flex gap-3 cursor-pointer group"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                        {relatedEvent.thumbnailUrl ? (
                          <img
                            src={relatedEvent.thumbnailUrl}
                            alt={relatedEvent.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <CalendarDays className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {relatedEvent.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(relatedEvent.startTime).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/activities')}
                  className="w-full mt-4 flex items-center justify-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  查看更多活动
                  <ArrowRight className="w-4 h-4" />
                </button>
              </InfoCard>
            )}

            {/* 帮助提示 */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 text-sm mb-2">💡 提示</h4>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                有问题？可以联系活动组织者获取更多信息。记得提前报名哦！
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 分享弹窗 */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={event.title}
        description={event.description}
        url={window.location.href}
      />

      {/* 发布到广场弹窗 */}
      <PublishToSquareModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        event={event}
        onPublish={() => {
          toast.success('活动已发布到广场');
          setIsPublishModalOpen(false);
        }}
      />
    </div>
  );
}
