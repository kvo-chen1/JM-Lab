import { useState, useEffect, useMemo } from 'react';
import { HistoryItem, HistoryItemType, HistoryGroup, HistoryFilter } from '@/types/history';
import { getHistory, removeHistoryItem, clearAllHistory, addHistory } from '@/utils/browseHistory';

export function useBrowseHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const data = getHistory();
    setHistory(data);
    setIsLoaded(true);
    
    const interval = setInterval(() => {
      const data = getHistory();
      setHistory(data);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const addHistoryRecord = (item: Omit<HistoryItem, 'id' | 'viewedAt'>) => {
    addHistory(item);
    const data = getHistory();
    setHistory(data);
  };

  const removeHistory = (id: string) => {
    removeHistoryItem(id);
    const data = getHistory();
    setHistory(data);
  };

  const clearHistory = (type?: HistoryItemType) => {
    clearAllHistory(type);
    const data = getHistory();
    setHistory(data);
  };

  const groupedHistory = useMemo((): HistoryGroup[] => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const groups: Map<string, HistoryItem[]> = new Map();

    history.forEach(item => {
      const itemDate = new Date(item.viewedAt);
      const itemDayStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      const dayDiff = Math.floor((now - itemDayStart.getTime()) / dayMs);

      let label: string;
      if (dayDiff === 0) {
        label = '今天';
      } else if (dayDiff === 1) {
        label = '昨天';
      } else if (dayDiff < 7) {
        label = `${dayDiff}天前`;
      } else if (dayDiff < 30) {
        label = `${Math.floor(dayDiff / 7)}周前`;
      } else {
        label = itemDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
      }

      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)!.push(item);
    });

    return Array.from(groups.entries()).map(([label, items]) => ({
      label,
      items
    }));
  }, [history]);

  const searchHistory = (query: string): HistoryItem[] => {
    if (!query.trim()) return history;
    const lowerQuery = query.toLowerCase();
    return history.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery) ||
      item.creator?.name.toLowerCase().includes(lowerQuery)
    );
  };

  const totalCount = useMemo(() => history.length, [history]);
  const workCount = useMemo(() => history.filter(h => h.type === 'work').length, [history]);
  const templateCount = useMemo(() => history.filter(h => h.type === 'template').length, [history]);
  const postCount = useMemo(() => history.filter(h => h.type === 'post').length, [history]);

  return {
    history,
    isLoaded,
    addHistory: addHistoryRecord,
    removeHistory,
    clearHistory,
    groupedHistory,
    searchHistory,
    totalCount,
    workCount,
    templateCount,
    postCount
  };
}
