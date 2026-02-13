import { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { useEventService } from '@/hooks/useEventService';
import { Event } from '@/types';
import { useEventFilters } from '@/hooks/useEventFilters';
import LeftSidebar from '@/components/events/LeftSidebar';
import EventGrid from '@/components/events/EventGrid';
import RightSidebar from '@/components/events/RightSidebar';
import EventDetailModal from '@/components/events/EventDetailModal';
import { Menu, X, Sparkles } from 'lucide-react';
import { AuthContext } from '@/contexts/authContext';
import { eventParticipationService, ParticipationStats } from '@/services/eventParticipationService';
import { userService } from '@/services/userService';

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
  const { user, isAuthenticated } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [userActivityStats, setUserActivityStats] = useState<ParticipationStats | null>(null);
  const [recommendedCreators, setRecommendedCreators] = useState<any[]>([]);

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

  // 辅助函数：将 snake_case 转换为 camelCase
  const toCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(toCamelCase);
    }
    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((acc, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        acc[camelKey] = toCamelCase(obj[key]);
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
                console.log('[CulturalEvents] Checking event:', event?.title, 'status:', event?.status);
                return event && event.status === 'published';
              })
          : [];
        console.log('[CulturalEvents] Published events:', publishedEvents.length);
        setEvents(publishedEvents);
      } catch (error) {
        console.error('加载活动失败:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [getEvents]);

  // 加载用户活动统计数据
  useEffect(() => {
    const loadUserActivityStats = async () => {
      if (!isAuthenticated || !user?.id) {
        setUserActivityStats(null);
        return;
      }

      try {
        const stats = await eventParticipationService.getUserParticipationStats(user.id);
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

  // 即将开始的活动（用于右侧栏）
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((event) => new Date(event.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
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
    navigate('/create');
  }, [navigate]);

  return (
    <main className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* 顶部标题栏 - 移动端 */}
      <div className={`lg:hidden sticky top-0 z-30 px-4 py-3 border-b ${
        isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-100'
      } backdrop-blur-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className={`p-2 rounded-lg ${
                activeFiltersCount > 0
                  ? 'bg-red-500 text-white'
                  : isDark
                  ? 'bg-gray-800 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Menu className="w-5 h-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <div>
              <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                津脉活动
              </h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                探索天津文化的无限魅力
              </p>
            </div>
          </div>
          <button
            onClick={handleCreateEvent}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            创建
          </button>
        </div>
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
