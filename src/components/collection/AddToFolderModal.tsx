import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { X, FolderPlus, Check, FolderOpen } from 'lucide-react';
import { CollectionType } from '@/services/collectionService';
import { CollectionFolder } from '@/types/collectionFolder';
import { collectionFolderService } from '@/services/collectionFolderService';

interface AddToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemType: CollectionType;
  itemTitle?: string;
}

export default function AddToFolderModal({
  isOpen,
  onClose,
  itemId,
  itemType,
  itemTitle,
}: AddToFolderModalProps) {
  const { isDark } = useTheme();
  const [folders, setFolders] = useState<CollectionFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addedFolders, setAddedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen]);

  const loadFolders = async () => {
    setIsLoading(true);
    const data = await collectionFolderService.getFolders();
    setFolders(data);
    setIsLoading(false);
  };

  const handleAddToFolder = async (folderId: string) => {
    if (addedFolders.has(folderId)) return;

    setIsAdding(true);
    const success = await collectionFolderService.addToFolder({
      folder_id: folderId,
      item_id: itemId,
      item_type: itemType,
    });
    
    if (success) {
      setAddedFolders(prev => new Set([...prev, folderId]));
    }
    setIsAdding(false);
  };

  const handleCreateAndAdd = async () => {
    const name = prompt('请输入收藏夹名称');
    if (!name) return;

    const folder = await collectionFolderService.createFolder({ name });
    if (folder) {
      await handleAddToFolder(folder.id);
      loadFolders();
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
            <FolderPlus className="w-5 h-5" />
            添加到收藏夹
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
              <p className="text-sm">暂无收藏夹</p>
              <button
                onClick={handleCreateAndAdd}
                className={`mt-2 text-sm font-medium ${
                  isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                创建收藏夹
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {folders.map((folder) => {
                const isAdded = addedFolders.has(folder.id);
                return (
                  <motion.button
                    key={folder.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleAddToFolder(folder.id)}
                    disabled={isAdded || isAdding}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isAdded
                        ? isDark
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-green-50 text-green-600'
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
                    {isAdded && (
                      <Check className="w-5 h-5" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={handleCreateAndAdd}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            创建新收藏夹
          </button>
        </div>
      </motion.div>
    </div>
  );
}
