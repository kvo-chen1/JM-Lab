import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from './create/hooks/useCreateStore';
import { toast } from 'sonner';
import { draftService, Draft } from '@/services/draftService';
import { brandWizardDraftService, BrandWizardDraft } from '@/services/brandWizardDraftService';
import {
  DraftsLayout,
  DraftsLeftSidebar,
  DraftsRightSidebar,
  DraftsMainContent
} from '@/components/drafts';

interface DraftData {
  id?: string;
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
  [key: string]: any;
}

interface RecentActivity {
  id: string;
  type: 'edit' | 'create' | 'delete' | 'export';
  title: string;
  time: string;
  toolType?: string;
}

export default function Drafts() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { loadDraft } = useCreateStore();

  // State
  const [activeDraft, setActiveDraft] = useState<DraftData | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<DraftData[]>([]);
  const [aiWriterDrafts, setAiWriterDrafts] = useState<Draft[]>([]);
  const [brandWizardDrafts, setBrandWizardDrafts] = useState<BrandWizardDraft[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTimeFilter, setActiveTimeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  // Load Data
  useEffect(() => {
    const loadAllDrafts = async () => {
      setIsLoading(true);
      try {
        // Load Active Session
        const rawActive = localStorage.getItem('CREATE_DRAFT');
        if (rawActive) {
          const parsed = JSON.parse(rawActive);
          if (parsed && typeof parsed === 'object') {
            setActiveDraft(parsed);
          }
        }

        // Load Saved Drafts
        const rawSaved = localStorage.getItem('CREATE_DRAFTS');
        if (rawSaved) {
          const parsed = JSON.parse(rawSaved);
          if (Array.isArray(parsed)) {
            setSavedDrafts(parsed);
          }
        }

        // Load AI Writer Drafts
        const aiDrafts = await draftService.getAllDrafts();
        setAiWriterDrafts(aiDrafts);

        // Load Brand Wizard Drafts
        const wizardDrafts = await brandWizardDraftService.getAllDrafts();
        setBrandWizardDrafts(wizardDrafts);

        // Generate mock recent activities (in real app, this would come from a service)
        setRecentActivities([
          { id: '1', type: 'edit', title: '天津文化海报设计', time: '2小时前' },
          { id: '2', type: 'create', title: '新年贺卡模板', time: '5小时前' },
          { id: '3', type: 'export', title: '产品包装设计', time: '昨天' },
          { id: '4', type: 'edit', title: '品牌Logo设计', time: '2天前' },
        ]);
      } catch (e) {
        console.error('Failed to load drafts', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllDrafts();

    // 监听 localStorage 变化，当其他页面保存草稿时自动刷新
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'CREATE_DRAFTS') {
        console.log('[Drafts] CREATE_DRAFTS changed, reloading...');
        loadAllDrafts();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 页面获得焦点时刷新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Drafts] Page visible, reloading drafts...');
        const rawSaved = localStorage.getItem('CREATE_DRAFTS');
        if (rawSaved) {
          try {
            const parsed = JSON.parse(rawSaved);
            if (Array.isArray(parsed)) {
              setSavedDrafts(parsed);
            }
          } catch (e) {
            console.error('Failed to reload drafts:', e);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Calculate draft counts
  const draftCounts = useMemo(() => ({
    all: savedDrafts.length + aiWriterDrafts.length + brandWizardDrafts.length,
    layout: savedDrafts.filter(d => d.activeTool === 'layout').length,
    trace: savedDrafts.filter(d => d.activeTool === 'trace').length,
    mockup: savedDrafts.filter(d => d.activeTool === 'mockup').length,
    tile: savedDrafts.filter(d => d.activeTool === 'tile').length,
    aiWriter: aiWriterDrafts.length,
    brandWizard: brandWizardDrafts.length,
    favorites: [...savedDrafts, ...aiWriterDrafts, ...brandWizardDrafts].filter(d => d.isFavorite).length
  }), [savedDrafts, aiWriterDrafts, brandWizardDrafts]);

  // Storage stats (mock data - in real app calculate from actual storage)
  const storageStats = useMemo(() => ({
    used: Math.round(savedDrafts.length * 2.5 + aiWriterDrafts.length * 0.5 + brandWizardDrafts.length * 1.5),
    total: 500,
    drafts: savedDrafts.length + brandWizardDrafts.length,
    images: savedDrafts.reduce((acc, d) => acc + (d.generatedResults?.length || 0), 0),
    aiWritings: aiWriterDrafts.length,
    brandWizards: brandWizardDrafts.length
  }), [savedDrafts, aiWriterDrafts, brandWizardDrafts]);

  // Popular tags (mock data)
  const popularTags = ['海报', 'Logo', '包装', '插画', 'UI设计', '文创'];

  // Actions
  const handleResumeActive = () => {
    if (activeDraft) {
      loadDraft(activeDraft);
      navigate('/create');
    }
  };

  const handleClearActive = () => {
    if (confirm('确定要清除当前未保存的活动会话吗？')) {
      localStorage.removeItem('CREATE_DRAFT');
      setActiveDraft(null);
      toast.success('活动会话已清除');
    }
  };

  const handleLoadDraft = (draft: DraftData) => {
    loadDraft(draft);
    if (draft.content) {
      navigate(`/create/ai-writer?draft=${draft.id}`);
    } else {
      navigate('/create');
    }
    toast.success('已加载草稿');
  };

  const handleDeleteDraft = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个草稿吗？此操作无法撤销。')) {
      const newDrafts = savedDrafts.filter(d => d.id !== id);
      setSavedDrafts(newDrafts);
      localStorage.setItem('CREATE_DRAFTS', JSON.stringify(newDrafts));
      toast.success('草稿已删除');
    }
  };

  const handleDeleteAiWriterDraft = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个AI写作草稿吗？此操作无法撤销。')) {
      try {
        await draftService.deleteDraft(id);
        const newDrafts = aiWriterDrafts.filter(d => d.id !== id);
        setAiWriterDrafts(newDrafts);
        toast.success('草稿已删除');
      } catch (error) {
        console.error('Failed to delete AI writer draft:', error);
        toast.error('删除草稿失败');
      }
    }
  };

  const handleDeleteBrandWizardDraft = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个品牌向导草稿吗？此操作无法撤销。')) {
      try {
        await brandWizardDraftService.deleteDraft(id);
        const newDrafts = brandWizardDrafts.filter(d => d.id !== id);
        setBrandWizardDrafts(newDrafts);
        toast.success('草稿已删除');
      } catch (error) {
        console.error('Failed to delete brand wizard draft:', error);
        toast.error('删除草稿失败');
      }
    }
  };

  const handleLoadBrandWizardDraft = (draft: BrandWizardDraft) => {
    navigate(`/wizard?draft=${draft.id}`);
    toast.success('已加载品牌向导草稿');
  };

  const handleExportDraft = (e: React.MouseEvent, draft: DraftData) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(draft, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${draft.name || 'draft'}-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('导出成功');
  };

  const handleNewDraft = () => {
    navigate('/create');
  };

  const handleExportAll = () => {
    const allDrafts = [...savedDrafts, ...aiWriterDrafts, ...brandWizardDrafts];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allDrafts, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `all-drafts-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('全部草稿已导出');
  };

  const handleClearOld = () => {
    if (confirm('确定要清理30天前的草稿吗？此操作无法撤销。')) {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const newDrafts = savedDrafts.filter(d => (d.updatedAt || 0) > thirtyDaysAgo);
      setSavedDrafts(newDrafts);
      localStorage.setItem('CREATE_DRAFTS', JSON.stringify(newDrafts));
      toast.success('旧草稿已清理');
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchTerm(tag);
  };

  return (
    <DraftsLayout
      isDark={isDark}
      leftSidebar={
        <DraftsLeftSidebar
          isDark={isDark}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          activeTimeFilter={activeTimeFilter}
          onTimeFilterChange={setActiveTimeFilter}
          draftCounts={draftCounts}
          popularTags={popularTags}
          onTagClick={handleTagClick}
        />
      }
      mainContent={
        <DraftsMainContent
          isDark={isDark}
          activeDraft={activeDraft}
          savedDrafts={savedDrafts}
          aiWriterDrafts={aiWriterDrafts}
          brandWizardDrafts={brandWizardDrafts}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          activeCategory={activeCategory}
          onResumeActive={handleResumeActive}
          onClearActive={handleClearActive}
          onLoadDraft={handleLoadDraft}
          onDeleteDraft={handleDeleteDraft}
          onDeleteAiWriterDraft={handleDeleteAiWriterDraft}
          onDeleteBrandWizardDraft={handleDeleteBrandWizardDraft}
          onExportDraft={handleExportDraft}
          onLoadBrandWizardDraft={handleLoadBrandWizardDraft}
          onCreateNew={handleNewDraft}
        />
      }
      rightSidebar={
        <DraftsRightSidebar
          isDark={isDark}
          storageStats={storageStats}
          recentActivities={recentActivities}
          onNewDraft={handleNewDraft}
          onExportAll={handleExportAll}
          onClearOld={handleClearOld}
        />
      }
    />
  );
}
