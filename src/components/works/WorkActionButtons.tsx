import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Heart, ThumbsUp, Share2, Check } from 'lucide-react';
import { useState, useContext } from 'react';
import { ShareSelector } from '@/components/ShareSelector';
import { AuthContext } from '@/contexts/authContext';

interface WorkActionButtonsProps {
  voteCount: number;
  likeCount: number;
  hasVoted: boolean;
  hasLiked: boolean;
  onVote: () => void;
  onLike: () => void;
  onShare?: () => void;
  vertical?: boolean;
  size?: 'sm' | 'md' | 'lg';
  // 分享相关属性
  shareData?: {
    type: 'work' | 'activity' | 'post';
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    url: string;
  };
}

const buttonSizes = {
  sm: {
    button: 'px-3 py-1.5 text-xs',
    icon: 'w-3.5 h-3.5',
  },
  md: {
    button: 'px-4 py-2 text-sm',
    icon: 'w-4 h-4',
  },
  lg: {
    button: 'px-6 py-3 text-base',
    icon: 'w-5 h-5',
  },
};

export function WorkActionButtons({
  voteCount,
  likeCount,
  hasVoted,
  hasLiked,
  onVote,
  onLike,
  onShare,
  vertical = false,
  size = 'md',
  shareData,
}: WorkActionButtonsProps) {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const [showVoteAnimation, setShowVoteAnimation] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleVote = () => {
    onVote();
    if (!hasVoted) {
      setShowVoteAnimation(true);
      setTimeout(() => setShowVoteAnimation(false), 1000);
    }
  };

  const handleLike = () => {
    onLike();
    if (!hasLiked) {
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 1000);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else if (shareData) {
      setIsShareModalOpen(true);
    }
  };

  const containerClass = vertical
    ? 'flex flex-col gap-3'
    : 'flex items-center gap-3';

  return (
    <div className={containerClass}>
      {/* 投票按钮 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleVote}
        className={`
          relative flex items-center gap-2 rounded-xl font-medium transition-all duration-300
          ${buttonSizes[size].button}
          ${hasVoted
            ? isDark
              ? 'bg-primary-600 text-white'
              : 'bg-primary-500 text-white'
            : isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
      >
        <AnimatePresence>
          {showVoteAnimation && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0, y: -20 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <ThumbsUp className="text-primary-500" />
            </motion.div>
          )}
        </AnimatePresence>

        {hasVoted ? (
          <Check className={buttonSizes[size].icon} />
        ) : (
          <ThumbsUp className={buttonSizes[size].icon} />
        )}
        <span>
          {hasVoted ? '已投票' : '投票'}
          {voteCount > 0 && ` (${voteCount})`}
        </span>
      </motion.button>

      {/* 点赞按钮 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleLike}
        className={`
          relative flex items-center gap-2 rounded-xl font-medium transition-all duration-300
          ${buttonSizes[size].button}
          ${hasLiked
            ? 'bg-red-500 text-white'
            : isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
      >
        <AnimatePresence>
          {showLikeAnimation && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0, y: -30 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className="text-red-500 fill-current" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          animate={hasLiked ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Heart
            className={`${buttonSizes[size].icon} ${hasLiked ? 'fill-current' : ''}`}
          />
        </motion.div>
        <span>
          {hasLiked ? '已点赞' : '点赞'}
          {likeCount > 0 && ` (${likeCount})`}
        </span>
      </motion.button>

      {/* 分享按钮 */}
      {(onShare || shareData) && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          className={`
            flex items-center gap-2 rounded-xl font-medium transition-all duration-300
            ${buttonSizes[size].button}
            ${isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          <Share2 className={buttonSizes[size].icon} />
          <span>分享</span>
        </motion.button>
      )}
    </div>

    {/* 分享弹窗 */}
    {shareData && (
      <ShareSelector
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareData={shareData}
        userId={user?.id || ''}
        userName={user?.username || user?.name || ''}
        userAvatar={user?.avatar}
      />
    )}
  );
}

// 紧凑版本（用于卡片）
export function CompactActionButtons({
  voteCount,
  likeCount,
  hasVoted,
  hasLiked,
  onVote,
  onLike,
}: Omit<WorkActionButtonsProps, 'vertical' | 'size' | 'onShare'>) {
  const { isDark } = useTheme();

  return (
    <div className="flex items-center gap-2">
      {/* 投票 */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onVote}
        className={`
          flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors
          ${hasVoted
            ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/30'
            : isDark
              ? 'text-gray-400 hover:text-gray-300'
              : 'text-gray-500 hover:text-gray-700'
          }
        `}
      >
        <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-current' : ''}`} />
        <span>{voteCount}</span>
      </motion.button>

      {/* 点赞 */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onLike}
        className={`
          flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors
          ${hasLiked
            ? 'text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-900/30'
            : isDark
              ? 'text-gray-400 hover:text-gray-300'
              : 'text-gray-500 hover:text-gray-700'
          }
        `}
      >
        <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
        <span>{likeCount}</span>
      </motion.button>
    </div>
  );
}

export default WorkActionButtons;
