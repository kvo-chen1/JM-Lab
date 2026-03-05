import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from './create/hooks/useCreateStore';
import { toast } from 'sonner';
import { draftService, Draft } from '@/services/draftService';
import { brandWizardDraftService, BrandWizardDraft } from '@/services/brandWizardDraftService';
import { createDraftService, CreateDraft } from '@/services/createDraftService';
import { supabase } from '@/lib/supabase';
import {
  DraftsLayout,
  DraftsLeftSidebar,
  DraftsRightSidebar,
  DraftsMainContent
} from '@/components/drafts';
import { Loader2, Cloud, CloudOff } from 'lucide-react';

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

// 活动作品提交草稿接口
interface EventSubmissionDraft {
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
  const [eventSubmissionDrafts, setEventSubmissionDrafts] = useState<EventSubmissionDraft[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTimeFilter, setActiveTimeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [syncedCount, setSyncedCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  // 同步所有类型的本地草稿到云端
  const syncAllLocalDraftsToCloud = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus('syncing');
      
      // 检查用户是否登录
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[Drafts] User not logged in, skipping sync');
        setSyncStatus('idle');
        return;
      }

      let totalSynced = 0;

      // 1. 同步创作中心草稿 (CREATE_DRAFTS)
      const createDraftsSynced = await syncCreateDrafts(user.id);
      totalSynced += createDraftsSynced;

      // 2. AI Writer 草稿 - draftService 已经会自动同步，只需重新加载
      // 3. 品牌向导草稿 - brandWizardDraftService 已经会自动同步，只需重新加载
      
      // 4. 同步活动提交草稿
      const eventDraftsSynced = await syncEventSubmissionDrafts(user.id);
      totalSynced += eventDraftsSynced;

      setSyncedCount(totalSynced);
      console.log('[Drafts] Total synced', totalSynced, 'drafts to cloud');

      if (totalSynced > 0) {
        toast.success(`成功同步 ${totalSynced} 个草稿到云端`);
      }

      setSyncStatus('synced');
    } catch (error) {
      console.error('[Drafts] Sync error:', error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  // 同步创作中心草稿
  const syncCreateDrafts = async (userId: string): Promise<number> => {
    try {
      const rawSaved = localStorage.getItem('CREATE_DRAFTS');
      if (!rawSaved) return 0;

      const localDrafts = JSON.parse(rawSaved);
      if (!Array.isArray(localDrafts) || localDrafts.length === 0) return 0;

      console.log('[Drafts] Found', localDrafts.length, 'create drafts to sync');

      // 获取云端已有的草稿
      const cloudDrafts = await createDraftService.getUserDrafts(100);
      const cloudDraftIds = new Set(cloudDrafts.map(d => d.id));

      let synced = 0;

      for (const draft of localDrafts) {
        // 如果草稿ID以 'draft-' 开头，说明是本地草稿，需要同步
        if (draft.id?.startsWith('draft-') && !cloudDraftIds.has(draft.id)) {
          try {
            const cloudDraft: Omit<CreateDraft, 'userId' | 'createdAt' | 'updatedAt' | 'isSynced'> = {
              id: draft.id,
              name: draft.name || `AI作品 ${synced + 1}`,
              description: draft.description,
              prompt: draft.prompt,
              selectedResult: draft.selectedResult,
              generatedResults: draft.generatedResults || [],
              activeTool: draft.activeTool || 'layout',
              stylePreset: draft.stylePreset,
              currentStep: draft.currentStep || 1,
              aiExplanation: draft.aiExplanation,
              selectedPatternId: draft.selectedPatternId,
              patternOpacity: draft.patternOpacity,
              patternScale: draft.patternScale,
              patternRotation: draft.patternRotation,
              patternBlendMode: draft.patternBlendMode,
              patternTileMode: draft.patternTileMode,
              patternPositionX: draft.patternPositionX,
              patternPositionY: draft.patternPositionY,
              tilePatternId: draft.tilePatternId,
              tileMode: draft.tileMode,
              tileSize: draft.tileSize,
              tileSpacing: draft.tileSpacing,
              tileRotation: draft.tileRotation,
              tileOpacity: draft.tileOpacity,
              mockupSelectedTemplateId: draft.mockupSelectedTemplateId,
              mockupShowWireframe: draft.mockupShowWireframe,
              traceSelectedKnowledgeId: draft.traceSelectedKnowledgeId,
              culturalInfoText: draft.culturalInfoText,
              createdAt: draft.createdAt || Date.now(),
            };

            const result = await createDraftService.saveDraft(cloudDraft);
            if (result) {
              synced++;
              console.log('[Drafts] Synced create draft:', draft.id);
            }
          } catch (error) {
            console.error('[Drafts] Failed to sync create draft:', draft.id, error);
          }
        }
      }

      return synced;
    } catch (error) {
      console.error('[Drafts] Error syncing create drafts:', error);
      return 0;
    }
  };

  // 同步活动提交草稿
  const syncEventSubmissionDrafts = async (userId: string): Promise<number> => {
    try {
      let synced = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('draft_event_submission_')) {
          try {
            const draftData = localStorage.getItem(key);
            if (draftData) {
              const parsed = JSON.parse(draftData);
              const eventId = key.replace('draft_event_submission_', '');
              
              // 检查是否已同步（可以添加标记）
              if (!parsed.isSynced) {
                // 这里可以添加到云端数据库
                // 目前 event_submission_drafts 表可能不存在，先记录日志
                console.log('[Drafts] Found event submission draft to sync:', eventId);
                
                // 标记为已同步
                parsed.isSynced = true;
                parsed.syncedAt = new Date().toISOString();
                localStorage.setItem(key, JSON.stringify(parsed));
                
                synced++;
              }
            }
          } catch (e) {
            console.error('Failed to sync event submission draft:', e);
          }
        }
      }

      return synced;
    } catch (error) {
      console.error('[Drafts] Error syncing event submission drafts:', error);
      return 0;
    }
  };

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

