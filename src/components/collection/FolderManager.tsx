import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  FolderPlus,
  FolderOpen,
  MoreVertical,
  Edit2,
  Trash2,
  Lock,
  Globe,
  Share2,
  GripVertical,
  Image,
} from 'lucide-react';
import { CollectionFolder, FolderVisibility } from '@/types/collectionFolder';
import { useFolders } from '@/hooks/useFolders';
import FolderCreateModal from './FolderCreateModal';
import FolderEditModal from './FolderEditModal';
import FolderShareModal from './FolderShareModal';
import DeleteConfirmModal from './DeleteConfirmModal';

interface FolderManagerProps {
  onSelectFolder?: (folderId: string | null) => void;
  selectedFolderId?: string | null;
}

export default function FolderManager({ onSelectFolder, selectedFolderId }: FolderManagerProps) {
  const { isDark } = useTheme();
  const { folders, isLoading, createFolder, updateFolder, deleteFolder, reorderFolders, refetch } = useFolders();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<CollectionFolder | null>(null);
  const [sharingFolder, setSharingFolder] = useState<CollectionFolder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<CollectionFolder | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);

  const handleDragStart = (folderId: string) => {
    setDraggedItem(folderId);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    if (draggedItem !== folderId) {
      setDragOverItem(folderId);
    }
  };

  const handleDrop = async (targetFolderId: string) => {
    if (!draggedItem || draggedItem === targetFolderId) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const currentFolders = [...folders];
    const draggedIndex = currentFolders.findIndex(f => f.id === draggedItem);
    const targetIndex = currentFolders.findIndex(f => f.id === targetFolderId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [removed] = currentFolders.splice(draggedIndex, 1);
      currentFolders.splice(targetIndex, 0, removed);
      await reorderFolders(currentFolders.map(f => f.id));
    }

    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDeleteFolder = async () => {
    if (deletingFolder) {
      const success = await deleteFolder(deletingFolder.id);
      if (success) {
        setDeletingFolder(null);
        if (selectedFolderId === deletingFolder.id) {
          onSelectFolder?.(null);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-12 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            我的收藏夹
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            新建
          </motion.button>
        </div>
      </div>

      <div className="p-2">
        <motion.button
          onClick={() => onSelectFolder?.(null)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
            selectedFolderId === null
              ? isDark
                ? 'bg-blue-600/20 text-blue-400'
                : 'bg-blue-50 text-blue-600'
              : isDark
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <FolderOpen className="w-5 h-5" />
          <span className="flex-1">全部收藏</span>
        </motion.button>

        <AnimatePresence>
          {folders.map((folder) => (
            <motion.div
              key={folder.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              draggable
              onDragStart={() => handleDragStart(folder.id)}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDrop={() => handleDrop(folder.id)}
              onDragEnd={() => {
                setDraggedItem(null);
                setDragOverItem(null);
              }}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                selectedFolderId === folder.id
                  ? isDark
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'bg-blue-50 text-blue-600'
                  : dragOverItem === folder.id
                    ? isDark
                      ? 'bg-gray-700 border-2 border-dashed border-blue-500'
                      : 'bg-gray-100 border-2 border-dashed border-blue-500'
                    : isDark
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-50 text-gray-700'
              }`}
              onClick={() => onSelectFolder?.(folder.id)}
            >
              <GripVertical className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
              
              {folder.cover_image ? (
                <img
                  src={folder.cover_image}
                  alt={folder.name}
                  className="w-5 h-5 rounded object-cover"
                />
              ) : (
                <div className={`w-5 h-5 rounded flex items-center justify-center ${
                  isDark ? 'bg-gray-600' : 'bg-gray-200'
                }`}>
                  <Image className="w-3 h-3" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{folder.name}</p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {folder.item_count} 个作品
                </p>
              </div>

              <div className="flex items-center gap-1">
                {folder.visibility === FolderVisibility.PUBLIC ? (
                  <Globe className={`w-3.5 h-3.5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                ) : (
                  <Lock className={`w-3.5 h-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                )}
                
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === folder.id ? null : folder.id);
                    }}
                    className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                      isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                    }`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {activeMenu === folder.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`absolute right-0 top-full mt-1 z-10 w-36 py-1 rounded-lg shadow-lg ${
                          isDark ? 'bg-gray-700' : 'bg-white border border-gray-200'
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFolder(folder);
                            setActiveMenu(null);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${
                            isDark ? 'hover:bg-gray-600 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <Edit2 className="w-4 h-4" />
                          编辑
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSharingFolder(folder);
                            setActiveMenu(null);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${
                            isDark ? 'hover:bg-gray-600 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <Share2 className="w-4 h-4" />
                          分享
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingFolder(folder);
                            setActiveMenu(null);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${
                            isDark ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-gray-50 text-red-600'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                          删除
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {folders.length === 0 && (
          <div className={`py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">暂无收藏夹</p>
            <p className="text-xs mt-1">点击上方"新建"创建收藏夹</p>
          </div>
        )}
      </div>

      <FolderCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={async (data) => {
          const folder = await createFolder(data);
          if (folder) {
            setShowCreateModal(false);
          }
          return !!folder;
        }}
      />

      <FolderEditModal
        folder={editingFolder}
        onClose={() => setEditingFolder(null)}
        onSave={async (data) => {
          if (editingFolder) {
            const folder = await updateFolder(editingFolder.id, data);
            if (folder) {
              setEditingFolder(null);
            }
            return !!folder;
          }
          return false;
        }}
      />

      <FolderShareModal
        folder={sharingFolder}
        onClose={() => setSharingFolder(null)}
      />

      <DeleteConfirmModal
        isOpen={!!deletingFolder}
        title="删除收藏夹"
        message={`确定要删除收藏夹"${deletingFolder?.name}"吗？删除后收藏夹内的作品将一并移除。`}
        onConfirm={handleDeleteFolder}
        onCancel={() => setDeletingFolder(null)}
      />
    </div>
  );
}
