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
  Wand2
} from 'lucide-react';
import { toast } from 'sonner';

export interface WorkCardData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl?: string;
  createdAt: number;
  isFavorite?: boolean;
}

interface WorkCardProps {
  data: WorkCardData;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate?: (id: string, updates: Partial<WorkCardData>) => void;
  onDelete?: (id: string) => void;
  onRefresh?: (id: string) => void;
  onDownload?: (data: WorkCardData) => void;
  className?: string;
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
      <div className={`p-4 space-y-3 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <input
          ref={titleRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full px-3 py-2 text-lg font-semibold rounded-lg border-2 outline-none transition-colors ${
            isDark 
              ? 'bg-gray-900 border-blue-500/50 text-white focus:border-blue-500' 
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
              ? 'bg-gray-900 border-blue-500/50 text-gray-200 focus:border-blue-500' 
              : 'bg-white border-blue-400/50 text-gray-700 focus:border-blue-500'
          }`}
          placeholder="描述..."
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            <X className="w-3 h-3 inline mr-1" />
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
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
  isGenerating = false
}: {
  src: string;
  alt: string;
  className?: string;
  isGenerating?: boolean;
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

  // 如果是生成中状态
  if (isGenerating) {
    return (
      <div className={`flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'} ${className}`}>
        <div className="text-center px-2">
          <Loader2 className="w-6 h-6 mx-auto mb-1 animate-spin text-[#C02C38]" />
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>生成中...</p>
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
    <div className="relative w-full h-full">
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
  onRefresh, 
  onDownload, 
  onDelete,
  isVisible,
  isDark 
}: { 
  onEdit: () => void;
  onRefresh: () => void;
  onDownload: () => void;
  onDelete: () => void;
  isVisible: boolean;
  isDark: boolean;
}) {
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
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className={`p-2 rounded-lg transition-all ${
              isDark 
                ? 'text-gray-300 hover:text-white hover:bg-white/10' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-black/10'
            }`}
            title="编辑"
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
  className = ''
}: WorkCardProps) {
  const { isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  return (
    <motion.div
      ref={cardRef}
      layoutId={data.id}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-300
        ${isDark 
          ? 'bg-gray-800/80 shadow-xl shadow-black/20' 
          : 'bg-white shadow-xl shadow-gray-200/50'
        }
        ${isSelected 
          ? 'ring-2 ring-[#C02C38] ring-offset-2 ring-offset-gray-900' 
          : 'hover:shadow-2xl'
        }
        ${className}
      `}
    >
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
        className="relative aspect-[4/3] overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <ImageWithLoading
          src={data.imageUrl}
          alt={data.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        
        {/* 悬浮操作按钮 */}
        <HoverActions
          onEdit={handleEditStart}
          onRefresh={handleRefresh}
          onDownload={handleDownload}
          onDelete={handleDelete}
          isVisible={isHovered && !isEditing}
          isDark={isDark}
        />

        {/* 选中状态指示器 */}
        {isSelected && (
          <div className="absolute inset-0 ring-2 ring-[#C02C38] ring-inset pointer-events-none" />
        )}
      </div>

      {/* 底部信息栏 */}
      <div className={`px-4 py-2 flex items-center justify-between text-xs ${
        isDark ? 'bg-gray-900/50 text-gray-500' : 'bg-gray-50 text-gray-400'
      }`}>
        <span>{new Date(data.createdAt).toLocaleDateString('zh-CN')}</span>
        {data.isFavorite && (
          <span className="text-[#C02C38]">已收藏</span>
        )}
      </div>
    </motion.div>
  );
}
