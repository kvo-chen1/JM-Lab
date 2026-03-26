import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CardPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface WorkItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  content?: string;
  type: 'image' | 'text' | 'code' | 'design';
  createdAt: number;
  position: CardPosition;
  isFavorite?: boolean;
  status?: 'generating' | 'completed' | 'error';
  metadata?: Record<string, unknown>;
  // 元素分离相关
  isolatedElements?: IsolatedElement[];
  isElementSeparated?: boolean;
  originalImageUrl?: string;
}

export type CanvasTool = 'select' | 'hand' | 'move';
export type ViewMode = 'gallery' | 'grid';

// 元素分离相关类型
export type ElementType = 'product' | 'text' | 'logo' | 'background' | 'decoration' | 'unknown';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ElementTransform {
  scale: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
}

export interface ElementStyle {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  opacity: number;
  blendMode: string;
}

export interface IsolatedElement {
  id: string;
  parentWorkId: string;
  name: string;
  type: ElementType;
  originalBounds: Bounds;
  isolatedImageUrl: string;
  maskUrl?: string;
  position: CardPosition;
  transform: ElementTransform;
  style: ElementStyle;
  isVisible: boolean;
  isLocked: boolean;
  zIndex: number;
}

interface CanvasState {
  // 画布位置和缩放
  canvasPosition: { x: number; y: number };
  canvasZoom: number;
  
  // 工具状态
  selectedTool: CanvasTool;
  showGrid: boolean;
  viewMode: ViewMode;
  
  // 作品管理
  works: WorkItem[];
  selectedWorkId: string | null;
  
  // 拖拽状态
  isDragging: boolean;
  isSpacePressed: boolean;

  // 编辑状态
  editingWorkId: string | null;
  
  // 元素分离编辑状态
  isolatedElements: IsolatedElement[];
  selectedElementId: string | null;
  isElementEditMode: boolean;
  elementEditWorkId: string | null;
  
  // 持久化状态
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  // Actions
  setCanvasPosition: (position: { x: number; y: number }) => void;
  setCanvasZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetCanvas: () => void;
  
  setSelectedTool: (tool: CanvasTool) => void;
  setShowGrid: (show: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  
  addWork: (work: Omit<WorkItem, 'position'> & { position?: Partial<CardPosition> }) => void;
  updateWork: (id: string, updates: Partial<WorkItem>) => void;
  deleteWork: (id: string) => void;
  selectWork: (id: string | null) => void;
  updateWorkPosition: (id: string, position: CardPosition) => void;
  clearWorks: () => void;
  
  setIsDragging: (dragging: boolean) => void;
  setIsSpacePressed: (pressed: boolean) => void;
  
  setEditingWorkId: (id: string | null) => void;
  
  // 元素分离编辑 Actions
  enterElementEditMode: (workId: string, elements?: IsolatedElement[]) => void;
  exitElementEditMode: (save: boolean) => void;
  addIsolatedElement: (element: IsolatedElement) => void;
  updateIsolatedElement: (id: string, updates: Partial<IsolatedElement>) => void;
  deleteIsolatedElement: (id: string) => void;
  selectIsolatedElement: (id: string | null) => void;
  updateElementTransform: (id: string, transform: Partial<ElementTransform>) => void;
  updateElementStyle: (id: string, style: Partial<ElementStyle>) => void;
  updateElementPosition: (id: string, position: Partial<CardPosition>) => void;
  reorderElements: (elementIds: string[]) => void;
  toggleElementVisibility: (id: string) => void;
  toggleElementLock: (id: string) => void;
}

const DEFAULT_ZOOM = 100;
const MIN_ZOOM = 25;
const MAX_ZOOM = 200;
const ZOOM_STEP = 10;

// 生成默认位置（网格布局）
const generateDefaultPosition = (index: number, viewMode: ViewMode): CardPosition => {
  const padding = 80;
  const cardWidth = viewMode === 'grid' ? 320 : 448;
  const cardHeight = 400;
  const gap = viewMode === 'grid' ? 48 : 64;
  const cols = viewMode === 'grid' ? 3 : 2;
  
  const row = Math.floor(index / cols);
  const col = index % cols;
  
  return {
    x: padding + col * (cardWidth + gap),
    y: padding + row * (cardHeight + gap),
    width: cardWidth,
    height: cardHeight,
  };
};

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      // 初始状态
      canvasPosition: { x: 0, y: 0 },
      canvasZoom: DEFAULT_ZOOM,
      selectedTool: 'select',
      showGrid: false,
      viewMode: 'gallery',
      works: [],
      selectedWorkId: null,
      isDragging: false,
  isSpacePressed: false,
  editingWorkId: null,
  
  // 元素分离编辑状态初始值
  isolatedElements: [],
  selectedElementId: null,
  isElementEditMode: false,
  elementEditWorkId: null,
  
  _hasHydrated: false,
  
  // 画布位置操作
  setCanvasPosition: (position) => set({ canvasPosition: position }),
  
