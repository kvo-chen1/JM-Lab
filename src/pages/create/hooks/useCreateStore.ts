import { create } from 'zustand';
import { CreateState, ToolType, GeneratedResult } from '../types';
import { aiGeneratedResults, traditionalPatterns } from '../data';
import { workService } from '@/services/apiService';

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
  loadDraft: (draft: any) => void;
  shareDesign: () => void;
  applyToOtherTool: (tool?: ToolType) => void;
  // Publishing functions
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
  getModerationStatus: (workId: number) => Promise<{
    status: 'pending' | 'approved' | 'rejected' | 'scheduled';
    reviewedAt: string | null;
    rejectionReason: string | null;
    moderator: any | null;
  }>;
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
  showPropertiesPanel: true, // 控制属性面板显示
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
  
  // 加载草稿
  loadDraft: (draft: any) => set((state) => {
    try {
      // 恢复基础状态
      const newState: Partial<CreateState> = {
        prompt: draft.prompt || '',
        selectedResult: draft.selectedResult || null,
        generatedResults: draft.generatedResults || [],
        activeTool: draft.activeTool || 'sketch',
        stylePreset: draft.stylePreset || '',
        currentStep: draft.currentStep || 1,
        aiExplanation: draft.aiExplanation || '',
        // 如果草稿中有其他状态字段，也可以在这里恢复
        patternOpacity: draft.patternOpacity ?? state.patternOpacity,
        patternScale: draft.patternScale ?? state.patternScale,
        patternRotation: draft.patternRotation ?? state.patternRotation,
        patternBlendMode: draft.patternBlendMode ?? state.patternBlendMode,
        patternTileMode: draft.patternTileMode ?? state.patternTileMode,
        patternPositionX: draft.patternPositionX ?? state.patternPositionX,
        patternPositionY: draft.patternPositionY ?? state.patternPositionY,
        selectedPatternId: draft.selectedPatternId ?? state.selectedPatternId,
      };

      // 提示加载成功
      if (typeof window !== 'undefined') {
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 ease-in-out';
        toast.textContent = '草稿加载成功！';
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 2000);
      }
      
      return { ...state, ...newState };
    } catch (error) {
      console.error('Failed to load draft:', error);
      return state;
    }
  }),

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
        // 保存纹样工具状态
        selectedPatternId: state.selectedPatternId,
        patternOpacity: state.patternOpacity,
        patternScale: state.patternScale,
        patternRotation: state.patternRotation,
        patternBlendMode: state.patternBlendMode,
        patternTileMode: state.patternTileMode,
        patternPositionX: state.patternPositionX,
        patternPositionY: state.patternPositionY,
      };
      const updatedDrafts = [newDraft, ...drafts].slice(0, 10); // 保存最近10个草稿
      localStorage.setItem('CREATE_DRAFTS', JSON.stringify(updatedDrafts));
      console.log('Design saved to drafts');
      
      // 添加保存成功提示
      if (typeof window !== 'undefined') {
        // 简单的提示实现，后续可以替换为更复杂的toast组件
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
      
      // 添加保存失败提示
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
  
  // 分享设计
  shareDesign: () => set((state) => {
    if (!state.selectedResult) return state;
    
    const selectedImage = state.generatedResults.find(r => r.id === state.selectedResult);
    if (!selectedImage) return state;
    
    try {
      // 生成分享链接
      const shareUrl = `${window.location.origin}/share/${state.selectedResult}?prompt=${encodeURIComponent(state.prompt)}`;
      
      // 显示分享面板
      if (typeof window !== 'undefined') {
        // 创建分享面板
        const sharePanel = document.createElement('div');
        sharePanel.className = 'fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4';
        
        sharePanel.innerHTML = `
          <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 class="text-xl font-bold mb-4 dark:text-white">分享与发布</h3>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分享链接</label>
              <div class="flex items-center gap-2">
                <input type="text" value="${shareUrl}" readonly class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button id="copyShareLink" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">复制</button>
              </div>
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分享到</label>
              <div class="grid grid-cols-3 gap-3">
                <button class="flex flex-col items-center justify-center p-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <i class="fab fa-weixin text-lg text-green-500 mb-1"></i>
                  <span class="text-sm text-gray-700 dark:text-gray-300">微信</span>
                </button>
                <button class="flex flex-col items-center justify-center p-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <i class="fab fa-weibo text-lg text-red-500 mb-1"></i>
                  <span class="text-sm text-gray-700 dark:text-gray-300">微博</span>
                </button>
                <button class="flex flex-col items-center justify-center p-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <i class="fas fa-link text-lg text-blue-500 mb-1"></i>
                  <span class="text-sm text-gray-700 dark:text-gray-300">链接</span>
                </button>
              </div>
            </div>
            
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">发布到</label>
              <div class="grid grid-cols-2 gap-3">
                <button id="publishToExplore" class="flex flex-col items-center justify-center p-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <i class="fas fa-globe text-lg text-purple-500 mb-1"></i>
                  <span class="text-sm text-gray-700 dark:text-gray-300">探索作品</span>
                </button>
                <button id="publishToCommunity" class="flex flex-col items-center justify-center p-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <i class="fas fa-users text-lg text-orange-500 mb-1"></i>
                  <span class="text-sm text-gray-700 dark:text-gray-300">社群</span>
                </button>
              </div>
            </div>
            
            <div class="flex justify-end gap-3">
              <button id="closeSharePanel" class="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">取消</button>
              <button class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">分享</button>
            </div>
          </div>
        `;
        
        document.body.appendChild(sharePanel);
        
        // 添加事件监听
        const copyButton = sharePanel.querySelector('#copyShareLink');
        const closeButton = sharePanel.querySelector('#closeSharePanel');
        const publishToExploreButton = sharePanel.querySelector('#publishToExplore');
        const publishToCommunityButton = sharePanel.querySelector('#publishToCommunity');
        
        if (copyButton) {
          copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(shareUrl).then(() => {
              copyButton.textContent = '已复制';
              setTimeout(() => {
                copyButton.textContent = '复制';
              }, 2000);
            });
          });
        }
        
        if (closeButton) {
          closeButton.addEventListener('click', () => {
            document.body.removeChild(sharePanel);
          });
        }
        
        if (publishToExploreButton) {
          publishToExploreButton.addEventListener('click', () => {
            // 关闭当前分享面板
            document.body.removeChild(sharePanel);
            
            // 显示发布到探索作品面板
            const publishPanel = document.createElement('div');
            publishPanel.className = 'fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4';
            
            publishPanel.innerHTML = `
              <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md w-full">
                <h3 class="text-xl font-bold mb-4 dark:text-white">发布到探索作品</h3>
                
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">作品标题</label>
                    <input type="text" placeholder="输入作品标题" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">作品描述</label>
                    <textarea placeholder="输入作品描述" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分类</label>
                    <select class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="design">设计</option>
                      <option value="writing">写作</option>
                      <option value="audio">音频</option>
                      <option value="video">视频</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">标签</label>
                    <input type="text" placeholder="输入标签，用逗号分隔" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">可见性</label>
                    <div class="flex gap-3">
                      <label class="flex items-center gap-1 text-sm">
                        <input type="radio" name="visibility" value="public" checked class="text-blue-500" />
                        <span class="dark:text-gray-300">公开</span>
                      </label>
                      <label class="flex items-center gap-1 text-sm">
                        <input type="radio" name="visibility" value="private" class="text-blue-500" />
                        <span class="dark:text-gray-300">私有</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div class="mt-6 flex justify-end gap-3">
                  <button id="closePublishPanel" class="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">取消</button>
                  <button id="confirmPublish" class="px-4 py-2 bg-[#C02C38] hover:bg-[#E60012] text-white rounded-lg transition-colors">发布</button>
                </div>
              </div>
            `;
            
            document.body.appendChild(publishPanel);
            
            // 添加发布面板事件监听
            const closePublishButton = publishPanel.querySelector('#closePublishPanel');
            const confirmPublishButton = publishPanel.querySelector('#confirmPublish');
            
            if (closePublishButton) {
              closePublishButton.addEventListener('click', () => {
                document.body.removeChild(publishPanel);
              });
            }
            
            if (confirmPublishButton) {
              confirmPublishButton.addEventListener('click', async () => {
                // 这里可以实现发布到探索作品的逻辑
                const titleInput = publishPanel.querySelector('input[placeholder="输入作品标题"]') as HTMLInputElement;
                const descriptionInput = publishPanel.querySelector('textarea[placeholder="输入作品描述"]') as HTMLTextAreaElement;
                const categorySelect = publishPanel.querySelector('select') as HTMLSelectElement;
                const tagsInput = publishPanel.querySelector('input[placeholder="输入标签，用逗号分隔"]') as HTMLInputElement;
                const visibilityInputs = publishPanel.querySelectorAll('input[name="visibility"]') as NodeListOf<HTMLInputElement>;
                const visibility = Array.from(visibilityInputs).find(input => input.checked)?.value || 'public';
                
                const title = titleInput.value;
                const description = descriptionInput.value;
                const category = categorySelect.value;
                const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean);
                
                console.log('Publish to explore:', { title, description, category, tags, visibility });
                
                // --- 模拟发布到探索作品 ---
                try {
                  // 1. 获取当前选中的图片信息
                  const store = useCreateStore.getState();
                  const currentImage = store.generatedResults.find(r => r.id === store.selectedResult);
                  
                  if (currentImage) {
                    // 2. 构建新作品对象
                    const newWork = {
                      id: `work-${Date.now()}`,
                      title: title || '未命名作品',
                      description: description || '这是一个由AI生成的创意设计',
                      imageUrl: currentImage.imageUrl,
                      author: {
                        name: '当前用户',
                        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
                      },
                      likes: 0,
                      views: 0,
                      category: category,
                      tags: tags.length > 0 ? tags : ['AI设计', '创意'],
                      createdAt: new Date().toISOString(),
                      isFeatured: false
                    };
                    
                    // 3. 保存到 localStorage (模拟后端存储)
                    const existingWorks = JSON.parse(localStorage.getItem('EXPLORE_WORKS') || '[]');
                    const updatedWorks = [newWork, ...existingWorks];
                    localStorage.setItem('EXPLORE_WORKS', JSON.stringify(updatedWorks));
                    
                    // 4. 触发自定义事件，通知探索页面刷新
                    window.dispatchEvent(new CustomEvent('explore-works-updated'));
                    
                    console.log('Work published to local storage:', newWork);
                  }
                } catch (err) {
                  console.error('Failed to save work locally:', err);
                }
                // -------------------------
                
                // 这里可以调用API发布作品
                // 假设调用成功
                
                // 关闭发布面板
                document.body.removeChild(publishPanel);
                
                // 显示成功提示
                const successToast = document.createElement('div');
                successToast.className = 'fixed top-20 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 ease-in-out';
                successToast.textContent = '发布成功！';
                document.body.appendChild(successToast);
                
                setTimeout(() => {
                  successToast.style.opacity = '0';
                  successToast.style.transform = 'translateX(100%)';
                  setTimeout(() => {
                    document.body.removeChild(successToast);
                  }, 300);
                }, 2000);
              });
            }
            
            // 点击面板外部关闭
            publishPanel.addEventListener('click', (e) => {
              if (e.target === publishPanel) {
                document.body.removeChild(publishPanel);
              }
            });
          });
        }
        
        if (publishToCommunityButton) {
          publishToCommunityButton.addEventListener('click', () => {
            // 关闭当前分享面板
            document.body.removeChild(sharePanel);
            
            // 显示发布到社群面板
            const communityPanel = document.createElement('div');
            communityPanel.className = 'fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4';
            
            communityPanel.innerHTML = `
              <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md w-full">
                <h3 class="text-xl font-bold mb-4 dark:text-white">发布到社群</h3>
                
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">选择社群</label>
                    <select class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">请选择社群</option>
                      <option value="community-1">设计爱好者社群</option>
                      <option value="community-2">传统文化交流群</option>
                      <option value="community-3">AI创作分享群</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">作品标题</label>
                    <input type="text" placeholder="输入作品标题" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">作品描述</label>
                    <textarea placeholder="输入作品描述" rows="2" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">可见性</label>
                    <div class="flex gap-3">
                      <label class="flex items-center gap-1 text-sm">
                        <input type="radio" name="community-visibility" value="public" checked class="text-blue-500" />
                        <span class="dark:text-gray-300">公开</span>
                      </label>
                      <label class="flex items-center gap-1 text-sm">
                        <input type="radio" name="community-visibility" value="community" class="text-blue-500" />
                        <span class="dark:text-gray-300">仅社群成员可见</span>
                      </label>
                      <label class="flex items-center gap-1 text-sm">
                        <input type="radio" name="community-visibility" value="private" class="text-blue-500" />
                        <span class="dark:text-gray-300">私有</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div class="mt-6 flex justify-end gap-3">
                  <button id="closeCommunityPanel" class="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">取消</button>
                  <button id="confirmCommunityPublish" class="px-4 py-2 bg-[#C02C38] hover:bg-[#E60012] text-white rounded-lg transition-colors">发布</button>
                </div>
              </div>
            `;
            
            document.body.appendChild(communityPanel);
            
            // 添加社群发布面板事件监听
            const closeCommunityButton = communityPanel.querySelector('#closeCommunityPanel');
            const confirmCommunityButton = communityPanel.querySelector('#confirmCommunityPublish');
            
            if (closeCommunityButton) {
              closeCommunityButton.addEventListener('click', () => {
                document.body.removeChild(communityPanel);
              });
            }
            
            if (confirmCommunityButton) {
              confirmCommunityButton.addEventListener('click', () => {
                // 这里可以实现发布到社群的逻辑
                const communitySelect = communityPanel.querySelector('select') as HTMLSelectElement;
                const titleInput = communityPanel.querySelector('input[placeholder="输入作品标题"]') as HTMLInputElement;
                const descriptionInput = communityPanel.querySelector('textarea[placeholder="输入作品描述"]') as HTMLTextAreaElement;
                const visibilityInputs = communityPanel.querySelectorAll('input[name="community-visibility"]') as NodeListOf<HTMLInputElement>;
                const visibility = Array.from(visibilityInputs).find(input => input.checked)?.value || 'public';
                
                const communityId = communitySelect.value;
                const title = titleInput.value;
                const description = descriptionInput.value;
                
                console.log('Publish to community:', { communityId, title, description, visibility });
                
                // 这里可以调用API发布到社群
                // 假设调用成功
                
                // 关闭社群发布面板
                document.body.removeChild(communityPanel);
                
                // 显示成功提示
                const successToast = document.createElement('div');
                successToast.className = 'fixed top-20 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 ease-in-out';
                successToast.textContent = '发布成功！';
                document.body.appendChild(successToast);
                
                setTimeout(() => {
                  successToast.style.opacity = '0';
                  successToast.style.transform = 'translateX(100%)';
                  setTimeout(() => {
                    document.body.removeChild(successToast);
                  }, 300);
                }, 2000);
              });
            }
            
            // 点击面板外部关闭
            communityPanel.addEventListener('click', (e) => {
              if (e.target === communityPanel) {
                document.body.removeChild(communityPanel);
              }
            });
          });
        }
        
        // 点击面板外部关闭
        sharePanel.addEventListener('click', (e) => {
          if (e.target === sharePanel) {
            document.body.removeChild(sharePanel);
          }
        });
      }
      
      console.log('Share design:', shareUrl);
    } catch (error) {
      console.error('Failed to share design:', error);
    }
    
    return state;
  }),
  
  // 应用到其他工具
  applyToOtherTool: (initialTool?: ToolType) => set((state) => {
    if (!state.selectedResult) return state;
    
    // 如果提供了工具，直接切换
    if (initialTool) {
      return {
        ...state,
        activeTool: initialTool,
      };
    }
    
    // 显示工具选择菜单
    if (typeof window !== 'undefined') {
      // 创建工具选择面板
      const toolPanel = document.createElement('div');
      toolPanel.className = 'fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4';
      
      const tools: { id: ToolType; name: string; icon: string; description: string }[] = [
        { id: 'sketch', name: '一键设计', icon: 'magic', description: '快速生成设计方案' },
        { id: 'pattern', name: '纹样嵌入', icon: 'th', description: '在设计中嵌入传统纹样' },
        { id: 'filter', name: 'AI滤镜', icon: 'filter', description: '应用AI滤镜效果' },
        { id: 'trace', name: '文化溯源', icon: 'book-open', description: '探索设计背后的文化元素' },
        { id: 'remix', name: '风格重混', icon: 'random', description: '混合不同风格' },
        { id: 'layout', name: '版式生成', icon: 'th-large', description: '自动生成版式' },
        { id: 'mockup', name: '模型预览', icon: 'box-open', description: '在模型中预览设计' },
        { id: 'tile', name: '图案平铺', icon: 'border-all', description: '创建图案平铺效果' },
      ];
      
      toolPanel.innerHTML = `
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md w-full">
          <h3 class="text-xl font-bold mb-4 dark:text-white">选择工具</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-5">将当前设计应用到其他工具</p>
          
          <div class="grid grid-cols-2 gap-3">
            ${tools.map(tool => `
              <button data-tool="${tool.id}" class="flex flex-col items-center justify-center p-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center">
                <i class="fas fa-${tool.icon} text-2xl text-blue-500 mb-2"></i>
                <h4 class="font-medium text-gray-900 dark:text-white mb-1">${tool.name}</h4>
                <p class="text-xs text-gray-500 dark:text-gray-400">${tool.description}</p>
              </button>
            `).join('')}
          </div>
          
          <div class="mt-6 flex justify-end">
            <button id="closeToolPanel" class="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">取消</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(toolPanel);
      
      // 添加事件监听
      const closeButton = toolPanel.querySelector('#closeToolPanel');
      const toolButtons = toolPanel.querySelectorAll('[data-tool]');
      
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          document.body.removeChild(toolPanel);
        });
      }
      
      toolButtons.forEach(button => {
        button.addEventListener('click', () => {
          const tool = button.getAttribute('data-tool') as ToolType;
          if (tool) {
            // 切换到选择的工具
            set((state) => ({
              ...state,
              activeTool: tool,
            }));
          }
          document.body.removeChild(toolPanel);
        });
      });
      
      // 点击面板外部关闭
      toolPanel.addEventListener('click', (e) => {
        if (e.target === toolPanel) {
          document.body.removeChild(toolPanel);
        }
      });
    }
    
    return state;
  }),
  
  // 发布到探索作品
  publishToExplore: async (data) => {
    try {
      const { selectedResult } = useCreateStore.getState();
      if (!selectedResult) {
        return { success: false, message: '请先选择作品', moderationStatus: 'rejected' };
      }
      
      const result = await workService.publishToExplore(selectedResult, {
        category: data.category,
        tags: data.tags,
        culturalElements: data.culturalElements,
        visibility: data.visibility,
        isFeatured: data.isFeatured,
        scheduledPublishDate: data.scheduledPublishDate,
      });
      
      return result;
    } catch (error) {
      console.error('发布到探索作品失败:', error);
      return { success: false, message: '发布失败，请重试', moderationStatus: 'rejected' };
    }
  },
  
  // 发布到社群
  publishToCommunity: async (data) => {
    try {
      const { selectedResult } = useCreateStore.getState();
      if (!selectedResult) {
        return { success: false, message: '请先选择作品' };
      }
      
      const result = await workService.publishToCommunity(selectedResult, {
        communityId: data.communityId,
        visibility: data.visibility,
        scheduledPublishDate: data.scheduledPublishDate,
      });
      
      return result;
    } catch (error) {
      console.error('发布到社群失败:', error);
      return { success: false, message: '发布失败，请重试' };
    }
  },
  
  // 获取审核状态
  getModerationStatus: async (workId) => {
    try {
      const result = await workService.getModerationStatus(workId);
      return result;
    } catch (error) {
      console.error('获取审核状态失败:', error);
      return {
        status: 'pending',
        reviewedAt: null,
        rejectionReason: null,
        moderator: null,
      };
    }
  }
}));
