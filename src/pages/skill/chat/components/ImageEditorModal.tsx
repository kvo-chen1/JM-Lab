import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ImageEditor from '@/components/ImageEditor';

interface ImageEditorModalProps {
  isOpen: boolean;
  imageUrl: string;
  workId: string;
  onClose: () => void;
  onSave: (editedImageUrl: string) => void;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  imageUrl,
  workId,
  onClose,
  onSave,
}) => {
  const { isDark } = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async (editedImageUrl: string) => {
    setIsSaving(true);
    try {
      await onSave(editedImageUrl);
      toast.success('图片已保存');
      onClose();
    } catch (error) {
      console.error('保存图片失败:', error);
      toast.error('保存图片失败');
    } finally {
      setIsSaving(false);
    }
  }, [onSave, onClose]);

  const handleCancel = useCallback(() => {
    if (isSaving) return;
    onClose();
  }, [isSaving, onClose]);

  // 处理点击背景关闭
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSaving) {
      onClose();
    }
  }, [isSaving, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={handleBackdropClick}
        >
          {/* 背景遮罩 */}
          <div className={`absolute inset-0 ${isDark ? 'bg-black/90' : 'bg-black/80'}`} />

          {/* 关闭按钮 */}
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors ${
              isDark
                ? 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700'
                : 'bg-white/80 text-gray-600 hover:text-gray-900 hover:bg-white'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <X className="w-5 h-5" />
          </button>

          {/* 保存中遮罩 */}
          {isSaving && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className={`flex flex-col items-center gap-3 p-6 rounded-2xl ${
                isDark ? 'bg-gray-900' : 'bg-white'
              }`}>
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  保存中...
                </span>
              </div>
            </div>
          )}

          {/* 编辑器容器 */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full h-full max-w-[95vw] max-h-[95vh] m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <ImageEditor
              imageUrl={imageUrl}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageEditorModal;
