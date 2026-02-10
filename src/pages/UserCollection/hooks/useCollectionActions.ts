import { useState, useCallback } from 'react';
import {
  collectionService,
  CollectionType,
} from '@/services/collectionService';
import { UseCollectionActionsReturn } from '../types/collection';

export function useCollectionActions(): UseCollectionActionsReturn {
  const [isToggling, setIsToggling] = useState(false);

  const toggleBookmark = useCallback(async (
    id: string,
    type: CollectionType
  ): Promise<boolean> => {
    if (isToggling) return false;

    setIsToggling(true);
    try {
      const result = await collectionService.toggleBookmark(id, type);
      return result;
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      return false;
    } finally {
      setIsToggling(false);
    }
  }, [isToggling]);

  const toggleLike = useCallback(async (
    id: string,
    type: CollectionType
  ): Promise<boolean> => {
    if (isToggling) return false;

    setIsToggling(true);
    try {
      const result = await collectionService.toggleLike(id, type);
      return result;
    } catch (error) {
      console.error('切换点赞状态失败:', error);
      return false;
    } finally {
      setIsToggling(false);
    }
  }, [isToggling]);

  return {
    toggleBookmark,
    toggleLike,
    isToggling,
  };
}
