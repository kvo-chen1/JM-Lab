/**
 * 收藏相关类型定义
 * 从 collectionService 重新导出类型，便于统一导入
 */

export { CollectionType, SortOption } from '@/services/collectionService';
export type {
  CollectionItem,
  CollectionOptions,
  CollectionResult,
  UserCollectionStats,
  CollectionStats,
  CollectionAuthor,
  MediaType,
} from '@/services/collectionService';
