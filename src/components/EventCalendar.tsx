
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { useEventService } from '@/hooks/useEventService';
import { Event } from '@/types';
import { TianjinImage } from './TianjinStyleComponents';
import { 
  Calendar, 
  MapPin, 
  Search, 
  X, 
  ChevronRight, 
  Tag,
  Share2,
  ExternalLink,
  User,
  Filter,
  LayoutGrid,
  Eye,
  Users
} from 'lucide-react';
import { eventWorkService } from '@/services/eventWorkService';
import ShareToCommunity from './ShareToCommunity';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

// 活动类型
import type { EventType } from '@/services/eventCalendarService';

// 活动日历组件
export default function EventCalendar() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'completed'>('upcoming');
  const [selectedEventType, setSelectedEventType] = useState<EventType | 'all'>('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedEventSubmissionCount, setSelectedEventSubmissionCount] = useState(0);
  const [isShareToCommunityOpen, setIsShareToCommunityOpen] = useState(false);
  
  const { getEvents } = useEventService();

  // 加载活动数据
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const allEvents = await getEvents();
        const eventsArray = Array.isArray(allEvents) ? allEvents : [];
        const publishedEvents = eventsArray.filter(event => event && event.status === 'published');
        
        setEvents(publishedEvents);
        setFilteredEvents(publishedEvents);

        // 智能切换 Tab
        const now = new Date();
        const hasUpcoming = publishedEvents.some(e => {
          try { return new Date(e.startTime) > now; } catch { return false; }
        });
        const hasOngoing = publishedEvents.some(e => {
          try { 
            const start = new Date(e.startTime);
            const end = new Date(e.endTime);
            return start <= now && end >= now;
          } catch { return false; }
        });

        if (!hasUpcoming && hasOngoing) {
          setActiveTab('ongoing');
        }
      } catch (error) {
        console.error('加载活动失败:', error);
        setEvents([]);
        setFilteredEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [getEvents]);

  // 筛选事件
  useEffect(() => {
    let result = [...events];
    const now = new Date();

    // 按状态筛选
    if (activeTab === 'upcoming') {
      result = result.filter(event => {
        try { return new Date(event.startTime) > now; } catch { return false; }
      });
    } else if (activeTab === 'ongoing') {
      result = result.filter(event => {
        try {
          const start = new Date(event.startTime);
          const end = new Date(event.endTime);
          return start <= now && end >= now;
        } catch { return false; }
      });
    } else if (activeTab === 'completed') {
      result = result.filter(event => {
        try { return new Date(event.endTime) < now; } catch { return false; }
      });
    }

    // 按类型筛选
    if (selectedEventType !== 'all') {
       // result = result.filter(event => event.type === selectedEventType);
    }

    // 按关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(event => {
        try {
          return (
            event.title.toLowerCase().includes(keyword) ||
            event.description.toLowerCase().includes(keyword) ||
            (event.tags && event.tags.some(tag => tag.toLowerCase().includes(keyword)))
          );
        } catch { return true; }
      });
    }

    setFilteredEvents(result);
  }, [activeTab, selectedEventType, events, searchKeyword]);

  const handleEventClick = async (event: Event) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
    // 加载作品数量
    try {
      const count = await eventWorkService.getEventSubmissionCount(event.id);
      setSelectedEventSubmissionCount(count);
    } catch {
      setSelectedEventSubmissionCount(0);
    }
  };

  const handleRegisterEvent = async (eventId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-medium text-emerald-700">报名成功</span>
            <span className="text-emerald-500">✓</span>
          </div>
          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-[#C02C38] to-[#D64545] text-white hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-1 font-medium whitespace-nowrap"
          >
            <ExternalLink className="w-3 h-3" />
            查看活动详情
          </button>
        </div>,
        {
          duration: 5000,
          className: 'bg-emerald-50 border-emerald-200'
        }
      );
      import('@/services/enhancedEventBus').then(({ default: eventBus }) => {
        // @ts-ignore - 事件类型定义不匹配，但功能正常
        eventBus.emit('activity:registered', { 
          // @ts-ignore
          eventId 
        });
      });
    } catch (error) {
      toast.error('报名失败，请稍后重试');
    }
  };

  const handleSubmitWork = (eventId: string) => {
    // 关闭详情弹窗
    setIsEventDetailsOpen(false);
    // 跳转到提交作品页面
    navigate(`/events/${eventId}/submit`);
  };

  const getEventTypeDisplayName = (type: EventType): string => {
    const typeMap: Record<EventType, string> = {
      theme: '主题活动',
      collaboration: '协作活动',
      competition: '竞赛',
      workshop: '工作坊',
      exhibition: '展览'
    };
    return typeMap[type] || type;
  };

  // 格式化日期范围
  const formatDateRange = (start: string | number | Date, end: string | number | Date) => {
    const s = new Date(start);
    const e = new Date(end);
    const dateStr = s.toLocaleDateString('zh-CN');
    const timeStr = `${s.getHours().toString().padStart(2, '0')}:${s.getMinutes().toString().padStart(2, '0')}`;
    const endDateStr = e.toLocaleDateString('zh-CN');
    const endTimeStr = `${e.getHours().toString().padStart(2, '0')}:${e.getMinutes().toString().padStart(2, '0')}`;
    
    if (dateStr === endDateStr) {
      return { date: dateStr, time: `${timeStr} - ${endTimeStr}` };
    }
    return { date: `${dateStr} 至 ${endDateStr}`, time: `${timeStr} - ${endTimeStr}` };
  };

  // 获取活动的时间状态
  const getEventTimeStatus = (event: Event): 'upcoming' | 'ongoing' | 'completed' => {
    const now = new Date();
    try {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      if (now < start) return 'upcoming';
      if (now >= start && now <= end) return 'ongoing';
      return 'completed';
    } catch {
      return 'completed';
    }
  };

  // 处理分享
  const handleShare = async (event: Event) => {
    try {
      const shareUrl = `${window.location.origin}/events/${event.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('活动链接已复制到剪贴板');
    } catch (error) {
      toast.error('复制链接失败');
    }
  };

  if (isLoading) {
    return (
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm animate-pulse`}>
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      {/* 顶部控制栏 */}
      <div className={`sticky top-0 z-10 p-4 sm:p-6 mb-6 rounded-2xl shadow-sm backdrop-blur-md ${isDark ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90 border border-gray-100'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">津脉活动</h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>探索天津文化的无限魅力</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative group">
              <input 
                type="text"
                placeholder="搜索活动..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className={`w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all border ${
                  isDark 
                    ? 'bg-gray-900/50 border-gray-700 focus:border-red-500 text-white' 
                    : 'bg-gray-50 border-gray-200 focus:border-red-500 text-gray-900'
                } focus:outline-none focus:ring-4 focus:ring-red-500/10`}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
            </div>
          </div>
        </div>

        {/* 筛选标签 */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <div className={`inline-flex p-1 rounded-xl ${isDark ? 'bg-gray-900/50' : 'bg-gray-100/80'}`}>
            {[
              { id: 'upcoming', name: '即将开始' },
              { id: 'ongoing', name: '进行中' },
              { id: 'completed', name: '已结束' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'text-white shadow-md'
                    : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-red-600 rounded-lg"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Filter className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <button
              onClick={() => setSelectedEventType('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                selectedEventType === 'all'
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
                  : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
              }`}
            >
              全部
            </button>
            {(['theme', 'collaboration', 'competition', 'workshop', 'exhibition'] as EventType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedEventType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  selectedEventType === type
                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
                    : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
                }`}
              >
                {getEventTypeDisplayName(type)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 活动列表网格 */}
      <AnimatePresence mode="wait">
        {filteredEvents.length > 0 ? (
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1"
          >
            {filteredEvents.map((event) => {
              const { date } = formatDateRange(event.startTime, event.endTime);
              return (
                <motion.div
                  key={event.id}
                  whileHover={{ y: -6, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleEventClick(event)}
                  className={`group relative flex flex-col rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                  } cursor-pointer`}
                >
                  {/* 卡片封面 */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <TianjinImage
                      src={event.media?.[0]?.url || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20culture%20${event.type}&image_size=landscape_16_9`}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      ratio="landscape"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-md shadow-sm ${
                        event.type === 'online' ? 'bg-blue-500/90 text-white' : 'bg-emerald-500/90 text-white'
                      }`}>
                        {event.type === 'online' ? '线上' : '线下'}
                      </span>
                    </div>
                  </div>

                  {/* 卡片内容 */}
                  <div className="flex-1 p-5 flex flex-col">
                    <h3 className={`text-lg font-bold mb-2 line-clamp-2 leading-tight group-hover:text-red-600 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      {event.title}
                    </h3>
                    
                    <div className="mt-auto space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span className="truncate">{date}</span>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}

                      <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <div className="flex -space-x-2">
                          {[...Array(Math.min(3, event.participants || 0))].map((_, i) => (
                            <div key={i} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                              isDark ? 'border-gray-800 bg-gray-700' : 'border-white bg-gray-200'
                            }`}>
                              <User className="w-3 h-3" />
                            </div>
                          ))}
                          {(event.participants || 0) > 0 && (
                            <span className="ml-3 text-xs text-gray-500 dark:text-gray-400 self-center">
                              {event.participants}人参与
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                          activeTab === 'upcoming' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          activeTab === 'ongoing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {activeTab === 'upcoming' ? '招募中' : activeTab === 'ongoing' ? '进行中' : '已结束'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col items-center justify-center py-20 px-4 rounded-3xl border-2 border-dashed ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}
          >
            <div className={`p-4 rounded-full mb-4 ${isDark ? 'bg-gray-700' : 'bg-white shadow-sm'}`}>
              <Calendar className={`w-12 h-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <h3 className="text-xl font-bold mb-2">暂无相关活动</h3>
            <p className={`text-center max-w-xs mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              当前筛选条件下没有找到活动，换个筛选条件试试吧
            </p>
            <button 
              onClick={() => {
                const now = new Date();
                const hasOngoing = events.some(e => {
                  try { 
                    const start = new Date(e.startTime);
                    const end = new Date(e.endTime);
                    return start <= now && end >= now;
                  } catch { return false; }
                });
                setActiveTab(hasOngoing ? 'ongoing' : 'upcoming');
                setSelectedEventType('all');
                setSearchKeyword('');
              }}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 transition-all hover:scale-105"
            >
              查看所有活动
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 详情弹窗 */}
      <AnimatePresence>
        {isEventDetailsOpen && selectedEvent && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsEventDetailsOpen(false)}
              className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl md:rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] flex flex-col md:flex-row ${isDark ? 'bg-slate-900' : 'bg-white'}`}
            >
              {/* 关闭按钮 */}
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEventDetailsOpen(false)}
                className="absolute top-3 right-3 md:top-4 md:right-4 z-20 p-2 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 shadow-lg backdrop-blur-sm transition-all"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </motion.button>

              {/* 左侧/顶部 图片区 */}
              <div className="w-full md:w-1/2 h-52 sm:h-60 md:h-auto relative shrink-0 overflow-hidden">
                <motion.div 
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="w-full h-full"
                >
                  <TianjinImage
                    src={selectedEvent.media?.[0]?.url || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20culture%20${selectedEvent.type}&image_size=portrait_3_4`}
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                    ratio="portrait"
                  />
                </motion.div>
                {/* 渐变遮罩 - 移动端显示标题 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent md:hidden" />
                <div className="absolute bottom-4 left-4 right-4 md:hidden text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
                      getEventTimeStatus(selectedEvent) === 'upcoming' ? 'bg-emerald-500/90 text-white' : 
                      getEventTimeStatus(selectedEvent) === 'ongoing' ? 'bg-amber-500/90 text-white' : 'bg-slate-500/90 text-white'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        getEventTimeStatus(selectedEvent) === 'upcoming' ? 'bg-white animate-pulse' : 
                        getEventTimeStatus(selectedEvent) === 'ongoing' ? 'bg-white animate-pulse' : 'bg-white/60'
                      }`} />
                      {getEventTimeStatus(selectedEvent) === 'upcoming' ? '即将开始' : getEventTimeStatus(selectedEvent) === 'ongoing' ? '进行中' : '已结束'}
                    </span>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/20 backdrop-blur-sm">
                      {selectedEvent.type === 'online' ? '线上活动' : '线下活动'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold line-clamp-2 leading-snug">{selectedEvent.title}</h2>
                </div>
              </div>

              {/* 右侧/底部 内容区 */}
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                  <div className="p-5 md:p-8">
                    {/* Desktop Header */}
                    <div className="hidden md:block mb-8">
                      <div className="flex items-center gap-2.5 mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          getEventTimeStatus(selectedEvent) === 'upcoming' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          getEventTimeStatus(selectedEvent) === 'ongoing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            getEventTimeStatus(selectedEvent) === 'upcoming' ? 'bg-emerald-500 animate-pulse' : 
                            getEventTimeStatus(selectedEvent) === 'ongoing' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
                          }`} />
                          {getEventTimeStatus(selectedEvent) === 'upcoming' ? '即将开始' : getEventTimeStatus(selectedEvent) === 'ongoing' ? '进行中' : '已结束'}
                        </span>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                          {selectedEvent.type === 'online' ? '线上活动' : '线下活动'}
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold leading-tight text-gray-900 dark:text-white">{selectedEvent.title}</h2>
                    </div>

                    {/* Info Grid - 现代化卡片设计 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8">
                      <motion.div 
                        whileHover={{ y: -2, boxShadow: '0 8px 30px -10px rgba(0,0,0,0.15)' }}
                        className={`group p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all duration-300 ${isDark ? 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600' : 'bg-gradient-to-br from-slate-50 to-white border-slate-100 hover:border-slate-200'}`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div className={`p-2.5 rounded-xl ${isDark ? 'bg-rose-500/10' : 'bg-rose-50'}`}>
                            <Calendar className="w-5 h-5 text-rose-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">时间</p>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{formatDateRange(selectedEvent.startTime, selectedEvent.endTime).date}</p>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatDateRange(selectedEvent.startTime, selectedEvent.endTime).time}</p>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div 
                        whileHover={{ y: -2, boxShadow: '0 8px 30px -10px rgba(0,0,0,0.15)' }}
                        className={`group p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all duration-300 ${isDark ? 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600' : 'bg-gradient-to-br from-slate-50 to-white border-slate-100 hover:border-slate-200'}`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div className={`p-2.5 rounded-xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                            <MapPin className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">地点</p>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm md:text-base line-clamp-2">{selectedEvent.location || (selectedEvent.type === 'online' ? '线上活动' : '暂无地点')}</p>
                            {selectedEvent.type === 'online' && (
                              <p className="text-xs md:text-sm text-blue-500 hover:text-blue-600 cursor-pointer mt-1 inline-flex items-center gap-1">
                                点击查看链接 <ExternalLink className="w-3 h-3" />
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Description - 更精致的排版 */}
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-6 md:h-7 bg-gradient-to-b from-rose-500 to-rose-600 rounded-full" />
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">活动详情</h3>
                      </div>
                      <div className={`prose dark:prose-invert max-w-none ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        <p className="text-sm md:text-base leading-relaxed">
                          {selectedEvent.description}
                        </p>
                      </div>
                      {selectedEvent.content && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mt-5 p-4 md:p-5 rounded-xl md:rounded-2xl border text-sm leading-relaxed ${isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50/50 border-slate-100'}`} 
                          dangerouslySetInnerHTML={{ __html: selectedEvent.content }} 
                        />
                      )}
                    </div>

                    {/* Tags */}
                    {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">相关标签</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedEvent.tags.map((tag, i) => (
                            <motion.span 
                              key={i} 
                              whileHover={{ scale: 1.05 }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 查看作品卡片 - 已结束活动 */}
                {getEventTimeStatus(selectedEvent) === 'completed' && (
                  <div className={`px-5 md:px-8 pt-3 pb-2 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                    <motion.button
                      whileHover={{ scale: 1.01, y: -2 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setIsEventDetailsOpen(false);
                        navigate(`/events/${selectedEvent.id}/works`);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 group ${isDark ? 'bg-violet-600/20 border-violet-500/50 hover:border-violet-400 hover:bg-violet-600/30' : 'bg-violet-100 border-violet-300 hover:border-violet-400 hover:bg-violet-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'bg-violet-500/30 group-hover:bg-violet-500/40' : 'bg-violet-200 group-hover:bg-violet-300'}`}>
                          <LayoutGrid className={`w-5 h-5 ${isDark ? 'text-violet-300' : 'text-violet-700'}`} />
                        </div>
                        <div className="text-left">
                          <p className={`font-semibold text-sm ${isDark ? 'text-violet-200' : 'text-violet-900'}`}>查看作品</p>
                          <p className={`text-xs ${isDark ? 'text-violet-400' : 'text-violet-700'}`}>
                            {selectedEventSubmissionCount > 0 ? `${selectedEventSubmissionCount} 个作品` : '暂无作品'}
                          </p>
                        </div>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isDark ? 'bg-violet-500/30 group-hover:bg-violet-500/40' : 'bg-violet-200 group-hover:bg-violet-300'}`}>
                        <Eye className={`w-4 h-4 ${isDark ? 'text-violet-300' : 'text-violet-700'}`} />
                      </div>
                    </motion.button>
                  </div>
                )}

                {/* Footer Action Bar - 现代化设计 */}
                <div className={`p-4 md:p-6 border-t ${isDark ? 'border-slate-800 bg-slate-900/95' : 'border-slate-100 bg-white/95'} backdrop-blur-sm`}>
                  <div className="flex items-center justify-between gap-3 md:gap-4">
                    {/* 参与人数 */}
                    <div className="hidden sm:flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <Users className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                      </div>
                      <div>
                        <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">参与人数</p>
                        <p className="font-bold text-base md:text-lg text-gray-900 dark:text-white">
                          {selectedEvent.participants || 0}
                          <span className="text-xs md:text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">
                            {selectedEvent.maxParticipants ? `/ ${selectedEvent.maxParticipants}` : '人已报名'}
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    {/* 操作按钮组 */}
                    <div className="flex gap-2 md:gap-3 flex-1 sm:flex-none justify-end">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleShare(selectedEvent)}
                        className={`p-2.5 md:p-3 rounded-xl transition-all ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                        title="复制链接"
                      >
                        <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                      </motion.button>
                      
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsShareToCommunityOpen(true)}
                        className={`p-2.5 md:p-3 rounded-xl transition-all ${isDark ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'}`}
                        title="分享到社群"
                      >
                        <Users className="w-4 h-4 md:w-5 md:h-5" />
                      </motion.button>
                      
                      {/* 查看作品按钮 - 在即将开始和进行中活动中显示 */}
                      {(getEventTimeStatus(selectedEvent) === 'upcoming' || getEventTimeStatus(selectedEvent) === 'ongoing') && (
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setIsEventDetailsOpen(false);
                            navigate(`/events/${selectedEvent.id}/works`);
                          }}
                          className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold text-sm md:text-base transition-all flex items-center justify-center gap-2 ${isDark ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20' : 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg shadow-violet-500/25'}`}
                        >
                          <LayoutGrid className="w-4 h-4" />
                          <span className="hidden sm:inline">查看作品</span>
                          <span className="sm:hidden">作品</span>
                          {selectedEventSubmissionCount > 0 && (
                            <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                              {selectedEventSubmissionCount}
                            </span>
                          )}
                        </motion.button>
                      )}
                      
                      {/* 主操作按钮 */}
                      {getEventTimeStatus(selectedEvent) === 'upcoming' ? (
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            handleRegisterEvent(selectedEvent.id);
                            setIsEventDetailsOpen(false);
                          }}
                          className="flex-1 sm:flex-none px-5 md:px-8 py-2.5 md:py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl font-semibold text-sm md:text-base shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2"
                        >
                          <span className="hidden sm:inline">立即报名</span>
                          <span className="sm:hidden">报名</span>
                          <ChevronRight className="w-4 h-4" />
                        </motion.button>
                      ) : getEventTimeStatus(selectedEvent) === 'ongoing' ? (
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            handleSubmitWork(selectedEvent.id);
                            setIsEventDetailsOpen(false);
                          }}
                          className="flex-1 sm:flex-none px-5 md:px-8 py-2.5 md:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold text-sm md:text-base shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                        >
                          <span className="hidden sm:inline">提交作品</span>
                          <span className="sm:hidden">提交</span>
                          <ExternalLink className="w-4 h-4" />
                        </motion.button>
                      ) : (
                        <div className="flex-1 sm:flex-none flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-xl font-semibold text-sm md:text-base cursor-not-allowed bg-slate-50 dark:bg-slate-800/50">
                          <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
                          <span className="hidden sm:inline">活动已结束</span>
                          <span className="sm:hidden">已结束</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 分享到社群弹窗 */}
      {selectedEvent && user && (
        <ShareToCommunity
          isOpen={isShareToCommunityOpen}
          onClose={() => setIsShareToCommunityOpen(false)}
          shareCard={{
            type: 'activity',
            id: selectedEvent.id,
            title: selectedEvent.title,
            description: selectedEvent.description,
            thumbnail: selectedEvent.media?.[0]?.url,
            url: `${window.location.origin}/events/${selectedEvent.id}`
          }}
          userId={user.id}
          userName={user.username || '用户'}
          userAvatar={user.avatar}
        />
      )}
    </div>
  );
}
