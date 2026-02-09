import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  X
} from 'lucide-react';
import { useState } from 'react';
import DraftCard from './DraftCard';
import ActiveSessionCard from './ActiveSessionCard';
import EmptyState from './EmptyState';

interface DraftData {
  id: string;
  name?: string;
  title?: string;
  prompt?: string;
  content?: string;
  selectedResult?: number | null;
  currentStep?: number;
  updatedAt: number;
  generatedResults?: any[];
  activeTool?: 'layout' | 'trace' | 'mockup' | 'tile' | 'aiWriter';
  templateName?: string;
  isFavorite?: boolean;
}

interface DraftsMainContentProps {
  isDark: boolean;
  activeDraft: DraftData | null;
  savedDrafts: DraftData[];
  aiWriterDrafts: DraftData[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: 'newest' | 'oldest' | 'name';
  onSortChange: (sort: 'newest' | 'oldest' | 'name') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  activeCategory: string;
  onResumeActive: () => void;
  onClearActive: () => void;
  onLoadDraft: (draft: DraftData) => void;
  onDeleteDraft: (e: React.MouseEvent, id: string) => void;
  onDeleteAiWriterDraft: (e: React.MouseEvent, id: string) => void;
  onExportDraft: (e: React.MouseEvent, draft: DraftData) => void;
  onCreateNew: () => void;
}

export default function DraftsMainContent({
  isDark,
  activeDraft,
  savedDrafts,
  aiWriterDrafts,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  activeCategory,
  onResumeActive,
  onClearActive,
  onLoadDraft,
  onDeleteDraft,
  onDeleteAiWriterDraft,
  onExportDraft,
  onCreateNew
}: DraftsMainContentProps) {
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // 合并草稿并根据分类筛选
  const getFilteredDrafts = () => {
    let allDrafts: DraftData[] = [];

    // 根据分类筛选
    switch (activeCategory) {
      case 'all':
        allDrafts = [...savedDrafts, ...aiWriterDrafts];
        break;
      case 'favorites':
        allDrafts = [...savedDrafts.filter(d => d.isFavorite), ...aiWriterDrafts.filter(d => d.isFavorite)];
        break;
      case 'aiWriter':
        allDrafts = aiWriterDrafts;
        break;
      default:
        allDrafts = savedDrafts.filter(d => d.activeTool === activeCategory);
    }

    // 搜索筛选
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      allDrafts = allDrafts.filter(d =>
        (d.name && d.name.toLowerCase().includes(term)) ||
        (d.title && d.title.toLowerCase().includes(term)) ||
        (d.prompt && d.prompt.toLowerCase().includes(term)) ||
        (d.content && d.content.toLowerCase().includes(term))
      );
    }

    // 排序
    allDrafts.sort((a, b) => {
      if (sortBy === 'newest') return (b.updatedAt || 0) - (a.updatedAt || 0);
      if (sortBy === 'oldest') return (a.updatedAt || 0) - (b.updatedAt || 0);
      if (sortBy === 'name') return (a.name || a.title || '').localeCompare(b.name || b.title || '');
      return 0;
    });

    return allDrafts;
  };

  const filteredDrafts = getFilteredDrafts();

  const sortOptions = [
    { value: 'newest', label: '最新修改' },
    { value: 'oldest', label: '最早创建' },
    { value: 'name', label: '名称排序' }
  ];

  return (
    <div className="space-y-6">
      {/* 搜索和工具栏 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 搜索框 */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索草稿..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-12 pr-10 py-3 rounded-xl border transition-all duration-300 ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
            } focus:outline-none`}
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 工具按钮 */}
        <div className="flex items-center gap-2">
          {/* 排序下拉 */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300 ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="text-sm font-medium">
                {sortOptions.find(o => o.value === sortBy)?.label}
              </span>
            </button>

            <AnimatePresence>
              {showSortDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`absolute top-full right-0 mt-2 w-40 rounded-xl border shadow-lg z-20 ${
                    isDark
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value as any);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        sortBy === option.value
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : isDark
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 视图切换 */}
          <div className={`flex rounded-xl border overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-3 transition-all duration-300 ${
                viewMode === 'grid'
                  ? isDark
                    ? 'bg-primary-600 text-white'
                    : 'bg-primary-500 text-white'
                  : isDark
                  ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-3 transition-all duration-300 ${
                viewMode === 'list'
                  ? isDark
                    ? 'bg-primary-600 text-white'
                    : 'bg-primary-500 text-white'
                  : isDark
                  ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 活动会话 */}
      {activeDraft && !searchTerm && activeCategory === 'all' && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-green-400 to-green-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">当前活动会话</h2>
          </div>
          <ActiveSessionCard
            draft={activeDraft}
            isDark={isDark}
            onResume={onResumeActive}
            onClear={onClearActive}
          />
        </section>
      )}

      {/* 草稿列表 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-primary-500 to-primary-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {searchTerm ? '搜索结果' : '我的草稿'}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({filteredDrafts.length})
            </span>
          </div>
        </div>

        {filteredDrafts.length === 0 ? (
          <EmptyState
            isDark={isDark}
            type={searchTerm ? 'search' : activeCategory === 'all' ? 'all' : 'category'}
            onCreateNew={onCreateNew}
            searchTerm={searchTerm}
          />
        ) : (
          <div className={
            viewMode === 'grid'
              ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
              : "flex flex-col gap-3"
          }>
            <AnimatePresence mode="popLayout">
              {filteredDrafts.map((draft, index) => (
                <DraftCard
                  key={draft.id}
                  id={draft.id}
                  name={draft.name}
                  title={draft.title}
                  prompt={draft.prompt}
                  content={draft.content}
                  thumbnail={draft.generatedResults?.[0]?.imageUrl}
                  toolType={draft.activeTool || (draft.content ? 'aiWriter' : 'layout')}
                  templateName={draft.templateName}
                  updatedAt={draft.updatedAt}
                  isFavorite={draft.isFavorite}
                  isDark={isDark}
                  viewMode={viewMode}
                  onClick={() => onLoadDraft(draft)}
                  onDelete={(e) => draft.content ? onDeleteAiWriterDraft(e, draft.id) : onDeleteDraft(e, draft.id)}
                  onExport={draft.content ? undefined : (e) => onExportDraft(e, draft)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
