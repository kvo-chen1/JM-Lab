import { HistoryItem, HistoryItemType, HistoryMediaType } from '@/types/history';
import { userStateService } from '@/services/userStateService';

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

// 同步到数据库的防抖函数
let syncTimeout: NodeJS.Timeout | null = null;
const syncToDatabase = (items: HistoryItem[]) => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = setTimeout(() => {
    userStateService.saveBrowseHistory(items).catch(err => {
      console.error('[BrowseHistory] Failed to sync to database:', err);
    });
  }, 2000); // 2秒后同步，避免频繁写入
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
  
  // 同步到数据库
  syncToDatabase(updated);
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
    thumbnail: work.thumbnail,
    videoUrl: work.videoUrl,
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
    thumbnail: template.previewUrl,
    videoUrl: template.videoUrl,
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
    thumbnail: post.thumbnail,
    videoUrl: post.videoUrl,
    url: `/community/post/${post.id}`,
    creator: post.creator
  });
};

export const removeHistoryItem = (id: string): void => {
  const history = getHistoryFromStorage();
  const updated = history.filter(item => item.id !== id);
  saveHistoryToStorage(updated);
  
  // 同步到数据库
  syncToDatabase(updated);
};

export const clearAllHistory = (type?: HistoryItemType): void => {
  let updated: HistoryItem[];
  if (type) {
    updated = getHistoryFromStorage().filter(item => item.type !== type);
  } else {
    updated = [];
  }
  saveHistoryToStorage(updated);
  
  // 同步到数据库
  syncToDatabase(updated);
};

export const getHistory = (): HistoryItem[] => {
  return getHistoryFromStorage();
};

// 从数据库加载浏览历史
export const loadHistoryFromDatabase = async (): Promise<HistoryItem[]> => {
  try {
    const cloudHistory = await userStateService.getBrowseHistory();
    if (cloudHistory && cloudHistory.length > 0) {
      // 合并本地和云端的历史记录
      const localHistory = getHistoryFromStorage();
      const merged = [...localHistory];
      
      for (const item of cloudHistory) {
        if (!merged.find(h => h.url === item.url)) {
          merged.push(item);
        }
      }
      
      // 按时间排序并限制数量
      const sorted = merged
        .sort((a, b) => (b.viewedAt || 0) - (a.viewedAt || 0))
        .slice(0, MAX_ITEMS);
      
      saveHistoryToStorage(sorted);
      return sorted;
    }
    return getHistoryFromStorage();
  } catch (error) {
    console.error('[BrowseHistory] Failed to load from database:', error);
    return getHistoryFromStorage();
  }
};
