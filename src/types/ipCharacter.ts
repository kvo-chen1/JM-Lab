/**
 * IP 形象设计展示系统类型定义
 * 用于专业的 IP 形象设计展示页面
 */

// IP 形象基础信息
export interface IPCharacterBase {
  id: string;
  name: string;
  englishName: string;
  subtitle: string;
  description: string;
  story: string;
  createdAt: string;
  updatedAt: string;
}

// 配色方案
export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  name: string;
  description?: string;
}

// 三视图
export interface ThreeViews {
  front: string;
  side: string;
  back: string;
}

// 表情包
export interface EmojiExpression {
  id: string;
  name: string;
  image: string;
  description: string;
}

// 动作延展
export interface ActionPose {
  id: string;
  name: string;
  image: string;
  description: string;
}

// 衍生海报
export interface DerivativePoster {
  id: string;
  title: string;
  image: string;
  description: string;
  style: string;
}

// 周边设计
export interface MerchandiseDesign {
  id: string;
  name: string;
  image: string;
  description: string;
  category: 'stationery' | 'apparel' | 'accessories' | 'digital' | 'toy';
}

// 设计说明
export interface DesignDescription {
  inspiration: string;
  concept: string;
  target: string;
  features: string[];
  culturalElements?: string[];
}

// 应用场景
export interface ApplicationScene {
  id: string;
  name: string;
  icon: string;
  description: string;
  examples: string[];
}

// 变装设计
export interface CostumeDesign {
  id: string;
  name: string;
  image: string;
  description: string;
  theme: string;
}

// 线稿图
export interface LineDrawing {
  id: string;
  name: string;
  image: string;
  description: string;
}

// 完整的 IP 形象数据
export interface IPCharacterDesign {
  base: IPCharacterBase;
  mainVisual: string;
  colorScheme: ColorScheme[];
  threeViews: ThreeViews;
  emojis: EmojiExpression[];
  actionPoses: ActionPose[];
  posters: DerivativePoster[];
  merchandise: MerchandiseDesign[];
  designDescription: DesignDescription;
  applicationScenes: ApplicationScene[];
  costumes?: CostumeDesign[];
  lineDrawings?: LineDrawing[];
  designer?: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  tags: string[];
  category: 'culture' | 'mascot' | 'brand' | 'festival' | 'custom';
}

// IP 形象展示配置
export interface IPShowcaseConfig {
  showThreeViews: boolean;
  showEmojis: boolean;
  showActionPoses: boolean;
  showPosters: boolean;
  showMerchandise: boolean;
  showColorScheme: boolean;
  showDesignDescription: boolean;
  showApplicationScenes: boolean;
  showCostumes: boolean;
  showLineDrawings: boolean;
  layout: 'grid' | 'masonry' | 'timeline';
  theme: 'light' | 'dark' | 'auto';
}

// IP 形象列表项
export interface IPCharacterListItem {
  id: string;
  name: string;
  englishName: string;
  thumbnail: string;
  category: string;
  tags: string[];
  createdAt: string;
}

// IP 形象筛选条件
export interface IPCharacterFilter {
  category?: string;
  tags?: string[];
  searchQuery?: string;
  sortBy: 'newest' | 'oldest' | 'name' | 'popular';
}
