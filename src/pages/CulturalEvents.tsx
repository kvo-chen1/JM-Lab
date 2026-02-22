import { useState, useEffect, useMemo, useCallback, useContext, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEventService } from '@/hooks/useEventService';
import { Event } from '@/types';
import { useEventFilters } from '@/hooks/useEventFilters';
import LeftSidebar from '@/components/events/LeftSidebar';
import EventGrid from '@/components/events/EventGrid';
import MobileEventGrid from '@/components/events/MobileEventGrid';
import RightSidebar from '@/components/events/RightSidebar';
import EventDetailModal from '@/components/events/EventDetailModal';
import EventBannerCarousel from '@/components/events/EventBannerCarousel';
import MobileEventSearchPage from '@/components/events/MobileEventSearchPage';
import { Menu, X, Sparkles, Search, SlidersHorizontal, Plus } from 'lucide-react';
import { AuthContext } from '@/contexts/authContext';
import { eventParticipationService, ParticipationStats } from '@/services/eventParticipationService';
import { userService } from '@/services/userService';

// 辅助函数：解析日期值（处理各种日期格式）
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

// 移动端筛选抽屉
function MobileFilterDrawer({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { isDark } = useTheme();

  return (
    <>
      {/* 遮罩 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        onClick={onClose}
        className={`fixed inset-0 z-40 lg:hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      />
      {/* 抽屉 */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed left-0 top-0 bottom-0 w-[300px] z-50 lg:hidden overflow-y-auto ${
          isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>筛选</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </div>
      </motion.div>
    </>
  );
}

export default function CulturalEvents() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isSearchPageOpen, setIsSearchPageOpen] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [userActivityStats, setUserActivityStats] = useState<ParticipationStats | null>(null);
  const [recommendedCreators, setRecommendedCreators] = useState<any[]>([]);

  // 从 URL 参数中获取 eventId 和 openModal
  const eventIdFromUrl = searchParams.get('eventId');
  const openModalFromUrl = searchParams.get('openModal');
  const hasOpenedModal = useRef(false);

  const { getEvents } = useEventService();
  const {
    filters,
    setStatus,
    setCategory,
    setType,
    toggleTag,
    resetFilters,
    setSearchQuery,
    setSortBy,
    filterEvents,
    sortEvents,
    activeFiltersCount,
  } = useEventFilters();

  // 辅助函数：将 snake_case 转换为 camelCase，并将时间戳转换为 Date
  const toCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(toCamelCase);
    }
    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((acc, key) => {
        let camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        let value = obj[key];

        // 字段名映射：将数据库字段名映射为前端类型定义的字段名
        const fieldMapping: Record<string, string> = {
          'startDate': 'startTime',
          'endDate': 'endTime',
        };
        if (fieldMapping[camelKey]) {
          camelKey = fieldMapping[camelKey];
        }

        // 将 bigint 时间戳或 ISO 字符串转换为 Date 对象
        // 处理 startTime, endTime, createdAt, updated_at 等时间字段
        // 注意：API 返回的时间戳可能是字符串类型，需要转换为数字
        // 注意：数据库返回的是秒级时间戳，需要乘以 1000 转换为毫秒
        const timeFields = ['startTime', 'endTime', 'createdAt', 'updatedAt', 'publishedAt', 'registrationDeadline', 'reviewStartDate', 'resultDate'];
        if (timeFields.includes(camelKey) && value !== null && value !== undefined) {
          if (typeof value === 'number') {
            // 判断时间戳是秒级还是毫秒级：如果数值小于 1e12，认为是秒级
            const msValue = value < 1e12 ? value * 1000 : value;
            value = new Date(msValue);
          } else if (typeof value === 'string') {
            if (/^\d+$/.test(value)) {
              // 纯数字字符串，认为是时间戳
              const numValue = parseInt(value, 10);
              const msValue = numValue < 1e12 ? numValue * 1000 : numValue;
              value = new Date(msValue);
            } else {
              // 非纯数字字符串，尝试作为 ISO 日期字符串解析
              const parsedDate = new Date(value);
              if (!isNaN(parsedDate.getTime())) {
                value = parsedDate;
              }
            }
          }
        }

        acc[camelKey] = toCamelCase(value);
        return acc;
      }, {} as any);
    }
    return obj;
  };

  // 加载活动数据
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const allEvents = await getEvents();
        console.log('[CulturalEvents] Raw events from API:', allEvents?.length, allEvents);
        // 转换数据格式并过滤已发布活动
        const publishedEvents = Array.isArray(allEvents)
          ? allEvents
              .map(toCamelCase)
              .filter((event) => {
                console.log('[CulturalEvents] Checking event:', event?.title, 'status:', event?.status, 'raw:', event);
                return event && (event.status === 'published' || event.status === 'completed');
              })
          : [];
        console.log('[CulturalEvents] Published events:', publishedEvents.length);
        setEvents(publishedEvents);

        // 检查 sessionStorage 中是否有需要打开的活动弹窗
        const eventIdToOpen = sessionStorage.getItem('openEventModal');
        console.log('[CulturalEvents] Checking sessionStorage for eventId:', eventIdToOpen);
        if (eventIdToOpen && !hasOpenedModal.current) {
          const eventToOpen = publishedEvents.find(e => e.id === eventIdToOpen);
          console.log('[CulturalEvents] Found event in published events:', eventToOpen?.title);
          if (eventToOpen) {
            hasOpenedModal.current = true;
            setSelectedEvent(eventToOpen);
            setIsDetailModalOpen(true);
            // 清除 sessionStorage，避免刷新时重复打开
            sessionStorage.removeItem('openEventModal');
          }
        }
      } catch (error) {
        console.error('加载活动失败:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [getEvents, eventIdFromUrl, openModalFromUrl, setSearchParams]);

  // 加载用户活动统计数据
  useEffect(() => {
    const loadUserActivityStats = async () => {
      if (!isAuthenticated || !user?.id) {
        setUserActivityStats(null);
        return;
      }

      try {
        const stats = await eventParticipationService.getUserActivityStats(user.id);
        setUserActivityStats(stats);
      } catch (error) {
        console.error('加载用户活动统计失败:', error);
        setUserActivityStats(null);
      }
    };

    loadUserActivityStats();
  }, [isAuthenticated, user?.id]);

  // 加载推荐创作者
  useEffect(() => {
    const loadRecommendedCreators = async () => {
      try {
        const response = await fetch('/api/users/recommended?limit=5');
        const result = await response.json();
        if (result.code === 0 && result.data) {
          setRecommendedCreators(result.data);
        }
      } catch (error) {
        console.error('加载推荐创作者失败:', error);
        setRecommendedCreators([]);
      }
    };

    loadRecommendedCreators();
  }, []);

  // 筛选和排序后的活动
  const filteredAndSortedEvents = useMemo(() => {
    const filtered = filterEvents(events);
    return sortEvents(filtered);
  }, [events, filterEvents, sortEvents]);

  // 即将开始的活动（用于右侧栏）- 只显示尚未开始的活动
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((event) => {
        const startTime = parseEventDate(event.startTime);
        // 只显示开始时间大于当前时间的活动（严格意义上的即将开始）
        return startTime > now;
      })
      .sort((a, b) => parseEventDate(a.startTime).getTime() - parseEventDate(b.startTime).getTime())
      .slice(0, 5);
  }, [events]);

  // 热门标签
  const popularTags = useMemo(() => {
    const tagCount: Record<string, number> = {};
    events.forEach((event) => {
      event.tags?.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [events]);

  // 处理活动点击
  const handleEventClick = useCallback((event: Event) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  }, []);

  // 创建活动
  const handleCreateEvent = useCallback(() => {
    navigate('/organizer?tab=create');
  }, [navigate]);

  // 处理活动点击（从 eventId 查找 event 对象）
  const handleEventClickById = useCallback((eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setIsDetailModalOpen(true);
    }
  }, [events]);

  return (
    <main className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* 隐藏 MobileLayout 的顶部导航栏 */}
      <style>{`
        .sticky.top-0.z-60 {
          display: none !important;
        }
      `}</style>
      
      {/* 移动端搜索页面 */}
      <MobileEventSearchPage
        isOpen={isSearchPageOpen}
        onClose={() => setIsSearchPageOpen(false)}
        onSearch={(query) => setSearchQuery(query)}
        initialQuery={filters.searchQuery}
      />

      {/* 移动端顶部 - 采用首页风格 - 轮播图上方悬浮 */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-50 px-4 pt-4 pb-4 pointer-events-none`}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-md mx-auto pointer-events-auto"
        >
          <div className="flex items-center gap-3">
            {/* 搜索框 */}
            <div
              onClick={() => setIsSearchPageOpen(true)}
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-full cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                isDark
                  ? 'bg-white/95 text-gray-700 shadow-lg'
                  : 'bg-white/95 text-gray-700 shadow-lg'
              }`}
            >
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-400 text-base">
                {filters.searchQuery || '搜索活动...'}
              </span>
            </div>

            {/* 筛选按钮 */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileFilterOpen(true)}
              className={`relative flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all ${
                activeFiltersCount > 0
                  ? 'bg-red-500 text-white'
                  : isDark
                  ? 'bg-white/95 text-gray-700'
                  : 'bg-white/95 text-gray-700'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </motion.button>

            {/* 创建按钮 */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateEvent}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30"
            >
              <Plus className="w-6 h-6" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* 页面标题 - 桌面端 */}
      <div className="hidden lg:block container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <span className="inline-flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-red-500" />
                津脉活动
              </span>
            </h1>
            <p className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              探索天津文化的无限魅力，参与精彩活动
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-right ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <p className="text-2xl font-bold text-red-500">{events.length}</p>
              <p className="text-sm">个精彩活动</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 移动端轮播图 - 首页风格 - 全屏显示在容器外部 */}
      <div className="lg:hidden">
        {!isLoading && filteredAndSortedEvents.length > 0 && (
          <EventBannerCarousel
            events={filteredAndSortedEvents}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      {/* 三栏布局 */}
      <div className="container mx-auto px-4 pb-12">
        <div className="flex gap-6">
          {/* 左侧栏 - 桌面端 */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <LeftSidebar
                filters={filters}
                setStatus={setStatus}
                setCategory={setCategory}
                setType={setType}
                toggleTag={toggleTag}
                resetFilters={resetFilters}
                activeFiltersCount={activeFiltersCount}
                onCreateEvent={handleCreateEvent}
                popularTags={popularTags}
              />
            </div>
          </div>

          {/* 中间栏 - 活动列表 */}
          <div className="flex-1 min-w-0">
            {/* PC端使用原有布局 */}
            <div className="hidden lg:block">
              <EventGrid
                events={filteredAndSortedEvents}
                isLoading={isLoading}
                searchQuery={filters.searchQuery}
                setSearchQuery={setSearchQuery}
                sortBy={filters.sortBy}
                setSortBy={setSortBy}
                onEventClick={handleEventClick}
              />
            </div>
            {/* 移动端使用两列布局 */}
            <div className="lg:hidden">
              <MobileEventGrid
                events={filteredAndSortedEvents}
                isLoading={isLoading}
                searchQuery={filters.searchQuery}
                setSearchQuery={setSearchQuery}
                sortBy={filters.sortBy}
                setSortBy={setSortBy}
                onEventClick={handleEventClick}
              />
            </div>
          </div>

          {/* 右侧栏 - 桌面端 */}
          <div className="hidden xl:block">
            <div className="sticky top-24">
              <RightSidebar
                events={events}
                upcomingEvents={upcomingEvents}
                userStats={userActivityStats ? {
                  registeredCount: userActivityStats.registered,
                  submittedCount: userActivityStats.submitted,
                  completedCount: userActivityStats.completed,
                } : undefined}
                recommendedCreators={recommendedCreators}
                onEventClick={handleEventClickById}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 移动端筛选抽屉 */}
      <MobileFilterDrawer isOpen={isMobileFilterOpen} onClose={() => setIsMobileFilterOpen(false)}>
        <LeftSidebar
          filters={filters}
          setStatus={setStatus}
          setCategory={setCategory}
          setType={setType}
          toggleTag={toggleTag}
          resetFilters={resetFilters}
          activeFiltersCount={activeFiltersCount}
          onCreateEvent={handleCreateEvent}
          popularTags={popularTags}
        />
      </MobileFilterDrawer>

      {/* 活动详情弹窗 */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        submissionCount={submissionCount}
      />

      {/* 页脚 */}
      <footer
        className={`border-t py-8 px-4 ${
          isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="container mx-auto">
          <div className="flex flex-col items-center justify-center text-center">
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              © 2025 津脉智坊. 保留所有权利
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <a
                href="/privacy"
                className={`text-sm ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                } transition-colors`}
              >
                隐私政策
              </a>
              <a
                href="/terms"
                className={`text-sm ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                } transition-colors`}
              >
                服务条款
              </a>
              <a
                href="/help"
                className={`text-sm ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                } transition-colors`}
              >
                帮助中心
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
