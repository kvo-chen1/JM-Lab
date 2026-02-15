import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { TianjinButton } from '@/components/TianjinStyleComponents';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';

// 新组件
import {
  ActivityLayout,
  ActivitySidebar,
  ActivityNotificationPanel,
  ActivityCard,
  ActivityStats,
} from '@/components/activities';

// 服务
import {
  eventParticipationService,
  type ParticipationDetail,
  type ParticipationStats,
} from '@/services/eventParticipationService';

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

export default function MyActivities() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // 状态
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [participations, setParticipations] = useState<ParticipationDetail[]>([]);
  const [stats, setStats] = useState<ParticipationStats>({
    total: 0,
    totalViews: 0,
    totalLikes: 0,
    totalShares: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 加载参与数据
  const loadParticipations = useCallback(async (isRefresh = false) => {
    if (!user?.id) {
      setParticipations([]);
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      }

      const currentPage = isRefresh ? 1 : page;
      const filter = activeFilter === 'all' ? {} : { status: activeFilter as any };

      console.log('[MyActivities] Loading participations with filter:', filter);
      const { data, total } = await eventParticipationService.getUserParticipations(
        user.id,
        filter,
        { page: currentPage, pageSize: 10 }
      );
      console.log('[MyActivities] Loaded participations:', { dataLength: data.length, total, data });

      if (isRefresh || currentPage === 1) {
        setParticipations(data);
      } else {
        setParticipations((prev) => [...prev, ...data]);
      }

      setHasMore(data.length === 10 && participations.length + data.length < total);
    } catch (error) {
      console.error('加载活动数据失败:', error);
      toast.error('加载活动数据失败，请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, activeFilter, page]);

  // 加载统计数据
  const loadStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const participationStats = await eventParticipationService.getUserParticipationStats(user.id);
      setStats(participationStats);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  }, [user?.id]);

  // 初始加载
  useEffect(() => {
    loadParticipations(true);
    loadStats();
  }, [loadParticipations, loadStats]);

  // 筛选变化时重新加载
  useEffect(() => {
    loadParticipations(true);
  }, [activeFilter]);

  // 订阅实时更新
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = eventParticipationService.subscribeToParticipationChanges(
      user.id,
      (payload) => {
        // 实时更新时刷新数据
        loadParticipations(true);
        loadStats();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.id, loadParticipations, loadStats]);

  // 处理刷新
  const handleRefresh = () => {
    loadParticipations(true);
    loadStats();
  };

  // 处理取消报名
  const handleCancelRegistration = async (participationId: string) => {
    try {
      const success = await eventParticipationService.cancelParticipation(participationId);
      if (success) {
        toast.success('已取消报名');
        loadParticipations(true);
        loadStats();
      } else {
        toast.error('取消报名失败');
      }
    } catch (error) {
      console.error('取消报名失败:', error);
      toast.error('取消报名失败，请稍后重试');
    }
  };

  // 加载更多
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
      loadParticipations();
    }
  };

  // 头部组件
  const Header = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold font-serif mb-2">我的活动</h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          管理您的参与进度，展示您的才华
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${
            isDark
              ? 'border-gray-700 hover:bg-gray-800 text-gray-300'
              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
          } ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <i className={`fas ${refreshing ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
          刷新
        </button>
        <button
          onClick={() => navigate('/organizer')}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${
            isDark
              ? 'border-gray-700 hover:bg-gray-800 text-gray-300'
              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
        >
          <i className="fas fa-building"></i>
          主办方中心
        </button>
        <TianjinButton
          onClick={() => navigate('/events')}
          className="flex items-center gap-2"
        >
          <i className="fas fa-compass"></i>
          发现更多活动
        </TianjinButton>
        <button
          onClick={() => navigate('/admin?tab=campaigns')}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${
            isDark
              ? 'border-gray-700 hover:bg-gray-800 text-gray-300'
              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
        >
          <i className="fas fa-cog"></i>
          活动管理
        </button>
      </div>
    </div>
  );

  // 统计组件
  const StatsPanel = (
    <ActivityStats
      stats={{
        total: stats.total,
        totalViews: stats.totalViews,
        totalInteractions: stats.totalLikes + stats.totalShares,
      }}
    />
  );

  // 左侧边栏
  const LeftSidebar = (
    <ActivitySidebar
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      stats={{
        total: stats.total,
      }}
    />
  );

  // 主内容区
  const MainContent = (
    <div className="space-y-4">
      {/* 移动端筛选（仅在小屏幕显示） */}
      <div className="lg:hidden">
        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} overflow-x-auto`}>
          <div className="flex gap-2">
            {[
              { id: 'all', label: '全部' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-red-500 text-white'
                    : isDark
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 活动列表 */}
      <AnimatePresence mode="popLayout">
        {participations.length === 0 && !loading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`text-center py-16 rounded-xl border-2 border-dashed ${
              isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <i className="fas fa-clipboard-list text-3xl text-gray-400"></i>
            </div>
            <p className="text-lg font-medium text-gray-500 mb-2">暂无相关活动记录</p>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              去发现精彩活动，展示您的才华
            </p>
            <TianjinButton onClick={() => navigate('/events')}>
              去发现精彩活动
              <i className="fas fa-arrow-right ml-2"></i>
            </TianjinButton>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {participations.map((participation) => (
              <ActivityCard
                key={participation.id}
                participation={participation}
                onCancel={handleCancelRegistration}
                onRefresh={handleRefresh}
              />
            ))}

            {/* 加载更多 */}
            {hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDark
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      加载中...
                    </>
                  ) : (
                    <>
                      加载更多
                      <i className="fas fa-chevron-down ml-2"></i>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  // 右侧边栏
  const RightSidebar = user?.id ? (
    <ActivityNotificationPanel userId={user.id} />
  ) : null;

  return (
    <ActivityLayout
      header={Header}
      stats={StatsPanel}
      leftSidebar={LeftSidebar}
      mainContent={MainContent}
      rightSidebar={RightSidebar}
      isLoading={loading && participations.length === 0}
    />
  );
}
