import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  WorkHeartState, 
  WorkHeartActions, 
  StylePreset, 
  GenerationResult, 
  InspirationVein,
  InspirationNode,
  GenerationProgress 
} from '../types/workheart';
import { toast } from 'sonner';

// 生成唯一ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 默认预设
const defaultPresets: StylePreset[] = [
  {
    id: 'preset-1',
    name: '国潮风格',
    description: '传统与现代的完美融合',
    brand: 'mahua',
    tags: ['国潮', '传统纹样', '红蓝配色'],
    prompt: '海河畔喜庆热闹的市井场景，融合杨柳青年画风格，中心构图突出一对身着传统服饰、手捧麻花（天津麻花）的吉祥童子，背景含海河桥梁剪影与年画式祥云纹边框；线条则劲流畅、色彩浓烈明快，红、金、翠绿为主调；木版年画质感，平涂填色+微颗粒肌理；侧前光营造鲜明轮廓与喜庆高光。',
    engine: 'sdxl',
    textStyle: 'creative',
    videoParams: {
      duration: 5,
      resolution: '720p',
      cameraFixed: false
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'preset-2',
    name: '赛博朋克',
    description: '未来科技与传统文化碰撞',
    brand: '',
    tags: ['赛博朋克', '霓虹灯', '未来感'],
    prompt: '天津之眼摩天轮在霓虹灯光下的赛博朋克风格场景，融合传统建筑元素与未来科技，蓝紫色调为主',
    engine: 'sdxl',
    textStyle: 'creative',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// 初始状态
const initialState: Omit<WorkHeartState, keyof WorkHeartActions> = {
  activeTab: 'create',
  stylePresets: defaultPresets,
  selectedPresetId: null,
  currentBrand: '',
  selectedTags: [],
  customTags: [],
  prompt: '',
  selectedEngine: 'sdxl',
  generationStatus: {
    status: 'idle',
    progress: 0,
    message: 'AI 助手就绪'
  },
  generationResults: [],
  selectedResultId: null,
  inspirationVeins: [],
  currentVeinId: null,
  veinViewMode: 'timeline',
  leftSidebarCollapsed: false,
  rightSidebarVisible: true,
  showPresetModal: false,
  showVeinModal: false,
  historyFilter: 'all',
  historySort: 'latest',
  historySearch: ''
};

// 创建Store
export const useWorkHeartStore = create<WorkHeartState & WorkHeartActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 标签操作
      setActiveTab: (tab) => set({ activeTab: tab }),

      // 预设操作
      addPreset: (preset) => {
        const newPreset: StylePreset = {
          ...preset,
          id: generateId(),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        set((state) => ({
          stylePresets: [...state.stylePresets, newPreset]
        }));
        toast.success('预设创建成功');
      },

      updatePreset: (id, updates) => {
        set((state) => ({
          stylePresets: state.stylePresets.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          )
        }));
        toast.success('预设更新成功');
      },

      deletePreset: (id) => {
        set((state) => ({
          stylePresets: state.stylePresets.filter((p) => p.id !== id),
          selectedPresetId: state.selectedPresetId === id ? null : state.selectedPresetId
        }));
        toast.success('预设删除成功');
      },

      selectPreset: (id) => {
        const { stylePresets } = get();
        const preset = id ? stylePresets.find((p) => p.id === id) : null;
        
        set({
          selectedPresetId: id,
          currentBrand: preset?.brand || '',
          selectedTags: preset?.tags || [],
          prompt: preset?.prompt || '',
          selectedEngine: preset?.engine || 'sdxl'
        });
      },

      // 创作参数
      setBrand: (brand) => set({ currentBrand: brand }),

      toggleTag: (tag) => {
        set((state) => ({
          selectedTags: state.selectedTags.includes(tag)
            ? state.selectedTags.filter((t) => t !== tag)
            : [...state.selectedTags, tag]
        }));
      },

      addCustomTag: (tag) => {
        if (!tag.trim()) return;
        set((state) => ({
          customTags: state.customTags.includes(tag)
            ? state.customTags
            : [...state.customTags, tag]
        }));
      },

      removeCustomTag: (tag) => {
        set((state) => ({
          customTags: state.customTags.filter((t) => t !== tag)
        }));
      },

      setPrompt: (prompt) => set({ prompt }),

      setEngine: (engine) => set({ selectedEngine: engine }),

      // 生成操作
      startGeneration: () => {
        set({
          generationStatus: {
            status: 'generating',
            progress: 0,
            message: '正在构思创意...',
            estimatedTime: 30
          }
        });
      },

      updateProgress: (progress) => {
        set((state) => ({
          generationStatus: { ...state.generationStatus, ...progress }
        }));
      },

      completeGeneration: (result) => {
        set((state) => ({
          generationResults: [result, ...state.generationResults],
          generationStatus: {
            status: 'completed',
            progress: 100,
            message: '生成完成'
          },
          selectedResultId: result.id
        }));
        toast.success('生成成功！');
      },

      failGeneration: (error) => {
        set({
          generationStatus: {
            status: 'error',
            progress: 0,
            message: error
          }
        });
        toast.error(`生成失败: ${error}`);
      },

      cancelGeneration: () => {
        set({
          generationStatus: {
            status: 'idle',
            progress: 0,
            message: '已取消'
          }
        });
        toast.info('生成已取消');
      },

      // 结果操作
      selectResult: (id) => set({ selectedResultId: id }),

      toggleFavorite: (id) => {
        set((state) => ({
          generationResults: state.generationResults.map((r) =>
            r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
          )
        }));
      },

      deleteResult: (id) => {
        set((state) => ({
          generationResults: state.generationResults.filter((r) => r.id !== id),
          selectedResultId: state.selectedResultId === id ? null : state.selectedResultId
        }));
        toast.success('已删除');
      },

      // 灵感脉络
      createVein: (name) => {
        const rootNode: InspirationNode = {
          id: generateId(),
          type: 'root',
          title: name,
          childrenIds: [],
          createdAt: Date.now()
        };

        const newVein: InspirationVein = {
          id: generateId(),
          name,
          rootNodeId: rootNode.id,
          nodes: { [rootNode.id]: rootNode },
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        set((state) => ({
          inspirationVeins: [...state.inspirationVeins, newVein],
          currentVeinId: newVein.id
        }));
        toast.success('灵感脉络创建成功');
      },

      addNodeToVein: (veinId, node) => {
        const newNode: InspirationNode = {
          ...node,
          id: generateId(),
          createdAt: Date.now()
        };

        set((state) => ({
          inspirationVeins: state.inspirationVeins.map((vein) => {
            if (vein.id !== veinId) return vein;

            const updatedNodes = {
              ...vein.nodes,
              [newNode.id]: newNode
            };

            // 更新父节点的childrenIds
            if (node.parentId && updatedNodes[node.parentId]) {
              updatedNodes[node.parentId] = {
                ...updatedNodes[node.parentId],
                childrenIds: [...updatedNodes[node.parentId].childrenIds, newNode.id]
              };
            }

            return {
              ...vein,
              nodes: updatedNodes,
              updatedAt: Date.now()
            };
          })
        }));
      },

      setCurrentVein: (id) => set({ currentVeinId: id }),

      setVeinViewMode: (mode) => set({ veinViewMode: mode }),

      // UI操作
      toggleLeftSidebar: () => {
        set((state) => ({ leftSidebarCollapsed: !state.leftSidebarCollapsed }));
      },

      toggleRightSidebar: () => {
        set((state) => ({ rightSidebarVisible: !state.rightSidebarVisible }));
      },

      setHistoryFilter: (filter) => set({ historyFilter: filter }),

      setHistorySort: (sort) => set({ historySort: sort }),

      setHistorySearch: (search) => set({ historySearch: search })
    }),
    {
      name: 'workheart-storage',
      partialize: (state) => ({
        stylePresets: state.stylePresets,
        generationResults: state.generationResults,
        inspirationVeins: state.inspirationVeins,
        customTags: state.customTags
      })
    }
  )
);

