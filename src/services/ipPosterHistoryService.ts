/**
 * IP 海报生成历史记录服务
 * 管理用户生成的海报历史记录
 */

import type { IPPosterGenerationParams } from './ipPosterGenerationService';

// 历史记录项
export interface IPPosterHistoryItem {
  id: string;
  characterName: string;
  characterDescription: string;
  thumbnail: string;
  images: {
    mainPoster?: string;
    threeViews?: string;
    emojiSheet?: string;
    actionSheet?: string;
    colorPalette?: string;
    merchandiseMockup?: string;
  };
  params: IPPosterGenerationParams;
  createdAt: string;
  updatedAt: string;
}

// 存储键名
const STORAGE_KEY = 'ip_poster_history';
const MAX_HISTORY_ITEMS = 50; // 最多保存 50 条记录

/**
 * 获取所有历史记录
 */
export function getHistory(): IPPosterHistoryItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const history = JSON.parse(data) as IPPosterHistoryItem[];
    // 按时间倒序排列
    return history.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('[IP Poster History] Failed to get history:', error);
    return [];
  }
}

/**
 * 添加历史记录
 */
export function addHistory(
  params: IPPosterGenerationParams,
  images: IPPosterHistoryItem['images']
): IPPosterHistoryItem {
  try {
    const history = getHistory();
    
    // 创建新记录
    const newItem: IPPosterHistoryItem = {
      id: generateId(),
      characterName: params.characterName,
      characterDescription: params.characterDescription,
      thumbnail: images.mainPoster || images.threeViews || '',
      images,
      params,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // 添加到开头
    history.unshift(newItem);
    
    // 限制数量
    if (history.length > MAX_HISTORY_ITEMS) {
      history.splice(MAX_HISTORY_ITEMS);
    }
    
    // 保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    
    return newItem;
  } catch (error) {
    console.error('[IP Poster History] Failed to add history:', error);
    throw error;
  }
}

/**
 * 删除历史记录
 */
export function deleteHistory(id: string): boolean {
  try {
    const history = getHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('[IP Poster History] Failed to delete history:', error);
    return false;
  }
}

/**
 * 清空历史记录
 */
export function clearHistory(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('[IP Poster History] Failed to clear history:', error);
    return false;
  }
}

/**
 * 根据 ID 获取历史记录
 */
export function getHistoryById(id: string): IPPosterHistoryItem | null {
  try {
    const history = getHistory();
    return history.find(item => item.id === id) || null;
  } catch (error) {
    console.error('[IP Poster History] Failed to get history by id:', error);
    return null;
  }
}

/**
 * 搜索历史记录
 */
export function searchHistory(query: string): IPPosterHistoryItem[] {
  try {
    const history = getHistory();
    const lowerQuery = query.toLowerCase();
    return history.filter(item =>
      item.characterName.toLowerCase().includes(lowerQuery) ||
      item.characterDescription.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('[IP Poster History] Failed to search history:', error);
    return [];
  }
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `ipp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default {
  getHistory,
  addHistory,
  deleteHistory,
  clearHistory,
  getHistoryById,
  searchHistory,
};
