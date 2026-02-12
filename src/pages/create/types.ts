export type ToolType = 'sketch' | 'upload' | 'enhance' | 'style' | 'layout' | 'culture';

export interface GeneratedResult {
  id: number;
  thumbnail: string;
  score?: number;
  video?: string;
  type?: 'image' | 'video';
  _tempFile?: File; // 本地临时文件，发布时上传
}

export interface TraditionalPattern {
  id: number;
  name: string;
  thumbnail: string;
  description: string;
}

export interface AIFilter {
  id: number;
  name: string;
  thumbnail: string;
  description: string;
  intensity: number;
  category: string;
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
}

export interface RemixStyle {
  id: string;
  name: string;
  weight: number;
}

export interface PrecheckResult {
  status: 'pending' | 'passed' | 'warning' | 'failed';
  issues: { type: string; severity: 'warning' | 'error'; message: string }[];
}

export interface PatternHistoryItem {
  id: string;
  timestamp: number;
  patternId: number;
  patternName: string;
  thumbnail: string;
  properties: {
    opacity: number;
    scale: number;
    rotation: number;
    blendMode: 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'normal';
    tileMode: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
    positionX: number;
    positionY: number;
  };
}

export interface CreateState {
  // UI State
  activeTool: ToolType;
  currentStep: number;
  isLoading: boolean;
  showPropertiesPanel: boolean;
  
  // Data State
  prompt: string;
  generatedResults: GeneratedResult[];
  selectedResult: number | null;
  
  // Feature Flags / Toggles
  showCulturalInfo: boolean;
  showAIReview: boolean;
  showModelSelector: boolean;
  showPublishModal: boolean;
  isPrecheckEnabled: boolean;
  precheckResult: PrecheckResult | null;
  fusionMode: boolean;
  autoGenerate: boolean;
  
  // Loading States
  isGenerating: boolean;
  isRegenerating: boolean;
  isEngineGenerating: boolean;
  isPolishing: boolean;
  isFusing: boolean;
  videoGenerating: boolean;
  generatingPlan: boolean;
  
  // Tool Specific State
  stylePreset: string;
  generateCount: number;
  favorites: Array<{ id: number; thumbnail: string }>;
  culturalInfoText: string;
  promptB: string;
  lastUpdatedAt: number | null;
  selectedPatternId: number | null;
  filterName: string;
  filterIntensity: number;
  streamStatus: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  abortController: AbortController | null;
  
  // Pattern Tool State
  patternOpacity: number;
  patternScale: number;
  patternRotation: number;
  patternBlendMode: 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'normal';
  patternTileMode: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
  patternPositionX: number;
  patternPositionY: number;
  
  // Filter Tool State
  selectedFilterId: number | null;
  showQuickActions: boolean;
  showEngineDetails: boolean;
  
  // History
  recentPatterns: number[];
  recentFilters: Array<{ name: string; intensity: number }>;
  savedPlans: Array<{ id: string; title: string; query: string; aiText: string; ts: number }>;
  patternHistory: PatternHistoryItem[];
  
  // Curation
  curationTemplate: string;
  customTemplates: Record<string, string>;
  showTemplateEditor: boolean;
  newTemplateName: string;
  newTemplateGuide: string;
  genError: string;
  
  // AI Explanation
  aiExplanation: string;
  explainCollapsed: boolean;
  
  // Additional States
  currentEventId: string | null;
  traceSelectedKnowledgeId: string | null;
  
  // Mockup Tool State
  mockupSelectedTemplateId: string | null;
  mockupShowWireframe: boolean;
  
  // Tile Tool State
  tilePatternId: number | null;
  tileMode: string;
  tileSize: number;
  tileSpacing: number;
  tileRotation: number;
  tileOpacity: number;
  
  // 图片完善相关状态
  refinementMode: 'image-to-image' | 'expand' | 'inpaint';
  refinementPrompt: string;
  expandRatio: number;
  inpaintMask: string | null;
  
  // 提示词优化相关状态
  optimizedPrompt: string;
  promptHistory: string[];
  isOptimizingPrompt: boolean;
}
