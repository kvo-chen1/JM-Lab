import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Media } from '@/types';
import { toast } from 'sonner';

interface MediaGalleryProps {
  media: Media[];
  onChange: (media: Media[]) => void;
  error?: string;
  allowMultiple?: boolean;
  allowVideos?: boolean;
  maxFiles?: number;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  media,
  onChange,
  error,
  allowMultiple = true,
  allowVideos = true,
  maxFiles = 10,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 支持的文件类型
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  
  if (allowVideos) {
    allowedTypes.push(
      'video/mp4',
      'video/webm',
      'video/ogg',
    );
  }
  
  // 处理文件选择
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const selectedFiles = Array.from(files);
    const validFiles = selectedFiles.filter(file => allowedTypes.includes(file.type));
    
    if (validFiles.length === 0) {
      toast.error('请选择有效的图片或视频文件');
      return;
    }
    
    if (!allowMultiple && media.length + validFiles.length > 1) {
      toast.error('只能上传一个文件');
      return;
    }
    
    if (media.length + validFiles.length > maxFiles) {
      toast.error(`最多只能上传${maxFiles}个文件`);
      return;
    }
    
    // 处理文件上传
    validFiles.forEach(file => {
      handleFileUpload(file);
    });
  };
  
  // 处理文件上传
  const handleFileUpload = (file: File) => {
    // 这里应该调用实际的上传API，现在模拟上传
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const newMedia: Media = {
        id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        url: e.target?.result as string,
        thumbnailUrl: file.type.startsWith('image/') ? (e.target?.result as string) : undefined,
        name: file.name,
        size: file.size,
        uploadDate: new Date(),
        order: media.length,
        altText: '',
      };
      
      // 如果是视频，生成缩略图（这里简化处理）
      if (file.type.startsWith('video/') && !newMedia.thumbnailUrl) {
        newMedia.thumbnailUrl = '/placeholder-video.jpg';
      }
      
      onChange([...media, newMedia]);
    };
    
    reader.readAsDataURL(file);
  };
  
  // 处理拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };
  
  // 删除媒体
  const handleDelete = (id: string) => {
    onChange(media.filter(m => m.id !== id));
  };
  
  // 重新排序
  const handleReorder = (oldIndex: number, newIndex: number) => {
    const newMedia = [...media];
    const [movedItem] = newMedia.splice(oldIndex, 1);
    newMedia.splice(newIndex, 0, movedItem);
    
    // 更新order属性
    const updatedMedia = newMedia.map((m, index) => ({
      ...m,
      order: index,
    }));
    
    onChange(updatedMedia);
  };
  
  // 设置缩略图
  const handleSetThumbnail = (id: string) => {
    const thumbnailMedia = media.find(m => m.id === id);
    if (!thumbnailMedia) return;
    
    // 将选中的媒体移到第一位
    const newMedia = media.filter(m => m.id !== id);
    onChange([thumbnailMedia, ...newMedia]);
  };
  
  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${isDragging 
          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-400' 
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <i className="fas fa-cloud-upload-alt text-4xl mb-3 text-gray-400"></i>
          <h3 className="font-medium mb-2">拖拽文件到此处或点击上传</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            支持JPG、PNG、GIF、WebP图片和MP4、WebM视频
            {maxFiles && `，最多上传${maxFiles}个文件`}
          </p>
          
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300"
            >
              <i className="fas fa-file-upload mr-2"></i>
              选择文件
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple={allowMultiple}
              accept={allowedTypes.join(',')}
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
        </div>
      </div>
      
      {/* 媒体列表 */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <AnimatePresence mode="popLayout">
            {media.map((item, index) => (
              <motion.div
                key={item.id}
                className="relative group"
                layout
                drag
                dragSnapToGrid
                dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onDragEnd={(e, info) => {
                  // 计算拖拽后的新位置
                  const newIndex = Math.round(info.point.x / (200 + 12)) + Math.round(info.point.y / (200 + 12)) * Math.ceil(media.length / 3);
                  const finalIndex = Math.max(0, Math.min(media.length - 1, newIndex));
                  
                  if (finalIndex !== index) {
                    handleReorder(index, finalIndex);
                  }
                }}
              >
                <div className="aspect-square rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 shadow-md">
                  {item.type === 'image' ? (
                    <div className="relative">
                      <img
                        src={item.url}
                        alt={item.altText || item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                        }}
                      />
                      {/* 拖拽提示 */}
                      <div className="absolute top-2 right-2 bg-white bg-opacity-80 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                        <i className="fas fa-grip-vertical"></i>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative">
                      <video
                        src={item.url}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <i className="fas fa-play-circle text-white text-4xl"></i>
                      </div>
                      {/* 拖拽提示 */}
                      <div className="absolute top-2 right-2 bg-white bg-opacity-80 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                        <i className="fas fa-grip-vertical"></i>
                      </div>
                    </div>
                  )}
                  
                  {/* 缩略图标记 */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full shadow-md">
                      封面
                    </div>
                  )}
                  
                  {/* 操作按钮 */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
                    <div className="flex flex-col gap-1">
                      {index !== 0 && (
                        <button
                          onClick={() => handleSetThumbnail(item.id)}
                          className="w-full px-2 py-1 rounded text-xs text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                        >
                          <i className="fas fa-star mr-1"></i>
                          设置为封面
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="w-full px-2 py-1 rounded text-xs text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
                      >
                        <i className="fas fa-trash mr-1"></i>
                        删除
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* 文件信息 */}
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                  {item.name}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {/* 错误提示 */}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};