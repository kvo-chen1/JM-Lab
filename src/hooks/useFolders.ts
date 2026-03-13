import { useState, useCallback, useEffect } from 'react';
import { collectionFolderService } from '@/services/collectionFolderService';
import {
  CollectionFolder,
  CreateFolderData,
  UpdateFolderData,
  FolderStats,
} from '@/types/collectionFolder';

export function useFolders() {
  const [folders, setFolders] = useState<CollectionFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFolders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await collectionFolderService.getFolders();
      setFolders(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('获取收藏夹失败'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = useCallback(async (data: CreateFolderData) => {
    const folder = await collectionFolderService.createFolder(data);
    if (folder) {
      setFolders(prev => [...prev, folder]);
    }
    return folder;
  }, []);

  const updateFolder = useCallback(async (folderId: string, data: UpdateFolderData) => {
    const folder = await collectionFolderService.updateFolder(folderId, data);
    if (folder) {
      setFolders(prev => prev.map(f => f.id === folderId ? folder : f));
    }
    return folder;
  }, []);

  const deleteFolder = useCallback(async (folderId: string) => {
    const success = await collectionFolderService.deleteFolder(folderId);
    if (success) {
      setFolders(prev => prev.filter(f => f.id !== folderId));
    }
    return success;
  }, []);

  const reorderFolders = useCallback(async (folderIds: string[]) => {
    const success = await collectionFolderService.reorderFolders(folderIds);
    if (success) {
      setFolders(prev => {
        const folderMap = new Map(prev.map(f => [f.id, f]));
        return folderIds
          .map(id => folderMap.get(id))
          .filter((f): f is CollectionFolder => !!f)
          .map((f, index) => ({ ...f, sort_order: index }));
      });
    }
    return success;
  }, []);

  return {
    folders,
    isLoading,
    error,
    refetch: fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    reorderFolders,
  };
}

export function useFolderStats() {
  const [stats, setStats] = useState<FolderStats>({
    total_folders: 0,
    total_items: 0,
    public_folders: 0,
    total_views: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await collectionFolderService.getFolderStats();
      setStats(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, refetch: fetchStats };
}
