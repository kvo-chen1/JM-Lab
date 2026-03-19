// src/components/ImagePasteInput.tsx
// 支持图片粘贴的高级输入框组件

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { X, ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface PastedImage {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
}

export interface ImagePasteInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSend?: (message: string, images: PastedImage[]) => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  maxLength?: number;
  maxImages?: number;
  showVoiceButton?: boolean;
  showPasteHint?: boolean;
}

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const ImagePasteInput: React.FC<ImagePasteInputProps> = ({
  value: controlledValue,
  onChange,
  onSend,
  onVoiceStart,
  onVoiceEnd,
  placeholder = '输入消息，支持粘贴图片...',
  disabled = false,
  isLoading = false,
  className,
  maxLength = 2000,
  maxImages = 5,
  showVoiceButton = true,
  showPasteHint = true,
}) => {
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [images, setImages] = useState<PastedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  // 自动调整高度
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  // 全局粘贴监听（当输入框聚焦时）
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // 只有当组件内的 textarea 被聚焦时才处理
      if (document.activeElement === inputRef.current) {
        console.log('全局粘贴事件触发，目标聚焦');
        // 让 textarea 的 onPaste 处理它
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, []);

  // 处理图片文件
  const processImageFile = useCallback((file: File): Promise<PastedImage | null> => {
    return new Promise((resolve) => {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        toast.error(`文件 "${file.name}" 不是有效的图片格式`);
        resolve(null);
        return;
      }

      // 检查文件大小（最大 10MB）
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`图片 "${file.name}" 超过 10MB 限制`);
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        resolve({
          id: generateId(),
          file,
          preview,
          name: file.name,
          size: file.size,
        });
      };
      reader.onerror = () => {
        toast.error(`读取图片 "${file.name}" 失败`);
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // 处理粘贴事件
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    if (disabled || isLoading) {
      console.log('粘贴被禁用或正在加载中');
      return;
    }

    console.log('粘贴事件触发', e.clipboardData);

    const items = e.clipboardData?.items;
    if (!items || items.length === 0) {
      console.log('剪贴板为空');
      return;
    }

    // 遍历所有剪贴板项目，查找图片
    const imageItems: DataTransferItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`剪贴板项目 ${i}:`, item.type, item.kind);
      if (item.type.startsWith('image/') || item.kind === 'file') {
        imageItems.push(item);
      }
    }

    if (imageItems.length === 0) {
      console.log('没有找到图片项目');
      return;
    }

    e.preventDefault();
    setIsProcessing(true);

    const newImages: PastedImage[] = [];
    const remainingSlots = maxImages - images.length;

    if (remainingSlots <= 0) {
      toast.error(`最多只能粘贴 ${maxImages} 张图片`);
      setIsProcessing(false);
      return;
    }

    const itemsToProcess = imageItems.slice(0, remainingSlots);

    for (const item of itemsToProcess) {
      try {
        const file = item.getAsFile();
        console.log('获取到文件:', file?.name, file?.type, file?.size);
        if (file && file.type.startsWith('image/')) {
          const processedImage = await processImageFile(file);
          if (processedImage) {
            newImages.push(processedImage);
          }
        }
      } catch (err) {
        console.error('处理粘贴项目时出错:', err);
      }
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
      toast.success(`成功粘贴 ${newImages.length} 张图片`);
    } else {
      console.log('没有成功处理任何图片');
    }

    setIsProcessing(false);
  }, [disabled, isLoading, images.length, maxImages, processImageFile]);

  // 删除图片
  const handleRemoveImage = useCallback((id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  // 处理文本变化
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) return;

    if (onChange) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  // 发送消息
  const handleSend = () => {
    const hasContent = value.trim() || images.length > 0;
    if (!hasContent || disabled || isLoading) return;

    onSend?.(value.trim(), images);

    // 清空输入
    if (onChange) {
      onChange('');
    } else {
      setInternalValue('');
    }

    // 清空图片
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 语音按钮切换
  const handleVoiceToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      onVoiceEnd?.();
    } else {
      setIsRecording(true);
      onVoiceStart?.();
    }
  };

  // 字符计数
  const charCount = value.length;
  const isNearLimit = maxLength && charCount > maxLength * 0.9;
  const hasContent = value.trim() || images.length > 0;

  // 拖拽处理
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isLoading) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    setIsProcessing(true);
    const newImages: PastedImage[] = [];
    const remainingSlots = maxImages - images.length;

    if (remainingSlots <= 0) {
      toast.error(`最多只能粘贴 ${maxImages} 张图片`);
      setIsProcessing(false);
      return;
    }

    const filesToProcess = imageFiles.slice(0, remainingSlots);

    for (const file of filesToProcess) {
      const processedImage = await processImageFile(file);
      if (processedImage) {
        newImages.push(processedImage);
      }
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
      toast.success(`成功添加 ${newImages.length} 张图片`);
    }

    setIsProcessing(false);
  }, [disabled, isLoading, images.length, maxImages, processImageFile]);

  return (
    <div
      className={clsx("relative", className)}
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 主容器 */}
      <motion.div
        className={clsx(
          "relative flex flex-col gap-3 p-3 transition-all duration-200",
          "bg-[#1a0f1a] border-2",
          isFocused && !isDragging
            ? "border-[#ff1493] shadow-[0_0_12px_rgba(255,20,147,0.3)]"
            : isDragging
              ? "border-[#ff1493] border-dashed bg-[#2a1a2a] shadow-[0_0_20px_rgba(255,20,147,0.5)]"
              : "border-black shadow-[4px_4px_0px_0px_#000000]",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        animate={{
          scale: isFocused || isDragging ? 1.005 : 1,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* 拖拽提示 */}
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-[#ff1493]/10 z-10 pointer-events-none"
          >
            <div className="text-[#ff1493] font-bold text-lg flex items-center gap-2">
              <i className="fas fa-image"></i>
              释放以添加图片
            </div>
          </motion.div>
        )}
        {/* 图片预览区域 */}
        <AnimatePresence mode="popLayout">
          {images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 pb-2 border-b border-[#2a1a2a]"
            >
              {images.map((image, index) => (
                <motion.div
                  key={image.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  className={clsx(
                    "relative w-16 h-16 flex-shrink-0",
                    "border-2 border-black",
                    "shadow-[2px_2px_0px_0px_#000000]",
                    "overflow-hidden group",
                    "bg-[#2a1a2a]"
                  )}
                >
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />

                  {/* 悬停遮罩 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />

                  {/* 删除按钮 */}
                  <motion.button
                    onClick={() => handleRemoveImage(image.id)}
                    className={clsx(
                      "absolute top-0.5 right-0.5",
                      "w-5 h-5 flex items-center justify-center",
                      "bg-[#ff1493] text-white",
                      "opacity-0 group-hover:opacity-100",
                      "transition-opacity duration-200",
                      "shadow-[1px_1px_0px_0px_#000000]",
                      disabled && "pointer-events-none"
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-3 h-3" />
                  </motion.button>

                  {/* 图片大小提示 */}
                  <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-black/60 text-[8px] text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatFileSize(image.size)}
                  </div>
                </motion.div>
              ))}

              {/* 添加更多图片提示 */}
              {images.length < maxImages && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={clsx(
                    "w-16 h-16 flex-shrink-0",
                    "border-2 border-dashed border-[#4a304a]",
                    "flex items-center justify-center",
                    "text-[#806070] text-xs",
                    "bg-[#2a1a2a]/50"
                  )}
                >
                  <div className="text-center">
                    <ImageIcon className="w-4 h-4 mx-auto mb-1 opacity-50" />
                    <span className="text-[10px]">Ctrl+V</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 输入框区域 */}
        <div className="flex items-end gap-2">
          {/* 语音按钮 */}
          {showVoiceButton && (
            <motion.button
              type="button"
              onClick={handleVoiceToggle}
              disabled={disabled || isLoading}
              className={clsx(
                "flex-shrink-0 w-10 h-10 flex items-center justify-center transition-all duration-200",
                isRecording
                  ? "bg-[#ff0055] text-white animate-pulse"
                  : "bg-[#2a1a2a] text-[#b090a8] hover:bg-[#3a253a] hover:text-[#ff1493]",
                "border-2 border-black shadow-[2px_2px_0px_0px_#000000]",
                (disabled || isLoading) && "opacity-50 cursor-not-allowed"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className={clsx(
                "fas",
                isRecording ? "fa-stop" : "fa-microphone"
              )}></i>
            </motion.button>
          )}

          {/* 文本输入区域 */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onPaste={handlePaste}
              disabled={disabled || isLoading}
              placeholder={placeholder}
              rows={1}
              className={clsx(
                "w-full resize-none bg-transparent border-0 outline-none",
                "text-[#fff0f5] placeholder-[#806070]",
                "py-2.5 px-1",
                "min-h-[44px] max-h-[120px]",
                "font-mono text-sm",
                disabled && "cursor-not-allowed"
              )}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#ff1493 #1a0f1a',
              }}
            />

            {/* 字符计数 */}
            {maxLength && (
              <div className={clsx(
                "absolute -bottom-5 right-0 text-xs font-mono transition-colors",
                isNearLimit ? "text-[#ff0055] font-medium" : "text-[#806070]"
              )}>
                {charCount}/{maxLength}
              </div>
            )}
          </div>

          {/* 处理中指示器 */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center"
            >
              <Loader2 className="w-5 h-5 text-[#ff1493] animate-spin" />
            </motion.div>
          )}

          {/* 发送按钮 */}
          <motion.button
            type="button"
            onClick={handleSend}
            disabled={!hasContent || disabled || isLoading}
            className={clsx(
              "flex-shrink-0 w-10 h-10 flex items-center justify-center transition-all duration-200",
              hasContent && !disabled && !isLoading
                ? "bg-[#ff1493] text-white shadow-[2px_2px_0px_0px_#000000] hover:shadow-[3px_3px_0px_0px_#000000]"
                : "bg-[#2a1a2a] text-[#806070] cursor-not-allowed",
              "border-2 border-black",
              isLoading && "cursor-wait"
            )}
            whileHover={hasContent && !disabled && !isLoading ? { scale: 1.05 } : {}}
            whileTap={hasContent && !disabled && !isLoading ? { scale: 0.95 } : {}}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.i
                  key="loading"
                  className="fas fa-spinner fa-spin"
                  initial={{ opacity: 0, rotate: -180 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 180 }}
                />
              ) : (
                <motion.i
                  key="send"
                  className="fas fa-paper-plane"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                />
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>

      {/* 录音状态提示 */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#ff0055] text-white text-sm font-medium shadow-[3px_3px_0px_0px_#000000] flex items-center gap-2 border-2 border-black"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full bg-white opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 bg-white"></span>
            </span>
            正在录音...
          </motion.div>
        )}
      </AnimatePresence>

      {/* 快捷提示 */}
      {showPasteHint && (
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-4 text-xs text-[#806070] font-mono">
            <span className="flex items-center gap-1.5">
              <i className="fas fa-keyboard"></i>
              Enter 发送
            </span>
            <span className="flex items-center gap-1.5">
              <i className="fas fa-level-down-alt rotate-90"></i>
              Shift + Enter 换行
            </span>
            <span className="flex items-center gap-1.5 text-[#ff1493]">
              <i className="fas fa-image"></i>
              Ctrl+V 粘贴图片
            </span>
          </div>

          {/* 图片计数 */}
          {images.length > 0 && (
            <div className="text-xs text-[#ff1493] font-mono">
              {images.length}/{maxImages} 图片
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImagePasteInput;
