import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CreateState, ToolType, GeneratedResult, SmartLayoutConfig, LayoutRecommendation } from '../types';
import { traditionalPatterns } from '../data';
import postsApi from '@/services/postService';
import { eventSubmissionService } from '@/services/eventSubmissionService';
import { inspirationMindMapService } from '@/services/inspirationMindMapService';
import { generateLayoutRecommendation } from '../utils/layoutEngine';
import { createDraftService } from '@/services/createDraftService';

// 辅助函数：获取当前用户（先尝试 localStorage，再尝试 session/getUser）
const getCurrentUser = async () => {
  // 首先尝试从 localStorage 获取（应用使用自定义认证存储）
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.id) {
          console.log('[getCurrentUser] Got user from localStorage:', user.id);
          return user;
        }
      } catch (e) {
        console.log('[getCurrentUser] Failed to parse user from localStorage');
      }
    }
  }

  const supabaseModule = await import('@/lib/supabase');
  const supabase = supabaseModule.supabase;
  
  // 尝试获取 session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (session?.user) {
    console.log('[getCurrentUser] Got user from session:', session.user.id);
    return session.user;
  }
  
  // 如果没有 session，再尝试 getUser
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (user) {
    console.log('[getCurrentUser] Got user from getUser:', user.id);
    return user;
  }
  
  console.log('[getCurrentUser] No user found:', { sessionError: sessionError?.message, userError: userError?.message });
  return null;
};

interface CreateActions {
  setActiveTool: (tool: ToolType) => void;
  setPrompt: (prompt: string) => void;
  setGeneratedResults: (results: GeneratedResult[]) => void;
  addGeneratedResult: (result: GeneratedResult) => void;
  setSelectedResult: (id: number | null) => void;
  deleteGeneratedResult: (id: number) => void;
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
  }, participationId?: string) => Promise<{ success: boolean; message: string }>;
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
  setCurrentImage: (image: string | null) => void;
  // 提示词优化相关
  setOptimizedPrompt: (prompt: string) => void;
  // 引用相关
  setPendingMention: (mention: { type: 'work' | 'brand' | 'style'; name: string; id?: string } | null) => void;
  clearPendingMention: () => void;
  addPromptHistory: (prompt: string) => void;
  removePromptFromHistory: (prompt: string) => void;
  
  // 智能排版相关
  setSmartLayoutConfig: (config: Partial<SmartLayoutConfig>) => void;
  analyzeLayout: () => Promise<LayoutRecommendation | null>;
  applyLayout: () => void;
  resetLayout: () => void;
  
  // 图片编辑相关
  startImageEditing: (imageId: number, mode: 'inline' | 'modal') => void;
  stopImageEditing: () => void;
  updateEditedImage: (imageId: number, editedDataUrl: string) => Promise<string>;
  updateGeneratedResultThumbnail: (imageId: number, newThumbnail: string) => void;
}

// 注意：之前用于从 localStorage 读取保存状态的函数已被移除
// 现在使用 zustand persist 中间件自动处理状态持久化

// 获取保存的生成结果，如果没有则使用空数组（zustand persist 会恢复持久化数据）
const getInitialState = (): CreateState => {
  // 注意：zustand persist 会在初始化后自动恢复持久化的状态
  // 这里返回的是初始默认值，用户之前的创作数据会通过 persist 中间件自动恢复
  console.log('[CreateStore] Initializing state with defaults');
  
  return {
    activeTool: 'sketch',
    prompt: '',
    generatedResults: [],
    selectedResult: null,
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
  generateCount: 1,
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
  currentImage: null,
    // 提示词优化相关状态
    optimizedPrompt: '',
    promptHistory: [],
    isOptimizingPrompt: false,
    
    // 智能排版相关状态
    smartLayoutConfig: {
      scenario: 'product',
      platform: 'xiaohongshu',
      template: 'center',
      textStyle: 'minimal',
      customText: '',
      aspectRatio: '3:4',
      canvasSize: { width: 1242, height: 1660 }
    },
    isAnalyzingLayout: false,
    layoutRecommendation: null,
    pendingMention: null,
    
    // 图片编辑相关状态
    isEditingImage: false,
    editingImageId: null,
    editingMode: null,
  };
};

