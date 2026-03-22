import { Calendar, Clock, MapPin, Users, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Event } from '@/types';

interface EventInfoProps {
  event: Event;
  viewCount: number;
  participantCount: number;
}

export function EventInfo({ event, viewCount, participantCount }: EventInfoProps) {
  const formatDate = (dateString: string | number) => {
    if (!dateString) return '未设置';
    const date = typeof dateString === 'number' 
      ? new Date(dateString) 
      : new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTime = (dateString: string | number) => {
    if (!dateString) return '';
    const date = typeof dateString === 'number' 
      ? new Date(dateString) 
      : new Date(dateString);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'upcoming':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ongoing':
        return '进行中';
      case 'upcoming':
        return '未开始';
      case 'completed':
        return '已结束';
      default:
        return status;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#252525] border border-white/5"
    >
      {/* 装饰性渐变 */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-500/5 to-transparent rounded-bl-full" />
      
      <div className="relative p-6 sm:p-8">
        {/* 状态标签 */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status || '')}`}>
            {getStatusText(event.status || '')}
          </span>
          {event.category && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-400 border border-white/5">
              {event.category}
            </span>
          )}
        </div>

        {/* 标题 */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 leading-tight">
          {event.title}
        </h1>

        {/* 时间信息 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white/5">
              <Calendar className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">开始时间</p>
              <p className="text-sm text-white font-medium">
                {formatDate(event.start_time || event.start_date || '')}
                {formatTime(event.start_time || event.start_date || '')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white/5">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">结束时间</p>
              <p className="text-sm text-white font-medium">
                {formatDate(event.end_time || event.end_date || '')}
                {formatTime(event.end_time || event.end_date || '')}
              </p>
            </div>
          </div>
        </div>

        {/* 地点 */}
        {event.location && (
          <div className="flex items-start gap-3 mb-6">
            <div className="p-2 rounded-lg bg-white/5">
              <MapPin className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">活动地点</p>
              <p className="text-sm text-white">{event.location}</p>
            </div>
          </div>
        )}

        {/* 分隔线 */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

        {/* 统计数据 */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-400">参与人数</span>
            <span className="text-lg font-bold text-white">{participantCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-400">浏览次数</span>
            <span className="text-lg font-bold text-white">{viewCount}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
