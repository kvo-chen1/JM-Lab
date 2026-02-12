/**
 * 灵感脉络组件库
 * 提供创作思维导图相关的所有组件
 */

// 核心组件
export { default as MindMapCanvas } from './MindMapCanvas';
export { default as NodeRenderer } from './NodeRenderer';
export { default as ConnectionLine } from './ConnectionLine';
export { default as MiniMap } from './MiniMap';
export { default as BrandInspirationPanel } from './BrandInspirationPanel';
export { default as NodeEditor } from './NodeEditor';
export { default as StoryGenerator } from './StoryGenerator';
export { default as EmptyStateGuide } from './EmptyStateGuide';

// 类型定义
export type {
  CreationMindMap,
  MindNode,
  NodeContent,
  NodePosition,
  NodeStyle,
  CulturalElement,
  BrandReference,
  AIResult,
  AISuggestion,
  CreationStory,
  MindMapSettings,
  MindMapStats,
  NodeCategory,
  LayoutType,
  TurningPoint,
  TimelineEvent,
  StoryStats,
} from './types';

// 钩子函数
export { useMindMap } from './hooks/useMindMap';
export { useNodeDrag } from './hooks/useNodeDrag';
export { useCanvasZoom } from './hooks/useCanvasZoom';

// 服务
export { InspirationMindMapService } from '@/services/inspirationMindMapService';