export const useCreateStore = create<CreateState & CreateActions>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      setActiveTool: (tool) => {
        // 注意：zustand persist 会自动持久化 activeTool，不需要手动保存到 localStorage
        set({ activeTool: tool });
      },
  setAutoGenerate: (value) => set({ autoGenerate: value }),
  setPrompt: (prompt) => {
    // 注意：zustand persist 会自动持久化 prompt，不需要手动保存到 localStorage
    set({ prompt });
  },
  setGeneratedResults: (results) => set((state) => {
    try {
      // 只处理有效的生成结果（有缩略图且不是空数组）
      if (!results || results.length === 0) {
        console.log('[History] No results to save, skipping history update');
        // 注意：zustand persist 会自动处理状态持久化，不需要手动清除 localStorage
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
        console.log('[History] Creating history item:', historyItem.id, 'type:', historyItem.type, 'prompt:', historyItem.prompt?.substring(0, 50));
        return historyItem;
      });

      // 合并历史记录，新的在前面，限制50条
      const updatedHistory = [...newHistoryItems, ...existingHistory].slice(0, 50);
      localStorage.setItem('CREATE_HISTORY', JSON.stringify(updatedHistory));
      console.log('[History] Saved', newHistoryItems.length, 'items. Total history:', updatedHistory.length);

      // 注意：zustand persist 会自动持久化 generatedResults，不需要手动保存到 localStorage
      console.log('[CreateStore] Results will be persisted by zustand:', validResults.length, 'items');

      // 同步到津脉脉络
      (async () => {
        console.log('[InspirationMindMap] Starting sync to mind map...');
        try {
          const user = await getCurrentUser();
          
          if (!user) {
            console.log('[InspirationMindMap] User not logged in, skipping sync');
            return;
          }

          console.log('[InspirationMindMap] User logged in:', user.id);

          // 获取或创建用户的默认津脉脉络
          console.log('[InspirationMindMap] Fetching user mind maps...');
          let mindMaps;
          try {
            mindMaps = await inspirationMindMapService.getUserMindMaps(user.id);
            console.log('[InspirationMindMap] Found mind maps:', mindMaps?.length || 0);
          } catch (e) {
            console.error('[InspirationMindMap] Error fetching mind maps:', e);
            return;
          }
          
          let mindMap = mindMaps.find(m => m.title === '我的创作脉络') || mindMaps[0];

          if (!mindMap) {
            console.log('[InspirationMindMap] Creating default mind map for user');
            try {
              mindMap = await inspirationMindMapService.createMindMap(user.id, '我的创作脉络');
              console.log('[InspirationMindMap] Created mind map:', mindMap?.id);
            } catch (e) {
              console.error('[InspirationMindMap] Error creating mind map:', e);
              return;
            }
          } else {
            console.log('[InspirationMindMap] Using existing mind map:', mindMap.id);
          }

          // 为每个生成的作品添加节点
          console.log('[InspirationMindMap] Adding', newHistoryItems.length, 'nodes...');
          
          // 获取脉络中现有的最后一个节点作为父节点
          let lastParentId: string | undefined;
          try {
            const fullMindMap = await inspirationMindMapService.getMindMap(mindMap.id);
            if (fullMindMap.nodes && fullMindMap.nodes.length > 0) {
              // 找到最后一个节点（按创建时间排序）
              const sortedNodes = [...fullMindMap.nodes].sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              lastParentId = sortedNodes[0].id;
              console.log('[InspirationMindMap] Using last node as parent:', lastParentId);
            }
          } catch (e) {
            console.log('[InspirationMindMap] No existing nodes, will create root node');
          }
          
          for (let i = 0; i < newHistoryItems.length; i++) {
            const item = newHistoryItems[i];
            console.log('[InspirationMindMap] Processing item:', item.id, 'prompt:', item.prompt?.substring(0, 50));
            
            // 确保 prompt 不为空，尝试从 localStorage 获取
            let prompt = item.prompt;
            if (!prompt && typeof localStorage !== 'undefined') {
              prompt = localStorage.getItem('CREATE_PROMPT') || '';
              console.log('[InspirationMindMap] Using prompt from localStorage:', prompt?.substring(0, 50));
            }
            
            const nodeData = {
              title: prompt ? prompt.substring(0, 30) + (prompt.length > 30 ? '...' : '') : '创作作品',
              description: `${prompt || '无描述'}\n\n创作时间: ${new Date(item.timestamp).toLocaleString('zh-CN')}`,
              category: 'ai_generate' as const,
              content: {
                type: item.type,
                thumbnail: item.thumbnail,
                video: item.video,
                prompt: prompt,
                stylePreset: item.stylePreset,
              },
              tags: item.stylePreset ? [item.stylePreset] : ['创作'],
            };
            
            console.log('[InspirationMindMap] Node data description:', nodeData.description?.substring(0, 100));

            try {
              // 第一个节点如果没有父节点则作为根节点，否则使用最后一个节点作为父节点
              const parentId = i === 0 ? lastParentId : undefined;
              const newNode = await inspirationMindMapService.addNode(mindMap.id, nodeData, parentId);
              console.log('[InspirationMindMap] Added node for creation:', item.id, 'nodeId:', newNode?.id, 'parentId:', parentId);
              // 更新 lastParentId 为当前新节点，以便下一个节点使用
              lastParentId = newNode.id;
            } catch (e) {
              console.error('[InspirationMindMap] Error adding node:', e);
            }
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

    // 注意：zustand persist 会自动持久化 generatedResults，不需要手动保存到 localStorage

    // 异步批量保存到数据库（不阻塞UI）
    if (typeof window !== 'undefined' && results && results.length > 0) {
      setTimeout(async () => {
        try {
          const { aiGenerationSaveService } = await import('@/services/aiGenerationSaveService');
          for (const result of results) {
            // 检查是否已经有 thumbnail 且不是默认数据
            if (result.thumbnail && !result.thumbnail.includes('placeholder')) {
              if (result.type === 'video' || result.video) {
                await aiGenerationSaveService.saveVideoGeneration(
                  result.prompt || 'AI生成视频',
                  result.video || result.thumbnail,
                  result.thumbnail,
                  { source: 'create-store-batch', uploadToStorage: false }
                );
              } else {
                await aiGenerationSaveService.saveImageGeneration(
                  result.prompt || 'AI生成图片',
                  result.thumbnail,
                  { source: 'create-store-batch', uploadToStorage: false }
                );
              }
            }
          }
          console.log('[setGeneratedResults] Saved batch to database:', results.length, 'items');
        } catch (error) {
          console.error('[setGeneratedResults] Failed to save batch to database:', error);
        }
      }, 0);
    }

    // 自动保存到草稿箱
    if (typeof window !== 'undefined' && results && results.length > 0) {
      setTimeout(async () => {
        try {
          const drafts = JSON.parse(localStorage.getItem('CREATE_DRAFTS') || '[]');
          const newDraft = {
            id: `draft-${Date.now()}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            name: `AI作品 ${drafts.length + 1}`,
            description: '自动保存的AI生成作品',
            prompt: state.prompt || '',
            selectedResult: results[0]?.id || null,
            generatedResults: results,
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
          console.log('[setGeneratedResults] Auto-saved to drafts:', newDraft.id);

          // 异步保存到数据库
          await createDraftService.saveDraft(newDraft);
          console.log('[setGeneratedResults] Auto-saved to database drafts');
        } catch (error) {
          console.error('[setGeneratedResults] Failed to auto-save to drafts:', error);
        }
      }, 0);
    }

    return { generatedResults: results };
  }),
  addGeneratedResult: (result) => set((state) => {
    const newResults = [result, ...state.generatedResults];
    // 注意：zustand persist 会自动持久化状态，不需要手动保存到 localStorage

    // 异步保存到数据库（不阻塞UI）
    if (typeof window !== 'undefined') {
      setTimeout(async () => {
        try {
          const { aiGenerationSaveService } = await import('@/services/aiGenerationSaveService');
          if (result.type === 'video' || result.video) {
            await aiGenerationSaveService.saveVideoGeneration(
              result.prompt || 'AI生成视频',
              result.video || result.thumbnail,
              result.thumbnail,
              { source: 'create-store', uploadToStorage: false }
            );
          } else {
            await aiGenerationSaveService.saveImageGeneration(
              result.prompt || 'AI生成图片',
              result.thumbnail,
              { source: 'create-store', uploadToStorage: false }
            );
          }
          console.log('[addGeneratedResult] Saved to database:', result.id);
        } catch (error) {
          console.error('[addGeneratedResult] Failed to save to database:', error);
        }
      }, 0);
    }

    // 自动保存到草稿箱
    if (typeof window !== 'undefined') {
      setTimeout(async () => {
        try {
          const drafts = JSON.parse(localStorage.getItem('CREATE_DRAFTS') || '[]');
          const newDraft = {
            id: `draft-${Date.now()}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            name: `AI作品 ${drafts.length + 1}`,
            description: '自动保存的AI生成作品',
            prompt: result.prompt || state.prompt || '',
            selectedResult: result.id,
            generatedResults: [result],
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
          const updatedDrafts = [newDraft, ...drafts];
          localStorage.setItem('CREATE_DRAFTS', JSON.stringify(updatedDrafts));
          console.log('[addGeneratedResult] Auto-saved to drafts:', newDraft.id);

          // 异步保存到数据库
          await createDraftService.saveDraft(newDraft);
          console.log('[addGeneratedResult] Auto-saved to database drafts');
        } catch (error) {
          console.error('[addGeneratedResult] Failed to auto-save to drafts:', error);
        }
      }, 0);
    }

    return {
      generatedResults: newResults,
      selectedResult: result.id
    };
  }),
  setSelectedResult: (id) => set({ selectedResult: id }),
  deleteGeneratedResult: (id) => set((state) => {
    const newResults = state.generatedResults.filter(r => r.id !== id);
    // 注意：zustand persist 会自动持久化状态，不需要手动更新 localStorage
    // 如果删除的是当前选中的，则选中第一个或设为null
    const newSelectedResult = state.selectedResult === id 
      ? (newResults.length > 0 ? newResults[0].id : null)
      : state.selectedResult;
    return { 
      generatedResults: newResults,
      selectedResult: newSelectedResult
    };
  }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setShowCulturalInfo: (show) => set({ showCulturalInfo: show }),
  setCurrentStep: (step) => {
    // 注意：zustand persist 会自动持久化 currentStep，不需要手动保存到 localStorage
    set({ currentStep: step });
  },
  setIsLoading: (isLoading) => set({ isLoading }),
  setFusionMode: (mode) => set({ fusionMode: mode }),
  
  toggleFavorite: (id, thumbnail) => set((state) => {
    const exists = state.favorites.some(f => f.id === id);
    if (exists) {
      return { favorites: state.favorites.filter(f => f.id !== id) };
    }
    return { favorites: [...state.favorites, { id, thumbnail }] };
  }),

  resetState: () => {
    // 重置为初始状态
    // 注意：zustand persist 会自动处理状态持久化
    set(getInitialState());
  },
  
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

    // 同步到津脉脉络
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          console.log('[InspirationMindMap] User not logged in, skipping pattern history sync');
          return;
        }

        // 获取或创建用户的默认津脉脉络
        const mindMaps = await inspirationMindMapService.getUserMindMaps(user.id);
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
      const updatedDrafts = [newDraft, ...drafts];
      localStorage.setItem('CREATE_DRAFTS', JSON.stringify(updatedDrafts));
      console.log('Design saved to drafts');

      // 异步保存到数据库
      (async () => {
        try {
          await createDraftService.saveDraft(newDraft);
          console.log('[CreateDraft] Saved to database');
        } catch (error) {
          console.error('[CreateDraft] Failed to save to database:', error);
        }
      })();

      // 同步到津脉脉络
      (async () => {
        try {
          const user = await getCurrentUser();
          if (!user) {
            console.log('[InspirationMindMap] User not logged in, skipping draft sync');
            return;
          }

          // 获取或创建用户的默认津脉脉络
          const mindMaps = await inspirationMindMapService.getUserMindMaps(user.id);
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

      // 同步到津脉脉络
      (async () => {
        try {
          const user = await getCurrentUser();
          if (!user) {
            console.log('[InspirationMindMap] User not logged in, skipping share sync');
            return;
          }

          // 获取或创建用户的默认津脉脉络
          const mindMaps = await inspirationMindMapService.getUserMindMaps(user.id);
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
        // 同步发布记录到津脉脉络
        (async () => {
          try {
            const user = await getCurrentUser();
            if (!user) {
              console.log('[InspirationMindMap] User not logged in, skipping publish sync');
              return;
            }

            // 获取或创建用户的默认津脉脉络
            const mindMaps = await inspirationMindMapService.getUserMindMaps(user.id);
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
        // 同步发布记录到津脉脉络
        (async () => {
          try {
            const user = await getCurrentUser();
            if (!user) {
              console.log('[InspirationMindMap] User not logged in, skipping community publish sync');
              return;
            }

            // 获取或创建用户的默认津脉脉络
            const mindMaps = await inspirationMindMapService.getUserMindMaps(user.id);
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
  
  submitToEvent: async (eventId, workData, participationId?: string) => {
    try {
      console.log('Submitting to event:', eventId, workData, participationId);

      const user = await getCurrentUser();
      if (!user) {
        return {
          success: false,
          message: '用户未登录'
        };
      }

      // 如果没有提供 participationId，尝试从当前状态获取
      let targetParticipationId = participationId;
      if (!targetParticipationId) {
        // 尝试从 URL 参数获取
        const urlParams = new URLSearchParams(window.location.search);
        targetParticipationId = urlParams.get('participationId') || '';
      }

      if (!targetParticipationId) {
        return {
          success: false,
          message: '未找到参与记录，请先报名活动'
        };
      }

      // 调用 eventSubmissionService 提交作品
      const result = await eventSubmissionService.submitWork(
        eventId,
        user.id,
        targetParticipationId,
        {
          title: workData.title,
          description: workData.description,
          files: [{
            id: `${Date.now()}_image`,
            name: 'work_image.jpg',
            url: workData.imageUrl,
            type: 'image/jpeg',
            size: 0,
            thumbnailUrl: workData.imageUrl
          }],
          metadata: {}
        }
      );

      if (!result.success) {
        return {
          success: false,
          message: result.error || '提交失败'
        };
      }

      // 同步到津脉脉络
      (async () => {
        try {
          // 获取或创建用户的默认津脉脉络
          const mindMaps = await inspirationMindMapService.getUserMindMaps(user.id);
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
  setCurrentImage: (image) => set({ currentImage: image }),
  
  // 提示词优化相关方法
  setOptimizedPrompt: (prompt) => set({ optimizedPrompt: prompt }),
  addPromptHistory: (prompt) => set((state) => {
    const newHistory = [prompt, ...state.promptHistory.filter(p => p !== prompt)].slice(0, 20);
    return { promptHistory: newHistory };
  }),
  removePromptFromHistory: (prompt) => set((state) => ({
    promptHistory: state.promptHistory.filter(p => p !== prompt)
  })),
  
  // 智能排版相关方法
  setSmartLayoutConfig: (config: Partial<SmartLayoutConfig>) => set((state) => ({
    smartLayoutConfig: { ...state.smartLayoutConfig, ...config }
  })),
  
  analyzeLayout: async () => {
    set({ isAnalyzingLayout: true });
    
    try {
      const state = useCreateStore.getState();
      const recommendation = await generateLayoutRecommendation(
        state.smartLayoutConfig,
        state.generatedResults,
        state.selectedResult
      );
      
      set({ 
        layoutRecommendation: recommendation,
        isAnalyzingLayout: false 
      });
      
      return recommendation;
    } catch (error) {
      console.error('Layout analysis failed:', error);
      set({ isAnalyzingLayout: false });
      return null;
    }
  },
  
  applyLayout: () => set((state) => {
    if (!state.layoutRecommendation) return state;
    
    // 应用排版配置到状态
    return {
      ...state,
      smartLayoutConfig: {
        ...state.smartLayoutConfig,
        scenario: state.layoutRecommendation.scenario,
        platform: state.layoutRecommendation.platform,
        template: state.layoutRecommendation.template,
        textStyle: state.layoutRecommendation.textStyleId,
        aspectRatio: state.layoutRecommendation.aspectRatio,
        canvasSize: state.layoutRecommendation.canvasSize,
      }
    };
  }),
  
  resetLayout: () => set({
    layoutRecommendation: null,
    smartLayoutConfig: {
      scenario: 'product',
      platform: 'xiaohongshu',
      template: 'center',
      textStyle: 'minimal',
      customText: '',
      aspectRatio: '3:4',
      canvasSize: { width: 1242, height: 1660 }
    }
  }),
  
  // 引用相关方法
  setPendingMention: (mention) => set({ pendingMention: mention }),
  clearPendingMention: () => set({ pendingMention: null }),
  
  // 图片编辑相关方法
  startImageEditing: (imageId, mode) => set({ 
    isEditingImage: true, 
    editingImageId: imageId, 
    editingMode: mode 
  }),
  stopImageEditing: () => set({ 
    isEditingImage: false, 
    editingImageId: null, 
    editingMode: null 
  }),
  updateEditedImage: async (imageId, editedDataUrl) => {
    try {
      // 将 base64 转换为 Blob，使用 atob 避免 fetch CSP 问题
      const base64Data = editedDataUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      const file = new File([blob], `edited-image-${Date.now()}.png`, { type: 'image/png' });
      
      // 调用图片上传服务
      const { uploadImage } = await import('@/services/imageService');
      const uploadedUrl = await uploadImage(file);
      
      // 更新 generatedResults 中对应图片的缩略图，添加时间戳避免缓存
      set((state) => {
        const updatedResults = state.generatedResults.map(r => {
          if (r.id === imageId) {
            // 添加时间戳参数避免浏览器缓存
            const urlWithTimestamp = uploadedUrl.includes('?') 
              ? `${uploadedUrl}&_t=${Date.now()}` 
              : `${uploadedUrl}?_t=${Date.now()}`;
            return { ...r, thumbnail: urlWithTimestamp };
          }
          return r;
        });
        return { generatedResults: updatedResults };
      });
      
      return uploadedUrl;
    } catch (error) {
      console.error('Failed to update edited image:', error);
      throw error;
    }
  },
  updateGeneratedResultThumbnail: (imageId, newThumbnail) => set((state) => {
    const updatedResults = state.generatedResults.map(r => 
      r.id === imageId ? { ...r, thumbnail: newThumbnail } : r
    );
    return { generatedResults: updatedResults };
  }),
}),
    {
      name: 'create-store',
      partialize: (state) => ({
        promptHistory: state.promptHistory,
        // 持久化生成结果，确保页面刷新后作品不会丢失
        generatedResults: state.generatedResults,
        selectedResult: state.selectedResult,
        prompt: state.prompt,
        currentStep: state.currentStep,
        activeTool: state.activeTool,
        stylePreset: state.stylePreset,
        // 持久化纹样相关状态
        selectedPatternId: state.selectedPatternId,
        patternOpacity: state.patternOpacity,
        patternScale: state.patternScale,
        patternRotation: state.patternRotation,
        patternBlendMode: state.patternBlendMode,
        patternTileMode: state.patternTileMode,
        patternPositionX: state.patternPositionX,
        patternPositionY: state.patternPositionY,
      }),
    }
  )
);
