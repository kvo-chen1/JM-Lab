import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { useNavigate, useParams } from 'react-router-dom';
import { eventService } from '@/services/eventService';
import { Event } from '@/types';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  Edit,
  Trash2,
  Eye,
  Share2,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function OrganizerEventDetail() {
  const { isDark } = useTheme();
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [participantsCount, setParticipantsCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchEventDetail();
    }
  }, [id]);

  const fetchEventDetail = async () => {
    setIsLoading(true);
    try {
      const data = await eventService.getEventById(id!);
      setEvent(data);
      // 获取参与人数 - 暂时使用 event 中的 participants 字段
      setParticipantsCount(data?.participants || 0);
    } catch (error) {
      console.error('获取活动详情失败:', error);
      toast.error('获取活动详情失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个活动吗？此操作不可恢复。')) {
      return;
    }
    try {
      await eventService.deleteEvent(id!);
      toast.success('活动已删除');
      navigate('/organizer');
    } catch (error) {
      console.error('删除活动失败:', error);
      toast.error('删除活动失败');
    }
  };

  const formatDate = (timestamp: number | string | undefined) => {
    if (!timestamp) return '-';
    const date = typeof timestamp === 'number' 
      ? new Date(timestamp * 1000) 
      : new Date(timestamp);
    return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'draft': '草稿',
      'pending': '审核中',
      'published': '已发布',
      'ongoing': '进行中',
      'completed': '已结束',
      'cancelled': '已取消',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-600',
      'pending': 'bg-yellow-100 text-yellow-600',
      'published': 'bg-green-100 text-green-600',
      'ongoing': 'bg-blue-100 text-blue-600',
      'completed': 'bg-gray-100 text-gray-600',
      'cancelled': 'bg-red-100 text-red-600',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">活动不存在或已被删除</p>
          <button
            onClick={() => navigate('/organizer')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            返回主办方中心
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/organizer')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold">活动详情</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/edit-activity/${event.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                编辑活动
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：活动信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 活动封面 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm"
            >
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Calendar className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </motion.div>

            {/* 活动基本信息 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                    {getStatusText(event.status)}
                  </span>
                  <h2 className="text-2xl font-bold mt-3">{event.title}</h2>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {event.description}
              </p>
            </motion.div>

            {/* 活动内容 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold mb-4">活动内容</h3>
              <div className="prose dark:prose-invert max-w-none">
                {event.content || '暂无详细内容'}
              </div>
            </motion.div>
          </div>

          {/* 右侧：活动统计 */}
          <div className="space-y-6">
            {/* 时间信息 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold mb-4">时间信息</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">开始时间</p>
                    <p className="font-medium">{formatDate(event.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">结束时间</p>
                    <p className="font-medium">{formatDate(event.endDate)}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 地点信息 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold mb-4">地点信息</h3>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <p className="font-medium">{event.location || '线上活动'}</p>
              </div>
            </motion.div>

            {/* 参与统计 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold mb-4">参与统计</h3>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">参与人数</p>
                  <p className="text-2xl font-bold text-primary-600">{participantsCount}</p>
                </div>
              </div>
            </motion.div>

            {/* 操作按钮 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold mb-4">快捷操作</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/cultural-events?eventId=${event.id}&openModal=true`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  查看活动页面
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/cultural-events?eventId=${event.id}&openModal=true`);
                    toast.success('链接已复制');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  分享活动
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
