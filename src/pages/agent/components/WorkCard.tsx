import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  Pencil,
  RefreshCw,
  Download,
  Trash2,
  Check,
  X,
  Loader2,
  AtSign,
  GripVertical,
  Wand2
} from 'lucide-react';
import { toast } from 'sonner';
import { CardPosition } from '../types/agent';
import { InlineImageEditor } from '@/pages/skill/chat/components/InlineImageEditor';
import { uploadFile, isStorageConfigured } from '@/services/storageServiceNew';
import { useAgentStore } from '../hooks/useAgentStore';

export interface WorkCardData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl?: string;
  createdAt: number;
  isFavorite?: boolean;
  status?: 'pending' | 'generating' | 'completed' | 'error';
  cardType?: 'character_profile' | 'concept_art' | 'three_view' | 'poster' | 'default'; // 卡片类型
}

interface WorkCardProps {
  data: WorkCardData;
  isSelected?: boolean;
  onSelect?: (e?: React.MouseEvent) => void;
  onUpdate?: (id: string, updates: Partial<WorkCardData>) => void;
  onDelete?: (id: string) => void;
  onRefresh?: (id: string) => void;
  onDownload?: (data: WorkCardData) => void;
  onMention?: (data: WorkCardData) => void;  // 新增：引用回调
  showMentionButton?: boolean;  // 新增：是否显示引用按钮
  className?: string;
  // 拖拽相关属性
  position?: CardPosition;
  onPositionChange?: (position: CardPosition) => void;
  canvasZoom?: number;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

// 可编辑描述组件
function EditableDescription({ 
  title, 
  description, 
  isEditing, 
  onEditStart, 
  onEditEnd,
  onSave,
  isDark 
}: { 
  title: string;
  description: string;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onSave: (title: string, description: string) => void;
  isDark: boolean;
}) {
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description);
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditTitle(title);
      setEditDescription(description);
      // 自动聚焦到描述文本框
      setTimeout(() => descRef.current?.focus(), 100);
    }
  }, [isEditing, title, description]);

  const handleSave = useCallback(() => {
    onSave(editTitle, editDescription);
    onEditEnd();
  }, [editTitle, editDescription, onSave, onEditEnd]);

  const handleCancel = useCallback(() => {
    setEditTitle(title);
    setEditDescription(description);
    onEditEnd();
  }, [title, description, onEditEnd]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  if (isEditing) {
    return (
      <div className={`p-4 space-y-3 ${isDark ? 'bg-[#1E1E2E]' : 'bg-gray-50'}`}>
        <input
          ref={titleRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full px-3 py-2 text-lg font-semibold rounded-lg border-2 outline-none transition-colors ${
            isDark 
              ? 'bg-[#14141F] border-[#8B5CF6]/30 text-white focus:border-[#8B5CF6]' 
              : 'bg-white border-blue-400/50 text-gray-900 focus:border-blue-500'
          }`}
          placeholder="标题"
        />
        <textarea
          ref={descRef}
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          className={`w-full px-3 py-2 text-sm rounded-lg border-2 outline-none transition-colors resize-none ${
            isDark 
              ? 'bg-[#14141F] border-[#8B5CF6]/30 text-gray-200 focus:border-[#8B5CF6]' 
              : 'bg-white border-blue-400/50 text-gray-700 focus:border-blue-500'
          }`}
          placeholder="描述..."
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              isDark 
                ? 'bg-[#2A2A3E] text-gray-300 hover:bg-[#363654]' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            <X className="w-3 h-3 inline mr-1" />
            取消
          </button>
          <button
            onClick={handleSave}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              isDark
                ? 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED]'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <Check className="w-3 h-3 inline mr-1" />
            保存
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onEditStart}
      className={`p-4 cursor-pointer transition-colors ${
        isDark 
          ? 'hover:bg-gray-800/30' 
          : 'hover:bg-gray-50/50'
      }`}
    >
      <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      <p className={`text-sm leading-relaxed line-clamp-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        {description}
      </p>
      <div className={`mt-2 text-xs flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        <Pencil className="w-3 h-3" />
        <span>点击编辑</span>
      </div>
    </div>
  );
}

// 图片加载组件
function ImageWithLoading({
  src,
  alt,
  className,
  isGenerating = false,
  status,
  title,
  description
}: {
  src: string;
  alt: string;
  className?: string;
  isGenerating?: boolean;
  status?: 'pending' | 'generating' | 'completed' | 'error';
  title?: string;
  description?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { isDark } = useTheme();

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  // 如果是待处理状态
  if (status === 'pending' || (!src && !isGenerating)) {
    return (
      <div className={`flex flex-col items-center justify-center p-4 ${isDark ? 'bg-gray-800/30' : 'bg-gray-50'} ${className}`}>
        <div className="text-center w-full">
          {/* 图标 */}
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#C02C38]/10 to-[#E85D75]/10 flex items-center justify-center border border-[#C02C38]/20">
            <svg className="w-6 h-6 text-[#C02C38]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>

          {/* 标题 */}
          {title && (
            <h4 className={`text-sm font-semibold mb-2 line-clamp-1 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
              {title}
            </h4>
          )}

          {/* 描述 */}
          {description && (
            <p className={`text-xs mb-3 line-clamp-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {description}
            </p>
          )}

          {/* 状态提示 */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            等待开始
          </div>
        </div>
      </div>
    );
  }

  // 如果是生成中状态
  if (isGenerating || status === 'generating') {
    return (
      <div className={`flex flex-col items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'} ${className}`}>
        <div className="text-center px-4 max-w-[80%]">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[#C02C38]" />
          {title && (
            <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              {title}
            </h4>
          )}
          {description && (
            <p className={`text-xs line-clamp-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {description}
            </p>
          )}
          <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            AI正在创作中...
          </p>
        </div>
      </div>
    );
  }

  // 如果是错误状态
  if (status === 'error') {
    return (
      <div className={`flex flex-col items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'} ${className}`}>
        <div className="text-center px-4 max-w-[80%]">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          {title && (
            <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              {title}
            </h4>
          )}
          <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            生成失败，请重试
          </p>
        </div>
      </div>
    );
  }

  // 如果是加载错误
  if (error) {
    return (
      <div className={`flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'} ${className}`}>
        <div className="text-center px-2">
          <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {loading && (
        <div className={`absolute inset-0 flex items-center justify-center ${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'} ${className}`}>
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        crossOrigin="anonymous"
      />
    </div>
  );
}

// 悬浮操作按钮组件
function HoverActions({
  onEdit,
  onImageEdit,
  onRefresh,
  onDownload,
  onDelete,
  onMention,
  isVisible,
  isDark,
  showMentionButton,
  isImageEditing,
  cardType
}: {
  onEdit: () => void;
  onImageEdit: () => void;
  onRefresh: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onMention?: () => void;
  isVisible: boolean;
  isDark: boolean;
  showMentionButton?: boolean;
  isImageEditing?: boolean;
  cardType?: 'character_profile' | 'concept_art' | 'three_view' | 'poster' | 'default';
}) {
  const getCardTypeLabel = () => {
    switch (cardType) {
      case 'character_profile': return '角色设定';
      case 'concept_art': return '概念图';
      case 'three_view': return '三视图';
      case 'poster': return '海报';
      default: return null;
    }
  };

  const getCardTypeColor = () => {
    switch (cardType) {
      case 'character_profile': return isDark ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]' : 'bg-[#C02C38]/10 text-[#C02C38]';
      case 'concept_art': return isDark ? 'bg-[#C02C38]/20 text-[#C02C38]' : 'bg-[#C02C38]/20 text-[#C02C38]';
      case 'three_view': return isDark ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#059669]/10 text-[#059669]';
      case 'poster': return isDark ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : 'bg-[#D97706]/10 text-[#D97706]';
      default: return null;
    }
  };

  const cardTypeLabel = getCardTypeLabel();
  const cardTypeColor = getCardTypeColor();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className={`absolute top-3 right-3 flex items-center gap-1 p-1.5 rounded-xl backdrop-blur-md ${
            isDark ? 'bg-black/60' : 'bg-white/80'
          }`}
        >
          {/* 卡片类型标签 */}
          {cardTypeLabel && cardTypeColor && (
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${cardTypeColor}`}>
              {cardTypeLabel}
            </span>
          )}
          {/* 引用按钮 */}
          {showMentionButton && onMention && (
            <button
              onClick={(e) => { e.stopPropagation(); onMention(); }}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all ${
                isDark
                  ? 'bg-[#C02C38] text-white hover:bg-[#a82530]'
                  : 'bg-[#C02C38] text-white hover:bg-[#a82530]'
              }`}
              title="引用到输入框"
            >
              <AtSign className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">引用</span>
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onImageEdit(); }}
            className={`p-2 rounded-lg transition-all ${
              isImageEditing
                ? isDark
                  ? 'bg-[#8B5CF6] text-white'
                  : 'bg-[#C02C38] text-white'
                : isDark
                  ? 'text-gray-300 hover:text-white hover:bg-white/10'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-black/10'
            }`}
            title="图片编辑"
          >
            <Wand2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className={`p-2 rounded-lg transition-all ${
              isDark
                ? 'text-gray-300 hover:text-white hover:bg-white/10'
                : 'text-gray-600 hover:text-gray-900 hover:bg-black/10'
            }`}
            title="编辑描述"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRefresh(); }}
            className={`p-2 rounded-lg transition-all ${
              isDark
                ? 'text-gray-300 hover:text-white hover:bg-white/10'
                : 'text-gray-600 hover:text-gray-900 hover:bg-black/10'
            }`}
            title="重新生成"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className={`p-2 rounded-lg transition-all ${
              isDark
                ? 'text-gray-300 hover:text-white hover:bg-white/10'
                : 'text-gray-600 hover:text-gray-900 hover:bg-black/10'
            }`}
            title="下载"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className={`p-2 rounded-lg transition-all hover:text-red-500 ${
              isDark
                ? 'text-gray-300 hover:bg-white/10'
                : 'text-gray-600 hover:bg-black/10'
            }`}
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 主组件
export default function WorkCard({
  data,
  isSelected = false,
  onSelect,
  onUpdate,
  onDelete,
  onRefresh,
  onDownload,
  onMention,
  showMentionButton = false,
  className = '',
  position,
  onPositionChange,
  canvasZoom = 100,
  isDragging: externalIsDragging,
  onDragStart,
  onDragEnd
}: WorkCardProps) {
  const { isDark } = useTheme();
  const { addOutput } = useAgentStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isImageEditing, setIsImageEditing] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartPosRef = useRef({ x: 0, y: 0, mouseX: 0, mouseY: 0 });
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false); // 用于区分拖动和点击

  const handleEditStart = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleEditEnd = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSave = useCallback((title: string, description: string) => {
    onUpdate?.(data.id, { title, description });
    toast.success('保存成功');
  }, [data.id, onUpdate]);

  const handleDelete = useCallback(() => {
    if (confirm('确定要删除这个作品吗？')) {
      onDelete?.(data.id);
      toast.success('已删除');
    }
  }, [data.id, onDelete]);

  const handleRefresh = useCallback(() => {
    onRefresh?.(data.id);
    toast.info('重新生成中...');
  }, [data.id, onRefresh]);

  const handleDownload = useCallback(() => {
    onDownload?.(data);
    toast.success('开始下载');
  }, [data, onDownload]);

  const handleMention = useCallback(() => {
    onMention?.(data);
    toast.success(`已引用作品：${data.title}`);
  }, [data, onMention]);

  // 图片编辑相关函数
  const handleImageEditStart = useCallback(() => {
    setIsImageEditing(true);
    setEditedImageUrl(null);
  }, []);

  const handleImageEditEnd = useCallback(() => {
    setIsImageEditing(false);
    setEditedImageUrl(null);
  }, []);

  const handleImageEditChange = useCallback((editedUrl: string) => {
    setEditedImageUrl(editedUrl);
  }, []);

  // 将 base64 data URL 转换为 Blob
  const dataURLtoBlob = useCallback((dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }, []);

  const handleImageEditSave = useCallback(async (editedUrl: string) => {
    try {
      console.log('[WorkCard] 开始保存编辑图片...');

      // 检查存储配置
      if (!isStorageConfigured()) {
        throw new Error('存储服务未配置，请检查环境变量');
      }

      // 验证 editedUrl
      if (!editedUrl) {
        throw new Error('无效的图片数据');
      }

      let blob: Blob;

      // 如果是 data URL，直接转换
      if (editedUrl.startsWith('data:image')) {
        console.log('[WorkCard] 转换 base64 data URL 为 blob...');
        try {
          blob = dataURLtoBlob(editedUrl);
        } catch (convertError: any) {
          console.error('[WorkCard] base64 转换失败:', convertError);
          throw new Error('图片数据转换失败: ' + convertError.message);
        }
      } else {
        // 如果是普通 URL，通过 fetch 获取
        console.log('[WorkCard] 通过 fetch 获取图片...');
        try {
          const response = await fetch(editedUrl);
          if (!response.ok) {
            throw new Error(`获取图片失败: ${response.status}`);
          }
          blob = await response.blob();
        } catch (fetchError: any) {
          console.error('[WorkCard] fetch 失败:', fetchError);
          throw new Error('获取图片失败: ' + fetchError.message);
        }
      }

      console.log('[WorkCard] blob 大小:', blob.size, '类型:', blob.type);

      if (blob.size === 0) {
        throw new Error('图片数据为空');
      }

      const fileName = `${data.title || 'image'}_edited_${Date.now()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      console.log('[WorkCard] 创建文件:', fileName, '大小:', file.size);

      // 上传到新位置
      console.log('[WorkCard] 开始上传到 works 文件夹...');
      let uploadedUrl: string;
      try {
        uploadedUrl = await uploadFile(file, 'works');
        console.log('[WorkCard] 上传成功:', uploadedUrl);
      } catch (uploadError: any) {
        console.error('[WorkCard] 上传失败:', uploadError);
        throw new Error('上传失败: ' + uploadError.message);
      }

      // 创建新作品（而不是更新原作品）
      const newOutput = {
        id: `output_${Date.now()}`,
        type: 'image' as const,
        url: uploadedUrl,
        thumbnail: uploadedUrl,
        title: `${data.title || '图片'} (编辑版)`,
        description: data.description,
        createdAt: Date.now(),
        position: {
          x: (position?.x || 0) + 50,
          y: (position?.y || 0) + 50,
        },
      };

      addOutput(newOutput);
      console.log('[WorkCard] 新作品已创建:', newOutput.id);

      toast.success('图片编辑已保存为新作品');

      // 关闭编辑模式
      setIsImageEditing(false);
      setEditedImageUrl(null);
    } catch (error: any) {
      console.error('[WorkCard] 保存编辑图片失败:', error);
      toast.error('保存失败: ' + (error.message || '请重试'));
      throw error;
    }
  }, [data.title, data.description, position?.x, position?.y, addOutput, dataURLtoBlob]);

  // 同步 isDragging 状态到 ref
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  // 开始拖拽 - 只响应手柄
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-drag-handle]')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // 重置拖动标记
    hasDraggedRef.current = false;

    // 获取当前实际位置（从 DOM 读取，避免闭包问题）
    const currentX = position?.x || 0;
    const currentY = position?.y || 0;

    // 记录起始位置
    dragStartPosRef.current = {
      x: currentX,
      y: currentY,
      mouseX: e.clientX,
      mouseY: e.clientY
    };

    setIsDragging(true);
    onDragStart?.();

    // 添加全局鼠标事件监听
    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();

      // 如果不在拖拽状态，忽略
      if (!isDraggingRef.current) return;

      // 标记已拖动（用于区分拖动和点击）
      hasDraggedRef.current = true;

      const scale = (canvasZoom || 100) / 100;
      const deltaX = (moveEvent.clientX - dragStartPosRef.current.mouseX) / scale;
      const deltaY = (moveEvent.clientY - dragStartPosRef.current.mouseY) / scale;

      // 实时更新位置（通过 ref 避免重渲染）
      if (cardRef.current) {
        cardRef.current.style.left = `${dragStartPosRef.current.x + deltaX}px`;
        cardRef.current.style.top = `${dragStartPosRef.current.y + deltaY}px`;
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      // 如果不在拖拽状态，忽略
      if (!isDraggingRef.current) return;

      const scale = (canvasZoom || 100) / 100;
      const deltaX = (upEvent.clientX - dragStartPosRef.current.mouseX) / scale;
      const deltaY = (upEvent.clientY - dragStartPosRef.current.mouseY) / scale;

      const newPosition: CardPosition = {
        x: dragStartPosRef.current.x + deltaX,
        y: dragStartPosRef.current.y + deltaY
      };

      setIsDragging(false);
      onDragEnd?.();

      // 延迟通知父组件，确保状态已更新
      requestAnimationFrame(() => {
        onPositionChange?.(newPosition);
      });

      // 移除事件监听
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [canvasZoom, onDragStart, onDragEnd, onPositionChange]);

  const isCurrentlyDragging = isDragging || externalIsDragging;

  return (
    <>
      <div
        ref={cardRef}
        onClick={(e) => {
          // 使用 ref 检查是否实际发生了拖动，而不是依赖 state
          // 因为 state 更新是异步的，click 事件触发时 state 可能已经被重置
          if (!hasDraggedRef.current) {
            onSelect?.(e);
          }
          // 重置拖动标记，为下一次交互做准备
          hasDraggedRef.current = false;
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={handleMouseDown}
        data-work-card="true"
        data-dragging={isCurrentlyDragging}
        style={{
          position: 'absolute',
          left: position?.x || 0,
          top: position?.y || 0,
          cursor: isCurrentlyDragging ? 'grabbing' : 'default',
          zIndex: isCurrentlyDragging ? 100 : (isHovered ? 10 : 1),
          touchAction: 'none',
          userSelect: 'none'
        }}
        className={`
          relative rounded-2xl overflow-hidden
          transition-shadow duration-300 max-w-md
          ${isDark
            ? 'bg-[#14141F] border border-[#2A2A3E] shadow-xl shadow-black/30'
            : 'bg-white shadow-xl shadow-gray-200/50'
          }
          ${isSelected
            ? isDark
              ? 'ring-2 ring-[#8B5CF6] ring-offset-2 ring-offset-[#0A0A0F]'
              : 'ring-2 ring-[#C02C38] ring-offset-2 ring-offset-gray-100'
            : 'hover:shadow-2xl'
          }
          ${isCurrentlyDragging ? 'shadow-2xl scale-[1.02]' : ''}
          ${data.cardType === 'concept_art' ? (isDark ? 'border-2 border-[#C02C38]/50' : 'border-2 border-[#C02C38]/60') : ''}
          ${data.cardType === 'character_profile' ? (isDark ? 'border-2 border-[#8B5CF6]/50' : 'border-2 border-[#8B5CF6]/60') : ''}
          ${data.cardType === 'three_view' ? (isDark ? 'border-2 border-[#10B981]/50' : 'border-2 border-[#10B981]/60') : ''}
          ${data.cardType === 'poster' ? (isDark ? 'border-2 border-[#F59E0B]/50' : 'border-2 border-[#F59E0B]/60') : ''}
          ${className}
        `}
      >
        {/* 拖拽手柄 */}
        <div
          data-drag-handle="true"
          className={`
            absolute top-0 left-0 right-0 h-8 z-20 flex items-center justify-center
            cursor-grab active:cursor-grabbing
            ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}
            transition-colors duration-200
          `}
          title="拖动以移动卡片"
        >
          <GripVertical className={`w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
        </div>
        {/* 文字描述区域（在上） */}
        <EditableDescription
          title={data.title}
          description={data.description}
          isEditing={isEditing}
          onEditStart={handleEditStart}
          onEditEnd={handleEditEnd}
          onSave={handleSave}
          isDark={isDark}
        />

        {/* 图片区域（在下） */}
        <div
          className="relative overflow-hidden min-h-[200px] flex items-center justify-center flex-shrink-0"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <ImageWithLoading
            src={data.imageUrl}
            alt={data.title}
            className="w-full h-auto max-h-[50vh] object-contain"
            isGenerating={!data.imageUrl}
            status={data.status}
            title={data.title}
            description={data.description}
          />

          {/* 悬浮操作按钮 */}
          <HoverActions
            onEdit={handleEditStart}
            onImageEdit={handleImageEditStart}
            onRefresh={handleRefresh}
            onDownload={handleDownload}
            onDelete={handleDelete}
            onMention={handleMention}
            isVisible={isHovered && !isEditing && !isImageEditing}
            isDark={isDark}
            showMentionButton={showMentionButton}
            isImageEditing={isImageEditing}
            cardType={data.cardType || 'default'}
          />

          {/* 选中状态指示器 */}
          {isSelected && (
            <div className={`absolute inset-0 ring-2 ring-inset pointer-events-none ${
              isDark ? 'ring-[#8B5CF6]' : 'ring-[#C02C38]'
            }`} />
          )}
        </div>

        {/* 图片编辑器 - 展开状态 */}
        <AnimatePresence>
          {isImageEditing && data.imageUrl && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`overflow-hidden ${isDark ? 'bg-[#1A1A2E]' : 'bg-gray-50'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <InlineImageEditor
                imageUrl={data.imageUrl}
                onChange={handleImageEditChange}
                onSave={handleImageEditSave}
                onCancel={handleImageEditEnd}
              />

              {/* 编辑后预览 */}
              <AnimatePresence>
                {editedImageUrl && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`border-t ${isDark ? 'border-[#2A2A3E]' : 'border-gray-200'}`}
                  >
                    <div className={`px-3 py-2 text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      修改后预览
                    </div>
                    <div className="relative w-full" style={{ height: 200 }}>
                      <img
                        src={editedImageUrl}
                        alt="编辑预览"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 底部信息栏 */}
        <div className={`px-4 py-2 flex items-center justify-between text-xs ${
          isDark ? 'bg-[#0A0A0F]/50 text-gray-500 border-t border-[#2A2A3E]' : 'bg-gray-50 text-gray-400'
        }`}>
          <span>{new Date(data.createdAt).toLocaleDateString('zh-CN')}</span>
          {data.isFavorite && (
            <span className={isDark ? 'text-[#8B5CF6]' : 'text-[#C02C38]'}>已收藏</span>
          )}
        </div>
      </div>
    </>
  );
}
