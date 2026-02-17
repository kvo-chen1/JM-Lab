import { useTheme } from '@/hooks/useTheme';
import { Link } from 'react-router-dom';
import {
  CollectionCardProps,
  CollectionType,
  ViewMode,
  TabType,
} from '../types/collection';
import {
  Bookmark,
  Heart,
  Eye,
  MessageCircle,
  Image,
  MessageSquare,
  Calendar,
  Layers,
  Video,
  FileAudio,
  FileText,
  MoreHorizontal,
} from 'lucide-react';
import { useState, useRef, useCallback } from 'react';

const typeConfig = {
  [CollectionType.SQUARE_WORK]: {
    icon: Image,
    label: '广场作品',
    color: '#ef4444',
    bgColor: 'bg-red-500',
  },
  [CollectionType.COMMUNITY_POST]: {
    icon: MessageSquare,
    label: '社区帖子',
    color: '#8b5cf6',
    bgColor: 'bg-purple-500',
  },
  [CollectionType.ACTIVITY]: {
    icon: Calendar,
    label: '活动',
    color: '#f59e0b',
    bgColor: 'bg-amber-500',
  },
  [CollectionType.TEMPLATE]: {
    icon: Layers,
    label: '模板',
    color: '#10b981',
    bgColor: 'bg-emerald-500',
  },
};

const mediaTypeIcons = {
  image: Image,
  video: Video,
  audio: FileAudio,
  document: FileText,
  other: MoreHorizontal,
};

const mediaTypeLabels = {
  image: '图片',
  video: '视频',
  audio: '音频',
  document: '文档',
  other: '其他',
};

