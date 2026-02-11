// 灵感脉络 - 类型定义

// 节点类别
export type NodeCategory = 'inspiration' | 'culture' | 'ai_generate' | 'manual_edit' | 'reference' | 'final';

// 布局类型
export type LayoutType = 'tree' | 'radial' | 'timeline';

// 节点内容
export interface NodeContent {
  text: string;
  mediaUrls?: string[];
  attachments?: string[];
}

// 节点样式
export interface NodeStyle {
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  fontSize?: number;
  shape?: 'rectangle' | 'rounded' | 'circle' | 'diamond';
}

// 文化元素
export interface CulturalElement {
  id: string;
  name: string;
  description: string;
  category: 'craft' | 'food' | 'art' | 'custom' | 'history';
  brandId: string;
  icon?: string;
}

// 品牌引用
export interface BrandReference {
  brandId: string;
  brandName: string;
  elementIds: string[];
  inspirationScore: number;
}

// AI结果
export interface AIResult {
  content: string;
  prompt: string;
  model: string;
  timestamp: number;
  tokensUsed?: number;
}

// AI建议
export interface AISuggestion {
  id: string;
  type: 'continue' | 'branch' | 'optimize' | 'culture';
  content: string;
  prompt: string;
  confidence: number;
  timestamp: number;
}

// 历史记录
export interface NodeHistory {
  version: number;
  timestamp: number;
  action: 'create' | 'edit' | 'ai_generate' | 'optimize';
  changes: string[];
}

// 思维导图节点
export interface MindNode {
  id: string;
  mapId: string;
  parentId?: string;
  title: string;
  description?: string;
  category: NodeCategory;
  content?: NodeContent;
  aiPrompt?: string;
  aiGeneratedContent?: string;
  userNote?: string;
  tags?: string[];
  style?: NodeStyle;
  brandReferences?: BrandReference[];
  culturalElements?: CulturalElement[];
  aiResults?: AIResult[];
  position?: { x: number; y: number };
  version: number;
  history?: NodeHistory[];
  createdAt: number;
  updatedAt: number;
}

// 节点位置
export interface NodePosition {
  nodeId: string;
  x: number;
  y: number;
  level: number;
}

// 脉络设置
export interface MindMapSettings {
  layoutType: LayoutType;
  theme: string;
  autoSave: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

// 脉络统计
export interface MindMapStats {
  totalNodes: number;
  maxDepth: number;
  aiGeneratedNodes: number;
  cultureNodes: number;
  lastActivityAt: number;
}

// 创作脉络
export interface CreationMindMap {
  id: string;
  userId: string;
  title: string;
  description?: string;
  brandId?: string;
  nodes: MindNode[];
  layoutType: LayoutType;
  settings: MindMapSettings;
  stats: MindMapStats;
  isPublic: boolean;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

// 关键转折点
export interface TurningPoint {
  nodeId: string;
  description: string;
  timestamp: number;
}

// 时间线事件
export interface TimelineEvent {
  phase: string;
  description: string;
  timestamp: number;
  nodeIds: string[];
}

// 故事统计
export interface StoryStats {
  totalDuration: number;
  inspirationCount: number;
  aiInteractionCount: number;
  iterationCount: number;
}

// 创作故事
export interface CreationStory {
  id: string;
  mapId: string;
  title: string;
  subtitle: string;
  fullStory: string;
  keyTurningPoints: TurningPoint[];
  cultureElements: string[];
  timeline: TimelineEvent[];
  stats: StoryStats;
  themes: string[];
  participants: string[];
  generatedAt: number;
}
