export type AIGenerationType = 'image' | 'video' | 'text';
export type AIGenerationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface AIGenerationHistoryItem {
  id: string;
  userId: string;
  type: AIGenerationType;
  status: AIGenerationStatus;
  prompt: string;
  negativePrompt?: string;
  resultUrl?: string;
  thumbnailUrl?: string;
  metadata?: {
    size?: string;
    quality?: string;
    style?: string;
    duration?: number;
    resolution?: string;
    aspectRatio?: string;
    seed?: number;
    revisedPrompt?: string;
    [key: string]: any;
  };
  source?: string;
  sourceId?: string;
  isFavorite: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AIGenerationHistoryFilter {
  type?: AIGenerationType;
  status?: AIGenerationStatus;
  isFavorite?: boolean;
  startDate?: Date;
  endDate?: Date;
  keyword?: string;
  tags?: string[];
}

export interface AIGenerationHistorySort {
  field: 'createdAt' | 'updatedAt' | 'type' | 'status';
  order: 'asc' | 'desc';
}

export interface AIGenerationHistoryPagination {
  page: number;
  pageSize: number;
  total?: number;
  totalPages?: number;
}

export interface AIGenerationHistoryListResponse {
  items: AIGenerationHistoryItem[];
  pagination: AIGenerationHistoryPagination;
}

export interface AIGenerationHistoryCreateParams {
  type: AIGenerationType;
  prompt: string;
  negativePrompt?: string;
  resultUrl?: string;
  thumbnailUrl?: string;
  status?: AIGenerationStatus;
  metadata?: AIGenerationHistoryItem['metadata'];
  source?: string;
  sourceId?: string;
  tags?: string[];
}

export interface AIGenerationHistoryUpdateParams {
  prompt?: string;
  negativePrompt?: string;
  resultUrl?: string;
  thumbnailUrl?: string;
  status?: AIGenerationStatus;
  metadata?: AIGenerationHistoryItem['metadata'];
  isFavorite?: boolean;
  tags?: string[];
}

export interface AIGenerationHistoryBatchOperation {
  ids: string[];
  operation: 'delete' | 'favorite' | 'unfavorite' | 'addTags' | 'removeTags';
  tags?: string[];
}

export interface AIGenerationHistoryExportOptions {
  ids?: string[];
  format: 'json' | 'csv';
  includeMetadata?: boolean;
}
