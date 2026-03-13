import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { X, ArrowRight, FolderOpen } from 'lucide-react';
import { CollectionType } from '@/services/collectionService';
import { CollectionFolder } from '@/types/collectionFolder';
import { collectionFolderService } from '@/services/collectionFolderService';

interface MoveItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemType: CollectionType;
  currentFolderId: string;
  itemTitle?: string;
  onMoved?: () => void;
}

export default function MoveItemModal({
  isOpen,
  onClose,
  itemId,
  itemType,
  currentFolderId,
  itemTitle,
  onMoved,
}: MoveItemModalProps) {
  const { isDark } = useTheme();
  const [folders, setFolders] = useState<CollectionFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen]);

  const loadFolders = async () => {
    setIsLoading(true);
    const data = await collectionFolderService.getFolders();
    setFolders(data.filter(f => f.id !== currentFolderId));
    setIsLoading(false);
  };

  const handleMove = async () => {
    if (!selectedFolderId) return;

    setIsMoving(true);
    const success = await collectionFolderService.moveItem({
      source_folder_id: currentFolderId,
      target_folder_id: selectedFolderId,
      item_id: itemId,
      item_type: itemType,
    });
    setIsMoving(false);

    if (success) {
      onMoved?.();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative w-full max-w-sm mx-4 rounded-2xl shadow-xl ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <ArrowRight className="w-5 h-5" />
            移动到收藏夹
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {itemTitle && (
          <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-sm truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {itemTitle}
            </p>
          </div>
        )}

        <div className="p-2 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto ${
                isDark ? 'border-blue-500' : 'border-blue-600'
              }`} />
            </div>
          ) : folders.length === 0 ? (
            <div className={`py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">没有其他收藏夹</p>
            </div>
          ) : (
            <div className="space-y-1">
              {folders.map((folder) => (
                <motion.button
                  key={folder.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    selectedFolderId === folder.id
                      ? isDark
                        ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500'
                        : 'bg-blue-50 text-blue-600 ring-1 ring-blue-500'
                      : isDark
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {folder.cover_image ? (
                    <img
                      src={folder.cover_image}
                      alt={folder.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${
                      isDark ? 'bg-gray-600' : 'bg-gray-200'
                    }`}>
                      <FolderOpen className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{folder.name}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {folder.item_count} 个作品
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={handleMove}
            disabled={!selectedFolderId || isMoving}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              selectedFolderId && !isMoving
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : isDark
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isMoving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                移动
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
