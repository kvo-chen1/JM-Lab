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

  // 专门用于收藏页面的取消收藏
  const removeBookmark = useCallback(async (
    id: string,
    type: CollectionType
  ): Promise<boolean> => {
    if (isToggling) return false;

    setIsToggling(true);
    try {
      const result = await collectionService.removeBookmark(id, type);
      return result;
    } catch (error) {
      console.error('取消收藏失败:', error);
      return false;
    } finally {
      setIsToggling(false);
    }
  }, [isToggling]);

  // 专门用于点赞页面的取消点赞
  const removeLike = useCallback(async (
    id: string,
    type: CollectionType
  ): Promise<boolean> => {
    if (isToggling) return false;

    setIsToggling(true);
    try {
      const result = await collectionService.removeLike(id, type);
      return result;
    } catch (error) {
      console.error('取消点赞失败:', error);
      return false;
    } finally {
      setIsToggling(false);
    }
  }, [isToggling]);

  return {
    toggleBookmark,
    toggleLike,
    removeBookmark,
    removeLike,
    isToggling,
  };
}
