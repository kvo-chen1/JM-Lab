import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Link } from 'react-router-dom';
import {
  CollectionCardProps,
  CollectionType,
  ViewMode,
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
  MoreHorizontal,
} from 'lucide-react';
import { useState } from 'react';

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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes === 0 ? '刚刚' : `${minutes}分钟前`;
    }
    return `${hours}小时前`;
  }
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export function CollectionCard({
  item,
  viewMode,
  onToggleBookmark,
  onToggleLike,
  isLoading,
}: CollectionCardProps) {
  const { isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isBookmarkAnimating, setIsBookmarkAnimating] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  const typeInfo = typeConfig[item.type];
  const TypeIcon = typeInfo.icon;

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
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -8, transition: { duration: 0.2 } }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={`group relative rounded-2xl overflow-hidden ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-lg hover:shadow-2xl transition-shadow duration-300`}
      >
        <Link to={item.link} className="block">
          {/* 图片区域 */}
          <div className="relative aspect-[4/3] overflow-hidden">
            {!imageLoaded && (
              <div className={`absolute inset-0 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} />
            )}
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

            {/* 类型标签 */}
            <div
              className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1.5 ${typeInfo.bgColor}`}
            >
              <TypeIcon className="w-3 h-3" />
              {typeInfo.label}
            </div>

            {/* 悬停遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
            />

            {/* 操作按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
              className="absolute top-3 right-3 flex gap-2"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleToggleBookmark}
                className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${
                  item.isBookmarked
                    ? 'bg-red-500 text-white'
                    : 'bg-white/90 text-gray-700 hover:bg-white'
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${isBookmarkAnimating ? 'animate-bounce' : ''}`}
                  fill={item.isBookmarked ? 'currentColor' : 'none'}
                />
              </motion.button>
            </motion.div>
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
                <img
                  src={item.author.avatar}
                  alt={item.author.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span
                  className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
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
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {formatDate(item.createdAt)}
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // 列表视图
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      whileHover={{ x: 4 }}
      className={`group flex gap-4 p-4 rounded-2xl ${
        isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
      } shadow-md hover:shadow-lg transition-all duration-200`}
    >
      {/* 缩略图 */}
      <Link to={item.link} className="flex-shrink-0">
        <div className="relative w-32 h-24 rounded-xl overflow-hidden">
          {!imageLoaded && (
            <div className={`absolute inset-0 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} />
          )}
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
                <img
                  src={item.author.avatar}
                  alt={item.author.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatDate(item.createdAt)}
          </span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex-shrink-0 flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleBookmark}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            item.isBookmarked
              ? 'bg-red-500 text-white'
              : isDark
                ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <Bookmark
            className="w-4 h-4"
            fill={item.isBookmarked ? 'currentColor' : 'none'}
          />
        </motion.button>
      </div>
    </motion.div>
  );
}
