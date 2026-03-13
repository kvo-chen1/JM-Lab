import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  CheckSquare,
  Square,
  FolderPlus,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { CollectionItem, CollectionType } from '@/services/collectionService';
import { CollectionFolder } from '@/types/collectionFolder';
import { collectionFolderService } from '@/services/collectionFolderService';
import { toast } from 'sonner';

interface BatchActionsBarProps {
  selectedItems: CollectionItem[];
  folders: CollectionFolder[];
  onClearSelection: () => void;
  onRemoveFromFolder?: (items: CollectionItem[]) => void;
  onComplete?: () => void;
}

export default function BatchActionsBar({
  selectedItems,
  folders,
  onClearSelection,
  onRemoveFromFolder,
  onComplete,
}: BatchActionsBarProps) {
  const { isDark } = useTheme();
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddToFolder = async (folderId: string) => {
    if (selectedItems.length === 0) return;

    setIsProcessing(true);
    const items = selectedItems.map(item => ({
      id: item.id,
      type: item.type,
    }));

    const count = await collectionFolderService.batchAddToFolder(folderId, items);
    setIsProcessing(false);

    if (count > 0) {
      setShowFolderPicker(false);
      onClearSelection();
      onComplete?.();
    }
  };

  const handleRemove = () => {
    if (onRemoveFromFolder) {
      onRemoveFromFolder(selectedItems);
    }
  };

  if (selectedItems.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}
    >
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
        isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
      }`}>
        <CheckSquare className="w-4 h-4" />
        <span className="font-medium">{selectedItems.length}</span>
        <span className="text-sm">已选择</span>
      </div>

      <div className={`w-px h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />

      <div className="flex items-center gap-2">
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFolderPicker(!showFolderPicker)}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            添加到收藏夹
          </motion.button>

          <AnimatePresence>
            {showFolderPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`absolute bottom-full mb-2 left-0 w-64 max-h-64 overflow-y-auto rounded-xl shadow-xl ${
                  isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}
              >
                <div className="p-2">
                  {folders.length === 0 ? (
                    <div className={`py-4 text-center text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      暂无收藏夹
                    </div>
                  ) : (
                    folders.map(folder => (
                      <button
                        key={folder.id}
                        onClick={() => handleAddToFolder(folder.id)}
                        disabled={isProcessing}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                          isDark
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {folder.cover_image ? (
                          <img
                            src={folder.cover_image}
                            alt={folder.name}
                            className="w-6 h-6 rounded object-cover"
                          />
                        ) : (
                          <div className={`w-6 h-6 rounded flex items-center justify-center ${
                            isDark ? 'bg-gray-600' : 'bg-gray-200'
                          }`}>
                            <FolderPlus className="w-3 h-3" />
                          </div>
                        )}
                        <span className="flex-1 truncate text-sm">{folder.name}</span>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {folder.item_count}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {onRemoveFromFolder && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRemove}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400'
                : 'bg-red-50 hover:bg-red-100 text-red-600'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            移除
          </motion.button>
        )}
      </div>

      <button
        onClick={onClearSelection}
        className={`p-1.5 rounded-lg transition-colors ${
          isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
        }`}
      >
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  );
}
