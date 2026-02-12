import { useEffect, useState } from 'react';
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
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface EventDetailModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  submissionCount?: number;
}

export default function EventDetailModal({ event, isOpen, onClose, submissionCount = 0 }: EventDetailModalProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);

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

  if (!event) return null;

  const now = new Date();
  const eventStart = new Date(event.startTime);
  const eventEnd = new Date(event.endTime);

  let status: 'upcoming' | 'ongoing' | 'completed' = 'upcoming';
  let statusText = '即将开始';
  let statusColor = 'bg-emerald-500';
  let statusBg = 'bg-emerald-100 text-emerald-700';

  if (now >= eventStart && now <= eventEnd) {
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

  const handleRegister = () => {
    toast.success('报名成功！', {
      action: {
        label: '查看详情',
        onClick: () => navigate(`/events/${event.id}`),
      },
    });
    onClose();
  };

  const handleSubmitWork = () => {
    onClose();
    navigate(`/events/${event.id}/submit`);
  };

  const { date, time } = formatDateRange(eventStart, eventEnd);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
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
              <img
                src={event.media?.[0]?.url || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20culture%20event&image_size=portrait_3_4`}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
              
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
                  {status === 'upcoming' ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRegister}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      立即报名
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  ) : status === 'ongoing' ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmitWork}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      提交作品
                      <ExternalLink className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-400 rounded-xl font-semibold cursor-not-allowed">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      活动已结束
                    </div>
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
