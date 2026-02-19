import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { 
  Copy, 
  Check, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown, 
  Bookmark,
  Share2,
  MoreHorizontal,
  Quote,
  Trash2
} from 'lucide-react';

interface AIMessageActionsProps {
  content: string;
  onRegenerate?: () => void;
  onQuote?: () => void;
  onDelete?: () => void;
  index?: number;
  className?: string;
}

export const AIMessageActions: React.FC<AIMessageActionsProps> = ({
  content,
  onRegenerate,
  onQuote,
  onDelete,
  index,
  className = ''
}) => {
  const { isDark } = useTheme();
  const [isCopied, setIsCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [reaction, setReaction] = useState<'like' | 'dislike' | null>(null);

  // 复制内容
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  // 收藏/取消收藏
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? '已取消收藏' : '已收藏到灵感库');
    
    // 保存到localStorage
    try {
      const bookmarks = JSON.parse(localStorage.getItem('ai_message_bookmarks') || '[]');
      if (!isBookmarked) {
        bookmarks.push({
          id: Date.now(),
          content,
          timestamp: Date.now(),
          tags: []
        });
      } else {
        const idx = bookmarks.findIndex((b: any) => b.content === content);
        if (idx > -1) bookmarks.splice(idx, 1);
      }
      localStorage.setItem('ai_message_bookmarks', JSON.stringify(bookmarks));
    } catch {
      // 忽略存储错误
    }
  };

  // 分享内容
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: '津小脉的回复',
          text: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
        });
      } else {
        await navigator.clipboard.writeText(content);
        toast.success('内容已复制，可以粘贴分享');
      }
    } catch {
      // 用户取消分享
    }
  };

  // 快速反馈
  const handleQuickFeedback = (type: 'like' | 'dislike') => {
    setReaction(type);
    toast.success(type === 'like' ? '感谢你的认可！' : '我会继续改进的');
  };

  // 提取代码块
  const extractCodeBlocks = () => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks: { language: string; code: string }[] = [];
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        code: match[2].trim()
      });
    }
    return blocks;
  };

  const codeBlocks = extractCodeBlocks();

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* 主要操作按钮 */}
      <div className="flex items-center gap-1">
        {/* 复制按钮 */}
        <motion.button
          onClick={handleCopy}
          className={`p-1.5 rounded-lg transition-all ${
            isCopied 
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
              : isDark 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={isCopied ? '已复制' : '复制内容'}
        >
          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </motion.button>

        {/* 引用按钮 */}
        {onQuote && (
          <motion.button
            onClick={onQuote}
            className={`p-1.5 rounded-lg transition-all ${
              isDark 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="引用回复"
          >
            <Quote className="w-3.5 h-3.5" />
          </motion.button>
        )}

        {/* 重新生成按钮 */}
        {onRegenerate && (
          <motion.button
            onClick={onRegenerate}
            className={`p-1.5 rounded-lg transition-all ${
              isDark 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="重新生成"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </motion.button>
        )}

        {/* 分隔线 */}
        <div className={`w-px h-4 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

        {/* 点赞 */}
        <motion.button
          onClick={() => handleQuickFeedback('like')}
          className={`p-1.5 rounded-lg transition-all ${
            reaction === 'like'
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : isDark 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="有用"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </motion.button>

        {/* 点踩 */}
        <motion.button
          onClick={() => handleQuickFeedback('dislike')}
          className={`p-1.5 rounded-lg transition-all ${
            reaction === 'dislike'
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              : isDark 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="需要改进"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </motion.button>

        {/* 分隔线 */}
        <div className={`w-px h-4 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

        {/* 收藏 */}
        <motion.button
          onClick={handleBookmark}
          className={`p-1.5 rounded-lg transition-all ${
            isBookmarked
              ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
              : isDark 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={isBookmarked ? '已收藏' : '收藏'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
        </motion.button>

        {/* 分享 */}
        <motion.button
          onClick={handleShare}
          className={`p-1.5 rounded-lg transition-all ${
            isDark 
              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="分享"
        >
          <Share2 className="w-3.5 h-3.5" />
        </motion.button>

        {/* 更多操作 */}
        <div className="relative">
          <motion.button
            onClick={() => setShowMore(!showMore)}
            className={`p-1.5 rounded-lg transition-all ${
              showMore
                ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                : isDark 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="更多"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </motion.button>

          {/* 更多操作菜单 */}
          <AnimatePresence>
            {showMore && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className={`absolute bottom-full left-0 mb-2 w-48 rounded-xl shadow-xl border overflow-hidden z-50 ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                {codeBlocks.length > 0 && (
                  <>
                    <div className={`px-3 py-2 text-xs font-medium ${
                      isDark ? 'text-gray-400 bg-gray-800/50' : 'text-gray-500 bg-gray-50'
                    }`}>
                      代码块 ({codeBlocks.length})
                    </div>
                    {codeBlocks.map((block, idx) => (
                      <button
                        key={idx}
                        onClick={async () => {
                          await navigator.clipboard.writeText(block.code);
                          toast.success(`已复制 ${block.language} 代码`);
                          setShowMore(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          isDark 
                            ? 'text-gray-300 hover:bg-gray-700' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <code className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700">
                            {block.language}
                          </code>
                          <span className="truncate">复制代码块 {idx + 1}</span>
                        </span>
                      </button>
                    ))}
                    <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />
                  </>
                )}
                <button
                  onClick={() => {
                    const blob = new Blob([content], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `message-${Date.now()}.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success('已下载为 Markdown');
                    setShowMore(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    isDark 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  下载为 Markdown
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `message-${Date.now()}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success('已下载为文本');
                    setShowMore(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    isDark 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  下载为文本
                </button>
                {onDelete && (
                  <>
                    <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />
                    <button
                      onClick={() => {
                        onDelete();
                        setShowMore(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                        isDark 
                          ? 'text-red-400 hover:bg-red-900/30' 
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      删除消息
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AIMessageActions;
