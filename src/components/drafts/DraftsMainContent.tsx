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

interface BrandWizardDraftData {
  id: string;
  title: string;
  brandName: string;
  currentStep: number;
  updatedAt: number;
  thumbnail?: string;
  isFavorite?: boolean;
}

interface EventSubmissionDraftData {
  eventId: string;
  eventTitle?: string;
  formData: {
    title: string;
    description: string;
    tags: string[];
  };
  files: any[];
  savedAt: string;
}

interface DraftsMainContentProps {
  isDark: boolean;
  activeDraft: DraftData | null;
  savedDrafts: DraftData[];
  aiWriterDrafts: DraftData[];
  brandWizardDrafts?: BrandWizardDraftData[];
  eventSubmissionDrafts?: EventSubmissionDraftData[];
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
  onDeleteBrandWizardDraft?: (e: React.MouseEvent, id: string) => void;
  onExportDraft: (e: React.MouseEvent, draft: DraftData) => void;
  onLoadBrandWizardDraft?: (draft: BrandWizardDraftData) => void;
  onLoadEventSubmissionDraft?: (draft: EventSubmissionDraftData) => void;
  onDeleteEventSubmissionDraft?: (e: React.MouseEvent, eventId: string) => void;
  onCreateNew: () => void;
}

export default function DraftsMainContent({
  isDark,
  activeDraft,
  savedDrafts,
  aiWriterDrafts,
  brandWizardDrafts = [],
  eventSubmissionDrafts = [],
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
  onDeleteBrandWizardDraft,
  onExportDraft,
  onLoadBrandWizardDraft,
  onLoadEventSubmissionDraft,
  onDeleteEventSubmissionDraft,
  onCreateNew
}: DraftsMainContentProps) {
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // 合并草稿并根据分类筛选
  const getFilteredDrafts = () => {
    let allDrafts: DraftData[] = [];
    let allBrandWizardDrafts: BrandWizardDraftData[] = [];
    let allEventSubmissionDrafts: EventSubmissionDraftData[] = [];

    // 根据分类筛选
    switch (activeCategory) {
      case 'all':
        allDrafts = [...savedDrafts, ...aiWriterDrafts];
        allBrandWizardDrafts = brandWizardDrafts;
        allEventSubmissionDrafts = eventSubmissionDrafts;
        break;
      case 'favorites':
        allDrafts = [...savedDrafts.filter(d => d.isFavorite), ...aiWriterDrafts.filter(d => d.isFavorite)];
        allBrandWizardDrafts = brandWizardDrafts.filter(d => d.isFavorite);
        allEventSubmissionDrafts = [];
        break;
      case 'aiWriter':
        allDrafts = aiWriterDrafts;
        break;
      case 'brandWizard':
        allBrandWizardDrafts = brandWizardDrafts;
        break;
      case 'eventSubmission':
        allEventSubmissionDrafts = eventSubmissionDrafts;
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
      allBrandWizardDrafts = allBrandWizardDrafts.filter(d =>
        (d.title && d.title.toLowerCase().includes(term)) ||
        (d.brandName && d.brandName.toLowerCase().includes(term))
      );
      allEventSubmissionDrafts = allEventSubmissionDrafts.filter(d =>
        (d.formData.title && d.formData.title.toLowerCase().includes(term)) ||
        (d.formData.description && d.formData.description.toLowerCase().includes(term))
      );
    }

    // 排序
    allDrafts.sort((a, b) => {
      if (sortBy === 'newest') return (b.updatedAt || 0) - (a.updatedAt || 0);
      if (sortBy === 'oldest') return (a.updatedAt || 0) - (b.updatedAt || 0);
      if (sortBy === 'name') return (a.name || a.title || '').localeCompare(b.name || b.title || '');
      return 0;
    });
    
    allBrandWizardDrafts.sort((a, b) => {
      if (sortBy === 'newest') return (b.updatedAt || 0) - (a.updatedAt || 0);
      if (sortBy === 'oldest') return (a.updatedAt || 0) - (b.updatedAt || 0);
      if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });

    allEventSubmissionDrafts.sort((a, b) => {
      const aTime = new Date(a.savedAt).getTime();
      const bTime = new Date(b.savedAt).getTime();
      if (sortBy === 'newest') return bTime - aTime;
      if (sortBy === 'oldest') return aTime - bTime;
      if (sortBy === 'name') return (a.formData.title || '').localeCompare(b.formData.title || '');
      return 0;
    });

    return { drafts: allDrafts, brandWizardDrafts: allBrandWizardDrafts, eventSubmissionDrafts: allEventSubmissionDrafts };
  };

  const { drafts: filteredDrafts, brandWizardDrafts: filteredBrandWizardDrafts, eventSubmissionDrafts: filteredEventSubmissionDrafts } = getFilteredDrafts();
  const totalCount = filteredDrafts.length + filteredBrandWizardDrafts.length + filteredEventSubmissionDrafts.length;

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
              ({totalCount})
            </span>
          </div>
        </div>

        {totalCount === 0 ? (
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
              {/* Regular Drafts */}
              {filteredDrafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  id={draft.id}
                  name={draft.name}
                  title={draft.title}
                  prompt={draft.prompt}
                  content={draft.content}
                  thumbnail={draft.generatedResults?.[0]?.thumbnail || draft.generatedResults?.[0]?.imageUrl}
                  videoUrl={draft.generatedResults?.[0]?.video || draft.generatedResults?.[0]?.videoUrl}
                  type={draft.generatedResults?.[0]?.type}
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
              
              {/* Brand Wizard Drafts */}
              {filteredBrandWizardDrafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  id={draft.id}
                  name={draft.title}
                  title={draft.brandName}
                  prompt={`步骤 ${draft.currentStep}/4`}
                  content={''}
                  thumbnail={draft.thumbnail}
                  toolType="brandWizard"
                  templateName="品牌向导"
                  updatedAt={draft.updatedAt}
                  isFavorite={draft.isFavorite}
                  isDark={isDark}
                  viewMode={viewMode}
                  onClick={() => onLoadBrandWizardDraft?.(draft)}
                  onDelete={(e) => onDeleteBrandWizardDraft?.(e, draft.id)}
                />
              ))}

              {/* Event Submission Drafts */}
              {filteredEventSubmissionDrafts.map((draft) => (
                <DraftCard
                  key={draft.eventId}
                  id={draft.eventId}
                  name={draft.formData.title || '未命名作品'}
                  title={`活动作品提交`}
                  prompt={draft.formData.description?.substring(0, 50) + (draft.formData.description?.length > 50 ? '...' : '')}
                  content={''}
                  toolType="eventSubmission"
                  templateName="活动提交"
                  updatedAt={new Date(draft.savedAt).getTime()}
                  isFavorite={false}
                  isDark={isDark}
                  viewMode={viewMode}
                  onClick={() => onLoadEventSubmissionDraft?.(draft)}
                  onDelete={(e) => onDeleteEventSubmissionDraft?.(e, draft.eventId)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
