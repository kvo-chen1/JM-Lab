// 案例操作栏组件

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  Heart,
  Share2,
  Play,
  Wand2,
  Loader2,
} from 'lucide-react';

interface CaseActionsProps {
  likes: number;
  isLiked: boolean;
  onLike: () => void;
  onShare: () => void;
  onViewReplay: () => void;
  onCreateSimilar: () => void;
  loading?: boolean;
}

export const CaseActions: React.FC<CaseActionsProps> = ({
  likes,
  isLiked,
  onLike,
  onShare,
  onViewReplay,
  onCreateSimilar,
  loading = false,
}) => {
  const { isDark } = useTheme();
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  const handleLike = () => {
    setIsLikeAnimating(true);
    onLike();
    setTimeout(() => setIsLikeAnimating(false), 300);
  };

  return (
    <div className={`
      flex items-center gap-3
      ${isDark ? 'border-t border-[#2a2f2a]' : 'border-t border-gray-200'}
      pt-4
    `}>
      {/* 点赞按钮 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleLike}
        disabled={loading}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl
          transition-colors
          ${isLiked
            ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
            : isDark
              ? 'bg-[#1a1f1a] text-gray-400 hover:bg-[#2a2f2a]'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
        `}
      >
        <motion.div
          animate={isLikeAnimating ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Heart
            className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
          />
        </motion.div>
        <span className="text-sm font-medium">{likes}</span>
      </motion.button>

      {/* 分享按钮 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onShare}
        disabled={loading}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl
          transition-colors
          ${isDark
            ? 'bg-[#1a1f1a] text-gray-400 hover:bg-[#2a2f2a]'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
        `}
      >
        <Share2 className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">分享</span>
      </motion.button>

      {/* 查看回放按钮 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onViewReplay}
        disabled={loading}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl
          transition-colors
          ${isDark
            ? 'bg-[#1a1f1a] text-gray-400 hover:bg-[#2a2f2a]'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
        `}
      >
        <Play className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">查看回放</span>
      </motion.button>

      {/* 做同款按钮 */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onCreateSimilar}
        disabled={loading}
        className="
          flex-1 flex items-center justify-center gap-2
          px-6 py-2.5 rounded-xl
          bg-gradient-to-r from-[#C02C38] to-[#E85D75]
          text-white font-medium
          shadow-lg shadow-red-500/20
          hover:shadow-xl hover:shadow-red-500/30
          transition-shadow
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>加载中...</span>
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5" />
            <span>做同款</span>
          </>
        )}
      </motion.button>
    </div>
  );
};

export default CaseActions;
