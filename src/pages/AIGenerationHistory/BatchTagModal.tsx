import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import { aiGenerationHistoryService } from '@/services/aiGenerationHistoryService';

interface BatchTagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  mode: 'add' | 'remove';
  onSuccess: () => void;
}

export default function BatchTagModal({
  open,
  onOpenChange,
  selectedIds,
  mode,
  onSuccess,
}: BatchTagModalProps) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (open) {
      fetchExistingTags();
      setSelectedTags(new Set());
      setNewTag('');
    }
  }, [open]);

  const fetchExistingTags = async () => {
    const tags = await aiGenerationHistoryService.getTags();
    setExistingTags(tags);
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  };

  const handleAddNewTag = () => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag) return;
    
    if (trimmedTag.length > 20) {
      toast.warning('标签长度不能超过20个字符');
      return;
    }

    if (!existingTags.includes(trimmedTag)) {
      setExistingTags(prev => [...prev, trimmedTag]);
    }
    setSelectedTags(prev => new Set([...prev, trimmedTag]));
    setNewTag('');
  };

  const handleConfirm = async () => {
    if (selectedTags.size === 0) {
      toast.warning('请选择或输入标签');
      return;
    }

    setLoading(true);
    try {
      const result = await aiGenerationHistoryService.batchOperation({
        ids: selectedIds,
        operation: mode === 'add' ? 'addTags' : 'removeTags',
        tags: Array.from(selectedTags),
      });

      if (result.success) {
        onOpenChange(false);
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 rounded-2xl ${
              isDark ? 'bg-[#1E293B]' : 'bg-white'
            } shadow-2xl p-6`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {mode === 'add' ? '添加标签' : '移除标签'}
              </h2>
              <button
                onClick={() => onOpenChange(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              已选择 {selectedIds.length} 条记录
            </p>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                输入新标签
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNewTag()}
                  placeholder="输入标签名称"
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
                <button
                  onClick={handleAddNewTag}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
                >
                  添加
                </button>
              </div>
            </div>

            {existingTags.length > 0 && (
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  选择已有标签
                </label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {existingTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleToggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        selectedTags.has(tag)
                          ? 'bg-blue-600 text-white'
                          : isDark
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                      {selectedTags.has(tag) && (
                        <i className="fas fa-check ml-1.5 text-xs"></i>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedTags.size > 0 && (
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  已选择 {selectedTags.size} 个标签
                </label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedTags).map(tag => (
                    <span
                      key={tag}
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {tag}
                      <button
                        onClick={() => handleToggleTag(tag)}
                        className="ml-1.5 hover:text-red-500"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => onOpenChange(false)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || selectedTags.size === 0}
                className={`px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? '处理中...' : mode === 'add' ? '添加标签' : '移除标签'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
