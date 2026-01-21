import { create } from 'zustand';
import { CreateState, ToolType, GeneratedResult } from '../types';
import { aiGeneratedResults, traditionalPatterns } from '../data';

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
  // Add other setters as needed...
  updateState: (updates: Partial<CreateState>) => void;
  savePatternHistory: () => void;
  restorePatternHistory: (historyItemId: string) => void;
  clearPatternHistory: () => void;
  // New functions for action buttons
  saveToDrafts: () => void;
  shareDesign: () => void;
  applyToOtherTool: (tool: ToolType) => void;
}

const initialState: CreateState = {
  activeTool: 'sketch',
  prompt: '',
  generatedResults: aiGeneratedResults,
  selectedResult: null,
  isGenerating: false,
  showCulturalInfo: false,
  currentStep: 1,
  isLoading: true,
  showCollaborationPanel: false,
  showAIReview: false,
  showModelSelector: false,
  showInspirationPanel: false,
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
  
  // Pattern Tool State
  patternOpacity: 50,
  patternScale: 100,
  patternRotation: 0,
  patternBlendMode: 'multiply',
  patternTileMode: 'repeat',
  patternPositionX: 0,
  patternPositionY: 0,
};

export const useCreateStore = create<CreateState & CreateActions>((set, get) => ({
  ...initialState,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setPrompt: (prompt) => set({ prompt }),
  setGeneratedResults: (results) => set({ generatedResults: results }),
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
  
  // 保存纹样历史记录
  savePatternHistory: () => set((state) => {
    if (!state.selectedPatternId) return state;
    
    // 获取当前纹样信息
    const currentPattern = traditionalPatterns.find(pattern => pattern.id === state.selectedPatternId);
    if (!currentPattern) return state;
    
    // 创建历史记录项
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
    
    // 添加到历史记录（最多保存10条）
    const updatedHistory = [historyItem, ...state.patternHistory].slice(0, 10);
    
    return { ...state, patternHistory: updatedHistory };
  }),
  
  // 恢复纹样历史记录
  restorePatternHistory: (historyItemId) => set((state) => {
    const historyItem = state.patternHistory.find(item => item.id === historyItemId);
    if (!historyItem) return state;
    
    // 恢复纹样属性
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
  
  // 清除纹样历史记录
  clearPatternHistory: () => set((state) => ({
    ...state,
    patternHistory: [],
  })),
  
  // 保存到草稿
  saveToDrafts: () => set((state) => {
    if (!state.selectedResult) return state;
    
    const selectedImage = state.generatedResults.find(r => r.id === state.selectedResult);
    if (!selectedImage) return state;
    
    try {
      const drafts = JSON.parse(localStorage.getItem('CREATE_DRAFTS') || '[]');
      const newDraft = {
        id: `draft-${Date.now()}`,
        createdAt: Date.now(),
        prompt: state.prompt,
        selectedResult: state.selectedResult,
        generatedResults: state.generatedResults,
        activeTool: state.activeTool,
        stylePreset: state.stylePreset,
      };
      const updatedDrafts = [newDraft, ...drafts].slice(0, 10); // 保存最近10个草稿
      localStorage.setItem('CREATE_DRAFTS', JSON.stringify(updatedDrafts));
      console.log('Design saved to drafts');
    } catch (error) {
      console.error('Failed to save to drafts:', error);
    }
    
    return state;
  }),
  
  // 分享设计
  shareDesign: () => set((state) => {
    if (!state.selectedResult) return state;
    
    const selectedImage = state.generatedResults.find(r => r.id === state.selectedResult);
    if (!selectedImage) return state;
    
    // 这里可以实现分享功能，比如生成分享链接或打开分享面板
    console.log('Share design:', selectedImage.thumbnail);
    return state;
  }),
  
  // 应用到其他工具
  applyToOtherTool: (tool: ToolType) => set((state) => {
    if (!state.selectedResult) return state;
    
    // 切换到指定工具
    return {
      ...state,
      activeTool: tool,
      // 可以根据需要添加其他状态更新
    };
  })
}));