  // 画布缩放操作
  setCanvasZoom: (zoom) => set({ 
    canvasZoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)) 
  }),
  
  zoomIn: () => set((state) => ({ 
    canvasZoom: Math.min(MAX_ZOOM, state.canvasZoom + ZOOM_STEP) 
  })),
  
  zoomOut: () => set((state) => ({ 
    canvasZoom: Math.max(MIN_ZOOM, state.canvasZoom - ZOOM_STEP) 
  })),
  
  resetCanvas: () => set({ 
    canvasPosition: { x: 0, y: 0 }, 
    canvasZoom: DEFAULT_ZOOM,
    selectedTool: 'select',
  }),
  
  // 工具操作
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setShowGrid: (show) => set({ showGrid: show }),
  setViewMode: (mode) => set({ viewMode: mode }),
  
  // 作品操作
  addWork: (work) => set((state) => {
    const position = work.position 
      ? { ...generateDefaultPosition(state.works.length, state.viewMode), ...work.position }
      : generateDefaultPosition(state.works.length, state.viewMode);
    
    const newWork: WorkItem = {
      ...work,
      position,
      createdAt: Date.now(),
    };
    
    return { works: [...state.works, newWork] };
  }),
  
  updateWork: (id, updates) => set((state) => ({
    works: state.works.map((work) =>
      work.id === id ? { ...work, ...updates } : work
    ),
  })),
  
  deleteWork: (id) => set((state) => ({
    works: state.works.filter((work) => work.id !== id),
    selectedWorkId: state.selectedWorkId === id ? null : state.selectedWorkId,
  })),
  
  selectWork: (id) => set({ selectedWorkId: id }),
  
  updateWorkPosition: (id, position) => set((state) => ({
    works: state.works.map((work) =>
      work.id === id ? { ...work, position: { ...work.position, ...position } } : work
    ),
  })),
  
  clearWorks: () => set({ works: [], selectedWorkId: null }),
  
  // 拖拽状态
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  setIsSpacePressed: (pressed) => set({ isSpacePressed: pressed }),

  // 编辑状态
  setEditingWorkId: (id) => set({ editingWorkId: id }),
  
  // 元素分离编辑 Actions
  enterElementEditMode: (workId, elements) => set((state) => {
    const work = state.works.find(w => w.id === workId);
    if (!work) return {};
    
    // 如果作品已有分离的元素，使用它们；否则使用传入的或空数组
    const isolatedElements = elements || work.isolatedElements || [];
    
    return {
      isElementEditMode: true,
      elementEditWorkId: workId,
      isolatedElements,
      selectedElementId: null,
      // 重置画布位置以便编辑
      canvasPosition: { x: 0, y: 0 },
      canvasZoom: 100,
    };
  }),
  
  exitElementEditMode: (save) => set((state) => {
    if (save && state.elementEditWorkId) {
      // 保存分离的元素到对应的作品
      const updatedWorks = state.works.map(work => 
        work.id === state.elementEditWorkId
          ? { 
              ...work, 
              isolatedElements: state.isolatedElements,
              isElementSeparated: state.isolatedElements.length > 0,
            }
          : work
      );
      return {
        works: updatedWorks,
        isElementEditMode: false,
        elementEditWorkId: null,
        isolatedElements: [],
        selectedElementId: null,
      };
    }
    
    // 不保存，直接退出
    return {
      isElementEditMode: false,
      elementEditWorkId: null,
      isolatedElements: [],
      selectedElementId: null,
    };
  }),
  
  addIsolatedElement: (element) => set((state) => ({
    isolatedElements: [...state.isolatedElements, element],
  })),
  
  updateIsolatedElement: (id, updates) => set((state) => ({
    isolatedElements: state.isolatedElements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    ),
  })),
  
  deleteIsolatedElement: (id) => set((state) => ({
    isolatedElements: state.isolatedElements.filter(el => el.id !== id),
    selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
  })),
  
  selectIsolatedElement: (id) => set({ selectedElementId: id }),
  
  updateElementTransform: (id, transform) => set((state) => ({
    isolatedElements: state.isolatedElements.map(el =>
      el.id === id ? { ...el, transform: { ...el.transform, ...transform } } : el
    ),
  })),
  
  updateElementStyle: (id, style) => set((state) => ({
    isolatedElements: state.isolatedElements.map(el =>
      el.id === id ? { ...el, style: { ...el.style, ...style } } : el
    ),
  })),
  
  updateElementPosition: (id, position) => set((state) => ({
    isolatedElements: state.isolatedElements.map(el =>
      el.id === id ? { ...el, position: { ...el.position, ...position } } : el
    ),
  })),
  
  reorderElements: (elementIds) => set((state) => {
    const elementMap = new Map(state.isolatedElements.map(el => [el.id, el]));
    const reordered = elementIds
      .map(id => elementMap.get(id))
      .filter((el): el is IsolatedElement => el !== undefined)
      .map((el, index) => ({ ...el, zIndex: index }));
    return { isolatedElements: reordered };
  }),
  
  toggleElementVisibility: (id) => set((state) => ({
    isolatedElements: state.isolatedElements.map(el =>
      el.id === id ? { ...el, isVisible: !el.isVisible } : el
    ),
  })),
  
  toggleElementLock: (id) => set((state) => ({
    isolatedElements: state.isolatedElements.map(el =>
      el.id === id ? { ...el, isLocked: !el.isLocked } : el
    ),
  })),
  
  // 持久化状态
  setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'skill-chat-canvas-storage', // localStorage 的 key
      partialize: (state) => ({ 
        // 只持久化作品数据，不持久化 UI 状态
        works: state.works,
      }),
      onRehydrateStorage: (state) => {
        console.log('[CanvasStore] 存储恢复完成, 作品数量:', state?.works?.length || 0);
        // 注意：这里不能直接调用 useCanvasStore，因为此时 store 还未创建完成
        // hydration 状态会在组件中通过 useEffect 设置
      },
      skipHydration: false,
    }
  )
);

export default useCanvasStore;
