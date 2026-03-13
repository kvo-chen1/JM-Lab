import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { X, FolderPlus, Image, Lock, Globe } from 'lucide-react';
import { CreateFolderData, FolderVisibility } from '@/types/collectionFolder';

interface FolderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateFolderData) => Promise<boolean>;
}

export default function FolderCreateModal({ isOpen, onClose, onCreate }: FolderCreateModalProps) {
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [visibility, setVisibility] = useState<FolderVisibility>(FolderVisibility.PRIVATE);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    const success = await onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      cover_image: coverImage.trim() || undefined,
      visibility,
    });
    setIsCreating(false);

    if (success) {
      setName('');
      setDescription('');
      setCoverImage('');
      setVisibility(FolderVisibility.PRIVATE);
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
        className={`relative w-full max-w-md mx-4 rounded-2xl shadow-xl ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            创建收藏夹
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

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              收藏夹名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入收藏夹名称"
              maxLength={100}
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加描述（可选）"
              rows={3}
              maxLength={500}
              className={`w-full px-3 py-2 rounded-lg border transition-colors resize-none ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              封面图片
            </label>
            <div className="flex gap-3">
              {coverImage ? (
                <div className="relative w-20 h-20">
                  <img
                    src={coverImage}
                    alt="封面预览"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className={`w-20 h-20 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <Image className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
              )}
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="输入图片URL"
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              可见性
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setVisibility(FolderVisibility.PRIVATE)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                  visibility === FolderVisibility.PRIVATE
                    ? isDark
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : 'border-blue-500 bg-blue-50 text-blue-600'
                    : isDark
                      ? 'border-gray-600 hover:border-gray-500 text-gray-300'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                }`}
              >
                <Lock className="w-4 h-4" />
                私有
              </button>
              <button
                type="button"
                onClick={() => setVisibility(FolderVisibility.PUBLIC)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                  visibility === FolderVisibility.PUBLIC
                    ? isDark
                      ? 'border-green-500 bg-green-500/20 text-green-400'
                      : 'border-green-500 bg-green-50 text-green-600'
                    : isDark
                      ? 'border-gray-600 hover:border-gray-500 text-gray-300'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                }`}
              >
                <Globe className="w-4 h-4" />
                公开
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isCreating}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                name.trim() && !isCreating
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : isDark
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isCreating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FolderPlus className="w-4 h-4" />
                  创建
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
