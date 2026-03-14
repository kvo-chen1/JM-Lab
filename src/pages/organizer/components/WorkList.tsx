import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Grid3X3,
  CheckSquare,
  Square,
  Loader2,
} from 'lucide-react';
import { WorkScoringData, WorkFilterOptions } from '@/services/workScoringService';
import { WorkCard } from './WorkCard';
import { useState } from 'react';

interface WorkListProps {
  works: WorkScoringData[];
  selectedWorkId: string | null;
  onWorkSelect: (workId: string) => void;
  filters: WorkFilterOptions;
  onFilterChange: (filters: Partial<WorkFilterOptions>) => void;
  currentPage: number;
  totalPages: number;
  totalWorks: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isBatchMode: boolean;
  selectedWorkIds: Set<string>;
  onWorkSelectToggle: (workId: string) => void;
  onToggleBatchMode: () => void;
  isDark: boolean;
}

export function WorkList({
  works,
  selectedWorkId,
  onWorkSelect,
  filters,
  onFilterChange,
  currentPage,
  totalPages,
  totalWorks,
  onPageChange,
  isLoading,
  isBatchMode,
  selectedWorkIds,
  onWorkSelectToggle,
  onToggleBatchMode,
  isDark,
}: WorkListProps) {
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const handleSearch = () => {
    onFilterChange({ searchQuery });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`flex-1 flex flex-col min-w-0 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* 筛选栏 */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between gap-4">
          {/* 搜索框 */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索作品或创作者..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-red-500'
                  : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-red-500'
              } border outline-none`}
            />
          </div>

          {/* 筛选器 */}
          <div className="flex items-center gap-2">
            {/* 评分状态筛选 */}
            <select
              value={filters.scoreStatus}
              onChange={(e) => onFilterChange({ scoreStatus: e.target.value as any })}
              className={`px-3 py-2 rounded-lg text-sm border outline-none transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              <option value="all">全部状态</option>
              <option value="unscored">未评分</option>
              <option value="scored">已评分</option>
              <option value="published">已发布</option>
            </select>

            {/* 排序 */}
            <select
              value={`${filters.sortBy}_${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('_') as [string, 'asc' | 'desc'];
                onFilterChange({ sortBy: sortBy as any, sortOrder });
              }}
              className={`px-3 py-2 rounded-lg text-sm border outline-none transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              <option value="submitted_at_desc">最新提交</option>
              <option value="submitted_at_asc">最早提交</option>
              <option value="score_desc">评分从高到低</option>
              <option value="score_asc">评分从低到高</option>
              <option value="title_asc">标题 A-Z</option>
              <option value="title_desc">标题 Z-A</option>
            </select>

            {/* 视图切换 */}
            <div className={`flex rounded-lg border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list'
                    ? isDark
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-900'
                    : isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ListFilter className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid'
                    ? isDark
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-900'
                    : isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>

            {/* 批量操作按钮 */}
            <button
              onClick={onToggleBatchMode}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isBatchMode
                  ? 'bg-red-500 text-white'
                  : isDark
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isBatchMode ? (
                <>
                  <CheckSquare className="w-4 h-4" />
                  <span>完成</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  <span>批量</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className={`mt-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          共 <span className="font-medium text-red-500">{totalWorks}</span> 个作品
          {filters.scoreStatus !== 'all' && (
            <span className="ml-2">
              · 筛选: {filters.scoreStatus === 'unscored' ? '未评分' : filters.scoreStatus === 'scored' ? '已评分' : '已发布'}
            </span>
          )}
        </div>
      </div>

      {/* 作品列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : works.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Filter className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              暂无作品
            </h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              该活动暂未有作品提交，或没有符合筛选条件的作品
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-3'}>
            {works.map((work, index) => (
              <WorkCard
                key={work.id}
                work={work}
                isSelected={selectedWorkId === work.id}
                isChecked={selectedWorkIds.has(work.id)}
                isBatchMode={isBatchMode}
                onSelect={() => onWorkSelect(work.id)}
                onToggleCheck={() => onWorkSelectToggle(work.id)}
                viewMode={viewMode}
                index={index}
                isDark={isDark}
              />
            ))}
          </div>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className={`p-4 border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-red-500 text-white'
                      : isDark
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
