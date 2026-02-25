import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { Image, Eye, Heart, FileText, Video, FileAudio, MoreHorizontal, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef } from 'react';

interface SharedWorkMessageProps {
  workId: string;
  workTitle: string;
  workThumbnail?: string;
  workUrl?: string;  // 视频/音频播放URL
  workType?: string;
  message?: string;
  senderName?: string;
  isCompact?: boolean;
}

const mediaTypeIcons = {
  image: Image,
  video: Video,
  audio: FileAudio,
  document: FileText,
  other: MoreHorizontal,
};

const mediaTypeLabels = {
  image: '图片作品',
  video: '视频作品',
  audio: '音频作品',
  document: '文档作品',
  other: '其他作品',
};

export function SharedWorkMessage({
  workId,
  workTitle,
  workThumbnail,
  workUrl,
  workType = 'image',
  message,
  senderName,
  isCompact = false,
}: SharedWorkMessageProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const MediaIcon = mediaTypeIcons[workType as keyof typeof mediaTypeIcons] || Image;
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleClick = () => {
    navigate(`/square/${workId}`);
  };

  // 判断是否为视频且有播放URL
  // 如果 workUrl 为空但 workThumbnail 是视频文件，则使用 workThumbnail 作为视频 URL
  const videoUrl = workUrl || (workThumbnail?.match(/\.(mp4|webm|mov|avi|mkv)$/i) ? workThumbnail : undefined);
  const isVideo = workType === 'video' && videoUrl;

  if (isCompact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
          isDark
            ? 'bg-gray-800/80 border border-gray-700 hover:border-gray-600'
            : 'bg-white border border-gray-200 hover:border-gray-300 shadow-sm'
        }`}
      >
        {/* 缩略图/视频 */}
        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
          {isVideo ? (
            <video
              ref={videoRef}
              src={videoUrl}
              muted
              loop
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : workThumbnail ? (
            <img
              src={workThumbnail}
              alt={workTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center ${
                isDark ? 'bg-gray-700' : 'bg-gray-100'
              }`}
            >
              <MediaIcon
                className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
              />
            </div>
          )}
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                workType === 'video'
                  ? 'bg-purple-500/20 text-purple-400'
                  : workType === 'audio'
                  ? 'bg-blue-500/20 text-blue-400'
                  : isDark
                  ? 'bg-gray-700 text-gray-400'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {mediaTypeLabels[workType as keyof typeof mediaTypeLabels]}
            </span>
          </div>
          <h4
            className={`font-medium text-sm truncate mt-1 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            {workTitle}
          </h4>
        </div>

        {/* 跳转图标 */}
        <ExternalLink
          className={`w-4 h-4 flex-shrink-0 ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}
        />
      </motion.div>
    );
  }

  return (
    <div
      className={`rounded-xl overflow-hidden ${
        isDark
          ? 'bg-gray-800/80 border border-gray-700'
          : 'bg-white border border-gray-200 shadow-sm'
      }`}
    >
      {/* 头部：分享标识 */}
      <div
        className={`px-4 py-2 border-b ${
          isDark
            ? 'border-gray-700 bg-gray-800/50'
            : 'border-gray-100 bg-gray-50'
        }`}
      >
        <span
          className={`text-xs ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          📎 {senderName ? `${senderName} 分享了作品` : '分享了作品'}
        </span>
      </div>

      {/* 作品卡片 */}
      <motion.div
        whileHover={{ backgroundColor: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(249, 250, 251, 1)' }}
        className="p-4 cursor-pointer transition-colors"
      >
        <div className="flex gap-4">
          {/* 缩略图/视频播放器 */}
          <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
            {isVideo ? (
              <video
                ref={videoRef}
                src={videoUrl}
                muted
                loop
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                onClick={(e) => e.stopPropagation()}
              />
            ) : workThumbnail ? (
              <img
                src={workThumbnail}
                alt={workTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center ${
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}
              >
                <MediaIcon
                  className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                />
              </div>
            )}
            {/* 类型标签 */}
            <div
              className={`absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[10px] text-center text-white ${
                workType === 'video'
                  ? 'bg-purple-500'
                  : workType === 'audio'
                  ? 'bg-blue-500'
                  : 'bg-gray-800/80'
              }`}
            >
              {mediaTypeLabels[workType as keyof typeof mediaTypeLabels]}
            </div>
          </div>

          {/* 信息 */}
          <div className="flex-1 min-w-0" onClick={handleClick}>
            <h4
              className={`font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {workTitle}
            </h4>
            <p
              className={`text-sm mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {isVideo ? '视频自动播放中，点击查看详情' : '点击查看作品详情'}
            </p>
            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1 text-xs ${
                  isDark
                    ? 'text-red-400 hover:text-red-300'
                    : 'text-red-500 hover:text-red-600'
                }`}
              >
                查看作品
                <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 附言 */}
      {message && (
        <div
          className={`px-4 py-3 border-t ${
            isDark
              ? 'border-gray-700 bg-gray-800/30'
              : 'border-gray-100 bg-gray-50/50'
          }`}
        >
          <p
            className={`text-sm italic ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            💬 "{message}"
          </p>
        </div>
      )}
    </div>
  );
}

export default SharedWorkMessage;