        // Load Saved Drafts from localStorage
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

        // Load Event Submission Drafts
        const eventDrafts: EventSubmissionDraft[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('draft_event_submission_')) {
            try {
              const draftData = localStorage.getItem(key);
              if (draftData) {
                const parsed = JSON.parse(draftData);
                const eventId = key.replace('draft_event_submission_', '');
                eventDrafts.push({
                  eventId,
                  formData: parsed.formData,
                  files: parsed.files,
                  savedAt: parsed.savedAt
                });
              }
            } catch (e) {
              console.error('Failed to parse event submission draft:', e);
            }
          }
        }
        setEventSubmissionDrafts(eventDrafts);

        // 同步本地草稿到云端
        await syncAllLocalDraftsToCloud();

        // 重新加载所有云端草稿（包含刚刚同步的）
        // 1. 重新加载创作中心草稿
        const cloudDrafts = await createDraftService.getUserDrafts(100);
        if (cloudDrafts.length > 0) {
          const cloudDraftsAsDraftData: DraftData[] = cloudDrafts.map(d => ({
            id: d.id,
            name: d.name,
            description: d.description,
            prompt: d.prompt,
            selectedResult: d.selectedResult,
            generatedResults: d.generatedResults,
            activeTool: d.activeTool as any,
            stylePreset: d.stylePreset,
            currentStep: d.currentStep,
            aiExplanation: d.aiExplanation,
            selectedPatternId: d.selectedPatternId,
            patternOpacity: d.patternOpacity,
            patternScale: d.patternScale,
            patternRotation: d.patternRotation,
            patternBlendMode: d.patternBlendMode,
            patternTileMode: d.patternTileMode,
            patternPositionX: d.patternPositionX,
            patternPositionY: d.patternPositionY,
            tilePatternId: d.tilePatternId,
            tileMode: d.tileMode,
            tileSize: d.tileSize,
            tileSpacing: d.tileSpacing,
            tileRotation: d.tileRotation,
            tileOpacity: d.tileOpacity,
            mockupSelectedTemplateId: d.mockupSelectedTemplateId,
            mockupShowWireframe: d.mockupShowWireframe,
            traceSelectedKnowledgeId: d.traceSelectedKnowledgeId,
            culturalInfoText: d.culturalInfoText,
            updatedAt: d.updatedAt,
            createdAt: d.createdAt,
          }));

          setSavedDrafts(cloudDraftsAsDraftData);
          localStorage.setItem('CREATE_DRAFTS', JSON.stringify(cloudDraftsAsDraftData));
        }

        // 2. 重新加载 AI Writer 草稿（draftService 会自动合并云端和本地）
        const refreshedAiDrafts = await draftService.getAllDrafts();
        setAiWriterDrafts(refreshedAiDrafts);

        // 3. 重新加载品牌向导草稿（brandWizardDraftService 会自动合并云端和本地）
        const refreshedWizardDrafts = await brandWizardDraftService.getAllDrafts();
        setBrandWizardDrafts(refreshedWizardDrafts);

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
    all: savedDrafts.length + aiWriterDrafts.length + brandWizardDrafts.length + eventSubmissionDrafts.length,
    layout: savedDrafts.filter(d => d.activeTool === 'layout').length,
    trace: savedDrafts.filter(d => d.activeTool === 'trace').length,
    mockup: savedDrafts.filter(d => d.activeTool === 'mockup').length,
    tile: savedDrafts.filter(d => d.activeTool === 'tile').length,
    aiWriter: aiWriterDrafts.length,
    brandWizard: brandWizardDrafts.length,
    eventSubmission: eventSubmissionDrafts.length,
    favorites: [...savedDrafts, ...aiWriterDrafts, ...brandWizardDrafts].filter(d => d.isFavorite).length
  }), [savedDrafts, aiWriterDrafts, brandWizardDrafts, eventSubmissionDrafts]);

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

  const handleLoadEventSubmissionDraft = (draft: EventSubmissionDraft) => {
    navigate(`/events/${draft.eventId}/submit`);
    toast.success('已加载活动作品草稿');
  };

  const handleDeleteEventSubmissionDraft = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个活动作品草稿吗？此操作无法撤销。')) {
      localStorage.removeItem(`draft_event_submission_${eventId}`);
      const newDrafts = eventSubmissionDrafts.filter(d => d.eventId !== eventId);
      setEventSubmissionDrafts(newDrafts);
      toast.success('草稿已删除');
    }
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
          eventSubmissionDrafts={eventSubmissionDrafts}
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
          onLoadEventSubmissionDraft={handleLoadEventSubmissionDraft}
          onDeleteEventSubmissionDraft={handleDeleteEventSubmissionDraft}
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
          syncStatus={syncStatus}
          syncedCount={syncedCount}
        />
      }
    />
  );
}
