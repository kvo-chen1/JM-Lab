import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FolderOpen,
  Image,
  MoreVertical,
  Move,
  Trash2,
  Eye,
  Calendar,
  CheckSquare,
  Square,
} from 'lucide-react';
import { collectionFolderService } from '@/services/collectionFolderService';
import { FolderWithItems, CollectionFolder } from '@/types/collectionFolder';
import { CollectionType, CollectionItem } from '@/services/collectionService';
import BatchActionsBar from './BatchActionsBar';
import MoveItemModal from './MoveItemModal';
import DeleteConfirmModal from './DeleteConfirmModal';

interface FolderDetailViewProps {
  folderId: string;
  onBack: () => void;
}

export default function FolderDetailView({ folderId, onBack }: FolderDetailViewProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [folder, setFolder] = useState<FolderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [movingItem, setMovingItem] = useState<{ id: string; type: CollectionType } | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; type: CollectionType } | null>(null);
  const [folders, setFolders] = useState<CollectionFolder[]>([]);

  const loadFolder = useCallback(async () => {
    setIsLoading(true);
    const data = await collectionFolderService.getFolderById(folderId);
    setFolder(data);
    setIsLoading(false);
  }, [folderId]);

  const loadFolders = useCallback(async () => {
    const data = await collectionFolderService.getFolders();
    setFolders(data);
  }, []);

  useEffect(() => {
    loadFolder();
    loadFolders();
  }, [loadFolder, loadFolders]);

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (!folder) return;
    if (selectedItems.size === folder.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(folder.items.map(i => i.id)));
    }
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const handleRemoveItems = async (items: CollectionItem[]) => {
    if (!folder) return;
    
    for (const item of items) {
      await collectionFolderService.removeFromFolder(folderId, item.id, item.type);
    }
    
    loadFolder();
    clearSelection();
  };

  const handleMoveItem = async (targetFolderId: string) => {
    if (!movingItem || !folder) return;
    
    const success = await collectionFolderService.moveItem({
      source_folder_id: folderId,
      target_folder_id: targetFolderId,
      item_id: movingItem.id,
      item_type: movingItem.type,
    });
    
    if (success) {
      loadFolder();
      setMovingItem(null);
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingItem || !folder) return;
    
    const success = await collectionFolderService.removeFromFolder(
      folderId,
      deletingItem.id,
      deletingItem.type
    );
    
    if (success) {
      loadFolder();
      setDeletingItem(null);
    }
  };

  const getItemLink = (item: { item_id: string; item_type: CollectionType }) => {
    switch (item.item_type) {
      case CollectionType.SQUARE_WORK:
        return `/works/${item.item_id}`;
      case CollectionType.COMMUNITY_POST:
        return `/post/${item.item_id}`;
      case CollectionType.ACTIVITY:
        return `/events/${item.item_id}`;
      case CollectionType.TEMPLATE:
        return `/tianjin?template=${item.item_id}`;
      default:
        return '#';
    }
  };

  const typeConfig: Record<CollectionType, { label: string; color: string }> = {
    [CollectionType.SQUARE_WORK]: { label: '广场作品', color: '#ef4444' },
    [CollectionType.COMMUNITY_POST]: { label: '社区帖子', color: '#8b5cf6' },
    [CollectionType.ACTIVITY]: { label: '活动', color: '#f59e0b' },
    [CollectionType.TEMPLATE]: { label: '模板', color: '#10b981' },
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin ${
          isDark ? 'border-blue-500' : 'border-blue-600'
        }`} />
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <FolderOpen className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>收藏夹不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {folder.name}
            </h2>
            <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="flex items-center gap-1">
                <FolderOpen className="w-4 h-4" />
                {folder.item_count} 个作品
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {folder.view_count} 次浏览
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(folder.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              isSelectionMode
                ? isDark
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-blue-50 text-blue-600'
                : isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {isSelectionMode ? (
              <>
                <CheckSquare className="w-4 h-4" />
                取消选择
              </>
            ) : (
              <>
                <Square className="w-4 h-4" />
                选择
              </>
            )}
          </button>
        </div>

        {isSelectionMode && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={toggleSelectAll}
              className={`text-sm font-medium ${
                isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              {selectedItems.size === folder.items.length ? '取消全选' : '全选'}
            </button>
            {selectedItems.size > 0 && (
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                已选择 {selectedItems.size} 项
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {folder.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Image className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>收藏夹暂无内容</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {folder.items.map((item) => {
              const config = typeConfig[item.item_type];
              const isSelected = selectedItems.has(item.id);
              
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`group relative rounded-xl overflow-hidden ${
                    isDark ? 'bg-gray-800' : 'bg-white'
                  } shadow-sm ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {isSelectionMode && (
                    <button
                      onClick={() => toggleItemSelection(item.id)}
                      className={`absolute top-2 left-2 z-10 p-1 rounded-lg ${
                        isSelected
                          ? 'bg-blue-500 text-white'
                          : isDark
                            ? 'bg-gray-700 text-gray-400'
                            : 'bg-white text-gray-500'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  <a
                    href={isSelectionMode ? '#' : getItemLink(item)}
                    target={isSelectionMode ? undefined : '_blank'}
                    rel={isSelectionMode ? undefined : 'noopener noreferrer'}
                    onClick={isSelectionMode ? (e) => e.preventDefault() : undefined}
                    className="block"
                  >
                    <div className="aspect-square relative">
                      <div className={`absolute inset-0 flex items-center justify-center ${
                        isDark ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <Image className="w-12 h-12 opacity-30" style={{ color: config.color }} />
                      </div>
                      <div className="absolute top-2 right-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: config.color }}
                        >
                          {config.label}
                        </span>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className={`text-sm font-medium truncate ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        作品 #{item.item_id}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </a>

                  {!isSelectionMode && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="relative">
                        <button
                          className={`p-1.5 rounded-lg ${
                            isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'
                          } shadow`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isSelectionMode && selectedItems.size > 0 && (
          <BatchActionsBar
            selectedItems={folder.items.filter(i => selectedItems.has(i.id)).map(i => ({
              id: i.item_id,
              type: i.item_type,
              title: `作品 #${i.item_id}`,
              thumbnail: '',
              category: '',
              createdAt: i.created_at,
              stats: { views: 0, likes: 0, comments: 0 },
              isBookmarked: true,
              isLiked: false,
              link: getItemLink(i),
            }))}
            folders={folders}
            onClearSelection={clearSelection}
            onRemoveFromFolder={handleRemoveItems}
            onComplete={loadFolder}
          />
        )}
      </AnimatePresence>

      <MoveItemModal
        isOpen={!!movingItem}
        onClose={() => setMovingItem(null)}
        itemId={movingItem?.id || ''}
        itemType={movingItem?.type || CollectionType.SQUARE_WORK}
        currentFolderId={folderId}
        onMoved={() => {
          loadFolder();
          setMovingItem(null);
        }}
      />

      <DeleteConfirmModal
        isOpen={!!deletingItem}
        title="移除作品"
        message="确定要将此作品从收藏夹中移除吗？"
        onConfirm={handleDeleteItem}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
}
