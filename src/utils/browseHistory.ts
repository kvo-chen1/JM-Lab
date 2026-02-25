import { HistoryItem, HistoryItemType, HistoryMediaType } from '@/types/history';

const STORAGE_KEY = 'browse_history';
const MAX_ITEMS = 200;

const getHistoryFromStorage = (): HistoryItem[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveHistoryToStorage = (items: HistoryItem[]) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save browse history:', error);
  }
};

export const addHistory = (item: Omit<HistoryItem, 'id' | 'viewedAt'>): void => {
  const history = getHistoryFromStorage();
  const existingIndex = history.findIndex(h => h.url === item.url);
  
  let newHistory: HistoryItem[];
  
  if (existingIndex !== -1) {
    newHistory = history.filter((_, i) => i !== existingIndex);
  } else {
    newHistory = history;
  }

  const newItem: HistoryItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    viewedAt: Date.now()
  };

  const updated = [newItem, ...newHistory].slice(0, MAX_ITEMS);
  saveHistoryToStorage(updated);
};

export const trackWorkView = (work: {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  videoUrl?: string;
  mediaType?: HistoryMediaType;
  creator?: { id: string; name: string; avatar?: string };
}) => {
  addHistory({
    type: 'work',
    mediaType: work.mediaType || (work.videoUrl ? 'video' : 'image'),
    title: work.title,
    description: work.description,
    thumbnail: work.thumbnail || work.videoUrl,
    url: `/work/${work.id}`,
    creator: work.creator
  });
};

export const trackTemplateView = (template: {
  id: string;
  name: string;
  description?: string;
  previewUrl?: string;
  videoUrl?: string;
  mediaType?: HistoryMediaType;
  creator?: { id: string; name: string; avatar?: string };
}) => {
  addHistory({
    type: 'template',
    mediaType: template.mediaType || (template.videoUrl ? 'video' : 'image'),
    title: template.name,
    description: template.description,
    thumbnail: template.previewUrl || template.videoUrl,
    url: `/template/${template.id}`,
    creator: template.creator
  });
};

export const trackPostView = (post: {
  id: string;
  title: string;
  content?: string;
  thumbnail?: string;
  videoUrl?: string;
  mediaType?: HistoryMediaType;
  creator?: { id: string; name: string; avatar?: string };
}) => {
  addHistory({
    type: 'post',
    mediaType: post.mediaType || (post.videoUrl ? 'video' : 'image'),
    title: post.title,
    description: post.content?.substring(0, 100),
    thumbnail: post.thumbnail || post.videoUrl,
    url: `/community/post/${post.id}`,
    creator: post.creator
  });
};

export const removeHistoryItem = (id: string): void => {
  const history = getHistoryFromStorage();
  const updated = history.filter(item => item.id !== id);
  saveHistoryToStorage(updated);
};

export const clearAllHistory = (type?: HistoryItemType): void => {
  let updated: HistoryItem[];
  if (type) {
    updated = getHistoryFromStorage().filter(item => item.type !== type);
  } else {
    updated = [];
  }
  saveHistoryToStorage(updated);
};

export const getHistory = (): HistoryItem[] => {
  return getHistoryFromStorage();
};
