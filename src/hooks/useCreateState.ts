import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

// 创作工具类型
type ToolType = 'sketch' | 'pattern' | 'filter' | 'trace' | 'remix' | 'layout' | 'mockup' | 'tile';

// 创作状态接口
interface CreateState {
  activeTool: ToolType;
  prompt: string;
  generatedResults: Array<{ id: number; thumbnail: string; score: number }>;
  selectedResult: number | null;
  isGenerating: boolean;
  showCulturalInfo: boolean;
  currentStep: number;
  isLoading: boolean;
  showAIReview: boolean;
  showModelSelector: boolean;
  isPrecheckEnabled: boolean;
  precheckResult: {
    status: 'pending' | 'passed' | 'warning' | 'failed';
    issues: { type: string; severity: 'warning' | 'error'; message: string }[];
  } | null;
  aiExplanation: string;
  explainCollapsed: boolean;
  fusionMode: boolean;
  isRegenerating: boolean;
  isEngineGenerating: boolean;
  isPolishing: boolean;
  stylePreset: string;
  generateCount: number;
  favorites: Array<{ id: number; thumbnail: string }>;
  videoGenerating: boolean;
  culturalInfoText: string;
  promptB: string;
  isFusing: boolean;
  lastUpdatedAt: number | null;
  selectedPatternId: number | null;
  filterName: string;
  streamStatus: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  abortController: AbortController | null;
  filterIntensity: number;
  autoGenerate: boolean;
  showQuickActions: boolean;
  showEngineDetails: boolean;
  recentPatterns: number[];
  recentFilters: Array<{ name: string; intensity: number }>;
  generatingPlan: boolean;
  genError: string;
  curationTemplate: string;
  customTemplates: Record<string, string>;
  showTemplateEditor: boolean;
  newTemplateName: string;
  newTemplateGuide: string;
  savedPlans: Array<{ id: string; title: string; query: string; aiText: string; ts: number }>;
}

// 初始状态
const initialState: CreateState = {
  activeTool: 'sketch',
  prompt: '',
  generatedResults: [],
  selectedResult: null,
  isGenerating: false,
  showCulturalInfo: false,
  currentStep: 1,
  isLoading: true,
  showAIReview: false,
  showModelSelector: false,
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
  filterIntensity: 5,
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
};

export const useCreateState = () => {
  const [state, setState] = useState<CreateState>(initialState);

  // 更新状态的方法
  const updateState = useCallback((updates: Partial<CreateState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 重置状态
  const resetState = useCallback((preservePrompt = false) => {
    setState(prev => ({
      ...initialState,
      prompt: preservePrompt ? prev.prompt : '',
      savedPlans: prev.savedPlans,
      customTemplates: prev.customTemplates,
    }));
  }, []);

  // 工具选择
  const selectTool = useCallback((tool: ToolType) => {
    updateState({ activeTool: tool });
  }, [updateState]);

  // 设置提示词
  const setPrompt = useCallback((prompt: string) => {
    updateState({ prompt });
  }, [updateState]);

  // 生成状态管理
  const startGenerating = useCallback(() => {
    updateState({ 
      isGenerating: true, 
      streamStatus: 'running',
      aiExplanation: '',
      abortController: new AbortController()
    });
  }, [updateState]);

  const completeGenerating = useCallback(() => {
    updateState({ 
      isGenerating: false, 
      streamStatus: 'completed',
      currentStep: 2,
      abortController: null
    });
    toast.success('AI创作完成！请选择一个方案进行编辑');
  }, [updateState]);

  const cancelGenerating = useCallback(() => {
    if (state.abortController) {
      state.abortController.abort();
    }
    updateState({ 
      isGenerating: false, 
      streamStatus: 'idle',
      abortController: null
    });
    toast.info('AI生成已取消');
  }, [state.abortController, updateState]);

  // 选择结果
  const selectResult = useCallback((id: number) => {
    updateState({ 
      selectedResult: id, 
      currentStep: 3 
    });
  }, [updateState]);

  // 收藏管理
  const toggleFavorite = useCallback((id: number) => {
    const item = state.generatedResults.find(r => r.id === id);
    if (!item) return;

    const exists = state.favorites.some(f => f.id === id);
    const newFavorites = exists 
      ? state.favorites.filter(f => f.id !== id)
      : [...state.favorites, { id, thumbnail: item.thumbnail }];

    updateState({ favorites: newFavorites });
  }, [state.generatedResults, state.favorites, updateState]);

  // 保存草稿
  const saveDraft = useCallback(() => {
    try {
      const draft = {
        prompt: state.prompt,
        selectedResult: state.selectedResult,
        currentStep: state.currentStep,
        aiExplanation: state.aiExplanation,
        updatedAt: Date.now(),
      };
      localStorage.setItem('CREATE_DRAFT', JSON.stringify(draft));
      updateState({ lastUpdatedAt: Date.now() });
      toast.success('已保存到草稿');
    } catch {
      toast.error('保存失败');
    }
  }, [state.prompt, state.selectedResult, state.currentStep, state.aiExplanation, updateState]);

  // 使用 useMemo 优化计算密集型状态
  const selectedResultData = useMemo(() => {
    return state.generatedResults.find(r => r.id === state.selectedResult) || null;
  }, [state.generatedResults, state.selectedResult]);

  const isFavorite = useMemo(() => {
    return state.favorites.some(f => f.id === state.selectedResult);
  }, [state.favorites, state.selectedResult]);

  return {
    // 状态
    ...state,
    selectedResultData,
    isFavorite,
    
    // 操作方法
    updateState,
    resetState,
    selectTool,
    setPrompt,
    startGenerating,
    completeGenerating,
    cancelGenerating,
    selectResult,
    toggleFavorite,
    saveDraft,
  };
};
