import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Play } from 'lucide-react';
import { FileTypeIcon, FileTypeBadge, getFileCategory, formatFileSize } from './FileTypeIcon';

interface FilePreviewCardProps {
  file: File;
  index: number;
  onRemove: (index: number) => void;
  onPreview?: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export function FilePreviewCard({
  file,
  index,
  onRemove,
  onPreview,
  isUploading = false,
  uploadProgress = 0
}: FilePreviewCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const category = getFileCategory(file.type, file.name);

  // 生成预览URL
  React.useEffect(() => {
    if (category === 'image' || category === 'video' || category === 'audio') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const renderPreview = () => {
    if (category === 'image' && previewUrl) {
      return (
        <div className="relative w-full h-full">
          <img
            src={previewUrl}
            alt={file.name}
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg" />
        </div>
      );
    }

    if (category === 'video' && previewUrl) {
      return (
        <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
          <video
            src={previewUrl}
            className="w-full h-full object-contain"
            controls={isPlaying}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaying(true);
                }}
                className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
              >
                <Play className="w-6 h-6 text-gray-900 ml-0.5" />
              </button>
            </div>
          )}
        </div>
      );
    }

    if (category === 'audio' && previewUrl) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4">
          <FileTypeIcon type={file.type} name={file.name} size="xl" />
          <audio
            src={previewUrl}
            controls
            className="w-full mt-3 h-8"
          />
        </div>
      );
    }

    // 默认文件展示
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <FileTypeIcon type={file.type} name={file.name} size="xl" />
        <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400 line-clamp-2">
          {file.name}
        </p>
      </div>
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`
        relative overflow-hidden rounded-xl border-2 transition-all duration-200
        ${isHovered ? 'border-red-400 shadow-lg' : 'border-gray-200 dark:border-gray-700'}
        ${category === 'image' || category === 'video' ? 'aspect-video' : 'aspect-square'}
        bg-white dark:bg-gray-800
      `}>
        {/* 预览内容 */}
        {renderPreview()}

        {/* 悬停遮罩 */}
        <AnimatePresence>
          {isHovered && !isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2"
            >
              {(category === 'image' || category === 'video') && onPreview && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(file);
                  }}
                  className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-900 transition-colors"
                  title="预览"
                >
                  <Eye className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                title="删除"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 上传进度 */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-white/30 border-t-white animate-spin" />
            <span className="mt-2 text-white text-sm font-medium">{uploadProgress}%</span>
          </div>
        )}

        {/* 文件类型标签 */}
        <div className="absolute top-2 left-2">
          <FileTypeBadge type={file.type} name={file.name} />
        </div>

        {/* 文件大小 */}
        <div className="absolute bottom-2 right-2">
          <span className="px-2 py-0.5 rounded bg-black/60 text-white text-xs">
            {formatFileSize(file.size)}
          </span>
        </div>
      </div>

      {/* 文件名 */}
      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 truncate px-1">
        {file.name}
      </p>
    </motion.div>
  );
}

// 文件列表视图
interface FileListItemProps {
  file: File;
  index: number;
  onRemove: (index: number) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export function FileListItem({
  file,
  index,
  onRemove,
  isUploading = false,
  uploadProgress = 0
}: FileListItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 transition-colors"
    >
      <div className="flex-shrink-0">
        <FileTypeIcon type={file.type} name={file.name} size="lg" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {file.name}
          </p>
          <FileTypeBadge type={file.type} name={file.name} />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(file.size)}
        </p>

        {/* 上传进度条 */}
        {isUploading && (
          <div className="mt-2">
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs text-gray-500 mt-0.5">{uploadProgress}%</span>
          </div>
        )}
      </div>

      <button
        onClick={() => onRemove(index)}
        disabled={isUploading}
        className="flex-shrink-0 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default FilePreviewCard;
