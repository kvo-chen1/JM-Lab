import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Image as ImageIcon, Video, Download, Share2, Upload } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';

interface GenerationTask {
  id: string;
  type: 'image' | 'video' | 'text';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  params: { prompt: string };
  result?: {
    urls: string[];
    revisedPrompt?: string;
  };
  error?: string;
}

interface InlineGenerationCardProps {
  task: GenerationTask;
  onSave?: () => void;
  onPublish?: () => void;
  onShare?: () => void;
  onShareToFriend?: () => void;
}

export const InlineGenerationCard: React.FC<InlineGenerationCardProps> = ({
  task,
  onSave,
  onPublish,
  onShare,
  onShareToFriend,
}) => {
  const { isDark } = useTheme();
  const [mediaError, setMediaError] = useState(false);

  // 获取媒体URL
  const mediaUrl = task.result?.urls?.[0];
  const isVideo = task.type === 'video';

  console.log('[InlineGenerationCard] task.status:', task.status, 'mediaUrl:', mediaUrl, 'isVideo:', isVideo);

  // 生成中状态
  if (task.status === 'pending' || task.status === 'processing') {
    return (
      <div className={`p-6 rounded-2xl max-w-full ${isDark ? 'bg-gray-800/80' : 'bg-white'} shadow-lg`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.div
              className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'
              }`}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-7 h-7 text-indigo-500" />
            </motion.div>
          </div>
          <div className="flex-1">
            <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              正在生成{task.type === 'image' ? '图片' : '视频'}
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {task.params.prompt}
            </p>
          </div>
          <div className="text-lg font-bold text-indigo-500">{Math.round(task.progress)}%</div>
        </div>
        <div className={`mt-4 h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${task.progress}%` }}
          />
        </div>
      </div>
    );
  }

  // 失败状态
  if (task.status === 'failed') {
    return (
      <div className={`p-6 rounded-2xl max-w-full ${isDark ? 'bg-red-900/20' : 'bg-red-50'} shadow-lg`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
            <ImageIcon className="w-7 h-7 text-red-500" />
          </div>
          <div className="flex-1">
            <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>生成失败</h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {task.error || '请重试'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 完成状态
  return (
    <div className={`p-4 rounded-2xl max-w-full ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
      {/* 媒体显示 */}
      <div className="relative rounded-xl overflow-hidden mb-4 group max-w-full">
        {mediaUrl && !mediaError ? (
          isVideo ? (
            <video
              src={mediaUrl}
              controls
              className="w-full max-h-96"
              onError={() => {
                console.error('[InlineGenerationCard] 视频加载失败:', mediaUrl);
                setMediaError(true);
              }}
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Generated"
              className="w-full max-h-96 object-contain"
              onError={() => {
                console.error('[InlineGenerationCard] 图片加载失败:', mediaUrl);
                setMediaError(true);
              }}
            />
          )
        ) : (
          <div className={`w-full h-64 flex flex-col items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl`}>
            {isVideo ? (
              <Video className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'} mb-2`} />
            ) : (
              <ImageIcon className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'} mb-2`} />
            )}
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {mediaError ? (isVideo ? '视频加载失败' : '图片加载失败') : (isVideo ? '无视频' : '无图片')}
            </span>
            {mediaUrl && (
              <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 mt-1 hover:underline">
                点击打开原{isVideo ? '视频' : '图'}
              </a>
            )}
          </div>
        )}

        {/* 悬浮下载按钮 */}
        {mediaUrl && (
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                const link = document.createElement('a');
                link.href = mediaUrl;
                link.download = `generated-${Date.now()}.${isVideo ? 'mp4' : 'png'}`;
                link.click();
                toast.success('下载成功');
              }}
              className="p-2 rounded-lg bg-black/50 text-white backdrop-blur-sm"
            >
              <Download className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPublish}
          className="flex-1 py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
        >
          <Upload className="w-4 h-4" />
          发布
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onShare}
          className={`flex-1 py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Share2 className="w-4 h-4" />
          分享
        </motion.button>
      </div>
    </div>
  );
};

export default InlineGenerationCard;
