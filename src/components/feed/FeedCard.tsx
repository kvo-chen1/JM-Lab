/**
 * 动态卡片组件
 * 展示单条动态内容
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import type { FeedItem } from '@/types/feed';
import { VideoPlayer } from './VideoPlayer';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  MapPin,
  Verified,
  BadgeCheck,
  Award,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface FeedCardProps {
  feed: FeedItem;
  onLike: () => void;
  onCollect: () => void;
  onShare: () => void;
  onClick: () => void;
  onFollow: (isFollowing: boolean) => void;
  onComment?: () => void;
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

// 格式化时间
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// 获取认证图标
function getVerifiedIcon(type?: string) {
  switch (type) {
    case 'personal':
      return <BadgeCheck className="w-4 h-4 text-blue-500" />;
    case 'brand':
      return <Verified className="w-4 h-4 text-yellow-500" />;
    case 'official':
      return <Award className="w-4 h-4 text-red-500" />;
    default:
      return null;
  }
}

export function FeedCard({
  feed,
  onLike,
  onCollect,
  onShare,
  onClick,
  onFollow,
  onComment
}: FeedCardProps) {
  const { isDark } = useTheme();
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleImageLoad = (index: number) => {
    setImageLoaded(prev => ({ ...prev, [index]: true }));
  };

  // 判断是否需要展开/收缩（超过150字符）
  const shouldCollapse = feed.content.length > 150;
  const displayContent = isExpanded ? feed.content : feed.content.slice(0, 150);

  // 渲染媒体网格
  const renderMediaGrid = () => {
    if (!feed.media || feed.media.length === 0) return null;

    const mediaCount = feed.media.length;

    // 单个视频时使用视频播放器
    if (mediaCount === 1 && feed.media[0].type === 'video') {
      const media = feed.media[0];
      return (
        <div className="mt-1.5">
          <VideoPlayer
            src={media.url}
            thumbnailUrl={media.thumbnailUrl}
            duration={media.duration}
            className="aspect-video max-h-[200px]"
          />
        </div>
      );
    }

    return (
      <div className={`mt-1.5 grid gap-1 ${
        mediaCount === 1 ? 'grid-cols-1' :
        mediaCount === 2 ? 'grid-cols-2' :
        mediaCount <= 4 ? 'grid-cols-2' :
        'grid-cols-3'
      }`}>
        {feed.media.map((media, index) => (
          <div
            key={media.id}
            className={`relative overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800 ${
              mediaCount === 1 ? 'aspect-video max-h-[200px]' : 'aspect-square'
            }`}
          >
            {!imageLoaded[index] && (
              <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
            )}
            <img
              src={media.url}
              alt={`图片 ${index + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onLoad={() => handleImageLoad(index)}
            />
          </div>
        ))}
      </div>
    );
  };

  // 渲染分享目标
  const renderShareTarget = () => {
    if (!feed.shareTarget) return null;

    return (
      <div 
        className={`mt-3 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors ${
          isDark 
            ? 'bg-gray-800 hover:bg-gray-750' 
            : 'bg-gray-50 hover:bg-gray-100'
        }`}
      >
        {feed.shareTarget.thumbnailUrl && (
          <img
            src={feed.shareTarget.thumbnailUrl}
            alt={feed.shareTarget.title}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            {feed.shareTarget.title}
          </h4>
          {feed.shareTarget.description && (
            <p className={`text-sm truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {feed.shareTarget.description}
            </p>
          )}
        </div>
        <ExternalLink className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      </div>
    );
  };

  return (
    <motion.article
      layout
      className={`rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
        isDark
          ? 'bg-gray-900 border border-gray-800 hover:border-gray-700'
          : 'bg-white border border-gray-100 hover:shadow-sm'
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.002 }}
      whileTap={{ scale: 0.998 }}
    >
      <div className="p-2.5">
        {/* 头部：作者信息 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <img
                src={feed.author.avatar}
                alt={feed.author.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              {feed.author.verified && (
                <div className="absolute -bottom-0.5 -right-0.5">
                  {getVerifiedIcon(feed.author.verifiedType)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {feed.author.name}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                  {formatTime(feed.createdAt)}
                </span>
                {feed.location && (
                  <>
                    <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>·</span>
                    <span className={`flex items-center gap-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      <MapPin className="w-2.5 h-2.5" />
                      {feed.location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* 关注按钮 */}
            {feed.author.type !== 'official' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFollow(!!feed.author.isFollowing);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  feed.author.isFollowing
                    ? isDark
                      ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    : 'bg-[#00aeec] hover:bg-[#0095cc] text-white'
                }`}
              >
                {feed.author.isFollowing ? '已关注' : '关注'}
              </button>
            )}
            <button
              onClick={(e) => e.stopPropagation()}
              className={`p-1.5 rounded-full transition-colors ${
                isDark
                  ? 'hover:bg-gray-800 text-gray-500'
                  : 'hover:bg-gray-100 text-gray-400'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="mt-2">
          {/* 标题 */}
          {feed.title && (
            <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {feed.title}
            </h4>
          )}
          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {displayContent}
            {shouldCollapse && !isExpanded && '...'}
          </p>

          {/* 展开/收缩按钮 */}
          {shouldCollapse && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className={`mt-1.5 flex items-center gap-1 text-xs font-medium transition-colors ${
                isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
              }`}
            >
              {isExpanded ? (
                <>
                  收起
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  展开
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}

          {/* 话题标签 */}
          {feed.tags && feed.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {feed.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`text-[11px] ${isDark ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
                  onClick={(e) => e.stopPropagation()}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 媒体内容 */}
        {renderMediaGrid()}

        {/* 分享目标 */}
        {renderShareTarget()}

        {/* 底部：互动按钮 */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            {/* 点赞 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className={`flex items-center gap-1 transition-colors ${
                feed.isLiked
                  ? 'text-pink-500'
                  : isDark
                  ? 'text-gray-500 hover:text-pink-400'
                  : 'text-gray-500 hover:text-pink-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${feed.isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs">{formatNumber(feed.likes)}</span>
            </button>

            {/* 评论 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onComment) {
                  onComment();
                } else {
                  onClick();
                }
              }}
              className={`flex items-center gap-1 transition-colors ${
                isDark
                  ? 'text-gray-500 hover:text-blue-400'
                  : 'text-gray-500 hover:text-blue-500'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{formatNumber(feed.comments)}</span>
            </button>

            {/* 分享 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className={`flex items-center gap-1 transition-colors ${
                isDark
                  ? 'text-gray-500 hover:text-green-400'
                  : 'text-gray-500 hover:text-green-500'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs">{formatNumber(feed.shares)}</span>
            </button>
          </div>

          {/* 收藏 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCollect();
            }}
            className={`transition-colors ${
              feed.isCollected
                ? 'text-yellow-500'
                : isDark
                ? 'text-gray-500 hover:text-yellow-400'
                : 'text-gray-500 hover:text-yellow-500'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${feed.isCollected ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
