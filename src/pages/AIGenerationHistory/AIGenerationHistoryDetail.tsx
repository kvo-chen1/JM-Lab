import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import { AIGenerationHistoryItem, AIGenerationType, AIGenerationStatus } from '@/types/aiGenerationHistory';

interface AIGenerationHistoryDetailProps {
  item: AIGenerationHistoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReuse: (item: AIGenerationHistoryItem) => void;
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  onDelete: (id: string, e?: React.MouseEvent) => void;
}

export default function AIGenerationHistoryDetail({
  item,
  open,
  onOpenChange,
  onReuse,
  onToggleFavorite,
  onDelete,
}: AIGenerationHistoryDetailProps) {
  const { isDark } = useTheme();
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowFullPrompt(false);
      setCopied(false);
    }
  }, [open]);

  if (!item) return null;

  const getTypeIcon = (type: AIGenerationType) => {
    switch (type) {
      case 'image': return 'fa-image';
      case 'video': return 'fa-video';
      case 'text': return 'fa-file-alt';
    }
  };

  const getTypeColor = (type: AIGenerationType) => {
    switch (type) {
      case 'image': return isDark ? 'text-purple-400 bg-purple-500/20' : 'text-purple-600 bg-purple-100';
      case 'video': return isDark ? 'text-cyan-400 bg-cyan-500/20' : 'text-cyan-600 bg-cyan-100';
      case 'text': return isDark ? 'text-amber-400 bg-amber-500/20' : 'text-amber-600 bg-amber-100';
    }
  };

  const getStatusColor = (status: AIGenerationStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-gray-400';
    }
  };

  const getStatusText = (status: AIGenerationStatus) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'processing': return '处理中';
      case 'failed': return '失败';
      case 'pending': return '待处理';
      case 'cancelled': return '已取消';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(item.prompt);
      setCopied(true);
      toast.success('提示词已复制');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  const handleCopyResultUrl = async () => {
    if (!item.resultUrl) return;
    try {
      await navigator.clipboard.writeText(item.resultUrl);
      toast.success('结果链接已复制');
    } catch {
      toast.error('复制失败');
    }
  };

  const handleDownload = async () => {
    if (!item.resultUrl) return;
    try {
      const response = await fetch(item.resultUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-${item.type}-${item.id}.${item.type === 'video' ? 'mp4' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('下载成功');
    } catch {
      toast.error('下载失败');
    }
  };

  const truncatePrompt = (prompt: string, maxLength: number = 200) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + '...';
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[90vh] z-50 overflow-hidden rounded-2xl ${
              isDark ? 'bg-[#1E293B]' : 'bg-white'
            } shadow-2xl`}
          >
            <div className={`flex flex-col h-full ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getTypeColor(item.type)}`}>
                    <i className={`fas ${getTypeIcon(item.type)} mr-1.5`}></i>
                    {item.type === 'image' ? '图片生成' : item.type === 'video' ? '视频生成' : '文本生成'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${getStatusColor(item.status)}`}>
                    {getStatusText(item.status)}
                  </span>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {item.thumbnailUrl && (
                  <div className="relative rounded-xl overflow-hidden bg-gray-200">
                    {item.type === 'video' ? (
                      <video
                        src={item.resultUrl || item.thumbnailUrl}
                        className="w-full max-h-64 object-contain"
                        controls
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={item.resultUrl || item.thumbnailUrl}
                        alt={item.prompt}
                        className="w-full max-h-64 object-contain"
                      />
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      提示词
                    </h3>
                    <button
                      onClick={handleCopyPrompt}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        copied
                          ? 'bg-green-500/20 text-green-500'
                          : isDark ? 'bg-gray-700 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                      {copied ? '已复制' : '复制'}
                    </button>
                  </div>
                  <div className={`p-3 rounded-xl text-sm leading-relaxed ${
                    isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'
                  }`}>
                    {showFullPrompt ? item.prompt : truncatePrompt(item.prompt)}
                    {item.prompt.length > 200 && (
                      <button
                        onClick={() => setShowFullPrompt(!showFullPrompt)}
                        className={`ml-2 text-blue-500 hover:text-blue-600`}
                      >
                        {showFullPrompt ? '收起' : '展开'}
                      </button>
                    )}
                  </div>
                </div>

                {item.negativePrompt && (
                  <div>
                    <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      负面提示词
                    </h3>
                    <div className={`p-3 rounded-xl text-sm ${
                      isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'
                    }`}>
                      {item.negativePrompt}
                    </div>
                  </div>
                )}

                {item.metadata && Object.keys(item.metadata).length > 0 && (
                  <div>
                    <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      生成参数
                    </h3>
                    <div className={`grid grid-cols-2 gap-2 p-3 rounded-xl text-sm ${
                      isDark ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      {item.metadata.size && (
                        <div className="flex items-center justify-between">
                          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>尺寸</span>
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.metadata.size}</span>
                        </div>
                      )}
                      {item.metadata.quality && (
                        <div className="flex items-center justify-between">
                          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>质量</span>
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.metadata.quality}</span>
                        </div>
                      )}
                      {item.metadata.style && (
                        <div className="flex items-center justify-between">
                          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>风格</span>
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.metadata.style}</span>
                        </div>
                      )}
                      {item.metadata.duration && (
                        <div className="flex items-center justify-between">
                          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>时长</span>
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.metadata.duration}秒</span>
                        </div>
                      )}
                      {item.metadata.resolution && (
                        <div className="flex items-center justify-between">
                          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>分辨率</span>
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.metadata.resolution}</span>
                        </div>
                      )}
                      {item.metadata.seed && (
                        <div className="flex items-center justify-between">
                          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>种子</span>
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.metadata.seed}</span>
                        </div>
                      )}
                      {item.metadata.revisedPrompt && (
                        <div className="col-span-2">
                          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>优化后提示词</span>
                          <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {item.metadata.revisedPrompt}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {item.tags.length > 0 && (
                  <div>
                    <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      标签
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map(tag => (
                        <span
                          key={tag}
                          className={`px-3 py-1 rounded-full text-sm ${
                            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`grid grid-cols-2 gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div>
                    <span className="block text-xs mb-1">创建时间</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs mb-1">更新时间</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      {formatDate(item.updatedAt)}
                    </span>
                  </div>
                </div>

                {item.source && (
                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    来源: {item.source}
                  </div>
                )}
              </div>

              <div className={`flex items-center gap-2 p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={(e) => {
                    onToggleFavorite(item.id, e);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                    item.isFavorite
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <i className={`fas fa-star`}></i>
                  {item.isFavorite ? '已收藏' : '收藏'}
                </button>
                <button
                  onClick={() => {
                    onReuse(item);
                    onOpenChange(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all"
                >
                  <i className="fas fa-redo"></i>
                  一键复用
                </button>
                {item.resultUrl && (
                  <>
                    <button
                      onClick={handleCopyResultUrl}
                      className={`p-2.5 rounded-xl transition-colors ${
                        isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title="复制链接"
                    >
                      <i className="fas fa-link"></i>
                    </button>
                    <button
                      onClick={handleDownload}
                      className={`p-2.5 rounded-xl transition-colors ${
                        isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title="下载"
                    >
                      <i className="fas fa-download"></i>
                    </button>
                  </>
                )}
                <button
                  onClick={(e) => {
                    onDelete(item.id, e);
                    onOpenChange(false);
                  }}
                  className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                  title="删除"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
