import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { WorkItem, ViewMode, useCanvasStore } from '../hooks/useCanvasStore';
import { InlineImageEditor } from './InlineImageEditor';
import { QuickEditPanel } from './QuickEditPanel';
import { uploadFile, isStorageConfigured } from '@/services/storageServiceNew';
import {
  Download,
  Share2,
  Heart,
  Trash2,
  MoreHorizontal,
  Image as ImageIcon,
  FileText,
  Code,
  Palette,
  Loader2,
  AlertCircle,
  Check,
  Pencil,
  ChevronDown,
  ChevronUp,
  Zap,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { performQuickEdit } from '../services/quickEditService';

interface WorkCardProps {
  work: WorkItem;
  isSelected: boolean;
  viewMode: ViewMode;
  canvasZoom: number;
  onSelect: () => void;
  onPositionChange: (x: number, y: number) => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export const WorkCard: React.FC<WorkCardProps> = ({
  work,
  isSelected,
  viewMode,
  canvasZoom,
  onSelect,
  onPositionChange,
  onDelete,
  onDownload,
  onDragStart,
  onDragEnd,
}) => {
  const { isDark } = useTheme();
  const { editingWorkId, setEditingWorkId, addWork } = useCanvasStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(work.isFavorite || false);
  
  // 编辑相关状态
  const isEditing = editingWorkId === work.id;
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  
  // 快速编辑模式状态
  const [editMode, setEditMode] = useState<'quick' | 'full'>('quick');
  const [isQuickEditing, setIsQuickEditing] = useState(false);
  const [quickEditResult, setQuickEditResult] = useState<string | null>(null);

  const cardRef = React.useRef<HTMLDivElement>(null);
  const dragStartPos = React.useRef({ x: 0, y: 0, mouseX: 0, mouseY: 0 });
  const isDraggingRef = React.useRef(false);
  const currentDragPos = React.useRef({ x: 0, y: 0 });

  // 同步 isDragging 状态到 ref
  React.useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  // 根据类型获取图标
  const getTypeIcon = () => {
    switch (work.type) {
      case 'image':
      case 'design':
        return <ImageIcon className="w-4 h-4" />;
      case 'text':
        return <FileText className="w-4 h-4" />;
      case 'code':
        return <Code className="w-4 h-4" />;
      default:
        return <Palette className="w-4 h-4" />;
    }
  };

  // 处理鼠标按下开始拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (viewMode === 'grid') return; // 网格模式下不允许拖拽
    if (isEditing) return; // 编辑模式下不允许拖拽
    
    // 如果点击的是操作按钮，不触发拖拽
    if ((e.target as HTMLElement).closest('[data-action-button]')) return;

    e.preventDefault();
    e.stopPropagation();

    // 获取当前实际位置
    const currentX = work.position.x;
    const currentY = work.position.y;

    // 记录起始位置
    dragStartPos.current = {
      x: currentX,
      y: currentY,
      mouseX: e.clientX,
      mouseY: e.clientY
    };

    // 初始化当前拖拽位置
    currentDragPos.current = { x: currentX, y: currentY };

    setIsDragging(true);
    onDragStart();
  }, [viewMode, isEditing, work.position.x, work.position.y, onDragStart]);

  // 使用 useEffect 将鼠标事件绑定到 window，提高拖拽灵敏度
  useEffect(() => {
    if (!isDragging) return;

    // 处理窗口鼠标移动 - 直接操作 DOM，避免频繁重渲染
    const handleWindowMouseMove = (moveEvent: MouseEvent) => {
      // 如果不在拖拽状态，忽略
      if (!isDraggingRef.current) return;

      const scale = (canvasZoom || 100) / 100;
      const deltaX = (moveEvent.clientX - dragStartPos.current.mouseX) / scale;
      const deltaY = (moveEvent.clientY - dragStartPos.current.mouseY) / scale;

      // 计算新位置
      const newX = dragStartPos.current.x + deltaX;
      const newY = dragStartPos.current.y + deltaY;

      // 保存当前拖拽位置
      currentDragPos.current = { x: newX, y: newY };

      // 实时更新 DOM 位置（使用 left/top 而不是 transform，避免与 React 渲染冲突）
      if (cardRef.current) {
        cardRef.current.style.left = `${newX}px`;
        cardRef.current.style.top = `${newY}px`;
      }
    };

    // 处理窗口鼠标释放
    const handleWindowMouseUp = (upEvent: MouseEvent) => {
      // 如果不在拖拽状态，忽略
      if (!isDraggingRef.current) return;

      const scale = (canvasZoom || 100) / 100;
      const deltaX = (upEvent.clientX - dragStartPos.current.mouseX) / scale;
      const deltaY = (upEvent.clientY - dragStartPos.current.mouseY) / scale;

      const newPosition = {
        x: dragStartPos.current.x + deltaX,
        y: dragStartPos.current.y + deltaY
      };

      setIsDragging(false);
      onDragEnd();

      // 延迟通知父组件，确保状态已更新
      requestAnimationFrame(() => {
        onPositionChange(newPosition.x, newPosition.y);
      });

      // 移除事件监听
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging, canvasZoom, onPositionChange, onDragEnd]);

  // 处理下载
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (work.imageUrl) {
      const link = document.createElement('a');
      link.href = work.imageUrl;
      link.download = work.title || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('已开始下载');
    }
    onDownload?.();
  };

  // 处理分享
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href);
    toast.success('链接已复制到剪贴板');
  };

  // 处理收藏
  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? '已取消收藏' : '已添加到收藏');
  };

  // 处理删除
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  // 处理编辑按钮点击
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditing) {
      // 如果已经在编辑，则关闭编辑
      setEditingWorkId(null);
      setEditedImageUrl(null);
      setQuickEditResult(null);
    } else {
      // 开始编辑（默认快速编辑模式）
      setEditingWorkId(work.id);
      setEditMode('quick');
      setEditedImageUrl(null);
      setQuickEditResult(null);
    }
  };

  // 切换到完整编辑器
  const handleOpenFullEditor = useCallback(() => {
    setEditMode('full');
  }, []);

  // 切换到快速编辑
  const handleOpenQuickEdit = useCallback(() => {
    setEditMode('quick');
  }, []);

  // 处理快速编辑
  const handleQuickEdit = useCallback(async (prompt: string, attachments?: File[]) => {
    if (!work.imageUrl) return;

    setIsQuickEditing(true);
    try {
      const result = await performQuickEdit({
        imageUrl: work.imageUrl,
        prompt,
        attachments,
      });

      setQuickEditResult(result.editedImageUrl);
      toast.success(`编辑完成：${result.appliedEffects.join('、')}`);
    } catch (error: any) {
      console.error('[WorkCard] Quick edit failed:', error);
      toast.error(error.message || '编辑失败');
    } finally {
      setIsQuickEditing(false);
    }
  }, [work.imageUrl]);

  // 处理添加到对话
  const handleAddToChat = useCallback((content: string, imageUrl?: string) => {
    // TODO: 实现添加到对话功能
    toast.success('已添加到对话');
  }, []);

  // 处理快速编辑重置
  const handleQuickEditReset = useCallback(() => {
    setQuickEditResult(null);
  }, []);

  // 处理快速编辑取消
  const handleQuickEditCancel = useCallback(() => {
    setEditingWorkId(null);
    setQuickEditResult(null);
  }, [setEditingWorkId]);

  // 处理编辑变化（实时预览）
  const handleEditChange = useCallback((editedUrl: string) => {
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

  // 处理保存编辑
  const handleEditSave = useCallback(async (editedUrl: string) => {
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

      const fileName = `${work.title || 'image'}_edited_${Date.now()}.png`;
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
      const newWork = {
        id: `work_${Date.now()}`,
        title: `${work.title || '图片'} (编辑版)`,
        imageUrl: uploadedUrl,
        thumbnailUrl: uploadedUrl,
        type: 'image' as const,
        status: 'completed' as const,
        createdAt: Date.now(),
        position: {
          x: work.position.x + 50,  // 在原始作品右侧偏移
          y: work.position.y + 50,  // 在原始作品下方偏移
        },
      };

      addWork(newWork);
      console.log('[WorkCard] 新作品已创建:', newWork.id);

      toast.success('图片编辑已保存为新作品');
      
      // 关闭编辑模式
      setEditingWorkId(null);
      setEditedImageUrl(null);
    } catch (error: any) {
      console.error('[WorkCard] 保存编辑图片失败:', error);
      toast.error('保存失败: ' + (error.message || '请重试'));
      throw error;
    }
  }, [work.id, work.title, work.position.x, work.position.y, addWork, setEditingWorkId, dataURLtoBlob]);

  // 处理取消编辑
  const handleEditCancel = useCallback(() => {
    setEditingWorkId(null);
    setEditedImageUrl(null);
  }, [setEditingWorkId]);

  // 卡片尺寸
  const cardWidth = viewMode === 'grid' ? 320 : 448;
  const cardHeight = work.type === 'image' || work.type === 'design' ? 400 : 300;

  // 根据拖拽状态返回不同的 transition 配置
  const getTransition = () => {
    if (isDragging) {
      return { duration: 0 }; // 拖拽时无动画
    }
    return {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30
    };
  };

  return (
    <motion.div
      ref={cardRef}
      data-work-card
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: isSelected ? 1.02 : 1,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={getTransition()}
      className={`absolute rounded-2xl overflow-hidden shadow-lg transition-shadow duration-200 ${
        isSelected
          ? 'ring-2 ring-purple-500 shadow-purple-500/20'
          : isHovered
            ? 'shadow-xl'
            : ''
      } ${isDark ? 'bg-[#1a1f1a] border border-gray-800' : 'bg-white border border-gray-200'}`}
      style={{
        width: cardWidth,
        height: isEditing ? 'auto' : cardHeight,
        left: isDragging ? currentDragPos.current.x : work.position.x,
        top: isDragging ? currentDragPos.current.y : work.position.y,
        cursor: viewMode === 'gallery' && !isEditing ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
        minHeight: cardHeight,
      }}
      onMouseDown={handleMouseDown}
      onMouseLeave={() => setIsHovered(false)}
      onMouseEnter={() => setIsHovered(true)}
      onClick={onSelect}
    >
      {/* 图片类型内容 */}
      {(work.type === 'image' || work.type === 'design') && work.imageUrl && (
        <div className="relative w-full" style={{ height: cardHeight }}>
          {/* 图片加载状态 */}
          {!imageLoaded && !imageError && (
            <div className={`absolute inset-0 flex items-center justify-center ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
          )}
          
          {/* 图片错误状态 */}
          {imageError && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>图片加载失败</span>
            </div>
          )}
          
          {/* 实际图片 - 编辑时显示原始图 */}
          <img
            src={work.imageUrl}
            alt={work.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            crossOrigin="anonymous"
          />
          
          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* 状态标签 */}
          {work.status === 'generating' && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              生成中
            </div>
          )}
          
          {work.status === 'error' && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/80 backdrop-blur-sm text-white text-xs">
              <AlertCircle className="w-3 h-3" />
              生成失败
            </div>
          )}
          
          {isFavorite && (
            <div className="absolute top-3 right-3">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            </div>
          )}
        </div>
      )}

      {/* 文本类型内容 */}
      {(work.type === 'text' || work.type === 'code') && (
        <div className={`w-full h-full p-4 overflow-auto ${
          isDark ? 'bg-[#1a1f1a]' : 'bg-white'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {getTypeIcon()}
            <span className={`text-xs font-medium uppercase tracking-wider ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {work.type}
            </span>
          </div>
          <h3 className={`font-semibold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {work.title}
          </h3>
          <p className={`text-sm line-clamp-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {work.content || work.description}
          </p>
        </div>
      )}

      {/* 底部信息栏 */}
      <div className={`absolute bottom-0 left-0 right-0 p-3 transition-opacity duration-200 ${
        isHovered || isSelected || isEditing ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium truncate max-w-[150px]">
              {work.title}
            </span>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex items-center gap-1">
            <button
              data-action-button
              onClick={handleEditClick}
              className={`p-1.5 rounded-lg backdrop-blur-sm transition-colors ${
                isEditing
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/20 text-white hover:bg-purple-500/80'
              }`}
              title={isEditing ? '关闭编辑' : '编辑'}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              data-action-button
              onClick={handleDownload}
              className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
              title="下载"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              data-action-button
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
              title="分享"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              data-action-button
              onClick={handleFavorite}
              className={`p-1.5 rounded-lg backdrop-blur-sm transition-colors ${
                isFavorite
                  ? 'bg-red-500/80 text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title={isFavorite ? '取消收藏' : '收藏'}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              data-action-button
              onClick={handleDelete}
              className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-red-500/80 transition-colors"
              title="删除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 选中指示器 */}
      {isSelected && (
        <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* 内联编辑器 - 在图片下方展开 */}
      <AnimatePresence>
        {isEditing && work.imageUrl && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 模式切换标签 */}
            <div className={`flex items-center gap-2 px-3 py-2 border-t ${isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50/50'}`}>
              <button
                onClick={handleOpenQuickEdit}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  editMode === 'quick'
                    ? isDark
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-500 text-white'
                    : isDark
                      ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                快速编辑
              </button>
              <button
                onClick={handleOpenFullEditor}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  editMode === 'full'
                    ? isDark
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-500 text-white'
                    : isDark
                      ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                完整编辑
              </button>
            </div>

            {/* 快速编辑面板 */}
            <AnimatePresence mode="wait">
              {editMode === 'quick' && (
                <motion.div
                  key="quick-edit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <QuickEditPanel
                    imageUrl={work.imageUrl}
                    workId={work.id}
                    onEdit={handleQuickEdit}
                    onOpenFullEditor={handleOpenFullEditor}
                    onAddToChat={handleAddToChat}
                    onReset={handleQuickEditReset}
                    onCancel={handleQuickEditCancel}
                    isProcessing={isQuickEditing}
                  />

                  {/* 快速编辑结果预览 */}
                  <AnimatePresence>
                    {quickEditResult && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                      >
                        {/* 预览头部 */}
                        <div className={`flex items-center justify-between px-3 py-2 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                          <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            编辑结果预览
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditSave(quickEditResult)}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                isDark
                                  ? 'bg-purple-600 hover:bg-purple-500 text-white'
                                  : 'bg-purple-500 hover:bg-purple-600 text-white'
                              }`}
                            >
                              保存为新作品
                            </button>
                            <button
                              onClick={() => setQuickEditResult(null)}
                              className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        {/* 预览图片 */}
                        <div 
                          className="relative w-full" 
                          style={{ height: cardHeight }}
                        >
                          <img
                            src={quickEditResult}
                            alt="编辑预览"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* 完整编辑器 */}
              {editMode === 'full' && (
                <motion.div
                  key="full-edit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <InlineImageEditor
                    imageUrl={work.imageUrl}
                    onChange={handleEditChange}
                    onSave={handleEditSave}
                    onCancel={handleEditCancel}
                  />

                  {/* 实时预览区域 */}
                  <AnimatePresence>
                    {editedImageUrl && showPreview && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                      >
                        {/* 预览头部 */}
                        <div className={`flex items-center justify-between px-3 py-2 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                          <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            修改后预览
                          </span>
                          <button
                            onClick={() => setShowPreview(!showPreview)}
                            className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                          >
                            {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                        
                        {/* 预览图片 */}
                        <div 
                          className="relative w-full" 
                          style={{ height: cardHeight }}
                        >
                          <img
                            src={editedImageUrl}
                            alt="编辑预览"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WorkCard;
