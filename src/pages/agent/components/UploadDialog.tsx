import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { X, Upload, Trash2 } from 'lucide-react';
import { uploadImages } from '../services/uploadService';

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (urls: { url: string; name: string; size: number }[]) => void;
}

export default function UploadDialog({
  isOpen,
  onClose,
  onUploadComplete
}: UploadDialogProps) {
  const { isDark } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);

  // 处理文件选择
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setPreviewFiles(prev => [...prev, ...fileArray]);
  }, []);

  // 处理拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    await handleFileSelect(files);
  }, [handleFileSelect]);

  // 处理上传
  const handleUpload = async () => {
    if (previewFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const results = await uploadImages(previewFiles, setUploadProgress);
      onUploadComplete(results);
      setPreviewFiles([]);
      onClose();
    } catch (error) {
      console.error('[Upload] Failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // 移除预览文件
  const removePreviewFile = (index: number) => {
    setPreviewFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={e => e.stopPropagation()}
          className={`w-full max-w-lg rounded-2xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } shadow-2xl overflow-hidden`}
        >
          {/* 头部 */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              上传参考图片
            </h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 内容 */}
          <div className="p-6">
            {/* 拖拽上传区域 */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#C02C38] bg-[#C02C38]/10'
                  : isDark
                  ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <input
                id="file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={e => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <Upload className={`w-12 h-12 mx-auto mb-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <p className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                拖拽图片到此处，或点击选择文件
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                支持 JPG、PNG、GIF、WebP 格式，最大 10MB
              </p>
            </div>

            {/* 预览列表 */}
            {previewFiles.length > 0 && (
              <div className="mt-4">
                <h4 className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  待上传（{previewFiles.length}）
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {previewFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className={`aspect-square rounded-lg overflow-hidden ${
                        isDark ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removePreviewFile(index)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <p className={`text-xs mt-1 truncate ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {(file.size / 1024).toFixed(1)}KB
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 上传进度 */}
            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    上传中...
                  </span>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {uploadProgress}%
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#C02C38] to-[#E85D75]"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className={`flex justify-end gap-3 p-4 border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              取消
            </button>
            <button
              onClick={handleUpload}
              disabled={previewFiles.length === 0 || isUploading}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                previewFiles.length === 0 || isUploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#C02C38] to-[#E85D75] hover:shadow-lg'
              }`}
            >
              {isUploading ? '上传中...' : `上传 (${previewFiles.length})`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
