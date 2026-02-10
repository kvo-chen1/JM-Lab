import { motion } from 'framer-motion';
import {
  Search,
  Calendar,
  ChevronRight,
  Trophy,
  FileText,
} from 'lucide-react';
import { BrandEvent } from '@/services/workScoringService';
import { useState, useMemo } from 'react';

interface ActivitySidebarProps {
  events: BrandEvent[];
  selectedEventId: string | null;
  onEventSelect: (eventId: string) => void;
  isDark: boolean;
}

export function ActivitySidebar({
  events,
  selectedEventId,
  onEventSelect,
  isDark,
}: ActivitySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    return events.filter(e =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [events, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-500';
      case 'pending':
        return 'bg-amber-500';
      case 'draft':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return '已发布';
      case 'pending':
        return '审核中';
      case 'draft':
        return '草稿';
      default:
        return '未知';
    }
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`w-72 flex-shrink-0 border-r ${
        isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      {/* 标题区 */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-red-500" />
          <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            活动列表
          </h2>
        </div>

        {/* 搜索框 */}
        <div className={`relative ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索活动..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-red-500'
                : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-red-500'
            } border outline-none`}
          />
        </div>
      </div>

      {/* 活动列表 */}
      <div className="overflow-y-auto h-[calc(100vh-180px)]">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              暂无活动
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredEvents.map((event) => (
              <motion.button
                key={event.id}
                onClick={() => onEventSelect(event.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                  selectedEventId === event.id
                    ? isDark
                      ? 'bg-red-500/20 border-red-500/50'
                      : 'bg-red-50 border-red-200'
                    : isDark
                    ? 'hover:bg-gray-700/50 border-transparent'
                    : 'hover:bg-gray-50 border-transparent'
                } border`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-medium text-sm truncate ${
                        selectedEventId === event.id
                          ? isDark
                            ? 'text-red-400'
                            : 'text-red-600'
                          : isDark
                          ? 'text-white'
                          : 'text-gray-900'
                      }`}
                    >
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`w-2 h-2 rounded-full ${getStatusColor(
                          event.status
                        )}`}
                      />
                      <span
                        className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        {getStatusText(event.status)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 ${
                      selectedEventId === event.id
                        ? isDark
                          ? 'text-red-400'
                          : 'text-red-500'
                        : isDark
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}
                  />
                </div>

                <div
                  className={`flex items-center gap-4 mt-2 text-xs ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(event.startTime).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>{event.submissionCount} 作品</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div
        className={`p-4 border-t ${
          isDark ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="grid grid-cols-2 gap-3">
          <div
            className={`text-center p-2 rounded-lg ${
              isDark ? 'bg-gray-700/50' : 'bg-white'
            }`}
          >
            <div className="text-lg font-bold text-red-500">{events.length}</div>
            <div
              className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            >
              活动总数
            </div>
          </div>
          <div
            className={`text-center p-2 rounded-lg ${
              isDark ? 'bg-gray-700/50' : 'bg-white'
            }`}
          >
            <div className="text-lg font-bold text-red-500">
              {events.reduce((sum, e) => sum + e.submissionCount, 0)}
            </div>
            <div
              className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            >
              作品总数
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
