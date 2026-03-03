/**
 * 动态卡片组件
 * 展示单条动态内容
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import type { FeedItem } from '@/types/feed';
import { VideoPlayer } from './VideoPlayer';
import { ReportModal } from './ReportModal';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
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
  UserX,
  Flag,
} from 'lucide-react';

interface FeedCardProps {
  feed: FeedItem;
  currentUserId?: string;
  onLike: () => void;
  onCollect: () => void;
  onShare: () => void;
  onClick: () => void;
  onFollow: (isFollowing: boolean) => void;
  onComment?: () => void;
  onUnfollow?: () => void;
  isCommentOpen?: boolean;
  onCommentToggle?: () => void;
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
  currentUserId,
  onLike,
  onCollect,
  onShare,
  onClick,
  onFollow,
  onComment,
  onUnfollow,
  isCommentOpen,
  onCommentToggle
}: FeedCardProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(event.target as Node)
      ) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImageLoad = (index: number) => {
    setImageLoaded(prev => ({ ...prev, [index]: true }));
  };

  // 判断是否需要展开/收缩（超过150字符）
  const shouldCollapse = feed.content.length > 150;
  const displayContent = isExpanded ? feed.content : feed.content.slice(0, 150);

  // 处理取消关注
  const handleUnfollow = () => {
    if (onUnfollow) {
      onUnfollow();
      toast.success(`已取消关注 ${feed.author.name}`);
    }
    setShowMoreMenu(false);
  };

  // 处理举报
  const handleReport = () => {
    setShowMoreMenu(false);
    setShowReportModal(true);
  };

  // 处理 @提及点击 - 通过用户名获取用户ID并跳转
  const handleMentionClick = async (e: React.MouseEvent, username: string) => {
    e.stopPropagation();
    try {
      // 先尝试通过用户名查询用户ID
      const { data: userData, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (userData?.id) {
        navigate(`/author/${userData.id}`);
      } else {
        // 如果找不到用户，尝试直接用用户名跳转（可能是ID格式）
        navigate(`/author/${username}`);
      }
    } catch (error) {
      // 查询失败，直接用用户名跳转
      navigate(`/author/${username}`);
    }
  };

  // 渲染带 @提及的内容
  const renderContentWithMentions = (content: string) => {
    // 匹配 @用户名 格式
    const mentionRegex = /@([^\s@]+)/g;
    const parts = content.split(mentionRegex);

    return (
      <>
        {parts.map((part, index) => {
          // 奇数索引是匹配到的用户名
          if (index % 2 === 1) {
            return (
              <span
                key={index}
                onClick={(e) => handleMentionClick(e, part)}
                className={`cursor-pointer hover:underline ${
                  isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                }`}
              >
                @{part}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </>
    );
  };

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

  // 判断是否是纯动态（不是作品）：没有标题、没有媒体，或者 sourceType 不是 work
  const isPureFeed = feed.sourceType !== 'work' || (!feed.title && !feed.media?.length);

  return (
    <>
      <motion.article
        layout
        onClick={isPureFeed ? undefined : onClick}
        className={`rounded-xl overflow-hidden transition-all duration-200 ${
          isPureFeed ? '' : 'cursor-pointer'
        } ${
          isDark
            ? 'bg-gray-900 border border-gray-800 hover:border-gray-700'
            : 'bg-white border border-gray-100 hover:shadow-sm'
        }`}
        whileHover={{ scale: 1.002 }}
      >
        <div className="p-2.5">
          {/* 头部：作者信息 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="relative cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/author/${feed.author.id}`);
                }}
              >
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
                  <h3
                    className={`text-sm font-semibold cursor-pointer hover:underline ${isDark ? 'text-white' : 'text-gray-900'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/author/${feed.author.id}`);
                    }}
                  >
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

            <div className="flex items-center gap-1 relative">
              <button
                ref={moreButtonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoreMenu(!showMoreMenu);
                }}
                className={`p-1.5 rounded-full transition-colors ${
                  isDark
                    ? 'hover:bg-gray-800 text-gray-500'
                    : 'hover:bg-gray-100 text-gray-400'
                } ${showMoreMenu ? (isDark ? 'bg-gray-800' : 'bg-gray-100') : ''}`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* 更多菜单下拉 */}
              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div
                    ref={moreMenuRef}
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 top-full mt-2 w-36 rounded-xl shadow-xl z-20 overflow-hidden ${
                      isDark ? 'bg-[#2a2a3e] border border-gray-700' : 'bg-white border border-gray-200'
                    }`}
                  >
                    {/* 取消关注 - 只显示已关注的用户，且不是自己的动态 */}
                    {currentUserId !== feed.author.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnfollow();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                          isDark
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <UserX className="w-4 h-4" />
                        取消关注
                      </button>
                    )}

                    {/* 举报 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReport();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        isDark
                          ? 'hover:bg-gray-700 text-gray-300'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Flag className="w-4 h-4" />
                      举报
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
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
              {renderContentWithMentions(displayContent)}
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
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/search?query=${encodeURIComponent('#' + tag)}`);
                    }}
                    className={`text-[11px] ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} hover:underline cursor-pointer transition-colors`}
                  >
                    #{tag}
                  </button>
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
                  if (onCommentToggle) {
                    onCommentToggle();
                  } else if (onComment) {
                    onComment();
                  }
                  // 不调用 onClick()，避免跳转页面
                }}
                className={`flex items-center gap-1 transition-colors ${
                  isCommentOpen
                    ? isDark
                      ? 'text-blue-400'
                      : 'text-blue-600'
                    : isDark
                    ? 'text-gray-500 hover:text-blue-400'
                    : 'text-gray-500 hover:text-blue-500'
                }`}
              >
                <MessageCircle className={`w-4 h-4 ${isCommentOpen ? 'fill-current' : ''}`} />
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

      {/* 举报弹窗 */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="feed"
        targetId={feed.id}
        targetAuthorId={feed.author.id}
        targetTitle={feed.title || feed.content.slice(0, 50) + (feed.content.length > 50 ? '...' : '')}
      />
    </>
  );
}
