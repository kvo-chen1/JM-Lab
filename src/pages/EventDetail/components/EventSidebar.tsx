import { useState } from 'react';
import { Zap, Share2, Bookmark, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Event } from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface EventSidebarProps {
  event: Event;
  onShare: () => void;
  isBookmarked?: boolean;
  onBookmark: () => void;
}

export function EventSidebar({ event, onShare, isBookmarked, onBookmark }: EventSidebarProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ongoing':
        return '立即参与';
      case 'upcoming':
        return '即将开始';
      case 'completed':
        return '活动已结束';
      default:
        return '查看详情';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700';
      case 'upcoming':
        return 'from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700';
      case 'completed':
        return 'from-gray-500 to-gray-600 cursor-not-allowed';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const handleParticipate = async () => {
    if (event.status === 'completed') {
      toast.error('活动已结束');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: 实现参与逻辑
      navigate(`/events/${event.id}/works`);
    } catch (error) {
      toast.error('参与失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewWorks = () => {
    navigate(`/events/${event.id}/works`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      {/* 主操作按钮 */}
      <motion.button
        whileHover={{ scale: event.status !== 'completed' ? 1.02 : 1 }}
        whileTap={{ scale: event.status !== 'completed' ? 0.98 : 1 }}
        onClick={handleParticipate}
        disabled={event.status === 'completed' || isSubmitting}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-white shadow-lg shadow-green-500/25 transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${getStatusColor(event.status || '')}`}
      >
        <Zap className="w-5 h-5" />
        {getStatusText(event.status || '')}
      </motion.button>

      {/* 查看作品按钮 */}
      {event.status !== 'draft' && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleViewWorks}
          className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2"
        >
          <Trophy className="w-5 h-5" />
          查看作品
        </motion.button>
      )}

      {/* 分享和收藏 */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onShare}
          className="py-3 px-4 rounded-xl font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          分享
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBookmark}
          className={`py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border ${
            isBookmarked
              ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
              : 'text-gray-300 bg-white/5 hover:bg-white/10 border-white/10'
          }`}
        >
          <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-yellow-500' : ''}`} />
          {isBookmarked ? '已收藏' : '收藏'}
        </motion.button>
      </div>

      {/* 活动信息卡片 */}
      <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">活动信息</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">活动状态</span>
            <span className="text-gray-300">
              {event.status === 'ongoing' ? '进行中' : 
               event.status === 'upcoming' ? '未开始' : '已结束'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">参与者</span>
            <span className="text-gray-300">{event.participants || 0}人</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">浏览量</span>
            <span className="text-gray-300">{event.view_count || 0}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
