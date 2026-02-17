import {
  CollectionType,
  CollectionItem,
  CollectionOptions,
  CollectionResult,
  UserCollectionStats,
  SortOption,
} from '@/services/collectionService';

// 重新导出类型
export { CollectionType, SortOption };
export type { CollectionItem, CollectionOptions, CollectionResult, UserCollectionStats };

/**
 * 视图模式
 */
export enum ViewMode {
  GRID = 'grid',
  LIST = 'list',
}

/**
 * 标签页类型
 */
export enum TabType {
  BOOKMARKS = 'bookmarks',
  LIKES = 'likes',
}

/**
 * 分类筛选选项
 */
export interface CategoryFilter {
  id: CollectionType | 'all';
  label: string;
  icon: string;
  count: number;
  color: string;
}

/**
 * 排序选项配置
 */
export interface SortOptionConfig {
  value: SortOption;
  label: string;
  icon: string;
}

/**
 * 收藏卡片属性
 */
export interface CollectionCardProps {
  item: CollectionItem;
  viewMode: ViewMode;
  onToggleBookmark: (id: string, type: CollectionType) => void;
  onToggleLike: (id: string, type: CollectionType) => void;
  isLoading?: boolean;
  activeTab?: TabType;
}

/**
 * 收藏网格属性
 */
export interface CollectionGridProps {
  items: CollectionItem[];
  viewMode: ViewMode;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onToggleBookmark: (id: string, type: CollectionType) => void;
  onToggleLike: (id: string, type: CollectionType) => void;
  activeTab?: TabType;
}

/**
 * 侧边栏属性
 */
export interface CollectionSidebarProps {
  activeFilter: CollectionType | 'all';
  onFilterChange: (filter: CollectionType | 'all') => void;
  stats: UserCollectionStats;
  categories: CategoryFilter[];
}

/**
 * 统计面板属性
 */
export interface CollectionStatsProps {
  stats: UserCollectionStats;
  isLoading: boolean;
}

/**
 * 空状态属性
 */
export interface CollectionEmptyProps {
  type: 'bookmarks' | 'likes';
  activeFilter: CollectionType | 'all';
}

/**
 * 视图切换属性
 */
export interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

/**
 * 排序下拉框属性
 */
export interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

/**
 * 使用收藏的Hook返回类型
 */
export interface UseCollectionsReturn {
  items: CollectionItem[];
  isLoading: boolean;
  hasMore: boolean;
  total: number;
  error: Error | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
}

/**
 * 使用收藏操作的Hook返回类型
 */
export interface UseCollectionActionsReturn {
  toggleBookmark: (id: string, type: CollectionType) => Promise<boolean>;
  toggleLike: (id: string, type: CollectionType) => Promise<boolean>;
  removeBookmark: (id: string, type: CollectionType) => Promise<boolean>;
  removeLike: (id: string, type: CollectionType) => Promise<boolean>;
  isToggling: boolean;
}

/**
 * 动画配置
 */
export interface AnimationConfig {
  initial: object;
  animate: object;
  exit?: object;
  transition?: object;
}
