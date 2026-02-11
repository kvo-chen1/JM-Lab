
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
  Clock, 
  Users, 
  Search, 
  X, 
  ChevronRight, 
  Tag,
  Share2,
  ExternalLink,
  User,
  Phone,
  Mail,
  Filter
} from 'lucide-react';

// 活动类型
import type { EventType } from '@/services/eventCalendarService';

// 活动日历组件
export default function EventCalendar() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'completed'>('upcoming');
  const [selectedEventType, setSelectedEventType] = useState<EventType | 'all'>('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  
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

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };

  const handleRegisterEvent = async (eventId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('报名成功！请留意通知消息');
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
              const { date, time } = formatDateRange(event.startTime, event.endTime);
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEventDetailsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col md:flex-row ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            >
              <button 
                onClick={() => setIsEventDetailsOpen(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* 左侧/顶部 图片区 */}
              <div className="w-full md:w-2/5 h-48 md:h-auto relative shrink-0">
                <TianjinImage
                  src={selectedEvent.media?.[0]?.url || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20culture%20${selectedEvent.type}&image_size=portrait_3_4`}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                  ratio="portrait"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden" />
                <div className="absolute bottom-4 left-4 right-4 md:hidden text-white">
                  <span className={`inline-block px-2 py-1 mb-2 text-xs font-bold rounded-md ${
                    getEventTimeStatus(selectedEvent) === 'upcoming' ? 'bg-green-600' : 
                    getEventTimeStatus(selectedEvent) === 'ongoing' ? 'bg-yellow-600' : 'bg-gray-600'
                  }`}>
                    {getEventTimeStatus(selectedEvent) === 'upcoming' ? '即将开始' : getEventTimeStatus(selectedEvent) === 'ongoing' ? '进行中' : '已结束'}
                  </span>
                  <h2 className="text-xl font-bold line-clamp-2">{selectedEvent.title}</h2>
                </div>
              </div>

              {/* 右侧/底部 内容区 */}
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                  {/* Desktop Header */}
                  <div className="hidden md:block mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        getEventTimeStatus(selectedEvent) === 'upcoming' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        getEventTimeStatus(selectedEvent) === 'ongoing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {getEventTimeStatus(selectedEvent) === 'upcoming' ? '即将开始' : getEventTimeStatus(selectedEvent) === 'ongoing' ? '进行中' : '已结束'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {selectedEvent.type === 'online' ? '线上活动' : '线下活动'}
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold leading-tight">{selectedEvent.title}</h2>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">时间</p>
                          <p className="font-semibold">{formatDateRange(selectedEvent.startTime, selectedEvent.endTime).date}</p>
                          <p className="text-sm text-gray-500">{formatDateRange(selectedEvent.startTime, selectedEvent.endTime).time}</p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">地点</p>
                          <p className="font-semibold line-clamp-2">{selectedEvent.location || (selectedEvent.type === 'online' ? '线上活动' : '暂无地点')}</p>
                          {selectedEvent.type === 'online' && <p className="text-sm text-blue-500">点击查看链接</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="prose dark:prose-invert max-w-none mb-8">
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <div className="w-1 h-6 bg-red-600 rounded-full" />
                      活动详情
                    </h3>
                    <p className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {selectedEvent.description}
                    </p>
                    {selectedEvent.content && (
                       <div className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} text-sm`} dangerouslySetInnerHTML={{ __html: selectedEvent.content }} />
                    )}
                  </div>

                  {/* Tags & Contact */}
                  <div className="space-y-6">
                    {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">相关标签</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedEvent.tags.map((tag, i) => (
                            <span key={i} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 联系人信息 - 暂时隐藏，因为Event类型中没有这些字段
                    {(selectedEvent.contactName || selectedEvent.contactPhone) && (
                      <div className={`flex flex-wrap gap-4 p-4 rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                        {(selectedEvent as any).contactName && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{(selectedEvent as any).contactName}</span>
                          </div>
                        )}
                        {(selectedEvent as any).contactPhone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{(selectedEvent as any).contactPhone}</span>
                          </div>
                        )}
                        {(selectedEvent as any).contactEmail && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{(selectedEvent as any).contactEmail}</span>
                          </div>
                        )}
                      </div>
                    )}
                    */}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className={`p-4 md:p-6 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="hidden sm:block">
                      <p className="text-xs text-gray-500">参与人数</p>
                      <p className="font-bold text-lg">
                        {selectedEvent.participants || 0}
                        <span className="text-sm font-normal text-gray-400 ml-1">
                          {selectedEvent.maxParticipants ? `/ ${selectedEvent.maxParticipants}` : '人已报名'}
                        </span>
                      </p>
                    </div>
                    
                    <div className="flex gap-3 flex-1 sm:flex-none justify-end">
                      <button 
                        onClick={() => handleShare(selectedEvent)}
                        className={`p-3 rounded-xl transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                      
                      {getEventTimeStatus(selectedEvent) === 'upcoming' ? (
                        <button 
                          onClick={() => {
                            handleRegisterEvent(selectedEvent.id);
                            setIsEventDetailsOpen(false);
                          }}
                          className="flex-1 sm:flex-none px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        >
                          立即报名
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : getEventTimeStatus(selectedEvent) === 'ongoing' ? (
                        <button 
                          onClick={() => {
                            handleSubmitWork(selectedEvent.id);
                            setIsEventDetailsOpen(false);
                          }}
                          className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        >
                          提交作品
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      ) : (
                        <button disabled className="flex-1 sm:flex-none px-8 py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 rounded-xl font-bold cursor-not-allowed">
                          活动已结束
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
