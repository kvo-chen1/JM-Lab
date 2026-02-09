import { useState, useEffect, useCallback } from 'react';

// AI文案历史记录项接口
export interface AIWriterHistoryItem {
  id: string;
  title: string;
  templateName: string;
  templateId: string;
  content: string;
  formData: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'completed' | 'archived';
  wordCount: number;
}

const STORAGE_KEY = 'AI_WRITER_HISTORY';

export function useAIWriterHistory() {
  const [historyItems, setHistoryItems] = useState<AIWriterHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 从 localStorage 加载历史记录
  useEffect(() => {
    const loadHistory = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setHistoryItems(parsed);
        }
      } catch (error) {
        console.error('Failed to load AI writer history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  // 保存历史记录到 localStorage
  const saveToStorage = useCallback((items: AIWriterHistoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save AI writer history:', error);
    }
  }, []);

  // 添加新的历史记录
  const addHistoryItem = useCallback((item: Omit<AIWriterHistoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: AIWriterHistoryItem = {
      ...item,
      id: `aiwriter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setHistoryItems((prev) => {
      const updated = [newItem, ...prev].slice(0, 50); // 最多保留50条
      saveToStorage(updated);
      return updated;
    });

    return newItem.id;
  }, [saveToStorage]);

  // 更新历史记录
  const updateHistoryItem = useCallback((id: string, updates: Partial<AIWriterHistoryItem>) => {
    setHistoryItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      );
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // 删除历史记录
  const deleteHistoryItem = useCallback((id: string) => {
    setHistoryItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // 根据ID获取历史记录
  const getHistoryItemById = useCallback((id: string) => {
    return historyItems.find((item) => item.id === id);
  }, [historyItems]);

  // 清空所有历史记录
  const clearAllHistory = useCallback(() => {
    setHistoryItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // 搜索历史记录
  const searchHistory = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return historyItems.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.templateName.toLowerCase().includes(lowerQuery) ||
        item.content.toLowerCase().includes(lowerQuery)
    );
  }, [historyItems]);

  // 按状态筛选
  const filterByStatus = useCallback((status: AIWriterHistoryItem['status'] | 'all') => {
    if (status === 'all') return historyItems;
    return historyItems.filter((item) => item.status === status);
  }, [historyItems]);

  return {
    historyItems,
    isLoading,
    addHistoryItem,
    updateHistoryItem,
    deleteHistoryItem,
    getHistoryItemById,
    clearAllHistory,
    searchHistory,
    filterByStatus,
  };
}

export default useAIWriterHistory;