// 选择器hooks
export const useActiveTab = () => useWorkHeartStore((state) => state.activeTab);
export const useStylePresets = () => useWorkHeartStore((state) => state.stylePresets);
export const useSelectedPreset = () => {
  const presets = useWorkHeartStore((state) => state.stylePresets);
  const selectedId = useWorkHeartStore((state) => state.selectedPresetId);
  return presets.find((p) => p.id === selectedId) || null;
};
export const useCurrentBrand = () => useWorkHeartStore((state) => state.currentBrand);
export const useSelectedTags = () => useWorkHeartStore((state) => state.selectedTags);
export const usePrompt = () => useWorkHeartStore((state) => state.prompt);
export const useGenerationStatus = () => useWorkHeartStore((state) => state.generationStatus);
export const useGenerationResults = () => useWorkHeartStore((state) => state.generationResults);
export const useSelectedResult = () => {
  const results = useWorkHeartStore((state) => state.generationResults);
  const selectedId = useWorkHeartStore((state) => state.selectedResultId);
  return results.find((r) => r.id === selectedId) || null;
};
export const useInspirationVeins = () => useWorkHeartStore((state) => state.inspirationVeins);
export const useCurrentVein = () => {
  const veins = useWorkHeartStore((state) => state.inspirationVeins);
  const currentId = useWorkHeartStore((state) => state.currentVeinId);
  return veins.find((v) => v.id === currentId) || null;
};
export const useVeinViewMode = () => useWorkHeartStore((state) => state.veinViewMode);
export const useLeftSidebarCollapsed = () => useWorkHeartStore((state) => state.leftSidebarCollapsed);
export const useRightSidebarVisible = () => useWorkHeartStore((state) => state.rightSidebarVisible);
export const useHistoryFilter = () => useWorkHeartStore((state) => state.historyFilter);
export const useHistorySort = () => useWorkHeartStore((state) => state.historySort);
