import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { Loader2, X, Check, Edit3, Maximize2 } from 'lucide-react';
import InlineImageEditor from '@/pages/skill/chat/components/InlineImageEditor';
import ImageEditorModal from '@/pages/skill/chat/components/ImageEditorModal';
import { useCreateStore } from '../hooks/useCreateStore';

interface PreviewImageEditorProps {
  imageUrl: string;
  imageId: number;
  editingMode: 'inline' | 'modal' | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PreviewImageEditor: React.FC<PreviewImageEditorProps> = ({
  imageUrl,
  imageId,
  editingMode,
  isOpen,
  onClose,
}) => {
  const { isDark } = useTheme();
  const [mode, setMode] = useState<'inline' | 'modal' | null>(editingMode);
  
  // 当外部 editingMode 变化时更新内部 mode
   useEffect(() => {
     if (editingMode) {
       setMode(editingMode);
     }
   }, [editingMode]);
  const [isSaving, setIsSaving] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string>(imageUrl);
  
  const stopImageEditing = useCreateStore((state) => state.stopImageEditing);
  const updateEditedImage = useCreateStore((state) => state.updateEditedImage);
  const updateGeneratedResultThumbnail = useCreateStore((state) => state.updateGeneratedResultThumbnail);

  // 处理内联编辑器图片变化
  const handleInlineChange = useCallback((editedUrl: string) => {
    setEditedImageUrl(editedUrl);
  }, []);

  // 处理保存
  const handleSave = useCallback(async (finalImageUrl: string) => {
    setIsSaving(true);
    try {
      // 如果图片是 base64 格式，需要上传
      if (finalImageUrl.startsWith('data:')) {
        const uploadedUrl = await updateEditedImage(imageId, finalImageUrl);
        toast.success('图片已保存并上传');
        handleClose();
        return uploadedUrl;
      } else {
        // 如果已经是 URL，直接更新
        updateGeneratedResultThumbnail(imageId, finalImageUrl);
        toast.success('图片已更新');
        handleClose();
        return finalImageUrl;
      }
    } catch (error) {
      console.error('保存图片失败:', error);
      toast.error('保存图片失败，请重试');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [imageId, updateEditedImage, updateGeneratedResultThumbnail]);

  // 处理关闭
  const handleClose = useCallback(() => {
    setMode(null);
    stopImageEditing();
    onClose();
  }, [stopImageEditing, onClose]);

  // 选择编辑模式
  const selectMode = useCallback((selectedMode: 'inline' | 'modal') => {
    setMode(selectedMode);
    setEditedImageUrl(imageUrl);
  }, [imageUrl]);

  if (!isOpen) return null;

  // 模式选择界面 - 使用 createPortal 渲染到 body
  if (!mode) {
    const modalContent = (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2147483647] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[10vh]"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 ${
            isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              选择编辑模式
            </h3>
            <button
              onClick={handleClose}
              className={`p-1 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* 快速编辑 */}
            <button
              onClick={() => selectMode('inline')}
              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                isDark
                  ? 'border-gray-700 hover:border-purple-500 bg-gray-800/50'
                  : 'border-gray-200 hover:border-purple-500 bg-gray-50'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-purple-500/20' : 'bg-purple-100'
              }`}>
                <Edit3 className="w-6 h-6 text-purple-500" />
              </div>
              <div className="text-left">
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  快速编辑
                </h4>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  在预览区域下方快速调整
                </p>
              </div>
            </button>

            {/* 高级编辑 */}
            <button
              onClick={() => selectMode('modal')}
              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                isDark
                  ? 'border-gray-700 hover:border-blue-500 bg-gray-800/50'
                  : 'border-gray-200 hover:border-blue-500 bg-gray-50'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}>
                <Maximize2 className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-left">
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  高级编辑
                </h4>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  全屏专业编辑器
                </p>
              </div>
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
    
    // 使用 portal 渲染到 body，避免父容器 transform 影响
    if (typeof document !== 'undefined') {
      return ReactDOM.createPortal(modalContent, document.body);
    }
    return modalContent;
  }

  // 内联编辑模式
  if (mode === 'inline') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`w-full rounded-xl border overflow-hidden ${
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        {/* 内联编辑器头部 */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            快速编辑
          </h4>
          <div className="flex items-center gap-2">
            {isSaving ? (
              <div className="flex items-center gap-2 text-purple-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">保存中...</span>
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleSave(editedImageUrl)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors"
                >
                  <Check className="w-4 h-4" />
                  保存
                </button>
                <button
                  onClick={handleClose}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isDark
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <X className="w-4 h-4" />
                  取消
                </button>
              </>
            )}
          </div>
        </div>

        {/* 预览区域 */}
        <div className={`p-4 flex justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
          <img
            src={editedImageUrl}
            alt="编辑预览"
            className="max-h-64 object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* 内联编辑器 */}
        <InlineImageEditor
          imageUrl={imageUrl}
          onChange={handleInlineChange}
          onSave={(url) => handleSave(url)}
          onCancel={handleClose}
        />
      </motion.div>
    );
  }

  // 模态框编辑模式
  return (
    <ImageEditorModal
      isOpen={mode === 'modal'}
      imageUrl={imageUrl}
      workId={String(imageId)}
      onClose={handleClose}
      onSave={handleSave}
    />
  );
};

export default PreviewImageEditor;
