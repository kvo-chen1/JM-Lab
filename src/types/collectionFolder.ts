import { CollectionType } from '@/services/collectionService';

export enum FolderVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
}

export interface CollectionFolder {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_image?: string;
  visibility: FolderVisibility;
  sort_order: number;
  item_count: number;
  view_count: number;
  share_code?: string;
  created_at: string;
  updated_at: string;
}

export interface CollectionFolderItem {
  id: string;
  folder_id: string;
  item_id: string;
  item_type: CollectionType;
  sort_order: number;
  created_at: string;
}

export interface FolderWithItems extends CollectionFolder {
  items: CollectionFolderItem[];
}

export interface CreateFolderData {
  name: string;
  description?: string;
  cover_image?: string;
  visibility?: FolderVisibility;
}

export interface UpdateFolderData {
  name?: string;
  description?: string;
  cover_image?: string;
  visibility?: FolderVisibility;
  sort_order?: number;
}

export interface AddToFolderData {
  folder_id: string;
  item_id: string;
  item_type: CollectionType;
}

export interface MoveItemData {
  source_folder_id: string;
  target_folder_id: string;
  item_id: string;
  item_type: CollectionType;
}

export interface FolderStats {
  total_folders: number;
  total_items: number;
  public_folders: number;
  total_views: number;
}

export interface FolderShareInfo {
  share_code: string;
  share_url: string;
  folder_name: string;
  item_count: number;
}

export interface PublicFolderView extends CollectionFolder {
  items: Array<{
    id: string;
    item_id: string;
    item_type: CollectionType;
    sort_order: number;
    created_at: string;
  }>;
  owner: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}
