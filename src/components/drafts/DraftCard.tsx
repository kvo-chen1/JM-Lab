import { motion } from 'framer-motion';
import {
  LayoutGrid,
  Search,
  Box,
  Grid3X3,
  FileText,
  Clock,
  Calendar,
  Download,
  Trash2,
  Star
} from 'lucide-react';
import { useState } from 'react';

interface DraftCardProps {
  id: string;
  name?: string;
  title?: string;
  prompt?: string;
  content?: string;
  thumbnail?: string | null;
  videoUrl?: string | null;
  type?: 'image' | 'video';
  toolType?: 'layout' | 'trace' | 'mockup' | 'tile' | 'aiWriter';
  templateName?: string;
  updatedAt: number;
  isFavorite?: boolean;
  isDark: boolean;
  viewMode: 'grid' | 'list';
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onExport?: (e: React.MouseEvent) => void;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

const toolTypeConfig = {
  layout: { name: '版式设计', icon: LayoutGrid, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
  trace: { name: '文化溯源', icon: Search, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
  mockup: { name: '模型预览', icon: Box, color: 'from-cyan-500 to-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', iconColor: 'text-cyan-600 dark:text-cyan-400' },
  tile: { name: '图案平铺', icon: Grid3X3, color: 'from-pink-500 to-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/30', iconColor: 'text-pink-600 dark:text-pink-400' },
  aiWriter: { name: 'AI写作', icon: FileText, color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' }
};

// 视频预览组件 - 自动播放
interface VideoPreviewProps {
  videoUrl: string;
  thumbnail?: string | null;
}

function VideoPreview({ videoUrl, thumbnail }: VideoPreviewProps) {
  return (
    <div className="relative w-full h-full">
      <video
        src={videoUrl}
        poster={thumbnail || undefined}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
      />
      
      {/* 视频标签 */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-white backdrop-blur-md bg-purple-500/80">
          <i className="fas fa-video w-3 h-3"></i>
          视频
        </span>
      </div>
    </div>
  );
}

// 小尺寸视频预览组件（用于列表视图）
function VideoPreviewSmall({ videoUrl, thumbnail }: VideoPreviewProps) {
  return (
    <div className="relative w-full h-full">
      <video
        src={videoUrl}
        poster={thumbnail || undefined}
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
      />
      {/* 视频标签 */}
      <div className="absolute bottom-0.5 right-0.5 z-10 pointer-events-none">
        <span className="flex items-center px-1 py-0.5 rounded text-[8px] font-medium text-white bg-purple-500/80">
          <i className="fas fa-video mr-0.5"></i>
          视频
        </span>
      </div>
    </div>
  );
}

export default function DraftCard({
  name,
  title,
  prompt,
  content,
  thumbnail,
  videoUrl,
  type,
  toolType = 'layout',
  templateName,
  updatedAt,
  isFavorite = false,
  isDark,
  viewMode,
  onClick,
  onDelete,
  onExport,
  onToggleFavorite
}: DraftCardProps) {
  const [showActions, setShowActions] = useState(false);
  const config = toolTypeConfig[toolType] || toolTypeConfig.layout;
  const Icon = config.icon;
  const isVideo = type === 'video' || !!videoUrl;

  const displayTitle = name || title || '未命名草稿';
  const displayContent = prompt || content || '无内容...';
  const plainTextContent = typeof displayContent === 'string'
    ? displayContent.replace(/<[^>]*>/g, '').substring(0, 100)
    : displayContent;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={onClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        className={`group flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
          isDark
            ? 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
        }`}
        whileHover={{ y: -2 }}
      >
        {/* 缩略图/图标 */}
        <div 
          className={`w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden ${config.bgColor} flex items-center justify-center relative`}
        >
          {isVideo ? (
            <VideoPreviewSmall 
              videoUrl={videoUrl!}
              thumbnail={thumbnail}
            />
          ) : thumbnail ? (
            <img src={thumbnail} alt={displayTitle} className="w-full h-full object-cover" />
          ) : (
            <Icon className={`w-7 h-7 ${config.iconColor}`} />
          )}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-500 transition-colors">
              {displayTitle}
            </h3>
            {isFavorite && (
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {plainTextContent}
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bgColor} ${config.iconColor}`}>
              <Icon className="w-3 h-3" />
              {templateName || config.name}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(updatedAt)}
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showActions ? 1 : 0 }}
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite
                  ? 'text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400' : ''}`} />
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onClick}
      className={`group relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 ${
        isDark
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xl'
      }`}
      whileHover={{ y: -4 }}
    >
      {/* 缩略图区域 */}
      <div 
        className={`relative aspect-video w-full overflow-hidden ${config.bgColor}`}
      >
        {isVideo ? (
          // 视频预览 - 使用ref直接控制播放
          <VideoPreview 
            videoUrl={videoUrl!}
            thumbnail={thumbnail}
          />
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={displayTitle}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Icon className={`w-12 h-12 ${config.iconColor} mb-2`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{config.name}</span>
          </div>
        )}

        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* 悬浮操作按钮 */}
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(e);
              }}
              className={`p-2 rounded-lg backdrop-blur-md transition-colors ${
                isFavorite
                  ? 'bg-yellow-400/90 text-white'
                  : 'bg-white/90 text-gray-600 hover:text-yellow-500'
              }`}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(e);
            }}
            className="p-2 rounded-lg bg-white/90 text-gray-600 hover:text-red-500 backdrop-blur-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* 类型标签 */}
        <div className="absolute bottom-3 left-3">
          <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-white backdrop-blur-md bg-black/50`}>
            <Icon className="w-3 h-3" />
            {config.name}
          </span>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-primary-500 transition-colors">
          {displayTitle}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 h-10">
          {plainTextContent}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(updatedAt)}
          </span>
          {onExport && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExport(e);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              导出
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
