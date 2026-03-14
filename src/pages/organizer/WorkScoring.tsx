import { useState, useContext, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import {
  workScoringService,
  WorkScoringData,
  WorkDetail,
  BrandEvent,
  WorkFilterOptions,
} from '@/services/workScoringService';
import { ActivitySidebar } from './components/ActivitySidebar';
import { WorkList } from './components/WorkList';
import { WorkDetailPanel } from './components/WorkDetailPanel';
import { BatchActions } from './components/BatchActions';
import { PublishConfirmModal } from './components/PublishConfirmModal';
import { ScoreAuditLogModal } from './components/ScoreAuditLogModal';
import { ScoreRankingPanel } from './components/ScoreRankingPanel';
import { FinalRankingPublishModal } from './components/FinalRankingPublishModal';
import {
  Loader2,
  AlertCircle,
  Trophy,
} from 'lucide-react';

// 页面状态类型
type ViewState = 'loading' | 'empty' | 'error' | 'success';

export default function WorkScoring() {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);

  // ========== 状态管理 ==========
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  // 活动数据
  const [events, setEvents] = useState<BrandEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // 作品数据
  const [works, setWorks] = useState<WorkScoringData[]>([]);
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [selectedWorkDetail, setSelectedWorkDetail] = useState<WorkDetail | null>(null);

  // 分页和筛选
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalWorks, setTotalWorks] = useState(0);
  const [filters, setFilters] = useState<WorkFilterOptions>({
    status: 'all',
    scoreStatus: 'all',
    sortBy: 'submitted_at',
    sortOrder: 'desc',
    limit: 20,
  });

  // 批量操作
  const [selectedWorkIds, setSelectedWorkIds] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);

  // 模态框状态
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showAuditLogModal, setShowAuditLogModal] = useState(false);
  const [showFinalRankingModal, setShowFinalRankingModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // 加载状态
  const [isLoadingWorks, setIsLoadingWorks] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // ========== 初始化加载 ==========
  useEffect(() => {
    if (user?.id) {
      loadBrandEvents();
    }
  }, [user?.id]);

  // ========== 数据加载函数 ==========
  const loadBrandEvents = async () => {
    if (!user?.id) return;

    try {
      setViewState('loading');
      const eventsData = await workScoringService.getBrandEvents(user.id);
      setEvents(eventsData);

      if (eventsData.length > 0) {
        setSelectedEventId(eventsData[0].id);
        setViewState('success');
      } else {
        setViewState('empty');
      }
    } catch (error) {
      console.error('加载活动列表失败:', error);
      setErrorMessage('加载活动列表失败，请稍后重试');
      setViewState('error');
    }
  };

  const loadWorks = useCallback(async () => {
    if (!selectedEventId) return;

    setIsLoadingWorks(true);
    try {
      const result = await workScoringService.getWorks({
        ...filters,
        eventId: selectedEventId,
        page: currentPage,
      });

      setWorks(result.works);
      setTotalPages(result.totalPages);
      setTotalWorks(result.total);

      // 如果当前选中的作品不在列表中，清除选中
      if (selectedWorkId && !result.works.find(w => w.id === selectedWorkId)) {
        setSelectedWorkId(null);
        setSelectedWorkDetail(null);
      }
    } catch (error) {
      console.error('加载作品列表失败:', error);
      toast.error('加载作品列表失败');
    } finally {
      setIsLoadingWorks(false);
    }
  }, [selectedEventId, filters, currentPage, selectedWorkId]);

  const loadWorkDetail = async (workId: string) => {
    setIsLoadingDetail(true);
    try {
      const detail = await workScoringService.getWorkDetail(workId);
      setSelectedWorkDetail(detail);
    } catch (error) {
      console.error('加载作品详情失败:', error);
      toast.error('加载作品详情失败');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // ========== 副作用 ==========
  useEffect(() => {
    if (selectedEventId) {
      loadWorks();
    }
  }, [selectedEventId, filters, currentPage, loadWorks]);

  useEffect(() => {
    if (selectedWorkId) {
      loadWorkDetail(selectedWorkId);
    } else {
      setSelectedWorkDetail(null);
    }
  }, [selectedWorkId]);

  // ========== 事件处理 ==========
  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentPage(1);
    setSelectedWorkIds(new Set());
    setIsBatchMode(false);
  };

  const handleWorkSelect = (workId: string) => {
    setSelectedWorkId(workId);
  };

  const handleFilterChange = (newFilters: Partial<WorkFilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleWorkSelectToggle = (workId: string) => {
    setSelectedWorkIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workId)) {
        newSet.delete(workId);
      } else {
        newSet.add(workId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedWorkIds.size === works.length) {
      setSelectedWorkIds(new Set());
    } else {
      setSelectedWorkIds(new Set(works.map(w => w.id)));
    }
  };

  const handleScoreSubmit = async (score: number, comment: string) => {
    if (!selectedWorkId || !user?.id) return;

    const result = await workScoringService.submitScore(
      selectedWorkId,
      user.id,
      score,
      comment
    );

    if (result.success) {
      toast.success(result.message || '评分提交成功');
      // 刷新作品详情和列表
      loadWorkDetail(selectedWorkId);
      loadWorks();
    } else {
      toast.error(result.error || '评分提交失败');
    }
  };

  const handlePublish = async (publish: boolean) => {
    if (!selectedWorkId || !user?.id) return;

    setIsPublishing(true);
    try {
      const result = await workScoringService.publishScore(
        selectedWorkId,
        publish,
        user.id
      );

      if (result.success) {
        toast.success(result.message);
        loadWorkDetail(selectedWorkId);
        loadWorks();
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleBatchPublish = async () => {
    if (!user?.id || selectedWorkIds.size === 0) return;

    setIsPublishing(true);
    try {
      const result = await workScoringService.batchPublish(
        Array.from(selectedWorkIds),
        user.id
      );

      if (result.success) {
        toast.success(`成功发布 ${selectedWorkIds.size} 个作品评分`);
        setSelectedWorkIds(new Set());
        setIsBatchMode(false);
        loadWorks();
      } else {
        const failedCount = result.results.filter(r => !r.success).length;
        toast.error(`${failedCount} 个作品发布失败`);
      }
    } finally {
      setIsPublishing(false);
      setShowPublishModal(false);
    }
  };

  // ========== 渲染 ==========
  if (viewState === 'loading') {
    return (
      <div className={`flex items-center justify-center min-h-[60vh] ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-red-500" />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            加载中...
          </p>
        </div>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className={`flex items-center justify-center min-h-[60vh] ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-6">
          <AlertCircle className="w-16 h-16 text-red-500" />
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            加载失败
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {errorMessage}
          </p>
          <button
            onClick={loadBrandEvents}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className={`flex items-center justify-center min-h-[60vh] ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-6">
          <Trophy className="w-16 h-16 text-gray-400" />
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            暂无活动
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            您还没有创建任何津脉活动，创建活动后即可管理作品评分
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* 批量操作栏 */}
      <AnimatePresence>
        {isBatchMode && (
          <BatchActions
            selectedCount={selectedWorkIds.size}
            onSelectAll={handleSelectAll}
            onClearSelection={() => setSelectedWorkIds(new Set())}
            onPublish={() => setShowPublishModal(true)}
            onCancel={() => {
              setIsBatchMode(false);
              setSelectedWorkIds(new Set());
            }}
            isDark={isDark}
          />
        )}
      </AnimatePresence>

      {/* 主内容区 - 四栏布局 */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* 左栏：活动筛选 */}
        <ActivitySidebar
          events={events}
          selectedEventId={selectedEventId}
          onEventSelect={handleEventSelect}
          onPublishFinalRanking={() => setShowFinalRankingModal(true)}
          isDark={isDark}
        />

        {/* 中栏：作品列表 */}
        <WorkList
          works={works}
          selectedWorkId={selectedWorkId}
          onWorkSelect={handleWorkSelect}
          filters={filters}
          onFilterChange={handleFilterChange}
          currentPage={currentPage}
          totalPages={totalPages}
          totalWorks={totalWorks}
          onPageChange={handlePageChange}
          isLoading={isLoadingWorks}
          isBatchMode={isBatchMode}
          selectedWorkIds={selectedWorkIds}
          onWorkSelectToggle={handleWorkSelectToggle}
          onToggleBatchMode={() => setIsBatchMode(!isBatchMode)}
          isDark={isDark}
        />

        {/* 右栏：作品详情与评分 */}
        <WorkDetailPanel
          workDetail={selectedWorkDetail}
          isLoading={isLoadingDetail}
          onScoreSubmit={handleScoreSubmit}
          onPublish={handlePublish}
          onViewAuditLog={() => setShowAuditLogModal(true)}
          currentUserId={user?.id}
          isDark={isDark}
        />

        {/* 最右栏：成绩排名面板 */}
        <ScoreRankingPanel
          works={works}
          isDark={isDark}
          onWorkClick={handleWorkSelect}
          topN={10}
        />
      </div>

      {/* 发布确认弹窗 */}
      <PublishConfirmModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onConfirm={handleBatchPublish}
        selectedCount={selectedWorkIds.size}
        isPublishing={isPublishing}
        isDark={isDark}
      />

      {/* 评分日志弹窗 */}
      <ScoreAuditLogModal
        isOpen={showAuditLogModal}
        onClose={() => setShowAuditLogModal(false)}
        submissionId={selectedWorkId}
        isDark={isDark}
      />

      {/* 最终排名发布弹窗 */}
      <FinalRankingPublishModal
        isOpen={showFinalRankingModal}
        onClose={() => setShowFinalRankingModal(false)}
        eventId={selectedEventId || ''}
        eventTitle={events.find(e => e.id === selectedEventId)?.title || ''}
        works={works}
        isDark={isDark}
        currentUserId={user?.id}
        onPublished={() => {
          toast.success('最终排名已发布');
          loadWorks();
        }}
      />
    </div>
  );
}
