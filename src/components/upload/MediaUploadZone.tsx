import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Cloud, AlertCircle, Image, Video, Music, FileText, Palette } from 'lucide-react';
import { FilePreviewCard, FileListItem } from './FilePreviewCard';
import { getAcceptedFileTypes, formatFileSize } from './FileTypeIcon';
import { toast } from 'sonner';

interface MediaUploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  viewMode?: 'grid' | 'list';
  uploadProgress?: Record<string, number>;
  isUploading?: boolean;
}

const fileTypeCategories = [
  { icon: Image, label: '图片', types: 'JPG, PNG, GIF, WebP, SVG', color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  { icon: Video, label: '视频', types: 'MP4, WebM, MOV', color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  { icon: Music, label: '音频', types: 'MP3, WAV, OGG', color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
  { icon: FileText, label: '文档', types: 'PDF, DOC, TXT', color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { icon: Palette, label: '设计', types: 'PSD, AI, Figma', color: 'text-pink-500', bgColor: 'bg-pink-50 dark:bg-pink-900/20' },
];

export function MediaUploadZone({
  files,
  onFilesChange,
  maxFiles = 10,
  maxFileSize = 100, // 100MB
  viewMode = 'grid',
  uploadProgress = {},
  isUploading = false
}: MediaUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragging(false);
      }
      return newCount;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // 检查文件大小
    if (file.size > maxFileSize * 1024 * 1024) {
      return { valid: false, error: `文件 "${file.name}" 超过 ${maxFileSize}MB 限制` };
    }

    // 检查文件类型
    const acceptedTypes = getAcceptedFileTypes().split(',');
    const isAccepted = acceptedTypes.some(type => {
      if (type.includes('*')) {
        const category = type.split('/')[0];
        return file.type.startsWith(category + '/');
      }
      return file.type === type;
    });

    if (!isAccepted && !file.name.match(/\.(psd|ai|sketch|fig|xd|cdr|zip|rar|7z)$/i)) {
      return { valid: false, error: `文件 "${file.name}" 格式不支持` };
    }

    return { valid: true };
  };

  const processFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: File[] = [];
    const errors: string[] = [];

    // 检查文件数量限制
    if (files.length + fileList.length > maxFiles) {
      toast.error(`最多只能上传 ${maxFiles} 个文件`);
      return;
    }

    Array.from(fileList).forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        // 检查重复文件
        const isDuplicate = files.some(f => f.name === file.name && f.size === file.size);
        if (!isDuplicate) {
          newFiles.push(file);
        }
      } else if (validation.error) {
        errors.push(validation.error);
      }
    });

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
      toast.success(`成功添加 ${newFiles.length} 个文件`);
    }
  }, [files, onFilesChange, maxFiles, maxFileSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    // 重置 input 以便可以重复选择相同文件
    e.target.value = '';
  }, [processFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
    toast.success('文件已移除');
  }, [files, onFilesChange]);

  const handleClick = useCallback(() => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  }, [isUploading]);

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <motion.div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        animate={{
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? '#C02C38' : undefined
        }}
        className={`
          relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
          ${isDragging
            ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10 shadow-lg shadow-red-500/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50/50 dark:bg-gray-800/30'
          }
          ${isUploading ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={getAcceptedFileTypes()}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="p-8 text-center">
          {/* 上传图标 */}
          <motion.div
            animate={{ y: isDragging ? -5 : 0 }}
            className={`
              mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-4
              ${isDragging
                ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-400 dark:text-gray-500'
              }
            `}
          >
            <Cloud className="w-10 h-10" />
          </motion.div>

          {/* 上传提示文字 */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {isDragging ? '释放以上传文件' : '拖拽文件到此处'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            或 <span className="text-red-600 dark:text-red-400 font-medium hover:underline">点击浏览</span> 选择文件
          </p>

          {/* 支持的文件类型 */}
          <div className="flex flex-wrap justify-center gap-2">
            {fileTypeCategories.map((category) => (
              <div
                key={category.label}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                  ${category.bgColor} ${category.color}
                `}
              >
                <category.icon className="w-3.5 h-3.5" />
                <span className="font-medium">{category.label}</span>
              </div>
            ))}
          </div>

          {/* 限制提示 */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-500">
            <span>最多 {maxFiles} 个文件</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span>单个文件最大 {maxFileSize}MB</span>
          </div>
        </div>

        {/* 拖拽时的遮罩效果 */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-500/5 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* 文件列表 */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* 文件统计 */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                已选择 {files.length} 个文件
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                总大小: {formatFileSize(files.reduce((acc, f) => acc + f.size, 0))}
              </span>
            </div>

            {/* 文件展示 */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {files.map((file, index) => (
                    <FilePreviewCard
                      key={`${file.name}-${index}`}
                      file={file}
                      index={index}
                      onRemove={handleRemoveFile}
                      isUploading={isUploading}
                      uploadProgress={uploadProgress[file.name]}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {files.map((file, index) => (
                    <FileListItem
                      key={`${file.name}-${index}`}
                      file={file}
                      index={index}
                      onRemove={handleRemoveFile}
                      isUploading={isUploading}
                      uploadProgress={uploadProgress[file.name]}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MediaUploadZone;
