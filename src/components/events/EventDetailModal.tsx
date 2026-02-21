import { useEffect, useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Event } from '@/types';
import { 
  X, 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Share2,
  Heart,
  ExternalLink,
  ChevronRight,
  Tag,
  LayoutGrid,
  Eye,
  Loader2,
  CheckCircle,
  Edit,
  Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';
import { eventParticipationService } from '@/services/eventParticipationService';
import { ImageCarousel } from '@/components/ImageCarousel';

interface EventDetailModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  submissionCount?: number;
}

export default function EventDetailModal({ event, isOpen, onClose, submissionCount = 0 }: EventDetailModalProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useContext(AuthContext);
  const [isLiked, setIsLiked] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 检查用户是否已报名
  useEffect(() => {
    const checkRegistration = async () => {
      if (!isOpen || !event?.id || !user?.id) {
        setIsCheckingRegistration(false);
        setHasRegistered(false);
        return;
      }

      setIsCheckingRegistration(true);
      try {
        console.log('检查报名状态:', { eventId: event.id, userId: user.id });
        const status = await eventParticipationService.checkParticipation(event.id, user.id);
        console.log('报名状态结果:', status);
        setHasRegistered(status.isParticipated);
        // 如果状态是 'submitted'，说明已经提交过作品
        setHasSubmitted(status.status === 'submitted');
      } catch (error) {
        console.error('检查报名状态失败:', error);
        setHasRegistered(false);
        setHasSubmitted(false);
      } finally {
        setIsCheckingRegistration(false);
      }
    };

    checkRegistration();
  }, [isOpen, event?.id, user?.id]);

  if (!event) return null;

  const now = new Date();
  
  // 辅助函数：处理各种日期格式（Date对象、ISO字符串、秒级/毫秒级时间戳）
  const parseEventDate = (dateValue: any): Date => {
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
  
  const eventStart = parseEventDate(event.startTime);
  const eventEnd = parseEventDate(event.endTime);

  // 优先检查 final_ranking_published 字段或活动状态，如果已发布排名或状态为completed则视为已结束
  const isRankingPublished = (event as any).finalRankingPublished === true || 
                             (event as any).final_ranking_published === true ||
                             (event as any).status === 'completed';
  
  // 调试日志
  console.log('[EventDetailModal] 状态判断:', {
    isRankingPublished,
    eventStatus: (event as any).status,
    now: now.toISOString(),
    nowTime: now.getTime(),
    eventEnd: eventEnd.toISOString(),
    eventEndTime: eventEnd.getTime(),
    rawEndTime: event.endTime,
    rawEndTimeType: typeof event.endTime,
    isNowGreaterThanEnd: now > eventEnd,
    isNowGreaterThanEndTime: now.getTime() > eventEnd.getTime(),
    timeDiff: eventEnd.getTime() - now.getTime(),
    calculatedStatus: isRankingPublished ? 'completed' : (now > eventEnd ? 'completed' : (now >= eventStart && now <= eventEnd ? 'ongoing' : 'upcoming'))
  });
  
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

  const formatDateRange = (start: Date, end: Date) => {
    const startStr = start.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
    const endStr = end.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
    const timeStr = start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    
    if (startStr === endStr) {
      return { date: startStr, time: timeStr };
    }
    return { date: `${startStr} - ${endStr}`, time: timeStr };
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/events/${event.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('活动链接已复制到剪贴板');
    } catch {
      toast.error('复制链接失败');
    }
  };

  const handleRegister = async () => {
    // 检查是否登录
    if (!isAuthenticated || !user) {
      toast.warning('请先登录后再报名活动');
      navigate('/login', { state: { from: `/events/${event.id}` } });
      onClose();
      return;
    }

    // 检查活动是否已满
    if (event.maxParticipants && event.participants >= event.maxParticipants) {
      toast.error('活动参与人数已达上限');
      return;
    }

    // 检查是否已报名
    if (hasRegistered) {
      toast.info('您已经报名参加了此活动');
      navigate(`/events/${event.id}`);
      onClose();
      return;
    }

    setIsRegistering(true);
    try {
      const result = await eventParticipationService.registerForEvent(event.id, user.id);
      
      if (result.success) {
        setHasRegistered(true);
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span>报名成功！</span>
          </div>,
          {
            description: '您已成功报名参加活动',
            duration: 3000
          }
        );
        
        // 延迟后跳转到活动详情页
        setTimeout(() => {
          navigate(`/events/${event.id}`);
          onClose();
        }, 1500);
      } else {
        toast.error(result.error || '报名失败');
      }
    } catch (error) {
      console.error('报名失败:', error);
      toast.error('报名失败，请稍后重试');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSubmitWork = () => {
    onClose();
    navigate(`/events/${event.id}/submit`);
  };

  const { date, time } = formatDateRange(eventStart, eventEnd);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 md:p-6">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* 弹窗内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl flex flex-col md:flex-row ${
              isDark ? 'bg-gray-900' : 'bg-white'
            }`}
          >
            {/* 关闭按钮 */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className={`absolute top-3 right-3 md:top-4 md:right-4 z-20 p-2 rounded-full transition-all ${
                isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white/90 text-gray-600 hover:bg-white shadow-lg'
              }`}
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* 左侧图片区 */}
            <div className="w-full md:w-2/5 h-48 sm:h-56 md:h-auto relative shrink-0 overflow-hidden">
              {(() => {
                const images = event.media?.filter(m => m.type === 'image').map(m => m.url) || [];
                if (images.length === 0) {
                  images.push(`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20culture%20event&image_size=portrait_3_4`);
                }
                return (
                  <ImageCarousel
                    images={images}
                    alt={event.title}
                    aspectRatio="aspect-[3/4] md:aspect-auto md:h-full"
                    autoPlay={images.length > 1}
                    interval={4000}
                    showCounter={images.length > 1}
                  />
                );
              })()}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden pointer-events-none" />
              
              {/* 移动端标题 */}
              <div className="absolute bottom-4 left-4 right-4 md:hidden text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBg}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusColor} mr-1.5 ${status !== 'completed' ? 'animate-pulse' : ''}`} />
                    {statusText}
                  </span>
                </div>
                <h2 className="text-xl font-bold line-clamp-2">{event.title}</h2>
              </div>
            </div>

            {/* 右侧内容区 */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 md:p-8">
                {/* Desktop Header */}
                <div className="hidden md:block mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBg}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusColor} mr-1.5 ${status !== 'completed' ? 'animate-pulse' : ''}`} />
                      {statusText}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {event.type === 'online' ? '线上活动' : '线下活动'}
                    </span>
                  </div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {event.title}
                  </h2>
                </div>

                {/* 信息卡片 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-red-500/10' : 'bg-red-100'}`}>
                        <Calendar className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className={`text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          时间
                        </p>
                        <p className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                          {date}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {time}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
                        <MapPin className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className={`text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          地点
                        </p>
                        <p className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                          {event.location || (event.type === 'online' ? '线上活动' : '待定')}
                        </p>
                        {event.type === 'online' && (
                          <p className="text-sm text-blue-500 hover:text-blue-600 cursor-pointer inline-flex items-center gap-1">
                            查看链接 <ExternalLink className="w-3 h-3" />
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 活动详情 */}
                <div className="mb-6">
                  <h3 className={`font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    <div className={`w-1 h-5 rounded-full ${isDark ? 'bg-red-500' : 'bg-red-500'}`} />
                    活动详情
                  </h3>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {event.description}
                  </p>
                  {event.content && (
                    <div 
                      className={`mt-4 p-4 rounded-xl text-sm leading-relaxed ${isDark ? 'bg-gray-800/30 text-gray-300' : 'bg-gray-50 text-gray-600'}`}
                      dangerouslySetInnerHTML={{ __html: event.content }}
                    />
                  )}
                </div>

                {/* 标签 */}
                {event.tags && event.tags.length > 0 && (
                  <div className="mb-6">
                    <h4 className={`text-xs uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      相关标签
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${
                            isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 参与人数 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} mb-6`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/10' : 'bg-purple-100'}`}>
                      <Users className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className={`text-xs uppercase tracking-wider mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        参与人数
                      </p>
                      <p className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                        {event.participants || 0}
                        {event.maxParticipants && (
                          <span className={`text-sm font-normal ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            / {event.maxParticipants} 人
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部操作栏 */}
              <div className={`p-4 md:p-6 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className={`p-3 rounded-xl transition-colors ${
                      isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsLiked(!isLiked)}
                    className={`p-3 rounded-xl transition-colors ${
                      isLiked
                        ? 'bg-red-100 text-red-500'
                        : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  </motion.button>

                  {/* 查看作品按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onClose();
                      navigate(`/events/${event.id}/works`);
                    }}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      isDark
                        ? 'bg-purple-600 hover:bg-purple-500 text-white'
                        : 'bg-purple-500 hover:bg-purple-600 text-white'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    查看作品
                    {submissionCount > 0 && (
                      <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                        {submissionCount}
                      </span>
                    )}
                  </motion.button>

                  {/* 主操作按钮 */}
                  {isCheckingRegistration ? (
                    // 检查中
                    <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-400 rounded-xl font-semibold cursor-not-allowed">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      检查中...
                    </div>
                  ) : status === 'completed' ? (
                    // 活动已结束 - 显示查看排名按钮
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onClose();
                        navigate(`/ranking/${event.id}`);
                      }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white rounded-xl font-semibold shadow-lg shadow-yellow-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      <Trophy className="w-4 h-4" />
                      查看排名
                    </motion.button>
                  ) : hasRegistered && hasSubmitted ? (
                    // 已报名且已提交作品 - 显示编辑作品按钮
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmitWork}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      编辑作品
                    </motion.button>
                  ) : hasRegistered ? (
                    // 已报名但未提交作品 - 显示提交作品按钮
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmitWork}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      提交作品
                      <ExternalLink className="w-4 h-4" />
                    </motion.button>
                  ) : status === 'upcoming' ? (
                    // 未报名且活动即将开始 - 显示报名按钮
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRegister}
                      disabled={isRegistering || Boolean(event.maxParticipants && event.participants >= event.maxParticipants)}
                      className={`flex-1 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 ${
                        isRegistering || (event.maxParticipants && event.participants >= event.maxParticipants)
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/25'
                      }`}
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          报名中...
                        </>
                      ) : event.maxParticipants && event.participants >= event.maxParticipants ? (
                        '活动已满'
                      ) : (
                        <>
                          立即报名
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  ) : (
                    // 未报名且活动进行中 - 显示报名按钮（也可以直接参与）
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRegister}
                      disabled={isRegistering || Boolean(event.maxParticipants && event.participants >= event.maxParticipants)}
                      className={`flex-1 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 ${
                        isRegistering || (event.maxParticipants && event.participants >= event.maxParticipants)
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/25'
                      }`}
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          报名中...
                        </>
                      ) : event.maxParticipants && event.participants >= event.maxParticipants ? (
                        '活动已满'
                      ) : (
                        <>
                          立即参与
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