const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null) {
    return '0';
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

export function CollectionCard({
  item,
  viewMode,
  onToggleBookmark,
  onToggleLike,
  isLoading,
  activeTab = TabType.BOOKMARKS,
}: CollectionCardProps) {
  const { isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isBookmarkAnimating, setIsBookmarkAnimating] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoError, setIsVideoError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleAvatarError = useCallback(() => {
    setAvatarError(true);
  }, []);

  const typeInfo = typeConfig[item.type];
  const TypeIcon = typeInfo.icon;
  const MediaIcon = mediaTypeIcons[item.mediaType || 'image'] || Image;

  // 判断是否是视频
  const isVideo = item.mediaType === 'video' ||
    (item.thumbnail && (item.thumbnail.endsWith('.mp4') || item.thumbnail.endsWith('.webm') || item.thumbnail.endsWith('.mov')));

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookmarkAnimating(true);
    await onToggleBookmark(item.id, item.type);
    setTimeout(() => setIsBookmarkAnimating(false), 300);
  };

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLikeAnimating(true);
    await onToggleLike(item.id, item.type);
    setTimeout(() => setIsLikeAnimating(false), 300);
  };

  // 网格视图
  if (viewMode === ViewMode.GRID) {
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative rounded-2xl overflow-hidden ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-lg hover:shadow-2xl transition-shadow duration-300`}
      >
        <Link to={item.link} className="block">
          {/* 图片/视频区域 */}
          <div className="relative aspect-[4/3] overflow-hidden">
            {!imageLoaded && !isVideo && (
              <div className={`absolute inset-0 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} />
            )}

            {isVideo ? (
              // 视频类型
              <>
                <video
                  ref={videoRef}
                  src={item.thumbnail}
                  className={`w-full h-full object-cover transition-transform duration-500 ${
                    isHovered ? 'scale-110' : 'scale-100'
                  }`}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                  onLoadedData={() => setIsVideoLoaded(true)}
                  onError={() => setIsVideoError(true)}
                />
                {!isVideoLoaded && !isVideoError && (
                  <div className={`absolute inset-0 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} />
                )}
                {isVideoError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MediaIcon className={`w-16 h-16 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                  </div>
                )}
              </>
            ) : (
              // 图片类型
              <img
                src={item.thumbnail}
                alt={item.title}
                loading="lazy"
                decoding="async"
                onLoad={() => setImageLoaded(true)}
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  isHovered ? 'scale-110' : 'scale-100'
                } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            )}

            {/* 类型标签 */}
            <div
              className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1.5 ${typeInfo.bgColor}`}
            >
              <TypeIcon className="w-3 h-3" />
              {typeInfo.label}
            </div>

            {/* 媒体类型标签 */}
            <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm ${
              isDark ? 'bg-gray-900/70 text-gray-200' : 'bg-white/70 text-gray-700'
            }`}>
              {mediaTypeLabels[item.mediaType || 'image']}
            </div>

            {/* 悬停遮罩 */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-200 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* 操作按钮 - 根据标签页显示取消收藏或取消点赞 */}
            <div
              className={`absolute top-3 right-3 flex gap-2 transition-all duration-200 z-10 ${
                isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              {activeTab === TabType.BOOKMARKS ? (
                <button
                  onClick={handleToggleBookmark}
                  title="取消收藏"
                  className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors hover:scale-110 active:scale-95 bg-red-500 text-white hover:bg-red-600 shadow-lg`}
                >
                  <Bookmark
                    className={`w-4 h-4 ${isBookmarkAnimating ? 'animate-bounce' : ''}`}
                    fill="currentColor"
                  />
                </button>
              ) : (
                <button
                  onClick={handleToggleLike}
                  title="取消点赞"
                  className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors hover:scale-110 active:scale-95 bg-pink-500 text-white hover:bg-pink-600 shadow-lg`}
                >
                  <Heart
                    className={`w-4 h-4 ${isLikeAnimating ? 'animate-bounce' : ''}`}
                    fill="currentColor"
                  />
                </button>
              )}
            </div>
          </div>

          {/* 内容区域 */}
          <div className="p-4">
            {/* 标题 */}
            <h3
              className={`font-semibold text-base line-clamp-2 mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {item.title}
            </h3>

            {/* 描述 */}
            {item.description && (
              <p
                className={`text-sm line-clamp-2 mb-3 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {item.description}
              </p>
            )}

            {/* 作者信息 */}
            {item.author && (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                  {!avatarError ? (
                    <img
                      src={item.author.avatar}
                      alt={item.author.name || '作者头像'}
                      className="w-full h-full object-cover"
                      onError={handleAvatarError}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">
                      {item.author.name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {item.author.name}
                </span>
              </div>
            )}

            {/* 统计信息 */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Eye className="w-3.5 h-3.5" />
                  {formatNumber(item.stats.views)}
                </span>
                <button
                  onClick={handleToggleLike}
                  className={`flex items-center gap-1 text-xs transition-colors ${
                    item.isLiked
                      ? 'text-pink-500'
                      : 'text-gray-500 dark:text-gray-400 hover:text-pink-500'
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${isLikeAnimating ? 'animate-ping' : ''}`}
                    fill={item.isLiked ? 'currentColor' : 'none'}
                  />
                  {formatNumber(item.stats.likes)}
                </button>
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {formatNumber(item.stats.comments)}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // 列表视图
  return (
    <div
      className={`group flex gap-4 p-4 rounded-2xl ${
        isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
      } shadow-md hover:shadow-lg transition-all duration-200`}
    >
      {/* 缩略图 */}
      <Link to={item.link} className="flex-shrink-0">
        <div className="relative w-32 h-24 rounded-xl overflow-hidden">
          {!imageLoaded && !isVideo && (
            <div className={`absolute inset-0 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} />
          )}

          {isVideo ? (
            // 视频类型
            <>
              <video
                ref={videoRef}
                src={item.thumbnail}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
                onLoadedData={() => setIsVideoLoaded(true)}
                onError={() => setIsVideoError(true)}
              />
              {!isVideoLoaded && !isVideoError && (
                <div className={`absolute inset-0 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} />
              )}
              {isVideoError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <MediaIcon className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                </div>
              )}
            </>
          ) : (
            // 图片类型
            <img
              src={item.thumbnail}
              alt={item.title}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
          <div
            className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium text-white ${typeInfo.bgColor}`}
          >
            {typeInfo.label}
          </div>
        </div>
      </Link>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <Link to={item.link}>
          <h3
            className={`font-semibold text-base line-clamp-1 mb-1 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            {item.title}
          </h3>
        </Link>

        {item.description && (
          <p
            className={`text-sm line-clamp-1 mb-2 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {item.description}
          </p>
        )}

        {/* 作者和统计 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {item.author && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                  {!avatarError ? (
                    <img
                      src={item.author.avatar}
                      alt={item.author.name || '作者头像'}
                      className="w-full h-full object-cover"
                      onError={handleAvatarError}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">
                      {item.author.name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <span className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {item.author.name}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Eye className="w-3.5 h-3.5" />
                {formatNumber(item.stats.views)}
              </span>
              <button
                onClick={handleToggleLike}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  item.isLiked ? 'text-pink-500' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <Heart className="w-3.5 h-3.5" fill={item.isLiked ? 'currentColor' : 'none'} />
                {formatNumber(item.stats.likes)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮 - 根据标签页显示取消收藏或取消点赞 */}
      <div className="flex-shrink-0 flex flex-col gap-2">
        {activeTab === TabType.BOOKMARKS ? (
          <button
            onClick={handleToggleBookmark}
            title="取消收藏"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:scale-110 active:scale-95 bg-red-500 text-white hover:bg-red-600"
          >
            <Bookmark
              className="w-4 h-4"
              fill="currentColor"
            />
          </button>
        ) : (
          <button
            onClick={handleToggleLike}
            title="取消点赞"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:scale-110 active:scale-95 bg-pink-500 text-white hover:bg-pink-600"
          >
            <Heart
              className="w-4 h-4"
              fill="currentColor"
            />
          </button>
        )}
      </div>
    </div>
  );
}
