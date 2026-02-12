import { create } from 'zustand';
import { CreateState, ToolType, GeneratedResult } from '../types';
import { aiGeneratedResults, traditionalPatterns } from '../data';
import { workService, communityService, eventService } from '@/services/apiService';
import postsApi from '@/services/postService';
import { inspirationMindMapService } from '@/services/inspirationMindMapService';

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
  // 图片完善相关
  setRefinementMode: (mode: 'image-to-image' | 'expand' | 'inpaint') => void;
  setRefinementPrompt: (prompt: string) => void;
  setExpandRatio: (ratio: number) => void;
  setInpaintMask: (mask: string | null) => void;
  // 提示词优化相关
  setOptimizedPrompt: (prompt: string) => void;
  addPromptHistory: (prompt: string) => void;
  removePromptFromHistory: (prompt: string) => void;
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
  // 图片完善相关状态
  refinementMode: 'image-to-image',
  refinementPrompt: '',
  expandRatio: 1.5,
  inpaintMask: null,
  // 提示词优化相关状态
  optimizedPrompt: '',
  promptHistory: [],
  isOptimizingPrompt: false,
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

      // 同步到灵感脉络
      (async () => {
        try {
          const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
          if (!user) {
            console.log('[InspirationMindMap] User not logged in, skipping sync');
            return;
          }

          // 获取或创建用户的默认灵感脉络
          let mindMaps = await inspirationMindMapService.getUserMindMaps(user.id);
          let mindMap = mindMaps.find(m => m.title === '我的创作脉络') || mindMaps[0];

          if (!mindMap) {
            console.log('[InspirationMindMap] Creating default mind map for user');
            mindMap = await inspirationMindMapService.createMindMap(user.id, '我的创作脉络');
          }

          // 为每个生成的作品添加节点
          for (const item of newHistoryItems) {
            const nodeData = {
              title: item.prompt ? item.prompt.substring(0, 30) + (item.prompt.length > 30 ? '...' : '') : '创作作品',
              description: `创作时间: ${new Date(item.timestamp).toLocaleString('zh-CN')}`,
              category: 'ai_generate' as const,
              content: {
                type: item.type,
                thumbnail: item.thumbnail,
                video: item.video,
                prompt: item.prompt,
                stylePreset: item.stylePreset,
              },
              tags: item.stylePreset ? [item.stylePreset] : ['创作'],
            };

            await inspirationMindMapService.addNode(mindMap.id, nodeData);
            console.log('[InspirationMindMap] Added node for creation:', item.id);
          }

          console.log('[InspirationMindMap] Successfully synced', newHistoryItems.length, 'creations to mind map');
        } catch (err) {
          console.error('[InspirationMindMap] Failed to sync to mind map:', err);
          // 不影响主流程，仅记录错误
        }
      })();
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

    // 同步到灵感脉络
    (async () => {
      try {
        const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
        if (!user) {
          console.log('[InspirationMindMap] User not logged in, skipping pattern history sync');
          return;
        }

        // 获取或创建用户的默认灵感脉络
        let mindMaps = await inspirationMindMapService.getUserMindMaps(user.id);
        let mindMap = mindMaps.find(m => m.title === '我的创作脉络') || mindMaps[0];

        if (!mindMap) {
          console.log('[InspirationMindMap] Creating default mind map for user');
          mindMap = await inspirationMindMapService.createMindMap(user.id, '我的创作脉络');
        }

        // 添加纹样编辑节点
        const nodeData = {
          title: `纹样: ${currentPattern.name || '未知纹样'}`,
          description: `编辑传统纹样\n透明度: ${state.patternOpacity}%, 缩放: ${state.patternScale}%, 旋转: ${state.patternRotation}°`,
          category: 'culture' as const,
          content: {
            type: 'pattern',
            patternId: state.selectedPatternId,
            patternName: currentPattern.name,
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
            editedAt: new Date().toISOString(),
          },
          tags: ['纹样', '传统文化', currentPattern.name || '纹样'],
          culturalElements: [{
            name: currentPattern.name || '传统纹样',
            description: currentPattern.description || '',
            significance: '中国传统装饰纹样',
          }],
        };

        await inspirationMindMapService.addNode(mindMap.id, nodeData);
        console.log('[InspirationMindMap] Added pattern edit node to mind map:', mindMap.id);
      } catch (err) {
        console.error('[InspirationMindMap] Failed to sync pattern edit to mind map:', err);
        // 不影响主流程，仅记录错误
      }
    })();

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

      // 同步到灵感脉络
      (async () => {
        try {
          const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
          if (!user) {
            console.log('[InspirationMindMap] User not logged in, skipping draft sync');
            return;
          }

          // 获取或创建用户的默认灵感脉络
          let mindMaps = await inspirationMindMapService.getUserMindMaps(user.id);
          let mindMap = mindMaps.find(m => m.title === '我的创作脉络') || mindMaps[0];

          if (!mindMap) {
            console.log('[InspirationMindMap] Creating default mind map for user');
            mindMap = await inspirationMindMapService.createMindMap(user.id, '我的创作脉络');
          }

          // 添加草稿节点
          const nodeData = {
            title: newDraft.name,
            description: `保存草稿\n提示词: ${state.prompt ? state.prompt.substring(0, 50) + (state.prompt.length > 50 ? '...' : '') : '无'}`,
            category: 'inspiration' as const,
            content: {
              type: selectedImage.type || 'image',
              thumbnail: selectedImage.thumbnail,
              video: selectedImage.video,
              prompt: state.prompt,
              stylePreset: state.stylePreset,
              draftId: newDraft.id,
              savedAt: new Date().toISOString(),
            },
            tags: ['草稿', state.stylePreset || '创作'],
          };

          await inspirationMindMapService.addNode(mindMap.id, nodeData);
          console.log('[InspirationMindMap] Added draft node to mind map:', mindMap.id);
        } catch (err) {
          console.error('[InspirationMindMap] Failed to sync draft to mind map:', err);
          // 不影响主流程，仅记录错误
        }
      })();

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

      // 同步到灵感脉络
      (async () => {
        try {
          const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
          if (!user) {
            console.log('[InspirationMindMap] User not logged in, skipping share sync');
            return;
          }

          // 获取或创建用户的默认灵感脉络
          let mindMaps = await inspirationMindMapService.getUserMindMaps(user.id);
          let mindMap = mindMaps.find(m => m.title === '我的创作脉络') || mindMaps[0];

          if (!mindMap) {
            console.log('[InspirationMindMap] Creating default mind map for user');
            mindMap = await inspirationMindMapService.createMindMap(user.id, '我的创作脉络');
          }

          // 添加分享节点
          const nodeData = {
            title: '分享作品',
            description: `分享创作作品\n提示词: ${state.prompt ? state.prompt.substring(0, 50) + (state.prompt.length > 50 ? '...' : '') : '无'}`,
            category: 'culture' as const,
            content: {
              type: selectedImage.type || 'image',
              thumbnail: selectedImage.thumbnail,
              video: selectedImage.video,
              prompt: state.prompt,
              stylePreset: state.stylePreset,
              shareUrl: shareUrl,
              sharedAt: new Date().toISOString(),
            },
            tags: ['分享', '传播', state.stylePreset || '创作'],
          };

          await inspirationMindMapService.addNode(mindMap.id, nodeData);
          console.log('[InspirationMindMap] Added share node to mind map:', mindMap.id);
        } catch (err) {
          console.error('[InspirationMindMap] Failed to sync share to mind map:', err);
          // 不影响主流程，仅记录错误
        }
      })();
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
        // 同步发布记录到灵感脉络
        (async () => {
          try {
            const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
            if (!user) {
              console.log('[InspirationMindMap] User not logged in, skipping publish sync');
              return;
            }

            // 获取或创建用户的默认灵感脉络
            let mindMaps = await inspirationMindMapService.getUserMindMaps(user.id);
            let mindMap = mindMaps.find(m => m.title === '我的创作脉络') || mindMaps[0];

            if (!mindMap) {
              console.log('[InspirationMindMap] Creating default mind map for user');
              mindMap = await inspirationMindMapService.createMindMap(user.id, '我的创作脉络');
            }

            // 添加发布节点
            const nodeData = {
              title: data.title || '发布作品',
              description: `发布到津脉广场\n${data.description ? data.description.substring(0, 50) + (data.description.length > 50 ? '...' : '') : ''}`,
              category: 'culture' as const,
              content: {
                type: isVideo ? 'video' : 'image',
                thumbnail: thumbnail,
                video: videoUrl,
                title: data.title,
                description: data.description,
                category: data.category,
                tags: data.tags,
                culturalElements: data.culturalElements,
                publishType: 'explore',
                publishedAt: new Date().toISOString(),
              },
              tags: [...(data.tags || []), '发布', '津脉广场'],
              culturalElements: (data.culturalElements || []).map(name => ({
                name,
                description: '',
                significance: '',
              })),
            };

            await inspirationMindMapService.addNode(mindMap.id, nodeData);
            console.log('[InspirationMindMap] Added publish node to mind map:', mindMap.id);
          } catch (err) {
            console.error('[InspirationMindMap] Failed to sync publish to mind map:', err);
            // 不影响主流程，仅记录错误
          }
        })();

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
        // 同步发布记录到灵感脉络
        (async () => {
          try {
            const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
            if (!user) {
              console.log('[InspirationMindMap] User not logged in, skipping community publish sync');
              return;
            }

            // 获取或创建用户的默认灵感脉络
            let mindMaps = await inspirationMindMapService.getUserMindMaps(user.id);
            let mindMap = mindMaps.find(m => m.title === '我的创作脉络') || mindMaps[0];

            if (!mindMap) {
              console.log('[InspirationMindMap] Creating default mind map for user');
              mindMap = await inspirationMindMapService.createMindMap(user.id, '我的创作脉络');
            }

            // 添加社区发布节点
            const nodeData = {
              title: data.title || '社区发布',
              description: `发布到社区\n${data.description ? data.description.substring(0, 50) + (data.description.length > 50 ? '...' : '') : ''}`,
              category: 'culture' as const,
              content: {
                type: isVideo ? 'video' : 'image',
                thumbnail: thumbnail,
                video: isVideo ? selectedImage.video : undefined,
                title: data.title,
                description: data.description,
                communityId: data.communityId,
                visibility: data.visibility,
                publishType: 'community',
                publishedAt: new Date().toISOString(),
              },
              tags: ['社区发布', '津脉广场'],
            };

            await inspirationMindMapService.addNode(mindMap.id, nodeData);
            console.log('[InspirationMindMap] Added community publish node to mind map:', mindMap.id);
          } catch (err) {
            console.error('[InspirationMindMap] Failed to sync community publish to mind map:', err);
            // 不影响主流程，仅记录错误
          }
        })();

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

      // 模拟提交延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 同步到灵感脉络
      (async () => {
        try {
          const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
          if (!user) {
            console.log('[InspirationMindMap] User not logged in, skipping event submit sync');
            return;
          }

          // 获取或创建用户的默认灵感脉络
          let mindMaps = await inspirationMindMapService.getUserMindMaps(user.id);
          let mindMap = mindMaps.find(m => m.title === '我的创作脉络') || mindMaps[0];

          if (!mindMap) {
            console.log('[InspirationMindMap] Creating default mind map for user');
            mindMap = await inspirationMindMapService.createMindMap(user.id, '我的创作脉络');
          }

          // 添加活动提交节点
          const nodeData = {
            title: workData.title || '活动投稿',
            description: `提交作品到活动\n${workData.description ? workData.description.substring(0, 50) + (workData.description.length > 50 ? '...' : '') : ''}`,
            category: 'culture' as const,
            content: {
              type: 'image',
              thumbnail: workData.imageUrl,
              title: workData.title,
              description: workData.description,
              eventId: eventId,
              submittedAt: new Date().toISOString(),
            },
            tags: ['活动投稿', '参赛', '作品提交'],
          };

          await inspirationMindMapService.addNode(mindMap.id, nodeData);
          console.log('[InspirationMindMap] Added event submit node to mind map:', mindMap.id);
        } catch (err) {
          console.error('[InspirationMindMap] Failed to sync event submit to mind map:', err);
          // 不影响主流程，仅记录错误
        }
      })();

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
  
  // 图片完善相关方法
  setRefinementMode: (mode) => set({ refinementMode: mode }),
  setRefinementPrompt: (prompt) => set({ refinementPrompt: prompt }),
  setExpandRatio: (ratio) => set({ expandRatio: ratio }),
  setInpaintMask: (mask) => set({ inpaintMask: mask }),
  
  // 提示词优化相关方法
  setOptimizedPrompt: (prompt) => set({ optimizedPrompt: prompt }),
  addPromptHistory: (prompt) => set((state) => {
    const newHistory = [prompt, ...state.promptHistory.filter(p => p !== prompt)].slice(0, 20);
    return { promptHistory: newHistory };
  }),
  removePromptFromHistory: (prompt) => set((state) => ({
    promptHistory: state.promptHistory.filter(p => p !== prompt)
  })),
}));
