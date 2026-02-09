import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useAchievements } from './hooks/useAchievements';
import LeftSidebar from './components/LeftSidebar';
import MainContent from './components/MainContent';
import RightSidebar from './components/RightSidebar';
import AchievementDetail from './components/AchievementDetail';
import type { Achievement } from './types';

export default function AchievementMuseum() {
  const { isDark } = useTheme();
  const {
    achievements,
    filteredAchievements,
    stats,
    userInfo,
    creatorLevels,
    isLoading,
    filter,
    viewMode,
    updateFilter,
    resetFilter,
    toggleViewMode,
  } = useAchievements();

  // 选中的成就详情
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 处理成就点击
  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setIsDetailOpen(true);
  };

  // 关闭详情弹窗
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedAchievement(null), 300);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* 三栏布局容器 */}
      <div className="max-w-[1800px] mx-auto">
        <div className="flex">
          {/* 左侧导航栏 */}
          <LeftSidebar
            filter={filter}
            stats={stats}
            viewMode={viewMode}
            onFilterChange={updateFilter}
            onViewModeChange={toggleViewMode}
            onResetFilter={resetFilter}
          />

          {/* 中间内容区 */}
          <MainContent
            achievements={achievements}
            filteredAchievements={filteredAchievements}
            stats={stats}
            userInfo={userInfo}
            filter={filter}
            viewMode={viewMode}
            isLoading={isLoading}
            onFilterChange={updateFilter}
            onViewModeChange={toggleViewMode}
            onResetFilter={resetFilter}
            onAchievementClick={handleAchievementClick}
          />

          {/* 右侧信息区 */}
          <RightSidebar
            userInfo={userInfo}
            recentUnlocks={(achievements || []).filter(a => a?.isUnlocked).sort(
              (a, b) => new Date(b?.unlockedAt || 0).getTime() - new Date(a?.unlockedAt || 0).getTime()
            ).slice(0, 5)}
            creatorLevels={creatorLevels || []}
          />
        </div>
      </div>

      {/* 成就详情弹窗 */}
      <AchievementDetail
        achievement={selectedAchievement}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
}

// 导出类型
export type {
  Achievement,
  AchievementRarity,
  AchievementCategory,
  AchievementStats,
  AchievementFilter,
  ViewMode,
  UserAchievementInfo,
  CreatorLevel,
} from './types';

// 导出 hooks
export { useAchievements } from './hooks/useAchievements';

// 导出组件
export { default as LeftSidebar } from './components/LeftSidebar';
export { default as MainContent } from './components/MainContent';
export { default as RightSidebar } from './components/RightSidebar';
export { default as AchievementCard } from './components/AchievementCard';
export { default as AchievementDetail } from './components/AchievementDetail';
export { default as StatsPanel } from './components/StatsPanel';
export { default as EmptyState } from './components/EmptyState';
