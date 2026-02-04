import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';

interface AIResult {
  id: string;
  type: 'text' | 'image' | 'video';
  content: string;
  prompt: string;
  tags: string[];
  timestamp: number;
  status: 'generating' | 'completed' | 'failed';
}

interface AIResultManagerProps {
  results: AIResult[];
  onApply?: (result: AIResult) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const AIResultManager = memo(function AIResultManager({
  results,
  onApply,
  onDelete,
  className = ''
}: AIResultManagerProps) {
  const { isDark } = useTheme();

  const handleCopyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      toast.error('复制失败，请手动复制');
    }
  };

  const handleOpenContent = (content: string) => {
    if (content.startsWith('http')) {
      window.open(content, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-white">生成结果 ({results.length})</h3>
            <button
              onClick={() => results.forEach(result => onDelete?.(result.id))}
              className="text-xs text-white/60 hover:text-red-400 transition-colors"
            >
              清空所有
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`relative rounded-xl overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'} bg-opacity-80 backdrop-blur-sm ${isDark ? 'bg-gray-800/80' : 'bg-white/80'}`}
              >
                {/* 结果内容 */}
                <div className="p-4 space-y-3">
                  {/* 状态指示器 */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${result.status === 'generating'
                      ? 'bg-yellow-400/20 text-yellow-300'
                      : result.status === 'completed'
                      ? 'bg-green-400/20 text-green-300'
                      : 'bg-red-400/20 text-red-300'
                    }`}>
                      {result.status === 'generating' ? '生成中...' : result.status === 'completed' ? '已完成' : '失败'}
                  </span>
                  <span className="text-xs text-white/50">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {/* 内容预览 */}
                <div className="space-y-2">
                  {result.type === 'image' && (
                    <div className="aspect-video rounded-lg overflow-hidden border border-gray-600/50">
                      {result.status === 'completed' ? (
                        <img
                          src={result.content}
                          alt="生成的图像"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/400x225?text=图像加载失败';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-700/50">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/30"></div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {result.type === 'text' && (
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                      <p className="text-sm text-white/80 line-clamp-3">{result.content}</p>
                    </div>
                  )}
                  
                  {result.type === 'video' && (
                    <div className="aspect-video rounded-lg overflow-hidden border border-gray-600/50">
                      {result.status === 'completed' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-700/50">
                          <button
                            onClick={() => handleOpenContent(result.content)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/30 text-blue-300 hover:bg-blue-500/50 transition-colors"
                          >
                            <i className="fas fa-play"></i>
                            <span>播放视频</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-700/50">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/30"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* 标签和操作 */}
                <div className="p-4 border-t border-gray-700/50 space-y-3">
                  {/* 标签 */}
                  {result.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {result.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-300 border border-blue-400/30"
                        >
                          {tag}
                        </span>
                      ))}
                      {result.tags.length > 3 && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full bg-gray-400/20 text-gray-300 border border-gray-400/30"
                        >
                          +{result.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between gap-2">
                    {result.status === 'completed' && onApply && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onApply(result)}
                        className="flex-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-500/30 to-pink-500/30 hover:from-purple-500/50 hover:to-pink-500/50 text-white border border-purple-500/30 transition-all"
                      >
                        应用结果
                      </motion.button>
                    )}
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleCopyContent(result.content)}
                      className="p-2 rounded-lg text-white/60 hover:bg-white/10 transition-colors"
                      aria-label="复制内容"
                    >
                      <i className="fas fa-copy"></i>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onDelete?.(result.id)}
                      className="p-2 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      aria-label="删除结果"
                    >
                      <i className="fas fa-trash"></i>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <i className="fas fa-magic text-2xl text-white/50"></i>
          </div>
          <h4 className="text-base font-medium text-white/70 mb-2">暂无生成结果</h4>
          <p className="text-sm text-white/50">
            输入创意提示并点击「灵感」按钮开始生成
          </p>
        </motion.div>
      )}
    </div>
  );
});

export default AIResultManager;
