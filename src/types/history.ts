export type HistoryItemType = 'work' | 'template' | 'post';
export type HistoryMediaType = 'image' | 'video';

export interface HistoryItem {
  id: string;
  type: HistoryItemType;
  mediaType?: HistoryMediaType;
  title: string;
  description?: string;
  thumbnail?: string;
  url: string;
  viewedAt: number;
  creator?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface HistoryGroup {
  label: string;
  items: HistoryItem[];
}

export type HistoryFilter = 'all' | HistoryItemType;
