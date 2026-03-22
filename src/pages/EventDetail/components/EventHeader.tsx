import { ChevronLeft, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface EventHeaderProps {
  title: string;
  onShare: () => void;
  onBookmark: () => void;
  isBookmarked?: boolean;
}

export function EventHeader({ title, onShare, onBookmark, isBookmarked }: EventHeaderProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-[#0f0f0f]/80 backdrop-blur-md border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 左侧：返回按钮 + 标题 */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">返回</span>
            </motion.button>
            
            <div className="h-6 w-px bg-white/10" />
            
            <h1 className="text-base sm:text-lg font-semibold text-white truncate max-w-[200px] sm:max-w-md">
              {title}
            </h1>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShare}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBookmark}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked 
                  ? 'text-yellow-500 hover:bg-yellow-500/10' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-yellow-500' : ''}`} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
