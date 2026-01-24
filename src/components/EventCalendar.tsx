import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import eventCalendarService, { CulturalEvent, EventType, EventStatus } from '@/services/eventCalendarService';
import { TianjinImage } from './TianjinStyleComponents';

// 活动日历组件
export default function EventCalendar() {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'completed'>('upcoming');
  const [selectedEventType, setSelectedEventType] = useState<EventType | 'all'>('all');
  const [events, setEvents] = useState<CulturalEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CulturalEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CulturalEvent | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 加载活动数据
  useEffect(() => {
    setIsLoading(true);
    
    // 模拟API请求延迟
    setTimeout(() => {
      const allEvents = eventCalendarService.getAllEvents();
      setEvents(allEvents);
      setFilteredEvents(allEvents);
      setIsLoading(false);
    }, 600);
  }, []);

  // 筛选事件
  useEffect(() => {
    let result = [...events];

    // 按状态筛选
    if (activeTab === 'upcoming') {
      result = result.filter(event => event.status === 'upcoming');
    } else if (activeTab === 'ongoing') {
      result = result.filter(event => event.status === 'ongoing');
    } else if (activeTab === 'completed') {
      result = result.filter(event => event.status === 'completed');
    }

    // 按类型筛选
    if (selectedEventType !== 'all') {
      result = result.filter(event => event.type === selectedEventType);
    }

    // 按关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(event => 
        event.title.toLowerCase().includes(keyword) ||
        event.description.toLowerCase().includes(keyword) ||
        event.tags.some(tag => tag.toLowerCase().includes(keyword)) ||
        event.culturalElements.some(element => element.toLowerCase().includes(keyword))
      );
    }

    setFilteredEvents(result);
  }, [activeTab, selectedEventType, events, searchKeyword]);

  // 处理活动点击
  const handleEventClick = (event: CulturalEvent) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };

  // 处理活动注册
  const handleRegisterEvent = (eventId: string) => {
    toast.success('活动注册成功！');
  };

  // 处理活动提交
  const handleSubmitWork = (eventId: string) => {
    toast.success('作品提交成功！');
  };

  // 获取事件类型显示名称
  const getEventTypeDisplayName = (type: EventType): string => {
    const typeMap: Record<EventType, string> = {
      theme: '主题活动',
      collaboration: '协作活动',
      competition: '竞赛',
      workshop: '工作坊',
      exhibition: '展览'
    };
    return typeMap[type];
  };

  // 获取事件类型图标
  const getEventTypeIcon = (type: EventType): string => {
    const iconMap: Record<EventType, string> = {
      theme: 'calendar-alt',
      collaboration: 'users',
      competition: 'trophy',
      workshop: 'chalkboard-teacher',
      exhibition: 'images'
    };
    return iconMap[type];
  };

  // 骨架屏加载状态
  if (isLoading) {
    return (
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="space-y-6">
          <div className={`h-8 w-1/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          
          {/* 搜索栏 */}
          <div className={`h-10 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          
          {/* 标签页切换 */}
          <div className="flex space-x-3 overflow-x-auto pb-4">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`h-10 w-24 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
            ))}
          </div>
          
          {/* 类型筛选 */}
          <div className="flex space-x-3 overflow-x-auto pb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className={`h-8 w-20 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
            ))}
          </div>
          
          {/* 事件列表 */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`h-48 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`sm:p-4 md:p-6 sm:rounded-2xl ${isDark ? 'sm:bg-gray-800' : 'sm:bg-white'} sm:shadow-md`}>
      {/* 标题和搜索 */}
      <div className="mb-4 sm:mb-6">
        {/* 手机端搜索框 - 放在上面 */}
        <div className="sm:hidden relative mb-3">
          <input 
            type="text"
            placeholder="搜索活动..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm ${isDark 
              ? 'bg-gray-700 text-white placeholder-gray-400' 
              : 'bg-gray-100 text-gray-900 placeholder-gray-600'}
              focus:outline-none focus:ring-2 focus:ring-red-500 transition-all`}
          />
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>
        {/* 电脑端标题和搜索 */}
        <div className="hidden sm:flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 sm:space-y-0">
          <h2 className="text-lg sm:text-xl font-bold">文化主题活动日历</h2>
          <div className="relative w-full md:w-64">
            <input 
              type="text"
              placeholder="搜索活动..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm ${isDark 
                ? 'bg-gray-700 text-white placeholder-gray-400' 
                : 'bg-gray-100 text-gray-900 placeholder-gray-600'}
                focus:outline-none focus:ring-2 focus:ring-red-500 transition-all`}
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>
      </div>

      {/* 状态标签页 */}
      <div className="flex space-x-3 mb-4 sm:mb-6 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { id: 'upcoming', name: '即将开始' },
          { id: 'ongoing', name: '进行中' },
          { id: 'completed', name: '已结束' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'upcoming' | 'ongoing' | 'completed')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
              ? 'bg-red-600 text-white shadow-md'
              : isDark
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* 事件类型筛选 */}
      <div className="flex space-x-2 sm:space-x-3 mb-3 sm:mb-6 overflow-x-auto pb-3 sm:pb-4 scrollbar-hide px-1 sm:px-0">
        <button
          onClick={() => setSelectedEventType('all')}
          className={`px-2.5 sm:px-3 py-1.5 sm:py-1.5 rounded-full text-xs sm:text-sm transition-all whitespace-nowrap min-w-[80px] sm:min-w-[90px] text-center ${selectedEventType === 'all'
            ? 'bg-blue-600 text-white shadow-sm'
            : isDark
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          全部类型
        </button>
        {(['theme', 'collaboration', 'competition', 'workshop', 'exhibition'] as EventType[]).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedEventType(type)}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-1.5 rounded-full text-xs sm:text-sm transition-all whitespace-nowrap min-w-[80px] sm:min-w-[90px] text-center ${selectedEventType === type
              ? 'bg-blue-600 text-white shadow-sm'
              : isDark
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {getEventTypeDisplayName(type)}
          </button>
        ))}
      </div>

      {/* 事件列表 */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredEvents.map((event) => (
            <motion.div
              key={event.id}
              className={`rounded-xl overflow-hidden shadow-md border ${isDark ? 'border-gray-700' : 'border-gray-200'} cursor-pointer`}
              whileHover={{ y: -5 }}
              onClick={() => handleEventClick(event)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* 事件图片 */}
              <div className="relative">
                <TianjinImage
                  src={event.image}
                  alt={event.title}
                  className="w-full h-36 sm:h-48 object-cover"
                  ratio="landscape"
                />
                {/* 事件标签 */}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-900 bg-opacity-80' : 'bg-white bg-opacity-90'}`}>
                    <i className={`fas fa-${getEventTypeIcon(event.type)} mr-1`}></i>
                    {getEventTypeDisplayName(event.type)}
                  </span>
                  <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-full ${event.status === 'upcoming' 
                    ? 'bg-green-600 text-white' 
                    : event.status === 'ongoing' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-600 text-white'}`}>
                    {event.status === 'upcoming' ? '即将开始' : event.status === 'ongoing' ? '进行中' : '已结束'}
                  </span>
                </div>
              </div>

              {/* 事件内容 */}
              <div className={`p-3 sm:p-5 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                <h3 className="text-sm sm:text-lg font-bold mb-2 line-clamp-2">{event.title}</h3>
                <p className={`text-xs sm:text-sm mb-3 sm:mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-3`}>
                  {event.description}
                </p>

                {/* 事件时间和地点 */}
                <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                  <div className="flex items-center text-xs sm:text-sm">
                    <i className="fas fa-calendar-alt text-red-500 mr-2 w-5 text-center"></i>
                    <span>{event.startDate} {event.endDate !== event.startDate ? `至 ${event.endDate}` : ''}</span>
                  </div>
                  {event.startTime && event.endTime && (
                    <div className="flex items-center text-xs sm:text-sm">
                      <i className="fas fa-clock text-red-500 mr-2 w-5 text-center"></i>
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center text-xs sm:text-sm">
                      <i className="fas fa-map-marker-alt text-red-500 mr-2 w-5 text-center"></i>
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                  {event.onlineLink && (
                    <div className="flex items-center text-xs sm:text-sm">
                      <i className="fas fa-link text-red-500 mr-2 w-5 text-center"></i>
                      <span className="line-clamp-1 text-blue-500 hover:underline">线上活动</span>
                    </div>
                  )}
                </div>

                {/* 标签和参与人数 */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  {event.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                      {tag}
                    </span>
                  ))}
                  {event.tags.length > 3 && (
                    <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                      +{event.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* 参与人数 */}
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <i className="fas fa-users mr-1"></i>
                    {event.participantCount}人已参与
                    {event.maxParticipants && ` / ${event.maxParticipants}`}
                  </span>
                  {event.hasPrize && (
                    <span className="text-[10px] sm:text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">
                      <i className="fas fa-gift mr-1"></i>有奖励
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className={`p-6 sm:p-8 rounded-xl text-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <i className="fas fa-calendar-times text-5xl sm:text-6xl text-red-600 mb-3 sm:mb-4"></i>
          <h3 className="text-lg sm:text-xl font-bold mb-2">暂无活动</h3>
          <p className={`text-sm sm:text-base mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            当前筛选条件下没有找到相关活动
          </p>
          <button 
            onClick={() => {
              setActiveTab('upcoming');
              setSelectedEventType('all');
              setSearchKeyword('');
            }}
            className="px-4 py-2 sm:px-6 sm:py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            查看全部活动
          </button>
        </div>
      )}

      {/* 活动详情模态框 */}
      {isEventDetailsOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4 overflow-y-auto">
          <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl p-4 sm:p-6 w-full max-w-md sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto`}>
            {/* 模态框头部 */}
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold line-clamp-2">{selectedEvent.title}</h3>
              <button 
                onClick={() => setIsEventDetailsOpen(false)}
                className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
              >
                <i className="fas fa-times text-lg sm:text-xl"></i>
              </button>
            </div>

            {/* 活动图片 */}
            <TianjinImage
              src={selectedEvent.image}
              alt={selectedEvent.title}
              className="w-full h-36 sm:h-48 lg:h-64 object-cover rounded-lg mb-4 sm:mb-6"
              ratio="landscape"
            />

            {/* 活动基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-medium mb-2">活动类型</h4>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <i className={`fas fa-${getEventTypeIcon(selectedEvent.type)} mr-1`}></i>
                    {getEventTypeDisplayName(selectedEvent.type)}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-medium mb-2">活动状态</h4>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${selectedEvent.status === 'upcoming' 
                    ? 'bg-green-600 text-white' 
                    : selectedEvent.status === 'ongoing' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-600 text-white'}`}>
                    {selectedEvent.status === 'upcoming' ? '即将开始' : selectedEvent.status === 'ongoing' ? '进行中' : '已结束'}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-medium mb-2">活动时间</h4>
                  <div className="space-y-1">
                    <div className="flex items-center text-xs sm:text-sm">
                      <i className="fas fa-calendar-alt text-red-500 mr-2 w-5 text-center"></i>
                      <span>{selectedEvent.startDate} {selectedEvent.endDate !== selectedEvent.startDate ? `至 ${selectedEvent.endDate}` : ''}</span>
                    </div>
                    {selectedEvent.startTime && selectedEvent.endTime && (
                      <div className="flex items-center text-xs sm:text-sm">
                        <i className="fas fa-clock text-red-500 mr-2 w-5 text-center"></i>
                        <span>{selectedEvent.startTime} - {selectedEvent.endTime}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-medium mb-2">活动地点</h4>
                  <div className="space-y-1">
                    {selectedEvent.location && (
                      <div className="flex items-center text-xs sm:text-sm">
                        <i className="fas fa-map-marker-alt text-red-500 mr-2 w-5 text-center"></i>
                        <span className="line-clamp-1">{selectedEvent.location}</span>
                      </div>
                    )}
                    {selectedEvent.onlineLink && (
                      <div className="flex items-center text-xs sm:text-sm">
                        <i className="fas fa-link text-red-500 mr-2 w-5 text-center"></i>
                        <a href={selectedEvent.onlineLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline line-clamp-1">
                          {selectedEvent.onlineLink}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-medium mb-2">主办方</h4>
                  <div className="flex items-center">
                    <i className="fas fa-building text-red-500 mr-2 text-base"></i>
                    <span className="text-xs sm:text-sm">{selectedEvent.organizer}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-medium mb-2">参与情况</h4>
                  <div className="flex items-center text-xs sm:text-sm">
                    <i className="fas fa-users text-red-500 mr-2 w-5 text-center"></i>
                    <span>
                      {selectedEvent.participantCount}人已参与
                      {selectedEvent.maxParticipants && ` / ${selectedEvent.maxParticipants}`}
                    </span>
                  </div>
                </div>

                {selectedEvent.registrationDeadline && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium mb-2">报名截止</h4>
                    <div className="flex items-center text-xs sm:text-sm">
                      <i className="fas fa-clock text-red-500 mr-2 w-5 text-center"></i>
                      <span>{selectedEvent.registrationDeadline}</span>
                    </div>
                  </div>
                )}

                {selectedEvent.hasPrize && selectedEvent.prizeDescription && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium mb-2">奖励设置</h4>
                    <div className={`p-2 sm:p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-yellow-50'}`}>
                      <p className="text-xs sm:text-sm whitespace-pre-line">{selectedEvent.prizeDescription}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 活动描述 */}
            <div className="mb-4 sm:mb-6">
              <h4 className="text-xs sm:text-sm font-medium mb-2">活动描述</h4>
              <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selectedEvent.description}</p>
            </div>

            {/* 文化元素 */}
            {selectedEvent.culturalElements.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h4 className="text-xs sm:text-sm font-medium mb-2">文化元素</h4>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {selectedEvent.culturalElements.map((element, index) => (
                    <span key={index} className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${isDark ? 'bg-gray-700' : 'bg-blue-50 text-blue-600'}`}>
                      {element}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 活动标签 */}
            {selectedEvent.tags.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h4 className="text-xs sm:text-sm font-medium mb-2">标签</h4>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {selectedEvent.tags.map((tag, index) => (
                    <span key={index} className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 活动规则 */}
            {selectedEvent.rules && selectedEvent.rules.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h4 className="text-xs sm:text-sm font-medium mb-2">活动规则</h4>
                <ul className={`space-y-1.5 sm:space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectedEvent.rules.map((rule, index) => (
                    <li key={index} className="flex items-start text-xs sm:text-sm">
                      <i className="fas fa-check-circle text-green-500 mr-2 mt-1 flex-shrink-0"></i>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 作品要求 */}
            {selectedEvent.requirements && selectedEvent.requirements.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h4 className="text-xs sm:text-sm font-medium mb-2">作品要求</h4>
                <ul className={`space-y-1.5 sm:space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectedEvent.requirements.map((req, index) => (
                    <li key={index} className="flex items-start text-xs sm:text-sm">
                      <i className="fas fa-check-circle text-green-500 mr-2 mt-1 flex-shrink-0"></i>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsEventDetailsOpen(false)}
                className={`px-4 py-2 sm:px-6 sm:py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} w-full sm:w-auto`}
              >
                关闭
              </button>
              {selectedEvent.status === 'upcoming' && (
                <button 
                  onClick={() => {
                    handleRegisterEvent(selectedEvent.id);
                    setIsEventDetailsOpen(false);
                  }}
                  className="px-4 py-2 sm:px-6 sm:py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors w-full sm:w-auto"
                >
                  立即报名
                </button>
              )}
              {selectedEvent.status === 'ongoing' && (
                <button 
                  onClick={() => {
                    handleSubmitWork(selectedEvent.id);
                    setIsEventDetailsOpen(false);
                  }}
                  className="px-4 py-2 sm:px-6 sm:py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors w-full sm:w-auto"
                >
                  提交作品
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
