import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { useNavigate } from 'react-router-dom';
import { eventService } from '@/services/eventService';
import { Event } from '@/types';
import { toast } from 'sonner';
import {
  CalendarDays,
  Search,
  Filter,
  MapPin,
  Clock,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function ActivityList() {
  const { isDark } = useTheme();
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'ongoing'>('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await eventService.getPublishedEvents();
      setEvents(data || []);
    } catch (error) {
      console.error('获取活动列表失败:', error);
      toast.error('获取活动列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchQuery || 
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'published') return matchesSearch && event.status === 'published';
    if (statusFilter === 'ongoing') {
      const endTime = event.end_time ? new Date(event.end_time) : null;
      return matchesSearch && event.status === 'published' && endTime && endTime > new Date();
    }
    return matchesSearch;
  });

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            活动列表
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            发现精彩活动，参与津脉文化之旅
          </p>
        </motion.div>

        {/* 搜索和筛选 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-4 rounded-2xl mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索活动..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-colors ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-red-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-red-500'
                }`}
              />
            </div>

            {/* 状态筛选 */}
            <div className="flex gap-2">
              {[
                { id: 'all', label: '全部' },
                { id: 'published', label: '已发布' },
                { id: 'ongoing', label: '进行中' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id as any)}
                  className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                    statusFilter === filter.id
                      ? 'bg-red-500 text-white'
                      : isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 活动列表 */}
        {filteredEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              暂无活动
            </h3>
            <p className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {searchQuery ? '没有找到匹配的活动' : '暂时没有可参与的活动'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/activities/${event.id}`)}
                className={`rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-xl'
                }`}
              >
                {/* 活动封面 */}
                <div className="aspect-video relative overflow-hidden">
                  {event.thumbnail_url || event.media?.[0]?.url ? (
                    <img
                      src={event.thumbnail_url || event.media?.[0]?.url}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <CalendarDays className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    </div>
                  )}
                  
                  {/* 状态标签 */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      event.status === 'published'
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-gray-500/90 text-white'
                    }`}>
                      {event.status === 'published' ? '进行中' : '已结束'}
                    </span>
                  </div>
                </div>

                {/* 活动信息 */}
                <div className="p-4">
                  <h3 className={`font-semibold text-lg mb-2 line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {event.title}
                  </h3>
                  
                  <p className={`text-sm mb-4 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {event.description || '暂无描述'}
                  </p>

                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(event.start_time)}</span>
                    </div>
                    
                    {event.location && (
                      <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="font-medium text-red-500">{event.participants || 0}</span> 人已参与
                      </div>
                      <button className="flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-600">
                        查看详情
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
