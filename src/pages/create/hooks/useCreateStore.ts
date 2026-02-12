import { create } from 'zustand';
import { CreateState, ToolType, GeneratedResult } from '../types';
import { aiGeneratedResults, traditionalPatterns } from '../data';
import { workService, communityService, eventService } from '@/services/apiService';
import postsApi from '@/services/postService';

interface CreateActions {
  setActiveTool: (tool: ToolType) => void;
  setPrompt: (prompt: string) => void;
  setGeneratedResults: (results: GeneratedResult[]) => void;
  setSelectedResult: (id: number | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setShowCulturalInfo: (show: boolean) => void;
  setCurrentStep: (step: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  setFusionMode: (mode: boolean) => void;
  toggleFavorite: (id: number, thumbnail: string) => void;
  resetState: () => void;
  updateState: (updates: Partial<CreateState>) => void;
  savePatternHistory: () => void;
  restorePatternHistory: (historyItemId: string) => void;
  clearPatternHistory: () => void;
  saveToDrafts: () => void;
  loadDraft: (draft: any) => void;
  shareDesign: () => void;
  applyToOtherTool: (tool?: ToolType) => void;
  publishToExplore: (data: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    culturalElements: string[];
    visibility: 'public' | 'private';
    isFeatured: boolean;
    scheduledPublishDate: string | null;
  }) => Promise<{ success: boolean; message: string; moderationStatus: 'pending' | 'approved' | 'rejected' | 'scheduled' }>;
  publishToCommunity: (data: {
    communityId: string;
    title: string;
    description: string;
    visibility: 'public' | 'community' | 'private';
    scheduledPublishDate: string | null;
  }) => Promise<{ success: boolean; message: string }>;
  submitToEvent: (eventId: string, workData: {
    title: string;
    description: string;
    imageUrl: string;
  }) => Promise<{ success: boolean; message: string }>;
  getModerationStatus: (workId: number) => Promise<{
    status: 'pending' | 'approved' | 'rejected' | 'scheduled';
    reviewedAt: string | null;
    rejectionReason: string | null;
    moderator: any | null;
  }>;
  saveToPlanLibrary: () => void;
  setAutoGenerate: (value: boolean) => void;
}

const initialState: CreateState = {
  activeTool: 'sketch',
  prompt: '',
  generatedResults: aiGeneratedResults,
  selectedResult: aiGeneratedResults.length > 0 ? aiGeneratedResults[0].id : null,
  isGenerating: false,
  showCulturalInfo: false,
  currentStep: 1,
  isLoading: false,
  showAIReview: false,
  showModelSelector: false,
  showPublishModal: false,
  showDraftsModal: false,
  showHistoryModal: false,
  showPropertiesPanel: true,
  isPrecheckEnabled: true,
  precheckResult: null,
  aiExplanation: '',
  explainCollapsed: false,
  fusionMode: false,
  isRegenerating: false,
  isEngineGenerating: false,
  isPolishing: false,
  stylePreset: '',
  generateCount: 3,
  favorites: [],
  videoGenerating: false,
  culturalInfoText: '云纹是中国传统装饰纹样中常见的一种，象征着吉祥如意、高升和祥瑞。',
  promptB: '',
  isFusing: false,
  lastUpdatedAt: null,
  selectedPatternId: null,
  filterName: '复古胶片',
  streamStatus: 'idle',
  abortController: null,
  filterIntensity: 50,
  autoGenerate: false,
  showQuickActions: false,
  showEngineDetails: false,
  recentPatterns: [],
  recentFilters: [],
  generatingPlan: false,
  genError: '',
  curationTemplate: '标准',
  customTemplates: {},
  showTemplateEditor: false,
  newTemplateName: '',
  newTemplateGuide: '',
  savedPlans: [],
  patternHistory: [],
  selectedFilterId: null,
  currentEventId: null,
  traceSelectedKnowledgeId: null,
  mockupSelectedTemplateId: null,
  mockupShowWireframe: false,
  tilePatternId: null,
  tileMode: 'repeat',
  tileSize: 100,
  tileSpacing: 0,
  tileRotation: 0,
  tileOpacity: 100,
  patternOpacity: 50,
  patternScale: 100,
  patternRotation: 0,
  patternBlendMode: 'multiply',
  patternTileMode: 'repeat',
  patternPositionX: 0,
  patternPositionY: 0,
};

export const useCreateStore = create<CreateState & CreateActions>((set) => ({
  ...initialState,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setAutoGenerate: (value) => set({ autoGenerate: value }),
  setPrompt: (prompt) => set({ prompt }),
  setGeneratedResults: (results) => set((state) => {
    try {
      // 只处理有效的生成结果（有缩略图且不是空数组）
      if (!results || results.length === 0) {
        console.log('[History] No results to save, skipping history update');
        return { generatedResults: results };
      }

      const existingHistory = JSON.parse(localStorage.getItem('CREATE_HISTORY') || '[]');
      console.log('[History] Existing history count:', existingHistory.length);
      console.log('[History] New results to process:', results.length);

      // 过滤出有效的结果（有缩略图）
      const validResults = results.filter(r => {
        const hasThumbnail = r.thumbnail && typeof r.thumbnail === 'string' && r.thumbnail.trim() !== '';
        if (!hasThumbnail) {
          console.log('[History] Skipping result without thumbnail:', r);
        }
        return hasThumbnail;
      });

      if (validResults.length === 0) {
        console.log('[History] No valid results with thumbnails');
        return { generatedResults: results };
      }

      // 创建新的历史记录项，使用当前state的prompt
      const newHistoryItems = validResults.map((r, index) => {
        const historyItem = {
          id: `history-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          thumbnail: r.thumbnail,
          video: r.video || null,
          type: r.type || 'image',
          prompt: state.prompt || '',
          stylePreset: state.stylePreset || '',
        };
        console.log('[History] Creating history item:', historyItem.id, 'type:', historyItem.type);
        return historyItem;
      });

      // 合并历史记录，新的在前面，限制50条
      const updatedHistory = [...newHistoryItems, ...existingHistory].slice(0, 50);
      localStorage.setItem('CREATE_HISTORY', JSON.stringify(updatedHistory));
      console.log('[History] Saved', newHistoryItems.length, 'items. Total history:', updatedHistory.length);
    } catch (e) {
      console.error('[History] Failed to save to history:', e);
    }

    return { generatedResults: results };
  }),
  setSelectedResult: (id) => set({ selectedResult: id }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setShowCulturalInfo: (show) => set({ showCulturalInfo: show }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setFusionMode: (mode) => set({ fusionMode: mode }),
  
  toggleFavorite: (id, thumbnail) => set((state) => {
    const exists = state.favorites.some(f => f.id === id);
    if (exists) {
      return { favorites: state.favorites.filter(f => f.id !== id) };
    }
    return { favorites: [...state.favorites, { id, thumbnail }] };
  }),

  resetState: () => set(initialState),
  
  updateState: (updates) => set((state) => ({ ...state, ...updates })),
  
  savePatternHistory: () => set((state) => {
    if (!state.selectedPatternId) return state;
    
    const currentPattern = traditionalPatterns.find(pattern => pattern.id === state.selectedPatternId);
    if (!currentPattern) return state;
    
    const historyItem = {
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      patternId: state.selectedPatternId,
      patternName: currentPattern.name || '未知纹样',
      thumbnail: currentPattern.thumbnail,
      properties: {
        opacity: state.patternOpacity,
        scale: state.patternScale,
        rotation: state.patternRotation,
        blendMode: state.patternBlendMode,
        tileMode: state.patternTileMode,
        positionX: state.patternPositionX,
        positionY: state.patternPositionY,
      },
    };
    
    const updatedHistory = [historyItem, ...state.patternHistory].slice(0, 10);
    
    return { ...state, patternHistory: updatedHistory };
  }),
  
  restorePatternHistory: (historyItemId: string) => set((state) => {
    const historyItem = state.patternHistory.find(item => item.id === historyItemId);
    if (!historyItem) return state;
    
    return {
      ...state,
      selectedPatternId: historyItem.patternId,
      patternOpacity: historyItem.properties.opacity,
      patternScale: historyItem.properties.scale,
      patternRotation: historyItem.properties.rotation,
      patternBlendMode: historyItem.properties.blendMode,
      patternTileMode: historyItem.properties.tileMode,
      patternPositionX: historyItem.properties.positionX,
      patternPositionY: historyItem.properties.positionY,
    };
  }),
  
  clearPatternHistory: () => set((state) => ({
    ...state,
    patternHistory: [],
  })),
  
  loadDraft: (draft: any) => set((state) => {
    try {
      const newState: Partial<CreateState> = {
        prompt: draft.prompt || '',
        selectedResult: draft.selectedResult || null,
        generatedResults: draft.generatedResults || [],
        activeTool: draft.activeTool || 'sketch',
        stylePreset: draft.stylePreset || '',
        currentStep: draft.currentStep || 1,
        aiExplanation: draft.aiExplanation || '',
        patternOpacity: draft.patternOpacity ?? state.patternOpacity,
        patternScale: draft.patternScale ?? state.patternScale,
        patternRotation: draft.patternRotation ?? state.patternRotation,
        patternBlendMode: draft.patternBlendMode ?? state.patternBlendMode,
        patternTileMode: draft.patternTileMode ?? state.patternTileMode,
        patternPositionX: draft.patternPositionX ?? state.patternPositionX,
        patternPositionY: draft.patternPositionY ?? state.patternPositionY,
        selectedPatternId: draft.selectedPatternId ?? state.selectedPatternId,
        traceSelectedKnowledgeId: draft.traceSelectedKnowledgeId ?? state.traceSelectedKnowledgeId,
        culturalInfoText: draft.culturalInfoText ?? state.culturalInfoText,
        mockupSelectedTemplateId: draft.mockupSelectedTemplateId ?? state.mockupSelectedTemplateId,
        mockupShowWireframe: draft.mockupShowWireframe ?? state.mockupShowWireframe,
        tilePatternId: draft.tilePatternId ?? state.tilePatternId,
        tileMode: draft.tileMode ?? state.tileMode,
        tileSize: draft.tileSize ?? state.tileSize,
        tileSpacing: draft.tileSpacing ?? state.tileSpacing,
        tileRotation: draft.tileRotation ?? state.tileRotation,
        tileOpacity: draft.tileOpacity ?? state.tileOpacity,
      };

      if (typeof window !== 'undefined') {
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 ease-in-out';
        toast.textContent = '草稿加载成功！';
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(100%)';
          setTimeout(() => {
            document.body.removeChild(toast);
          }, 300);
        }, 2000);
      }
      
      return { ...state, ...newState };
    } catch (error) {
      console.error('Failed to load draft:', error);
      return state;
    }
  }),

  saveToDrafts: () => set((state) => {
    if (!state.selectedResult) return state;
    
    const selectedImage = state.generatedResults.find(r => r.id === state.selectedResult);
    if (!selectedImage) return state;
    
    try {
      const drafts = JSON.parse(localStorage.getItem('CREATE_DRAFTS') || '[]');
      const newDraft = {
        id: `draft-${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: `草稿 ${drafts.length + 1}`,
        description: '',
        prompt: state.prompt,
        selectedResult: state.selectedResult,
        generatedResults: state.generatedResults,
        activeTool: state.activeTool,
        stylePreset: state.stylePreset,
        currentStep: state.currentStep,
        aiExplanation: state.aiExplanation,
        selectedPatternId: state.selectedPatternId,
        patternOpacity: state.patternOpacity,
        patternScale: state.patternScale,
        patternRotation: state.patternRotation,
        patternBlendMode: state.patternBlendMode,
        patternTileMode: state.patternTileMode,
        patternPositionX: state.patternPositionX,
        patternPositionY: state.patternPositionY,
      };
      const updatedDrafts = [newDraft, ...drafts].slice(0, 10);
      localStorage.setItem('CREATE_DRAFTS', JSON.stringify(updatedDrafts));
      console.log('Design saved to drafts');
      
      if (typeof window !== 'undefined') {
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 ease-in-out';
        toast.textContent = '保存成功！';
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(100%)';
          setTimeout(() => {
            document.body.removeChild(toast);
          }, 300);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to save to drafts:', error);
      
      if (typeof window !== 'undefined') {
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 right-6 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 ease-in-out';
        toast.textContent = '保存失败，请重试！';
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(100%)';
          setTimeout(() => {
            document.body.removeChild(toast);
          }, 300);
        }, 2000);
      }
    }
    
    return state;
  }),
  
  shareDesign: () => set((state) => {
    if (!state.selectedResult) return state;
    
    const selectedImage = state.generatedResults.find(r => r.id === state.selectedResult);
    if (!selectedImage) return state;
    
    try {
      const shareUrl = `${window.location.origin}/share/${state.selectedResult}?prompt=${encodeURIComponent(state.prompt)}`;
      
      if (typeof window !== 'undefined') {
        alert(`分享链接: ${shareUrl}\n已复制到剪贴板`);
        navigator.clipboard.writeText(shareUrl);
      }
      
      console.log('Share design:', shareUrl);
    } catch (error) {
      console.error('Failed to share design:', error);
    }
    
    return state;
  }),
  
  applyToOtherTool: (initialTool?: ToolType) => set((state) => {
    if (!state.selectedResult) return state;
    
    if (initialTool) {
      return {
        ...state,
        activeTool: initialTool,
      };
    }
    
    return state;
  }),
  
  publishToExplore: async (data) => {
    try {
      console.log('Publishing to explore:', data);
      
      const state = get();
      const selectedImage = state.generatedResults.find(r => r.id === state.selectedResult);
      
      if (!selectedImage) {
        return {
          success: false,
          message: '请先选择生成的作品',
          moderationStatus: 'rejected'
        };
      }
      
      // 判断是否为视频
      const isVideo = selectedImage.type === 'video' || selectedImage.video;
      
      console.log('Publish - selectedImage:', { 
        type: selectedImage.type, 
        video: selectedImage.video?.substring(0, 50),
        thumbnail: selectedImage.thumbnail?.substring(0, 50),
        url: selectedImage.url?.substring(0, 50)
      });
      
      // 处理缩略图：如果是视频，使用视频专用占位图
      let thumbnail = selectedImage.thumbnail || selectedImage.url || '';
      if (isVideo && (!thumbnail || thumbnail.includes('#t='))) {
        // 如果缩略图是视频URL加时间戳，使用视频占位图
        thumbnail = 'https://via.placeholder.com/800x600/3b82f6/ffffff?text=Video';
      }
      
      // 创建新作品
      const videoUrl = isVideo ? selectedImage.video : undefined;
      console.log('Publish - videoUrl:', videoUrl?.substring(0, 50));
      
      const newPost = {
        title: data.title,
        description: data.description,
        thumbnail: thumbnail,
        videoUrl: videoUrl,
        type: isVideo ? 'video' : 'image',
        category: isVideo ? 'video' : (data.category || 'design'),
        tags: data.tags || [],
        culturalElements: data.culturalElements || [],
        visibility: data.visibility || 'public',
        status: 'published',
        publishType: 'explore',
        isFeatured: data.isFeatured || false,
        scheduledPublishDate: data.scheduledPublishDate
      };
      
      console.log('Publishing post with data:', newPost);
      
      // 调用 API 保存到 Supabase
      // 使用 'current-user' 让 postService 处理当前用户 ID
      const result = await postsApi.addPost(newPost as any, { id: 'current-user' } as any);
      
      if (result) {
        return {
          success: true,
          message: '发布成功，正在审核中',
          moderationStatus: 'pending'
        };
      } else {
        throw new Error('发布失败');
      }
    } catch (error: any) {
      console.error('Failed to publish to explore:', error);
      return {
        success: false,
        message: error.message || '发布失败，请重试',
        moderationStatus: 'rejected'
      };
    }
  },
  
  publishToCommunity: async (data) => {
    try {
      console.log('Publishing to community:', data);
      
      const state = get();
      const selectedImage = state.generatedResults.find(r => r.id === state.selectedResult);
      
      if (!selectedImage) {
        return {
          success: false,
          message: '请先选择生成的作品'
        };
      }
      
      // 判断是否为视频
      const isVideo = selectedImage.type === 'video' || selectedImage.video;
      
      // 处理缩略图
      let thumbnail = selectedImage.thumbnail || selectedImage.url || '';
      if (isVideo && (!thumbnail || thumbnail.includes('#t='))) {
        thumbnail = 'https://via.placeholder.com/800x600/3b82f6/ffffff?text=Video';
      }
      
      // 创建新作品
      const newPost = {
        title: data.title,
        description: data.description,
        thumbnail: thumbnail,
        videoUrl: isVideo ? selectedImage.video : undefined,
        type: isVideo ? 'video' : 'image',
        category: isVideo ? 'video' : 'design',
        visibility: data.visibility || 'community',
        status: 'published',
        publishType: 'community',
        communityId: data.communityId,
        scheduledPublishDate: data.scheduledPublishDate
      };
      
      // 调用 API 保存到 Supabase
      const result = await postsApi.addPost(newPost as any, { id: 'current-user' } as any);
      
      if (result) {
        return {
          success: true,
          message: '发布成功'
        };
      } else {
        throw new Error('发布失败');
      }
    } catch (error: any) {
      console.error('Failed to publish to community:', error);
      return {
        success: false,
        message: error.message || '发布失败，请重试'
      };
    }
  },
  
  submitToEvent: async (eventId, workData) => {
    try {
      console.log('Submitting to event:', eventId, workData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: '提交成功'
      };
    } catch (error) {
      console.error('Failed to submit to event:', error);
      return {
        success: false,
        message: '提交失败，请重试'
      };
    }
  },
  
  getModerationStatus: async (workId) => {
    try {
      console.log('Getting moderation status for work:', workId);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        status: 'pending' as const,
        reviewedAt: null,
        rejectionReason: null,
        moderator: null
      };
    } catch (error) {
      console.error('Failed to get moderation status:', error);
      throw error;
    }
  },
  
  saveToPlanLibrary: () => set((state) => {
    if (!state.prompt) return state;
    
    try {
      const newPlan = {
        id: `plan-${Date.now()}`,
        title: `计划 ${state.savedPlans.length + 1}`,
        query: state.prompt,
        aiText: state.aiExplanation,
        ts: Date.now()
      };
      
      const updatedPlans = [newPlan, ...state.savedPlans].slice(0, 10);
      
      return { ...state, savedPlans: updatedPlans };
    } catch (error) {
      console.error('Failed to save to plan library:', error);
      return state;
    }
  }),
}));
