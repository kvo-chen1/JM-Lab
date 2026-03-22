import { create } from 'zustand';

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
}

export type CanvasTool = 'select' | 'hand' | 'move';
export type ViewMode = 'gallery' | 'grid';

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

export const useCanvasStore = create<CanvasState>((set, get) => ({
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
}));

export default useCanvasStore;
